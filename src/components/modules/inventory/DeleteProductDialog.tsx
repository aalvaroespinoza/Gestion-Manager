"use client"

import React, { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Product } from "@/types/inventory"
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react"

interface DeleteProductDialogProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onConfirm: (productId: string) => void | Promise<void>
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  product,
  onConfirm,
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!product) return null

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)
      await onConfirm(product.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-bold">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <span>Confirmar Eliminación</span>
        </div>
      }
      description="Esta acción removerá el producto permanentemente del catálogo y del control de inventario."
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <p>
            ¿Estás seguro de que deseas dar de baja el siguiente producto?
          </p>
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {product.name}
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <span>SKU / Código: <strong>{product.code}</strong></span>
            <span>•</span>
            <span>Stock actual: <strong>{product.stock} un.</strong></span>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={isDeleting}
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={handleConfirm}
          >
            Eliminar Producto
          </Button>
        </div>
      </div>
    </Modal>
  )
}
