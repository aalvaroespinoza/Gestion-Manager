'use client'

import { useState } from 'react'
import { exportSalesToCsv, exportInventoryToCsv } from '@/modules/reports/export-actions'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

export interface ExportSalesButtonProps {
  startDate?: Date
  endDate?: Date
  className?: string
}

export function ExportSalesButton({ startDate, endDate, className }: ExportSalesButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await exportSalesToCsv(startDate, endDate)
      if (!res.success || !res.csv) throw new Error(res.error)

      // Crear Blob con BOM UTF-8 y forzar descarga en el navegador
      const blob = new Blob(['\ufeff' + res.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', res.filename || 'reporte_ventas.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Error al descargar reporte: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline" className={className}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Exportar Ventas (CSV)
    </Button>
  )
}

export function ExportInventoryButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await exportInventoryToCsv()
      if (!res.success || !res.csv) throw new Error(res.error)

      const blob = new Blob(['\ufeff' + res.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', res.filename || 'inventario.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Error al descargar inventario: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline" className={className}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Exportar Stock (CSV)
    </Button>
  )
}
