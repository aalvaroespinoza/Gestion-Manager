"use client"

import React, { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Plus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react"

const sampleFormSchema: DynamicFormSchemaConfig = {
  id: "quick-product-form",
  title: "Nuevo Registro Dinámico (Demo JSON Schema)",
  description: "Formulario generado 100% dinámicamente con validaciones Zod y React Hook Form.",
  columns: 2,
  submitText: "Crear Registro",
  resetText: "Limpiar Campos",
  showReset: true,
  fields: [
    {
      name: "name",
      label: "Nombre del Producto / Ítem",
      type: "text",
      placeholder: "Ej: Monitor Curvo 27' 144Hz",
      required: true,
      minLength: 3,
      colSpan: "full",
      description: "Nombre descriptivo para inventario y facturación.",
    },
    {
      name: "category",
      label: "Categoría",
      type: "select",
      required: true,
      placeholder: "Selecciona una categoría",
      options: [
        { label: "Hardware & Computación", value: "hardware" },
        { label: "Accesorios & Periféricos", value: "accessories" },
        { label: "Redes & Comunicaciones", value: "networking" },
        { label: "Servicios Digitales", value: "services" },
      ],
    },
    {
      name: "price",
      label: "Precio Unitario (CLP)",
      type: "number",
      placeholder: "159990",
      required: true,
      min: 1,
      description: "Valor neto antes de impuestos.",
    },
    {
      name: "initialStock",
      label: "Stock Inicial",
      type: "number",
      placeholder: "25",
      required: true,
      min: 0,
    },
    {
      name: "sku",
      label: "Código SKU / Barra",
      type: "text",
      placeholder: "HW-MON-27-01",
      required: true,
    },
    {
      name: "isFeatured",
      label: "Producto Destacado en Catálogo",
      type: "boolean",
      description: "Mostrar este producto en la pantalla principal de ventas rápidas.",
      defaultValue: true,
    },
    {
      name: "requiresTaxExemption",
      label: "Aplica Exención Tributaria",
      type: "boolean",
      description: "Marcar si el producto está afecto a exenciones legales.",
      defaultValue: false,
    },
  ],
}

export default function DashboardOverviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastSubmittedData, setLastSubmittedData] = useState<any>(null)

  const handleFormSubmit = async (data: Record<string, any>) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    setLastSubmittedData(data)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Panel de Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Resumen operativo y métricas consolidadas en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nuevo Producto Rápido
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Ventas del Mes
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">$18.450.000</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+14.2% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Órdenes Procesadas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">1.284</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.1% nuevas órdenes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Ítems en Stock
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Package className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">4.512</div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              <Badge variant="warning" size="sm" dot>12 en stock crítico</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Clientes Activos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">892</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+24 esta semana</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Section: Dynamic Form Showcase & Live Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Dynamic Form Renderer */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-blue-200/80 dark:border-blue-900/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">
                    Generador de Formularios Dinámicos
                  </CardTitle>
                </div>
                <Badge variant="info" size="sm">JSON Schema + Zod</Badge>
              </div>
              <CardDescription>
                Componente reutilizable que construye y valida formularios dinámicos a partir de un esquema JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicFormRenderer
                schema={sampleFormSchema}
                onSubmit={handleFormSubmit}
              />

              {lastSubmittedData && (
                <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto space-y-2 border border-slate-800 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Payload Recibido y Validado con Éxito:</span>
                  </div>
                  <pre>{JSON.stringify(lastSubmittedData, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Activity Table */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Últimas Transacciones</CardTitle>
                <Badge variant="secondary" size="sm">En Vivo</Badge>
              </div>
              <CardDescription>Movimientos recientes registrados en la sucursal actual.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">#V-1094</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">Constructora Andina</div>
                      <div className="text-[10px] text-slate-400">RUT: 76.840.120-4</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm" dot>Pagado</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">$320.000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">#V-1093</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">Agrícola del Valle</div>
                      <div className="text-[10px] text-slate-400">RUT: 81.230.990-1</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning" size="sm" dot>Pendiente</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">$89.500</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">#V-1092</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">Comercial Pacífico</div>
                      <div className="text-[10px] text-slate-400">RUT: 96.112.450-K</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm" dot>Pagado</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">$1.450.000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">#V-1091</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">Tecnología Global SpA</div>
                      <div className="text-[10px] text-slate-400">RUT: 77.540.900-2</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" size="sm" dot>Anulado</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">$42.000</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Demonstration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Ítem en Catálogo"
        description="Ingresa los datos requeridos para registrar el nuevo producto en la sucursal actual."
        size="lg"
      >
        <div className="py-2">
          <DynamicFormRenderer
            schema={{
              ...sampleFormSchema,
              title: undefined,
              description: undefined,
            }}
            onSubmit={async (data) => {
              await handleFormSubmit(data)
              setIsModalOpen(false)
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
