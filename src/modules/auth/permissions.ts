import { UserRole } from '@prisma/client'
import { getCurrentUser } from './session-utils'
import { AuthUser } from './types'

export const ROLES = {
  ADMIN: 'ADMIN' as UserRole,
  MANAGER: 'MANAGER' as UserRole,
  SELLER: 'SELLER' as UserRole,
} as const

/**
 * Asserts that the authenticated user possesses one of the required roles.
 * Throws an authorization error if the user is unauthenticated or lacks the necessary role.
 */
export async function assertRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('No autenticado: Inicie sesión para realizar esta operación.')
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Acceso denegado: Se requieren permisos de [${allowedRoles.join(', ')}]. Su rol actual es [${user.role}].`
    )
  }

  return user
}

/**
 * Checks if the current authenticated user has the ADMIN role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Checks if the current authenticated user is a MANAGER or ADMIN
 */
export async function isManagerOrAbove(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
}

/**
 * Guard that enforces ADMIN role
 */
export async function requireAdmin(): Promise<AuthUser> {
  return await assertRole(['ADMIN'])
}

/**
 * Guard that enforces MANAGER or ADMIN role
 */
export async function requireManagerOrAbove(): Promise<AuthUser> {
  return await assertRole(['ADMIN', 'MANAGER'])
}
