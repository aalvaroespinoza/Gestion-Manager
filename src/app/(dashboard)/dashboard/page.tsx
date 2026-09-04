"use client"

import React, { useState, useMemo } from "react"
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
  ArrowDownRight,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
} from "lucide-react"

// =========================================================================
// Real-world Business Intelligence Datasets
// =========================================================================

interface TimeRangeDataPoint {
  label: string
  sublabel: string
  amount: number
  orders: number
}

interface TimeRangeConfig {
  total: number
  growth: string
  avgTicket: number
  totalOrders: number
  grossMargin: string
  data: TimeRangeDataPoint[]
}

const DASHBOARD_DATA_BY_RANGE: Record<"7D" | "30D" | "90D", TimeRangeConfig> = {
  "7D": {
    total: 2868750,
    growth: "+14.8%",
    avgTicket: 31875,
    totalOrders: 90,
    grossMargin: "34.8%",
    data: [
      { label: "29 Ago", sublabel: "Sábado", amount: 590400, orders: 18 },
      { label: "30 Ago", sublabel: "Domingo", amount: 185000, orders: 6 },
      { label: "31 Ago", sublabel: "Lunes", amount: 340800, orders: 11 },
      { label: "01 Sep", sublabel: "Martes", amount: 412500, orders: 13 },
      { label: "02 Sep", sublabel: "Miércoles", amount: 368200, orders: 12 },
      { label: "03 Sep", sublabel: "Jueves", amount: 495600, orders: 16 },
      { label: "04 Sep", sublabel: "Viernes (Hoy)", amount: 476250, orders: 14 },
    ],
  },
  "30D": {
    total: 13040000,
    growth: "+15.3%",
    avgTicket: 31882,
    totalOrders: 409,
    grossMargin: "34.2%",
    data: [
      { label: "06-10 Ago", sublabel: "Semana 1", amount: 1850000, orders: 58 },
      { label: "11-15 Ago", sublabel: "Semana 2", amount: 2140000, orders: 66 },
      { label: "16-20 Ago", sublabel: "Semana 3", amount: 1980000, orders: 62 },
      { label: "21-25 Ago", sublabel: "Semana 4", amount: 2320000, orders: 74 },
      { label: "26-30 Ago", sublabel: "Semana 5", amount: 2260000, orders: 71 },
      { label: "31 Ago-04 Sep", sublabel: "Semana 6 (Actual)", amount: 2490000, orders: 78 },
    ],
  },
  "90D": {
    total: 40350000,
    growth: "+18.7%",
    avgTicket: 31572,
    totalOrders: 1278,
    grossMargin: "33.9%",
    data: [
      { label: "Jun Q1", sublabel: "1 - 15 Jun", amount: 5800000, orders: 185 },
      { label: "Jun Q2", sublabel: "16 - 30 Jun", amount: 6200000, orders: 198 },
      { label: "Jul Q1", sublabel: "1 - 15 Jul", amount: 6450000, orders: 206 },
      { label: "Jul Q2", sublabel: "16 - 31 Jul", amount: 6900000, orders: 218 },
      { label: "Ago Q1", sublabel: "1 - 15 Ago", amount: 7150000, orders: 226 },
      { label: "Ago Q2 - Sep", sublabel: "16 Ago - Hoy", amount: 7850000, orders: 245 },
    ],
  },
}

// Weekly bars (Last 7 days ending today)
const weeklyBarData = [
  { day: "Sáb", date: "29 Ago", total: 590400, orders: 18, pctOfMax: 100, formattedShort: "$590K" },
  { day: "Dom", date: "30 Ago", total: 185000, orders: 6, pctOfMax: 31, formattedShort: "$185K" },
  { day: "Lun", date: "31 Ago", total: 340800, orders: 11, pctOfMax: 58, formattedShort: "$341K" },
  { day: "Mar", date: "01 Sep", total: 412500, orders: 13, pctOfMax: 70, formattedShort: "$413K" },
  { day: "Mié", date: "02 Sep", total: 368200, orders: 12, pctOfMax: 62, formattedShort: "$368K" },
  { day: "Jue", date: "03 Sep", total: 495600, orders: 16, pctOfMax: 84, formattedShort: "$496K" },
  { day: "Vie", date: "04 Sep (Hoy)", total: 476250, orders: 14, pctOfMax: 81, formattedShort: "$476K" },
]

// Real critical products matching actual catalog in src/mocks/inventoryData.ts
const criticalStockProducts = [
  {
    id: "prod-3",
    name: "Cemento Especial Bío Bío Alta Resistencia",
    sku: "CST-CEMT-ESP",
    category: "Materiales de Construcción",
    current: 0,
    min: 40,
    status: "OUT_OF_STOCK",
  },
  {
    id: "prod-9",
    name: "Esmeril Angular 9 Pulgadas 2400W",
    sku: "FER-ESM-ANG-9",
    category: "Ferretería General",
    current: 2,
    min: 4,
    status: "LOW_STOCK",
  },
  {
    id: "prod-2",
    name: "Plancha Tablero OSB Estructural 15mm",
    sku: "CST-OSB-15MM",
    category: "Materiales de Construcción",
    current: 6,
    min: 15,
    status: "LOW_STOCK",
  },
]

// Real recent sales with correct format INV-xxxxx and actual catalog items
const recentTransactions = [
  {
    id: "tx-1",
    ticket: "INV-00108",
    customer: "Constructora Andina S.A.",
    customerDoc: "CUIT: 30-71234567-8",
    itemsDesc: "1x Taladro Percutor Brushless 20V",
    paymentMethod: "TRANSFERENCIA",
    amount: 149990,
    status: "COMPLETADA",
    time: "Hace 15 min",
  },
  {
    id: "tx-2",
    ticket: "INV-00107",
    customer: "Consumidor Final",
    customerDoc: "DNI: 00000000",
    itemsDesc: "1x Parka Térmica Industrial XL",
    paymentMethod: "EFECTIVO",
    amount: 45990,
    status: "COMPLETADA",
    time: "Hace 42 min",
  },
  {
    id: "tx-3",
    ticket: "INV-00106",
    customer: "Ferretería Central SpA",
    customerDoc: "CUIT: 30-68991234-2",
    itemsDesc: "3x Plancha OSB 15mm (Retiro obra)",
    paymentMethod: "CUENTA_CORRIENTE",
    amount: 45000,
    status: "COMPLETADA",
    time: "Hace 1 h 20 min",
  },
  {
    id: "tx-4",
    ticket: "INV-00105",
    customer: "Juan Ignacio Pérez",
    customerDoc: "DNI: 34.892.110",
    itemsDesc: "6x Perfil Metalcon C Estructural",
    paymentMethod: "TARJETA_DEBITO",
    amount: 59940,
    status: "COMPLETADA",
    time: "Hace 2 h 45 min",
  },
  {
    id: "tx-5",
    ticket: "INV-00104",
    customer: "María Eugenia Rossi",
    customerDoc: "DNI: 28.450.781",
    itemsDesc: "1x Esmeril Angular 9 Pulgadas 2400W",
    paymentMethod: "TARJETA_CREDITO",
    amount: 124990,
    status: "COMPLETADA",
    time: "Hace 4 h 10 min",
  },
  {
    id: "tx-6",
    ticket: "INV-00103",
    customer: "Consumidor Final",
    customerDoc: "DNI: 00000000",
    itemsDesc: "5x Cemento Bío Bío 25kg (Lote previo)",
    paymentMethod: "EFECTIVO",
    amount: 50340,
    status: "COMPLETADA",
    time: "Hoy 09:30",
  },
]

// Real Kardex movements
const recentKardexMovements = [
  {
    id: "kdx-1",
    folio: "KDX-00452",
    type: "SALIDA" as const,
    reason: "Venta Mostrador POS (INV-00108)",
    product: "Taladro Percutor Brushless 20V",
    sku: "FER-TAL-20V-BL",
    quantity: -1,
    resultingStock: 15,
    user: "Cajero Mostrador",
    time: "Hace 15 min",
  },
  {
    id: "kdx-2",
    folio: "KDX-00451",
    type: "SALIDA" as const,
    reason: "Venta Mostrador POS (INV-00107)",
    product: "Parka Térmica Industrial XL",
    sku: "IND-PRK-TERM-XL",
    quantity: -1,
    resultingStock: 23,
    user: "Cajero Mostrador",
    time: "Hace 42 min",
  },
  {
    id: "kdx-3",
    folio: "KDX-00450",
    type: "ENTRADA" as const,
    reason: "Recepción Orden de Compra (OC-0028)",
    product: "Plancha Tablero OSB Estructural 15mm",
    sku: "CST-OSB-15MM",
    quantity: 10,
    resultingStock: 6,
    user: "Bodega Central",
    time: "Ayer 17:40",
  },
  {
    id: "kdx-4",
    folio: "KDX-00449",
    type: "SALIDA" as const,
    reason: "Venta Mostrador POS (INV-00105)",
    product: "Perfil Metalcon C Estructural",
    sku: "CST-PER-GALV",
    quantity: -6,
    resultingStock: 120,
    user: "Cajero Mostrador",
    time: "Hace 2 h 45 min",
  },
  {
    id: "kdx-5",
    folio: "KDX-00448",
    type: "AJUSTE" as const,
    reason: "Ajuste por Merma / Rotura en Depósito",
    product: "Cemento Especial Bío Bío",
    sku: "CST-CEMT-ESP",
    quantity: -4,
    resultingStock: 0,
    user: "Supervisor Turno",
    time: "Ayer 15:10",
  },
]

// =========================================================================
// Mathematical Catmull-Rom to Cubic Bezier Spline Path Generator
// =========================================================================

interface Point {
  x: number
  y: number
}

function generateSplinePath(points: Point[], closeBottom = false, baselineY = 150): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`

  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : p2

    // Continuous Catmull-Rom control points
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }

  if (closeBottom) {
    const firstX = points[0].x.toFixed(2)
    const lastX = points[points.length - 1].x.toFixed(2)
    path += ` L ${lastX},${baselineY} L ${firstX},${baselineY} Z`
  }

  return path
}

export default function DashboardOverviewPage() {
  const [activeTab, setActiveTab] = useState<"SALES" | "STOCK">("SALES")
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D")
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)
  const [hoveredWeeklyBar, setHoveredWeeklyBar] = useState<number | null>(null)

  // Spring physics config for microinteractions
  const springConfig = { type: "spring" as const, stiffness: 380, damping: 26, mass: 0.8 }

  // Active dataset derived from selected timeRange
  const activeDataset = DASHBOARD_DATA_BY_RANGE[timeRange]

  // Coordinate math for the area chart (viewBox 0 0 680 180)
  const chartCoordinates = useMemo(() => {
    const points = activeDataset.data
    const svgWidth = 680
    const padX = 42
    const usableWidth = svgWidth - padX * 2
    const topY = 28
    const bottomY = 145
    const usableHeight = bottomY - topY

    const amounts = points.map((p) => p.amount)
    const minAmount = Math.min(...amounts) * 0.75 // Add lower baseline headroom
    const maxAmount = Math.max(...amounts) * 1.15 // Add upper headroom
    const range = maxAmount - minAmount || 1

    const calculatedPoints: (Point & TimeRangeDataPoint & { index: number })[] = points.map(
      (pt, idx) => {
        const x = padX + (idx / (points.length - 1)) * usableWidth
        const normalizedY = (pt.amount - minAmount) / range
        const y = bottomY - normalizedY * usableHeight

        return {
          ...pt,
          index: idx,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
        }
      }
    )

    const linePath = generateSplinePath(calculatedPoints, false, bottomY)
    const areaPath = generateSplinePath(calculatedPoints, true, bottomY)

    return {
      points: calculatedPoints,
      linePath,
      areaPath,
      bottomY,
      topY,
    }
  }, [activeDataset])

  const selectedPoint =
    hoveredPointIndex !== null
      ? chartCoordinates.points[hoveredPointIndex]
      : chartCoordinates.points[chartCoordinates.points.length - 1]

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
              En Línea • Balances Cuadrados
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground mt-2">
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Supervisión comercial consolidada, arqueo de mostrador y métricas operativas en tiempo real.
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
                  Facturación Consolidada ({timeRange})
                </p>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-3xl sm:text-5xl font-black font-mono tabular-nums tracking-tight text-foreground">
                    ${activeDataset.total.toLocaleString("es-CL")}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 font-mono tabular-nums">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {activeDataset.growth}
                  </span>
                </div>
              </div>

              {/* Time Range Selector with Fluid Morphing */}
              <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-xl self-start sm:self-auto">
                {(["7D", "30D", "90D"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setTimeRange(r)
                      setHoveredPointIndex(null)
                    }}
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

            {/* Interactive Smooth Mathematical Spline Area Chart */}
            <div className="relative pt-4 pb-2">
              {/* Dynamic Interactive Tooltip Pill */}
              <div className="flex items-center justify-between min-h-[28px] mb-1 px-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {selectedPoint.label} ({selectedPoint.sublabel}):
                  </span>
                  <span className="font-mono tabular-nums font-bold text-primary">
                    ${selectedPoint.amount.toLocaleString("es-CL")}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    • {selectedPoint.orders} tickets
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                  Pasa el ratón sobre los puntos para inspeccionar cada registro
                </span>
              </div>

              <div className="h-44 sm:h-52 w-full relative">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 680 180"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                      <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="color-mix(in srgb, var(--primary) 70%, #fff)" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  <line x1="30" y1="40" x2="650" y2="40" stroke="var(--border)" strokeDasharray="3 3" opacity="0.35" />
                  <line x1="30" y1="85" x2="650" y2="85" stroke="var(--border)" strokeDasharray="3 3" opacity="0.35" />
                  <line x1="30" y1="130" x2="650" y2="130" stroke="var(--border)" strokeDasharray="3 3" opacity="0.35" />

                  {/* Shaded Smooth Area */}
                  <path
                    d={chartCoordinates.areaPath}
                    fill="url(#areaGradient)"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Line Stroke with Continuous Spline */}
                  <path
                    d={chartCoordinates.linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Crosshair Guide Line on Selected Point */}
                  {selectedPoint && (
                    <line
                      x1={selectedPoint.x}
                      y1={chartCoordinates.topY}
                      x2={selectedPoint.x}
                      y2={chartCoordinates.bottomY}
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.65"
                    />
                  )}

                  {/* Data Points (Mathematically positioned on the curve) */}
                  {chartCoordinates.points.map((p, idx) => {
                    const isHovered = hoveredPointIndex === idx
                    const isLast = idx === chartCoordinates.points.length - 1 && hoveredPointIndex === null

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                        className="cursor-pointer"
                      >
                        {/* Invisible enlarged hit target for effortless hover */}
                        <rect
                          x={p.x - 20}
                          y={chartCoordinates.topY - 10}
                          width={40}
                          height={chartCoordinates.bottomY - chartCoordinates.topY + 20}
                          fill="transparent"
                        />

                        {/* Outer Glow Circle */}
                        {(isHovered || isLast) && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="9"
                            className="fill-primary/20 animate-pulse"
                          />
                        )}

                        {/* Point Marker */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered || isLast ? "5" : "3.5"}
                          className={`transition-all duration-200 ${
                            isHovered || isLast
                              ? "fill-primary stroke-background stroke-[2.5px]"
                              : "fill-background stroke-primary stroke-[2px]"
                          }`}
                        />

                        {/* X-Axis Day/Date Label */}
                        <text
                          x={p.x}
                          y={chartCoordinates.bottomY + 18}
                          textAnchor="middle"
                          className={`text-[10px] font-mono tracking-tight transition-colors ${
                            isHovered || isLast ? "fill-foreground font-bold" : "fill-muted-foreground font-medium"
                          }`}
                        >
                          {p.label}
                        </text>
                      </g>
                    )
                  })}
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
                ${activeDataset.avgTicket.toLocaleString("es-CL")}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Transacciones
              </span>
              <p className="text-base sm:text-xl font-black font-mono tabular-nums text-foreground">
                {activeDataset.totalOrders} tickets
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Margen Bruto
              </span>
              <p className="text-base sm:text-xl font-black font-mono tabular-nums text-emerald-500">
                {activeDataset.grossMargin}
              </p>
            </div>
          </div>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 2: CASH REGISTER & REALTIME FLOW (Col 12 / Lg 4) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12 lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Turno de Caja (Mostrador)
              </span>
              <Badge variant="success" size="sm" dot>
                Caja Abierta
              </Badge>
            </div>

            {/* Cash in Drawer Metric - Mathematically Reconciled */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">Efectivo Físico en Gaveta</span>
              <div className="text-3xl font-black font-mono tabular-nums text-foreground mt-0.5">
                $225.890
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40">
                <span>Fondo inicial: <strong className="font-mono text-foreground">$80.000</strong></span>
                <span>Cobrado hoy: <strong className="font-mono text-emerald-500">+$145.890</strong></span>
              </div>
            </div>

            {/* Payment Method Breakdown Progress Bars (Sum = $476.250 / 100%) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Ventas del Turno
                </span>
                <span className="font-mono tabular-nums text-xs font-bold text-foreground">
                  $476.250 (14 tickets)
                </span>
              </div>

              {/* Cash (30.6%) */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                    Efectivo
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">
                    $145.890 (30.6%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "30.6%" }} />
                </div>
              </div>

              {/* Cards (39.9%) */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    Tarjetas (Débito / Crédito)
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">
                    $189.960 (39.9%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "39.9%" }} />
                </div>
              </div>

              {/* Transfers (20.0%) */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                    Transferencias / QR
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">
                    $95.400 (20.0%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "20.0%" }} />
                </div>
              </div>

              {/* Current Account (9.5%) */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Receipt className="h-3.5 w-3.5 text-purple-500" />
                    Cuenta Corriente (Crédito)
                  </span>
                  <span className="font-mono tabular-nums text-foreground font-bold">
                    $45.000 (9.5%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: "9.5%" }} />
                </div>
              </div>
            </div>

            {/* Shift Operational Metadata */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>Apertura: <strong className="text-foreground">08:00 hs</strong></span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Users className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>Cajero: <strong className="text-foreground">Alvaro E.</strong></span>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <Link href="/ventas" className="mt-4 block">
            <Button
              variant="default"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              className="w-full justify-between font-bold cursor-pointer active:scale-[0.98]"
            >
              <span>Arqueo & Cierre de Caja</span>
              <kbd className="px-1.5 py-0.5 bg-black/25 text-[10px] rounded font-mono">F9</kbd>
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
                      <span className="font-bold text-xs text-foreground truncate max-w-[190px]" title={p.name}>
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

                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOut ? "bg-red-500" : "bg-amber-500"
                        }`}
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

            <div className="grid grid-cols-1 gap-2 mt-3">
              <Link href="/ventas">
                <div className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">Nueva Venta POS</span>
                      <span className="text-[10px] text-muted-foreground">Terminal de cobro y tickets</span>
                    </div>
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
                  <div>
                    <span className="text-xs font-bold text-foreground block">Comandos & Búsqueda</span>
                    <span className="text-[10px] text-muted-foreground">Buscador global omnibox</span>
                  </div>
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
                    <div>
                      <span className="text-xs font-bold text-foreground block">Catálogo & Stock</span>
                      <span className="text-[10px] text-muted-foreground">Artículos, precios y Kardex</span>
                    </div>
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
                    <div>
                      <span className="text-xs font-bold text-foreground block">Directorio Clientes</span>
                      <span className="text-[10px] text-muted-foreground">Padrón fiscal y cuentas corrientes</span>
                    </div>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono text-foreground font-bold shadow-xs">
                    Shift+C
                  </kbd>
                </div>
              </Link>
            </div>
          </div>

          {/* Hardware Device Status Banner (Industrial POS Touch - Fills vertical dead space) */}
          <div className="mt-3 p-2.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-foreground">Lector Barcode USB</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Modo HID &lt;45ms Listo</span>
          </div>
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
              <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                Últimos 7 Días
              </Badge>
            </div>

            {/* Weekly Total Metric Header (Fills upper space with actionable data) */}
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-foreground">
                  $2.868.750
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  90 tickets • Promedio: <strong className="font-mono text-foreground">$409.821</strong>/día
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 font-mono tabular-nums">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +14.8%
              </span>
            </div>

            {/* Interactive Bar Chart with Target Guideline and Value Labels */}
            <div className="pt-4 pb-1">
              <div className="relative h-44 flex items-end justify-between gap-1.5 sm:gap-2">
                {/* Horizontal meta line */}
                <div className="absolute inset-x-0 top-3 border-b border-dashed border-border/70 flex items-center justify-end">
                  <span className="text-[9px] font-mono text-muted-foreground bg-card/90 px-1 -translate-y-1/2">
                    Meta $500K
                  </span>
                </div>

                {weeklyBarData.map((d, i) => (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredWeeklyBar(i)}
                    onMouseLeave={() => setHoveredWeeklyBar(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {hoveredWeeklyBar === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 px-2.5 py-1 bg-card border border-border text-[10px] font-mono tabular-nums font-bold rounded-lg shadow-xl whitespace-nowrap z-20"
                      >
                        <div className="text-foreground">${d.total.toLocaleString("es-CL")}</div>
                        <div className="text-[9px] text-muted-foreground font-normal">
                          {d.date} • {d.orders} tickets
                        </div>
                      </motion.div>
                    )}

                    {/* Numeric value label above bar */}
                    <span className="text-[9px] font-mono tabular-nums text-muted-foreground group-hover:text-foreground mb-1 transition-colors">
                      {d.formattedShort}
                    </span>

                    {/* Bar container */}
                    <div className="w-full bg-muted/60 rounded-lg overflow-hidden flex flex-col justify-end h-[115px]">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.pctOfMax}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }}
                        className={`w-full rounded-lg transition-colors ${
                          hoveredWeeklyBar === i
                            ? "bg-primary shadow-sm shadow-primary/30"
                            : d.pctOfMax >= 90
                            ? "bg-primary/85"
                            : "bg-primary/50"
                        }`}
                      />
                    </div>

                    <span className="text-[10px] font-bold text-muted-foreground mt-2 group-hover:text-foreground transition-colors">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Mayor día: <strong className="text-foreground">Sábado ($590K)</strong></span>
            <span>Efectividad: <strong className="text-emerald-500 font-mono">94.2%</strong></span>
          </div>
        </SpotlightCard>

        {/* ========================================================= */}
        {/* CARD 6: RECENT TRANSACTIONS & KARDEX (Col 12) */}
        {/* ========================================================= */}
        <SpotlightCard className="col-span-12">
          {/* Tabs Bar with Spring Morphing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Actividad Comercial & Auditoría en Vivo
              </h3>
              <p className="text-xs text-muted-foreground">
                Últimas operaciones de venta y movimientos de inventario en mostrador.
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
                  Ventas Recientes ({recentTransactions.length})
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
                  Movimientos Kardex ({recentKardexMovements.length})
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Activity Tables */}
          {activeTab === "SALES" ? (
            /* TAB 1: Real Sales Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Comprobante</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Cliente / Razón Social</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Detalle Productos</th>
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
                      <td className="py-3 px-2 text-muted-foreground font-medium max-w-[240px] truncate">
                        {tx.itemsDesc}
                      </td>
                      <td className="py-3 px-2 font-semibold text-muted-foreground">
                        {tx.paymentMethod.replace("_", " ")}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-black text-foreground">
                        ${tx.amount.toLocaleString("es-CL")}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="success" size="sm" dot>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground font-mono text-[11px]">
                        {tx.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TAB 2: True Kardex Movements Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Folio Kardex</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Tipo Operación</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Producto & SKU</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Motivo / Referencia</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Variación</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Stock Final</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentKardexMovements.map((kdx) => (
                    <tr key={kdx.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-2 font-mono tabular-nums font-bold text-primary">
                        {kdx.folio}
                      </td>
                      <td className="py-3 px-2">
                        {kdx.type === "ENTRADA" ? (
                          <Badge variant="success" size="sm">
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                            Entrada
                          </Badge>
                        ) : kdx.type === "SALIDA" ? (
                          <Badge variant="secondary" size="sm">
                            <ArrowDownCircle className="h-3 w-3 mr-1 text-red-500" />
                            Salida POS
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            <SlidersHorizontal className="h-3 w-3 mr-1" />
                            Ajuste
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-foreground">{kdx.product}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{kdx.sku}</div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground font-medium">
                        <div>{kdx.reason}</div>
                        <div className="text-[10px] text-muted-foreground/80">{kdx.user}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-black">
                        <span className={kdx.quantity > 0 ? "text-emerald-500" : "text-red-500"}>
                          {kdx.quantity > 0 ? `+${kdx.quantity}` : kdx.quantity} un.
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-bold text-foreground">
                        {kdx.resultingStock} un.
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground font-mono text-[11px]">
                        {kdx.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SpotlightCard>
      </div>
    </motion.div>
  )
}
