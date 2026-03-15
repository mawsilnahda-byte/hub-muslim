import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // Handle auth session refresh
  const { response, user } = await updateSession(request)
  
  // Protected routes
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = /\/(en|fr)\/(dashboard)/.test(pathname)
  
  if (isProtectedRoute && !user) {
    const locale = pathname.split('/')[1] || 'fr'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  // Apply i18n middleware
  const intlResponse = intlMiddleware(request)
  
  // Merge headers from both middlewares
  if (intlResponse) {
    response.headers.forEach((value, key) => {
      intlResponse.headers.set(key, value)
    })
    return intlResponse
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
