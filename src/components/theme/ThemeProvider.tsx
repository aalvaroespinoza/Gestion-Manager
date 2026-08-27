"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type ThemePalette = "orange" | "blue" | "rose"

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
    id: "orange",
    name: "Dark Grafito & Naranja",
    subtitle: "Moderno & Pro (Por Defecto)",
    swatchColor: "#f97316",
    accentColor: "#ea580c",
    bgSoft: "#121214",
    sidebarColor: "#09090b",
    description: "Fondo grafito carbón (#121214), tarjetas zinc (#18181b) y acentos vibrantes naranja (#f97316).",
  },
  {
    id: "blue",
    name: "Dark Azul Cobalto",
    subtitle: "Corporativo & Técnico",
    swatchColor: "#3b82f6",
    accentColor: "#2563eb",
    bgSoft: "#0b0f19",
    sidebarColor: "#070b14",
    description: "Fondo oscuro profundo con tarjetas navy (#111827) y acentos azul cobalto eléctrico.",
  },
  {
    id: "rose",
    name: "Dark Rosa Borgoña",
    subtitle: "Elegante & Distintivo",
    swatchColor: "#f43f5e",
    accentColor: "#e11d48",
    bgSoft: "#140b10",
    sidebarColor: "#0f060c",
    description: "Fondo grafito vino (#140b10), tarjetas borgoña (#1c1017) y acentos frambuesa/rose.",
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
  const [theme, setThemeState] = useState<ThemePalette>("orange")
  const [isMounted, setIsMounted] = useState(false)

  // Load persisted theme on client mount
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemePalette
      // If user had "green" or "beige" from previous tests, reset cleanly to "orange"
      if (savedTheme && themeOptions.some((t) => t.id === savedTheme)) {
        setThemeState(savedTheme)
        applyThemeClass(savedTheme)
      } else {
        setThemeState("orange")
        applyThemeClass("orange")
        window.localStorage.setItem(STORAGE_KEY, "orange")
      }
    } catch {
      applyThemeClass("orange")
    } finally {
      setIsMounted(true)
    }
  }, [])

  const applyThemeClass = (newTheme: ThemePalette) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      // Remove any previous theme classes
      root.classList.remove("theme-orange", "theme-blue", "theme-rose", "theme-green", "theme-beige", "theme-mint", "theme-white")

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
