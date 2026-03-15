'use client'

import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Copy, Play, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { useAudio } from '@/components/providers/audio-provider'
import type { AyahWithTranslation } from '@/lib/api/quran'
import type { Surah } from '@/lib/api/quran'

interface AyahCardProps {
  ayah: AyahWithTranslation
  surah: Surah
  showTranslation: boolean
  isActive: boolean
  isBookmarked: boolean
  fontSize: string
  locale: string
  onBookmark: (ayahId: string) => void
  onPlay: (ayah: AyahWithTranslation) => void
}

const FONT_SIZES = {
  small: 'arabic-sm',
  medium: 'arabic-md',
  large: 'arabic-lg',
  xlarge: 'arabic-xl',
}

export function AyahCard({
  ayah,
  surah,
  showTranslation,
  isActive,
  isBookmarked,
  fontSize,
  locale,
  onBookmark,
  onPlay,
}: AyahCardProps) {
  const { isPlaying, currentTrack } = useAudio()
  const isCurrentlyPlaying = isPlaying && currentTrack?.ayahId === ayah.id

  const handleCopy = () => {
    const text = `${ayah.text_uthmani}\n\n${ayah.translation || ''}\n\n— ${surah.name_transliteration} ${ayah.ayah_number}:${surah.id}`
    navigator.clipboard.writeText(text)
    toast.success(locale === 'fr' ? 'Ayah copiée !' : 'Ayah copied!')
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/quran/${surah.id}?ayah=${ayah.ayah_number}`
    if (navigator.share) {
      await navigator.share({
        title: `${surah.name_transliteration} — Ayah ${ayah.ayah_number}`,
        text: ayah.text_uthmani,
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      toast.success(locale === 'fr' ? 'Lien copié !' : 'Link copied!')
    }
  }

  return (
    <motion.div
      id={`ayah-${ayah.ayah_number}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative rounded-xl border p-6 transition-all',
        isActive
          ? 'ayah-highlight border-primary/30 bg-primary/5'
          : 'bg-card hover:border-primary/20 hover:bg-card/80'
      )}
    >
      {/* Ayah number */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 text-xs font-medium text-primary">
          {ayah.ayah_number}
        </div>

        {/* Actions (hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPlay(ayah)}
            title="Play"
          >
            <Play className={cn('h-3.5 w-3.5', isCurrentlyPlaying && 'text-primary')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onBookmark(ayah.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Arabic text */}
      <p
        className={cn(
          'arabic-text text-right mb-4 leading-loose',
          FONT_SIZES[fontSize as keyof typeof FONT_SIZES] || 'arabic-lg'
        )}
        dir="rtl"
      >
        {ayah.text_uthmani}
        {' '}
        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-medium bg-primary/10 text-primary rounded-full mx-1">
          ﴿{ayah.ayah_number}﴾
        </span>
      </p>

      {/* Translation */}
      {showTranslation && ayah.translation && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-muted-foreground text-sm leading-relaxed border-t pt-3 mt-3"
        >
          {ayah.translation}
        </motion.p>
      )}
    </motion.div>
  )
}
