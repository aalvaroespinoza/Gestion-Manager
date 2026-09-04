"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

import { flushSync } from "react-dom"

export type ThemePalette =
  | "orange"
  | "blue"
  | "rose"
  | "beige"
  | "light-blue"
  | "light-orange"
  | "light-emerald"
  | "light-rose"

export interface ThemeConfig {
  id: ThemePalette
  name: string
  subtitle: string
  mode: "dark" | "light"
  swatchColor: string
  accentColor: string
  bgSoft: string
  sidebarColor: string
  description: string
}

export const themeOptions: ThemeConfig[] = [
  // --- Modos Oscuros (Dark) ---
  {
    id: "orange",
    name: "Dark Grafito & Naranja",
    subtitle: "Moderno & Pro (Predeterminado)",
    mode: "dark",
    swatchColor: "#f97316",
    accentColor: "#ea580c",
    bgSoft: "#121214",
    sidebarColor: "#09090b",
    description: "Fondo grafito carbón (#121214), tarjetas zinc (#18181b) y acentos vibrantes naranja.",
  },
  {
    id: "blue",
    name: "Dark Azul Cobalto",
    subtitle: "Corporativo & Técnico",
    mode: "dark",
    swatchColor: "#3b82f6",
    accentColor: "#2563eb",
    bgSoft: "#0b0f19",
    sidebarColor: "#070b14",
    description: "Fondo oscuro profundo con tarjetas navy (#111827) y acentos azul cobalto.",
  },
  {
    id: "rose",
    name: "Dark Rosa Borgoña",
    subtitle: "Elegante & Distintivo",
    mode: "dark",
    swatchColor: "#f43f5e",
    accentColor: "#e11d48",
    bgSoft: "#140b10",
    sidebarColor: "#0f060c",
    description: "Fondo grafito vino (#140b10), tarjetas borgoña (#1c1017) y acentos frambuesa/rose.",
  },
  {
    id: "beige",
    name: "Dark Arena Cálido",
    subtitle: "Minimalista & Ámbar",
    mode: "dark",
    swatchColor: "#d97706",
    accentColor: "#b45309",
    bgSoft: "#151311",
    sidebarColor: "#100e0c",
    description: "Fondo cálido oscuro (#151311), tarjetas carbón arena y acentos ámbar dorado.",
  },

  // --- Modos Claros (Light) ---
  {
    id: "light-blue",
    name: "Blanco & Azul Cobalto",
    subtitle: "Limpio, Técnico & Corporativo",
    mode: "light",
    swatchColor: "#2563eb",
    accentColor: "#1d4ed8",
    bgSoft: "#f8fafc",
    sidebarColor: "#ffffff",
    description: "Fondo blanco pulcro (#f8fafc), tarjetas níveas (#ffffff) y acentos azul royal.",
  },
  {
    id: "light-orange",
    name: "Blanco & Naranja",
    subtitle: "Cálido, Dinámico & Pro",
    mode: "light",
    swatchColor: "#ea580c",
    accentColor: "#c2410c",
    bgSoft: "#fafaf9",
    sidebarColor: "#ffffff",
    description: "Fondo blanco cálido (#fafaf9), tarjetas níveas (#ffffff) y acentos naranja intenso.",
  },
  {
    id: "light-emerald",
    name: "Blanco & Esmeralda",
    subtitle: "Fresco, Financiero & Ágil",
    mode: "light",
    swatchColor: "#059669",
    accentColor: "#047857",
    bgSoft: "#f8fafc",
    sidebarColor: "#ffffff",
    description: "Fondo blanco limpio (#f8fafc), tarjetas níveas (#ffffff) y acentos verde esmeralda.",
  },
  {
    id: "light-rose",
    name: "Blanco & Rosa",
    subtitle: "Boutique, Elegante & Retail",
    mode: "light",
    swatchColor: "#e11d48",
    accentColor: "#be123c",
    bgSoft: "#fff8f9",
    sidebarColor: "#ffffff",
    description: "Fondo suave rubí (#fff8f9), tarjetas níveas (#ffffff) y acentos frambuesa refinados.",
  },
]

export type ThemeTransitionOrigin =
  | React.MouseEvent
  | MouseEvent
  | { clientX: number; clientY: number }
  | null
  | undefined

interface ThemeContextType {
  theme: ThemePalette
  setTheme: (theme: ThemePalette, origin?: ThemeTransitionOrigin) => void
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
      root.classList.remove(
        "theme-orange",
        "theme-blue",
        "theme-rose",
        "theme-beige",
        "theme-light-blue",
        "theme-light-orange",
        "theme-light-emerald",
        "theme-light-rose"
      )

      // Add new theme class & data-theme attribute
      root.classList.add(`theme-${newTheme}`)
      root.setAttribute("data-theme", newTheme)

      // Toggle light vs dark class on html root element
      if (newTheme.startsWith("light-")) {
        root.classList.remove("dark")
        root.classList.add("light")
      } else {
        root.classList.remove("light")
        root.classList.add("dark")
      }
    }
  }

  const setTheme = useCallback(
    (newTheme: ThemePalette, origin?: ThemeTransitionOrigin) => {
      if (newTheme === theme) return

      const updateTheme = () => {
        setThemeState(newTheme)
        applyThemeClass(newTheme)
        try {
          window.localStorage.setItem(STORAGE_KEY, newTheme)
        } catch (e) {
          console.warn("Failed to persist theme to localStorage", e)
        }
      }

      // Check if View Transitions API is available and reduced motion is disabled
      const isViewTransitionSupported =
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (!isViewTransitionSupported) {
        updateTheme()
        return
      }

      // Calculate origin coordinates
      let x = window.innerWidth / 2
      let y = window.innerHeight / 2

      if (origin && typeof origin === "object" && "clientX" in origin && typeof origin.clientX === "number") {
        x = origin.clientX
        y = origin.clientY
      }

      // Calculate maximum distance to the furthest corner of the viewport
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      try {
        const transition = (document as any).startViewTransition(() => {
          flushSync(() => {
            updateTheme()
          })
        })

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ]

          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 420,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
      } catch {
        updateTheme()
      }
    },
    [theme]
  )

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
