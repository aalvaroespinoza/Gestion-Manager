"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTheme, themeOptions, ThemePalette } from "./ThemeProvider"
import { Palette, Check, Sparkles, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeSelectorProps {
  variant?: "dropdown" | "inline"
  className?: string
}

export function ThemeSelector({ variant = "dropdown", className }: ThemeSelectorProps) {
  const { theme, setTheme, currentConfig } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"light" | "dark">(
    currentConfig.mode || (theme.startsWith("light-") ? "light" : "dark")
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep selected tab in sync with active theme mode
  useEffect(() => {
    setSelectedTab(theme.startsWith("light-") ? "light" : "dark")
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const lightOptions = themeOptions.filter((t) => t.mode === "light")
  const darkOptions = themeOptions.filter((t) => t.mode === "dark")

  // INLINE VARIANT (Used in Settings / Configuración page)
  if (variant === "inline") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Section 1: Modo Claro (Light Mode) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sun className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Paletas en Modo Claro</h3>
              <p className="text-xs text-muted-foreground">Fondos blancos pulcros y acentos de alto contraste.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lightOptions.map((item) => {
              const isActive = theme === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={cn(
                    "flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 select-none cursor-pointer",
                    isActive
                      ? "border-primary bg-primary-light ring-2 ring-primary/40 shadow-xs"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: item.swatchColor }}
                      >
                        {isActive && <Check className="h-4 w-4" />}
                      </div>
                      <div
                        className="h-4 w-4 rounded-full border border-border shadow-xs"
                        style={{ backgroundColor: item.bgSoft }}
                        title={`Fondo: ${item.bgSoft}`}
                      />
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary-light px-2 py-0.5 rounded-full border border-primary/30">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-foreground">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">{item.subtitle}</p>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 2: Modo Oscuro (Dark Mode) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Paletas en Modo Oscuro</h3>
              <p className="text-xs text-muted-foreground">Fondos profundos de grafito y acentos luminosos.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {darkOptions.map((item) => {
              const isActive = theme === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={cn(
                    "flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 select-none cursor-pointer",
                    isActive
                      ? "border-primary bg-primary-light ring-2 ring-primary/40 shadow-xs"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: item.swatchColor }}
                      >
                        {isActive && <Check className="h-4 w-4" />}
                      </div>
                      <div
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: item.sidebarColor }}
                        title={`Sidebar: ${item.sidebarColor}`}
                      />
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary-light px-2 py-0.5 rounded-full border border-primary/30">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-foreground">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">{item.subtitle}</p>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // DROPDOWN VARIANT (Used in Header navbar)
  const displayedOptions = selectedTab === "light" ? lightOptions : darkOptions

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Cambiar paleta de colores"
        title={`Tema actual: ${currentConfig.name}`}
        className="flex items-center gap-2 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/60"
      >
        {currentConfig.mode === "light" ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Palette className="h-4 w-4 text-primary" />
        )}
        <div
          className="h-3.5 w-3.5 rounded-full border border-border shadow-xs"
          style={{
            backgroundColor: currentConfig.swatchColor,
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-2.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
          {/* Header with Mode Tabs */}
          <div className="px-2 pt-1 pb-2 border-b border-border/60">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Paleta de Temas</span>
              </p>
              <span className="text-[10px] font-mono text-muted-foreground">
                {theme.startsWith("light-") ? "Modo Claro" : "Modo Oscuro"}
              </span>
            </div>

            {/* Segmented Mode Toggle (Claro / Oscuro) */}
            <div className="grid grid-cols-2 p-1 bg-muted/70 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedTab("light")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
                  selectedTab === "light"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Modo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("dark")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
                  selectedTab === "dark"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon className="h-3.5 w-3.5 text-primary" />
                <span>Modo Oscuro</span>
              </button>
            </div>
          </div>

          {/* Theme Options List */}
          <div className="py-2 space-y-1">
            {displayedOptions.map((item) => {
              const isActive = theme === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all cursor-pointer",
                    isActive
                      ? "bg-primary-light text-primary font-bold ring-1 ring-primary/40"
                      : "text-foreground hover:bg-muted/70"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center -space-x-1.5">
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs z-10"
                        style={{ backgroundColor: item.swatchColor }}
                      />
                      <div
                        className="h-4 w-4 rounded-full border border-card shadow-xs"
                        style={{ backgroundColor: item.mode === "light" ? item.bgSoft : item.sidebarColor }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-normal">{item.subtitle}</p>
                    </div>
                  </div>

                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
