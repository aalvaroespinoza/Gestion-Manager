// Global and shared TypeScript definitions
export * from '@/modules/auth/types'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dynamic fields configuration interface for Category
export type DynamicFieldType = 'text' | 'number' | 'boolean' | 'select' | 'date'

export interface DynamicFieldOption {
  label: string
  value: string
}

export interface DynamicFieldDefinition {
  name: string
  label: string
  type: DynamicFieldType
  required?: boolean
  options?: DynamicFieldOption[]
  defaultValue?: string | number | boolean
  placeholder?: string
  description?: string
}

export interface CategoryDynamicFieldsConfig {
  fields: DynamicFieldDefinition[]
}
