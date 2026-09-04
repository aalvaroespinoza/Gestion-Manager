"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { Category, Product, ProductFormData, StockStatus } from "@/types/inventory"
import {
  Package,
  DollarSign,
  Barcode,
  Save,
  Sparkles,
} from "lucide-react"

export interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (productData: ProductFormData & { id?: string; status?: StockStatus }) => void | Promise<void>
  productToEdit?: Product | null
  product?: Product | null
  categories: Category[]
}

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  product,
  categories,
}: ProductModalProps) {
  const activeProduct = productToEdit !== undefined ? productToEdit : product
  const isEditing = Boolean(activeProduct)

  // Standard fixed form state
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [costPrice, setCostPrice] = useState<number | "">("")
  const [salePrice, setSalePrice] = useState<number | "">("")
  const [stock, setStock] = useState<number | "">("")
  const [minStock, setMinStock] = useState<number | "">("")

  // Dynamic custom attributes state
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize or reset form values when opening modal or changing product
  useEffect(() => {
    if (activeProduct) {
      setCode(activeProduct.code)
      setName(activeProduct.name)
      setDescription(activeProduct.description || "")
      setCategoryId(activeProduct.categoryId)
      setCostPrice(activeProduct.costPrice)
      setSalePrice(activeProduct.salePrice)
      setStock(activeProduct.stock)
      setMinStock(activeProduct.minStock)
      setCustomAttributes(activeProduct.customAttributes || {})
    } else {
      setCode(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)
      setName("")
      setDescription("")
      setCategoryId(categories[0]?.id || "")
      setCostPrice(10000)
      setSalePrice(15990)
      setStock(20)
      setMinStock(5)
      setCustomAttributes({})
    }
    setErrors({})
  }, [activeProduct, isOpen, categories])

  // Get active category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId) || categories[0]
  }, [categories, categoryId])

  // Calculate profit margin
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

  // Dynamic fields schema from active category
  const dynamicExtraSchema: DynamicFormSchemaConfig = useMemo(() => {
    if (!activeCategory || !activeCategory.dynamicFieldsConfig?.length) {
      return { fields: [] }
    }

    return {
      title: undefined,
      description: undefined,
      columns: 2,
      fields: activeCategory.dynamicFieldsConfig,
      showReset: false,
    }
  }, [activeCategory])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!code.trim()) newErrors.code = "El código / SKU es obligatorio"
    if (!name.trim()) newErrors.name = "El nombre del producto es obligatorio"
    if (!categoryId) newErrors.categoryId = "Debe seleccionar una categoría"
    if (costPrice === "" || Number(costPrice) < 0) newErrors.costPrice = "Ingrese un costo válido"
    if (salePrice === "" || Number(salePrice) < 0) newErrors.salePrice = "Ingrese un precio de venta válido"
    if (stock === "" || Number(stock) < 0) newErrors.stock = "Ingrese una cantidad válida de stock"
    if (minStock === "" || Number(minStock) < 0) newErrors.minStock = "Ingrese el stock mínimo"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const numStock = Number(stock)
    const numMinStock = Number(minStock)

    let status: StockStatus = "IN_STOCK"
    if (numStock === 0) status = "OUT_OF_STOCK"
    else if (numStock <= numMinStock) status = "LOW_STOCK"

    try {
      setIsSubmitting(true)
      await onSave({
        ...(activeProduct ? { id: activeProduct.id } : {}),
        code,
        name,
        description,
        categoryId,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        stock: numStock,
        minStock: numMinStock,
        status,
        customAttributes,
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
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-foreground font-bold">{isEditing ? "Editar Producto en Stock" : "Nuevo Producto en Stock"}</span>
        </div>
      }
      description={
        <span className="text-muted-foreground text-xs">
          {isEditing
            ? `Modificando características y existencias para: ${activeProduct?.name}`
            : "Completa la información base y los atributos específicos del rubro."}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Section 1: Fixed Base Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Barcode className="h-4 w-4 text-primary" />
              1. Identificación del Producto
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Código / SKU"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={errors.code}
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
                placeholder="Ej: Perfil Metalcon Estructural C 2x4"
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
                  if (!isEditing) {
                    setCustomAttributes({})
                  }
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
              placeholder="5"
            />
          </div>
        </div>

        {/* Section 2: Pricing & Stock */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              2. Precios & Existencias
            </h4>
            <div className="flex items-center gap-2">
              <Badge
                variant={marginPercentage > 30 ? "success" : marginPercentage > 15 ? "warning" : "default"}
                size="sm"
              >
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
              placeholder="15990"
            />

            <Input
              label="Stock Actual Disponible"
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
        {activeCategory && activeCategory.dynamicFieldsConfig?.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  3. Atributos Específicos: {activeCategory.name}
                </h4>
              </div>
              <Badge variant="default" size="sm">Dynamic Form Engine</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Campos autogenerados dinámicamente según la categoría seleccionada (espesor, medidas, talles, voltajes, etc.).
            </p>

            <DynamicFormRenderer
              schema={dynamicExtraSchema}
              initialValues={customAttributes}
              onSubmit={async (data) => {
                setCustomAttributes(data)
              }}
              submitButtonText="Aplicar Atributos Dinámicos"
              showResetButton={false}
            />
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
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
