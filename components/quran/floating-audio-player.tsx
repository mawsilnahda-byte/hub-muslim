'use client'

import { useTranslations } from 'next-intl'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Music,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useAudio } from '@/components/providers/audio-provider'
import { cn } from '@/lib/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface FloatingAudioPlayerProps {
  locale: string
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function FloatingAudioPlayer({ locale }: FloatingAudioPlayerProps) {
  const t = useTranslations('quran')
  const { currentTrack, isPlaying, currentTime, duration, volume, isLoading, pause, resume, stop, seek, setVolume, playNext, playPrev } =
    useAudio()
  const [showVolume, setShowVolume] = useState(false)
  const [muted, setMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(1)

  if (!currentTrack) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const toggleMute = () => {
    if (muted) {
      setVolume(prevVolume)
      setMuted(false)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setMuted(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50 audio-player-float border-t bg-background/95 shadow-xl"
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-primary/20 cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            seek(pct * duration)
          }}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Track info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentTrack.surahName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('verseOf', {
                    ayah: currentTrack.ayahNumber,
                    total: currentTrack.totalAyahs,
                  })}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playPrev}
                className="h-9 w-9"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={isPlaying ? pause : resume}
                disabled={isLoading}
                className="h-10 w-10 rounded-full"
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                className="h-9 w-9"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Time */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleMute}
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <AnimatePresence>
                {showVolume && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 80, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    onMouseEnter={() => setShowVolume(true)}
                    onMouseLeave={() => setShowVolume(false)}
                  >
                    <Slider
                      value={[muted ? 0 : volume * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => {
                        setVolume(v / 100)
                        setMuted(false)
                      }}
                      className="w-20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={stop}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
