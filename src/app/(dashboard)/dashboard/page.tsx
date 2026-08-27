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
  TableEmpty,
} from "@/components/ui/table"
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Boxes,
  UserPlus,
  ArrowRight,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Layers,
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

  // Ensure hydration safety
  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <TrendingUp className="h-8 w-8 text-[var(--primary-text)]" />
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Resumen operativo y métricas consolidadas en tiempo real.
          </p>
        </div>

        {/* Quick Branch & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-[var(--primary-text)]" />
            <span>Sucursal: <strong>Casa Matriz (Santiago)</strong></span>
          </div>
          <Badge variant="success" size="sm" dot>
            Caja Abierta
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Ventas del Mes */}
        <Card className="hover:border-[var(--primary)] transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ventas del Mes
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary-text)]">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              $18.450.000
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+14.2% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Órdenes / Transacciones */}
        <Card className="hover:border-[var(--primary)] transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Órdenes Procesadas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary-text)]">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              1.284
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.1% transacciones hoy</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Stock Crítico / Alertas */}
        <Card className="hover:border-[var(--primary)] transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Stock Crítico / Alertas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-700">
              4 productos
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
              <Badge variant="warning" size="sm" dot>
                2 bajo mínimo • 2 agotados
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Clientes Activos */}
        <Card className="hover:border-[var(--primary)] transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Clientes Activos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary-text)]">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              892
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+24 registrados este mes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Central Quick Actions Grid (Accesos Rápidos) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Accesos Rápidos & Operaciones Frecuentes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quick Action 1: POS Sales */}
          <Link
            href="/ventas"
            className="group relative p-5 rounded-2xl border border-border bg-card hover:border-[var(--primary)] hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-2xl text-white shadow-sm group-hover:scale-105 transition-transform"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground group-hover:text-[var(--primary-text)] transition-colors">
                  Nueva Venta (POS)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Terminal de mostrador y cobro con tickets
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[var(--primary-text)] group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Quick Action 2: Stock & Inventory */}
          <Link
            href="/stock"
            className="group relative p-5 rounded-2xl border border-border bg-card hover:border-[var(--primary)] hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground group-hover:text-amber-700 transition-colors">
                  Catálogo & Re-Stock
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Control de stock, alertas y atributos por rubro
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Quick Action 3: Clients */}
          <Link
            href="/clientes"
            className="group relative p-5 rounded-2xl border border-border bg-card hover:border-[var(--primary)] hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground group-hover:text-indigo-700 transition-colors">
                  Directorio de Clientes
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Cuentas corrientes, CUIT/DNI y contactos
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-700 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Main Section: Weekly Sales Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Weekly Sales Trends (Tailwind Pure CSS Bars) */}
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
                        <span className="w-8 font-bold text-foreground">
                          {item.day}
                        </span>
                        <span className="text-muted-foreground text-[11px] font-medium">
                          ({item.orders} tickets)
                        </span>
                      </div>
                      <span className="font-bold text-foreground font-mono">
                        ${item.total.toLocaleString("es-CL")}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, item.percentage)}%`,
                          backgroundColor: "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Summary Footer */}
              <div className="p-4 rounded-2xl bg-muted/60 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Total Facturado Semana</span>
                  <div className="text-xl font-extrabold text-foreground">
                    $4.570.000
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-medium">Meta Semanal</span>
                  <div className="text-sm font-bold text-emerald-700">
                    94.2% Cumplido
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Activity Feed (Sales & Stock) */}
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
                <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab("SALES")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeActivityTab === "SALES"
                        ? "bg-card text-[var(--primary-text)] font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ventas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab("STOCK")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeActivityTab === "STOCK"
                        ? "bg-card text-[var(--primary-text)] font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
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
                          <div className="font-mono text-xs font-bold text-foreground">
                            {tx.ticket}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">{tx.time}</span>
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-xs text-foreground line-clamp-1">
                            {tx.customer}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" size="sm" className="text-[9px] px-1 py-0">
                              {tx.paymentMethod}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-extrabold text-xs text-foreground font-mono">
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
                          <div className="font-bold text-xs text-foreground line-clamp-1">
                            {mov.product}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground font-medium">
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
                          <span className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                            {mov.reason}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* View All Module Link */}
              <div className="p-3 border-t border-border text-center">
                <Link
                  href={activeActivityTab === "SALES" ? "/ventas" : "/stock"}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-text)] hover:underline"
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
