import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { SessionPayload } from './modules/auth/types'

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'super-secret-default-key-change-in-production-min32chars'
const encodedKey = new TextEncoder().encode(SECRET_KEY)
const SESSION_COOKIE_NAME = 'gestion_session'

// Public routes that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  // Check if route is protected (dashboard, domain modules, or protected APIs)
  const isProtectedPath =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/sales') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/dynamic-forms') ||
    pathname.startsWith('/api/protected')

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })

    const session = payload as unknown as SessionPayload

    if (!session.user || !session.tenant) {
      throw new Error('Invalid session payload')
    }

    // Forward tenant and user metadata in request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-id', session.tenant.id)
    requestHeaders.set('x-tenant-slug', session.tenant.slug)
    requestHeaders.set('x-user-id', session.user.id)
    requestHeaders.set('x-user-role', session.user.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
