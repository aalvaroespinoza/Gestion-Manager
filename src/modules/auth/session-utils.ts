import { getSession } from '@/lib/session'
import { AuthUser, AuthTenant, SessionPayload } from './types'

/**
 * Returns the current authenticated session payload or null
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  return await getSession()
}

/**
 * Returns the currently authenticated user or null
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Returns the current tenant context or null
 */
export async function getCurrentTenant(): Promise<AuthTenant | null> {
  const session = await getSession()
  return session?.tenant ?? null
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
 * Ensures tenant context is present; throws an error if missing
 */
export async function requireTenant(): Promise<AuthTenant> {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    throw new Error('Unauthorized: Tenant context required')
  }
  return tenant
}

/**
 * Ensures a valid session exists with both user and tenant
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getCurrentSession()
  if (!session || !session.user || !session.tenant) {
    throw new Error('Unauthorized: Valid session required')
  }
  return session
}
