// Global and shared TypeScript definitions
export * from '@/modules/auth/types'
export * from './database'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
