'use client'

import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAudio, DEFAULT_RECITERS } from '@/components/providers/audio-provider'

export function ReciterSelector() {
  const t = useTranslations('quran')
  const { currentReciter, setReciter } = useAudio()

  return (
    <Select
      value={currentReciter.slug}
      onValueChange={(slug) => {
        const reciter = DEFAULT_RECITERS.find((r) => r.slug === slug)
        if (reciter) setReciter(reciter)
      }}
    >
      <SelectTrigger className="w-full sm:w-[220px]">
        <SelectValue placeholder={t('reciter')} />
      </SelectTrigger>
      <SelectContent>
        {DEFAULT_RECITERS.map((reciter) => (
          <SelectItem key={reciter.slug} value={reciter.slug}>
            {reciter.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
