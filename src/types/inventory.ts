import { DynamicFormFieldConfig } from "@/components/dynamic-forms/types"

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED"

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  extraFieldsSchema: DynamicFormFieldConfig[]
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  categoryId: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  maxStock?: number
  status: StockStatus
  extraAttributes: Record<string, any>
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface StockAdjustment {
  productId: string
  type: "IN" | "OUT" | "SET"
  quantity: number
  reason: string
  date: string
}
