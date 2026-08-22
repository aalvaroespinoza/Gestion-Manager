import { Role } from '@prisma/client'

export type { Role }

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  role: Role
  tenantId: string
  isActive?: boolean
}

export interface AuthTenant {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
}

export interface SessionPayload {
  user: AuthUser
  tenant: AuthTenant
  iat?: number
  exp?: number
}
