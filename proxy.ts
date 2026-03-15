import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('.supabase.co') && !url.includes('your-project')
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only check auth if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const { response, user } = await updateSession(request)
      
      const isProtectedRoute = /\/(en|fr)\/(dashboard)/.test(pathname)
      if (isProtectedRoute && !user) {
        const locale = pathname.split('/')[1] || 'fr'
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      }

      const intlResponse = intlMiddleware(request)
      if (intlResponse) {
        response.headers.forEach((value, key) => {
          intlResponse.headers.set(key, value)
        })
        return intlResponse
      }
      
      return response
    } catch {
      // Fall through to intl middleware only
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
