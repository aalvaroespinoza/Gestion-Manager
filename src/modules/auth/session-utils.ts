import { headers } from 'next/headers'
import { getSession } from '@/lib/session'
import { AuthUser, SessionPayload, UserRole } from './types'

/**
 * Returns the current authenticated session payload (prioritizing cryptographically verified JWT cookie)
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieSession = await getSession()
  if (cookieSession && cookieSession.tenantId && cookieSession.userId) {
    return cookieSession
  }

  try {
    const headerList = await headers()
    const tenantId = headerList.get('x-tenant-id')
    const userId = headerList.get('x-user-id')
    const role = headerList.get('x-user-role') as UserRole | null
    const email = headerList.get('x-user-email')

    if (tenantId && userId && role && email) {
      return {
        userId,
        tenantId,
        role,
        email,
      }
    }
  } catch {
    // headers() might not be available in all contexts
  }

  return null
}

/**
 * Returns the authenticated user from the request context / cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession()
  if (!session) return null

  return {
    id: session.userId,
    tenantId: session.tenantId,
    email: session.email,
    role: session.role,
    name: session.name,
  }
}

/**
 * Returns the validated tenantId for the current session to inject into database queries
 */
export async function getCurrentTenant(): Promise<string | null> {
  const session = await getCurrentSession()
  return session?.tenantId ?? null
}

/**
 * Ensures user is authenticated; throws an error if unauthenticated
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  return user
}

/**
 * Ensures valid tenantId exists; throws an error if missing
 */
export async function requireTenant(): Promise<string> {
  const tenantId = await getCurrentTenant()
  if (!tenantId) {
    throw new Error('Unauthorized: Tenant context required')
  }
  return tenantId
}
