"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UserProfileModal, UserProfileData } from "./UserProfileModal"
import { ThemeSelector } from "@/components/theme"
import { getActiveUserSession, logoutAction } from "@/modules/auth/actions"
import {
  Menu,
  Building2,
  ChevronDown,
  Check,
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  Store,
  PlusCircle,
} from "lucide-react"

export interface TenantBranch {
  id: string
  name: string
  code: string
  role: string
  isCurrent?: boolean
}

const defaultBranches: TenantBranch[] = [
  { id: "suc-01", name: "Casa Matriz - Santiago", code: "MATRIZ-CL", role: "Principal", isCurrent: true },
  { id: "suc-02", name: "Sucursal Norte - Antofagasta", code: "NORTE-01", role: "Sucursal" },
  { id: "suc-03", name: "Sucursal Sur - Concepción", code: "SUR-01", role: "Sucursal" },
  { id: "suc-04", name: "Canal Digital & E-Commerce", code: "ONLINE-01", role: "Virtual" },
]

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [branches, setBranches] = useState<TenantBranch[]>(defaultBranches)
  const [selectedBranch, setSelectedBranch] = useState<TenantBranch>(defaultBranches[0])
  const [isTenantOpen, setIsTenantOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Current logged in user profile state from active session
  const [currentUser, setCurrentUser] = useState<UserProfileData>({
    name: "Administrador",
    email: "admin@empresa.com",
    phone: "+54 11 4567-8901",
    position: "Gerente General",
    role: "Administrador",
  })

  const tenantRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Fetch active session from server on mount
  useEffect(() => {
    let isMounted = true

    async function loadActiveSession() {
      try {
        const sessionData = await getActiveUserSession()
        if (sessionData && isMounted) {
          setCurrentUser({
            name: sessionData.user.name || "Administrador",
            email: sessionData.user.email,
            phone: sessionData.user.phone || "+54 11 4567-8901",
            position: sessionData.user.position || "Administrador",
            role: sessionData.user.role || "Administrador",
          })

          const activeBranch: TenantBranch = {
            id: sessionData.tenant.id,
            name: sessionData.tenant.name,
            code: (sessionData.tenant.slug || "MATRIZ").toUpperCase(),
            role: "Principal",
            isCurrent: true,
          }

          setSelectedBranch(activeBranch)
          setBranches((prev) => [
            activeBranch,
            ...prev.filter((b) => b.id !== activeBranch.id).slice(0, 3),
          ])
        }
      } catch {
        // Fallback to default state if error occurs
      }
    }

    loadActiveSession()

    return () => {
      isMounted = false
    }
  }, [])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tenantRef.current && !tenantRef.current.contains(event.target as Node)) {
        setIsTenantOpen(false)
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectBranch = (branch: TenantBranch) => {
    setSelectedBranch(branch)
    setBranches((prev) =>
      prev.map((b) => ({
        ...b,
        isCurrent: b.id === branch.id,
      }))
    )
    setIsTenantOpen(false)
  }

  const handleLogout = async () => {
    setIsUserOpen(false)
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-header bg-header text-foreground px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
      {/* Left Area: Mobile Trigger & Tenant/Branch Selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
          className="lg:hidden rounded-lg p-2 text-foreground/70 hover:bg-muted transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Tenant / Sucursal Selector Dropdown */}
        <div className="relative" ref={tenantRef}>
          <button
            type="button"
            onClick={() => {
              setIsTenantOpen((prev) => !prev)
              setIsUserOpen(false)
              setIsNotificationsOpen(false)
            }}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[var(--primary-light)]/40 hover:border-[var(--primary)] transition-all shadow-xs cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary-text)]">
              <Store className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="truncate max-w-[140px] sm:max-w-[200px] text-xs font-semibold">
                {selectedBranch.name}
              </span>
              <span className="text-[10px] text-foreground/60 font-normal">
                {selectedBranch.code} • {selectedBranch.role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-foreground/40 shrink-0 ml-1" />
          </button>

          {/* Tenant Dropdown Popover */}
          {isTenantOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">
                  Seleccionar Sucursal / Tenant
                </p>
                <p className="text-[11px] text-foreground/60">
                  Espacio de trabajo y base de datos activa
                </p>
              </div>

              <div className="mt-1 max-h-60 overflow-y-auto space-y-1">
                {branches.map((branch) => {
                  const isCurrent = branch.id === selectedBranch.id
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleSelectBranch(branch)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                        isCurrent
                          ? "bg-[var(--primary-light)]/70 text-[var(--primary-text)] font-semibold"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-foreground/50" />
                        <div>
                          <p className="font-semibold">{branch.name}</p>
                          <p className="text-[10px] text-foreground/50">{branch.code}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-[var(--primary-text)]" />}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsTenantOpen(false)
                    router.push("/configuracion")
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-[var(--primary-text)] hover:bg-[var(--primary-light)] font-medium transition-colors cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Gestionar Sucursales en Configuración</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Search, Theme Selector, Notifications & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Shortcut */}
        <div className="hidden md:flex items-center rounded-xl bg-card px-3 py-1.5 text-xs text-foreground/60 border border-border focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-all">
          <Search className="h-3.5 w-3.5 mr-2 text-foreground/40" />
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            aria-label="Buscar en el sistema"
            className="bg-transparent focus:outline-none text-xs text-foreground placeholder:text-foreground/40 w-36 lg:w-48"
          />
          <kbd className="hidden lg:inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-foreground/60 ml-2">
            ⌘K
          </kbd>
        </div>

        {/* Theme Palette Switcher Dropdown */}
        <ThemeSelector variant="dropdown" />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev)
              setIsTenantOpen(false)
              setIsUserOpen(false)
            }}
            aria-label="Notificaciones del sistema"
            className="relative rounded-xl p-2 text-foreground/70 hover:bg-muted transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--primary)] ring-2 ring-card" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">
                  Notificaciones
                </span>
                <Badge size="sm" variant="default">3 nuevas</Badge>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-[var(--primary-light)]/60">
                  <p className="font-semibold text-foreground">Alerta de Stock Crítico</p>
                  <p className="text-foreground/70 text-[11px]">4 productos requieren re-abastecimiento.</p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <p className="font-semibold text-foreground">Venta POS Registrada</p>
                  <p className="text-foreground/60 text-[11px]">Ticket emitido por el sistema.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => {
              setIsUserOpen((prev) => !prev)
              setIsTenantOpen(false)
              setIsNotificationsOpen(false)
            }}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-primary-foreground shadow-sm"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-foreground/60">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-foreground/40" />
          </button>

          {/* User Menu Dropdown Popover */}
          {isUserOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-foreground/60 truncate">
                  {currentUser.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge size="sm" variant="success" dot>
                    {currentUser.role}
                  </Badge>
                  <span className="text-[10px] text-foreground/50">• {currentUser.position}</span>
                </div>
              </div>

              <div className="py-1 space-y-0.5 text-xs">
                {/* Option 1: Mi Perfil */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserOpen(false)
                    setIsProfileModalOpen(true)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 text-[var(--primary-text)]" />
                  <span>Mi Perfil de Usuario</span>
                </button>

                {/* Option 2: Configuración de Cuenta */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserOpen(false)
                    router.push("/configuracion")
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-foreground/50" />
                  <span>Configuración de Cuenta</span>
                </button>

                {/* Option 3: Cambiar Sucursal / Negocio */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserOpen(false)
                    setIsTenantOpen(true)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Store className="h-4 w-4 text-amber-500" />
                  <span>Cambiar Sucursal / Negocio</span>
                </button>
              </div>

              {/* Option 4: Cerrar Sesión */}
              <div className="pt-1 mt-1 border-t border-border">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSave={(updated) => setCurrentUser(updated)}
      />
    </header>
  )
}
