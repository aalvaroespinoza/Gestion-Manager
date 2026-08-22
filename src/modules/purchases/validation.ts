import { z } from 'zod'

// ==========================================
// Purchase Orders Validation Schemas
// ==========================================

export const purchaseOrderStatusSchema = z.enum(['DRAFT', 'PENDING', 'RECEIVED', 'CANCELLED'])

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'El ID del producto es obligatorio'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unitCost: z.coerce.number().min(0, 'El costo unitario no puede ser negativo'),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'El proveedor es obligatorio'),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe incluir al menos un producto en la orden'),
  tax: z.coerce.number().min(0, 'El impuesto no puede ser negativo').optional().default(0),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const receivePurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().min(1, 'El ID de la orden de compra es obligatorio'),
  updateCostPrices: z.boolean().default(true),
})

export const cancelPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().min(1, 'El ID de la orden de compra es obligatorio'),
  reason: z.string().min(5, 'El motivo de anulación debe tener al menos 5 caracteres'),
})

export const purchaseOrderFilterSchema = z.object({
  status: purchaseOrderStatusSchema.optional(),
  supplierId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ==========================================
// Inferred TypeScript Types
// ==========================================
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>
export type CancelPurchaseOrderInput = z.infer<typeof cancelPurchaseOrderSchema>
export type PurchaseOrderFilterInput = z.infer<typeof purchaseOrderFilterSchema>
