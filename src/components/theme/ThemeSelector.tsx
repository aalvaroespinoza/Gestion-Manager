"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTheme, themeOptions, ThemePalette } from "./ThemeProvider"
import { Palette, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeSelectorProps {
  variant?: "dropdown" | "inline"
  className?: string
}

export function ThemeSelector({ variant = "dropdown", className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  if (variant === "inline") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", className)}>
        {themeOptions.map((item) => {
          const isActive = theme === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 select-none",
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary-light)] ring-2 ring-[var(--primary-ring)] shadow-xs"
                  : "border-border bg-card hover:border-[var(--primary)]/50 hover:bg-muted/40"
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
                  <span className="text-[10px] font-bold text-[var(--primary-text)] uppercase tracking-wider bg-[var(--primary-light)] px-2 py-0.5 rounded-full border border-[var(--primary-light-border)]">
                    Activo
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-xs text-foreground">
                  {item.name}
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {item.subtitle}
                </p>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
                  {item.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown / Popover variant for Header
  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Cambiar paleta de colores"
        title="Personalizar acento de color"
        className="flex items-center gap-1.5 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Palette className="h-4 w-4 text-[var(--primary-text)]" />
        <div
          className="h-3 w-3 rounded-full border border-zinc-700 shadow-xs"
          style={{
            backgroundColor: themeOptions.find((t) => t.id === theme)?.swatchColor,
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card p-2.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--primary-text)]" />
                <span>Paleta de Colores Dark</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Personaliza los acentos de la interfaz
              </p>
            </div>
          </div>

          <div className="py-1.5 space-y-1">
            {themeOptions.map((item) => {
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
                    "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all",
                    isActive
                      ? "bg-[var(--primary-light)] text-[var(--primary-text)] font-bold ring-1 ring-[var(--primary-ring)]"
                      : "text-foreground hover:bg-muted"
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
                        style={{ backgroundColor: item.sidebarColor }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-normal">{item.subtitle}</p>
                    </div>
                  </div>

                  {isActive && <Check className="h-4 w-4 text-[var(--primary-text)]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
