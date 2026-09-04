"use client"

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
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
import Decimal from "decimal.js"
import { toast } from "sonner"
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner"
import { CommandPalette } from "@/components/command-palette/CommandPalette"
import { CheckoutModal } from "@/components/modules/sales/CheckoutModal"
import { ClientSearchCombobox } from "@/components/modules/sales/ClientSearchCombobox"
import { QuotesTab } from "@/components/modules/sales/QuotesTab"
import { QuoteDocumentModal } from "@/components/modules/sales/QuoteDocumentModal"
import { createSale } from "@/modules/sales/actions"
import { createQuote, getQuotes, updateQuoteStatus } from "@/modules/quotes/actions"
import { mockQuotes } from "@/mocks/quotesData"
import { exportToCSV, exportToJSON } from "@/lib/exportUtils"
import { Product, Category, StockStatus } from "@/types/inventory"
import {
  CartItem,
  ClientSelectOption,
  InvoiceData,
  PaymentMethod,
  SaleSummary,
  QuoteData,
  QuoteStatus,
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
  FileText,
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

  // Navigation Tab: POS (Terminal de Venta) vs HISTORY (Historial de Transacciones) vs QUOTES (Presupuestos)
  const [activeTab, setActiveTab] = useState<"POS" | "HISTORY" | "QUOTES">("POS")

  // Real Database Products & Categories
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [clients, setClients] = useState<ClientSelectOption[]>(initialClients)
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

  // Quotes & Budgeting state
  const [quotes, setQuotes] = useState<QuoteData[]>(mockQuotes)
  const [selectedQuoteForView, setSelectedQuoteForView] = useState<QuoteData | null>(null)
  const [activeQuoteIdForSale, setActiveQuoteIdForSale] = useState<string | null>(null)

  // Fetch quotes from server on mount
  useEffect(() => {
    getQuotes().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setQuotes(res.data)
      }
    })
  }, [])

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
  const [isCustomDiscountOpen, setIsCustomDiscountOpen] = useState<boolean>(false)
  const [customDiscountInput, setCustomDiscountInput] = useState<string>("")
  const [applyTax, setApplyTax] = useState<boolean>(true)

  // Modals & Command Palette state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [viewingTicketInvoice, setViewingTicketInvoice] = useState<InvoiceData | null>(null)
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0)

  // Hardware USB Barcode Scanner (<45ms)
  useBarcodeScanner({
    onScan: (scannedCode) => {
      const found = products.find(
        (p) => p.code.toLowerCase() === scannedCode.toLowerCase()
      )
      if (found) {
        handleAddToCart(found)
        toast.success(`Producto agregado: ${found.name}`, {
          description: `SKU: ${found.code} • Stock: ${found.stock} un.`,
        })
      } else {
        toast.error(`Código no encontrado: "${scannedCode}"`, {
          description: "Verifica que el SKU exista en el catálogo de inventario.",
        })
      }
    },
  })

  // Keyboard Shortcuts (F2 -> Focus Search / Palette, F4 -> Cobrar, Arrow navigation)
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

  // Ensure selected index stays in bounds
  useEffect(() => {
    if (selectedProductIndex >= filteredProducts.length) {
      setSelectedProductIndex(Math.max(0, filteredProducts.length - 1))
    }
  }, [filteredProducts.length, selectedProductIndex])

  // Cart Calculations with exact Decimal.js and banking rounding
  const summary: SaleSummary = useMemo(() => {
    let subtotalDec = new Decimal(0)
    for (const item of cart) {
      subtotalDec = subtotalDec.plus(new Decimal(item.subtotal))
    }

    const discPercentDec = new Decimal(discountPercent || 0)
    const discountAmountDec = subtotalDec
      .times(discPercentDec)
      .dividedBy(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

    const taxableBaseDec = Decimal.max(0, subtotalDec.minus(discountAmountDec))
    const taxRate = applyTax ? 0.21 : 0
    const taxRateDec = new Decimal(taxRate)
    const taxAmountDec = taxableBaseDec
      .times(taxRateDec)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

    const totalDec = taxableBaseDec.plus(taxAmountDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    const totalItems = cart.length
    const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)

    return {
      subtotal: subtotalDec.toNumber(),
      discountType: "PERCENT",
      discountValue: discountPercent,
      discountAmount: discountAmountDec.toNumber(),
      taxRate,
      taxAmount: taxAmountDec.toNumber(),
      total: totalDec.toNumber(),
      totalItems,
      totalUnits,
    }
  }, [cart, discountPercent, applyTax])

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Sin Stock Disponible", {
        description: `No es posible agregar "${product.name}" porque el stock actual es 0 un.`,
      })
      return
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id)

    if (existingIndex >= 0) {
      const existingItem = cart[existingIndex]
      if (existingItem.quantity >= product.stock) {
        toast.warning("Límite de Stock Alcanzado", {
          description: `Solo hay ${product.stock} unidades disponibles de "${product.name}".`,
        })
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
      toast.warning("Stock Máximo", {
        description: `Stock disponible: ${item.stock} unidades.`,
      })
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
    setDiscountPercent(0)
    setIsCustomDiscountOpen(false)
    setCustomDiscountInput("")
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
        toast.error("Error al Procesar Venta", {
          description: res.error || "No se pudo guardar la venta en la base de datos.",
        })
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

      // If converted from quote, mark quote as converted
      if (activeQuoteIdForSale) {
        handleQuoteStatusChange(activeQuoteIdForSale, "CONVERTED_TO_SALE")
        setActiveQuoteIdForSale(null)
      }

      // Clear cart
      setCart([])

      toast.success("Venta Confirmada", {
        description: `Comprobante ${realInvoiceNumber} registrado exitosamente por $${invoice.summary.total.toLocaleString("es-CL")}.`,
      })

      router.refresh()
      return finalInvoice
    } catch (error: any) {
      if (!error.message?.includes("Error al procesar")) {
        toast.error("Error Inesperado", {
          description: error.message || "No fue posible registrar la venta.",
        })
      }
      throw error
    }
  }

  // 1. Emit Quote / Presupuesto from Cart
  const handleCreateQuoteFromCart = async () => {
    if (cart.length === 0) {
      toast.warning("Carrito Vacío", {
        description: "Agrega al menos un producto al carrito para generar un presupuesto.",
      })
      return
    }

    try {
      const res = await createQuote({
        clientId: selectedClient.id === "cli-cf" ? undefined : selectedClient.id,
        clientName: selectedClient.name,
        clientDoc: selectedClient.docNumber,
        clientTaxCondition: selectedClient.taxCondition,
        validDays: 15,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: discountPercent,
          taxRatePercent: applyTax ? 21 : 0,
        })),
        discount: summary.discountAmount,
        tax: summary.taxAmount,
        notes: "Presupuesto comercial emitido desde mostrador POS",
      })

      if (res.success && res.data) {
        setQuotes((prev) => [res.data!, ...prev])
        setSelectedQuoteForView(res.data)
        toast.success("Presupuesto Emitido", {
          description: `${res.data.quoteNumber} generado exitosamente por $${Math.round(res.data.total).toLocaleString("es-CL")}`,
        })
      } else {
        toast.error("Error al Emitir Presupuesto", {
          description: res.error || "No se pudo registrar la cotización.",
        })
      }
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "Ocurrió un error inesperado al generar el presupuesto.",
      })
    }
  }

  // 2. Convert Quote to Active Sale in POS
  const handleConvertQuoteToSale = (quote: QuoteData) => {
    const newCartItems: CartItem[] = quote.items.map((item) => {
      const p = products.find((prod) => prod.id === item.productId)
      return {
        productId: item.productId,
        code: item.productCode || p?.code || "SKU-PROD",
        name: item.productName || p?.name || "Producto",
        categoryName: p?.categoryName || "General",
        unitPrice: item.unitPrice,
        costPrice: item.unitCost || p?.costPrice || 0,
        quantity: item.quantity,
        stock: p?.stock ?? 100,
        discountRate: (item.discountPercent || 0) / 100,
        discountAmount: (item.unitPrice * (item.discountPercent || 0)) / 100,
        taxRate: (item.taxRatePercent || 0) / 100,
        subtotal: item.subtotal,
      }
    })

    setCart(newCartItems)

    if (quote.clientId) {
      const client = clients.find((c) => c.id === quote.clientId)
      if (client) {
        setSelectedClient(client)
      } else if (quote.clientName) {
        setSelectedClient({
          id: quote.clientId,
          name: quote.clientName,
          docType: "DNI",
          docNumber: quote.clientDoc || "00000000",
          taxCondition: quote.clientTaxCondition || "Consumidor Final",
        })
      }
    }

    setApplyTax(quote.tax > 0)
    setDiscountPercent(
      quote.discount > 0 && quote.subtotal > 0
        ? Math.round((quote.discount / quote.subtotal) * 100)
        : 0
    )

    setActiveQuoteIdForSale(quote.id)
    setActiveTab("POS")
    setIsCheckoutOpen(true)

    toast.info("Presupuesto Cargado al Carrito", {
      description: `${quote.quoteNumber} transferido al mostrador. Procede al cobro para cerrar la venta.`,
    })
  }

  // 3. Update Quote Status
  const handleQuoteStatusChange = async (id: string, newStatus: QuoteStatus) => {
    const res = await updateQuoteStatus(id, newStatus)
    if (res.success) {
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      )
      toast.success("Estado Actualizado", {
        description: `Presupuesto actualizado a ${newStatus}`,
      })
    } else {
      toast.error("Error", {
        description: res.error || "No se pudo actualizar el estado de la cotización.",
      })
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
    toast.info("Exportación Completada", {
      description: "Historial de ventas descargado en formato CSV.",
    })
  }

  // Export Sales History to JSON
  const handleExportSalesJSON = () => {
    exportToJSON("historial_ventas_gestion_manager", salesHistory)
    toast.info("Exportación JSON", {
      description: "Historial estructurado JSON descargado.",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Command Palette (Ctrl+K / F2) */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        products={products}
        onSelectProduct={(p) => {
          handleAddToCart(p)
          toast.success(`Agregado: ${p.name}`, {
            description: `SKU: ${p.code} • Stock: ${p.stock} un.`,
          })
        }}
      />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Punto de Venta & Caja (POS)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Terminal rápida de cobro, emisión de tickets y persistencia atómica en base de datos.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-2xl p-1.5 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("POS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "POS"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
                : "text-muted-foreground hover:text-foreground"
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

          <button
            type="button"
            onClick={() => setActiveTab("QUOTES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "QUOTES"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Presupuestos</span>
            {quotes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary dark:bg-black/30 font-mono font-bold">
                {quotes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "POS" ? (
        /* ========================================================================= */
        /* TAB 1: POS TERMINAL - ALTA DENSIDAD INDUSTRIAL                            */
        /* ========================================================================= */
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[calc(100vh-12rem)]">
          {/* Left Column: Product Catalog & Search (Expanded to fill available space) */}
          <div className="flex-1 min-w-0 flex flex-col space-y-4">
            {/* Search, Shortcuts & Category Pills */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={searchInputRef}
                      placeholder="Buscar producto por nombre o SKU (F2 para enfocar)..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setSelectedProductIndex(0)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          setSelectedProductIndex((prev) =>
                            Math.min(filteredProducts.length - 1, prev + 1)
                          )
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault()
                          setSelectedProductIndex((prev) => Math.max(0, prev - 1))
                        } else if (e.key === "Enter" && filteredProducts.length > 0) {
                          e.preventDefault()
                          const target = filteredProducts[selectedProductIndex]
                          if (target) handleAddToCart(target)
                        }
                      }}
                      leftIcon={<Search className="h-4 w-4" />}
                      rightIcon={
                        <kbd className="hidden sm:inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border">
                          F2
                        </kbd>
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="h-10 px-3 text-xs font-mono shrink-0 cursor-pointer"
                    leftIcon={<Search className="h-3.5 w-3.5 text-primary" />}
                  >
                    Ctrl+K
                  </Button>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("ALL")
                      setSelectedProductIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === "ALL"
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
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
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setSelectedProductIndex(0)
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {category.name} ({count})
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Industrial High-Density Products Table with Notable Column Dividers */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm card-specular flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1 max-h-[calc(100vh-21rem)] min-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md border-b-2 border-border text-[11px] uppercase tracking-wider font-extrabold text-foreground">
                    <tr className="divide-x divide-border/80">
                      <th className="py-3 px-4 w-36 min-w-[120px]">SKU / Código</th>
                      <th className="py-3 px-4 min-w-[260px]">Producto / Descripción</th>
                      <th className="py-3 px-4 w-44 min-w-[150px]">Rubro</th>
                      <th className="py-3 px-4 w-28 min-w-[95px] text-center">Stock</th>
                      <th className="py-3 px-4 w-36 min-w-[130px] text-right">Precio Unitario</th>
                      <th className="py-3 px-4 w-24 min-w-[85px] text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                          <p className="font-semibold text-sm text-foreground">No se encontraron productos</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Intenta con otro término o presiona Ctrl+K.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product, idx) => {
                        const isOutOfStock = product.stock <= 0
                        const isLowStock = product.stock > 0 && product.stock <= product.minStock
                        const isSelected = idx === selectedProductIndex
                        const category = categories.find((c) => c.id === product.categoryId)

                        return (
                          <tr
                            key={product.id}
                            onClick={() => {
                              setSelectedProductIndex(idx)
                              if (!isOutOfStock) handleAddToCart(product)
                            }}
                            className={cn(
                              "transition-colors duration-75 select-none cursor-pointer group divide-x divide-border/60",
                              isSelected ? "bg-primary/15" : "hover:bg-muted/50 even:bg-muted/15",
                              isOutOfStock && "opacity-50 cursor-not-allowed bg-muted/20"
                            )}
                          >
                            <td className="py-2.5 px-4 font-mono font-bold text-xs text-primary whitespace-nowrap">
                              {product.code}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-foreground text-xs">{product.name}</div>
                              {product.description && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-md mt-0.5">
                                  {product.description}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 border border-border/50 text-foreground/80 font-medium text-[11px]">
                                {category?.name || product.categoryName || "General"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                              <Badge
                                variant={
                                  product.status === "IN_STOCK"
                                    ? "success"
                                    : product.status === "LOW_STOCK"
                                    ? "warning"
                                    : "destructive"
                                }
                                size="sm"
                                dot
                              >
                                {product.stock} un.
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                              ${product.salePrice.toLocaleString("es-CL")}
                            </td>
                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToCart(product)
                                }}
                                className="h-7 px-3 text-xs cursor-pointer active:scale-[0.98]"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                <span>Agregar</span>
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Cart & Totals (Fixed Width, Full Height & Sticky) */}
          <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col sticky top-20">
            <Card className="flex-1 flex flex-col h-full bg-card border border-border shadow-sm card-specular rounded-2xl overflow-hidden">
              {/* Client Selection Header with Searchable Combobox */}
              <CardHeader className="pb-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold text-foreground">Cliente de la Venta</CardTitle>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer transition-colors"
                    >
                      Vaciar Carrito
                    </button>
                  )}
                </div>

                <div className="mt-2.5">
                  <ClientSearchCombobox
                    clients={clients}
                    selectedClient={selectedClient}
                    onSelectClient={(client) => setSelectedClient(client)}
                  />
                </div>
              </CardHeader>

              {/* Cart Items List & Modifiers */}
              <CardContent className="flex-1 flex flex-col justify-between p-4 min-h-0">
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/60 shadow-xs">
                      <ShoppingCart className="h-8 w-8 opacity-60" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">El carrito de venta está vacío</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                        Selecciona productos de la tabla o escanea códigos de barra con la pistola USB.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-mono">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">F2</kbd>
                      <span>Buscar producto</span>
                      <span>•</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">F3</kbd>
                      <span>Cliente</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-30rem)] min-h-[160px] pr-1 scrollbar-thin">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-primary font-bold">{item.code}</span>
                            <span className="text-[10px] text-muted-foreground">• {item.categoryName}</span>
                          </div>
                          <h5 className="font-bold text-xs text-foreground truncate">{item.name}</h5>
                          <span className="text-xs font-medium font-mono tabular-nums text-muted-foreground">
                            ${item.unitPrice.toLocaleString("es-CL")} c/u
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-card rounded-lg p-0.5 border border-border">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, -1)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-foreground tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, 1)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="font-mono tabular-nums font-black text-xs text-foreground">
                              ${item.subtotal.toLocaleString("es-CL")}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="p-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary & Modifiers (Pinned to Bottom) */}
                {cart.length > 0 && (
                  <div className="pt-3 border-t border-border mt-auto space-y-3 shrink-0">
                    {/* Discount quick selectors + Custom Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                          <Percent className="h-3.5 w-3.5 text-primary" />
                          Descuento Global:
                        </span>
                        <div className="flex items-center gap-1">
                          {[0, 5, 10, 15].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setDiscountPercent(pct)
                                setIsCustomDiscountOpen(false)
                                setCustomDiscountInput(pct > 0 ? String(pct) : "")
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer border",
                                discountPercent === pct && !isCustomDiscountOpen
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : "bg-muted text-muted-foreground hover:text-foreground border-border"
                              )}
                            >
                              {pct}%
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomDiscountOpen((prev) => !prev)
                              if (!isCustomDiscountOpen && ![0, 5, 10, 15].includes(discountPercent)) {
                                setCustomDiscountInput(String(discountPercent))
                              }
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer border",
                              (![0, 5, 10, 15].includes(discountPercent) || isCustomDiscountOpen)
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-muted text-muted-foreground hover:text-foreground border-border"
                            )}
                          >
                            {![0, 5, 10, 15].includes(discountPercent) ? `${discountPercent}%` : "Otro..."}
                          </button>
                        </div>
                      </div>

                      {/* Custom Discount Input Bar */}
                      {isCustomDiscountOpen && (
                        <div className="flex items-center gap-2 pt-1 animate-in fade-in-0 duration-150">
                          <div className="relative flex-1 flex items-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={customDiscountInput}
                              onChange={(e) => {
                                const val = e.target.value
                                setCustomDiscountInput(val)
                                const num = Math.min(100, Math.max(0, Number(val) || 0))
                                setDiscountPercent(num)
                              }}
                              placeholder="Porcentaje de descuento (0 - 100)"
                              className="w-full h-8 px-2.5 pr-7 text-xs rounded-lg border border-border bg-card text-foreground font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                              autoFocus
                            />
                            <span className="absolute right-2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomDiscountOpen(false)
                              if (!customDiscountInput || Number(customDiscountInput) === 0) {
                                setDiscountPercent(0)
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breakdown totals */}
                    <div className="space-y-2 text-xs text-muted-foreground pt-1">
                      <div className="flex justify-between">
                        <span>Subtotal Neto:</span>
                        <span className="text-foreground font-mono tabular-nums font-medium">
                          ${summary.subtotal.toLocaleString("es-CL")}
                        </span>
                      </div>

                      {summary.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-500 font-semibold">
                          <span>Descuento ({summary.discountValue}%):</span>
                          <span className="font-mono tabular-nums">-${summary.discountAmount.toLocaleString("es-CL")}</span>
                        </div>
                      )}

                      {/* Interactive IVA (VAT) Toggle Control */}
                      <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-muted/40 border border-border transition-colors">
                        <label htmlFor="iva-toggle" className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            id="iva-toggle"
                            checked={applyTax}
                            onChange={(e) => setApplyTax(e.target.checked)}
                            className="h-4 w-4 rounded border-border bg-card text-primary accent-primary cursor-pointer transition-colors"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              Aplicar IVA (21%)
                            </span>
                            <Badge variant={applyTax ? "default" : "secondary"} size="sm" className="h-4 text-[9px] px-1 font-bold">
                              {applyTax ? "Activo" : "Exento"}
                            </Badge>
                          </div>
                        </label>
                        <span
                          className={cn(
                            "font-mono tabular-nums text-xs font-bold transition-colors",
                            applyTax ? "text-foreground" : "text-muted-foreground line-through opacity-60"
                          )}
                        >
                          {applyTax ? `$${summary.taxAmount.toLocaleString("es-CL")}` : "$0"}
                        </span>
                      </div>

                      {/* Highlighted Total */}
                      <div className="flex items-center justify-between text-base font-black text-foreground pt-2 border-t border-border">
                        <span>Total Final:</span>
                        <span className="text-primary font-black text-2xl font-mono tabular-nums tracking-tight">
                          ${summary.total.toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Checkout & Emit Quote */}
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        type="button"
                        variant="default"
                        size="lg"
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full font-bold text-sm shadow-md cursor-pointer active:scale-[0.98] transition-transform"
                        leftIcon={<Banknote className="h-4 w-4" />}
                      >
                        <span>Cobrar Venta (F4)</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateQuoteFromCart}
                        className="w-full font-bold text-xs border-border/80 hover:bg-muted/80 text-foreground cursor-pointer active:scale-[0.98] transition-transform"
                        leftIcon={<FileText className="h-3.5 w-3.5 text-primary" />}
                      >
                        <span>Emitir Presupuesto / Cotización</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : activeTab === "HISTORY" ? (
        /* ========================================================================= */
        /* TAB 2: HISTORIAL DE VENTAS                                                */
        /* ========================================================================= */
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Registro de Transacciones & Comprobantes
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Historial completo de ventas generadas en la base de datos de tu organización.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportSalesCSV}
                  leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />}
                  className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Exportar CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportSalesJSON}
                  leftIcon={<FileJson className="h-3.5 w-3.5 text-primary" />}
                  className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
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
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No hay ventas registradas aún. Las transacciones completadas aparecerán aquí.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesHistory.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {sale.saleNumber}
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {sale.date}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="font-bold text-xs text-foreground truncate">{sale.clientName}</div>
                          <span className="text-[10px] text-muted-foreground">{sale.clientDoc}</span>
                        </TableCell>
                        <TableCell>
                          <Badge size="sm" variant="outline">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-foreground">
                          {sale.items.length} ({sale.summary.totalUnits || sale.items.reduce((s, i) => s + i.quantity, 0)} un.)
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-black text-sm text-foreground">
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
      ) : (
        /* ========================================================================= */
        /* TAB 3: PRESUPUESTOS Y COTIZACIONES                                        */
        /* ========================================================================= */
        <QuotesTab
          quotes={quotes}
          onConvertToSale={handleConvertQuoteToSale}
          onStatusChange={handleQuoteStatusChange}
        />
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
          setDiscountPercent(0)
          setIsCustomDiscountOpen(false)
          setCustomDiscountInput("")
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

      {/* Printable Formal A4 Quote Document Modal */}
      <QuoteDocumentModal
        isOpen={Boolean(selectedQuoteForView)}
        onClose={() => setSelectedQuoteForView(null)}
        quote={selectedQuoteForView}
      />
    </div>
  )
}
