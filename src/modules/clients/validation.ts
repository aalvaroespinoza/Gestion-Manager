import { z } from 'zod'

// ==========================================
// Client Validation Schemas
// ==========================================
export const docTypeSchema = z.enum(['DNI', 'CUIT', 'CUIL', 'RUT', 'RFC', 'PASSPORT', 'TAX_ID', 'OTHER'])

export const clientSchema = z.object({
  name: z.string().min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
  docType: z.string().optional().nullable(),
  docNumber: z.string().optional().nullable(),
  email: z.string().email('Formato de correo electrónico inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  creditLimit: z.coerce.number().min(0, 'El límite de crédito no puede ser negativo').default(0),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const updateClientSchema = clientSchema.partial()

export const clientFilterSchema = z.object({
  search: z.string().optional(),
  docType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ==========================================
// Inferred Types
// ==========================================
export type ClientInput = z.infer<typeof clientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientFilterInput = z.infer<typeof clientFilterSchema>
