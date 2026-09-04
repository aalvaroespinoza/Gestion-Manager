"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { ClientSelectOption } from "@/types/sales"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Building2,
  Search,
  Check,
  ChevronsUpDown,
  X,
  CreditCard,
} from "lucide-react"

interface ClientSearchComboboxProps {
  clients: ClientSelectOption[]
  selectedClient: ClientSelectOption
  onSelectClient: (client: ClientSelectOption) => void
  className?: string
}

export function ClientSearchCombobox({
  clients,
  selectedClient,
  onSelectClient,
  className,
}: ClientSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Normalize document strings for tolerant searching (strips dots, dashes, spaces)
  const cleanDoc = (val: string) => val.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()

  // Filter clients based on query (name, docNumber, taxCondition, email)
  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients

    const cleanQ = cleanDoc(q)

    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q)
      const matchDocRaw = c.docNumber.toLowerCase().includes(q)
      const matchDocClean = cleanQ ? cleanDoc(c.docNumber).includes(cleanQ) : false
      const matchTax = c.taxCondition?.toLowerCase().includes(q)
      const matchEmail = c.email?.toLowerCase().includes(q)

      return matchName || matchDocRaw || matchDocClean || matchTax || matchEmail
    })
  }, [clients, query])

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setHighlightedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Global F3 shortcut to open client search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Keyboard navigation inside the popover
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.min(filteredClients.length - 1, prev + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.max(0, prev - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredClients[highlightedIndex]) {
        handleSelect(filteredClients[highlightedIndex])
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement | undefined
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex])

  const handleSelect = (client: ClientSelectOption) => {
    onSelectClient(client)
    setIsOpen(false)
  }

  const isCompany =
    selectedClient.docType === "CUIT" ||
    selectedClient.docType === "RUT" ||
    selectedClient.taxCondition?.includes("Inscripto")

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button / Selected Client Display */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          }
        }}
        className={cn(
          "w-full text-left p-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all cursor-pointer group shadow-xs",
          isOpen && "ring-2 ring-primary/30 border-primary"
        )}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                isCompany
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-border group-hover:text-foreground"
              )}
            >
              {isCompany ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {selectedClient.name}
                </span>
                {selectedClient.hasCurrentAccount && (
                  <Badge variant="success" size="sm" className="h-4 text-[9px] px-1 shrink-0">
                    Cta. Cte.
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono truncate leading-none mt-0.5">
                {selectedClient.docType}: {selectedClient.docNumber} •{" "}
                <span className="font-sans font-medium">{selectedClient.taxCondition}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {selectedClient.id !== "cli-cf" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const defaultClient = clients.find((c) => c.id === "cli-cf") || clients[0]
                  if (defaultClient) onSelectClient(defaultClient)
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Restablecer a Consumidor Final"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors pl-1">
              <kbd className="hidden sm:inline-block rounded bg-muted px-1 py-0.5 text-[9px] font-mono border border-border">
                F3
              </kbd>
              <ChevronsUpDown className="h-4 w-4 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col max-h-[380px]">
          {/* Popover Header with Search Input */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative flex items-center">
              <Search className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por nombre, CUIT, RUT o DNI (F3)..."
                className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("")
                    inputRef.current?.focus()
                  }}
                  className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Client List */}
          <div
            ref={listRef}
            className="overflow-y-auto p-1.5 space-y-1 divide-y divide-border/40 scrollbar-thin flex-1"
          >
            {filteredClients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <User className="h-7 w-7 mx-auto opacity-40" />
                <p className="text-xs font-semibold text-foreground">
                  No se encontró ningún cliente
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Intenta buscar por número de documento o razón social.
                </p>
                {clients.some((c) => c.id === "cli-cf") && (
                  <button
                    type="button"
                    onClick={() => {
                      const cf = clients.find((c) => c.id === "cli-cf")
                      if (cf) handleSelect(cf)
                    }}
                    className="mt-2 text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Seleccionar Consumidor Final</span>
                  </button>
                )}
              </div>
            ) : (
              filteredClients.map((client, index) => {
                const isSelected = selectedClient.id === client.id
                const isHighlighted = index === highlightedIndex
                const isCompanyItem =
                  client.docType === "CUIT" ||
                  client.docType === "RUT" ||
                  client.taxCondition?.includes("Inscripto")

                return (
                  <div
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 text-left pt-1.5",
                      isSelected
                        ? "bg-primary/15 border border-primary/30"
                        : isHighlighted
                        ? "bg-muted border border-border"
                        : "hover:bg-muted/60 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs border",
                          isCompanyItem
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {isCompanyItem ? (
                          <Building2 className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground truncate">
                            {client.name}
                          </span>
                          {client.hasCurrentAccount && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              <CreditCard className="h-2.5 w-2.5" />
                              Cta. Cte.
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                          <span className="text-primary font-semibold">
                            {client.docType}: {client.docNumber}
                          </span>
                          <span>•</span>
                          <span className="font-sans truncate">{client.taxCondition}</span>
                          {client.phone && (
                            <>
                              <span>•</span>
                              <span className="truncate">{client.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground/60 opacity-0 group-hover:opacity-100">
                          ↵
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Quick Footer with Total Count and Keyboard Tips */}
          <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{filteredClients.length} clientes disponibles</span>
            <div className="flex items-center gap-2">
              <span>↑↓ Navegar</span>
              <span>↵ Seleccionar</span>
              <span>ESC Cerrar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
