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
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", className)}>
        {themeOptions.map((item) => {
          const isActive = theme === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-200 select-none",
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary-light)]/40 ring-2 ring-[var(--primary-ring)] shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: item.swatchColor }}
              >
                {isActive ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-white/50" />
                )}
              </div>

              <div className="flex-1 space-y-0.5 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-[var(--primary-text)] uppercase tracking-wider">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {item.subtitle}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug line-clamp-2 pt-0.5">
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
        title="Personalizar paleta de colores"
        className="flex items-center gap-1.5 rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors"
      >
        <Palette className="h-4 w-4 text-[var(--primary-text)]" />
        <div
          className="h-3 w-3 rounded-full border border-white dark:border-slate-900 shadow-xs"
          style={{
            backgroundColor: themeOptions.find((t) => t.id === theme)?.swatchColor,
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--primary-text)]" />
                <span>Paleta de Colores</span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Personaliza la estética global del sistema
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
                      ? "bg-[var(--primary-light)]/60 text-[var(--primary-text)] font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: item.swatchColor }}
                    />
                    <div>
                      <p className="font-semibold leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{item.subtitle}</p>
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
