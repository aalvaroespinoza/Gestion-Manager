import { z } from 'zod'

// ==========================================
// 1. Sale Item Validation Schema
// ==========================================
export const saleItemSchema = z.object({
  productId: z.string().min(1, 'El ID del producto es obligatorio'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.coerce.number().min(0, 'El precio unitario no puede ser negativo'),
  customSpecs: z.record(z.string(), z.unknown()).optional().nullable(),
})

// ==========================================
// 2. Create Sale Validation Schema
// ==========================================
export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'TRANSFER', 'CURRENT_ACCOUNT'])
export const saleStatusSchema = z.enum(['COMPLETED', 'CANCELLED', 'PENDING'])

export const createSaleSchema = z.object({
  clientId: z.string().optional().nullable(),
  paymentMethod: paymentMethodSchema.default('CASH'),
  items: z.array(saleItemSchema).min(1, 'Debe incluir al menos un producto en la venta'),
  discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').optional().default(0),
  tax: z.coerce.number().min(0, 'El impuesto no puede ser negativo').optional().default(0),
  notes: z.string().optional().nullable(),
})

export const saleFilterSchema = z.object({
  search: z.string().optional(),
  status: saleStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  clientId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const cancelSaleSchema = z.object({
  saleId: z.string().min(1, 'El ID de la venta es obligatorio'),
  reason: z.string().min(5, 'El motivo de anulación debe tener al menos 5 caracteres'),
})

// ==========================================
// Inferred TypeScript Types
// ==========================================
export type SaleItemInput = z.infer<typeof saleItemSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>
export type SaleFilterInput = z.infer<typeof saleFilterSchema>

