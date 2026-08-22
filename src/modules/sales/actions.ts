'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/modules/auth/session-utils'
import { ApiResponse } from '@/types'
import { TenantSettings } from '@/types/database'
import {
  createSaleSchema,
  saleFilterSchema,
  CreateSaleInput,
  SaleFilterInput,
} from './validation'

// ==========================================
// Sales Processing Engine (Atomic Transactions)
// ==========================================

/**
 * Creates an atomic sale transaction with strict stock verification, decrement, and invoice correlative generation
 */
export async function createSale(data: CreateSaleInput): Promise<ApiResponse<any>> {
  try {
    // Paso A: Validar la sesión y extraer el tenantId y userId
    const user = await requireUser()
    const { tenantId, id: userId } = user

    // Validar datos de entrada con Zod
    const validated = createSaleSchema.parse(data)

    // Ejecución atómica en transacción
    const saleResult = await prisma.$transaction(async (tx) => {
      // Paso B: Verificar existencia de productos y stock suficiente
      const productIds = validated.items.map((item) => item.productId)
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          tenantId,
        },
      })

      const productMap = new Map(products.map((p) => [p.id, p]))

      // Verificar que todos los productos existen y pertenecen al tenant
      for (const item of validated.items) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw new Error(`El producto con ID "${item.productId}" no existe o no pertenece a tu organización`)
        }

        if (product.status !== 'ACTIVE') {
          throw new Error(`El producto "${product.name}" no está activo para la venta`)
        }

        const currentStockNum = product.currentStock.toNumber()
        if (currentStockNum < item.quantity) {
          throw new Error(
            `Stock insuficiente para el producto "${product.name}". Stock disponible: ${currentStockNum}, solicitado: ${item.quantity}`
          )
        }
      }

      // Paso C: Descontar el stock de cada producto
      for (const item of validated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: new Prisma.Decimal(item.quantity),
            },
          },
        })
      }

      // Paso D: Generar el número correlativo de comprobante para el tenant
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      })

      const tenantSettings = (tenant?.settings as unknown as TenantSettings) || {}
      const prefix = tenantSettings.invoicePrefix || 'INV-'

      // Obtener el conteo actual de ventas para este tenant
      const saleCount = await tx.sale.count({
        where: { tenantId },
      })

      let nextNumber = saleCount + 1
      let invoiceNumber = `${prefix}${String(nextNumber).padStart(5, '0')}`

      // Garantizar que invoiceNumber sea único para el tenant
      let isDuplicate = await tx.sale.findUnique({
        where: {
          tenantId_invoiceNumber: {
            tenantId,
            invoiceNumber,
          },
        },
      })

      while (isDuplicate) {
        nextNumber += 1
        invoiceNumber = `${prefix}${String(nextNumber).padStart(5, '0')}`
        isDuplicate = await tx.sale.findUnique({
          where: {
            tenantId_invoiceNumber: {
              tenantId,
              invoiceNumber,
            },
          },
        })
      }

      // Paso E: Calcular subtotales y total
      let subtotalSum = 0
      const saleItemsData = validated.items.map((item) => {
        const product = productMap.get(item.productId)!
        const itemSubtotal = item.quantity * item.unitPrice
        subtotalSum += itemSubtotal

        return {
          productId: item.productId,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          subtotal: new Prisma.Decimal(itemSubtotal),
          customSpecs: (item.customSpecs ||
            product.customAttributes ||
            {}) as unknown as Prisma.InputJsonValue,
        }
      })

      const discount = validated.discount || 0
      const tax = validated.tax || 0
      const total = Math.max(0, subtotalSum - discount + tax)

      // Look up active open cash shift for this user and tenant
      const activeCashShift = await tx.cashShift.findFirst({
        where: {
          tenantId,
          userId,
          status: 'OPEN',
        },
        select: { id: true },
      })

      // Registrar la cabecera Sale y los ítems SaleItem
      const sale = await tx.sale.create({
        data: {
          tenantId,
          userId,
          clientId: validated.clientId || null,
          cashShiftId: activeCashShift?.id || null,
          invoiceNumber,
          subtotal: new Prisma.Decimal(subtotalSum),
          discount: new Prisma.Decimal(discount),
          tax: new Prisma.Decimal(tax),
          total: new Prisma.Decimal(total),
          paymentMethod: validated.paymentMethod,
          notes: validated.notes || null,
          status: 'COMPLETED',
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          client: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return sale
    })

    // Paso F: Revalidar rutas
    revalidatePath('/dashboard/sales')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/products')
    revalidatePath('/dashboard/cash-register')

    return {
      success: true,
      data: saleResult,
      message: `Venta ${saleResult.invoiceNumber} registrada exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al procesar la venta',
    }
  }
}

/**
 * Retrieves paginated sales history with filters and multi-tenant isolation
 */
export async function getSales(filters?: SaleFilterInput): Promise<
  ApiResponse<{
    sales: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const user = await requireUser()
    const { tenantId } = user
    const { search, status, paymentMethod, clientId, userId, startDate, endDate, page, pageSize } =
      saleFilterSchema.parse(filters || {})

    const where: Prisma.SaleWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(paymentMethod && { paymentMethod }),
      ...(clientId && { clientId }),
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              docNumber: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.sale.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        sales,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener las ventas',
    }
  }
}

/**
 * Retrieves full details of a specific sale transaction by ID
 */
export async function getSaleById(id: string): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId } = user

    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!sale) {
      return {
        success: false,
        error: 'Venta no encontrada',
      }
    }

    return {
      success: true,
      data: sale,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener la venta',
    }
  }
}
