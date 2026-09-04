import { DynamicFormFieldConfig } from "@/components/dynamic-forms/types"

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED"

export type StockAdjustmentType = "IN" | "OUT" | "SET"

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

export type KardexMovementType =
  | "INITIAL_BALANCE"
  | "PURCHASE_IN"
  | "SALE_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT_ADD"
  | "ADJUSTMENT_SUB"
  | "RETURN_IN"
  | "RETURN_OUT"

export interface StockMovement {
  id: string
  productId: string
  productName?: string
  productCode?: string
  type: StockAdjustmentType | KardexMovementType
  quantity: number
  previousStock: number
  newStock: number
  unitCost?: number
  totalCost?: number
  reason?: string
  documentRef?: string
  referenceType?: string | null
  referenceId?: string | null
  userId?: string | null
  userName?: string | null
  createdAt: string
}

export interface KardexEntry {
  id: string
  productId: string
  productName?: string
  productCode?: string
  type: KardexMovementType
  quantity: number // Positivo (entrada) o negativo (salida)
  previousStock: number
  newStock: number
  unitCost: number
  totalCost: number
  referenceType?: string | null // "SALE", "PURCHASE_ORDER", "MANUAL_ADJUSTMENT", "INITIAL_BALANCE"
  referenceId?: string | null
  reason?: string | null
  userId?: string | null
  userName?: string | null
  createdAt: string
}
