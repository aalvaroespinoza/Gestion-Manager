import { z } from 'zod'

// ==========================================
// Supplier Validation Schemas
// ==========================================
export const supplierSchema = z.object({
  name: z.string().min(2, 'El nombre del proveedor debe tener al menos 2 caracteres'),
  docType: z.string().optional().nullable(),
  docNumber: z.string().min(5, 'El número de documento debe tener al menos 5 caracteres').optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const updateSupplierSchema = supplierSchema.partial()

export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type SupplierInput = z.infer<typeof supplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
export type SupplierFilterInput = z.infer<typeof supplierFilterSchema>
