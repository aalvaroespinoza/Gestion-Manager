"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CartItem,
  ClientSelectOption,
  InvoiceData,
  PaymentMethod,
  SaleSummary,
} from "@/types/sales"
import {
  Banknote,
  CreditCard,
  Building,
  ArrowRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  RefreshCw,
  Wallet,
  Landmark,
} from "lucide-react"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  summary: SaleSummary
  client: ClientSelectOption
  onConfirmSale: (invoice: InvoiceData) => void | Promise<void>
  onNewSale: () => void
  initialInvoice?: InvoiceData | null
}

const paymentMethodsList: {
  id: PaymentMethod
  label: string
  icon: React.ElementType
  badge?: string
}[] = [
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { id: "TARJETA_DEBITO", label: "Tarjeta Débito", icon: CreditCard },
  { id: "TARJETA_CREDITO", label: "Tarjeta Crédito", icon: CreditCard },
  { id: "TRANSFERENCIA", label: "Transferencia / QR", icon: Landmark },
  { id: "CUENTA_CORRIENTE", label: "Cta. Corriente", icon: Building, badge: "Crédito" },
]

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  summary,
  client,
  onConfirmSale,
  onNewSale,
  initialInvoice,
}: CheckoutModalProps) {
  const [step, setStep] = useState<"PAYMENT" | "RECEIPT">("PAYMENT")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO")
  const [amountPaid, setAmountPaid] = useState<number | "">("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null)

  useEffect(() => {
    if (initialInvoice) {
      setGeneratedInvoice(initialInvoice)
      setStep("RECEIPT")
    } else if (isOpen) {
      setStep("PAYMENT")
      setPaymentMethod("EFECTIVO")
      setAmountPaid(summary.total)
      setNotes("")
      setGeneratedInvoice(null)
    }
  }, [isOpen, initialInvoice, summary.total])

  const total = summary.total
  const paid = Number(amountPaid) || 0
  const change = Math.max(0, paid - total)
  const isCash = paymentMethod === "EFECTIVO"
  const isInsufficientCash = isCash && paid < total

  const handleQuickCash = (extra: number) => {
    if (extra === 0) {
      setAmountPaid(total)
    } else {
      setAmountPaid(Math.ceil((total + extra) / 1000) * 1000)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCash && paid < total) {
      return
    }

    const now = new Date()
    const invoiceNumber = `TK-${now.getFullYear()}-${String(
      Math.floor(100000 + Math.random() * 900000)
    )}`

    const invoice: InvoiceData = {
      id: `sale-${Date.now()}`,
      saleNumber: invoiceNumber,
      date: now.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      clientId: client.id,
      clientName: client.name,
      clientDoc: `${client.docType}: ${client.docNumber}`,
      clientTaxCondition: client.taxCondition,
      items: [...items],
      summary: { ...summary },
      paymentMethod,
      amountPaid: isCash ? paid : total,
      changeAmount: isCash ? change : 0,
      status: "COMPLETADA",
      cashierName: "Álvaro Espinoza (Cajero Principal)",
      branchName: "Casa Matriz - Salón de Ventas",
      notes: notes.trim() || undefined,
    }

    try {
      setIsSubmitting(true)
      await onConfirmSale(invoice)
      setGeneratedInvoice(invoice)
      setStep("RECEIPT")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={step === "RECEIPT" ? "default" : "lg"}
      title={
        step === "PAYMENT" ? (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Wallet className="h-5 w-5" />
            </div>
            <span>Cobro y Cierre de Venta</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>Venta Registrada con Éxito</span>
          </div>
        )
      }
      description={
        step === "PAYMENT"
          ? `Total a cobrar: $${summary.total.toLocaleString("es-CL")} • Cliente: ${client.name}`
          : `Comprobante digital correlativo para entrega al cliente.`
      }
    >
      {step === "PAYMENT" ? (
        <form onSubmit={handleConfirm} className="space-y-6">
          {/* Total Display Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-100 font-semibold">
                Monto Total a Cobrar
              </span>
              <div className="text-3xl font-extrabold tracking-tight">
                ${summary.total.toLocaleString("es-CL")}
              </div>
              <span className="text-xs text-blue-100">
                {summary.totalItems} ítems ({summary.totalUnits} unidades)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-200">Cliente</span>
              <div className="text-sm font-semibold max-w-[180px] truncate">{client.name}</div>
              <span className="text-[11px] text-blue-200">{client.taxCondition}</span>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Seleccionar Medio de Pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {paymentMethodsList.map((pm) => {
                const Icon = pm.icon
                const isSelected = paymentMethod === pm.id

                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.id)
                      if (pm.id === "EFECTIVO") {
                        setAmountPaid(total)
                      }
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-100 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{pm.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cash Payment Specific Inputs */}
          {isCash && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-1/2">
                  <Input
                    label="Efectivo Recibido ($)"
                    type="number"
                    value={amountPaid}
                    onChange={(e) =>
                      setAmountPaid(
                        e.target.value === "" ? "" : Math.max(0, Number(e.target.value))
                      )
                    }
                    placeholder="Monto entregado por el cliente"
                    required
                    min={total}
                    autoFocus
                  />
                </div>

                <div className="w-full sm:w-1/2 flex flex-col justify-end text-right">
                  <span className="text-xs text-slate-500">Vuelto / Cambio a Entregar</span>
                  <div
                    className={`text-2xl font-bold ${
                      isInsufficientCash ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    ${change.toLocaleString("es-CL")}
                  </div>
                  {isInsufficientCash && (
                    <span className="text-[11px] text-red-500 font-medium">
                      Faltan ${(total - paid).toLocaleString("es-CL")}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Cash Shortcuts */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  Acceso rápido:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickCash(0)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Exacto (${total.toLocaleString("es-CL")})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(1000)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  +$1.000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(5000)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  +$5.000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(10000)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  +$10.000
                </button>
              </div>
            </div>
          )}

          {/* Current Account Warning */}
          {paymentMethod === "CUENTA_CORRIENTE" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-300">
                <p className="font-semibold">Venta a Crédito en Cuenta Corriente</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-400">
                  {client.hasCurrentAccount
                    ? `Cliente habilitado. Saldo disponible en cuenta: $${(
                        client.currentAccountBalance || 0
                      ).toLocaleString("es-CL")}.`
                    : "Advertencia: Este cliente no tiene línea de cuenta corriente registrada."}
                </p>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <Input
            label="Observaciones de la Venta (Opcional)"
            placeholder="Ej: Retira en sucursal con orden de compra #12"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Modal Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Volver al Carrito
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmitting}
              disabled={isInsufficientCash}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirmar Venta y Generar Ticket
            </Button>
          </div>
        </form>
      ) : generatedInvoice ? (
        /* Digital Receipt / Ticket View */
        <div className="space-y-6">
          {/* Printable Ticket Container */}
          <div
            id="printable-ticket"
            className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-4 shadow-sm"
          >
            {/* Ticket Header */}
            <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3 space-y-1">
              <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                GESTIÓN MANAGER POS
              </h3>
              <p className="text-[11px] text-slate-500">RUT / CUIT: 30-77123456-0</p>
              <p className="text-[11px] text-slate-500">{generatedInvoice.branchName}</p>
              <p className="text-[10px] text-slate-400">Tel: +54 11 4000-0000 • www.gestionmanager.com</p>
            </div>

            {/* Ticket Meta Info */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <div className="flex justify-between">
                <span>N° COMPROBANTE:</span>
                <span className="font-bold">{generatedInvoice.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA & HORA:</span>
                <span>{generatedInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="font-semibold truncate max-w-[200px]">{generatedInvoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>CONDICIÓN:</span>
                <span>{generatedInvoice.clientTaxCondition || "Consumidor Final"}</span>
              </div>
              <div className="flex justify-between">
                <span>CAJERO:</span>
                <span>{generatedInvoice.cashierName}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
              <div className="flex justify-between font-bold text-[11px] text-slate-500 uppercase">
                <span>Cant. x Detalle</span>
                <span>Importe</span>
              </div>
              {generatedInvoice.items.map((item, index) => (
                <div key={index} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold">{item.name}</span>
                    <span>${item.subtotal.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.quantity} un. x ${item.unitPrice.toLocaleString("es-CL")} (SKU: {item.code})
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>SUBTOTAL NETO:</span>
                <span>${generatedInvoice.summary.subtotal.toLocaleString("es-CL")}</span>
              </div>

              {generatedInvoice.summary.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>DESCUENTO ({generatedInvoice.summary.discountValue}%):</span>
                  <span>-${generatedInvoice.summary.discountAmount.toLocaleString("es-CL")}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>IVA ESTIMADO (21%):</span>
                <span>${generatedInvoice.summary.taxAmount.toLocaleString("es-CL")}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-300 dark:border-slate-700">
                <span>TOTAL A PAGAR:</span>
                <span>${generatedInvoice.summary.total.toLocaleString("es-CL")}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="space-y-1 text-[11px] pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
              <div className="flex justify-between">
                <span>FORMA DE PAGO:</span>
                <span className="font-semibold">{generatedInvoice.paymentMethod}</span>
              </div>
              {generatedInvoice.paymentMethod === "EFECTIVO" && (
                <>
                  <div className="flex justify-between">
                    <span>PAGÓ CON:</span>
                    <span>${generatedInvoice.amountPaid.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>SU VUELTO:</span>
                    <span>${generatedInvoice.changeAmount.toLocaleString("es-CL")}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Thank You */}
            <div className="text-center pt-3 text-[10px] text-slate-400 space-y-0.5">
              <p className="font-semibold">¡GRACIAS POR SU COMPRA!</p>
              <p>Comprobante no válido como factura fiscal electrónica oficial.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Imprimir Ticket (F9)
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={() => {
                onNewSale()
                onClose()
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Iniciar Nueva Venta (ESC)
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
