"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
} from "@/components/ui/table"
import { ToastContainer, ToastMessage } from "@/components/ui/toast"
import {
  ProductModal,
  StockAdjustmentModal,
  DeleteProductDialog,
} from "@/components/modules/inventory"
import {
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} from "@/modules/inventory/actions"
import { exportToCSV, exportToJSON } from "@/lib/exportUtils"
import {
  Category,
  Product,
  ProductFormData,
  StockAdjustmentType,
  StockStatus,
} from "@/types/inventory"
import {
  Boxes,
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileJson,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react"

type SortField = "code" | "name" | "category" | "salePrice" | "stock"
type SortOrder = "asc" | "desc"

interface StockViewProps {
  initialProducts: Product[]
  initialCategories: Category[]
}

export function StockView({ initialProducts, initialCategories }: StockViewProps) {
  const router = useRouter()

  // Dynamic products & categories state from server props
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories] = useState<Category[]>(initialCategories)

  // Sync state if server revalidates and sends new props
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

  // Interactive Column Sorting
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Rich Toasts Stack
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

  // Keyboard Shortcuts (N / Alt+N -> New Product, Escape -> Close Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase()
      const isInputActive = activeTag === "input" || activeTag === "textarea" || activeTag === "select"

      if (e.key === "Escape") {
        setIsProductModalOpen(false)
        setIsAdjustmentModalOpen(false)
        setDeletingProduct(null)
        setEditingProduct(null)
        setAdjustingProduct(null)
      } else if ((e.key === "n" || e.key === "N") && (e.altKey || !isInputActive)) {
        if (!isProductModalOpen && !isAdjustmentModalOpen && !deletingProduct) {
          e.preventDefault()
          setEditingProduct(null)
          setIsProductModalOpen(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isProductModalOpen, isAdjustmentModalOpen, deletingProduct])

  // --- Sorting Handler ---
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // --- Real Server Action CRUD Mutations ---

  // 1. Create or Edit Product via Server Actions
  const handleSaveProduct = async (
    productData: ProductFormData & { id?: string; status?: StockStatus }
  ) => {
    const category = categories.find((c) => c.id === productData.categoryId)
    const categoryName = category?.name || "General"

    if (productData.id) {
      const res = await updateProduct(productData.id, {
        code: productData.code,
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        costPrice: productData.costPrice,
        salePrice: productData.salePrice,
        currentStock: productData.stock,
        minStock: productData.minStock,
        customAttributes: productData.customAttributes,
      })

      if (!res.success) {
        addToast("Error al Actualizar", res.error || "No fue posible guardar los cambios.", "destructive")
        return
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productData.id
            ? {
                ...p,
                ...productData,
                categoryName,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      )
      addToast(
        "Producto Actualizado",
        `Se guardaron los cambios en base de datos para "${productData.name}".`,
        "success"
      )
      router.refresh()
    } else {
      const res = await createProduct({
        code: productData.code,
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        costPrice: productData.costPrice,
        salePrice: productData.salePrice,
        currentStock: productData.stock,
        minStock: productData.minStock,
        customAttributes: productData.customAttributes,
      })

      if (!res.success) {
        addToast("Error al Crear Producto", res.error || "No fue posible registrar el producto.", "destructive")
        return
      }

      const createdItem = res.data
      const newProd: Product = {
        id: createdItem?.id || `prod-${Date.now()}`,
        ...productData,
        categoryName,
        status: productData.status || "IN_STOCK",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setProducts((prev) => [newProd, ...prev])
      addToast(
        "Producto Creado",
        `"${productData.name}" ha sido guardado exitosamente con ${productData.stock} unidades.`,
        "success"
      )
      router.refresh()
    }
  }

  // 2. Fast Stock Adjustment via Server Actions
  const handleConfirmStockAdjustment = async (
    productId: string,
    newStock: number,
    movement: {
      type: StockAdjustmentType
      quantity: number
      previousStock: number
      newStock: number
      reason: string
      documentRef?: string
    }
  ) => {
    const affectedProd = products.find((p) => p.id === productId)

    const res = await adjustStock({
      productId,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      documentRef: movement.documentRef,
    })

    if (!res.success) {
      addToast("Error de Re-Stock", res.error || "No fue posible realizar el ajuste de inventario.", "destructive")
      return
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          let status: StockStatus = "IN_STOCK"
          if (newStock === 0) status = "OUT_OF_STOCK"
          else if (newStock <= p.minStock) status = "LOW_STOCK"

          return {
            ...p,
            stock: newStock,
            status,
            updatedAt: new Date().toISOString(),
          }
        }
        return p
      })
    )

    const opLabel =
      movement.type === "IN"
        ? `+${movement.quantity} un. ingresadas`
        : movement.type === "OUT"
        ? `-${movement.quantity} un. descontadas`
        : `Stock fijado en ${newStock} un.`

    if (newStock === 0) {
      addToast(
        "⚠️ Producto Agotado",
        `${affectedProd?.name || "Producto"}: stock en 0 un. tras ajuste (${movement.reason}).`,
        "destructive"
      )
    } else if (affectedProd && newStock <= affectedProd.minStock) {
      addToast(
        "⚠️ Alerta de Stock Bajo",
        `${affectedProd.name}: ${newStock} un. restantes (Bajo umbral mínimo de ${affectedProd.minStock} un.).`,
        "warning"
      )
    } else {
      addToast(
        "Re-Stock Aplicado con Éxito",
        `${affectedProd?.name || "Producto"}: ${opLabel}. Nuevo total: ${newStock} un.`,
        "success"
      )
    }

    router.refresh()
  }

  // 3. Delete Product via Server Action
  const handleDeleteProduct = async (productId: string) => {
    const prod = products.find((p) => p.id === productId)

    const res = await deleteProduct(productId)
    if (!res.success) {
      addToast("Error al Eliminar", res.error || "No se pudo eliminar el producto.", "destructive")
      return
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId))
    setDeletingProduct(null)
    addToast(
      "Producto Eliminado",
      `"${prod?.name || productId}" fue removido del catálogo de la base de datos.`,
      "destructive"
    )
    router.refresh()
  }

  // --- Reset All Filters ---
  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("ALL")
    setSelectedStatus("ALL")
    setCurrentPage(1)
  }

  // --- Filtered & Sorted Products ---
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (selectedCategory !== "ALL" && product.categoryId !== selectedCategory) {
          return false
        }

        if (selectedStatus !== "ALL" && product.status !== selectedStatus) {
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
      .sort((a, b) => {
        let comp = 0
        if (sortField === "code") comp = a.code.localeCompare(b.code)
        else if (sortField === "name") comp = a.name.localeCompare(b.name)
        else if (sortField === "category")
          comp = (a.categoryName || "").localeCompare(b.categoryName || "")
        else if (sortField === "salePrice") comp = a.salePrice - b.salePrice
        else if (sortField === "stock") comp = a.stock - b.stock

        return sortOrder === "asc" ? comp : -comp
      })
  }, [products, searchQuery, selectedCategory, selectedStatus, sortField, sortOrder])

  // --- Export Handlers ---
  const handleExportCSV = () => {
    exportToCSV(
      "inventario_stock_gestion_manager",
      filteredProducts,
      [
        { key: "code", label: "Código" },
        { key: "name", label: "Producto" },
        { key: "categoryName", label: "Categoría" },
        { key: "salePrice", label: "Precio Venta", format: (v) => `$${Number(v).toLocaleString("es-CL")}` },
        { key: "costPrice", label: "Costo", format: (v) => `$${Number(v).toLocaleString("es-CL")}` },
        { key: "stock", label: "Stock Actual" },
        { key: "minStock", label: "Stock Mínimo" },
        { key: "status", label: "Estado", format: (v) => (v === "IN_STOCK" ? "En Stock" : v === "LOW_STOCK" ? "Stock Bajo" : "Agotado") },
      ]
    )
    addToast("Exportación Completada", "Archivo CSV generado con BOM UTF-8 y delimitador ';' descargado con éxito.", "info")
  }

  const handleExportJSON = () => {
    exportToJSON("inventario_stock_gestion_manager", filteredProducts)
    addToast("Exportación JSON", "Catálogo exportado en formato estructurado JSON.", "info")
  }

  // --- Pagination Slice ---
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  // --- KPI Stats Calculations ---
  const totalItemsCount = products.length
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0)
  const totalValuationEstimated = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)
  const totalSaleValuation = products.reduce((sum, p) => sum + p.stock * p.salePrice, 0)
  const lowStockCount = products.filter((p) => p.status === "LOW_STOCK").length
  const outOfStockCount = products.filter((p) => p.status === "OUT_OF_STOCK").length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Rich Toasts Floating Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header & New Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Boxes className="h-8 w-8 text-primary" />
            Control de Stock & Inventario
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-medium">
            Gestión completa de existencias, atributos técnicos, re-stock rápido y base de datos en tiempo real.
          </p>
        </div>

        {/* Actions: Export & New Product */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#18181b] border border-zinc-800 rounded-xl p-1 shadow-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />}
              className="h-8 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              title="Descargar tabla en formato Excel CSV"
            >
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportJSON}
              leftIcon={<FileJson className="h-3.5 w-3.5 text-primary" />}
              className="h-8 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              title="Descargar catálogo en formato JSON"
            >
              JSON
            </Button>
          </div>

          <Button
            variant="default"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingProduct(null)
              setIsProductModalOpen(true)
            }}
            className="font-bold cursor-pointer"
          >
            <span>Nuevo Producto</span>
            <kbd className="hidden sm:inline-block ml-1.5 px-1.5 py-0.2 bg-black/25 text-[10px] rounded font-mono">
              N
            </kbd>
          </Button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total de Productos
            </CardTitle>
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {totalItemsCount} <span className="text-sm font-medium text-zinc-400">ítems</span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {totalUnitsInStock} unidades físicas en bodega
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Valor Total Estimado
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              ${totalValuationEstimated.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-emerald-400 font-bold mt-1">
              Venta est.: ${totalSaleValuation.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Stock Crítico / Bajo
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-400">
              {lowStockCount} <span className="text-sm font-medium text-zinc-400">ítems</span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Bajo el umbral mínimo de seguridad
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Productos Agotados
            </CardTitle>
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-400">
              {outOfStockCount} <span className="text-sm font-medium text-zinc-400">ítems</span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Existencias en 0 un. (Sin stock)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card with Search & Filters */}
      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Real-time Search */}
            <div className="sm:col-span-5">
              <Input
                placeholder="Buscar por código, nombre o atributos (ej: 20V, OSB, 6m)..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { label: "Todas las Categorías", value: "ALL" },
                  ...categories.map((c) => ({ label: c.name, value: c.id })),
                ]}
              />
            </div>

            {/* Quick Stock Status Filter */}
            <div className="sm:col-span-3">
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { label: "Todos los Estados", value: "ALL" },
                  { label: "🟢 Stock Normal (En Stock)", value: "IN_STOCK" },
                  { label: "🟡 Stock Bajo (Crítico)", value: "LOW_STOCK" },
                  { label: "🔴 Agotados (Sin Stock)", value: "OUT_OF_STOCK" },
                ]}
              />
            </div>

            {/* Reset Filter Button */}
            <div className="sm:col-span-1 flex items-center justify-end">
              {(searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full h-10 px-2 cursor-pointer"
                  title="Limpiar todos los filtros"
                >
                  <RotateCcw className="h-4 w-4 text-zinc-400" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                {/* Sortable Column: Código */}
                <TableHead
                  onClick={() => handleSort("code")}
                  className="cursor-pointer hover:text-primary transition-colors select-none font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>Código</span>
                    {sortField === "code" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </TableHead>

                {/* Sortable Column: Producto */}
                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer hover:text-primary transition-colors select-none font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>Producto</span>
                    {sortField === "name" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </TableHead>

                {/* Sortable Column: Categoría */}
                <TableHead
                  onClick={() => handleSort("category")}
                  className="cursor-pointer hover:text-primary transition-colors select-none font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>Categoría</span>
                    {sortField === "category" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </TableHead>

                <TableHead className="font-bold">Atributos Extra</TableHead>

                {/* Sortable Column: Precio Venta */}
                <TableHead
                  onClick={() => handleSort("salePrice")}
                  className="text-right cursor-pointer hover:text-primary transition-colors select-none font-bold"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Precio Venta</span>
                    {sortField === "salePrice" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </TableHead>

                {/* Sortable Column: Stock */}
                <TableHead
                  onClick={() => handleSort("stock")}
                  className="text-center cursor-pointer hover:text-primary transition-colors select-none font-bold"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stock</span>
                    {sortField === "stock" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </TableHead>

                <TableHead className="text-center font-bold">Estado</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-zinc-400 mx-auto flex items-center justify-center border border-zinc-800">
                        <Search className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        No se encontraron productos coincidentes
                      </h4>
                      <p className="text-xs text-zinc-400">
                        No hay registros que cumplan con los criterios de búsqueda o filtros seleccionados.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        className="cursor-pointer"
                      >
                        Limpiar Filtros
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.categoryId)
                  const isLow = product.status === "LOW_STOCK"
                  const isOut = product.status === "OUT_OF_STOCK"

                  return (
                    <TableRow key={product.id} className="hover:bg-zinc-800/60 transition-colors">
                      {/* Código */}
                      <TableCell className="font-mono text-xs font-medium text-primary">
                        {product.code}
                      </TableCell>

                      {/* Producto */}
                      <TableCell className="max-w-xs">
                        <div className="font-bold text-sm text-white line-clamp-1">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-[11px] text-zinc-400 line-clamp-1 font-normal">
                            {product.description}
                          </div>
                        )}
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>
                        <span className="text-xs text-zinc-300 font-medium">
                          {category?.name || product.categoryName || "General"}
                        </span>
                      </TableCell>

                      {/* Atributos Extra */}
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(product.customAttributes || {}).map(([key, val]) => {
                            if (
                              val === undefined ||
                              val === null ||
                              val === "" ||
                              typeof val === "boolean"
                            ) {
                              return null
                            }
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-medium"
                              >
                                <strong className="capitalize mr-1 text-zinc-400">{key}:</strong>
                                {String(val)}
                              </span>
                            )
                          })}
                        </div>
                      </TableCell>

                      {/* Precio Venta */}
                      <TableCell className="text-right">
                        <div className="font-extrabold text-sm text-white">
                          ${product.salePrice.toLocaleString("es-CL")}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          Costo: ${product.costPrice.toLocaleString("es-CL")}
                        </div>
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-black text-sm ${
                              isOut
                                ? "text-red-400"
                                : isLow
                                ? "text-amber-400"
                                : "text-white"
                            }`}
                          >
                            {product.stock} un.
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">Mín: {product.minStock}</span>
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="text-center">
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
                          {product.status === "IN_STOCK"
                            ? "En Stock"
                            : product.status === "LOW_STOCK"
                            ? "Stock Bajo"
                            : "Agotado"}
                        </Badge>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Re-stock Button */}
                          <button
                            type="button"
                            title="Re-stock / Ajuste de Cantidad"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-colors cursor-pointer"
                            onClick={() => {
                              setAdjustingProduct(product)
                              setIsAdjustmentModalOpen(true)
                            }}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Re-stock</span>
                          </button>

                          {/* Editar Button */}
                          <button
                            type="button"
                            title="Editar Producto Completo"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            onClick={() => {
                              setEditingProduct(product)
                              setIsProductModalOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Eliminar Button */}
                          <button
                            type="button"
                            title="Eliminar del Catálogo"
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span>Mostrando</span>
              <span className="font-bold text-white">
                {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>
              <span>a</span>
              <span className="font-bold text-white">
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </span>
              <span>de</span>
              <span className="font-bold text-white">
                {filteredProducts.length}
              </span>
              <span>productos</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                className="cursor-pointer"
              >
                Anterior
              </Button>

              <span className="px-3 py-1 font-bold text-white">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                className="cursor-pointer"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Creation / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setEditingProduct(null)
        }}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        categories={categories}
      />

      {/* Quick Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false)
          setAdjustingProduct(null)
        }}
        product={adjustingProduct}
        onConfirm={handleConfirmStockAdjustment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductDialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
        onConfirm={handleDeleteProduct}
      />
    </div>
  )
}
