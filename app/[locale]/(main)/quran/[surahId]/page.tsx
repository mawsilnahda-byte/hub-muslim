import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getSurah, getAyahs } from '@/lib/api/quran'
import { SurahReader } from '@/components/quran/surah-reader'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('.supabase.co') && !url.includes('your-project')
}

interface SurahPageProps {
  params: Promise<{ locale: string; surahId: string }>
  searchParams: Promise<{ translator?: string; ayah?: string }>
}

export async function generateMetadata({ params }: SurahPageProps) {
  const { locale, surahId } = await params
  const surah = await getSurah(parseInt(surahId))
  if (!surah) return {}
  
  return {
    title: `${surah.name_transliteration} — Sourate ${surah.id}`,
    description: `Lisez la sourate ${surah.name_transliteration} (${surah.ayah_count} ayahs)`,
  }
}

export default async function SurahPage({ params, searchParams }: SurahPageProps) {
  const { locale, surahId } = await params
  const { translator, ayah: initialAyah } = await searchParams
  
  const id = parseInt(surahId)
  if (isNaN(id) || id < 1 || id > 114) notFound()

  const [surah, ayahs] = await Promise.all([
    getSurah(id),
    getAyahs(id, translator, locale),
  ])

  if (!surah) notFound()

  let userId: string | undefined
  let userPrefs = {
    fontSize: 'large',
    showTranslation: true,
    bookmarks: [] as string[],
    progress: 0,
  }
  
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
      
      if (user) {
        const [{ data: profile }, { data: bookmarks }, { data: progress }] = await Promise.all([
          supabase.from('users').select('arabic_font_size, show_translation').eq('id', user.id).single(),
          supabase.from('bookmarks').select('ayah_id').eq('user_id', user.id).eq('surah_id', id),
          supabase.from('reading_progress').select('last_ayah_number').eq('user_id', user.id).eq('surah_id', id).single(),
        ])
        
        const profileData = profile as any
        if (profileData) {
          userPrefs.fontSize = profileData.arabic_font_size
          userPrefs.showTranslation = profileData.show_translation
        }
        if (bookmarks) {
          userPrefs.bookmarks = (bookmarks as any[]).map((b: any) => b.ayah_id)
        }
        if (progress) {
          userPrefs.progress = (progress as any)?.last_ayah_number || 0
        }
      }
    } catch {
      // Supabase not available, continue without user data
    }
  }

  return (
    <SurahReader
      surah={surah}
      ayahs={ayahs}
      locale={locale}
      userId={userId}
      initialAyah={initialAyah ? parseInt(initialAyah) : undefined}
      initialFontSize={userPrefs.fontSize}
      initialShowTranslation={userPrefs.showTranslation}
      initialBookmarks={userPrefs.bookmarks}
      prevSurahId={id > 1 ? id - 1 : undefined}
      nextSurahId={id < 114 ? id + 1 : undefined}
    />
  )
}
