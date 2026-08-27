"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type ThemePalette = "blue" | "green" | "beige" | "rose"

export interface ThemeConfig {
  id: ThemePalette
  name: string
  subtitle: string
  swatchColor: string
  accentColor: string
  bgSoft: string
  sidebarColor: string
  description: string
}

export const themeOptions: ThemeConfig[] = [
  {
    id: "blue",
    name: "Azul Clásico",
    subtitle: "Corporativo / Ejecutivo",
    swatchColor: "#2563eb",
    accentColor: "#4f46e5",
    bgSoft: "#f8fafc",
    sidebarColor: "#0f172a",
    description: "Sidebar marino profundo (#0f172a), fondo gris azulado suave (#f8fafc) y acentos azul cobalto.",
  },
  {
    id: "green",
    name: "Verde Agua / Mint",
    subtitle: "Fresco & Vital",
    swatchColor: "#059669",
    accentColor: "#10b981",
    bgSoft: "#f0fdf4",
    sidebarColor: "#064e3b",
    description: "Sidebar verde bosque (#064e3b), fondo menta claro (#f0fdf4) y acentos esmeralda vibrantes.",
  },
  {
    id: "beige",
    name: "Beige / Cálido Arena",
    subtitle: "Minimal & Orgánico",
    swatchColor: "#d97706",
    accentColor: "#c2410c",
    bgSoft: "#faf8f5",
    sidebarColor: "#292524",
    description: "Sidebar café espresso (#292524), fondo arena tostado (#faf8f5) y tarjetas marfil cálidas.",
  },
  {
    id: "rose",
    name: "Rosa / Rose",
    subtitle: "Moderno & Suave",
    swatchColor: "#e11d48",
    accentColor: "#db2777",
    bgSoft: "#fff1f2",
    sidebarColor: "#4c0519",
    description: "Sidebar borgoña vino (#4c0519), fondo rosa empolvado (#fff1f2) y acentos frambuesa suave.",
  },
]

interface ThemeContextType {
  theme: ThemePalette
  setTheme: (theme: ThemePalette) => void
  currentConfig: ThemeConfig
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = "gm_active_theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePalette>("blue")
  const [isMounted, setIsMounted] = useState(false)

  // Load persisted theme on client mount
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemePalette
      if (savedTheme && themeOptions.some((t) => t.id === savedTheme)) {
        setThemeState(savedTheme)
        applyThemeClass(savedTheme)
      } else {
        applyThemeClass("blue")
      }
    } catch {
      applyThemeClass("blue")
    } finally {
      setIsMounted(true)
    }
  }, [])

  const applyThemeClass = (newTheme: ThemePalette) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      // Remove previous theme classes
      themeOptions.forEach((t) => {
        root.classList.remove(`theme-${t.id}`)
      })
      // Also clean up any legacy classes if they exist
      root.classList.remove("theme-mint", "theme-white")

      // Add new theme class & data-theme attribute
      root.classList.add(`theme-${newTheme}`)
      root.setAttribute("data-theme", newTheme)
    }
  }

  const setTheme = useCallback((newTheme: ThemePalette) => {
    setThemeState(newTheme)
    applyThemeClass(newTheme)
    try {
      window.localStorage.setItem(STORAGE_KEY, newTheme)
    } catch (e) {
      console.warn("Failed to persist theme to localStorage", e)
    }
  }, [])

  const currentConfig = themeOptions.find((t) => t.id === theme) || themeOptions[0]

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentConfig }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
