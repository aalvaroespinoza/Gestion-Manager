// Global and shared TypeScript definitions
export * from '@/modules/auth/types'
export * from '@/modules/cash-register/types'
export * from './database'
export * from './inventory'
export * from './sales'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
