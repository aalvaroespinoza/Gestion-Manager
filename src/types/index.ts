// Global and shared TypeScript definitions
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}
