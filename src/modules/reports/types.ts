export interface CriticalStockProduct {
  id: string
  code: string | null
  name: string
  currentStock: number
  minStock: number
  deficit: number
  categoryName: string | null
  salePrice: number
}

export interface TopSellingProduct {
  productId: string
  productName: string
  productCode: string | null
  categoryName: string | null
  totalUnitsSold: number
  totalRevenue: number
  currentStock: number
}

export interface DashboardMetrics {
  todaySales: {
    totalAmount: number
    transactionCount: number
    averageTicket: number
  }
  monthSales: {
    totalAmount: number
    transactionCount: number
    averageTicket: number
  }
  overallStats: {
    totalClientsCount: number
    totalActiveProductsCount: number
    totalCategoriesCount: number
    totalPendingDebt: number
  }
  criticalStockCount: number
  criticalStockProducts: CriticalStockProduct[]
  topSellingProducts: TopSellingProduct[]
  tenantInfo: {
    id: string
    name: string
    slug: string
    currency: string
    currencySymbol: string
  }
}
