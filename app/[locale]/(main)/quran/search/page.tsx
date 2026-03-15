'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Search, ArrowLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'

interface SearchResult {
  text: string
  ayah: {
    id: string
    surah_id: number
    ayah_number: number
    text_uthmani: string
    surah: {
      name_transliteration: string
      name_arabic: string
    }
  }
}

export default function SearchPage() {
  const t = useTranslations('quran')
  const { locale } = useParams<{ locale: string }>()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSearch = async (q: string) => {
    if (!q.trim() || q.length < 3) return
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quran/search?q=${encodeURIComponent(q)}&locale=${locale}`)
        const data = await res.json()
        setResults(data.results || [])
        setSearched(true)
      } catch {
        setResults([])
        setSearched(true)
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/quran`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={t('searchPlaceholder')}
          className="pl-9 h-12 text-base"
          autoFocus
        />
        <Button
          onClick={() => handleSearch(query)}
          disabled={!query.trim() || isPending}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9"
        >
          {t('search')}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {results.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{t('noResults')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('searchResults', { query })} — {results.length} résultats
                </p>
                {results.map((result, i) => (
                  <motion.div
                    key={result.ayah.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/${locale}/quran/${result.ayah.surah_id}?ayah=${result.ayah.ayah_number}`}
                      className="block rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <span className="text-sm font-medium text-primary">
                            {result.ayah.surah.name_transliteration}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            — Ayah {result.ayah.ayah_number}
                          </span>
                        </div>
                        <span className="arabic-text text-lg text-muted-foreground shrink-0">
                          {result.ayah.surah.name_arabic}
                        </span>
                      </div>
                      <p className="arabic-text text-xl text-right" dir="rtl">
                        {result.ayah.text_uthmani}
                      </p>
                      {result.text && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {result.text}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
