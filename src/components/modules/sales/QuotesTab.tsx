"use client"

import React, { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { QuoteDocumentModal } from "./QuoteDocumentModal"
import { QuoteData, QuoteStatus } from "@/types/sales"
import {
  FileText,
  Search,
  Printer,
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck,
} from "lucide-react"

interface QuotesTabProps {
  quotes: QuoteData[]
  onConvertToSale: (quote: QuoteData) => void
  onStatusChange: (id: string, newStatus: QuoteStatus) => void
}

export function QuotesTab({
  quotes,
  onConvertToSale,
  onStatusChange,
}: QuotesTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "ALL">("ALL")
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<QuoteData | null>(null)

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (statusFilter !== "ALL" && q.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNumber = q.quoteNumber.toLowerCase().includes(query)
        const matchClient = (q.clientName || "").toLowerCase().includes(query)
        const matchDoc = (q.clientDoc || "").toLowerCase().includes(query)
        if (!matchNumber && !matchClient && !matchDoc) return false
      }
      return true
    })
  }, [quotes, statusFilter, searchQuery])

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = quotes.length
    const approvedQuotes = quotes.filter((q) => q.status === "APPROVED" || q.status === "CONVERTED_TO_SALE")
    const approvedVolume = approvedQuotes.reduce((acc, q) => acc + q.total, 0)
    const pendingQuotes = quotes.filter((q) => q.status === "DRAFT" || q.status === "SENT")
    const convertedCount = quotes.filter((q) => q.status === "CONVERTED_TO_SALE").length
    const conversionRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0

    return {
      totalCount,
      approvedVolume,
      pendingCount: pendingQuotes.length,
      conversionRate,
    }
  }, [quotes])

  const renderStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="border-border text-muted-foreground text-[11px] font-bold">
            Borrador
          </Badge>
        )
      case "SENT":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-bold">
            Enviado
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            Aprobado
          </Badge>
        )
      case "CONVERTED_TO_SALE":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[11px] font-bold">
            Convertido
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold">
            Rechazado
          </Badge>
        )
      case "EXPIRED":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold">
            Vencido
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Cotizaciones
            </CardTitle>
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono tabular-nums text-foreground">
              {stats.totalCount}{" "}
              <span className="text-sm font-sans font-medium text-muted-foreground">emitidas</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Presupuestos registrados</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Volumen Aprobado
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-500">
              ${Math.round(stats.approvedVolume).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cotizaciones listas para venta</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              En Seguimiento
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono tabular-nums text-amber-500">
              {stats.pendingCount}{" "}
              <span className="text-sm font-sans font-medium text-muted-foreground">pendientes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Borradores o enviadas a cliente</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tasa de Conversión
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/30">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono tabular-nums text-purple-500">
              {stats.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cotizaciones cerradas en caja</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs card-specular">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground mr-1">Estado:</span>
          {(
            [
              { label: "Todos", value: "ALL" },
              { label: "Borrador", value: "DRAFT" },
              { label: "Enviado", value: "SENT" },
              { label: "Aprobado", value: "APPROVED" },
              { label: "Convertido", value: "CONVERTED_TO_SALE" },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === item.value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden card-specular">
        {filteredQuotes.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-bold text-base text-foreground">No se encontraron cotizaciones</p>
            <p className="text-xs">Prueba ajustando los filtros o genera un nuevo presupuesto desde el mostrador.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/60 border-b border-border">
              <TableRow className="divide-x divide-border/60 text-[11px] uppercase tracking-wider font-bold">
                <TableHead className="w-32">Folio</TableHead>
                <TableHead className="w-36">Fecha Emisión</TableHead>
                <TableHead className="min-w-[200px]">Cliente</TableHead>
                <TableHead className="w-24 text-center">Ítems</TableHead>
                <TableHead className="w-36 text-right">Total</TableHead>
                <TableHead className="w-32 text-center">Estado</TableHead>
                <TableHead className="w-56 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60 text-xs">
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id} className="divide-x divide-border/40 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-black text-primary whitespace-nowrap">
                    {quote.quoteNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <span>{new Date(quote.date).toLocaleDateString("es-CL")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground">{quote.clientName || "Consumidor Final"}</div>
                    {quote.clientDoc && (
                      <div className="font-mono text-[11px] text-muted-foreground">{quote.clientDoc}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono tabular-nums">
                    <Badge variant="outline" className="font-mono text-[11px] bg-muted/30">
                      {quote.items.length} un.
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-black text-sm text-foreground">
                    ${Math.round(quote.total).toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderStatusBadge(quote.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuoteForPrint(quote)}
                        className="h-8 text-xs font-bold border-border/80 hover:bg-muted/80"
                        title="Ver / Imprimir Presupuesto A4"
                        leftIcon={<Printer className="w-3.5 h-3.5 text-muted-foreground" />}
                      >
                        Doc A4
                      </Button>

                      {quote.status !== "CONVERTED_TO_SALE" && quote.status !== "REJECTED" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onConvertToSale(quote)}
                          className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
                          leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                        >
                          A Venta
                        </Button>
                      )}

                      {quote.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(quote.id, "APPROVED")}
                          className="h-8 text-xs font-bold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          title="Aprobar presupuesto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Document View / Print Modal */}
      <QuoteDocumentModal
        isOpen={Boolean(selectedQuoteForPrint)}
        onClose={() => setSelectedQuoteForPrint(null)}
        quote={selectedQuoteForPrint}
      />
    </div>
  )
}
