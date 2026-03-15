# Nuuru — نور

> Hub digital pour la communauté musulmane

**Live**: https://hub-muslim.vercel.app

## Module 1: Coran

Lisez et écoutez le Coran avec texte arabe Uthmani, traductions FR/EN, et lecteur audio avec 3 récitateurs.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4
- **UI**: shadcn/ui components (custom)
- **Animations**: Framer Motion
- **Audio**: Web Audio API (wavesurfer.js ready)
- **DB**: Supabase (PostgreSQL) — fallback alquran.cloud API si non configuré
- **Auth**: Supabase Auth (email + Google OAuth)
- **i18n**: next-intl 4 (FR + EN)
- **Thème**: next-themes (dark/light)
- **Deploy**: Vercel

## Features livrées

✅ Liste des 114 sourates (nom AR + translittération + FR/EN)  
✅ Page sourate : texte arabe Uthmani + traduction FR/EN toggle  
✅ Lecteur audio flottant persistant (3 récitateurs)  
✅ Sélection récitateur (Mishary Alafasy, Al-Sudais, Abu Bakr Al-Shatri)  
✅ Mode nuit / jour  
✅ Interface FR + EN (next-intl)  
✅ Recherche dans le Coran (alquran.cloud API)  
✅ Animations (Framer Motion)  
✅ Bookmarks (nécessite Supabase)  
✅ Progression de lecture (nécessite Supabase)  
✅ Dashboard utilisateur (nécessite Supabase)  
✅ Auth pages (login + register + Google OAuth)  
✅ Mode immersif plein écran  
✅ Réglage taille police arabe (S/M/L/XL)  
✅ Lecture continue (autoplay)  
✅ Responsive mobile-first  

## Setup

### 1. Install

```bash
npm install
```

### 2. Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir :

```bash
cp .env.example .env.local
```

Variables requises :
- `NEXT_PUBLIC_SUPABASE_URL` — URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Clé service (pour le seed)

### 3. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations dans l'ordre :
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   ```
3. Seed les données Coran :
   ```bash
   npm run seed
   ```

### 4. Dev

```bash
npm run dev
```

### 5. Deploy

```bash
vercel deploy --prod
```

## Audio Sources

Les MP3 sont servis directement depuis `cdn.islamic.network` :
- Mishary Alafasy : `https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ayah_global}.mp3`
- Al-Sudais : `https://cdn.islamic.network/quran/audio/128/ar.abdurrahmanas-sudais/{ayah_global}.mp3`
- Abu Bakr Al-Shatri : `https://cdn.islamic.network/quran/audio/128/ar.shaatree/{ayah_global}.mp3`

## Architecture

```
app/
  [locale]/
    (main)/           # Layout avec header + floating player
      quran/          # Liste sourates
      quran/[surahId] # Lecture sourate
      quran/search/   # Recherche
      dashboard/      # Tableau de bord utilisateur
    (auth)/           # Layout auth centré
      login/
      register/
      callback/       # OAuth callback
  api/
    quran/
      search/         # API recherche
      progress/       # API progression

components/
  layout/             # Header, MainLayout
  quran/              # SurahList, SurahReader, AyahCard, FloatingAudioPlayer, etc.
  providers/          # ThemeProvider, QueryProvider, AudioProvider
  ui/                 # Button, Card, Input, etc.

lib/
  api/quran.ts        # API DB Supabase
  api/quran-fallback.ts # Fallback alquran.cloud
  supabase/           # Client, server, middleware

supabase/
  migrations/         # SQL migrations
  seed/               # Scripts seed

scripts/
  seed-quran.ts       # Import 6236 ayahs + traductions
```

## RGPD

- Pas de tracking sans consentement (PostHog/Sentry désactivés par défaut)
- Auth Supabase GDPR-compliant (données EU Frankfurt si région EU)
- Pas de pub intrusive

## Roadmap Phase 2

- Module Horaires de prière (géolocalisation)
- Module Zakat (calculateur)
- PWA offline
- Tafsir
- Reading streak gamifié
- Stats premium
