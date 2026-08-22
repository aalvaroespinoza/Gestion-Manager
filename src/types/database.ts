/**
 * Strongly-typed contracts and interfaces for Multi-Tenant PostgreSQL JSONB columns
 */

// ==========================================
// 1. Tenant Settings JSONB Contract
// ==========================================
export interface TenantSettings {
  currency: string // ISO currency code, e.g. "ARS", "USD", "CLP", "EUR"
  currencySymbol: string // e.g. "$", "€", "US$"
  timezone: string // IANA timezone, e.g. "America/Argentina/Buenos_Aires"
  logoUrl?: string | null
  primaryColor?: string | null
  taxRate?: number // Percentage, e.g. 21 for 21%
  taxName?: string // e.g. "IVA", "VAT", "Tax"
  invoicePrefix?: string // e.g. "A", "B", "FAC-"
  companyLegalName?: string | null
  companyTaxId?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  receiptFooterNotes?: string | null
  allowNegativeStock?: boolean
  features?: {
    dynamicAttributes?: boolean
    barcodeScanner?: boolean
    currentAccount?: boolean
    [key: string]: boolean | undefined
  }
  [key: string]: unknown
}

// ==========================================
// 2. Dynamic Fields Configuration for Category JSONB
// ==========================================
export type DynamicFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'textarea'
  | 'color'

export interface DynamicFieldOption {
  label: string
  value: string
}

export interface DynamicFieldConfig {
  name: string // unique field key, e.g. "talle", "color", "medida", "vencimiento"
  label: string // UI human-readable label, e.g. "Talle / Medida", "Color Principal"
  type: DynamicFieldType
  required?: boolean
  options?: DynamicFieldOption[] // For 'select' and 'multiselect'
  defaultValue?: string | number | boolean | string[]
  placeholder?: string
  description?: string
  unit?: string // e.g. "cm", "kg", "litros", "gr"
  min?: number
  max?: number
  validationRegex?: string
}

export interface CategoryDynamicFieldsConfig {
  fields: DynamicFieldConfig[]
}

// ==========================================
// 3. Product Custom Attributes JSONB Contract
// ==========================================
export interface ProductCustomAttributes {
  [attributeName: string]: string | number | boolean | string[] | null | undefined
}

// ==========================================
// 4. Client Metadata JSONB Contract
// ==========================================
export interface ClientMetadata {
  taxCondition?: string // e.g. "Responsable Inscripto", "Monotributo", "Exento", "Consumidor Final"
  businessName?: string
  commercialAddress?: string
  creditDays?: number
  internalNotes?: string
  [key: string]: unknown
}

// ==========================================
// 5. SaleItem Custom Specs JSONB Contract
// ==========================================
export interface SaleItemCustomSpecs {
  attributesSnapshot?: Record<string, string | number | boolean | null | undefined>
  serialNumber?: string
  warrantyMonths?: number
  notes?: string
  [key: string]: unknown
}
