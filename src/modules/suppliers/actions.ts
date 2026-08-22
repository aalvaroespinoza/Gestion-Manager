'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/modules/auth/session-utils'
import { ApiResponse } from '@/types'
import {
  supplierSchema,
  updateSupplierSchema,
  supplierFilterSchema,
  SupplierInput,
  UpdateSupplierInput,
  SupplierFilterInput,
} from './validation'

// ==========================================
// Suppliers CRUD Server Actions
// ==========================================

/**
 * Creates a new supplier associated with the authenticated tenant
 */
export async function createSupplier(data: SupplierInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId } = user
    const validated = supplierSchema.parse(data)

    // Check for duplicate docNumber within tenant if provided
    if (validated.docNumber) {
      const existing = await prisma.supplier.findFirst({
        where: {
          tenantId,
          docNumber: validated.docNumber,
        },
      })

      if (existing) {
        return {
          success: false,
          error: `Ya existe un proveedor registrado con el documento "${validated.docNumber}"`,
        }
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: validated.name,
        docType: validated.docType || null,
        docNumber: validated.docNumber || null,
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
        contactPerson: validated.contactPerson || null,
        metadata: (validated.metadata || {}) as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/dashboard/suppliers')
    revalidatePath('/dashboard/purchases')

    return {
      success: true,
      data: supplier,
      message: `Proveedor "${supplier.name}" creado exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear el proveedor',
    }
  }
}

/**
 * Updates an existing supplier ensuring multi-tenant isolation
 */
export async function updateSupplier(id: string, data: UpdateSupplierInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId } = user
    const validated = updateSupplierSchema.parse(data)

    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Proveedor no encontrado en tu organización',
      }
    }

    // Check docNumber uniqueness if updating
    if (validated.docNumber && validated.docNumber !== existing.docNumber) {
      const duplicate = await prisma.supplier.findFirst({
        where: {
          tenantId,
          docNumber: validated.docNumber,
          id: { not: id },
        },
      })

      if (duplicate) {
        return {
          success: false,
          error: `Ya existe otro proveedor registrado con el documento "${validated.docNumber}"`,
        }
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.docType !== undefined && { docType: validated.docType }),
        ...(validated.docNumber !== undefined && { docNumber: validated.docNumber }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.address !== undefined && { address: validated.address }),
        ...(validated.contactPerson !== undefined && { contactPerson: validated.contactPerson }),
        ...(validated.metadata !== undefined && {
          metadata: (validated.metadata || {}) as unknown as Prisma.InputJsonValue,
        }),
      },
    })

    revalidatePath('/dashboard/suppliers')
    revalidatePath('/dashboard/purchases')

    return {
      success: true,
      data: updated,
      message: `Proveedor "${updated.name}" actualizado exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar el proveedor',
    }
  }
}

/**
 * Deletes a supplier if no purchase orders are linked
 */
export async function deleteSupplier(id: string): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId } = user

    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    })

    if (!supplier) {
      return {
        success: false,
        error: 'Proveedor no encontrado',
      }
    }

    if (supplier._count.purchaseOrders > 0) {
      return {
        success: false,
        error: `No se puede eliminar el proveedor "${supplier.name}" porque tiene ${supplier._count.purchaseOrders} órdenes de compra asociadas.`,
      }
    }

    await prisma.supplier.delete({
      where: { id },
    })

    revalidatePath('/dashboard/suppliers')
    revalidatePath('/dashboard/purchases')

    return {
      success: true,
      data: { id },
      message: `Proveedor "${supplier.name}" eliminado exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al eliminar el proveedor',
    }
  }
}

/**
 * Retrieves a paginated list of suppliers with search filters
 */
export async function getSuppliers(filters?: SupplierFilterInput): Promise<
  ApiResponse<{
    suppliers: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const user = await requireUser()
    const { tenantId } = user
    const { search, page, pageSize } = supplierFilterSchema.parse(filters || {})

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { docNumber: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        suppliers,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener los proveedores',
    }
  }
}

/**
 * Retrieves a supplier by ID with purchase history
 */
export async function getSupplierById(id: string): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId } = user

    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true },
            },
            _count: {
              select: { items: true },
            },
          },
        },
        _count: {
          select: { purchaseOrders: true },
        },
      },
    })

    if (!supplier) {
      return {
        success: false,
        error: 'Proveedor no encontrado',
      }
    }

    return {
      success: true,
      data: supplier,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el proveedor',
    }
  }
}
