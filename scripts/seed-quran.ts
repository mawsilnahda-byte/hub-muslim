#!/usr/bin/env npx tsx
/**
 * Seed script: Import Quran data from alquran.cloud API
 * 
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-quran.ts
 * 
 * This will import:
 * - 114 surahs
 * - 6236 ayahs (Uthmani text)
 * - Translations EN (Saheeh International) and FR (Hamidullah)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const API_BASE = 'https://api.alquran.cloud/v1'
const DELAY_MS = 500 // Be respectful of the API

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.code !== 200) throw new Error(`API error: ${data.status}`)
      return data.data
    } catch (err) {
      if (i === retries - 1) throw err
      console.log(`Retry ${i + 1}/${retries} for ${url}`)
      await sleep(2000)
    }
  }
}

// French translations mapping (surah names)
const SURAH_NAMES_FR: Record<number, string> = {
  1: 'L\'Ouverture', 2: 'La Vache', 3: 'La Famille d\'Imran', 4: 'Les Femmes',
  5: 'La Table Servie', 6: 'Les Bestiaux', 7: 'Les Murailles', 8: 'Le Butin',
  9: 'Le Repentir', 10: 'Jonas', 11: 'Hud', 12: 'Joseph', 13: 'Le Tonnerre',
  14: 'Abraham', 15: 'Al-Hijr', 16: 'Les Abeilles', 17: 'Le Voyage Nocturne',
  18: 'La Caverne', 19: 'Marie', 20: 'Ta-Ha', 21: 'Les Prophètes',
  22: 'Le Pèlerinage', 23: 'Les Croyants', 24: 'La Lumière', 25: 'Le Discernement',
  26: 'Les Poètes', 27: 'Les Fourmis', 28: 'Le Récit', 29: 'L\'Araignée',
  30: 'Les Romains', 31: 'Luqman', 32: 'La Prosternation', 33: 'Les Coalisés',
  34: 'Saba\'', 35: 'Le Créateur', 36: 'Ya-Seen', 37: 'Les Rangées',
  38: 'Sad', 39: 'Les Groupes', 40: 'Le Pardonneur', 41: 'Fussilat',
  42: 'La Concertation', 43: 'Les Ornements', 44: 'La Fumée', 45: 'L\'Agenouillée',
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'La Victoire', 49: 'Les Appartements',
  50: 'Qaf', 51: 'Les Disperseurs', 52: 'Le Mont', 53: 'L\'Étoile',
  54: 'La Lune', 55: 'Le Tout Miséricordieux', 56: 'L\'Événement', 57: 'Le Fer',
  58: 'La Disputante', 59: 'L\'Exode', 60: 'La Mise à l\'Épreuve', 61: 'Les Rangs',
  62: 'Le Vendredi', 63: 'Les Hypocrites', 64: 'La Déception', 65: 'Le Divorce',
  66: 'L\'Interdiction', 67: 'La Royauté', 68: 'La Plume', 69: 'La Réalité',
  70: 'Les Degrés', 71: 'Noé', 72: 'Les Djinns', 73: 'L\'Enveloppé',
  74: 'Le Revêtu', 75: 'La Résurrection', 76: 'L\'Homme', 77: 'Les Envoyés',
  78: 'La Nouvelle', 79: 'Ceux Qui Arrachent', 80: 'Il S\'est Renfrogné',
  81: 'L\'Obscurcissement', 82: 'L\'Éclatement', 83: 'Les Fraudeurs',
  84: 'La Fission', 85: 'Les Constellations', 86: 'L\'Astre Nocturne',
  87: 'Le Très-Haut', 88: 'L\'Enveloppement', 89: 'L\'Aurore', 90: 'La Cité',
  91: 'Le Soleil', 92: 'La Nuit', 93: 'L\'Avant-Dernier', 94: 'L\'Expansion',
  95: 'Le Figuier', 96: 'La Adhérence', 97: 'La Destinée', 98: 'La Preuve',
  99: 'Le Séisme', 100: 'Les Coureurs', 101: 'La Catastrophe',
  102: 'L\'Accumulation', 103: 'L\'Après-Midi', 104: 'Le Calomniateur',
  105: 'L\'Éléphant', 106: 'Quraysh', 107: 'L\'Aide', 108: 'L\'Abondance',
  109: 'Les Infidèles', 110: 'Le Secours', 111: 'La Flamme', 112: 'Le Monothéisme',
  113: 'L\'Aube', 114: 'Les Hommes'
}

async function seedSurahs() {
  console.log('📖 Fetching surahs list...')
  const surahs = await fetchWithRetry(`${API_BASE}/surah`)
  
  const surahsToInsert = surahs.map((s: any) => ({
    id: s.number,
    name_arabic: s.name,
    name_transliteration: s.englishName,
    name_en: s.englishNameTranslation,
    name_fr: SURAH_NAMES_FR[s.number] || s.englishNameTranslation,
    revelation_type: s.revelationType,
    ayah_count: s.numberOfAyahs,
    juz_start: 1,
    page_start: 1,
  }))

  const { error } = await supabase
    .from('surahs')
    .upsert(surahsToInsert, { onConflict: 'id' })
  
  if (error) throw error
  console.log(`✅ Inserted ${surahsToInsert.length} surahs`)
}

async function seedAyahs() {
  console.log('📝 Fetching Uthmani text (all 6236 ayahs)...')
  
  // Fetch full quran at once
  const data = await fetchWithRetry(`${API_BASE}/quran/quran-uthmani`)
  
  const ayahsToInsert: any[] = []
  let globalNumber = 1
  
  for (const surah of data.surahs) {
    for (const ayah of surah.ayahs) {
      ayahsToInsert.push({
        surah_id: surah.number,
        ayah_number: ayah.numberInSurah,
        ayah_number_global: globalNumber++,
        text_uthmani: ayah.text,
        juz: ayah.juz,
        hizb: ayah.hizbQuarter ? Math.ceil(ayah.hizbQuarter / 4) : null,
        page: ayah.page,
      })
    }
  }
  
  // Insert in batches of 500
  const BATCH_SIZE = 500
  for (let i = 0; i < ayahsToInsert.length; i += BATCH_SIZE) {
    const batch = ayahsToInsert.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('ayahs').upsert(batch, { onConflict: 'ayah_number_global' })
    if (error) throw error
    console.log(`  Inserted ayahs ${i + 1}-${Math.min(i + BATCH_SIZE, ayahsToInsert.length)}`)
    await sleep(DELAY_MS)
  }
  
  console.log(`✅ Inserted ${ayahsToInsert.length} ayahs`)
}

async function seedTranslations(translatorSlug: string, edition: string, languageCode: string) {
  console.log(`🌍 Fetching translation: ${translatorSlug}...`)
  
  const data = await fetchWithRetry(`${API_BASE}/quran/${edition}`)
  
  // Get translator ID
  const { data: translator } = await supabase
    .from('translators')
    .select('id')
    .eq('slug', translatorSlug)
    .single()
  
  if (!translator) throw new Error(`Translator ${translatorSlug} not found`)
  
  // Get all ayah IDs ordered by global number
  const { data: ayahs } = await supabase
    .from('ayahs')
    .select('id, ayah_number_global')
    .order('ayah_number_global')
  
  if (!ayahs) throw new Error('No ayahs found')
  
  const ayahMap = new Map(ayahs.map(a => [a.ayah_number_global, a.id]))
  
  const translationsToInsert: any[] = []
  let globalNumber = 1
  
  for (const surah of data.surahs) {
    for (const ayah of surah.ayahs) {
      const ayahId = ayahMap.get(globalNumber++)
      if (ayahId) {
        translationsToInsert.push({
          ayah_id: ayahId,
          translator_id: translator.id,
          language_code: languageCode,
          text: ayah.text,
        })
      }
    }
  }
  
  // Insert in batches
  const BATCH_SIZE = 500
  for (let i = 0; i < translationsToInsert.length; i += BATCH_SIZE) {
    const batch = translationsToInsert.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('translations')
      .upsert(batch, { onConflict: 'ayah_id,translator_id' })
    if (error) throw error
    console.log(`  Inserted translations ${i + 1}-${Math.min(i + BATCH_SIZE, translationsToInsert.length)}`)
    await sleep(DELAY_MS)
  }
  
  console.log(`✅ Inserted ${translationsToInsert.length} translations for ${translatorSlug}`)
}

async function main() {
  console.log('🌙 Starting Quran seed...\n')
  
  try {
    await seedSurahs()
    await sleep(1000)
    
    await seedAyahs()
    await sleep(1000)
    
    await seedTranslations('saheeh-international', 'en.sahih', 'en')
    await sleep(1000)
    
    // Hamidullah FR - use the closest available
    await seedTranslations('hamidullah', 'fr.hamidullah', 'fr')
    
    console.log('\n✅ Quran seed complete!')
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

main()
