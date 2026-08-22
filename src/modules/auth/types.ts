import { UserRole, UserStatus, TenantPlan, TenantStatus } from '@prisma/client'

export type { UserRole, UserStatus, TenantPlan, TenantStatus }

export interface AuthUser {
  id: string
  tenantId: string
  email: string
  name?: string | null
  role: UserRole
  status?: UserStatus
}

export interface SessionPayload {
  userId: string
  tenantId: string
  role: UserRole
  email: string
  name?: string | null
  iat?: number
  exp?: number
}
