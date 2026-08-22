'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser, getCurrentUser } from '@/modules/auth/session-utils'
import { requireAdmin, requireManagerOrAbove } from '@/modules/auth/permissions'
import { ApiResponse } from '@/types'

export interface LogAuditParams {
  action: string // e.g. "CANCEL_SALE", "MANUAL_STOCK_ADJUSTMENT", "CLOSE_SHIFT", "OPEN_SHIFT"
  entity: string // e.g. "Sale", "Product", "CashShift", "Client"
  entityId: string
  details: Record<string, unknown>
  userId?: string
  tenantId?: string
}

/**
 * Logs an audit event within an active Prisma transaction
 */
export async function logAuditTx(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string
    userId: string
    action: string
    entity: string
    entityId: string
    details: Record<string, unknown>
  }
) {
  return await tx.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Logs an audit event standalone
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    let tenantId = params.tenantId
    let userId = params.userId

    if (!tenantId || !userId) {
      const user = await getCurrentUser()
      if (user) {
        tenantId = tenantId || user.tenantId
        userId = userId || user.id
      }
    }

    if (!tenantId || !userId) return

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error('Error logging audit event:', error)
  }
}

/**
 * Retrieves paginated audit logs for the current tenant (Restricted to ADMIN and MANAGER)
 */
export async function getAuditLogs(filters?: {
  action?: string
  entity?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<
  ApiResponse<{
    logs: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const user = await requireManagerOrAbove()
    const { tenantId } = user

    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 30

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(filters?.action && { action: filters.action }),
      ...(filters?.entity && { entity: filters.entity }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.startDate || filters?.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: new Date(filters.startDate) }),
              ...(filters.endDate && { lte: new Date(filters.endDate) }),
            },
          }
        : {}),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener los registros de auditoría',
    }
  }
}
