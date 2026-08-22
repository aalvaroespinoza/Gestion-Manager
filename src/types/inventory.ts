import { DynamicFormFieldConfig } from "@/components/dynamic-forms/types"

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED"

export interface Category {
  id: string
  name: string
  slug?: string
  description?: string
  dynamicFieldsConfig: DynamicFormFieldConfig[]
}

export interface Product {
  id: string
  code: string // SKU / Código único
  name: string
  description?: string
  categoryId: string
  categoryName?: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  status: StockStatus
  customAttributes: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

export interface ProductFormData {
  code: string
  name: string
  description?: string
  categoryId: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  customAttributes: Record<string, any>
}
