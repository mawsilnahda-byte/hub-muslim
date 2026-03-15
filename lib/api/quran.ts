import { createClient } from '@/lib/supabase/server'
import { fetchSurahsFromAPI, fetchAyahsFromAPI } from './quran-fallback'
import type { Database } from '@/types/supabase'

export interface Surah {
  id: number
  name_arabic: string
  name_transliteration: string
  name_en: string
  name_fr: string
  revelation_type: string
  ayah_count: number
  juz_start: number
  page_start: number
}

export interface Ayah {
  id: string
  surah_id: number
  ayah_number: number
  ayah_number_global: number
  text_uthmani: string
  juz: number
  page: number
}

export interface AyahWithTranslation extends Ayah {
  translation?: string
}

type SurahRow = Database['public']['Tables']['surahs']['Row']
type AyahRow = Database['public']['Tables']['ayahs']['Row']
type TranslationRow = Database['public']['Tables']['translations']['Row']
type TranslatorRow = Database['public']['Tables']['translators']['Row']

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('.supabase.co') && !url.includes('your-project')
}

export async function getSurahs(): Promise<Surah[]> {
  if (!isSupabaseConfigured()) {
    return fetchSurahsFromAPI()
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('surahs')
      .select('*')
      .order('id')
    
    if (error || !data?.length) return fetchSurahsFromAPI()
    return (data as SurahRow[]).map((row) => ({
      id: row.id,
      name_arabic: row.name_arabic,
      name_transliteration: row.name_transliteration,
      name_en: row.name_en,
      name_fr: row.name_fr,
      revelation_type: row.revelation_type,
      ayah_count: row.ayah_count,
      juz_start: row.juz_start,
      page_start: row.page_start,
    }))
  } catch {
    return fetchSurahsFromAPI()
  }
}

export async function getSurah(id: number): Promise<Surah | null> {
  const surahs = await getSurahs()
  return surahs.find(s => s.id === id) || null
}

export async function getAyahs(
  surahId: number,
  translatorSlug?: string,
  locale: string = 'fr'
): Promise<AyahWithTranslation[]> {
  if (!isSupabaseConfigured()) {
    return fetchAyahsFromAPI(surahId, locale)
  }

  try {
    const supabase = await createClient()
    
    const { data: ayahs, error: ayahError } = await supabase
      .from('ayahs')
      .select('*')
      .eq('surah_id', surahId)
      .order('ayah_number')
    
    if (ayahError || !ayahs?.length) {
      return fetchAyahsFromAPI(surahId, locale)
    }
    
    const ayahRows = ayahs as AyahRow[]

    // Get translations
    let translatorId: string | null = null
    
    if (translatorSlug) {
      const { data: translator } = await supabase
        .from('translators')
        .select('id')
        .eq('slug', translatorSlug)
        .single()
      translatorId = (translator as Pick<TranslatorRow, 'id'> | null)?.id ?? null
    }
    
    if (!translatorId) {
      const { data: translator } = await supabase
        .from('translators')
        .select('id')
        .eq('language_code', locale)
        .eq('is_default', true)
        .single()
      translatorId = (translator as Pick<TranslatorRow, 'id'> | null)?.id ?? null
    }
    
    if (translatorId) {
      const { data: translations } = await supabase
        .from('translations')
        .select('ayah_id, text')
        .eq('translator_id', translatorId)
        .in('ayah_id', ayahRows.map((a) => a.id))
      
      const translationMap = new Map(
        ((translations as Pick<TranslationRow, 'ayah_id' | 'text'>[] | null) ?? []).map((t) => [t.ayah_id, t.text])
      )
      
      return ayahRows.map((ayah) => ({
        id: ayah.id,
        surah_id: ayah.surah_id,
        ayah_number: ayah.ayah_number,
        ayah_number_global: ayah.ayah_number_global,
        text_uthmani: ayah.text_uthmani,
        juz: ayah.juz,
        page: ayah.page,
        translation: translationMap.get(ayah.id),
      }))
    }
    
    return ayahRows.map((ayah) => ({
      id: ayah.id,
      surah_id: ayah.surah_id,
      ayah_number: ayah.ayah_number,
      ayah_number_global: ayah.ayah_number_global,
      text_uthmani: ayah.text_uthmani,
      juz: ayah.juz,
      page: ayah.page,
    }))
  } catch {
    return fetchAyahsFromAPI(surahId, locale)
  }
}

export async function searchQuran(
  query: string,
  locale: string = 'fr',
  limit: number = 20
) {
  if (!isSupabaseConfigured()) {
    const { searchQuranAPI } = await import('./quran-fallback')
    return searchQuranAPI(query, locale, limit)
  }

  try {
    const supabase = await createClient()

    const { data: translator } = await supabase
      .from('translators')
      .select('id')
      .eq('language_code', locale)
      .eq('is_default', true)
      .single()
    
    const translatorId = (translator as Pick<TranslatorRow, 'id'> | null)?.id
    if (!translatorId) {
      const { searchQuranAPI } = await import('./quran-fallback')
      return searchQuranAPI(query, locale, limit)
    }

    const { data, error } = await supabase
      .from('translations')
      .select(`
        text,
        ayah:ayahs(
          id,
          surah_id,
          ayah_number,
          ayah_number_global,
          text_uthmani,
          surah:surahs(name_transliteration, name_arabic)
        )
      `)
      .eq('translator_id', translatorId)
      .textSearch('text', query, { type: 'websearch', config: 'simple' })
      .limit(limit)

    if (error || !data?.length) {
      const { data: fallback } = await supabase
        .from('translations')
        .select(`
          text,
          ayah:ayahs(
            id,
            surah_id,
            ayah_number,
            ayah_number_global,
            text_uthmani,
            surah:surahs(name_transliteration, name_arabic)
          )
        `)
        .eq('translator_id', translatorId)
        .ilike('text', `%${query}%`)
        .limit(limit)
      
      return fallback || []
    }

    return data || []
  } catch {
    const { searchQuranAPI } = await import('./quran-fallback')
    return searchQuranAPI(query, locale, limit)
  }
}
