"use client"

import React, { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuoteData, QuoteStatus } from "@/types/sales"
import {
  Printer,
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  FileCheck2,
  X,
} from "lucide-react"

interface QuoteDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  quote: QuoteData | null
}

export function QuoteDocumentModal({
  isOpen,
  onClose,
  quote,
}: QuoteDocumentModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null)

  if (!quote) return null

  const handlePrint = () => {
    window.print()
  }

  const renderStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="text-muted-foreground border-border">Borrador</Badge>
      case "SENT":
        return <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">Enviado al Cliente</Badge>
      case "APPROVED":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Aprobado</Badge>
      case "CONVERTED_TO_SALE":
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">Convertido a Venta</Badge>
      case "REJECTED":
        return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">Rechazado</Badge>
      case "EXPIRED":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Vencido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 rounded-2xl bg-card border-border shadow-2xl overflow-hidden">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Documento de Presupuesto: {quote.quoteNumber}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Formato formal A4 / Carta para entrega o envío comercial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="font-bold cursor-pointer"
            >
              Imprimir / PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-background/50 print:bg-white print:text-black">
          <div
            ref={printContainerRef}
            className="max-w-2xl mx-auto bg-card print:bg-white p-8 rounded-xl border border-border/80 print:border-none shadow-sm print:shadow-none space-y-6 text-foreground print:text-black font-sans"
          >
            {/* 1. Header & Branding */}
            <div className="flex justify-between items-start border-b border-border pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
                    GM
                  </div>
                  <h1 className="text-xl font-black tracking-tight uppercase">
                    Gestión Manager
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Materiales de Construcción & Soluciones Industriales
                </p>
                <div className="text-[11px] text-muted-foreground mt-2 space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" /> Av. Industrial 4520, Parque Empresarial
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground" /> +56 2 2840 9900
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" /> presupuestos@gestionmanager.cl
                  </p>
                  <p className="font-mono text-[10px]">RUT / CUIT: 76.890.123-5</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block">
                  {renderStatusBadge(quote.status)}
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-primary">
                  {quote.quoteNumber}
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5 mt-2">
                  <p className="flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" /> Emisión: {new Date(quote.date).toLocaleDateString("es-CL")}
                  </p>
                  {quote.validUntil && (
                    <p className="flex items-center justify-end gap-1 font-medium text-amber-500">
                      <Clock className="w-3 h-3" /> Válido hasta: {new Date(quote.validUntil).toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Client Info Card */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Datos del Cliente / Destinatario
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-black text-sm text-foreground">
                    {quote.clientName || "Consumidor Final"}
                  </p>
                  <p className="font-mono text-muted-foreground mt-0.5">
                    Doc / RUT: {quote.clientDoc || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-muted-foreground">
                    Condición Fiscal: <span className="font-bold text-foreground">{quote.clientTaxCondition || "Consumidor Final"}</span>
                  </p>
                  {quote.creatorName && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Emitido por: {quote.creatorName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="rounded-xl border border-border/80 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider border-b border-border/80">
                  <tr>
                    <th className="py-2.5 px-3 text-left">SKU</th>
                    <th className="py-2.5 px-3 text-left">Descripción del Producto</th>
                    <th className="py-2.5 px-3 text-right">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-3 text-right">Desc.</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {quote.items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                        {item.productCode || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        ${item.unitPrice.toLocaleString("es-CL")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">
                        {item.discountPercent ? `${item.discountPercent}%` : "0%"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-foreground">
                        ${Math.round(item.subtotal).toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Totals and Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 text-[11px] text-muted-foreground">
                <span className="font-bold uppercase tracking-wider text-[10px] text-foreground block">
                  Términos y Condiciones Comerciales:
                </span>
                <ul className="list-disc list-inside space-y-1">
                  <li>Precios sujetos a disponibilidad de inventario al momento de confirmación.</li>
                  <li>Esta cotización no constituye reserva definitiva de stock físico.</li>
                  <li>Los valores expresados incluyen impuestos de ley salvo indicación expresa.</li>
                  <li>Formas de pago: Efectivo, Transferencia electrónica, Tarjetas y Cuenta Corriente.</li>
                </ul>
                {quote.notes && (
                  <div className="p-2 rounded bg-muted/40 border border-border/50 mt-2">
                    <span className="font-bold text-foreground">Observaciones: </span>
                    <span>{quote.notes}</span>
                  </div>
                )}
              </div>

              {/* Financial Box */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono tabular-nums font-medium">
                    ${Math.round(quote.subtotal).toLocaleString("es-CL")}
                  </span>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Descuento Comercial:</span>
                    <span className="font-mono tabular-nums">
                      -${Math.round(quote.discount).toLocaleString("es-CL")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (21% / Tasa Vigente):</span>
                  <span className="font-mono tabular-nums font-medium">
                    ${Math.round(quote.tax).toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase text-foreground">
                    Total Cotización:
                  </span>
                  <span className="text-2xl font-black font-mono tabular-nums text-primary">
                    ${Math.round(quote.total).toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Signature Footer */}
            <div className="pt-8 border-t border-border flex justify-between items-end text-[11px] text-muted-foreground">
              <div className="text-center">
                <div className="w-44 border-b border-muted-foreground/60 mb-1" />
                <p>Firma y Aprobación del Cliente</p>
              </div>
              <div className="text-center">
                <div className="w-44 border-b border-muted-foreground/60 mb-1" />
                <p>Gestión Manager - Venta y Despacho</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
