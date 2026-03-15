import { Header } from './header'
import { FloatingAudioPlayer } from '@/components/quran/floating-audio-player'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('.supabase.co') && !url.includes('your-project')
}

async function getUser() {
  if (!isSupabaseConfigured()) return null
  
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) return null
    
    const { data } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', authUser.id)
      .single()
    
    return data || { email: authUser.email, display_name: null }
  } catch {
    return null
  }
}

interface MainLayoutProps {
  children: React.ReactNode
  locale: string
}

export async function MainLayout({ children, locale }: MainLayoutProps) {
  const user = await getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} user={user} />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <FloatingAudioPlayer locale={locale} />
    </div>
  )
}
