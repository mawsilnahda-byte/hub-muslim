'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Sun, Globe, Menu, BookOpen, User, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  locale: string
  user?: { email?: string; display_name?: string } | null
}

export function Header({ locale, user }: HeaderProps) {
  const t = useTranslations('common')
  const tn = useTranslations('nav')
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const otherLocale = locale === 'fr' ? 'en' : 'fr'
  const localizedPath = pathname.replace(`/${locale}`, `/${otherLocale}`)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push(`/${locale}/login`)
  }

  const navLinks = [
    { href: `/${locale}/quran`, label: tn('quran'), icon: BookOpen },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={`/${locale}/quran`}
          className="flex items-center gap-2 font-bold text-xl"
        >
          <span className="text-2xl">☽</span>
          <span className="text-primary">Nuuru</span>
          <span className="text-xs text-muted-foreground hidden sm:block">نور</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language switch */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            title={`Switch to ${otherLocale.toUpperCase()}`}
          >
            <Link href={localizedPath}>
              <Globe className="h-4 w-4" />
              <span className="sr-only">{t('language')}</span>
            </Link>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user.display_name || 'Utilisateur'}</p>
                  <p className="text-muted-foreground text-xs truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard`}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {tn('dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href={`/${locale}/login`}>{t('login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
