export type DynamicFormFieldType =
  | "text"
  | "number"
  | "select"
  | "boolean"
  | "email"
  | "password"
  | "textarea"

export interface DynamicFormOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface DynamicFormFieldConfig {
  name: string
  label: string
  type: DynamicFormFieldType
  placeholder?: string
  description?: string
  defaultValue?: any
  options?: DynamicFormOption[]
  required?: boolean
  requiredMessage?: string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: {
    regex: string
    message: string
  }
  disabled?: boolean
  readOnly?: boolean
  colSpan?: 1 | 2 | 3 | 4 | "full"
}

export interface DynamicFormSchemaConfig {
  id?: string
  title?: string
  description?: string
  fields: DynamicFormFieldConfig[]
  submitText?: string
  resetText?: string
  showReset?: boolean
  columns?: 1 | 2 | 3 | 4
}
