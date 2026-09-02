'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/modules/auth/session-utils'
import { ApiResponse } from '@/types'
import {
  clientSchema,
  updateClientSchema,
  clientFilterSchema,
  ClientInput,
  UpdateClientInput,
  ClientFilterInput,
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
          _count: {
            select: { sales: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    // Enrich clients with current account balance
    const enrichedClients = clients.map((client) => {
      const currentAccountBalance = client.sales.reduce(
        (sum, sale) => sum + sale.total.toNumber(),
        0
      )
      const creditLimitNum = client.creditLimit.toNumber()
      const availableCredit = Math.max(0, creditLimitNum - currentAccountBalance)

      const { sales, ...rest } = client
      return {
        ...rest,
        currentAccountBalance,
        availableCredit,
        totalSalesCount: client._count.sales,
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

    // Calculate balances
    let totalPurchases = 0
    let currentAccountDebt = 0
    let pendingSalesAmount = 0

    const transactions = sales.map((sale) => {
      const totalAmount = sale.total.toNumber()
      totalPurchases += totalAmount

      const isCurrentAccount = sale.paymentMethod === 'CURRENT_ACCOUNT'
      const isPending = sale.status === 'PENDING'

      if (isCurrentAccount || isPending) {
        currentAccountDebt += totalAmount
      }

      if (isPending) {
        pendingSalesAmount += totalAmount
      }

      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        date: sale.createdAt,
        total: totalAmount,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        itemsCount: sale._count.items,
        isCurrentAccount,
      }
    })

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
          currentAccountDebt,
          pendingSalesAmount,
          creditLimit,
          availableCredit,
          isCreditExceeded,
          totalTransactions: sales.length,
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
