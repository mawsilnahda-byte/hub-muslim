'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import type { Surah } from '@/lib/api/quran'

interface SurahListProps {
  surahs: Surah[]
  locale: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function SurahList({ surahs, locale }: SurahListProps) {
  const t = useTranslations('quran')

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {surahs.map((surah) => (
        <motion.div key={surah.id} variants={item}>
          <Link
            href={`/${locale}/quran/${surah.id}`}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5"
          >
            {/* Number */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {surah.id}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">
                  {surah.name_transliteration}
                </p>
                <span className="arabic-text text-lg text-primary shrink-0" style={{ fontSize: '1.1rem' }}>
                  {surah.name_arabic}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {locale === 'fr' ? surah.name_fr : surah.name_en}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {t('ayahCount', { count: surah.ayah_count })}
                </span>
              </div>
            </div>

            {/* Type badge */}
            <Badge
              variant="outline"
              className="shrink-0 text-xs hidden sm:inline-flex"
            >
              {surah.revelation_type === 'Meccan' ? t('meccan') : t('medinan')}
            </Badge>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
