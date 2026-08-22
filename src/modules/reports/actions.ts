'use server'

import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/modules/auth/session-utils'
import { ApiResponse } from '@/types'
import { TenantSettings } from '@/types/database'
import { DashboardMetrics, CriticalStockProduct, TopSellingProduct } from './types'

/**
 * Retrieves core Dashboard KPIs, sales metrics, critical stock alerts, and top-selling products for the active tenant
 */
export async function getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
  try {
    const tenantId = await requireTenant()

    // 1. Fetch Tenant data and configuration
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: true,
      },
    })

    if (!tenant) {
      return {
        success: false,
        error: 'Organización no encontrada',
      }
    }

    const settings = (tenant.settings as unknown as TenantSettings) || {}
    const currency = settings.currency || 'ARS'
    const currencySymbol = settings.currencySymbol || '$'

    // 2. Date ranges
    const now = new Date()

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // 3. Parallel database queries for performance
    const [
      todaySales,
      monthSales,
      activeProducts,
      monthSaleItems,
      totalClientsCount,
      totalCategoriesCount,
      pendingSales,
    ] = await Promise.all([
      // Sales of today
      prisma.sale.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { total: true },
      }),

      // Sales of this month
      prisma.sale.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: { total: true },
      }),

      // Active products for critical stock calculation
      prisma.product.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
        include: {
          category: {
            select: { name: true },
          },
        },
      }),

      // Sale items in current month for Top 5 ranking
      prisma.saleItem.findMany({
        where: {
          sale: {
            tenantId,
            status: 'COMPLETED',
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
        include: {
          product: {
            include: {
              category: {
                select: { name: true },
              },
            },
          },
        },
      }),

      // Total clients count
      prisma.client.count({
        where: { tenantId },
      }),

      // Total categories count
      prisma.category.count({
        where: { tenantId },
      }),

      // Pending / Current account debt
      prisma.sale.findMany({
        where: {
          tenantId,
          OR: [{ paymentMethod: 'CURRENT_ACCOUNT' }, { status: 'PENDING' }],
        },
        select: { total: true },
      }),
    ])

    // 4. Calculate Sales Metrics
    const todayTotalAmount = todaySales.reduce((sum, s) => sum + s.total.toNumber(), 0)
    const todayTransactionCount = todaySales.length
    const todayAverageTicket =
      todayTransactionCount > 0 ? Math.round((todayTotalAmount / todayTransactionCount) * 100) / 100 : 0

    const monthTotalAmount = monthSales.reduce((sum, s) => sum + s.total.toNumber(), 0)
    const monthTransactionCount = monthSales.length
    const monthAverageTicket =
      monthTransactionCount > 0 ? Math.round((monthTotalAmount / monthTransactionCount) * 100) / 100 : 0

    const totalPendingDebt = pendingSales.reduce((sum, s) => sum + s.total.toNumber(), 0)

    // 5. Calculate Critical Stock Products (currentStock <= minStock)
    const criticalStockProducts: CriticalStockProduct[] = activeProducts
      .filter((p) => p.currentStock.toNumber() <= p.minStock.toNumber())
      .map((p) => {
        const currentStock = p.currentStock.toNumber()
        const minStock = p.minStock.toNumber()
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          currentStock,
          minStock,
          deficit: Math.max(0, minStock - currentStock),
          categoryName: p.category?.name || null,
          salePrice: p.salePrice.toNumber(),
        }
      })
      .sort((a, b) => b.deficit - a.deficit)

    // 6. Calculate Top 5 Best-Selling Products of the Month
    const productSalesMap = new Map<
      string,
      {
        productId: string
        productName: string
        productCode: string | null
        categoryName: string | null
        totalUnitsSold: number
        totalRevenue: number
        currentStock: number
      }
    >()

    for (const item of monthSaleItems) {
      const productId = item.productId || item.product?.id || item.id
      const productName = item.product?.name || 'Producto'
      const productCode = item.product?.code || null
      const categoryName = item.product?.category?.name || null
      const currentStock = item.product ? item.product.currentStock.toNumber() : 0
      const quantity = item.quantity.toNumber()
      const revenue = item.subtotal.toNumber()

      if (!productSalesMap.has(productId)) {
        productSalesMap.set(productId, {
          productId,
          productName,
          productCode,
          categoryName,
          totalUnitsSold: quantity,
          totalRevenue: revenue,
          currentStock,
        })
      } else {
        const existing = productSalesMap.get(productId)!
        existing.totalUnitsSold += quantity
        existing.totalRevenue += revenue
      }
    }

    const topSellingProducts: TopSellingProduct[] = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
      .slice(0, 5)

    const metrics: DashboardMetrics = {
      todaySales: {
        totalAmount: todayTotalAmount,
        transactionCount: todayTransactionCount,
        averageTicket: todayAverageTicket,
      },
      monthSales: {
        totalAmount: monthTotalAmount,
        transactionCount: monthTransactionCount,
        averageTicket: monthAverageTicket,
      },
      overallStats: {
        totalClientsCount,
        totalActiveProductsCount: activeProducts.length,
        totalCategoriesCount,
        totalPendingDebt,
      },
      criticalStockCount: criticalStockProducts.length,
      criticalStockProducts,
      topSellingProducts,
      tenantInfo: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        currency,
        currencySymbol,
      },
    }

    return {
      success: true,
      data: metrics,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener las métricas del dashboard',
    }
  }
}
