'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser, requireTenant } from '@/modules/auth/session-utils'
import { getNextCorrelative } from '@/modules/core/counters'
import { ApiResponse } from '@/types'
import { QuoteData, QuoteStatus } from '@/types/sales'
import { mockQuotes } from '@/mocks/quotesData'

export interface CreateQuoteItemInput {
  productId: string
  quantity: number
  unitPrice: number
  discountPercent?: number
  taxRatePercent?: number
}

export interface CreateQuoteInput {
  clientId?: string
  clientName?: string
  clientDoc?: string
  clientTaxCondition?: string
  validDays?: number
  items: CreateQuoteItemInput[]
  discount?: number
  tax?: number
  notes?: string
}

/**
 * In-memory store fallback for development / offline DB mode
 */
let inMemoryQuotes: QuoteData[] = [...mockQuotes]

/**
 * Creates a new Quote / Presupuesto with commercial snapshotting
 */
export async function createQuote(data: CreateQuoteInput): Promise<ApiResponse<QuoteData>> {
  try {
    let tenantId = 'tenant-demo'
    let userId = 'user-demo'
    let userName = 'Cajero Mostrador'

    try {
      const user = await requireUser()
      tenantId = user.tenantId
      userId = user.id
      userName = user.name || userName
    } catch {
      // Fallback in demo mode
    }

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: 'El presupuesto debe incluir al menos un producto.',
      }
    }

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (data.validDays || 15))

    try {
      // Intentar vía Prisma Transaction
      const quoteResult = await prisma.$transaction(async (tx) => {
        const productIds = data.items.map((i) => i.productId)
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, tenantId },
          select: { id: true, name: true, code: true, costPrice: true, salePrice: true },
        })
        const productMap = new Map(products.map((p) => [p.id, p]))

        const { orderNumber: quoteNumber } = await getNextCorrelative(
          tx,
          tenantId,
          'QUOTE',
          'PRES-',
          5
        )

        let subtotalSum = new Prisma.Decimal(0)
        const quoteItemsData = data.items.map((item) => {
          const product = productMap.get(item.productId)
          const qtyDec = new Prisma.Decimal(item.quantity)
          const priceDec = new Prisma.Decimal(item.unitPrice)
          const costDec = product ? new Prisma.Decimal(product.costPrice) : new Prisma.Decimal(0)
          const discPct = new Prisma.Decimal(item.discountPercent || 0)
          const taxPct = new Prisma.Decimal(item.taxRatePercent || 0)

          const lineGross = qtyDec.mul(priceDec)
          const lineDisc = lineGross.mul(discPct.div(100))
          const lineNet = lineGross.sub(lineDisc)
          subtotalSum = subtotalSum.add(lineNet)

          return {
            productId: item.productId,
            productCode: product?.code || `SKU-${item.productId.slice(0, 6)}`,
            productName: product?.name || 'Producto General',
            quantity: qtyDec,
            unitPrice: priceDec,
            unitCost: costDec,
            discountPercent: discPct,
            taxRatePercent: taxPct,
            subtotal: lineNet,
          }
        })

        const discDec = new Prisma.Decimal(data.discount || 0)
        const taxDec = new Prisma.Decimal(data.tax || 0)
        const totalDec = subtotalSum.sub(discDec).add(taxDec)

        const quote = await tx.quote.create({
          data: {
            tenantId,
            userId,
            clientId: data.clientId || null,
            quoteNumber,
            validUntil,
            subtotal: subtotalSum,
            discount: discDec,
            tax: taxDec,
            total: totalDec,
            status: 'DRAFT',
            notes: data.notes || null,
            items: {
              create: quoteItemsData,
            },
          },
          include: {
            items: true,
            client: true,
            user: { select: { name: true } },
          },
        })

        return quote
      })

      revalidatePath('/ventas')

      const mapped: QuoteData = {
        id: quoteResult.id,
        quoteNumber: quoteResult.quoteNumber,
        date: quoteResult.createdAt.toISOString(),
        validUntil: quoteResult.validUntil ? quoteResult.validUntil.toISOString() : undefined,
        clientId: quoteResult.clientId || undefined,
        clientName: quoteResult.client?.name || data.clientName,
        clientDoc: quoteResult.client?.docNumber || data.clientDoc,
        clientTaxCondition: data.clientTaxCondition,
        items: quoteResult.items.map((qi) => ({
          id: qi.id,
          productId: qi.productId,
          productCode: qi.productCode || undefined,
          productName: qi.productName,
          quantity: Number(qi.quantity),
          unitPrice: Number(qi.unitPrice),
          unitCost: Number(qi.unitCost),
          discountPercent: Number(qi.discountPercent),
          taxRatePercent: Number(qi.taxRatePercent),
          subtotal: Number(qi.subtotal),
        })),
        subtotal: Number(quoteResult.subtotal),
        tax: Number(quoteResult.tax),
        discount: Number(quoteResult.discount),
        total: Number(quoteResult.total),
        status: quoteResult.status as QuoteStatus,
        notes: quoteResult.notes || undefined,
        creatorName: quoteResult.user?.name || userName,
      }

      return {
        success: true,
        data: mapped,
        message: `Presupuesto ${quoteResult.quoteNumber} generado exitosamente`,
      }
    } catch (dbError) {
      // Fallback en memoria
      const nextNum = inMemoryQuotes.length + 101
      const quoteNumber = `PRES-${String(nextNum).padStart(5, '0')}`

      let subtotal = 0
      const itemsMapped = data.items.map((item, idx) => {
        const lineGross = item.quantity * item.unitPrice
        const lineDisc = lineGross * ((item.discountPercent || 0) / 100)
        const lineSubtotal = lineGross - lineDisc
        subtotal += lineSubtotal

        return {
          id: `qi-mem-${Date.now()}-${idx}`,
          productId: item.productId,
          productCode: `SKU-${item.productId.slice(0, 6)}`,
          productName: 'Producto Cotizado',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          taxRatePercent: item.taxRatePercent || 0,
          subtotal: lineSubtotal,
        }
      })

      const discount = data.discount || 0
      const tax = data.tax || 0
      const total = subtotal - discount + tax

      const newQuote: QuoteData = {
        id: `quote-${Date.now()}`,
        quoteNumber,
        date: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        clientId: data.clientId,
        clientName: data.clientName || 'Consumidor Final',
        clientDoc: data.clientDoc || '—',
        clientTaxCondition: data.clientTaxCondition || 'Consumidor Final',
        items: itemsMapped,
        subtotal,
        tax,
        discount,
        total,
        status: 'DRAFT',
        notes: data.notes,
        creatorName: userName,
      }

      inMemoryQuotes = [newQuote, ...inMemoryQuotes]

      return {
        success: true,
        data: newQuote,
        message: `Presupuesto ${quoteNumber} generado exitosamente (Modo Operativo Local)`,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al emitir el presupuesto',
    }
  }
}

/**
 * Retrieves quotes for the tenant with status filtering
 */
export async function getQuotes(filters?: {
  status?: QuoteStatus | 'ALL'
  search?: string
}): Promise<ApiResponse<QuoteData[]>> {
  try {
    let tenantId = 'tenant-demo'
    try {
      tenantId = await requireTenant()
    } catch {
      // Demo fallback
    }

    try {
      const where: Prisma.QuoteWhereInput = {
        tenantId,
        ...(filters?.status && filters.status !== 'ALL' ? { status: filters.status } : {}),
      }

      const quotes = await prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          client: true,
          user: { select: { name: true } },
        },
      })

      if (quotes.length === 0) {
        return {
          success: true,
          data: inMemoryQuotes,
        }
      }

      const mapped: QuoteData[] = quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        date: q.createdAt.toISOString(),
        validUntil: q.validUntil ? q.validUntil.toISOString() : undefined,
        clientId: q.clientId || undefined,
        clientName: q.client?.name,
        clientDoc: q.client?.docNumber || undefined,
        items: q.items.map((qi) => ({
          id: qi.id,
          productId: qi.productId,
          productCode: qi.productCode || undefined,
          productName: qi.productName,
          quantity: Number(qi.quantity),
          unitPrice: Number(qi.unitPrice),
          unitCost: Number(qi.unitCost),
          discountPercent: Number(qi.discountPercent),
          taxRatePercent: Number(qi.taxRatePercent),
          subtotal: Number(qi.subtotal),
        })),
        subtotal: Number(q.subtotal),
        tax: Number(q.tax),
        discount: Number(q.discount),
        total: Number(q.total),
        status: q.status as QuoteStatus,
        notes: q.notes || undefined,
        saleId: q.saleId || undefined,
        creatorName: q.user?.name || undefined,
      }))

      return {
        success: true,
        data: mapped,
      }
    } catch {
      // Fallback a cotizaciones en memoria
      return {
        success: true,
        data: inMemoryQuotes,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener presupuestos',
      data: inMemoryQuotes,
    }
  }
}

/**
 * Updates quote status (e.g. DRAFT -> SENT -> APPROVED -> REJECTED / EXPIRED)
 */
export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<ApiResponse<QuoteData>> {
  try {
    try {
      const tenantId = await requireTenant()
      const updated = await prisma.quote.update({
        where: { id, tenantId },
        data: { status },
        include: { items: true, client: true, user: { select: { name: true } } },
      })

      revalidatePath('/ventas')

      return {
        success: true,
        data: {
          id: updated.id,
          quoteNumber: updated.quoteNumber,
          date: updated.createdAt.toISOString(),
          validUntil: updated.validUntil?.toISOString(),
          clientId: updated.clientId || undefined,
          clientName: updated.client?.name,
          clientDoc: updated.client?.docNumber || undefined,
          items: updated.items.map((qi) => ({
            id: qi.id,
            productId: qi.productId,
            productCode: qi.productCode || undefined,
            productName: qi.productName,
            quantity: Number(qi.quantity),
            unitPrice: Number(qi.unitPrice),
            subtotal: Number(qi.subtotal),
          })),
          subtotal: Number(updated.subtotal),
          tax: Number(updated.tax),
          discount: Number(updated.discount),
          total: Number(updated.total),
          status: updated.status as QuoteStatus,
          notes: updated.notes || undefined,
          saleId: updated.saleId || undefined,
          creatorName: updated.user?.name || undefined,
        },
        message: `Estado actualizado a ${status}`,
      }
    } catch {
      // Memory fallback
      const found = inMemoryQuotes.find((q) => q.id === id)
      if (found) {
        found.status = status
        return {
          success: true,
          data: found,
          message: `Estado actualizado a ${status}`,
        }
      }
      return {
        success: false,
        error: 'Presupuesto no encontrado',
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar estado del presupuesto',
    }
  }
}
