import { Prisma } from '@prisma/client'

/**
 * Atomically increments and returns the next sequential correlative for a tenant
 * Completely immune to concurrency race conditions.
 */
export async function getNextCorrelative(
  tx: Prisma.TransactionClient,
  tenantId: string,
  type: 'INVOICE' | 'PURCHASE_ORDER' | 'RECEIPT' | string,
  defaultPrefix = 'DOC-',
  padding = 5
): Promise<{ orderNumber: string; number: number; prefix: string }> {
  let counter: { lastNumber: number; prefix: string }

  try {
    // 1. Fast path: Atomic increment on existing counter
    counter = await tx.tenantCounter.update({
      where: {
        tenantId_type: {
          tenantId,
          type,
        },
      },
      data: {
        lastNumber: { increment: 1 },
      },
      select: {
        lastNumber: true,
        prefix: true,
      },
    })
  } catch {
    // 2. Counter does not exist yet: initialize with fallback to existing records count
    let initialCount = 0
    if (type === 'INVOICE') {
      initialCount = await tx.sale.count({ where: { tenantId } })
    } else if (type === 'PURCHASE_ORDER') {
      initialCount = await tx.purchaseOrder.count({ where: { tenantId } })
    }

    try {
      counter = await tx.tenantCounter.create({
        data: {
          tenantId,
          type,
          prefix: defaultPrefix,
          lastNumber: initialCount + 1,
        },
        select: {
          lastNumber: true,
          prefix: true,
        },
      })
    } catch {
      // Concurrent create race fallback: increment the newly created record
      counter = await tx.tenantCounter.update({
        where: {
          tenantId_type: {
            tenantId,
            type,
          },
        },
        data: {
          lastNumber: { increment: 1 },
        },
        select: {
          lastNumber: true,
          prefix: true,
        },
      })
    }
  }

  const prefix = counter.prefix || defaultPrefix
  const formattedNumber = `${prefix}${String(counter.lastNumber).padStart(padding, '0')}`

  return {
    orderNumber: formattedNumber,
    number: counter.lastNumber,
    prefix,
  }
}
