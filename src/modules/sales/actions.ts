'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/modules/auth/session-utils'
import { assertRole } from '@/modules/auth/permissions'
import { logAuditTx } from '@/modules/audit/actions'
import { getNextCorrelative } from '@/modules/core/counters'
import { ApiResponse } from '@/types'
import { TenantSettings } from '@/types/database'
import {
  createSaleSchema,
  cancelSaleSchema,
  saleFilterSchema,
  CreateSaleInput,
  CancelSaleInput,
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

      // Paso B: Descuento atómico condicional de stock directamente en PostgreSQL
      // Evita race conditions: solo descuenta si currentStock >= cantidad solicitada
      for (const item of validated.items) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw new Error(`El producto con ID "${item.productId}" no existe o no pertenece a tu organización`)
        }

        if (product.status !== 'ACTIVE') {
          throw new Error(`El producto "${product.name}" no está activo para la venta`)
        }

        const requestedQty = new Prisma.Decimal(item.quantity)

        // Sentencia atómica condicional: si no hay stock suficiente, updatedRows será 0
        const updatedRows = await tx.$executeRaw`
          UPDATE "Product"
          SET "currentStock" = "currentStock" - ${requestedQty}::decimal(12, 2)
          WHERE "id" = ${item.productId}
            AND "tenantId" = ${tenantId}
            AND "status" = 'ACTIVE'
            AND "currentStock" >= ${requestedQty}::decimal(12, 2);
        `

        if (updatedRows === 0) {
          throw new Error(
            `Stock insuficiente o cambio concurrente para el producto "${product.name}". La venta no pudo procesarse.`
          )
        }
      }

      // Paso C: Generar correlativo atómico sin colisiones (TenantCounter)
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      })

      const tenantSettings = (tenant?.settings as unknown as TenantSettings) || {}
      const prefix = tenantSettings.invoicePrefix || 'INV-'

      const { orderNumber: invoiceNumber } = await getNextCorrelative(
        tx,
        tenantId,
        'INVOICE',
        prefix,
        5
      )

      // Paso D: Calcular subtotales y total con precisión contable Prisma.Decimal
      let subtotalSum = new Prisma.Decimal(0)
      const saleItemsData = validated.items.map((item) => {
        const product = productMap.get(item.productId)!
        const qtyDec = new Prisma.Decimal(item.quantity)
        const priceDec = new Prisma.Decimal(item.unitPrice)
        const itemSubtotal = qtyDec.mul(priceDec)
        subtotalSum = subtotalSum.add(itemSubtotal)

        return {
          productId: item.productId,
          quantity: qtyDec,
          unitPrice: priceDec,
          subtotal: itemSubtotal,
          customSpecs: (item.customSpecs ||
            product.customAttributes ||
            {}) as unknown as Prisma.InputJsonValue,
        }
      })

      const discountDec = new Prisma.Decimal(validated.discount || 0)
      const taxDec = new Prisma.Decimal(validated.tax || 0)
      const rawTotal = subtotalSum.sub(discountDec).add(taxDec)
      const totalDec = rawTotal.isNegative() ? new Prisma.Decimal(0) : rawTotal

      // Paso E: Validar turno de caja activo (si aplica)
      const activeCashShift = await tx.cashShift.findFirst({
        where: {
          tenantId,
          userId,
          status: 'OPEN',
        },
        select: { id: true, status: true },
      })

      // Registrar la cabecera Sale y los ítems SaleItem
      const sale = await tx.sale.create({
        data: {
          tenantId,
          userId,
          clientId: validated.clientId || null,
          cashShiftId: activeCashShift?.id || null,
          invoiceNumber,
          subtotal: subtotalSum,
          discount: discountDec,
          tax: taxDec,
          total: totalDec,
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
    revalidatePath('/ventas')
    revalidatePath('/stock')
    revalidatePath('/dashboard')
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
              docType: true,
              docNumber: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
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

/**
 * Cancels a completed sale, restores product stock, adjusts cash register if shift is open, and logs audit
 * Protected: Requires ADMIN or MANAGER role
 */
export async function cancelSale(data: CancelSaleInput): Promise<ApiResponse<any>> {
  try {
    // RBAC: Restricted exclusively to ADMIN and MANAGER
    const user = await assertRole(['ADMIN', 'MANAGER'])
    const { tenantId, id: userId } = user
    const validated = cancelSaleSchema.parse(data)

    // Paso A: Verificar que la venta exista, pertenezca al tenantId actual y su estado sea COMPLETED
    const sale = await prisma.sale.findFirst({
      where: {
        id: validated.saleId,
        tenantId,
      },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return {
        success: false,
        error: 'Venta no encontrada en tu organización',
      }
    }

    if (sale.status === 'CANCELLED') {
      return {
        success: false,
        error: `La venta ${sale.invoiceNumber} ya se encuentra anulada`,
      }
    }

    if (sale.status !== 'COMPLETED') {
      return {
        success: false,
        error: `Solo se pueden anular ventas en estado COMPLETADA. Estado actual: ${sale.status}`,
      }
    }

    // Paso B: Iniciar transacción atómica
    const cancelledSale = await prisma.$transaction(async (tx) => {
      // 1. Reintegrar el stock de cada producto involucrado
      for (const item of sale.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          })
        }
      }

      // 2. Si la venta estuvo asociada a un turno de caja que aún está OPEN, registrar egreso manual
      if (sale.cashShiftId && sale.paymentMethod === 'CASH') {
        const openShift = await tx.cashShift.findFirst({
          where: {
            id: sale.cashShiftId,
            tenantId,
            status: 'OPEN',
          },
        })

        if (openShift) {
          await tx.cashMovement.create({
            data: {
              tenantId,
              userId,
              cashShiftId: openShift.id,
              type: 'EXPENSE',
              amount: sale.total,
              reason: `Reintegro por anulación de comprobante ${sale.invoiceNumber}: ${validated.reason}`,
            },
          })
        }
      }

      // 3. Actualizar estado de la venta a CANCELLED y registrar motivo
      const cancelNote = `[ANULADA por ${user.name || user.email}]: ${validated.reason}`
      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'CANCELLED',
          notes: sale.notes ? `${cancelNote} | ${sale.notes}` : cancelNote,
        },
        include: {
          client: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
        },
      })

      // 4. Registrar auditoría de operación crítica
      await logAuditTx(tx, {
        tenantId,
        userId,
        action: 'CANCEL_SALE',
        entity: 'Sale',
        entityId: sale.id,
        details: {
          invoiceNumber: sale.invoiceNumber,
          total: sale.total.toNumber(),
          reason: validated.reason,
          itemsCount: sale.items.length,
          cancelledBy: user.name || user.email,
          cancelledByRole: user.role,
        },
      })

      return updated
    })

    // Paso C: Revalidar rutas
    revalidatePath('/dashboard/sales')
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/products')
    revalidatePath('/dashboard/cash-register')
    revalidatePath('/ventas')
    revalidatePath('/stock')

    return {
      success: true,
      data: cancelledSale,
      message: `Venta ${sale.invoiceNumber} anulada exitosamente y stock restituido`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al anular la venta',
    }
  }
}

