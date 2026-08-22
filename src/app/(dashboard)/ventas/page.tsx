"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { ShoppingCart, Plus, Search, FileText, CheckCircle2 } from "lucide-react"

const newSaleSchema: DynamicFormSchemaConfig = {
  columns: 2,
  submitText: "Procesar Venta",
  fields: [
    { name: "customerName", label: "Razón Social / Cliente", type: "text", required: true, placeholder: "Ej. Inversiones del Sol SpA" },
    { name: "customerRut", label: "RUT Cliente", type: "text", required: true, placeholder: "76.543.210-K" },
    {
      name: "documentType",
      label: "Tipo de Documento",
      type: "select",
      required: true,
      options: [
        { label: "Factura Electrónica Afecta (33)", value: "33" },
        { label: "Boleta Electrónica (39)", value: "39" },
        { label: "Guía de Despacho (52)", value: "52" },
      ],
    },
    {
      name: "paymentMethod",
      label: "Método de Pago",
      type: "select",
      required: true,
      options: [
        { label: "Transferencia Bancaria", value: "transfer" },
        { label: "Tarjeta Débito / Crédito", value: "card" },
        { label: "Efectivo", value: "cash" },
        { label: "Crédito 30 días", value: "credit30" },
      ],
    },
    { name: "totalAmount", label: "Monto Total Bruto (CLP)", type: "number", required: true, placeholder: "150000", min: 1 },
    { name: "sendEmailInvoice", label: "Enviar DTE por correo automáticamente al emitir", type: "boolean", defaultValue: true },
  ],
}

const mockSales = [
  { id: "FOL-1094", date: "2026-08-22", client: "Constructora Andina", dte: "Factura #33", total: 320000, status: "Emitida", payment: "Transferencia" },
  { id: "FOL-1093", date: "2026-08-21", client: "Agrícola del Valle", dte: "Boleta #39", total: 89500, status: "Pendiente", payment: "Efectivo" },
  { id: "FOL-1092", date: "2026-08-21", client: "Comercial Pacífico", dte: "Factura #33", total: 1450000, status: "Emitida", payment: "Tarjeta" },
  { id: "FOL-1091", date: "2026-08-20", client: "Tecnología Global", dte: "Factura #33", total: 42000, status: "Anulada", payment: "Transferencia" },
]

export default function VentasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Módulo de Ventas & Facturación
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Emisión de DTEs, seguimiento de cobros y facturación electrónica.
          </p>
        </div>

        <Button variant="default" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          Nueva Venta / DTE
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Input
                placeholder="Buscar por cliente o folio..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente / Razón Social</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Método Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs font-semibold">{sale.id}</TableCell>
                  <TableCell className="text-xs text-slate-500">{sale.date}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{sale.client}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">{sale.dte}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{sale.payment}</TableCell>
                  <TableCell className="text-right font-bold">${sale.total.toLocaleString("es-CL")}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        sale.status === "Emitida"
                          ? "success"
                          : sale.status === "Pendiente"
                          ? "warning"
                          : "destructive"
                      }
                      size="sm"
                      dot
                    >
                      {sale.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Emitir Nueva Venta"
        description="Genera el documento tributario y descuenta inventario automáticamente."
        size="lg"
      >
        <div className="py-2">
          <DynamicFormRenderer
            schema={newSaleSchema}
            onSubmit={async () => {
              await new Promise((r) => setTimeout(r, 600))
              setIsModalOpen(false)
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
