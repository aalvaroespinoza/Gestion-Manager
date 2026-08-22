import { z } from 'zod'

// ==========================================
// 1. Enums
// ==========================================
export const cashMovementTypeSchema = z.enum(['INCOME', 'EXPENSE'])
export const cashShiftStatusSchema = z.enum(['OPEN', 'CLOSED'])

// ==========================================
// 2. Shift Operations Validation Schemas
// ==========================================
export const openShiftSchema = z.object({
  initialAmount: z.coerce.number().min(0, 'El monto inicial en caja debe ser mayor o igual a 0').default(0),
  notes: z.string().optional().nullable(),
})

export const closeShiftSchema = z.object({
  actualAmount: z.coerce.number().min(0, 'El monto físico en caja no puede ser negativo'),
  notes: z.string().optional().nullable(),
})

export const cashMovementSchema = z.object({
  type: cashMovementTypeSchema,
  amount: z.coerce.number().positive('El monto del movimiento debe ser mayor a 0'),
  reason: z.string().min(3, 'El motivo debe tener al menos 3 caracteres'),
})

export const cashShiftFilterSchema = z.object({
  status: cashShiftStatusSchema.optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ==========================================
// Inferred TypeScript Types
// ==========================================
export type OpenShiftInput = z.infer<typeof openShiftSchema>
export type CloseShiftInput = z.infer<typeof closeShiftSchema>
export type CashMovementInput = z.infer<typeof cashMovementSchema>
export type CashShiftFilterInput = z.infer<typeof cashShiftFilterSchema>
