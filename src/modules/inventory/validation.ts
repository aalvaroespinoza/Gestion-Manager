import { z } from 'zod'

// ==========================================
// 1. Dynamic Fields Validation Schemas
// ==========================================
export const dynamicFieldTypeSchema = z.enum([
  'text',
  'number',
  'boolean',
  'select',
  'multiselect',
  'date',
  'textarea',
  'color',
])

export const dynamicFieldOptionSchema = z.object({
  label: z.string().min(1, 'La etiqueta de la opción es obligatoria'),
  value: z.string().min(1, 'El valor de la opción es obligatorio'),
})

export const dynamicFieldConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del campo es obligatorio')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'El nombre del campo solo puede contener letras, números, guiones y guiones bajos'
    ),
  label: z.string().min(1, 'La etiqueta del campo es obligatoria'),
  type: dynamicFieldTypeSchema,
  required: z.boolean().optional().default(false),
  options: z.array(dynamicFieldOptionSchema).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  validationRegex: z.string().optional(),
})

export const categoryDynamicFieldsConfigSchema = z.object({
  fields: z.array(dynamicFieldConfigSchema).default([]),
})

// ==========================================
// 2. Category Validation Schema
// ==========================================
export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre de la categoría debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  dynamicFieldsConfig: categoryDynamicFieldsConfigSchema.optional().nullable(),
})

export const updateCategorySchema = categorySchema.partial()

// ==========================================
// 3. Product Validation Schemas
// ==========================================
export const productCustomAttributesSchema = z
  .record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]).optional()
  )
  .optional()
  .nullable()

export const productSchema = z.object({
  code: z.string().min(1, 'El código del producto es obligatorio'),
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0, 'El precio de costo no puede ser negativo').default(0),
  salePrice: z.coerce.number().min(0, 'El precio de venta no puede ser negativo'),
  currentStock: z.coerce.number().default(0),
  minStock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').default(0),
  customAttributes: productCustomAttributesSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional().default('ACTIVE'),
})

export const updateProductSchema = productSchema.partial()

export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ==========================================
// Inferred TypeScript Types
// ==========================================
export type DynamicFieldConfigInput = z.infer<typeof dynamicFieldConfigSchema>
export type CategoryDynamicFieldsConfigInput = z.infer<typeof categoryDynamicFieldsConfigSchema>
export type CategoryInput = z.input<typeof categorySchema>
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>
export type ProductInput = z.input<typeof productSchema>
export type UpdateProductInput = z.input<typeof updateProductSchema>
export type ProductFilterInput = z.input<typeof productFilterSchema>
