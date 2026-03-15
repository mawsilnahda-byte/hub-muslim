import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Bookmark, Flame, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('.supabase.co') && !url.includes('your-project')
}

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const tq = await getTranslations({ locale, namespace: 'quran' })

  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/quran`)
  }

  let user: any = null
  let profile: any = null
  let streak: any = null
  let bookmarks: any[] = []
  let progress: any[] = []

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      redirect(`/${locale}/login`)
    }
    user = authUser

    const results = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('reading_streaks').select('*').eq('user_id', authUser.id).single(),
      supabase.from('bookmarks')
        .select('*, ayah:ayahs(ayah_number, text_uthmani), surah:surahs(id, name_transliteration, name_arabic)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('reading_progress')
        .select('*, surah:surahs(id, name_transliteration, ayah_count)')
        .eq('user_id', authUser.id)
        .order('updated_at', { ascending: false })
        .limit(5),
    ])

    profile = results[0].data
    streak = results[1].data
    bookmarks = (results[2].data || []) as any[]
    progress = (results[3].data || []) as any[]
  } catch {
    redirect(`/${locale}/quran`)
  }

  const p = profile as any
  const s = streak as any
  const displayName = p?.display_name || user?.email?.split('@')[0] || 'Utilisateur'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('welcome', { name: displayName })}</h1>
        <p className="text-muted-foreground">{t('title')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{s?.current_streak || 0}</p>
              <p className="text-sm text-muted-foreground">{t('readingStreak')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Hash className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{s?.total_ayahs_read || 0}</p>
              <p className="text-sm text-muted-foreground">{t('totalAyahs')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.length || 0}</p>
              <p className="text-sm text-muted-foreground">{t('surahs')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Bookmark className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bookmarks?.length || 0}</p>
              <p className="text-sm text-muted-foreground">{tq('bookmarks')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('continueReading')}</span>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/${locale}/quran`}>{tq('surahList')}</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Commencez à lire le Coran !</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={`/${locale}/quran`}>Explorer</Link>
                </Button>
              </div>
            ) : (
              progress.map((p: any) => (
                <Link
                  key={p.surah_id}
                  href={`/${locale}/quran/${p.surah_id}?ayah=${p.last_ayah_number}`}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {p.surah_id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.surah?.name_transliteration}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={(p.last_ayah_number / (p.surah?.ayah_count || 1)) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {p.last_ayah_number}/{p.surah?.ayah_count}
                      </span>
                    </div>
                  </div>
                  {p.completed && (
                    <Badge variant="default" className="shrink-0 text-xs">✓</Badge>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Bookmarks */}
        <Card>
          <CardHeader>
            <CardTitle>{t('myBookmarks')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{tq('noBookmarks')}</p>
              </div>
            ) : (
              bookmarks.map((b: any) => (
                <Link
                  key={b.id}
                  href={`/${locale}/quran/${b.surah_id}?ayah=${b.ayah?.ayah_number}`}
                  className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">
                      {b.surah?.name_transliteration} — {b.ayah?.ayah_number}
                    </span>
                    <span className="arabic-text text-sm text-muted-foreground">
                      {b.surah?.name_arabic}
                    </span>
                  </div>
                  <p className="arabic-text text-sm text-right line-clamp-2" dir="rtl">
                    {b.ayah?.text_uthmani}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
