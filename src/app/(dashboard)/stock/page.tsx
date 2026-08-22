"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { Package, Plus, Search, Filter, AlertTriangle, ArrowUpDown } from "lucide-react"

const newProductSchema: DynamicFormSchemaConfig = {
  columns: 2,
  submitText: "Guardar Producto",
  fields: [
    { name: "name", label: "Nombre del Producto", type: "text", required: true, colSpan: "full", placeholder: "Ej. Teclado Mecánico RGB" },
    { name: "sku", label: "Código SKU", type: "text", required: true, placeholder: "TEC-MEC-01" },
    {
      name: "category",
      label: "Categoría",
      type: "select",
      required: true,
      options: [
        { label: "Computación", value: "computacion" },
        { label: "Periféricos", value: "perifericos" },
        { label: "Almacenamiento", value: "almacenamiento" },
      ],
    },
    { name: "stock", label: "Stock Disponible", type: "number", required: true, placeholder: "10", min: 0 },
    { name: "minStock", label: "Stock Mínimo (Alerta)", type: "number", required: true, placeholder: "5", min: 0 },
    { name: "price", label: "Precio Venta (CLP)", type: "number", required: true, placeholder: "49990", min: 0 },
    { name: "cost", label: "Costo Unitario (CLP)", type: "number", required: true, placeholder: "25000", min: 0 },
    { name: "active", label: "Habilitado para Venta", type: "boolean", defaultValue: true },
  ],
}

const mockProducts = [
  { id: 1, sku: "HW-MON-27", name: "Monitor Curvo 27' 144Hz", category: "Computación", stock: 14, minStock: 5, price: 189990, status: "Disponible" },
  { id: 2, sku: "HW-SSD-1TB", name: "SSD NVMe M.2 1TB Gen4", category: "Almacenamiento", stock: 3, minStock: 5, price: 79990, status: "Crítico" },
  { id: 3, sku: "HW-RAM-16", name: "Memoria RAM DDR5 16GB 6000MHz", category: "Computación", stock: 28, minStock: 10, price: 54990, status: "Disponible" },
  { id: 4, sku: "PER-MOU-01", name: "Mouse Inalámbrico Ergonómico", category: "Periféricos", stock: 0, minStock: 5, price: 29990, status: "Agotado" },
  { id: 5, sku: "PER-KEY-RGB", name: "Teclado Mecánico Custom HotSwap", category: "Periféricos", stock: 9, minStock: 4, price: 89990, status: "Disponible" },
]

export default function StockPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Control de Stock & Inventario
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra existencias, alertas de stock crítico y catálogo por sucursal.
          </p>
        </div>

        <Button variant="default" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          Agregar Producto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Input
                placeholder="Buscar por nombre o SKU..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>
                Filtrar
              </Button>
              <Button variant="outline" size="sm" leftIcon={<ArrowUpDown className="h-3.5 w-3.5" />}>
                Ordenar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Stock Actual</TableHead>
                <TableHead className="text-right">Precio Venta</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-semibold">{p.sku}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-center font-bold">
                    <span className={p.stock <= p.minStock ? "text-amber-600 dark:text-amber-400" : ""}>
                      {p.stock} un.
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">${p.price.toLocaleString("es-CL")}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        p.status === "Disponible"
                          ? "success"
                          : p.status === "Crítico"
                          ? "warning"
                          : "destructive"
                      }
                      size="sm"
                      dot
                    >
                      {p.status}
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
        title="Crear Nuevo Producto en Inventario"
        description="El producto se asociará inmediatamente a la sucursal activa."
        size="lg"
      >
        <div className="py-2">
          <DynamicFormRenderer
            schema={newProductSchema}
            onSubmit={async (data) => {
              await new Promise((r) => setTimeout(r, 600))
              setIsModalOpen(false)
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
