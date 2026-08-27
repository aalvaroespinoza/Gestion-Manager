"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type ThemePalette = "blue" | "beige" | "mint" | "white" | "rose"

export interface ThemeConfig {
  id: ThemePalette
  name: string
  subtitle: string
  swatchColor: string
  accentColor: string
  bgSoft: string
  description: string
}

export const themeOptions: ThemeConfig[] = [
  {
    id: "blue",
    name: "Azul Corporativo",
    subtitle: "Default / Ejecutivo",
    swatchColor: "#2563eb",
    accentColor: "#4f46e5",
    bgSoft: "#eff6ff",
    description: "Paleta clásica empresarial, confiable y de alto contraste.",
  },
  {
    id: "beige",
    name: "Arena & Trigo Cálido",
    subtitle: "Elegante / Minimal",
    swatchColor: "#b45309",
    accentColor: "#78350f",
    bgSoft: "#fef3c7",
    description: "Tonos tierra y ámbar cálido, sobrio y relajante para la vista.",
  },
  {
    id: "mint",
    name: "Verde Agua / Mint",
    subtitle: "Fresco & Moderno",
    swatchColor: "#059669",
    accentColor: "#0f766e",
    bgSoft: "#ecfdf5",
    description: "Verde esmeralda y menta energizante, ideal para retail y salud.",
  },
  {
    id: "white",
    name: "Monocromático Minimal",
    subtitle: "Clean / Slate Neutro",
    swatchColor: "#18181b",
    accentColor: "#52525b",
    bgSoft: "#f4f4f5",
    description: "Estética minimalista en blanco y negro puro estilo industrial.",
  },
  {
    id: "rose",
    name: "Rose & Berry Pastel",
    subtitle: "Moderno & Suave",
    swatchColor: "#e11d48",
    accentColor: "#db2777",
    bgSoft: "#fff1f2",
    description: "Rosa contemporáneo y fucsia apagado con estilo boutique.",
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
