"use client"

import React from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Product } from "@/types/inventory"
import { AlertTriangle, Trash2 } from "lucide-react"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onConfirm: (productId: string) => void
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!product) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <span>Eliminar Producto</span>
        </div>
      }
      description="Esta acción dará de baja el ítem del catálogo."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Estás seguro de que deseas eliminar permanentemente a{" "}
          <strong className="text-slate-900 dark:text-slate-100 font-semibold">
            {product.name}
          </strong>{" "}
          (SKU: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{product.sku}</code>)?
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              onConfirm(product.id)
              onClose()
            }}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
