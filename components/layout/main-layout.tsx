import { Header } from './header'
import { FloatingAudioPlayer } from '@/components/quran/floating-audio-player'
import { createClient } from '@/lib/supabase/server'

interface MainLayoutProps {
  children: React.ReactNode
  locale: string
}

export async function MainLayout({ children, locale }: MainLayoutProps) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let userProfile = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', authUser.id)
      .single()
    userProfile = data || { email: authUser.email, display_name: null }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} user={userProfile} />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <FloatingAudioPlayer locale={locale} />
    </div>
  )
}
