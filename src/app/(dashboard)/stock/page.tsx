import { getProducts, getCategories } from "@/modules/inventory/actions"
import { StockView } from "@/components/modules/inventory/StockView"
import { mockCategories, mockProducts } from "@/mocks/inventoryData"
import { Category, Product, StockStatus } from "@/types/inventory"
import { DynamicFormFieldConfig } from "@/components/dynamic-forms/types"

export default async function StockPage() {
  let products: Product[] = []
  let categories: Category[] = []

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      getProducts({ page: 1, pageSize: 100 }),
      getCategories(),
    ])

    if (categoriesRes.success && categoriesRes.data && categoriesRes.data.length > 0) {
      categories = categoriesRes.data.map((c: any) => {
        let dynamicFieldsConfig: DynamicFormFieldConfig[] = []
        if (c.dynamicFieldsConfig?.fields && Array.isArray(c.dynamicFieldsConfig.fields)) {
          dynamicFieldsConfig = c.dynamicFieldsConfig.fields
        } else if (Array.isArray(c.dynamicFieldsConfig)) {
          dynamicFieldsConfig = c.dynamicFieldsConfig
        }

        return {
          id: c.id,
          name: c.name,
          description: c.description || undefined,
          dynamicFieldsConfig,
        }
      })
    } else {
      categories = mockCategories
    }

    if (productsRes.success && productsRes.data && productsRes.data.products && productsRes.data.products.length > 0) {
      products = productsRes.data.products.map((p: any) => {
        const stockNum = Number(p.currentStock ?? 0)
        const minStockNum = Number(p.minStock ?? 0)
        let status: StockStatus = "IN_STOCK"
        if (stockNum === 0) status = "OUT_OF_STOCK"
        else if (stockNum <= minStockNum) status = "LOW_STOCK"

        return {
          id: p.id,
          code: p.code || `SKU-${p.id.slice(0, 6)}`,
          name: p.name,
          description: p.description || undefined,
          categoryId: p.categoryId || p.category?.id || "",
          categoryName: p.category?.name || "General",
          costPrice: Number(p.costPrice ?? 0),
          salePrice: Number(p.salePrice ?? 0),
          stock: stockNum,
          minStock: minStockNum,
          status,
          customAttributes: (p.customAttributes as Record<string, any>) || {},
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
        }
      })
    } else {
      products = mockProducts
    }
  } catch (error) {
    console.error("Error fetching inventory data in Stock Server Component:", error)
    products = mockProducts
    categories = mockCategories
  }

  return <StockView initialProducts={products} initialCategories={categories} />
}
