'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/modules/auth/session-utils'
import { assertRole } from '@/modules/auth/permissions'
import { logAuditTx } from '@/modules/audit/actions'
import { getNextCorrelative } from '@/modules/core/counters'
import { ApiResponse } from '@/types'
import {
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
  cancelPurchaseOrderSchema,
  purchaseOrderFilterSchema,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
  CancelPurchaseOrderInput,
  PurchaseOrderFilterInput,
} from './validation'

// ==========================================
// Purchase Orders & Stock Reception Actions
// ==========================================

/**
 * Creates a new Purchase Order in PENDING status with sequential numbering and line items
 */
export async function createPurchaseOrder(data: CreatePurchaseOrderInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user
    const validated = createPurchaseOrderSchema.parse(data)

    // Verify supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: { id: validated.supplierId, tenantId },
    })

    if (!supplier) {
      return {
        success: false,
        error: 'El proveedor seleccionado no existe o no pertenece a tu organización',
      }
    }

    // Verify products exist and belong to tenant
    const productIds = validated.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
      },
    })

    if (products.length !== productIds.length) {
      return {
        success: false,
        error: 'Uno o más productos seleccionados no existen o no pertenecen a tu organización',
      }
    }

    const orderResult = await prisma.$transaction(async (tx) => {
      // Generate sequential orderNumber (OC-00001) atomically
      const { orderNumber } = await getNextCorrelative(
        tx,
        tenantId,
        'PURCHASE_ORDER',
        'OC-',
        5
      )

      // Calculate subtotals with Prisma.Decimal precision
      let subtotalSum = new Prisma.Decimal(0)
      const itemsData = validated.items.map((item) => {
        const qtyDec = new Prisma.Decimal(item.quantity)
        const costDec = new Prisma.Decimal(item.unitCost)
        const itemSubtotal = qtyDec.mul(costDec)
        subtotalSum = subtotalSum.add(itemSubtotal)

        return {
          productId: item.productId,
          quantity: qtyDec,
          unitCost: costDec,
          subtotal: itemSubtotal,
        }
      })

      const taxDec = new Prisma.Decimal(validated.tax || 0)
      const totalDec = subtotalSum.add(taxDec)

      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          supplierId: validated.supplierId,
          userId,
          orderNumber,
          status: 'PENDING',
          subtotal: subtotalSum,
          tax: taxDec,
          total: totalDec,
          notes: validated.notes || null,
          expectedDate: validated.expectedDate ? new Date(validated.expectedDate) : null,
          items: {
            create: itemsData,
          },
        },
        include: {
          supplier: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: { product: true },
          },
        },
      })

      return po
    })

    revalidatePath('/dashboard/purchases')
    revalidatePath('/dashboard/inventory')

    return {
      success: true,
      data: orderResult,
      message: `Orden de compra ${orderResult.orderNumber} creada exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear la orden de compra',
    }
  }
}

/**
 * Receives a Purchase Order: Atomically increments product stock, optionally updates cost price, and logs audit
 */
export async function receivePurchaseOrder(data: ReceivePurchaseOrderInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user
    const validated = receivePurchaseOrderSchema.parse(data)

    const receivedOrder = await prisma.$transaction(async (tx) => {
      // 1. Verify order existence and status
      const order = await tx.purchaseOrder.findFirst({
        where: {
          id: validated.purchaseOrderId,
          tenantId,
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      if (!order) {
        throw new Error('Orden de compra no encontrada')
      }

      if (order.status === 'RECEIVED') {
        throw new Error(`La orden de compra ${order.orderNumber} ya fue recibida anteriormente`)
      }

      if (order.status === 'CANCELLED') {
        throw new Error(`No se puede recibir la orden de compra ${order.orderNumber} porque se encuentra cancelada`)
      }

      // 2. Increment stock and optionally update cost price for each product
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
            ...(validated.updateCostPrices
              ? { costPrice: item.unitCost }
              : {}),
          },
        })
      }

      // 3. Mark order as RECEIVED
      const updated = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
        include: {
          supplier: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: { product: true },
          },
        },
      })

      // 4. Record Audit Log
      await logAuditTx(tx, {
        tenantId,
        userId,
        action: 'RECEIVE_PURCHASE_ORDER',
        entity: 'PurchaseOrder',
        entityId: order.id,
        details: {
          orderNumber: order.orderNumber,
          supplierName: order.supplier.name,
          total: order.total.toNumber(),
          updateCostPrices: validated.updateCostPrices,
          itemsReceived: order.items.map((it) => ({
            productId: it.productId,
            productCode: it.product.code,
            productName: it.product.name,
            quantity: it.quantity.toNumber(),
            unitCost: it.unitCost.toNumber(),
          })),
          receivedBy: user.name || user.email,
        },
      })

      return updated
    })

    // 5. Revalidate paths
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/purchases')
    revalidatePath('/dashboard/products')
    revalidatePath('/stock')

    return {
      success: true,
      data: receivedOrder,
      message: `Mercadería de la orden ${receivedOrder.orderNumber} recibida exitosamente. Stock actualizado.`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al recibir la orden de compra',
    }
  }
}

/**
 * Cancels a pending or draft purchase order
 * Protected: Requires ADMIN or MANAGER role
 */
export async function cancelPurchaseOrder(data: CancelPurchaseOrderInput): Promise<ApiResponse<any>> {
  try {
    const user = await assertRole(['ADMIN', 'MANAGER'])
    const { tenantId, id: userId } = user
    const validated = cancelPurchaseOrderSchema.parse(data)

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id: validated.purchaseOrderId,
        tenantId,
      },
    })

    if (!order) {
      return {
        success: false,
        error: 'Orden de compra no encontrada',
      }
    }

    if (order.status === 'RECEIVED') {
      return {
        success: false,
        error: 'No se puede cancelar una orden de compra que ya ha sido recibida en inventario',
      }
    }

    if (order.status === 'CANCELLED') {
      return {
        success: false,
        error: 'La orden de compra ya se encuentra cancelada',
      }
    }

    const cancelNote = `[CANCELADA por ${user.name || user.email}]: ${validated.reason}`

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          notes: order.notes ? `${cancelNote} | ${order.notes}` : cancelNote,
        },
      })

      await logAuditTx(tx, {
        tenantId,
        userId,
        action: 'CANCEL_PURCHASE_ORDER',
        entity: 'PurchaseOrder',
        entityId: order.id,
        details: {
          orderNumber: order.orderNumber,
          reason: validated.reason,
          cancelledBy: user.name || user.email,
        },
      })

      return cancelled
    })

    revalidatePath('/dashboard/purchases')

    return {
      success: true,
      data: updated,
      message: `Orden de compra ${order.orderNumber} cancelada exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al cancelar la orden de compra',
    }
  }
}

/**
 * Retrieves a paginated list of purchase orders with filters
 */
export async function getPurchaseOrders(filters?: PurchaseOrderFilterInput): Promise<
  ApiResponse<{
    orders: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const user = await requireUser()
    const { tenantId } = user
    const { status, supplierId, startDate, endDate, page, pageSize } = purchaseOrderFilterSchema.parse(
      filters || {}
    )

    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(supplierId && { supplierId }),
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

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: {
            select: { id: true, name: true, docNumber: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener las órdenes de compra',
    }
  }
}

/**
 * Retrieves detailed purchase order information by ID
 */
export async function getPurchaseOrderById(id: string): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId } = user

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                currentStock: true,
                costPrice: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return {
        success: false,
        error: 'Orden de compra no encontrada',
      }
    }

    return {
      success: true,
      data: order,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener la orden de compra',
    }
  }
}
