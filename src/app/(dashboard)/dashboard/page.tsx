"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
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
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  Users,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
} from "lucide-react"

// Mock summary data for dashboard KPIs and charts
const weeklySalesData = [
  { day: "Lun", total: 420000, percentage: 65, orders: 18 },
  { day: "Mar", total: 680000, percentage: 88, orders: 27 },
  { day: "Mié", total: 540000, percentage: 72, orders: 22 },
  { day: "Jue", total: 890000, percentage: 100, orders: 34 },
  { day: "Vie", total: 760000, percentage: 92, orders: 31 },
  { day: "Sáb", total: 950000, percentage: 105, orders: 42 },
  { day: "Dom", total: 310000, percentage: 45, orders: 12 },
]

const recentTransactions = [
  {
    id: "tx-1",
    ticket: "TK-2026-0004521",
    customer: "Constructora Andina S.A.",
    customerDoc: "CUIT: 30-71234567-8",
    paymentMethod: "TRANSFERENCIA",
    amount: 229670,
    status: "COMPLETADA",
    time: "Hace 12 min",
  },
  {
    id: "tx-2",
    ticket: "TK-2026-0004520",
    customer: "Consumidor Final",
    customerDoc: "DNI: 00000000",
    paymentMethod: "EFECTIVO",
    amount: 181488,
    status: "COMPLETADA",
    time: "Hace 45 min",
  },
  {
    id: "tx-3",
    ticket: "TK-2026-0004519",
    customer: "Ferretería Central SpA",
    customerDoc: "CUIT: 30-68991234-2",
    paymentMethod: "CUENTA_CORRIENTE",
    amount: 450000,
    status: "COMPLETADA",
    time: "Hace 2 horas",
  },
  {
    id: "tx-4",
    ticket: "TK-2026-0004518",
    customer: "Juan Ignacio Pérez",
    customerDoc: "DNI: 34.892.110",
    paymentMethod: "TARJETA_DEBITO",
    amount: 67990,
    status: "COMPLETADA",
    time: "Hace 3 horas",
  },
  {
    id: "tx-5",
    ticket: "TK-2026-0004517",
    customer: "Distribuidora del Valle SRL",
    customerDoc: "CUIT: 33-54992110-9",
    paymentMethod: "TRANSFERENCIA",
    amount: 890000,
    status: "COMPLETADA",
    time: "Hace 5 horas",
  },
]

const recentInventoryMovements = [
  {
    id: "mov-1",
    product: "Perfil Metalcon C Estructural",
    sku: "CST-PER-GALV",
    type: "IN",
    quantity: 40,
    reason: "Recepción de mercadería / Compra de stock",
    time: "Hace 30 min",
  },
  {
    id: "mov-2",
    product: "Plancha Tablero OSB Estructural",
    sku: "CST-OSB-15MM",
    type: "OUT",
    quantity: 4,
    reason: "Merma por daño de embalaje",
    time: "Hace 1 hora",
  },
  {
    id: "mov-3",
    product: "Taladro Percutor Brushless 20V",
    sku: "FER-TAL-20V-BL",
    type: "SET",
    quantity: 16,
    reason: "Ajuste por inventario físico en bodega",
    time: "Hace 4 horas",
  },
]

export default function DashboardOverviewPage() {
  const [isClientMounted, setIsClientMounted] = useState(false)
  const [activeActivityTab, setActiveActivityTab] = useState<"SALES" | "STOCK">("SALES")

  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            Panel de Control
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-medium">
            Resumen operativo y métricas consolidadas en tiempo real.
          </p>
        </div>

        {/* Quick Branch & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#18181b] border border-zinc-800 text-xs font-semibold text-zinc-200">
            <Building2 className="h-4 w-4 text-orange-400" />
            <span>Sucursal: <strong className="text-white">Casa Matriz (Santiago)</strong></span>
          </div>
          <Badge variant="success" size="sm" dot>
            Caja Abierta
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Ventas del Mes */}
        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Ventas del Mes
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/30">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              $18.450.000
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+14.2% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Órdenes / Transacciones */}
        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Órdenes Procesadas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/30">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              1.284
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.1% transacciones hoy</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Stock Crítico / Alertas */}
        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Stock Crítico / Alertas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-400">
              4 productos
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mt-1">
              <Badge variant="warning" size="sm" dot>
                2 bajo mínimo • 2 agotados
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Clientes Activos */}
        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Clientes Activos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/30">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              892
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+24 registrados este mes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Central Quick Actions Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Accesos Rápidos & Operaciones Frecuentes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quick Action 1: POS Sales */}
          <Link
            href="/ventas"
            className="group relative p-5 rounded-2xl border border-zinc-800 bg-[#18181b] hover:border-orange-500/60 hover:shadow-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-600 text-white shadow-md shadow-orange-950/40 group-hover:scale-105 transition-transform">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors">
                  Nueva Venta (POS)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  Terminal de mostrador y cobro con tickets
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Quick Action 2: Stock & Inventory */}
          <Link
            href="/stock"
            className="group relative p-5 rounded-2xl border border-zinc-800 bg-[#18181b] hover:border-orange-500/60 hover:shadow-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-zinc-800 text-orange-400 border border-zinc-700 shadow-md group-hover:scale-105 transition-transform">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors">
                  Catálogo & Re-Stock
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  Control de stock, alertas y atributos por rubro
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Quick Action 3: Clients */}
          <Link
            href="/clientes"
            className="group relative p-5 rounded-2xl border border-zinc-800 bg-[#18181b] hover:border-orange-500/60 hover:shadow-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-md group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors">
                  Directorio de Clientes
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  Cuentas corrientes, CUIT/DNI y contactos
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Main Section: Weekly Sales Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Weekly Sales Trends */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Rendimiento de Ventas Semanal
                  </CardTitle>
                  <CardDescription>
                    Ingresos diarios y cumplimiento de meta proyectada de la semana.
                  </CardDescription>
                </div>
                <Badge variant="secondary" size="sm">
                  Esta Semana
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daily Bar Chart */}
              <div className="space-y-3.5 pt-2">
                {weeklySalesData.map((item) => (
                  <div key={item.day} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-bold text-zinc-300">
                          {item.day}
                        </span>
                        <span className="text-zinc-500 text-[11px] font-medium">
                          ({item.orders} tickets)
                        </span>
                      </div>
                      <span className="font-bold text-white font-mono">
                        ${item.total.toLocaleString("es-CL")}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-600 to-amber-500"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Summary Footer */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Total Facturado Semana</span>
                  <div className="text-xl font-black text-white">
                    $4.570.000
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 font-medium">Meta Semanal</span>
                  <div className="text-sm font-bold text-emerald-400">
                    94.2% Cumplido
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Actividad Reciente</CardTitle>
                  <CardDescription>
                    Transacciones y movimientos en tiempo real.
                  </CardDescription>
                </div>

                {/* Activity Mode Switch */}
                <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab("SALES")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      activeActivityTab === "SALES"
                        ? "bg-zinc-800 text-orange-400 font-bold shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Ventas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab("STOCK")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      activeActivityTab === "STOCK"
                        ? "bg-zinc-800 text-orange-400 font-bold shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Stock
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {activeActivityTab === "SALES" ? (
                /* Recent Sales Table */
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Ticket</TableHead>
                      <TableHead className="font-bold">Cliente</TableHead>
                      <TableHead className="text-right font-bold">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="font-mono text-xs font-bold text-orange-400">
                            {tx.ticket}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium">{tx.time}</span>
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-xs text-white line-clamp-1">
                            {tx.customer}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" size="sm" className="text-[9px] px-1 py-0">
                              {tx.paymentMethod}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-black text-xs text-white font-mono">
                            ${tx.amount.toLocaleString("es-CL")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                /* Recent Stock Adjustments Table */
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Producto</TableHead>
                      <TableHead className="text-center font-bold">Ajuste</TableHead>
                      <TableHead className="text-right font-bold">Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInventoryMovements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          <div className="font-bold text-xs text-white line-clamp-1">
                            {mov.product}
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500 font-medium">
                            {mov.sku} • {mov.time}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={
                              mov.type === "IN"
                                ? "success"
                                : mov.type === "OUT"
                                ? "destructive"
                                : "info"
                            }
                            size="sm"
                          >
                            {mov.type === "IN"
                              ? `+${mov.quantity}`
                              : mov.type === "OUT"
                              ? `-${mov.quantity}`
                              : `=${mov.quantity}`}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="text-[11px] text-zinc-400 font-medium line-clamp-1">
                            {mov.reason}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* View All Module Link */}
              <div className="p-3 border-t border-zinc-800 text-center">
                <Link
                  href={activeActivityTab === "SALES" ? "/ventas" : "/stock"}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
                >
                  <span>Ver todas las operaciones en {activeActivityTab === "SALES" ? "Ventas" : "Stock"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
