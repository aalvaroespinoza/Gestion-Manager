"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { Category, Product, StockStatus } from "@/types/inventory"
import {
  Package,
  Layers,
  DollarSign,
  Barcode,
  Save,
  Sparkles,
  Percent,
  CheckCircle2,
} from "lucide-react"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (productData: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void | Promise<void>
  product?: Product | null
  categories: Category[]
}

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}: ProductModalProps) {
  const isEditing = Boolean(product)

  // Standard form states
  const [sku, setSku] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [costPrice, setCostPrice] = useState<number | "">("")
  const [salePrice, setSalePrice] = useState<number | "">("")
  const [stock, setStock] = useState<number | "">("")
  const [minStock, setMinStock] = useState<number | "">("")

  // Dynamic extra attributes state
  const [extraAttributes, setExtraAttributes] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize or reset form when modal opens / product changes
  useEffect(() => {
    if (product) {
      setSku(product.sku)
      setName(product.name)
      setDescription(product.description || "")
      setCategoryId(product.categoryId)
      setCostPrice(product.costPrice)
      setSalePrice(product.salePrice)
      setStock(product.stock)
      setMinStock(product.minStock)
      setExtraAttributes(product.extraAttributes || {})
    } else {
      setSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`)
      setName("")
      setDescription("")
      setCategoryId(categories[0]?.id || "")
      setCostPrice(10000)
      setSalePrice(16990)
      setStock(20)
      setMinStock(5)
      setExtraAttributes({})
    }
    setErrors({})
  }, [product, isOpen, categories])

  // Get active category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId) || categories[0]
  }, [categories, categoryId])

  // Margin calculation
  const marginPercentage = useMemo(() => {
    const cost = Number(costPrice) || 0
    const sale = Number(salePrice) || 0
    if (sale <= 0) return 0
    return Math.round(((sale - cost) / sale) * 100)
  }, [costPrice, salePrice])

  const marginProfit = useMemo(() => {
    const cost = Number(costPrice) || 0
    const sale = Number(salePrice) || 0
    return sale - cost
  }, [costPrice, salePrice])

  // Build dynamic schema config for extra fields
  const dynamicExtraSchema: DynamicFormSchemaConfig = useMemo(() => {
    if (!activeCategory || !activeCategory.extraFieldsSchema?.length) {
      return { fields: [] }
    }

    return {
      title: undefined,
      description: undefined,
      columns: 2,
      fields: activeCategory.extraFieldsSchema,
      showReset: false,
    }
  }, [activeCategory])

  const handleDynamicFieldsSubmit = (data: Record<string, any>) => {
    setExtraAttributes(data)
  }

  const validateStandardFields = () => {
    const newErrors: Record<string, string> = {}
    if (!sku.trim()) newErrors.sku = "El código SKU es obligatorio"
    if (!name.trim()) newErrors.name = "El nombre del producto es obligatorio"
    if (!categoryId) newErrors.categoryId = "Debe seleccionar una categoría"
    if (costPrice === "" || Number(costPrice) < 0) newErrors.costPrice = "Ingrese un costo válido"
    if (salePrice === "" || Number(salePrice) < 0) newErrors.salePrice = "Ingrese un precio de venta válido"
    if (stock === "" || Number(stock) < 0) newErrors.stock = "Ingrese una cantidad válida de stock"
    if (minStock === "" || Number(minStock) < 0) newErrors.minStock = "Ingrese el stock mínimo"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStandardFields()) return

    const numStock = Number(stock)
    const numMinStock = Number(minStock)

    let calculatedStatus: StockStatus = "IN_STOCK"
    if (numStock === 0) calculatedStatus = "OUT_OF_STOCK"
    else if (numStock <= numMinStock) calculatedStatus = "LOW_STOCK"

    try {
      setIsSubmitting(true)
      await onSave({
        ...(product ? { id: product.id } : {}),
        sku,
        name,
        description,
        categoryId,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        stock: numStock,
        minStock: numMinStock,
        status: calculatedStatus,
        extraAttributes,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Package className="h-5 w-5" />
          </div>
          <span>{isEditing ? "Editar Producto" : "Nuevo Producto en Inventario"}</span>
        </div>
      }
      description={
        isEditing
          ? `Modificando especificaciones y stock para ${product?.name}`
          : "Completa los datos base y las características técnicas según el rubro."
      }
    >
      <form onSubmit={handleSubmitAll} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Section 1: Base Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Barcode className="h-4 w-4 text-blue-500" />
              1. Información General del Producto
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Código SKU / Barra"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              error={errors.sku}
              required
              placeholder="Ej: CST-PER-01"
            />

            <div className="sm:col-span-2">
              <Input
                label="Nombre del Producto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                placeholder="Ej: Perfil Metálico Galvanizado 2x4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Select
                label="Categoría / Rubro"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  // Reset dynamic attributes for new category if switching
                  setExtraAttributes({})
                }}
                error={errors.categoryId}
                required
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </div>

            <Input
              label="Stock Mínimo (Alerta)"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value === "" ? "" : Number(e.target.value))}
              error={errors.minStock}
              required
              min={0}
            />
          </div>
        </div>

        {/* Section 2: Pricing & Stock Inventory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              2. Precios & Existencias
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant={marginPercentage > 30 ? "success" : marginPercentage > 15 ? "warning" : "default"} size="sm">
                Margen: {marginPercentage}% (${marginProfit.toLocaleString("es-CL")})
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Precio Costo Neto"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
              error={errors.costPrice}
              required
              min={0}
              placeholder="10000"
            />

            <Input
              label="Precio Venta Bruto"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
              error={errors.salePrice}
              required
              min={0}
              placeholder="16990"
            />

            <Input
              label="Stock Inicial Disponible"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
              error={errors.stock}
              required
              min={0}
              placeholder="20"
            />
          </div>
        </div>

        {/* Section 3: Dynamic Category-Specific Extra Fields */}
        {activeCategory && activeCategory.extraFieldsSchema?.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 p-4">
            <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-900/60 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  3. Atributos Específicos: {activeCategory.name}
                </h4>
              </div>
              <Badge variant="info" size="sm">Dynamic Form Engine</Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Campos especializados autogenerados por el esquema JSON de esta categoría (medidas, talles, voltajes, etc.).
            </p>

            <DynamicFormRenderer
              schema={dynamicExtraSchema}
              initialValues={extraAttributes}
              onSubmit={async (data) => {
                handleDynamicFieldsSubmit(data)
              }}
              submitButtonText="Aplicar Atributos Dinámicos"
              showResetButton={false}
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {isEditing ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
