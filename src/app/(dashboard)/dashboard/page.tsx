"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  Users,
  DollarSign,
  ArrowUpRight,
  AlertTriangle,
  ArrowRight,
  Store,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  CreditCard,
  Banknote,
  Receipt,
  Sparkles,
} from "lucide-react"

// Mock data for weekly trend
const weeklyData = [
  { day: "Lun", total: 420000, orders: 18, height: 45 },
  { day: "Mar", total: 680000, orders: 27, height: 70 },
  { day: "Mié", total: 540000, orders: 22, height: 56 },
  { day: "Jue", total: 890000, orders: 34, height: 92 },
  { day: "Vie", total: 760000, orders: 31, height: 80 },
  { day: "Sáb", total: 950000, orders: 42, height: 100 },
  { day: "Dom", total: 310000, orders: 12, height: 32 },
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

const criticalStockProducts = [
  { id: "p-1", name: "Perfil Metalcon C Estructural", sku: "CST-PER-GALV", current: 0, min: 15, status: "OUT_OF_STOCK" },
  { id: "p-2", name: "Taladro Percutor Brushless 20V", sku: "FER-TAL-20V-BL", current: 2, min: 10, status: "LOW_STOCK" },
  { id: "p-3", name: "Plancha Tablero OSB 15mm", sku: "CST-OSB-15MM", current: 4, min: 20, status: "LOW_STOCK" },
]

export default function DashboardOverviewPage() {
  const [activeTab, setActiveTab] = useState<"SALES" | "STOCK">("SALES")
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D")
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)

  // Spring physics config for microinteractions
  const springConfig = { type: "spring" as const, stiffness: 380, damping: 26, mass: 0.8 }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig}
      className="space-y-6 sm:space-y-8"
    >
      {/* Hero Welcome & Tenant Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Gestión Manager Enterprise
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              En Línea • DB Sincronizada
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground mt-2">
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Supervisión ejecutiva, arqueo de mostrador y métricas comerciales en tiempo real.
          </p>
        </div>

        {/* Quick Launch POS Button */}
        <div className="flex items-center gap-3">
          <Link href="/ventas">
            <Button
              variant="default"
              size="lg"
              leftIcon={<ShoppingCart className="h-4 w-4" />}
              className="font-bold shadow-lg shadow-primary/20 cursor-pointer active:scale-[0.98]"
            >
              <span>Terminal POS</span>
              <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 bg-black/25 text-[10px] rounded font-mono">
                F9
              </kbd>
            </Button>
          </Link>
        </div>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* ========================================================= */}
        {/* CARD 1: HERO FINANCIAL & SALES REVENUE (Col 12 / Lg 8) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12 lg:col-span-8 flex flex-col justify-between">
          <div>
            {/* Top Bar inside Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Facturación Consolidada
                </p>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-3xl sm:text-5xl font-black font-mono tabular-nums tracking-tight text-foreground">
                    $4.610.000
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 font-mono tabular-nums">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +18.4%
                  </span>
                </div>
              </div>

              {/* Time Range Selector with Fluid Morphing */}
              <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-xl self-start sm:self-auto">
                {(["7D", "30D", "90D"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className="relative px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {timeRange === r && (
                      <motion.div
                        layoutId="timeRangePill"
                        className="absolute inset-0 bg-card rounded-lg border border-border shadow-xs"
                        transition={springConfig}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        timeRange === r ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Smooth SVG Area Chart */}
            <div className="relative pt-6 pb-2">
              <div className="h-44 sm:h-52 w-full">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="color-mix(in srgb, var(--primary) 70%, #fff)" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="45" x2="600" y2="45" stroke="var(--border)" strokeDasharray="4 4" opacity="0.4" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="var(--border)" strokeDasharray="4 4" opacity="0.4" />
                  <line x1="0" y1="135" x2="600" y2="135" stroke="var(--border)" strokeDasharray="4 4" opacity="0.4" />

                  {/* Shaded Area */}
                  <path
                    d="M 0,140 Q 90,60 180,95 T 360,50 T 480,25 T 600,70 L 600,180 L 0,180 Z"
                    fill="url(#areaGradient)"
                  />

                  {/* Line Stroke */}
                  <path
                    d="M 0,140 Q 90,60 180,95 T 360,50 T 480,25 T 600,70"
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  {[
                    { cx: 0, cy: 140, val: "$420K" },
                    { cx: 90, cy: 60, val: "$680K" },
                    { cx: 180, cy: 95, val: "$540K" },
                    { cx: 270, cy: 50, val: "$890K" },
                    { cx: 360, cy: 50, val: "$760K" },
                    { cx: 480, cy: 25, val: "$950K" },
                    { cx: 600, cy: 70, val: "$310K" },
                  ].map((p, idx) => (
                    <g key={idx} className="group/point cursor-pointer">
                      <circle
                        cx={p.cx}
                        cy={p.cy}
                        r="5"
                        className="fill-background stroke-primary stroke-[3px] transition-transform duration-200 group-hover/point:scale-150"
                      />
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom KPI Micro-Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 mt-2 border-t border-border/60">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ticket Promedio
              </span>
              <p className="text-base sm:text-xl font-black font-mono tabular-nums text-foreground">
                $148.700
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Transacciones
              </span>
              <p className="text-base sm:text-xl font-black font-mono tabular-nums text-foreground">
                34 tickets
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Margen Bruto
              </span>
              <p className="text-base sm:text-xl font-black font-mono tabular-nums text-emerald-500">
                32.8%
              </p>
            </div>
          </div>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 2: CASH REGISTER & REALTIME FLOW (Col 12 / Lg 4) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12 lg:col-span-4 flex flex-col justify-between">
          <div>
            {/* Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Turno de Caja
              </span>
              <Badge variant="success" size="sm" dot>
                Caja Abierta
              </Badge>
            </div>

            {/* Cash in Drawer Metric */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground">Efectivo en Gaveta</span>
              <div className="text-3xl font-black font-mono tabular-nums text-foreground mt-1">
                $842.150
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Apertura inicial: <strong className="font-mono text-foreground">$150.000</strong>
              </p>
            </div>

            {/* Payment Method Breakdown Progress Bars */}
            <div className="space-y-3 mt-6">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Recaudación por Medio de Pago
              </span>

              {/* Cash */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                    Efectivo
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">$380.000 (45%)</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    Tarjetas (Débito / Crédito)
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">$294.160 (35%)</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "35%" }} />
                </div>
              </div>

              {/* Transfers */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                    Transferencias Bancarias
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">$167.990 (20%)</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "20%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <Link href="/ventas" className="mt-6 block">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              className="w-full justify-between font-bold cursor-pointer"
            >
              <span>Arqueo & Cierre de Caja</span>
              <kbd className="px-1.5 py-0.5 bg-muted text-[10px] rounded font-mono">F9</kbd>
            </Button>
          </Link>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 3: CRITICAL STOCK ALERT (Col 12 / Sm 6 / Lg 4) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-500" />
                Stock Crítico
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-500 font-mono tabular-nums">
                3 productos
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {criticalStockProducts.map((p) => {
                const isOut = p.status === "OUT_OF_STOCK"
                const pct = Math.min(100, Math.round((p.current / p.min) * 100))

                return (
                  <div key={p.id} className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground truncate max-w-[180px]">
                        {p.name}
                      </span>
                      <Badge variant={isOut ? "destructive" : "warning"} size="sm">
                        {isOut ? "Agotado" : `${p.current} un.`}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>SKU: {p.sku}</span>
                      <span>Mínimo: {p.min} un.</span>
                    </div>

                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOut ? "bg-red-500" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Link href="/stock" className="mt-4 block">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              className="w-full justify-between font-bold cursor-pointer"
            >
              <span>Reabastecer en Inventario</span>
              <span className="text-[10px] font-mono text-muted-foreground">Catálogo</span>
            </Button>
          </Link>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 4: COUNTER KEYBOARD SHORTCUTS (Col 12 / Sm 6 / Lg 4) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12 sm:col-span-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Atajos de Mostrador
              </span>
              <Badge variant="secondary" size="sm">
                Teclado Ágil
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4">
              <Link href="/ventas">
                <div className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Nueva Venta POS</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono text-foreground font-bold shadow-xs">
                    F9
                  </kbd>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
                }}
                className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between cursor-pointer text-left w-full group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
                    <Search className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Comandos & Búsqueda</span>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono text-foreground font-bold shadow-xs">
                  Ctrl+K
                </kbd>
              </button>

              <Link href="/stock">
                <div className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                      <Boxes className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Catálogo & Stock</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono text-foreground font-bold shadow-xs">
                    Alt+N
                  </kbd>
                </div>
              </Link>

              <Link href="/clientes">
                <div className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-500">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Directorio Clientes</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono text-foreground font-bold shadow-xs">
                    Shift+C
                  </kbd>
                </div>
              </Link>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 text-center">
            Diseñado para operar a alta velocidad sin tocar el ratón.
          </p>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 5: WEEKLY PERFORMANCE BARS (Col 12 / Lg 4) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Ventas de la Semana
              </span>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                Meta: $1.000.000 / día
              </span>
            </div>

            {/* Interactive Bar Chart with Tooltip */}
            <div className="pt-6 pb-2">
              <div className="h-36 flex items-end justify-between gap-2">
                {weeklyData.map((d, i) => (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {hoveredBarIndex === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-10 px-2 py-1 bg-card border border-border text-[10px] font-mono tabular-nums font-bold rounded-lg shadow-xl whitespace-nowrap z-20"
                      >
                        ${d.total.toLocaleString("es-CL")} ({d.orders} un.)
                      </motion.div>
                    )}

                    {/* Bar */}
                    <div className="w-full bg-muted/60 rounded-lg overflow-hidden flex flex-col justify-end h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.height}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className={`w-full rounded-lg transition-colors ${
                          hoveredBarIndex === i
                            ? "bg-primary"
                            : d.height >= 90
                            ? "bg-primary/85"
                            : "bg-primary/45"
                        }`}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-muted-foreground mt-2 group-hover:text-foreground transition-colors">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Mayor día: <strong className="text-foreground">Sábado ($950K)</strong></span>
            <span>Promedio: <strong className="text-foreground font-mono">$650K</strong></span>
          </div>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 6: RECENT TRANSACTIONS TABLE (Col 12) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12">
          {/* Tabs Bar with Spring Morphing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Actividad & Transacciones en Vivo
              </h3>
              <p className="text-xs text-muted-foreground">
                Últimas operaciones comerciales registradas en el sistema.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("SALES")}
                className="relative px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
              >
                {activeTab === "SALES" && (
                  <motion.div
                    layoutId="activityTabPill"
                    className="absolute inset-0 bg-card rounded-lg border border-border shadow-xs"
                    transition={springConfig}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    activeTab === "SALES" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Ventas Recientes
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("STOCK")}
                className="relative px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
              >
                {activeTab === "STOCK" && (
                  <motion.div
                    layoutId="activityTabPill"
                    className="absolute inset-0 bg-card rounded-lg border border-border shadow-xs"
                    transition={springConfig}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    activeTab === "STOCK" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  Movimientos Kardex
                </span>
              </button>
            </div>
          </div>

          {/* Activity Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Comprobante</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Cliente / Razón Social</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Medio de Pago</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Total</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-center">Estado</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-2 font-mono tabular-nums font-bold text-primary">
                      {tx.ticket}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-foreground">{tx.customer}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{tx.customerDoc}</div>
                    </td>
                    <td className="py-3 px-2 font-semibold text-muted-foreground">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums font-black text-foreground">
                      ${tx.amount.toLocaleString("es-CL")}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="success" size="sm" dot>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right text-muted-foreground">
                      {tx.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      </div>
    </motion.div>
  )
}
