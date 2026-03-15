-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Public read access (Quran data)
CREATE POLICY "surahs_public_read" ON public.surahs FOR SELECT USING (true);
CREATE POLICY "ayahs_public_read" ON public.ayahs FOR SELECT USING (true);
CREATE POLICY "translations_public_read" ON public.translations FOR SELECT USING (true);
CREATE POLICY "translators_public_read" ON public.translators FOR SELECT USING (true);
CREATE POLICY "reciters_public_read" ON public.reciters FOR SELECT USING (true);
CREATE POLICY "feature_flags_public_read" ON public.feature_flags FOR SELECT USING (true);

-- Users can only see and edit their own profile
CREATE POLICY "users_own_read" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_own_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Bookmarks: users manage their own
CREATE POLICY "bookmarks_own_select" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_own_insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_own_update" ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_own_delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Reading progress: users manage their own
CREATE POLICY "reading_progress_own_select" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reading_progress_own_insert" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_progress_own_update" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);

-- Reading streaks: users manage their own
CREATE POLICY "reading_streaks_own_select" ON public.reading_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reading_streaks_own_insert" ON public.reading_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_streaks_own_update" ON public.reading_streaks FOR UPDATE USING (auth.uid() = user_id);
