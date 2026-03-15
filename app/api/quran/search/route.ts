import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const locale = searchParams.get('locale') || 'fr'
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()

  try {
    // Get default translator for locale
    const { data: translator } = await supabase
      .from('translators')
      .select('id')
      .eq('language_code', locale)
      .eq('is_default', true)
      .single()

    if (!translator) {
      return NextResponse.json({ results: [] })
    }

    // Try full-text search first, fallback to ILIKE
    let { data: results, error } = await supabase
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
      .textSearch('text', query.trim(), { type: 'websearch', config: 'simple' })
      .limit(limit)

    if (error || !results?.length) {
      // Fallback ILIKE
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
        .ilike('text', `%${query.trim()}%`)
        .limit(limit)

      results = fallback || []
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
