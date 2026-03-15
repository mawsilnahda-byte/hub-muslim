import { createClient } from '@/lib/supabase/server'

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

export async function getSurahs(): Promise<Surah[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('surahs')
    .select('*')
    .order('id')
  
  if (error) throw error
  return data || []
}

export async function getSurah(id: number): Promise<Surah | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('surahs')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data
}

export async function getAyahs(
  surahId: number,
  translatorSlug?: string,
  locale: string = 'fr'
): Promise<AyahWithTranslation[]> {
  const supabase = await createClient()
  
  // Get ayahs
  const { data: ayahs, error: ayahError } = await supabase
    .from('ayahs')
    .select('*')
    .eq('surah_id', surahId)
    .order('ayah_number')
  
  if (ayahError) throw ayahError
  if (!ayahs?.length) return []
  
  // Get translations if requested
  if (translatorSlug) {
    const { data: translator } = await supabase
      .from('translators')
      .select('id')
      .eq('slug', translatorSlug)
      .single()
    
    if (translator) {
      const { data: translations } = await supabase
        .from('translations')
        .select('ayah_id, text')
        .eq('translator_id', translator.id)
        .in('ayah_id', ayahs.map(a => a.id))
      
      const translationMap = new Map(
        (translations || []).map(t => [t.ayah_id, t.text])
      )
      
      return ayahs.map(ayah => ({
        ...ayah,
        translation: translationMap.get(ayah.id),
      }))
    }
  }
  
  // Default: get by language
  const { data: translator } = await supabase
    .from('translators')
    .select('id')
    .eq('language_code', locale)
    .eq('is_default', true)
    .single()
  
  if (translator) {
    const { data: translations } = await supabase
      .from('translations')
      .select('ayah_id, text')
      .eq('translator_id', translator.id)
      .in('ayah_id', ayahs.map(a => a.id))
    
    const translationMap = new Map(
      (translations || []).map(t => [t.ayah_id, t.text])
    )
    
    return ayahs.map(ayah => ({
      ...ayah,
      translation: translationMap.get(ayah.id),
    }))
  }
  
  return ayahs
}

export async function searchQuran(
  query: string,
  locale: string = 'fr',
  limit: number = 20
) {
  const supabase = await createClient()
  
  const { data: translator } = await supabase
    .from('translators')
    .select('id')
    .eq('language_code', locale)
    .eq('is_default', true)
    .single()
  
  if (!translator) return []
  
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
    .eq('translator_id', translator.id)
    .textSearch('text', query, { type: 'websearch', config: 'simple' })
    .limit(limit)
  
  if (error) {
    // Fallback to ILIKE
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
      .eq('translator_id', translator.id)
      .ilike('text', `%${query}%`)
      .limit(limit)
    
    return fallback || []
  }
  
  return data || []
}
