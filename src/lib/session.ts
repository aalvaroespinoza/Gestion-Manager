import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionPayload, AuthUser, AuthTenant } from '@/modules/auth/types'

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'super-secret-default-key-change-in-production-min32chars'
const encodedKey = new TextEncoder().encode(SECRET_KEY)
export const SESSION_COOKIE_NAME = 'gestion_session'

/**
 * Signs a session payload into a JWT token
 */
export async function signSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>, expiresIn = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey)
}

/**
 * Verifies and decodes a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch (error) {
    return null
  }
}

/**
 * Retrieves the current session from incoming request cookies (Server Components / Server Actions / Route Handlers)
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return await verifySessionToken(token)
  } catch (error) {
    return null
  }
}

/**
 * Sets session cookie on the response
 */
export async function createSession(user: AuthUser, tenant: AuthTenant): Promise<string> {
  const token = await signSessionToken({ user, tenant })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return token
}

/**
 * Clears the session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
