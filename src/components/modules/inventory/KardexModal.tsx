"use client"

import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { exportToCSV } from "@/lib/exportUtils"
import { toast } from "sonner"
import { Product, KardexEntry, KardexMovementType } from "@/types/inventory"
import {
  History,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Calendar,
  UserCheck,
} from "lucide-react"

interface KardexModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  movements: KardexEntry[]
}

export function KardexModal({
  isOpen,
  onClose,
  product,
  movements,
}: KardexModalProps) {
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT" | "ADJUST">("ALL")

  // Filtered movements
  const filteredMovements = useMemo(() => {
    if (!movements) return []
    return movements.filter((m) => {
      if (filterType === "ALL") return true
      if (filterType === "IN") {
        return (
          m.type === "INITIAL_BALANCE" ||
          m.type === "PURCHASE_IN" ||
          m.type === "RETURN_IN" ||
          m.type === "TRANSFER_IN"
        )
      }
      if (filterType === "OUT") {
        return (
          m.type === "SALE_OUT" ||
          m.type === "TRANSFER_OUT" ||
          m.type === "RETURN_OUT"
        )
      }
      if (filterType === "ADJUST") {
        return m.type === "ADJUSTMENT_ADD" || m.type === "ADJUSTMENT_SUB"
      }
      return true
    })
  }, [movements, filterType])

  // Calculated Metrics
  const stats = useMemo(() => {
    let totalIn = 0
    let totalOut = 0

    movements.forEach((m) => {
      const q = Number(m.quantity)
      if (q > 0) totalIn += q
      else totalOut += Math.abs(q)
    })

    return { totalIn, totalOut }
  }, [movements])

  if (!product) return null

  const handleExportKardexCSV = () => {
    exportToCSV(
      `kardex_${product.code}_${new Date().toISOString().slice(0, 10)}`,
      filteredMovements,
      [
        {
          key: "createdAt",
          label: "Fecha",
          format: (v) => new Date(v).toLocaleString("es-CL"),
        },
        { key: "type", label: "Tipo Movimiento" },
        { key: "referenceId", label: "Comprobante / Ref." },
        { key: "quantity", label: "Variación" },
        { key: "previousStock", label: "Stock Anterior" },
        { key: "newStock", label: "Stock Resultante" },
        {
          key: "unitCost",
          label: "Costo Unitario",
          format: (v) => `$${Number(v).toLocaleString("es-CL")}`,
        },
        { key: "reason", label: "Motivo" },
        { key: "userName", label: "Usuario" },
      ]
    )
    toast.success("Kardex Exportado", {
      description: `Historial de movimientos de ${product.name} descargado en CSV.`,
    })
  }

  const renderMovementBadge = (type: KardexMovementType) => {
    switch (type) {
      case "INITIAL_BALANCE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="w-3 h-3" /> Saldo Inicial
          </span>
        )
      case "PURCHASE_IN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ArrowDownRight className="w-3 h-3" /> Compra / Ingreso
          </span>
        )
      case "SALE_OUT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="w-3 h-3" /> Venta Mostrador
          </span>
        )
      case "ADJUSTMENT_ADD":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Sliders className="w-3 h-3" /> Ajuste (+)
          </span>
        )
      case "ADJUSTMENT_SUB":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Sliders className="w-3 h-3" /> Ajuste / Merma (-)
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border">
            {type}
          </span>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-2xl bg-card border-border shadow-2xl overflow-hidden card-specular">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 shrink-0">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>Kardex Inmutable: {product.name}</span>
                  <Badge variant="outline" className="font-mono text-xs font-bold border-primary/40 text-primary">
                    {product.code}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Libro mayor de movimientos de inventario con trazabilidad cronológica y balance resultante.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportKardexCSV}
              className="h-8 text-xs font-bold border-border/80 hover:bg-muted/80 shrink-0"
              leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />}
            >
              Exportar CSV
            </Button>
          </div>
        </DialogHeader>

        {/* Micro-KPIs Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3">
          <Card className="bg-muted/30 border-border/60 shadow-none">
            <CardContent className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" /> Stock On-Hand
              </span>
              <div className="text-xl font-black font-mono tabular-nums text-foreground mt-1">
                {product.stock}{" "}
                <span className="text-xs font-sans font-medium text-muted-foreground">un.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border/60 shadow-none">
            <CardContent className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Total Entradas
              </span>
              <div className="text-xl font-black font-mono tabular-nums text-emerald-500 mt-1">
                +{stats.totalIn}{" "}
                <span className="text-xs font-sans font-medium text-muted-foreground">un.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border/60 shadow-none">
            <CardContent className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Total Salidas
              </span>
              <div className="text-xl font-black font-mono tabular-nums text-rose-500 mt-1">
                -{stats.totalOut}{" "}
                <span className="text-xs font-sans font-medium text-muted-foreground">un.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border/60 shadow-none">
            <CardContent className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Costo Unitario
              </span>
              <div className="text-xl font-black font-mono tabular-nums text-foreground mt-1">
                ${product.costPrice.toLocaleString("es-CL")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <span className="text-xs font-bold text-muted-foreground">Filtrar:</span>
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Todos ({movements.length})
          </button>
          <button
            onClick={() => setFilterType("IN")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "IN"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-emerald-500 hover:bg-muted"
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType("OUT")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "OUT"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-rose-500 hover:bg-muted"
            }`}
          >
            Salidas
          </button>
          <button
            onClick={() => setFilterType("ADJUST")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === "ADJUST"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-amber-500 hover:bg-muted"
            }`}
          >
            Ajustes
          </button>
        </div>

        {/* Movements Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-border/80 bg-background/50">
          {filteredMovements.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
              <History className="h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium">No se encontraron movimientos para el filtro seleccionado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/70 sticky top-0 backdrop-blur-md z-10">
                <TableRow className="border-b border-border/80 divide-x divide-border/60 text-[11px] uppercase tracking-wider font-bold">
                  <TableHead className="w-36">Fecha & Hora</TableHead>
                  <TableHead className="w-44">Operación</TableHead>
                  <TableHead className="w-32">Comprobante</TableHead>
                  <TableHead className="w-28 text-right">Variación</TableHead>
                  <TableHead className="w-28 text-right">Stock Final</TableHead>
                  <TableHead className="min-w-[160px]">Motivo / Detalle</TableHead>
                  <TableHead className="w-36">Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60 text-xs">
                {filteredMovements.map((mov) => {
                  const isPositive = Number(mov.quantity) > 0
                  return (
                    <TableRow
                      key={mov.id}
                      className="divide-x divide-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                          <span>{new Date(mov.createdAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </TableCell>
                      <TableCell>{renderMovementBadge(mov.type)}</TableCell>
                      <TableCell className="font-mono font-bold text-foreground">
                        {mov.referenceId || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-black">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-500"
                              : "text-rose-500"
                          }
                        >
                          {isPositive ? `+${mov.quantity}` : mov.quantity} un.
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-black text-foreground">
                        {mov.newStock} un.
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]" title={mov.reason || ""}>
                        {mov.reason || "Sin observación"}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-muted-foreground/60" />
                          <span>{mov.userName || "Sistema"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Mostrando {filteredMovements.length} movimientos de inventario certificados.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold border-border/80"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
