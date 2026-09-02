'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireTenant, getCurrentUser } from '@/modules/auth/session-utils'
import { ApiResponse } from '@/types'
import {
  categorySchema,
  updateCategorySchema,
  productSchema,
  updateProductSchema,
  productFilterSchema,
  CategoryInput,
  UpdateCategoryInput,
  ProductInput,
  UpdateProductInput,
  ProductFilterInput,
} from './validation'

export interface AdjustStockInput {
  productId: string
  type: 'IN' | 'OUT' | 'SET'
  quantity: number
  reason: string
  documentRef?: string
}

// ==========================================
// Category Server Actions
// ==========================================

/**
 * Creates a new category for the current tenant
 */
export async function createCategory(data: CategoryInput): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const validated = categorySchema.parse(data)

    // Check if category name already exists in tenant
    const existing = await prisma.category.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: validated.name,
        },
      },
    })

    if (existing) {
      return {
        success: false,
        error: `Ya existe una categoría con el nombre "${validated.name}"`,
      }
    }

    const category = await prisma.category.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        dynamicFieldsConfig: validated.dynamicFieldsConfig as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/stock')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/categories')

    return {
      success: true,
      data: category,
      message: 'Categoría creada exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear la categoría',
    }
  }
}

/**
 * Retrieves all categories belonging to the current tenant
 */
export async function getCategories(): Promise<ApiResponse<any[]>> {
  try {
    const tenantId = await requireTenant()

    const categories = await prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return {
      success: true,
      data: categories,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener las categorías',
    }
  }
}

/**
 * Updates a category ensuring tenant ownership
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryInput
): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const validated = updateCategorySchema.parse(data)

    const existing = await prisma.category.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: validated.name,
          },
        },
      })
      if (duplicate) {
        return {
          success: false,
          error: `Ya existe otra categoría con el nombre "${validated.name}"`,
        }
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.dynamicFieldsConfig !== undefined && {
          dynamicFieldsConfig: validated.dynamicFieldsConfig as unknown as Prisma.InputJsonValue,
        }),
      },
    })

    revalidatePath('/stock')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/categories')

    return {
      success: true,
      data: updated,
      message: 'Categoría actualizada exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar la categoría',
    }
  }
}

// ==========================================
// Product Server Actions
// ==========================================

/**
 * Creates a new product for the current tenant
 */
export async function createProduct(data: ProductInput): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const validated = productSchema.parse(data)

    // Check code uniqueness within tenant
    if (validated.code) {
      const existingCode = await prisma.product.findFirst({
        where: {
          tenantId,
          code: validated.code,
        },
      })

      if (existingCode) {
        return {
          success: false,
          error: `Ya existe un producto con el código "${validated.code}"`,
        }
      }
    }

    // Verify category exists and belongs to tenant if provided
    if (validated.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validated.categoryId,
          tenantId,
        },
      })

      if (!category) {
        return {
          success: false,
          error: 'La categoría seleccionada no existe o no pertenece a tu organización',
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        code: validated.code,
        name: validated.name,
        description: validated.description,
        categoryId: validated.categoryId,
        costPrice: new Prisma.Decimal(validated.costPrice),
        salePrice: new Prisma.Decimal(validated.salePrice),
        currentStock: new Prisma.Decimal(validated.currentStock),
        minStock: new Prisma.Decimal(validated.minStock),
        customAttributes: validated.customAttributes as unknown as Prisma.InputJsonValue,
        status: validated.status,
      },
      include: {
        category: true,
      },
    })

    revalidatePath('/stock')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/products')

    return {
      success: true,
      data: product,
      message: 'Producto creado exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear el producto',
    }
  }
}

/**
 * Updates a product verifying tenant ownership
 */
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const validated = updateProductSchema.parse(data)

    const existingProduct = await prisma.product.findFirst({
      where: { id, tenantId },
    })

    if (!existingProduct) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    // Check code uniqueness within tenant if code was modified
    if (validated.code && validated.code !== existingProduct.code) {
      const duplicateCode = await prisma.product.findFirst({
        where: {
          tenantId,
          code: validated.code,
          id: { not: id },
        },
      })

      if (duplicateCode) {
        return {
          success: false,
          error: `Ya existe otro producto con el código "${validated.code}"`,
        }
      }
    }

    // Verify category if updated
    if (validated.categoryId && validated.categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validated.categoryId,
          tenantId,
        },
      })

      if (!category) {
        return {
          success: false,
          error: 'La categoría seleccionada no existe o no pertenece a tu organización',
        }
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(validated.code !== undefined && { code: validated.code }),
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.costPrice !== undefined && {
          costPrice: new Prisma.Decimal(validated.costPrice),
        }),
        ...(validated.salePrice !== undefined && {
          salePrice: new Prisma.Decimal(validated.salePrice),
        }),
        ...(validated.currentStock !== undefined && {
          currentStock: new Prisma.Decimal(validated.currentStock),
        }),
        ...(validated.minStock !== undefined && {
          minStock: new Prisma.Decimal(validated.minStock),
        }),
        ...(validated.customAttributes !== undefined && {
          customAttributes: validated.customAttributes as unknown as Prisma.InputJsonValue,
        }),
        ...(validated.status !== undefined && { status: validated.status }),
      },
      include: {
        category: true,
      },
    })

    revalidatePath('/stock')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/products')

    return {
      success: true,
      data: updated,
      message: 'Producto actualizado exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar el producto',
    }
  }
}

/**
 * Adjusts product stock and records an audit log entry
 */
export async function adjustStock(data: AdjustStockInput): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const { productId, type, quantity, reason, documentRef } = data

    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    })

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    const currentStockNum = Number(product.currentStock)
    let newStock = currentStockNum

    if (type === 'IN') {
      newStock = currentStockNum + quantity
    } else if (type === 'OUT') {
      if (quantity > currentStockNum) {
        return {
          success: false,
          error: `No es posible descontar ${quantity} unidades. El stock actual es de ${currentStockNum} un.`,
        }
      }
      newStock = Math.max(0, currentStockNum - quantity)
    } else if (type === 'SET') {
      newStock = Math.max(0, quantity)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: new Prisma.Decimal(newStock),
        },
        include: {
          category: true,
        },
      })

      const user = await getCurrentUser()
      if (user) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: user.id,
            action: 'MANUAL_STOCK_ADJUSTMENT',
            entity: 'Product',
            entityId: productId,
            details: {
              productCode: product.code,
              productName: product.name,
              type,
              quantity,
              previousStock: currentStockNum,
              newStock,
              reason,
              documentRef,
            },
          },
        })
      }

      return updatedProduct
    })

    revalidatePath('/stock')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/products')

    return {
      success: true,
      data: updated,
      message: 'Ajuste de stock registrado exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al realizar el ajuste de stock',
    }
  }
}

/**
 * Deletes or archives a product ensuring tenant ownership
 */
export async function deleteProduct(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const tenantId = await requireTenant()

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { saleItems: true, purchaseOrderItems: true },
        },
      },
    })

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    // If product has historical sale items or purchase orders, soft delete / archive it to maintain database integrity
    if (product._count.saleItems > 0 || product._count.purchaseOrderItems > 0) {
      await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      })
    } else {
      await prisma.product.delete({
        where: { id },
      })
    }

    revalidatePath('/stock')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/products')
    revalidatePath('/ventas')

    return {
      success: true,
      data: { id },
      message: 'Producto dado de baja exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al eliminar el producto',
    }
  }
}

/**
 * Retrieves paginated products with text search, category filtering, and tenant isolation
 */
export async function getProducts(filters?: ProductFilterInput): Promise<
  ApiResponse<{
    products: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const tenantId = await requireTenant()
    const { search, categoryId, status, page, pageSize } = productFilterSchema.parse(filters || {})

    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...(categoryId && { categoryId }),
      ...(status ? { status } : { status: { not: 'ARCHIVED' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        products,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener los productos',
    }
  }
}

/**
 * Retrieves a single product by ID for the current tenant
 */
export async function getProductById(id: string): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
      },
    })

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    return {
      success: true,
      data: product,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el producto',
    }
  }
}
