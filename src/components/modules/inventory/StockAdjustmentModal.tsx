"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Product, StockAdjustmentType, StockStatus } from "@/types/inventory"
import {
  Boxes,
  PlusCircle,
  MinusCircle,
  Sliders,
  ArrowRight,
  FileText,
  CheckCircle2,
} from "lucide-react"

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onConfirm: (
    productId: string,
    newStock: number,
    movement: {
      type: StockAdjustmentType
      quantity: number
      previousStock: number
      newStock: number
      reason: string
      documentRef?: string
    }
  ) => void | Promise<void>
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: StockAdjustmentModalProps) {
  const [operationType, setOperationType] = useState<StockAdjustmentType>("IN")
  const [quantity, setQuantity] = useState<number | "">(10)
  const [reason, setReason] = useState("Recepción de mercadería / Compra de stock")
  const [documentRef, setDocumentRef] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && product) {
      setOperationType("IN")
      setQuantity(10)
      setReason("Recepción de mercadería / Compra de stock")
      setDocumentRef("")
      setError(null)
    }
  }, [isOpen, product])

  const currentStock = product?.stock ?? 0
  const minStock = product?.minStock ?? 0
  const qty = Number(quantity) || 0

  // Live calculation of projected stock
  const newCalculatedStock = useMemo(() => {
    if (operationType === "IN") return currentStock + qty
    if (operationType === "OUT") return Math.max(0, currentStock - qty)
    if (operationType === "SET") return Math.max(0, qty)
    return currentStock
  }, [currentStock, operationType, qty])

  // Projected status calculation
  const projectedStatus: StockStatus = useMemo(() => {
    if (newCalculatedStock === 0) return "OUT_OF_STOCK"
    if (newCalculatedStock <= minStock) return "LOW_STOCK"
    return "IN_STOCK"
  }, [newCalculatedStock, minStock])

  if (!product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (quantity === "" || qty < 0) {
      setError("Por favor ingrese una cantidad válida")
      return
    }

    if (operationType === "OUT" && qty > currentStock) {
      setError(`No es posible descontar ${qty} unidades. El stock actual es de ${currentStock} un.`)
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(product.id, newCalculatedStock, {
        type: operationType,
        quantity: qty,
        previousStock: currentStock,
        newStock: newCalculatedStock,
        reason: reason.trim() || "Ajuste manual de inventario",
        documentRef: documentRef.trim() || undefined,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="default"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="text-foreground font-bold">Ajuste Rápido de Stock / Re-Stock</span>
        </div>
      }
      description={
        <span className="text-muted-foreground text-xs">
          Modificación directa de existencias para{" "}
          <strong className="text-foreground">{product.name}</strong>{" "}
          (Código: <code className="font-mono text-xs text-primary">{product.code}</code>)
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {/* Current Stock vs Projected Stock Card */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Stock Actual</span>
            <div className="text-2xl font-black text-foreground">
              {currentStock} <span className="text-sm font-normal text-muted-foreground">un.</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Umbral mínimo: {minStock} un.</span>
          </div>

          <div className="flex items-center px-3 text-muted-foreground">
            <ArrowRight className="h-6 w-6" />
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium">Nuevo Stock Proyectado</span>
            <div
              className={`text-2xl font-black ${
                projectedStatus === "OUT_OF_STOCK"
                  ? "text-red-400"
                  : projectedStatus === "LOW_STOCK"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {newCalculatedStock} <span className="text-sm font-normal">un.</span>
            </div>
            <div className="flex justify-end mt-0.5">
              <Badge
                variant={
                  projectedStatus === "IN_STOCK"
                    ? "success"
                    : projectedStatus === "LOW_STOCK"
                    ? "warning"
                    : "destructive"
                }
                size="sm"
                dot
              >
                {projectedStatus === "IN_STOCK"
                  ? "Stock Normal"
                  : projectedStatus === "LOW_STOCK"
                  ? "Stock Bajo"
                  : "Agotado"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Operation Type Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de Operación
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOperationType("IN")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                operationType === "IN"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30 font-bold"
                  : "border-border bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              <PlusCircle className="h-4 w-4 mb-1 text-emerald-500" />
              <span>Ingreso / Compra</span>
              <span className="text-[10px] text-muted-foreground font-normal mt-0.5">(Suma +)</span>
            </button>

            <button
              type="button"
              onClick={() => setOperationType("OUT")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                operationType === "OUT"
                  ? "border-red-500/50 bg-red-500/15 text-red-500 ring-1 ring-red-500/30 font-bold"
                  : "border-border bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              <MinusCircle className="h-4 w-4 mb-1 text-red-500" />
              <span>Egreso / Merma</span>
              <span className="text-[10px] text-muted-foreground font-normal mt-0.5">(Resta -)</span>
            </button>

            <button
              type="button"
              onClick={() => setOperationType("SET")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                operationType === "SET"
                  ? "border-primary/50 bg-primary/15 text-primary ring-1 ring-primary/30 font-bold"
                  : "border-border bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              <Sliders className="h-4 w-4 mb-1 text-primary" />
              <span>Conteo Directo</span>
              <span className="text-[10px] text-muted-foreground font-normal mt-0.5">(Fija valor =)</span>
            </button>
          </div>
        </div>

        {/* Quantity and Reason inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={operationType === "SET" ? "Nuevo Total de Unidades" : "Cantidad de Unidades a Ajustar"}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            required
            min={operationType === "SET" ? 0 : 1}
            placeholder="10"
            error={error || undefined}
          />

          <Input
            label="Comprobante / N° Factura / Guía (Opcional)"
            placeholder="Ej: FAC-9821 o GD-402"
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
            leftIcon={<FileText className="h-4 w-4" />}
          />
        </div>

        <Select
          label="Motivo del Ajuste"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { label: "Recepción de mercadería / Compra de stock", value: "Recepción de mercadería / Compra de stock" },
            { label: "Ajuste por inventario físico / Conteo de bodega", value: "Ajuste por inventario físico / Conteo de bodega" },
            { label: "Merma / Producto dañado / Vencido", value: "Merma / Producto dañado / Vencido" },
            { label: "Devolución conforme de cliente", value: "Devolución conforme de cliente" },
            { label: "Corrección de digitación", value: "Corrección de digitación" },
          ]}
        />

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            Confirmar Ajuste
          </Button>
        </div>
      </form>
    </Modal>
  )
}
