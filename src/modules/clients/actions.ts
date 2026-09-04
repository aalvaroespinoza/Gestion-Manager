'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireTenant, requireUser } from '@/modules/auth/session-utils'
import { logAuditTx } from '@/modules/audit/actions'
import { getNextCorrelative } from '@/modules/core/counters'
import { ApiResponse } from '@/types'
import {
  clientSchema,
  updateClientSchema,
  clientFilterSchema,
  registerPaymentSchema,
  clientPaymentFilterSchema,
  ClientInput,
  UpdateClientInput,
  ClientFilterInput,
  RegisterPaymentInput,
  ClientPaymentFilterInput,
} from './validation'

// ==========================================
// Client Management & Current Account Actions
// ==========================================

/**
 * Creates a new client bound to the active tenant
 */
export async function createClient(data: ClientInput | Record<string, any>): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const raw = data as Record<string, any>

    // Normalize field names from dynamic forms or direct inputs
    const normalizedData: ClientInput = {
      name: (raw.name || raw.businessName || '').trim(),
      docType: raw.docType || (raw.rut ? 'RUT' : 'DNI'),
      docNumber: (raw.docNumber || raw.rut || '').trim() || null,
      email: (raw.email || '').trim() || null,
      phone: (raw.phone || '').trim() || null,
      address: (raw.address || '').trim() || (raw.city ? String(raw.city).trim() : null),
      creditLimit: raw.creditLimit !== undefined && raw.creditLimit !== null
        ? Number(raw.creditLimit)
        : raw.isCreditAllowed ? 1000000 : 0,
      metadata: (raw.metadata || {
        city: raw.city || null,
        isCreditAllowed: Boolean(raw.isCreditAllowed),
      }) as Record<string, any>,
    }

    const validated = clientSchema.parse(normalizedData)

    // Check unique docNumber per tenant if provided
    if (validated.docNumber) {
      const existingDoc = await prisma.client.findFirst({
        where: {
          tenantId,
          docNumber: validated.docNumber,
        },
      })

      if (existingDoc) {
        return {
          success: false,
          error: `Ya existe un cliente con el documento "${validated.docNumber}" en tu organización`,
        }
      }
    }

    const client = await prisma.client.create({
      data: {
        tenantId,
        name: validated.name,
        docType: validated.docType || null,
        docNumber: validated.docNumber || null,
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
        creditLimit: new Prisma.Decimal(validated.creditLimit || 0),
        metadata: (validated.metadata || {}) as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/clientes')
    revalidatePath('/dashboard/clients')
    revalidatePath('/ventas')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: client,
      message: 'Cliente creado exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear el cliente',
    }
  }
}

/**
 * Updates a client verifying tenant ownership
 */
export async function updateClient(
  id: string,
  data: UpdateClientInput
): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const validated = updateClientSchema.parse(data)

    const existing = await prisma.client.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    // Check unique docNumber per tenant if modified
    if (validated.docNumber && validated.docNumber !== existing.docNumber) {
      const duplicateDoc = await prisma.client.findFirst({
        where: {
          tenantId,
          docNumber: validated.docNumber,
          id: { not: id },
        },
      })

      if (duplicateDoc) {
        return {
          success: false,
          error: `Ya existe otro cliente con el documento "${validated.docNumber}"`,
        }
      }
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.docType !== undefined && { docType: validated.docType }),
        ...(validated.docNumber !== undefined && { docNumber: validated.docNumber }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.address !== undefined && { address: validated.address || null }),
        ...(validated.creditLimit !== undefined && {
          creditLimit: new Prisma.Decimal(validated.creditLimit),
        }),
        ...(validated.metadata !== undefined && {
          metadata: validated.metadata as unknown as Prisma.InputJsonValue,
        }),
      },
    })

    revalidatePath('/clientes')
    revalidatePath('/dashboard/clients')
    revalidatePath('/ventas')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updated,
      message: 'Cliente actualizado exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar el cliente',
    }
  }
}

/**
 * Deletes a client ensuring tenant ownership and relational integrity
 */
export async function deleteClient(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const tenantId = await requireTenant()

    const client = await prisma.client.findFirst({
      where: { id, tenantId },
    })

    if (!client) {
      return {
        success: false,
        error: 'Cliente no encontrado o no pertenece a tu organización',
      }
    }

    await prisma.client.delete({
      where: { id },
    })

    revalidatePath('/clientes')
    revalidatePath('/dashboard/clients')
    revalidatePath('/ventas')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: { id },
      message: 'Cliente eliminado exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al eliminar el cliente',
    }
  }
}

/**
 * Retrieves paginated clients with search and current account balance calculation
 */
export async function getClients(filters?: ClientFilterInput): Promise<
  ApiResponse<{
    clients: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const tenantId = await requireTenant()
    const { search, docType, page, pageSize } = clientFilterSchema.parse(filters || {})

    const where: Prisma.ClientWhereInput = {
      tenantId,
      ...(docType && { docType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { docNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          sales: {
            where: {
              status: { not: 'CANCELLED' },
              OR: [
                { paymentMethod: 'CURRENT_ACCOUNT' },
                { status: 'PENDING' },
              ],
            },
            select: {
              total: true,
              status: true,
              paymentMethod: true,
            },
          },
          payments: {
            select: {
              amount: true,
            },
          },
          _count: {
            select: { sales: true, payments: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    // Enrich clients with ledger balance (Ventas en cuenta corriente - Pagos recibidos)
    const enrichedClients = clients.map((client) => {
      const totalCreditSales = client.sales.reduce(
        (sum, sale) => sum + sale.total.toNumber(),
        0
      )
      const totalPayments = client.payments.reduce(
        (sum, payment) => sum + payment.amount.toNumber(),
        0
      )
      const currentAccountBalance = Math.max(0, totalCreditSales - totalPayments)
      const creditLimitNum = client.creditLimit.toNumber()
      const availableCredit = Math.max(0, creditLimitNum - currentAccountBalance)

      const { sales, payments, ...rest } = client
      return {
        ...rest,
        currentAccountBalance,
        totalPayments,
        availableCredit,
        totalSalesCount: client._count.sales,
        totalPaymentsCount: client._count.payments,
      }
    })

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        clients: enrichedClients,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener los clientes',
    }
  }
}

/**
 * Retrieves the complete current account statement for a client (debts, pending payments, history)
 */
export async function getClientCurrentAccount(clientId: string): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()

    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
    })

    if (!client) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    // Get all sales for this client
    const sales = await prisma.sale.findMany({
      where: {
        clientId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    // Get all payments for this client
    const payments = await prisma.clientPayment.findMany({
      where: {
        clientId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    // Calculate balances
    let totalPurchases = 0
    let totalCreditSales = 0
    let pendingSalesAmount = 0

    const salesTransactions = sales.map((sale) => {
      const totalAmount = sale.total.toNumber()
      totalPurchases += totalAmount

      const isCurrentAccount = sale.paymentMethod === 'CURRENT_ACCOUNT'
      const isPending = sale.status === 'PENDING'
      const isCancelled = sale.status === 'CANCELLED'

      if (isCurrentAccount && !isCancelled) {
        totalCreditSales += totalAmount
      }

      if (isPending) {
        pendingSalesAmount += totalAmount
      }

      return {
        type: 'SALE' as const,
        id: sale.id,
        folio: sale.invoiceNumber,
        date: sale.createdAt,
        amount: totalAmount,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        itemsCount: sale._count.items,
        isCurrentAccount,
      }
    })

    let totalPayments = 0
    const paymentTransactions = payments.map((p) => {
      const amount = p.amount.toNumber()
      totalPayments += amount

      return {
        type: 'PAYMENT' as const,
        id: p.id,
        folio: p.receiptNumber,
        date: p.createdAt,
        amount: amount,
        status: 'COMPLETED' as const,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        cashShiftId: p.cashShiftId,
        collectedBy: p.user?.name || p.user?.email || 'Usuario',
      }
    })

    // Merge and sort unified ledger timeline descending
    const transactions = [...salesTransactions, ...paymentTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const currentAccountDebt = Math.max(0, totalCreditSales - totalPayments)
    const creditLimit = client.creditLimit.toNumber()
    const availableCredit = Math.max(0, creditLimit - currentAccountDebt)
    const isCreditExceeded = currentAccountDebt > creditLimit && creditLimit > 0

    return {
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          docType: client.docType,
          docNumber: client.docNumber,
          email: client.email,
          phone: client.phone,
          creditLimit,
        },
        financialSummary: {
          totalPurchases,
          totalCreditSales,
          totalPayments,
          currentAccountDebt,
          pendingSalesAmount,
          creditLimit,
          availableCredit,
          isCreditExceeded,
          totalSalesCount: sales.length,
          totalPaymentsCount: payments.length,
          totalTransactions: transactions.length,
        },
        transactions,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener la cuenta corriente del cliente',
    }
  }
}

/**
 * Registers a payment / collection from a client, amortizing current account debt
 * Generates an atomic receipt (REC-XXXXX) and creates an automatic cash movement if paid in cash
 */
export async function registerClientPayment(
  data: RegisterPaymentInput
): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user
    const validated = registerPaymentSchema.parse(data)

    const paymentResult = await prisma.$transaction(async (tx) => {
      // 1. Validate client existence and tenant ownership
      const client = await tx.client.findFirst({
        where: { id: validated.clientId, tenantId },
      })

      if (!client) {
        throw new Error('El cliente seleccionado no existe o no pertenece a tu organización.')
      }

      // 2. Generate atomic sequential receipt number (REC-00001)
      const { orderNumber: receiptNumber } = await getNextCorrelative(
        tx,
        tenantId,
        'RECEIPT',
        'REC-',
        5
      )

      const amountDec = new Prisma.Decimal(validated.amount)

      // 3. If paid in cash, link to active cash shift and register cash movement
      let activeCashShiftId: string | null = null
      if (validated.paymentMethod === 'CASH') {
        const activeShift = await tx.cashShift.findFirst({
          where: {
            tenantId,
            userId,
            status: 'OPEN',
          },
          select: { id: true },
        })

        if (activeShift) {
          activeCashShiftId = activeShift.id

          // Automatically record cash income movement in the open shift
          await tx.cashMovement.create({
            data: {
              tenantId,
              cashShiftId: activeShift.id,
              userId,
              type: 'INCOME',
              amount: amountDec,
              reason: `Cobranza Recibo ${receiptNumber} - Cliente: ${client.name}`,
            },
          })
        }
      }

      // 4. Create ClientPayment record
      const createdPayment = await tx.clientPayment.create({
        data: {
          tenantId,
          clientId: validated.clientId,
          userId,
          cashShiftId: activeCashShiftId,
          receiptNumber,
          amount: amountDec,
          paymentMethod: validated.paymentMethod,
          reference: validated.reference?.trim() || null,
          notes: validated.notes?.trim() || null,
        },
        include: {
          client: {
            select: { id: true, name: true, docNumber: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      // 5. Audit log
      await logAuditTx(tx, {
        tenantId,
        userId,
        action: 'REGISTER_CLIENT_PAYMENT',
        entity: 'ClientPayment',
        entityId: createdPayment.id,
        details: {
          receiptNumber,
          clientId: validated.clientId,
          clientName: client.name,
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          cashShiftId: activeCashShiftId,
        },
      })

      return createdPayment
    })

    revalidatePath('/clientes')
    revalidatePath('/ventas')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Cobranza registrada exitosamente. Recibo: ${paymentResult.receiptNumber}`,
      data: {
        id: paymentResult.id,
        receiptNumber: paymentResult.receiptNumber,
        amount: paymentResult.amount.toNumber(),
        paymentMethod: paymentResult.paymentMethod,
        clientName: paymentResult.client.name,
        date: paymentResult.createdAt,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al registrar el pago del cliente',
    }
  }
}

/**
 * Retrieves paginated list of client payments / receipts
 */
export async function getClientPayments(filters?: ClientPaymentFilterInput): Promise<
  ApiResponse<{
    payments: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const tenantId = await requireTenant()
    const { clientId, startDate, endDate, page, pageSize } = clientPaymentFilterSchema.parse(
      filters || {}
    )

    const where: Prisma.ClientPaymentWhereInput = {
      tenantId,
      ...(clientId && { clientId }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [payments, total] = await Promise.all([
      prisma.clientPayment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, docNumber: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.clientPayment.count({ where }),
    ])

    const formattedPayments = payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      amount: p.amount.toNumber(),
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      client: p.client,
      collectedBy: p.user.name || p.user.email,
    }))

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        payments: formattedPayments,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener los pagos de clientes',
    }
  }
}

/**
 * Retrieves a single client by ID
 */
export async function getClientById(id: string): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()

    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    return {
      success: true,
      data: client,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el cliente',
    }
  }
}
