'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/modules/auth/session-utils'
import Papa from 'papaparse'
import { format } from 'date-fns'

// 1. Exportar Reporte de Ventas a CSV
export async function exportSalesToCsv(startDate?: Date, endDate?: Date) {
  try {
    const tenantId = await getCurrentTenant()
    if (!tenantId) throw new Error('No autorizado: sesión requerida')

    const sales = await prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, code: true },
            },
          },
        },
        client: {
          select: { name: true, docNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Aplanar los datos para formato tabular CSV
    const flatData = sales.flatMap((sale) =>
      sale.items.map((item) => ({
        Comprobante: sale.invoiceNumber,
        Fecha: format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm'),
        Cliente: sale.client?.name || 'Consumidor Final',
        Documento: sale.client?.docNumber || 'S/D',
        MetodoPago: sale.paymentMethod,
        Estado: sale.status,
        CodigoProducto: item.product?.code || 'S/C',
        Producto: item.product?.name || 'Producto',
        Cantidad: Number(item.quantity),
        PrecioUnitario: Number(item.unitPrice),
        SubtotalItem: Number(item.subtotal),
        TotalVenta: Number(sale.total),
      }))
    )

    const rawCsv = Papa.unparse(flatData, {
      delimiter: ';', // Formato compatible nativo con Excel en español
    })

    // Prepend UTF-8 BOM (\ufeff) for native Excel UTF-8 recognition
    const csvString = '\ufeff' + rawCsv

    return {
      success: true,
      csv: csvString,
      filename: `ventas_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al exportar ventas' }
  }
}

// 2. Exportar Inventario / Stock a CSV
export async function exportInventoryToCsv() {
  try {
    const tenantId = await getCurrentTenant()
    if (!tenantId) throw new Error('No autorizado: sesión requerida')

    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    })

    const data = products.map((prod) => ({
      Codigo: prod.code || 'S/C',
      Producto: prod.name,
      Categoria: prod.category?.name || 'Sin Categoría',
      StockActual: Number(prod.currentStock),
      StockMinimo: Number(prod.minStock),
      PrecioCosto: Number(prod.costPrice),
      PrecioVenta: Number(prod.salePrice),
      AtributosExtra: prod.customAttributes ? JSON.stringify(prod.customAttributes) : '',
    }))

    const rawCsv = Papa.unparse(data, { delimiter: ';' })

    // Prepend UTF-8 BOM (\ufeff)
    const csvString = '\ufeff' + rawCsv

    return {
      success: true,
      csv: csvString,
      filename: `inventario_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al exportar inventario' }
  }
}
