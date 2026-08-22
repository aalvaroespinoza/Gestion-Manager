"use client"

import React, { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Product } from "@/types/inventory"
import { Boxes, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react"

interface StockAdjustModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onConfirm: (productId: string, newStock: number, reason: string) => void
}

export function StockAdjustModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: StockAdjustModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "SUBTRACT" | "SET">("ADD")
  const [quantity, setQuantity] = useState<number | "">(5)
  const [reason, setReason] = useState("Recepción de mercadería / Compra")

  if (!product) return null

  const currentStock = product.stock
  const qty = Number(quantity) || 0

  let newCalculatedStock = currentStock
  if (adjustmentType === "ADD") newCalculatedStock = currentStock + qty
  else if (adjustmentType === "SUBTRACT") newCalculatedStock = Math.max(0, currentStock - qty)
  else if (adjustmentType === "SET") newCalculatedStock = Math.max(0, qty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(product.id, newCalculatedStock, reason)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="default"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Boxes className="h-5 w-5" />
          </div>
          <span>Ajuste Rápido de Stock</span>
        </div>
      }
      description={`Actualización de existencias para: ${product.name} (${product.sku})`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-500">Stock Actual en Sistema</span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentStock} un.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Nuevo Stock Proyectado</span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{newCalculatedStock} un.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipo de Movimiento"
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value as any)}
            options={[
              { label: "Ingreso / Entrada (+)", value: "ADD" },
              { label: "Salida / Merma / Baja (-)", value: "SUBTRACT" },
              { label: "Fijar Conteo Físico (=)", value: "SET" },
            ]}
          />

          <Input
            label="Cantidad de Unidades"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            required
            min={1}
          />
        </div>

        <Select
          label="Motivo del Ajuste"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { label: "Recepción de mercadería / Compra", value: "Recepción de mercadería" },
            { label: "Ajuste por inventario físico / Conteo cíclico", value: "Conteo físico" },
            { label: "Merma / Producto dañado o vencido", value: "Merma" },
            { label: "Devolución de cliente", value: "Devolución de cliente" },
            { label: "Corrección de error de digitación", value: "Corrección operativa" },
          ]}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="default">
            Aplicar Ajuste
          </Button>
        </div>
      </form>
    </Modal>
  )
}
