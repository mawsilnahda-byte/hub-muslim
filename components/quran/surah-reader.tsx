'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Settings,
  Maximize2,
  Minimize2,
  Languages,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AyahCard } from './ayah-card'
import { ReciterSelector } from './reciter-selector'
import { useAudio } from '@/components/providers/audio-provider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { Surah, AyahWithTranslation } from '@/lib/api/quran'

interface SurahReaderProps {
  surah: Surah
  ayahs: AyahWithTranslation[]
  locale: string
  userId?: string
  initialAyah?: number
  initialFontSize?: string
  initialShowTranslation?: boolean
  initialBookmarks?: string[]
  prevSurahId?: number
  nextSurahId?: number
}

const FONT_SIZES = ['small', 'medium', 'large', 'xlarge']
const FONT_SIZE_LABELS: Record<string, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
  xlarge: 'XL',
}

export function SurahReader({
  surah,
  ayahs,
  locale,
  userId,
  initialAyah,
  initialFontSize = 'large',
  initialShowTranslation = true,
  initialBookmarks = [],
  prevSurahId,
  nextSurahId,
}: SurahReaderProps) {
  const t = useTranslations('quran')
  const { currentTrack, isPlaying, play, pause, resume, currentReciter, autoplay, setAutoplay } = useAudio()
  const [showTranslation, setShowTranslation] = useState(initialShowTranslation)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set(initialBookmarks))
  const [activeAyah, setActiveAyah] = useState<number | null>(initialAyah || null)
  const [showSettings, setShowSettings] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const supabase = createClient()

  // Scroll to initial ayah
  useEffect(() => {
    if (initialAyah) {
      setTimeout(() => {
        document.getElementById(`ayah-${initialAyah}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 500)
    }
  }, [initialAyah])

  // Track active ayah from audio
  useEffect(() => {
    if (currentTrack?.surahId === surah.id) {
      setActiveAyah(currentTrack.ayahNumber)
    } else {
      setActiveAyah(null)
    }
  }, [currentTrack, surah.id])

  // Auto-scroll to active ayah
  useEffect(() => {
    if (activeAyah) {
      const el = document.getElementById(`ayah-${activeAyah}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeAyah])

  // Handle next/prev audio events
  useEffect(() => {
    const handleNext = () => {
      if (!activeAyah) return
      const nextAyah = ayahs.find(a => a.ayah_number === activeAyah + 1)
      if (nextAyah) {
        handlePlayAyah(nextAyah)
      }
    }
    const handlePrev = () => {
      if (!activeAyah) return
      const prevAyah = ayahs.find(a => a.ayah_number === activeAyah - 1)
      if (prevAyah) {
        handlePlayAyah(prevAyah)
      }
    }

    window.addEventListener('audio:next', handleNext)
    window.addEventListener('audio:prev', handlePrev)
    return () => {
      window.removeEventListener('audio:next', handleNext)
      window.removeEventListener('audio:prev', handlePrev)
    }
  }, [activeAyah, ayahs])

  const getAudioUrl = useCallback((ayahGlobalNumber: number) => {
    return `${currentReciter.audioBaseUrl}${ayahGlobalNumber}.mp3`
  }, [currentReciter])

  const handlePlayAyah = useCallback((ayah: AyahWithTranslation) => {
    const isCurrentAyah = currentTrack?.ayahId === ayah.id

    if (isCurrentAyah) {
      if (isPlaying) {
        pause()
      } else {
        resume()
      }
      return
    }

    play({
      surahId: surah.id,
      surahName: surah.name_transliteration,
      ayahNumber: ayah.ayah_number,
      ayahId: ayah.id,
      audioUrl: getAudioUrl(ayah.ayah_number_global),
      totalAyahs: surah.ayah_count,
    })

    // Save progress
    if (userId) {
      saveProgress(ayah)
    }
  }, [currentTrack, isPlaying, surah, play, pause, resume, getAudioUrl, userId])

  const handlePlayAll = () => {
    if (ayahs.length > 0) {
      handlePlayAyah(ayahs[0])
    }
  }

  const saveProgress = async (ayah: AyahWithTranslation) => {
    if (!userId) return
    await supabase.from('reading_progress').upsert({
      user_id: userId,
      surah_id: surah.id,
      last_ayah_id: ayah.id,
      last_ayah_number: ayah.ayah_number,
      completed: ayah.ayah_number === surah.ayah_count,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,surah_id' })
  }

  const handleBookmark = async (ayahId: string) => {
    if (!userId) {
      toast.error(locale === 'fr' ? 'Connectez-vous pour sauvegarder des favoris' : 'Sign in to save bookmarks')
      return
    }

    const isBookmarked = bookmarks.has(ayahId)
    const newBookmarks = new Set(bookmarks)

    if (isBookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', userId)
        .eq('ayah_id', ayahId)
      newBookmarks.delete(ayahId)
      toast.success(t('bookmarkRemoved'))
    } else {
      await supabase.from('bookmarks').insert({
        user_id: userId,
        ayah_id: ayahId,
        surah_id: surah.id,
      })
      newBookmarks.add(ayahId)
      toast.success(t('bookmarkAdded'))
    }

    setBookmarks(newBookmarks)
  }

  const isSurahPlaying = isPlaying && currentTrack?.surahId === surah.id

  return (
    <div className={cn('min-h-screen transition-all', immersive && 'immersive-bg')}>
      {/* Header */}
      <div className={cn(
        'sticky top-16 z-40 border-b bg-background/95 backdrop-blur-md',
        immersive && 'bg-black/80 border-white/10'
      )}>
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Nav */}
            <div className="flex items-center gap-2">
              {prevSurahId && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/${locale}/quran/${prevSurahId}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              <div className="text-center">
                <h1 className="font-bold text-base">{surah.name_transliteration}</h1>
                <p className="text-xs text-muted-foreground">
                  {locale === 'fr' ? surah.name_fr : surah.name_en}
                  {' · '}
                  {t('ayahCount', { count: surah.ayah_count })}
                </p>
              </div>

              {nextSurahId && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/${locale}/quran/${nextSurahId}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Play all */}
              <Button
                variant="outline"
                size="sm"
                onClick={isSurahPlaying ? pause : handlePlayAll}
                className="gap-2"
              >
                {isSurahPlaying ? (
                  <><Pause className="h-3.5 w-3.5" /> {t('pause')}</>
                ) : (
                  <><Play className="h-3.5 w-3.5" /> {t('playAll')}</>
                )}
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* Immersive mode */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImmersive(!immersive)}
                title={t('immersiveMode')}
              >
                {immersive ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <div className="flex flex-wrap items-center gap-6 py-1">
                  {/* Translation toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="translation"
                      checked={showTranslation}
                      onCheckedChange={setShowTranslation}
                    />
                    <Label htmlFor="translation" className="cursor-pointer">
                      <Languages className="inline h-3.5 w-3.5 mr-1" />
                      {t('translationToggle')}
                    </Label>
                  </div>

                  {/* Font size */}
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1">
                      {FONT_SIZES.map((size) => (
                        <Button
                          key={size}
                          variant={fontSize === size ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 w-7 p-0 text-xs"
                          onClick={() => setFontSize(size)}
                        >
                          {FONT_SIZE_LABELS[size]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Autoplay */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="autoplay"
                      checked={autoplay}
                      onCheckedChange={setAutoplay}
                    />
                    <Label htmlFor="autoplay" className="cursor-pointer">
                      {t('continuousPlay')}
                    </Label>
                  </div>

                  {/* Reciter */}
                  <ReciterSelector />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Arabic surah name + Bismillah */}
        <div className="text-center mb-10">
          <h2 className="arabic-text text-5xl text-primary mb-4">
            {surah.name_arabic}
          </h2>
          <div className="flex items-center gap-3 justify-center mb-2">
            <Badge variant="outline">
              {surah.revelation_type === 'Meccan' ? t('meccan') : t('medinan')}
            </Badge>
            <Badge variant="outline">
              {t('surahNumber', { number: surah.id })}
            </Badge>
          </div>
          {surah.id !== 9 && surah.id !== 1 && (
            <p className="arabic-text text-2xl text-muted-foreground mt-6">
              {t('bismillah')}
            </p>
          )}
        </div>

        {/* Ayahs */}
        <div className="space-y-4">
          {ayahs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>Chargement des ayahs... Assurez-vous que la base de données est remplie.</p>
            </div>
          ) : (
            ayahs.map((ayah) => (
              <AyahCard
                key={ayah.id}
                ayah={ayah}
                surah={surah}
                showTranslation={showTranslation}
                isActive={activeAyah === ayah.ayah_number}
                isBookmarked={bookmarks.has(ayah.id)}
                fontSize={fontSize}
                locale={locale}
                onBookmark={handleBookmark}
                onPlay={handlePlayAyah}
              />
            ))
          )}
        </div>

        {/* Navigation bottom */}
        <div className="mt-12 flex justify-between">
          {prevSurahId ? (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/quran/${prevSurahId}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('previous')}
              </Link>
            </Button>
          ) : <div />}
          {nextSurahId ? (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/quran/${nextSurahId}`}>
                {t('next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : <div />}
        </div>
      </div>
    </div>
  )
}
