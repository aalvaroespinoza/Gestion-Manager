import { getProducts, getCategories } from "@/modules/inventory/actions"
import { getClients } from "@/modules/clients/actions"
import { getSales } from "@/modules/sales/actions"
import { VentasView } from "@/components/modules/sales/VentasView"
import { mockProducts, mockCategories } from "@/mocks/inventoryData"
import { mockClients } from "@/mocks/clientsData"
import { Category, Product, StockStatus } from "@/types/inventory"
import { ClientSelectOption, InvoiceData, PaymentMethod } from "@/types/sales"
import { DynamicFormFieldConfig } from "@/components/dynamic-forms/types"

function mapDbPaymentMethodToUi(method: string): PaymentMethod {
  switch (method) {
    case "CASH":
      return "EFECTIVO"
    case "CARD":
      return "TARJETA_DEBITO"
    case "TRANSFER":
      return "TRANSFERENCIA"
    case "CURRENT_ACCOUNT":
      return "CUENTA_CORRIENTE"
    default:
      return "EFECTIVO"
  }
}

export default async function VentasPage() {
  let products: Product[] = []
  let categories: Category[] = []
  let clients: ClientSelectOption[] = []
  let salesHistory: InvoiceData[] = []

  try {
    const [productsRes, categoriesRes, clientsRes, salesRes] = await Promise.all([
      getProducts({ page: 1, pageSize: 100 }),
      getCategories(),
      getClients({ page: 1, pageSize: 100 }),
      getSales({ page: 1, pageSize: 50 }),
    ])

    // 1. Categories
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

    // 2. Products
    if (
      productsRes.success &&
      productsRes.data &&
      productsRes.data.products &&
      productsRes.data.products.length > 0
    ) {
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

    // 3. Clients (Default Consumidor Final + Database Clients)
    const defaultConsumidorFinal: ClientSelectOption = {
      id: "cli-cf",
      name: "Consumidor Final",
      docType: "DNI",
      docNumber: "00000000",
      taxCondition: "Consumidor Final",
    }

    if (
      clientsRes.success &&
      clientsRes.data &&
      clientsRes.data.clients &&
      clientsRes.data.clients.length > 0
    ) {
      const dbClients: ClientSelectOption[] = clientsRes.data.clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        docType: (c.docType || "DNI") as "DNI" | "CUIT" | "RUT" | "OTRO",
        docNumber: c.docNumber || "S/N",
        taxCondition: c.docType === "CUIT" || c.docType === "RUT" ? "Responsable Inscripto" : "Consumidor Final",
        hasCurrentAccount: Number(c.creditLimit || 0) > 0,
        currentAccountBalance: Number(c.currentAccountBalance || 0),
        email: c.email || undefined,
        phone: c.phone || undefined,
        address: c.address || undefined,
      }))
      clients = [defaultConsumidorFinal, ...dbClients]
    } else {
      clients = mockClients
    }

    // 4. Sales History
    if (
      salesRes.success &&
      salesRes.data &&
      salesRes.data.sales &&
      salesRes.data.sales.length > 0
    ) {
      salesHistory = salesRes.data.sales.map((sale: any) => {
        const items = (sale.items || []).map((it: any) => ({
          productId: it.productId || it.product?.id || "",
          code: it.product?.code || "SKU",
          name: it.product?.name || "Producto",
          categoryName: "General",
          unitPrice: Number(it.unitPrice ?? 0),
          costPrice: 0,
          quantity: Number(it.quantity ?? 1),
          stock: 0,
          subtotal: Number(it.subtotal ?? 0),
          customAttributes: (it.customSpecs as Record<string, any>) || {},
        }))

        const totalUnits = items.reduce((s: number, i: any) => s + i.quantity, 0) || (sale._count?.items ?? 0)

        return {
          id: sale.id,
          saleNumber: sale.invoiceNumber,
          date: new Date(sale.createdAt).toLocaleString("es-CL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          clientId: sale.clientId || "cli-cf",
          clientName: sale.client?.name || "Consumidor Final",
          clientDoc: sale.client?.docNumber
            ? `${sale.client.docType || "DOC"}: ${sale.client.docNumber}`
            : "Consumidor Final",
          clientTaxCondition: "Consumidor Final",
          items,
          summary: {
            subtotal: Number(sale.subtotal ?? 0),
            discountType: "PERCENT",
            discountValue: 0,
            discountAmount: Number(sale.discount ?? 0),
            taxRate: 0.21,
            taxAmount: Number(sale.tax ?? 0),
            total: Number(sale.total ?? 0),
            totalItems: sale._count?.items ?? items.length,
            totalUnits,
          },
          paymentMethod: mapDbPaymentMethodToUi(sale.paymentMethod),
          amountPaid: Number(sale.total ?? 0),
          changeAmount: 0,
          status: sale.status === "COMPLETED" ? "COMPLETADA" : sale.status === "CANCELLED" ? "ANULADA" : "PENDIENTE",
          cashierName: sale.user?.name || "Cajero Principal",
          branchName: "Casa Matriz - Salón de Ventas",
          notes: sale.notes || undefined,
        }
      })
    }
  } catch (error) {
    console.error("Error fetching POS data on server:", error)
    products = mockProducts
    categories = mockCategories
    clients = mockClients
  }

  return (
    <VentasView
      initialProducts={products}
      initialCategories={categories}
      initialClients={clients}
      initialSalesHistory={salesHistory}
    />
  )
}
