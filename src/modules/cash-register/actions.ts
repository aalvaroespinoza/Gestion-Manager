'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/modules/auth/session-utils'
import { ApiResponse } from '@/types'
import {
  openShiftSchema,
  closeShiftSchema,
  cashMovementSchema,
  cashShiftFilterSchema,
  OpenShiftInput,
  CloseShiftInput,
  CashMovementInput,
  CashShiftFilterInput,
} from './validation'
import { CashShiftSummary } from './types'

// ==========================================
// Cash Register & Shift Management Actions
// ==========================================

/**
 * Retrieves the currently open cash shift for the authenticated user and tenant
 */
export async function getCurrentOpenShift(): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user

    const shift = await prisma.cashShift.findFirst({
      where: {
        tenantId,
        userId,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        movements: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            sales: true,
            movements: true,
          },
        },
      },
    })

    if (!shift) {
      return {
        success: true,
        data: null,
        message: 'No hay ningún turno de caja abierto actualmente',
      }
    }

    return {
      success: true,
      data: shift,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el turno de caja actual',
    }
  }
}

/**
 * Opens a new cash register shift
 */
export async function openCashShift(data: OpenShiftInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user
    const validated = openShiftSchema.parse(data)

    // Check if an open shift already exists for this user
    const existingOpenShift = await prisma.cashShift.findFirst({
      where: {
        tenantId,
        userId,
        status: 'OPEN',
      },
    })

    if (existingOpenShift) {
      return {
        success: false,
        error: 'Ya tienes un turno de caja abierto. Debes cerrar el turno actual antes de abrir uno nuevo.',
      }
    }

    const shift = await prisma.cashShift.create({
      data: {
        tenantId,
        userId,
        status: 'OPEN',
        initialAmount: new Prisma.Decimal(validated.initialAmount),
        notes: validated.notes || null,
        openedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/cash-register')
    revalidatePath('/dashboard/sales')
    revalidatePath('/ventas')

    return {
      success: true,
      data: shift,
      message: 'Turno de caja abierto exitosamente',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al abrir el turno de caja',
    }
  }
}

/**
 * Registers a manual cash movement (Income or Expense) into the active open shift
 */
export async function addCashMovement(data: CashMovementInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user
    const validated = cashMovementSchema.parse(data)

    // Find active open shift
    const openShift = await prisma.cashShift.findFirst({
      where: {
        tenantId,
        userId,
        status: 'OPEN',
      },
    })

    if (!openShift) {
      return {
        success: false,
        error: 'No tienes un turno de caja abierto para registrar movimientos manuales.',
      }
    }

    const movement = await prisma.cashMovement.create({
      data: {
        tenantId,
        userId,
        cashShiftId: openShift.id,
        type: validated.type,
        amount: new Prisma.Decimal(validated.amount),
        reason: validated.reason,
      },
    })

    revalidatePath('/dashboard/cash-register')

    return {
      success: true,
      data: movement,
      message: `Movimiento de ${validated.type === 'INCOME' ? 'Ingreso' : 'Egreso'} registrado exitosamente`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al registrar el movimiento de caja',
    }
  }
}

/**
 * Calculates in real-time the financial summary of a cash shift
 */
export async function getCashShiftSummary(shiftId: string): Promise<ApiResponse<CashShiftSummary>> {
  try {
    const user = await requireUser()
    const { tenantId } = user

    const shift = await prisma.cashShift.findFirst({
      where: {
        id: shiftId,
        tenantId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        movements: true,
        sales: {
          where: {
            status: { not: 'CANCELLED' },
          },
          select: {
            total: true,
            paymentMethod: true,
            status: true,
          },
        },
      },
    })

    if (!shift) {
      return {
        success: false,
        error: 'Turno de caja no encontrado',
      }
    }

    // 1. Initial Cash
    const initialAmount = shift.initialAmount.toNumber()

    // 2. Sales by Payment Method
    let cashSales = 0
    let cardSales = 0
    let transferSales = 0
    let currentAccountSales = 0
    let totalSales = 0

    for (const sale of shift.sales) {
      const amount = sale.total.toNumber()
      totalSales += amount

      switch (sale.paymentMethod) {
        case 'CASH':
          cashSales += amount
          break
        case 'CARD':
          cardSales += amount
          break
        case 'TRANSFER':
          transferSales += amount
          break
        case 'CURRENT_ACCOUNT':
          currentAccountSales += amount
          break
      }
    }

    // 3. Manual Cash Movements
    let totalIncome = 0
    let totalExpense = 0

    for (const movement of shift.movements) {
      const amount = movement.amount.toNumber()
      if (movement.type === 'INCOME') {
        totalIncome += amount
      } else if (movement.type === 'EXPENSE') {
        totalExpense += amount
      }
    }

    // 4. Expected Cash in Register Formula
    const expectedCashAmount = initialAmount + cashSales + totalIncome - totalExpense

    const summary: CashShiftSummary = {
      shift: {
        id: shift.id,
        tenantId: shift.tenantId,
        userId: shift.userId,
        userName: shift.user?.name || 'Vendedor',
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        initialAmount,
        expectedAmount: shift.expectedAmount ? shift.expectedAmount.toNumber() : expectedCashAmount,
        actualAmount: shift.actualAmount ? shift.actualAmount.toNumber() : null,
        difference: shift.difference ? shift.difference.toNumber() : null,
        notes: shift.notes,
      },
      salesSummary: {
        cash: cashSales,
        card: cardSales,
        transfer: transferSales,
        currentAccount: currentAccountSales,
        totalSales,
        salesCount: shift.sales.length,
      },
      movementsSummary: {
        totalIncome,
        totalExpense,
        movementsCount: shift.movements.length,
      },
      expectedCashAmount,
      actualAmount: shift.actualAmount ? shift.actualAmount.toNumber() : null,
      difference: shift.difference ? shift.difference.toNumber() : null,
      isClosed: shift.status === 'CLOSED',
    }

    return {
      success: true,
      data: summary,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el resumen del turno',
    }
  }
}

/**
 * Closes the active open cash shift atomically, computing expected amount and difference
 */
export async function closeCashShift(data: CloseShiftInput): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const { tenantId, id: userId } = user
    const validated = closeShiftSchema.parse(data)

    const closedShift = await prisma.$transaction(async (tx) => {
      // 1. Find active open shift
      const shift = await tx.cashShift.findFirst({
        where: {
          tenantId,
          userId,
          status: 'OPEN',
        },
        include: {
          movements: true,
          sales: {
            where: {
              status: { not: 'CANCELLED' },
            },
            select: {
              total: true,
              paymentMethod: true,
            },
          },
        },
      })

      if (!shift) {
        throw new Error('No tienes ningún turno de caja abierto para cerrar.')
      }

      // 2. Compute expected cash amount
      const initialAmount = shift.initialAmount.toNumber()

      const cashSales = shift.sales
        .filter((s) => s.paymentMethod === 'CASH')
        .reduce((sum, s) => sum + s.total.toNumber(), 0)

      const manualIncome = shift.movements
        .filter((m) => m.type === 'INCOME')
        .reduce((sum, m) => sum + m.amount.toNumber(), 0)

      const manualExpense = shift.movements
        .filter((m) => m.type === 'EXPENSE')
        .reduce((sum, m) => sum + m.amount.toNumber(), 0)

      const expectedAmount = initialAmount + cashSales + manualIncome - manualExpense
      const actualAmount = validated.actualAmount
      const difference = actualAmount - expectedAmount

      // 3. Update shift to CLOSED
      const updated = await tx.cashShift.update({
        where: { id: shift.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          expectedAmount: new Prisma.Decimal(expectedAmount),
          actualAmount: new Prisma.Decimal(actualAmount),
          difference: new Prisma.Decimal(difference),
          notes: validated.notes || shift.notes,
        },
      })

      return {
        ...updated,
        summary: {
          initialAmount,
          cashSales,
          manualIncome,
          manualExpense,
          expectedAmount,
          actualAmount,
          difference,
        },
      }
    })

    revalidatePath('/dashboard/cash-register')
    revalidatePath('/dashboard/sales')

    return {
      success: true,
      data: closedShift,
      message: `Turno de caja cerrado exitosamente. Diferencia: ${closedShift.summary.difference >= 0 ? '+' : ''}$${closedShift.summary.difference}`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al cerrar el turno de caja',
    }
  }
}

/**
 * Retrieves paginated history of cash shifts
 */
export async function getCashShiftsHistory(filters?: CashShiftFilterInput): Promise<
  ApiResponse<{
    shifts: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
> {
  try {
    const user = await requireUser()
    const { tenantId } = user
    const { status, userId, startDate, endDate, page, pageSize } = cashShiftFilterSchema.parse(
      filters || {}
    )

    const where: Prisma.CashShiftWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(userId && { userId }),
      ...(startDate || endDate
        ? {
            openedAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [shifts, total] = await Promise.all([
      prisma.cashShift.findMany({
        where,
        skip,
        take,
        orderBy: { openedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              sales: true,
              movements: true,
            },
          },
        },
      }),
      prisma.cashShift.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        shifts,
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el historial de turnos',
    }
  }
}
