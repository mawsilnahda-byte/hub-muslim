/**
 * Fallback: fetch Quran data directly from alquran.cloud API
 * Used when Supabase is not configured
 */

const API_BASE = 'https://api.alquran.cloud/v1'

const SURAH_NAMES_FR: Record<number, string> = {
  1: "L'Ouverture", 2: 'La Vache', 3: "La Famille d'Imran", 4: 'Les Femmes',
  5: 'La Table Servie', 6: 'Les Bestiaux', 7: 'Les Murailles', 8: 'Le Butin',
  9: 'Le Repentir', 10: 'Jonas', 11: 'Hud', 12: 'Joseph', 13: 'Le Tonnerre',
  14: 'Abraham', 15: 'Al-Hijr', 16: 'Les Abeilles', 17: 'Le Voyage Nocturne',
  18: 'La Caverne', 19: 'Marie', 20: 'Ta-Ha', 21: 'Les Prophètes',
  22: 'Le Pèlerinage', 23: 'Les Croyants', 24: 'La Lumière', 25: 'Le Discernement',
  26: 'Les Poètes', 27: 'Les Fourmis', 28: 'Le Récit', 29: "L'Araignée",
  30: 'Les Romains', 31: 'Luqman', 32: 'La Prosternation', 33: 'Les Coalisés',
  34: "Saba'", 35: 'Le Créateur', 36: 'Ya-Seen', 37: 'Les Rangées',
  38: 'Sad', 39: 'Les Groupes', 40: 'Le Pardonneur', 41: 'Fussilat',
  42: 'La Concertation', 43: 'Les Ornements', 44: 'La Fumée', 45: "L'Agenouillée",
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'La Victoire', 49: 'Les Appartements',
  50: 'Qaf', 51: 'Les Disperseurs', 52: 'Le Mont', 53: "L'Étoile",
  54: 'La Lune', 55: 'Le Tout Miséricordieux', 56: "L'Événement", 57: 'Le Fer',
  58: 'La Disputante', 59: "L'Exode", 60: "La Mise à l'Épreuve", 61: 'Les Rangs',
  62: 'Le Vendredi', 63: 'Les Hypocrites', 64: 'La Déception', 65: 'Le Divorce',
  66: "L'Interdiction", 67: 'La Royauté', 68: 'La Plume', 69: 'La Réalité',
  70: 'Les Degrés', 71: 'Noé', 72: 'Les Djinns', 73: "L'Enveloppé",
  74: 'Le Revêtu', 75: 'La Résurrection', 76: "L'Homme", 77: 'Les Envoyés',
  78: 'La Nouvelle', 79: 'Ceux Qui Arrachent', 80: "Il S'est Renfrogné",
  81: "L'Obscurcissement", 82: "L'Éclatement", 83: 'Les Fraudeurs',
  84: 'La Fission', 85: 'Les Constellations', 86: "L'Astre Nocturne",
  87: 'Le Très-Haut', 88: "L'Enveloppement", 89: "L'Aurore", 90: 'La Cité',
  91: 'Le Soleil', 92: 'La Nuit', 93: "L'Avant-Dernier", 94: "L'Expansion",
  95: 'Le Figuier', 96: 'La Adhérence', 97: 'La Destinée', 98: 'La Preuve',
  99: 'Le Séisme', 100: 'Les Coureurs', 101: 'La Catastrophe',
  102: "L'Accumulation", 103: "L'Après-Midi", 104: 'Le Calomniateur',
  105: "L'Éléphant", 106: 'Quraysh', 107: "L'Aide", 108: "L'Abondance",
  109: 'Les Infidèles', 110: 'Le Secours', 111: 'La Flamme', 112: 'Le Monothéisme',
  113: "L'Aube", 114: 'Les Hommes',
}

export interface SurahFromAPI {
  id: number
  name_arabic: string
  name_transliteration: string
  name_en: string
  name_fr: string
  revelation_type: string
  ayah_count: number
  juz_start: number
  page_start: number
}

export interface AyahFromAPI {
  id: string
  surah_id: number
  ayah_number: number
  ayah_number_global: number
  text_uthmani: string
  juz: number
  page: number
  translation?: string
}

// Cache in memory
let surahsCache: SurahFromAPI[] | null = null

export async function fetchSurahsFromAPI(): Promise<SurahFromAPI[]> {
  if (surahsCache) return surahsCache

  const res = await fetch(`${API_BASE}/surah`, {
    next: { revalidate: 86400 }, // 24h cache
  })
  if (!res.ok) throw new Error('Failed to fetch surahs')
  
  const data = await res.json()
  surahsCache = data.data.map((s: any) => ({
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
  
  return surahsCache!
}

export async function fetchAyahsFromAPI(
  surahId: number,
  locale: string = 'fr'
): Promise<AyahFromAPI[]> {
  // Fetch Uthmani text + translation in parallel
  const translationEdition = locale === 'fr' ? 'fr.hamidullah' : 'en.sahih'
  
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${API_BASE}/surah/${surahId}/quran-uthmani`, {
      next: { revalidate: 86400 },
    }),
    fetch(`${API_BASE}/surah/${surahId}/${translationEdition}`, {
      next: { revalidate: 86400 },
    }),
  ])

  if (!arabicRes.ok) throw new Error(`Failed to fetch surah ${surahId}`)
  
  const arabicData = await arabicRes.json()
  const translationData = translationRes.ok ? await translationRes.json() : null
  
  const translationMap = new Map<number, string>()
  if (translationData?.data?.ayahs) {
    translationData.data.ayahs.forEach((a: any) => {
      translationMap.set(a.numberInSurah, a.text)
    })
  }

  return arabicData.data.ayahs.map((ayah: any) => ({
    id: `api-${surahId}-${ayah.numberInSurah}`,
    surah_id: surahId,
    ayah_number: ayah.numberInSurah,
    ayah_number_global: ayah.number,
    text_uthmani: ayah.text,
    juz: ayah.juz,
    page: ayah.page,
    translation: translationMap.get(ayah.numberInSurah),
  }))
}

export async function searchQuranAPI(
  query: string,
  locale: string = 'fr',
  limit: number = 20
) {
  const edition = locale === 'fr' ? 'fr.hamidullah' : 'en.sahih'
  const res = await fetch(
    `${API_BASE}/search/${encodeURIComponent(query)}/all/${edition}`,
    { next: { revalidate: 3600 } }
  )
  
  if (!res.ok) return []
  
  const data = await res.json()
  if (data.code !== 200) return []
  
  return (data.data?.matches || []).slice(0, limit).map((m: any) => ({
    text: m.text,
    ayah: {
      id: `api-${m.surah.number}-${m.numberInSurah}`,
      surah_id: m.surah.number,
      ayah_number: m.numberInSurah,
      ayah_number_global: m.number,
      text_uthmani: m.text,
      surah: {
        name_transliteration: m.surah.englishName,
        name_arabic: m.surah.name,
      },
    },
  }))
}
