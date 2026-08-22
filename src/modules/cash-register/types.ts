import { CashShift, CashMovement, User, Sale, CashMovementType, CashShiftStatus } from '@prisma/client'

export type { CashMovementType, CashShiftStatus }

export interface CashShiftSummary {
  shift: {
    id: string
    tenantId: string
    userId: string
    userName: string
    status: CashShiftStatus
    openedAt: Date
    closedAt?: Date | null
    initialAmount: number
    expectedAmount?: number | null
    actualAmount?: number | null
    difference?: number | null
    notes?: string | null
  }
  salesSummary: {
    cash: number
    card: number
    transfer: number
    currentAccount: number
    totalSales: number
    salesCount: number
  }
  movementsSummary: {
    totalIncome: number
    totalExpense: number
    movementsCount: number
  }
  expectedCashAmount: number
  actualAmount?: number | null
  difference?: number | null
  isClosed: boolean
}
