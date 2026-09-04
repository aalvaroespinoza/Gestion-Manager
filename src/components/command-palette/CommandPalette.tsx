"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Product } from "@/types/inventory"
import {
  Search,
  ShoppingCart,
  Boxes,
  Users,
  Settings,
  TrendingUp,
  Package,
} from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products?: Product[]
  onSelectProduct?: (product: Product) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  products = [],
  onSelectProduct,
}: CommandPaletteProps) {
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "F2") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border text-card-foreground shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <Command
          className="w-full flex flex-col"
          loop
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1
            return 0
          }}
        >
          <div className="flex items-center px-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Buscar productos por nombre, SKU o navegar (Ctrl+K)..."
              className="w-full py-4 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-sans"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-muted border border-border rounded-md">
              ESC para salir
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron resultados coincidentes.
            </Command.Empty>

            {products.length > 0 && (
              <Command.Group
                heading="Productos Disponibles"
                className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1.5 tracking-wider"
              >
                {products.slice(0, 15).map((product) => (
                  <Command.Item
                    key={product.id}
                    value={`${product.name} ${product.code} ${product.categoryName || ""}`}
                    onSelect={() => {
                      onSelectProduct?.(product)
                      onOpenChange(false)
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl text-sm text-foreground cursor-pointer select-none hover:bg-muted/80 aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          SKU: {product.code} • Stock: {product.stock} un.
                        </div>
                      </div>
                    </div>
                    <div className="font-mono tabular-nums font-bold text-sm text-foreground">
                      ${product.salePrice.toLocaleString("es-CL")}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Navegación del Sistema"
              className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1.5 tracking-wider mt-2 border-t border-border/50 pt-2"
            >
              <Command.Item
                value="ventas pos punto de venta mostrador"
                onSelect={() => {
                  router.push("/ventas")
                  onOpenChange(false)
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl text-sm text-foreground cursor-pointer select-none hover:bg-muted/80 aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
              >
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>Punto de Venta (POS / Mostrador)</span>
              </Command.Item>

              <Command.Item
                value="stock inventario catalogo productos"
                onSelect={() => {
                  router.push("/stock")
                  onOpenChange(false)
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl text-sm text-foreground cursor-pointer select-none hover:bg-muted/80 aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
              >
                <Boxes className="h-4 w-4 text-primary" />
                <span>Inventario & Control de Stock</span>
              </Command.Item>

              <Command.Item
                value="clientes cuentas corrientes saldo deudor"
                onSelect={() => {
                  router.push("/clientes")
                  onOpenChange(false)
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl text-sm text-foreground cursor-pointer select-none hover:bg-muted/80 aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
              >
                <Users className="h-4 w-4 text-primary" />
                <span>Gestión de Clientes & Cuentas</span>
              </Command.Item>

              <Command.Item
                value="panel control kpis dashboard metricas"
                onSelect={() => {
                  router.push("/dashboard")
                  onOpenChange(false)
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl text-sm text-foreground cursor-pointer select-none hover:bg-muted/80 aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
              >
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Panel de Control (Dashboard)</span>
              </Command.Item>

              <Command.Item
                value="configuracion sucursales usuarios empresa"
                onSelect={() => {
                  router.push("/configuracion")
                  onOpenChange(false)
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl text-sm text-foreground cursor-pointer select-none hover:bg-muted/80 aria-selected:bg-primary/15 aria-selected:text-primary transition-colors"
              >
                <Settings className="h-4 w-4 text-primary" />
                <span>Configuración de Empresa & Usuarios</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
