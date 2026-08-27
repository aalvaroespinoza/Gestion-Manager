"use client"

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui/table"
import { ToastContainer, ToastMessage } from "@/components/ui/toast"
import { CheckoutModal } from "@/components/modules/sales/CheckoutModal"
import { mockProducts, mockCategories } from "@/mocks/inventoryData"
import { mockClients } from "@/mocks/clientsData"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { exportToCSV, exportToJSON } from "@/lib/exportUtils"
import { Product, Category } from "@/types/inventory"
import {
  CartItem,
  ClientSelectOption,
  InvoiceData,
  PaymentMethod,
  SaleSummary,
} from "@/types/sales"
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  CreditCard,
  Banknote,
  Percent,
  CheckCircle2,
  AlertTriangle,
  History,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Printer,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
  Keyboard,
  ArrowRight,
} from "lucide-react"

const defaultSalesHistory: InvoiceData[] = [
  {
    id: "sale-hist-1",
    saleNumber: "TK-2026-0004520",
    date: "22/08/2026 11:30",
    clientId: "cli-01",
    clientName: "Constructora Andina S.A.",
    clientDoc: "CUIT: 30-71234567-8",
    clientTaxCondition: "Responsable Inscripto (IVA 21%)",
    items: [
      {
        productId: "prod-1",
        code: "CST-PER-GALV",
        name: "Perfil Metalcon C Estructural",
        unitPrice: 9990,
        costPrice: 6200,
        quantity: 20,
        stock: 120,
        subtotal: 199800,
      },
    ],
    summary: {
      subtotal: 199800,
      discountType: "PERCENT",
      discountValue: 5,
      discountAmount: 9990,
      taxRate: 0.21,
      taxAmount: 39860,
      total: 229670,
      totalItems: 1,
      totalUnits: 20,
    },
    paymentMethod: "TRANSFERENCIA",
    amountPaid: 229670,
    changeAmount: 0,
    status: "COMPLETADA",
    cashierName: "Álvaro Espinoza",
    branchName: "Casa Matriz - Salón de Ventas",
  },
  {
    id: "sale-hist-2",
    saleNumber: "TK-2026-0004519",
    date: "22/08/2026 10:15",
    clientId: "cli-cf",
    clientName: "Consumidor Final",
    clientDoc: "DNI: 00000000",
    clientTaxCondition: "Consumidor Final",
    items: [
      {
        productId: "prod-8",
        code: "FER-TAL-20V-BL",
        name: "Taladro Percutor Inalámbrico Brushless 20V",
        unitPrice: 149990,
        costPrice: 89000,
        quantity: 1,
        stock: 16,
        subtotal: 149990,
      },
    ],
    summary: {
      subtotal: 149990,
      discountType: "PERCENT",
      discountValue: 0,
      discountAmount: 0,
      taxRate: 0.21,
      taxAmount: 31498,
      total: 181488,
      totalItems: 1,
      totalUnits: 1,
    },
    paymentMethod: "EFECTIVO",
    amountPaid: 200000,
    changeAmount: 18512,
    status: "COMPLETADA",
    cashierName: "Álvaro Espinoza",
    branchName: "Casa Matriz - Salón de Ventas",
  },
]

export default function VentasPage() {
  // Main view toggle: 'POS' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<"POS" | "HISTORY">("POS")

  // Persistent State via useLocalStorage
  const [products, setProducts] = useLocalStorage<Product[]>(
    "gm_inventory_products",
    mockProducts
  )
  const [cart, setCart] = useLocalStorage<CartItem[]>("gm_pos_cart", [])
  const [clients] = useState<ClientSelectOption[]>(mockClients)
  const [selectedClient, setSelectedClient] = useLocalStorage<ClientSelectOption>(
    "gm_pos_client",
    mockClients[0]
  )
  const [salesHistory, setSalesHistory] = useLocalStorage<InvoiceData[]>(
    "gm_sales_history",
    defaultSalesHistory
  )

  const [categories] = useState<Category[]>(mockCategories)

  // POS Catalog Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Financial options
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [applyTax, setApplyTax] = useState<boolean>(true)

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [viewingTicketInvoice, setViewingTicketInvoice] = useState<InvoiceData | null>(null)

  // Rich Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage["type"] = "success") => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        title,
        description,
        type,
      }
      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Autofocus search on mount and when returning to POS
  useEffect(() => {
    if (activeTab === "POS") {
      searchInputRef.current?.focus()
    }
  }, [activeTab])

  // --- Cart Operations ---
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      addToast(
        "Producto Agotado",
        `"${product.name}" no tiene existencias disponibles en bodega.`,
        "destructive"
      )
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          addToast(
            "Límite de Stock Alcanzado",
            `No es posible agregar más unidades de "${product.name}" (Máximo: ${product.stock} un.).`,
            "warning"
          )
          return prev
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      }

      const newItem: CartItem = {
        productId: product.id,
        code: product.code,
        name: product.name,
        categoryName: product.categoryName,
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        quantity: 1,
        stock: product.stock,
        subtotal: product.salePrice,
        customAttributes: product.customAttributes,
      }
      return [...prev, newItem]
    })
  }

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const product = products.find((p) => p.id === productId)
    const maxStock = product?.stock ?? 9999

    if (newQty <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    const clampedQty = Math.min(newQty, maxStock)

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: clampedQty,
              subtotal: clampedQty * item.unitPrice,
            }
          : item
      )
    )
  }

  const handleRemoveFromCart = (productId: string) => {
    const item = cart.find((i) => i.productId === productId)
    setCart((prev) => prev.filter((i) => i.productId !== productId))
    if (item) {
      addToast("Ítem Quitado", `"${item.name}" fue removido de la orden.`, "info")
    }
  }

  const handleClearCart = () => {
    setCart([])
    setDiscountPercent(0)
    addToast("Carrito Vaciado", "Se han removido todos los artículos de la orden.", "info")
  }

  // --- Financial Summary Calculations ---
  const saleSummary: SaleSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalItems = cart.length

    const discountAmount = Math.round(subtotal * (discountPercent / 100))
    const taxableBase = Math.max(0, subtotal - discountAmount)
    const taxRate = applyTax ? 0.21 : 0
    const taxAmount = Math.round(taxableBase * taxRate)
    const total = taxableBase + taxAmount

    return {
      subtotal,
      discountType: "PERCENT",
      discountValue: discountPercent,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      totalItems,
      totalUnits,
    }
  }, [cart, discountPercent, applyTax])

  // --- Complete Sale Handler ---
  const handleConfirmSale = async (invoice: InvoiceData) => {
    setSalesHistory((prev) => [invoice, ...prev])

    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = invoice.items.find((it) => it.productId === prod.id)
        if (soldItem) {
          const newStock = Math.max(0, prod.stock - soldItem.quantity)
          return {
            ...prod,
            stock: newStock,
            status:
              newStock === 0 ? "OUT_OF_STOCK" : newStock <= prod.minStock ? "LOW_STOCK" : "IN_STOCK",
          }
        }
        return prod
      })
    )

    addToast(
      "Venta Registrada",
      `Ticket ${invoice.saleNumber} emitido por $${invoice.summary.total.toLocaleString("es-CL")}. Stock descontado automáticamente.`,
      "success"
    )
  }

  // --- Filtered Catalog ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== "ALL" && product.categoryId !== selectedCategory) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchCode = product.code.toLowerCase().includes(q)
        const matchName = product.name.toLowerCase().includes(q)
        const matchDesc = product.description?.toLowerCase().includes(q)
        const matchAttrs = Object.values(product.customAttributes || {}).some(
          (val) => String(val).toLowerCase().includes(q)
        )
        if (!matchCode && !matchName && !matchDesc && !matchAttrs) return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategory])

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase()
      const isInputActive = activeTag === "input" || activeTag === "textarea"

      if ((e.key === "/" && !isInputActive) || e.key === "F2") {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }

      if ((e.key === "F4" || (e.ctrlKey && e.key === "Enter")) && cart.length > 0 && !isCheckoutOpen) {
        e.preventDefault()
        setViewingTicketInvoice(null)
        setIsCheckoutOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cart, isCheckoutOpen])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProducts.length === 1) {
      handleAddToCart(filteredProducts[0])
      setSearchQuery("")
    }
  }

  // Export Sales History
  const handleExportSalesCSV = () => {
    exportToCSV(
      "historial_ventas_gestion_manager",
      salesHistory,
      [
        { key: "saleNumber", label: "N° Ticket" },
        { key: "date", label: "Fecha y Hora" },
        { key: "clientName", label: "Cliente" },
        { key: "clientDoc", label: "Documento" },
        { key: "paymentMethod", label: "Medio de Pago" },
        { key: "summary", label: "Total Facturado", format: (s) => `$${Number(s?.total || 0).toLocaleString("es-CL")}` },
        { key: "status", label: "Estado" },
        { key: "cashierName", label: "Cajero" },
      ]
    )
    addToast("Exportación Exitosa", "Historial de ventas descargado en formato CSV.", "info")
  }

  const handleExportSalesJSON = () => {
    exportToJSON("historial_ventas_gestion_manager", salesHistory)
    addToast("Exportación JSON", "Historial de transacciones descargado en JSON.", "info")
  }

  // KPI calculations for history
  const totalSalesCount = salesHistory.length
  const totalSalesRevenue = salesHistory.reduce((sum, s) => sum + s.summary.total, 0)
  const averageTicket = totalSalesCount > 0 ? Math.round(totalSalesRevenue / totalSalesCount) : 0
  const cashSalesCount = salesHistory.filter((s) => s.paymentMethod === "EFECTIVO").length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Rich Toasts Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <ShoppingCart className="h-8 w-8 text-[var(--primary-text)]" />
            Punto de Venta (Terminal POS)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Terminal rápida de mostrador con atajos de teclado y persistencia de sesión.
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === "HISTORY" && (
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportSalesCSV}
                leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                className="h-8 text-xs font-semibold"
              >
                CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportSalesJSON}
                leftIcon={<FileJson className="h-3.5 w-3.5 text-[var(--primary-text)]" />}
                className="h-8 text-xs font-semibold"
              >
                JSON
              </Button>
            </div>
          )}

          <div className="flex items-center rounded-xl bg-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("POS")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "POS"
                  ? "bg-card text-[var(--primary-text)] shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Terminal POS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "HISTORY"
                  ? "bg-card text-[var(--primary-text)] shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Historial de Ventas</span>
              <Badge size="sm" variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {salesHistory.length}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "POS" ? (
        /* ==================== POS TERMINAL SPLIT SCREEN ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Product Catalog & Fast Search (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="pb-3 space-y-3">
                {/* Search Bar with autoFocus & keyboard hint */}
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar producto por nombre o código de barra (Enter para agregar)..."
                    leftIcon={<Search className="h-4 w-4" />}
                    rightIcon={
                      <kbd className="hidden sm:inline-block rounded bg-muted border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        / o F2
                      </kbd>
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="h-11 text-base sm:text-sm"
                  />
                </div>

                {/* Category Pills Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      selectedCategory === "ALL"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "bg-card text-foreground/70 border border-border hover:bg-muted"
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id
                    const count = products.filter((p) => p.categoryId === cat.id).length
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[var(--primary)] text-white shadow-xs"
                            : "bg-card text-foreground/70 border border-border hover:bg-muted"
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    )
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-muted-foreground space-y-3">
                      <Package className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-bold text-foreground">
                        No se encontraron productos en el catálogo.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setSelectedCategory("ALL")
                        }}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Limpiar Búsqueda
                      </Button>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isOutOfStock = product.stock <= 0
                      const isLowStock = product.status === "LOW_STOCK"
                      const inCartItem = cart.find((i) => i.productId === product.id)
                      const qtyInCart = inCartItem?.quantity || 0

                      return (
                        <div
                          key={product.id}
                          onClick={() => !isOutOfStock && handleAddToCart(product)}
                          className={`relative p-3.5 rounded-2xl border transition-all select-none text-left flex flex-col justify-between ${
                            isOutOfStock
                              ? "opacity-50 cursor-not-allowed bg-muted border-border"
                              : "cursor-pointer bg-card border-border hover:border-[var(--primary)] hover:shadow-md active:scale-[0.99]"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                {product.code}
                              </span>
                              <Badge
                                variant={
                                  isOutOfStock ? "destructive" : isLowStock ? "warning" : "success"
                                }
                                size="sm"
                                dot
                              >
                                {isOutOfStock ? "Agotado" : `${product.stock} un.`}
                              </Badge>
                            </div>

                            <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                              {product.name}
                            </h4>

                            {/* Extra attributes chips */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {Object.entries(product.customAttributes || {}).map(([k, v]) => {
                                if (!v || typeof v === "boolean") return null
                                return (
                                  <span
                                    key={k}
                                    className="text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded text-foreground/80 font-medium"
                                  >
                                    {String(v)}
                                  </span>
                                )
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
                            <span className="text-base font-extrabold text-[var(--primary-text)]">
                              ${product.salePrice.toLocaleString("es-CL")}
                            </span>

                            {qtyInCart > 0 && (
                              <Badge variant="default" size="sm">
                                {qtyInCart} en carrito
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL: Cart & Live Financial Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-[var(--primary-light-border)] shadow-md">
              <CardHeader className="pb-3 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-[var(--primary-text)]" />
                    <CardTitle className="text-base">Orden de Venta Actual</CardTitle>
                  </div>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCart}
                      className="text-xs text-red-600 hover:text-red-700 h-7 px-2 font-semibold"
                    >
                      Vaciar Carrito
                    </Button>
                  )}
                </div>

                {/* Client Selector Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[var(--primary-text)]" />
                    Cliente Asignado
                  </label>
                  <Select
                    value={selectedClient.id}
                    onChange={(e) => {
                      const c = clients.find((item) => item.id === e.target.value)
                      if (c) setSelectedClient(c)
                    }}
                    options={clients.map((c) => ({
                      label: `${c.name} (${c.docType}: ${c.docNumber})`,
                      value: c.id,
                    }))}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground space-y-2">
                      <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/40" />
                      <p className="text-xs font-bold text-foreground">
                        El carrito está vacío
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Haz clic en los productos del catálogo izquierdo para agregarlos a la orden.
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => {
                      const isMaxStockReached = item.quantity >= item.stock

                      return (
                        <div
                          key={item.productId}
                          className="p-2.5 rounded-xl border border-border bg-muted/40 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-foreground line-clamp-1">
                                {item.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono font-medium">
                                {item.code} • ${item.unitPrice.toLocaleString("es-CL")} c/u
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="text-muted-foreground hover:text-red-600 p-1"
                              title="Quitar ítem"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity Controls (+ / - / input) */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted"
                              >
                                <Minus className="h-3 w-3" />
                              </button>

                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(
                                    item.productId,
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                min={1}
                                max={item.stock}
                                className="h-7 w-12 text-center text-xs font-bold bg-card border border-border rounded-lg text-foreground"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                disabled={isMaxStockReached}
                                className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="text-sm font-extrabold text-foreground">
                              ${item.subtotal.toLocaleString("es-CL")}
                            </span>
                          </div>

                          {isMaxStockReached && (
                            <p className="text-[10px] text-amber-700 font-bold">
                              Máximo disponible en stock: {item.stock} un.
                            </p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Financial Summary Breakdown */}
                {cart.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {/* Discounts Selector */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground/80 font-medium flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-[var(--primary-text)]" />
                        Descuento Comercial:
                      </span>
                      <div className="flex items-center gap-1">
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountPercent(pct)}
                            className={`px-2 py-0.5 text-xs font-bold rounded-md border ${
                              discountPercent === pct
                                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                : "bg-card border-border text-foreground hover:bg-muted"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subtotal, Descuentos e IVA */}
                    <div className="space-y-1.5 text-xs text-foreground/80">
                      <div className="flex justify-between">
                        <span>Subtotal Neto:</span>
                        <span className="font-bold text-foreground">
                          ${saleSummary.subtotal.toLocaleString("es-CL")}
                        </span>
                      </div>

                      {saleSummary.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Descuento ({discountPercent}%):</span>
                          <span>-${saleSummary.discountAmount.toLocaleString("es-CL")}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyTax}
                            onChange={(e) => setApplyTax(e.target.checked)}
                            className="rounded border-border text-[var(--primary)] h-3.5 w-3.5"
                          />
                          <span>IVA Estimado (21%):</span>
                        </label>
                        <span className="font-bold text-foreground">
                          ${saleSummary.taxAmount.toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {/* Total Highlighting Banner */}
                    <div className="p-3.5 rounded-xl bg-sidebar text-sidebar-foreground flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--sidebar-muted)] font-bold">
                          Total a Pagar
                        </span>
                        <div className="text-2xl font-black text-white">
                          ${saleSummary.total.toLocaleString("es-CL")}
                        </div>
                      </div>
                      <span className="text-xs text-[var(--sidebar-muted)] font-medium">
                        {saleSummary.totalUnits} un. en total
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => {
                        setViewingTicketInvoice(null)
                        setIsCheckoutOpen(true)
                      }}
                      className="w-full h-12 text-base font-bold shadow-md"
                      leftIcon={<CheckCircle2 className="h-5 w-5" />}
                    >
                      <span>Cobrar Venta</span>
                      <kbd className="ml-2 px-1.5 py-0.5 bg-black/20 text-xs rounded font-mono">
                        F4 / Enter
                      </kbd>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ==================== SALES HISTORY TAB ==================== */
        <div className="space-y-6">
          {/* History KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Facturado Hoy
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">
                  ${totalSalesRevenue.toLocaleString("es-CL")}
                </div>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  {totalSalesCount} transacciones completadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ticket Promedio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-[var(--primary-text)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">
                  ${averageTicket.toLocaleString("es-CL")}
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Por cliente atendido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ventas en Efectivo
                </CardTitle>
                <Banknote className="h-4 w-4 text-emerald-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">
                  {cashSalesCount}
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Caja chica al mostrador</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Operador Activo
                </CardTitle>
                <User className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-base font-bold text-foreground truncate">
                  Álvaro Espinoza
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Turno Mañana • Casa Matriz</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales History Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Historial de Transacciones</CardTitle>
                  <CardDescription>
                    Ventas procesadas y tickets emitidos en la terminal.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("POS")}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Nueva Venta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">N° Ticket</TableHead>
                    <TableHead className="font-bold">Fecha & Hora</TableHead>
                    <TableHead className="font-bold">Cliente</TableHead>
                    <TableHead className="font-bold">Medio de Pago</TableHead>
                    <TableHead className="text-center font-bold">Ítems</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                    <TableHead className="text-center font-bold">Estado</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.length === 0 ? (
                    <TableEmpty colSpan={8} message="Aún no se han emitido ventas en esta sesión." />
                  ) : (
                    salesHistory.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          {sale.saleNumber}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{sale.date}</TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-foreground">
                            {sale.clientName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{sale.clientDoc}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" size="sm">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-foreground">
                          {sale.summary.totalUnits} un. ({sale.summary.totalItems} art.)
                        </TableCell>
                        <TableCell className="text-right font-black text-sm text-foreground">
                          ${sale.summary.total.toLocaleString("es-CL")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="success" size="sm" dot>
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingTicketInvoice(sale)
                              setIsCheckoutOpen(true)
                            }}
                            leftIcon={<Receipt className="h-3.5 w-3.5" />}
                            className="h-8 text-xs text-[var(--primary-text)] font-bold hover:bg-muted"
                          >
                            Ver Ticket
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checkout & Ticket Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false)
          setViewingTicketInvoice(null)
        }}
        items={cart}
        summary={saleSummary}
        client={selectedClient}
        initialInvoice={viewingTicketInvoice}
        onConfirmSale={handleConfirmSale}
        onNewSale={() => {
          handleClearCart()
          setActiveTab("POS")
          searchInputRef.current?.focus()
        }}
      />
    </div>
  )
}
