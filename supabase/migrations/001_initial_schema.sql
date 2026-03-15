-- Hub Muslim - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- Users profile (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_locale TEXT DEFAULT 'fr' CHECK (preferred_locale IN ('fr', 'en')),
  preferred_reciter_slug TEXT DEFAULT 'mishary-alafasy',
  arabic_font_size TEXT DEFAULT 'large' CHECK (arabic_font_size IN ('small', 'medium', 'large', 'xlarge')),
  show_translation BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surahs (114)
CREATE TABLE IF NOT EXISTS public.surahs (
  id INTEGER PRIMARY KEY, -- 1-114
  name_arabic TEXT NOT NULL,
  name_transliteration TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  revelation_type TEXT NOT NULL CHECK (revelation_type IN ('Meccan', 'Medinan')),
  ayah_count INTEGER NOT NULL,
  juz_start INTEGER NOT NULL,
  page_start INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ayahs (6236)
CREATE TABLE IF NOT EXISTS public.ayahs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surah_id INTEGER NOT NULL REFERENCES public.surahs(id),
  ayah_number INTEGER NOT NULL, -- within surah
  ayah_number_global INTEGER NOT NULL UNIQUE, -- 1-6236
  text_uthmani TEXT NOT NULL,
  juz INTEGER NOT NULL,
  hizb INTEGER,
  page INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(surah_id, ayah_number)
);

-- Translators
CREATE TABLE IF NOT EXISTS public.translators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  language_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ayah_id UUID NOT NULL REFERENCES public.ayahs(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.translators(id),
  language_code TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ayah_id, translator_id)
);

-- Reciters
CREATE TABLE IF NOT EXISTS public.reciters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  audio_base_url TEXT NOT NULL, -- base URL for audio files
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ayah_id UUID NOT NULL REFERENCES public.ayahs(id) ON DELETE CASCADE,
  surah_id INTEGER NOT NULL REFERENCES public.surahs(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ayah_id)
);

-- Reading progress (per surah)
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  surah_id INTEGER NOT NULL REFERENCES public.surahs(id),
  last_ayah_id UUID REFERENCES public.ayahs(id),
  last_ayah_number INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_id)
);

-- Reading streaks
CREATE TABLE IF NOT EXISTS public.reading_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_ayahs_read INTEGER DEFAULT 0,
  last_read_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ayahs_surah_id ON public.ayahs(surah_id);
CREATE INDEX IF NOT EXISTS idx_ayahs_global_number ON public.ayahs(ayah_number_global);
CREATE INDEX IF NOT EXISTS idx_translations_ayah_id ON public.translations(ayah_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON public.translations(language_code);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);

-- Full-text search index on translations
CREATE INDEX IF NOT EXISTS idx_translations_text_search 
  ON public.translations USING gin(to_tsvector('simple', text));
CREATE INDEX IF NOT EXISTS idx_ayahs_text_search 
  ON public.ayahs USING gin(to_tsvector('arabic', text_uthmani));

-- Trigger to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.reading_streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update reading streak
CREATE OR REPLACE FUNCTION public.update_reading_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_streak RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT * INTO v_streak FROM public.reading_streaks WHERE user_id = p_user_id;
  
  IF v_streak IS NULL THEN
    INSERT INTO public.reading_streaks (user_id, current_streak, last_read_date)
    VALUES (p_user_id, 1, v_today);
  ELSIF v_streak.last_read_date = v_today THEN
    -- Already read today, just increment total
    UPDATE public.reading_streaks
    SET total_ayahs_read = total_ayahs_read + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF v_streak.last_read_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE public.reading_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        total_ayahs_read = total_ayahs_read + 1,
        last_read_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken
    UPDATE public.reading_streaks
    SET current_streak = 1,
        total_ayahs_read = total_ayahs_read + 1,
        last_read_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default feature flags
INSERT INTO public.feature_flags (key, is_enabled, description) VALUES
  ('module_quran', true, 'Module Coran'),
  ('module_prayer_times', false, 'Module Horaires de prière (phase 2)'),
  ('module_zakat', false, 'Module Zakat (phase 2)'),
  ('audio_player', true, 'Lecteur audio'),
  ('bookmarks', true, 'Favoris'),
  ('reading_streak', true, 'Série de lecture'),
  ('immersive_mode', true, 'Mode immersif'),
  ('search', true, 'Recherche Coran')
ON CONFLICT (key) DO NOTHING;

-- Default reciters
INSERT INTO public.reciters (slug, name, audio_base_url) VALUES
  ('mishary-alafasy', 'Mishary Rashid Alafasy', 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/'),
  ('abdurrahman-as-sudais', 'Abdul Rahman Al-Sudais', 'https://cdn.islamic.network/quran/audio/128/ar.abdurrahmanas-sudais/'),
  ('abu-bakr-al-shatri', 'Abu Bakr Al-Shatri', 'https://cdn.islamic.network/quran/audio/128/ar.shaatree/')
ON CONFLICT (slug) DO NOTHING;

-- Default translators
INSERT INTO public.translators (slug, name, language_code, is_default) VALUES
  ('saheeh-international', 'Saheeh International', 'en', true),
  ('hamidullah', 'Muhammad Hamidullah', 'fr', true)
ON CONFLICT (slug) DO NOTHING;
