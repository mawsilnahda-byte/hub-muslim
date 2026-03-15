'use client'

import React, { createContext, useContext, useRef, useState, useCallback } from 'react'

export interface ReciterInfo {
  slug: string
  name: string
  audioBaseUrl: string
}

export interface AudioTrack {
  surahId: number
  surahName: string
  ayahNumber: number
  ayahId: string
  audioUrl: string
  totalAyahs: number
}

interface AudioContextType {
  currentTrack: AudioTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isLoading: boolean
  currentReciter: ReciterInfo
  autoplay: boolean
  
  setReciter: (reciter: ReciterInfo) => void
  setAutoplay: (enabled: boolean) => void
  play: (track: AudioTrack) => void
  pause: () => void
  resume: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  playNext: () => void
  playPrev: () => void
}

const DEFAULT_RECITERS: ReciterInfo[] = [
  {
    slug: 'mishary-alafasy',
    name: 'Mishary Rashid Alafasy',
    audioBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/',
  },
  {
    slug: 'abdurrahman-as-sudais',
    name: 'Abdul Rahman Al-Sudais',
    audioBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.abdurrahmanas-sudais/',
  },
  {
    slug: 'abu-bakr-al-shatri',
    name: 'Abu Bakr Al-Shatri',
    audioBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.shaatree/',
  },
]

export { DEFAULT_RECITERS }

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [currentReciter, setCurrentReciter] = useState<ReciterInfo>(DEFAULT_RECITERS[0])
  const [autoplay, setAutoplay] = useState(true)

  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      })
      audioRef.current.addEventListener('durationchange', () => {
        setDuration(audioRef.current?.duration || 0)
      })
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
        window.dispatchEvent(new CustomEvent('audio:ended'))
      })
      audioRef.current.addEventListener('loadstart', () => setIsLoading(true))
      audioRef.current.addEventListener('canplay', () => setIsLoading(false))
      audioRef.current.addEventListener('error', () => setIsLoading(false))
    }
    return audioRef.current
  }, [])

  const play = useCallback(async (track: AudioTrack) => {
    const audio = initAudio()
    
    if (currentTrack?.audioUrl !== track.audioUrl) {
      audio.src = track.audioUrl
      audio.load()
    }
    
    setCurrentTrack(track)
    setIsLoading(true)
    
    try {
      await audio.play()
      setIsPlaying(true)
    } catch (err) {
      console.error('Audio play error:', err)
      setIsPlaying(false)
    }
    setIsLoading(false)
  }, [currentTrack, initAudio])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTrack(null)
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
    setVolumeState(vol)
  }, [])

  const setReciter = useCallback((reciter: ReciterInfo) => {
    setCurrentReciter(reciter)
    stop()
  }, [stop])

  const playNext = useCallback(() => {
    // Dispatch custom event for consumer to handle
    window.dispatchEvent(new CustomEvent('audio:next'))
  }, [])

  const playPrev = useCallback(() => {
    window.dispatchEvent(new CustomEvent('audio:prev'))
  }, [])

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isLoading,
        currentReciter,
        autoplay,
        setReciter,
        setAutoplay,
        play,
        pause,
        resume,
        stop,
        seek,
        setVolume,
        playNext,
        playPrev,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
