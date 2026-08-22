"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  X,
  BarChart3,
  HelpCircle,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventario",
    href: "/inventory",
    icon: Boxes,
    badge: "12",
  },
  {
    title: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
]

interface SidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

export function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const pathname = usePathname()

  const isLinkActive = (href: string) => {
    if (href === "/dashboard" && (pathname === "/" || pathname === "/dashboard")) {
      return true
    }
    if (href === "/inventory" && (pathname.startsWith("/inventory") || pathname.startsWith("/stock"))) {
      return true
    }
    return pathname.startsWith(href) && href !== "/"
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          // Desktop width
          isCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile translation
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden group"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  Gestión<span className="text-blue-400">Manager</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                  Enterprise Suite
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Cerrar barra lateral"
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {(!isCollapsed || isMobileOpen) ? "Menú Principal" : "•"}
          </div>

          {navItems.map((item) => {
            const active = isLinkActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
                title={isCollapsed && !isMobileOpen ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                    active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />

                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate flex-1">{item.title}</span>
                )}

                {(!isCollapsed || isMobileOpen) && item.badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-full ml-auto",
                      active
                        ? "bg-blue-800 text-blue-100"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Desktop Collapsed Tooltip Hover Indicator */}
                {isCollapsed && !isMobileOpen && (
                  <span className="sr-only">{item.title}</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
          {(!isCollapsed || isMobileOpen) && (
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span>Estado del Sistema</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">Multi-tenant v1.0 • Operativo</p>
            </div>
          )}

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Colapsar menú</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
