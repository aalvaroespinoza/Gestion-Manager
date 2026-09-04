import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { SessionPayload } from './modules/auth/types'

const SECRET_KEY = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'super-secret-default-key-change-in-production-min32chars'
const encodedKey = new TextEncoder().encode(SECRET_KEY)
const SESSION_COOKIE_NAME = 'gestion_session'

import { createClient as updateSupabaseSession } from '@/utils/supabase/middleware'

// Auth entry routes
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

// Public asset/API paths
const PUBLIC_PREFIXES = ['/_next', '/static', '/api/auth', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets and Next.js internal files
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  let session: SessionPayload | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedKey, {
        algorithms: ['HS256'],
      })
      session = payload as unknown as SessionPayload
    } catch {
      session = null
    }
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // 1. If user is already authenticated and visits /login or /register -> redirect to /dashboard
  if (isAuthRoute) {
    if (session && session.userId && session.tenantId) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return updateSupabaseSession(request)
  }

  // 2. Determine if route is protected (dashboard, business modules)
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/stock') ||
    pathname.startsWith('/ventas') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/configuracion') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/sales') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/dynamic-forms') ||
    pathname.startsWith('/api/protected')

  if (!isProtectedPath) {
    return updateSupabaseSession(request)
  }

  // 3. If unauthenticated on protected route -> redirect to /login
  if (!session || !session.userId || !session.tenantId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid session' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // 4. If authenticated -> inject tenant and user context headers downstream
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', session.tenantId)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-user-role', session.role)
  requestHeaders.set('x-user-email', session.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
