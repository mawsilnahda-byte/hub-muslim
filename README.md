# Nuuru — نور

> Hub digital pour la communauté musulmane

**Live**: https://hub-muslim.vercel.app

## Module 1: Coran

Lisez et écoutez le Coran avec texte arabe Uthmani, traductions FR/EN, et lecteur audio avec 3 récitateurs.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4
- **UI**: shadcn/ui components (custom)
- **Animations**: Framer Motion
- **Audio**: Web Audio API (HTML5 Audio natif)
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

### 3. Supabase (production)

> **⚠️ Action manuelle requise** — La création d'un projet Supabase nécessite un compte sur supabase.com. Il n'est pas possible de la faire automatiquement sans credentials.

#### Étapes complètes :

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com) :
   - Aller sur https://supabase.com/dashboard → "New project"
   - Choisir une région proche (ex: eu-west-2 pour l'Europe)
   - Noter l'URL du projet (format : `https://xxxx.supabase.co`)

2. **Récupérer les clés** dans Settings → API :
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (secret)

3. **Mettre à jour `.env.local`** avec ces valeurs

4. **Exécuter les migrations** dans Supabase SQL Editor (dans l'ordre) :
   - Ouvrir https://supabase.com/dashboard → ton projet → SQL Editor
   - Copier-coller et exécuter : `supabase/migrations/001_initial_schema.sql`
   - Puis : `supabase/migrations/002_rls_policies.sql`

5. **Seed les données Coran** :
   ```bash
   npm run seed
   ```
   > Le seed appelle l'API alquran.cloud pour récupérer les 6236 ayahs + traductions FR/EN.
   > Durée estimée : 5-10 minutes.

6. **Activer Google OAuth** (optionnel) :
   - Supabase Dashboard → Authentication → Providers → Google
   - Configurer avec vos credentials Google Cloud Console

#### Mode sans Supabase (fallback automatique)

Si Supabase n'est pas configuré (`.env.local` contient encore `your-project`), l'app utilise automatiquement l'API publique alquran.cloud. Les fonctionnalités suivantes seront désactivées :
- Authentification (login/register)
- Bookmarks
- Progression de lecture / streaks
- Dashboard

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
