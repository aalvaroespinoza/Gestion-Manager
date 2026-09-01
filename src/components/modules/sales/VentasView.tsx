"use client"

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { createSale } from "@/modules/sales/actions"
import { exportToCSV, exportToJSON } from "@/lib/exportUtils"
import { Product, Category, StockStatus } from "@/types/inventory"
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
  Banknote,
  Percent,
  CheckCircle2,
  History,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
} from "lucide-react"

interface VentasViewProps {
  initialProducts: Product[]
  initialCategories: Category[]
  initialClients: ClientSelectOption[]
  initialSalesHistory: InvoiceData[]
}

function mapUiPaymentMethodToDb(method: PaymentMethod): "CASH" | "CARD" | "TRANSFER" | "CURRENT_ACCOUNT" {
  switch (method) {
    case "EFECTIVO":
      return "CASH"
    case "TARJETA_DEBITO":
    case "TARJETA_CREDITO":
      return "CARD"
    case "TRANSFERENCIA":
      return "TRANSFER"
    case "CUENTA_CORRIENTE":
      return "CURRENT_ACCOUNT"
    default:
      return "CASH"
  }
}

export function VentasView({
  initialProducts,
  initialCategories,
  initialClients,
  initialSalesHistory,
}: VentasViewProps) {
  const router = useRouter()

  // Navigation Tab: POS (Terminal de Venta) vs HISTORY (Historial de Transacciones)
  const [activeTab, setActiveTab] = useState<"POS" | "HISTORY">("POS")

  // Real Database Products & Categories
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories] = useState<Category[]>(initialCategories)
  const [clients] = useState<ClientSelectOption[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<ClientSelectOption>(
    initialClients[0] || {
      id: "cli-cf",
      name: "Consumidor Final",
      docType: "DNI",
      docNumber: "00000000",
      taxCondition: "Consumidor Final",
    }
  )

  // Shopping Cart & Sales History state
  const [cart, setCart] = useState<CartItem[]>([])
  const [salesHistory, setSalesHistory] = useState<InvoiceData[]>(initialSalesHistory)

  // Sync state if server props refresh
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  useEffect(() => {
    setSalesHistory(initialSalesHistory)
  }, [initialSalesHistory])

  // Filters & Search in POS Catalog
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Discounts & Taxes
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [applyTax, setApplyTax] = useState<boolean>(true)

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [viewingTicketInvoice, setViewingTicketInvoice] = useState<InvoiceData | null>(null)

  // Floating Toasts Stack
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

  // Keyboard Shortcuts (F2 -> Focus Search, F4 -> Cobrar / Checkout, Escape -> Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === "F4" && cart.length > 0 && !isCheckoutOpen) {
        e.preventDefault()
        setIsCheckoutOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cart.length, isCheckoutOpen])

  // Filtered Products for the POS Catalog Grid
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

  // Cart Calculations (Subtotal, Discounts, IVA, Grand Total)
  const summary: SaleSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = Math.round((subtotal * discountPercent) / 100)
    const taxableBase = Math.max(0, subtotal - discountAmount)
    const taxRate = applyTax ? 0.21 : 0
    const taxAmount = Math.round(taxableBase * taxRate)
    const total = taxableBase + taxAmount
    const totalItems = cart.length
    const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)

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

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      addToast(
        "Sin Stock Disponible",
        `No es posible agregar "${product.name}" porque el stock actual es 0 un.`,
        "destructive"
      )
      return
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id)

    if (existingIndex >= 0) {
      const existingItem = cart[existingIndex]
      if (existingItem.quantity >= product.stock) {
        addToast(
          "Límite de Stock Alcanzado",
          `Solo hay ${product.stock} unidades disponibles de "${product.name}".`,
          "warning"
        )
        return
      }

      const updatedCart = [...cart]
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + 1,
        subtotal: (existingItem.quantity + 1) * existingItem.unitPrice,
      }
      setCart(updatedCart)
    } else {
      const category = categories.find((c) => c.id === product.categoryId)
      const newItem: CartItem = {
        productId: product.id,
        code: product.code,
        name: product.name,
        categoryName: category?.name || product.categoryName || "General",
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        quantity: 1,
        stock: product.stock,
        subtotal: product.salePrice,
        customAttributes: product.customAttributes,
      }
      setCart([...cart, newItem])
    }
  }

  // Modify Item Quantity in Cart
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.productId === productId)
    if (!item) return

    const newQty = item.quantity + delta
    if (newQty <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    if (newQty > item.stock) {
      addToast(
        "Stock Máximo",
        `Stock disponible: ${item.stock} unidades.`,
        "warning"
      )
      return
    }

    setCart(
      cart.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity: newQty,
              subtotal: newQty * i.unitPrice,
            }
          : i
      )
    )
  }

  // Remove Item from Cart
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.productId !== productId))
  }

  // Clear Entire Cart
  const handleClearCart = () => {
    setCart([])
  }

  // Confirm Sale via Server Action
  const handleConfirmSale = async (invoice: InvoiceData): Promise<InvoiceData | void> => {
    try {
      const dbPaymentMethod = mapUiPaymentMethodToDb(invoice.paymentMethod)
      const isRealDbClient = invoice.clientId && !invoice.clientId.startsWith("cli-")

      const res = await createSale({
        clientId: isRealDbClient ? invoice.clientId : null,
        paymentMethod: dbPaymentMethod,
        items: invoice.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customSpecs: item.customAttributes || null,
        })),
        discount: invoice.summary.discountAmount,
        tax: invoice.summary.taxAmount,
        notes: invoice.notes,
      })

      if (!res.success) {
        addToast("Error al Procesar Venta", res.error || "No se pudo guardar la venta en la base de datos.", "destructive")
        throw new Error(res.error || "Error al procesar la venta")
      }

      const createdSale = res.data
      const realInvoiceNumber = createdSale.invoiceNumber || invoice.saleNumber

      const finalInvoice: InvoiceData = {
        ...invoice,
        id: createdSale.id,
        saleNumber: realInvoiceNumber,
        date: new Date(createdSale.createdAt).toLocaleString("es-CL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        cashierName: createdSale.user?.name || invoice.cashierName,
      }

      // Decrement stock in local products state
      setProducts((prev) =>
        prev.map((prod) => {
          const soldItem = invoice.items.find((it) => it.productId === prod.id)
          if (soldItem) {
            const newStock = Math.max(0, prod.stock - soldItem.quantity)
            let status: StockStatus = "IN_STOCK"
            if (newStock === 0) status = "OUT_OF_STOCK"
            else if (newStock <= prod.minStock) status = "LOW_STOCK"
            return { ...prod, stock: newStock, status }
          }
          return prod
        })
      )

      // Add to sales history
      setSalesHistory((prev) => [finalInvoice, ...prev])

      // Clear cart
      setCart([])

      addToast(
        "Venta Confirmada",
        `Comprobante ${realInvoiceNumber} registrado exitosamente por $${invoice.summary.total.toLocaleString("es-CL")}.`,
        "success"
      )

      router.refresh()
      return finalInvoice
    } catch (error: any) {
      if (!error.message?.includes("Error al procesar")) {
        addToast("Error Inesperado", error.message || "No fue posible registrar la venta.", "destructive")
      }
      throw error
    }
  }

  // Export Sales History to CSV
  const handleExportSalesCSV = () => {
    exportToCSV(
      "historial_ventas_gestion_manager",
      salesHistory,
      [
        { key: "saleNumber", label: "N° Comprobante" },
        { key: "date", label: "Fecha y Hora" },
        { key: "clientName", label: "Cliente" },
        { key: "paymentMethod", label: "Medio de Pago" },
        {
          key: "summary",
          label: "Total Cobrado",
          format: (v: any) => `$${Number(v.total).toLocaleString("es-CL")}`,
        },
        { key: "status", label: "Estado" },
        { key: "cashierName", label: "Cajero" },
      ]
    )
    addToast("Exportación Completada", "Historial de ventas descargado en formato CSV.", "info")
  }

  // Export Sales History to JSON
  const handleExportSalesJSON = () => {
    exportToJSON("historial_ventas_gestion_manager", salesHistory)
    addToast("Exportación JSON", "Historial estructurado JSON descargado.", "info")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Floating Notifications Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Punto de Venta & Caja (POS)
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-medium">
            Terminal rápida de cobro, emisión de tickets y persistencia atómica en base de datos.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#18181b] border border-zinc-800 rounded-2xl p-1.5 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("POS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "POS"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Terminal POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "HISTORY"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Historial de Ventas</span>
            {salesHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
                {salesHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "POS" ? (
        /* ========================================================================= */
        /* TAB 1: POS TERMINAL                                                       */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Catalog & Search (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Pills */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar producto por nombre, SKU o atributo (Presiona F2)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    rightIcon={
                      <kbd className="hidden sm:inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                        F2
                      </kbd>
                    }
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === "ALL"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-[#18181b] border border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Todos ({products.length})
                  </button>

                  {categories.map((category) => {
                    const count = products.filter((p) => p.categoryId === category.id).length
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "bg-[#18181b] border border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {category.name} ({count})
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full p-12 text-center rounded-2xl border border-zinc-800 bg-[#18181b]/50">
                  <Package className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-white font-bold text-sm">No se encontraron productos</p>
                  <p className="text-xs text-zinc-400 mt-1">Intenta con otro término de búsqueda o categoría.</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock
                  const category = categories.find((c) => c.id === product.categoryId)

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && handleAddToCart(product)}
                      className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed bg-[#18181b] border-zinc-800"
                          : "cursor-pointer bg-[#18181b] border-zinc-800 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-mono font-medium text-primary">
                            {product.code}
                          </span>
                          <Badge
                            size="sm"
                            variant={isOutOfStock ? "destructive" : isLowStock ? "warning" : "success"}
                            dot
                          >
                            {isOutOfStock ? "Agotado" : `${product.stock} un.`}
                          </Badge>
                        </div>

                        <h4 className="font-bold text-sm text-white mt-1.5 line-clamp-2 leading-tight">
                          {product.name}
                        </h4>

                        <span className="text-[11px] text-zinc-400 font-medium">
                          {category?.name || product.categoryName || "General"}
                        </span>

                        {/* Custom Dynamic Attributes preview */}
                        {product.customAttributes && Object.keys(product.customAttributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(product.customAttributes)
                              .slice(0, 2)
                              .map(([key, val]) => {
                                if (val === undefined || val === null || val === "") return null
                                return (
                                  <span
                                    key={key}
                                    className="text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400"
                                  >
                                    <strong className="capitalize">{key}:</strong> {String(val)}
                                  </span>
                                )
                              })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                            Precio Venta
                          </span>
                          <span className="text-lg font-black text-white">
                            ${product.salePrice.toLocaleString("es-CL")}
                          </span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isOutOfStock}
                          className="h-8 px-2.5 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Interactive Cart & Totals (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-zinc-800 bg-[#18181b]">
              {/* Client Selection Header */}
              <CardHeader className="pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold text-white">Cliente de la Venta</CardTitle>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      Vaciar Carrito
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <Select
                    value={selectedClient.id}
                    onChange={(e) => {
                      const found = clients.find((c) => c.id === e.target.value)
                      if (found) setSelectedClient(found)
                    }}
                    options={clients.map((c) => ({
                      label: `${c.name} (${c.docType}: ${c.docNumber})`,
                      value: c.id,
                    }))}
                  />
                </div>
              </CardHeader>

              {/* Cart Items List */}
              <CardContent className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <ShoppingCart className="h-10 w-10 mx-auto opacity-30" />
                    <p className="text-sm font-semibold text-zinc-400">El carrito de venta está vacío</p>
                    <p className="text-xs">Selecciona productos del catálogo para comenzar.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-primary">{item.code}</span>
                            <span className="text-[10px] text-zinc-500">• {item.categoryName}</span>
                          </div>
                          <h5 className="font-bold text-xs text-white truncate">{item.name}</h5>
                          <span className="text-xs font-medium text-zinc-400">
                            ${item.unitPrice.toLocaleString("es-CL")} c/u
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, -1)}
                              className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, 1)}
                              className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="font-black text-xs text-white">
                              ${item.subtotal.toLocaleString("es-CL")}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary & Modifiers */}
                {cart.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800 space-y-3">
                    {/* Discount quick selectors */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-semibold flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-primary" />
                        Descuento Global:
                      </span>
                      <div className="flex items-center gap-1">
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountPercent(pct)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              discountPercent === pct
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown totals */}
                    <div className="space-y-1.5 text-xs text-zinc-400 pt-1">
                      <div className="flex justify-between">
                        <span>Subtotal Neto:</span>
                        <span className="text-white font-medium">
                          ${summary.subtotal.toLocaleString("es-CL")}
                        </span>
                      </div>

                      {summary.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>Descuento ({summary.discountValue}%):</span>
                          <span>-${summary.discountAmount.toLocaleString("es-CL")}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>IVA Estimado (21%):</span>
                        <span className="text-white font-medium">
                          ${summary.taxAmount.toLocaleString("es-CL")}
                        </span>
                      </div>

                      {/* Highlighted Total */}
                      <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                        <span>Total Final:</span>
                        <span className="text-primary font-black text-xl">
                          ${summary.total.toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full font-bold text-sm shadow-md mt-2 cursor-pointer"
                      leftIcon={<Banknote className="h-4 w-4" />}
                    >
                      <span>Cobrar Venta (F4)</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: HISTORIAL DE VENTAS                                                */
        /* ========================================================================= */
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Registro de Transacciones & Comprobantes
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Historial completo de ventas generadas en la base de datos de tu organización.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportSalesCSV}
                  leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />}
                  className="h-8 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                >
                  Exportar CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportSalesJSON}
                  leftIcon={<FileJson className="h-3.5 w-3.5 text-primary" />}
                  className="h-8 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                >
                  JSON
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">N° Comprobante</TableHead>
                    <TableHead className="font-bold">Fecha / Hora</TableHead>
                    <TableHead className="font-bold">Cliente</TableHead>
                    <TableHead className="font-bold">Medio de Pago</TableHead>
                    <TableHead className="text-center font-bold">Ítems</TableHead>
                    <TableHead className="text-right font-bold">Total Cobrado</TableHead>
                    <TableHead className="text-center font-bold">Estado</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {salesHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-zinc-500">
                        No hay ventas registradas aún. Las transacciones completadas aparecerán aquí.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesHistory.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-zinc-800/60 transition-colors">
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {sale.saleNumber}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-300 font-medium">
                          {sale.date}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="font-bold text-xs text-white truncate">{sale.clientName}</div>
                          <span className="text-[10px] text-zinc-500">{sale.clientDoc}</span>
                        </TableCell>
                        <TableCell>
                          <Badge size="sm" variant="outline">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-zinc-300">
                          {sale.items.length} ({sale.summary.totalUnits || sale.items.reduce((s, i) => s + i.quantity, 0)} un.)
                        </TableCell>
                        <TableCell className="text-right font-black text-sm text-white">
                          ${sale.summary.total.toLocaleString("es-CL")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            size="sm"
                            variant={sale.status === "COMPLETADA" ? "success" : "destructive"}
                            dot
                          >
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewingTicketInvoice(sale)}
                            leftIcon={<Receipt className="h-3.5 w-3.5 text-primary" />}
                            className="h-8 text-xs cursor-pointer"
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

      {/* Checkout Modal & Payment Gateway */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        summary={summary}
        client={selectedClient}
        onConfirmSale={handleConfirmSale}
        onNewSale={() => {
          setIsCheckoutOpen(false)
          setCart([])
        }}
      />

      {/* Standalone View Ticket Modal for Historical Sales */}
      {viewingTicketInvoice && (
        <CheckoutModal
          isOpen={Boolean(viewingTicketInvoice)}
          onClose={() => setViewingTicketInvoice(null)}
          items={viewingTicketInvoice.items}
          summary={viewingTicketInvoice.summary}
          client={{
            id: viewingTicketInvoice.clientId,
            name: viewingTicketInvoice.clientName,
            docType: "DNI",
            docNumber: viewingTicketInvoice.clientDoc,
            taxCondition: viewingTicketInvoice.clientTaxCondition || "Consumidor Final",
          }}
          onConfirmSale={() => {}}
          onNewSale={() => setViewingTicketInvoice(null)}
          initialInvoice={viewingTicketInvoice}
        />
      )}
    </div>
  )
}
