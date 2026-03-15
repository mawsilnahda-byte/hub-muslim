import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SurahList } from '@/components/quran/surah-list'
import { SurahListSkeleton } from '@/components/quran/surah-list-skeleton'
import { getSurahs } from '@/lib/api/quran'
import Link from 'next/link'

interface QuranPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: QuranPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'quran' })
  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

export default async function QuranPage({ params }: QuranPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'quran' })
  
  const surahs = await getSurahs().catch(() => [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="arabic-text text-5xl text-primary mb-2">القرآن الكريم</h1>
        <h2 className="text-2xl font-bold mb-1">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Search bar */}
      <div className="mb-8 max-w-xl mx-auto">
        <Link href={`/${locale}/quran/search`}>
          <div className="relative cursor-pointer">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-9 pointer-events-none bg-muted/50"
              readOnly
            />
          </div>
        </Link>
      </div>

      {/* Surah list */}
      {surahs.length > 0 ? (
        <SurahList surahs={surahs} locale={locale} />
      ) : (
        <SurahListSkeleton />
      )}
    </div>
  )
}
