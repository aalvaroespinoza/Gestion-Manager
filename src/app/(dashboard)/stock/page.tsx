"use client"

import React, { useState, useMemo } from "react"
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
import { Modal } from "@/components/ui/modal"
import { ProductModal } from "@/components/modules/inventory/ProductModal"
import { mockCategories, mockProducts } from "@/mocks/inventoryData"
import { Category, Product, ProductFormData, StockStatus } from "@/types/inventory"
import {
  Boxes,
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"

export default function StockPage() {
  // State for inventory products & categories
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [categories] = useState<Category[]>(mockCategories)

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price-asc" | "price-desc">("name")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "danger" } | null>(null)

  const showToast = (text: string, type: "success" | "info" | "danger" = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // --- CRUD Mutations in Local React State ---
  const handleSaveProduct = (productData: ProductFormData & { id?: string; status?: StockStatus }) => {
    const category = categories.find((c) => c.id === productData.categoryId)
    const categoryName = category?.name || "General"

    if (productData.id) {
      // Update existing product
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
      showToast(`Producto "${productData.name}" actualizado exitosamente.`, "success")
    } else {
      // Create new product
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        ...productData,
        categoryName,
        status: productData.status || "IN_STOCK",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProducts((prev) => [newProd, ...prev])
      showToast(`Producto "${productData.name}" registrado en stock.`, "success")
    }
  }

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId)
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    setDeletingProduct(null)
    showToast(`Producto "${prod?.name || productId}" eliminado del catálogo.`, "danger")
  }

  // --- Filtered & Sorted Products ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filter by category
      if (selectedCategory !== "ALL" && product.categoryId !== selectedCategory) {
        return false
      }

      // Filter by stock status
      if (selectedStatus !== "ALL" && product.status !== selectedStatus) {
        return false
      }

      // Filter by search text (code, name, description, customAttributes)
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
    }).sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "stock") return b.stock - a.stock
      if (sortBy === "price-asc") return a.salePrice - b.salePrice
      if (sortBy === "price-desc") return b.salePrice - a.salePrice
      return 0
    })
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy])

  // --- Pagination ---
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  // KPI Calculations
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStockCount = products.filter((p) => p.status === "LOW_STOCK").length
  const outOfStockCount = products.filter((p) => p.status === "OUT_OF_STOCK").length
  const totalValuation = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
              : toastMessage.type === "danger"
              ? "bg-red-600 text-white border-red-500 shadow-red-500/20"
              : "bg-blue-600 text-white border-blue-500 shadow-blue-500/20"
          }`}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & New Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Boxes className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Módulo de Stock & Catálogo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de existencias multi-rubro con atributos dinámicos personalizados.
          </p>
        </div>

        <Button
          variant="default"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingProduct(null)
            setIsProductModalOpen(true)
          }}
          className="shadow-sm"
        >
          Nuevo Producto
        </Button>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{products.length} ítems</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{totalStock} unidades en almacén</p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Valorización Costo
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${totalValuation.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Capital inmovilizado
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stock Bajo / Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bajo el umbral de seguridad</p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Productos Agotados
            </CardTitle>
            <Boxes className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requiere orden de compra</p>
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
                placeholder="Buscar por código, nombre o atributos..."
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

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { label: "Todos los Estados", value: "ALL" },
                  { label: "En Stock (Normal)", value: "IN_STOCK" },
                  { label: "Stock Bajo", value: "LOW_STOCK" },
                  { label: "Agotado", value: "OUT_OF_STOCK" },
                ]}
              />
            </div>

            {/* Sorter */}
            <div className="sm:col-span-2">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { label: "Nombre (A-Z)", value: "name" },
                  { label: "Mayor Stock", value: "stock" },
                  { label: "Menor Precio", value: "price-asc" },
                  { label: "Mayor Precio", value: "price-desc" },
                ]}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Atributos Extra</TableHead>
                <TableHead className="text-right">Precio Venta</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableEmpty
                  colSpan={8}
                  message="No se encontraron productos que coincidan con la búsqueda o filtro seleccionado."
                />
              ) : (
                paginatedProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.categoryId)
                  const isLow = product.status === "LOW_STOCK"
                  const isOut = product.status === "OUT_OF_STOCK"

                  return (
                    <TableRow key={product.id}>
                      {/* Código */}
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {product.code}
                      </TableCell>

                      {/* Producto */}
                      <TableCell className="max-w-xs">
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {product.description}
                          </div>
                        )}
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {category?.name || product.categoryName || "General"}
                        </span>
                      </TableCell>

                      {/* Atributos Extra */}
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(product.customAttributes || {}).map(([key, val]) => {
                            if (val === undefined || val === null || val === "" || typeof val === "boolean") {
                              return null
                            }
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300"
                              >
                                <strong className="capitalize mr-1">{key}:</strong>
                                {String(val)}
                              </span>
                            )
                          })}
                        </div>
                      </TableCell>

                      {/* Precio Venta */}
                      <TableCell className="text-right">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          ${product.salePrice.toLocaleString("es-CL")}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Costo: ${product.costPrice.toLocaleString("es-CL")}
                        </div>
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-bold text-sm ${
                              isOut
                                ? "text-red-600 dark:text-red-400"
                                : isLow
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {product.stock} un.
                          </span>
                          <span className="text-[10px] text-slate-400">Mín: {product.minStock}</span>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar Producto"
                            className="h-8 px-2 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                            onClick={() => {
                              setEditingProduct(product)
                              setIsProductModalOpen(true)
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">Editar</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar"
                            className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Mostrando</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>
              <span>a</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </span>
              <span>de</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
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
              >
                Anterior
              </Button>

              <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
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
        product={editingProduct}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <Modal
          isOpen={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          size="sm"
          title={
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Eliminar Producto</span>
            </div>
          }
          description="Esta acción eliminará el producto del inventario."
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              ¿Estás seguro de que deseas eliminar{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {deletingProduct.name}
              </strong>{" "}
              (Código: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{deletingProduct.code}</code>)?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setDeletingProduct(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => handleDeleteProduct(deletingProduct.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
