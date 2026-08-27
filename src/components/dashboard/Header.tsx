"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UserProfileModal, UserProfileData } from "./UserProfileModal"
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
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  ExternalLink,
  Briefcase,
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

  // Current logged in user profile state
  const [currentUser, setCurrentUser] = useState<UserProfileData>({
    name: "Álvaro Espinoza",
    email: "admin@gestionmanager.com",
    phone: "+56 9 8765 4321",
    position: "Gerente General",
    role: "Superadmin",
  })

  const tenantRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

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

  const handleLogout = () => {
    // Clear session cookie and redirect to login
    document.cookie = "gestion_session=; path=/; max-age=0"
    setIsUserOpen(false)
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-md transition-colors">
      {/* Left Area: Mobile Trigger & Tenant/Branch Selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
          className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Store className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="truncate max-w-[140px] sm:max-w-[200px] text-xs font-semibold">
                {selectedBranch.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                {selectedBranch.code} • {selectedBranch.role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Tenant Dropdown Popover */}
          {isTenantOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Seleccionar Sucursal / Tenant
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cambia de espacio de trabajo activo
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
                        "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        isCurrent
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-semibold">{branch.name}</p>
                          <p className="text-[10px] text-slate-500">{branch.code}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsTenantOpen(false)
                    router.push("/configuracion")
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-medium transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Gestionar Sucursales en Configuración</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Search, Notifications & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Shortcut */}
        <div className="hidden md:flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
          <Search className="h-3.5 w-3.5 mr-2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            aria-label="Buscar en el sistema"
            className="bg-transparent focus:outline-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 w-36 lg:w-48"
          />
          <kbd className="hidden lg:inline-block rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 ml-2">
            ⌘K
          </kbd>
        </div>

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
            className="relative rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Notificaciones
                </span>
                <Badge size="sm" variant="default">3 nuevas</Badge>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">Alerta de Stock Crítico</p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">4 productos requieren re-abastecimiento.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Venta POS Registrada</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Ticket #TK-2026-0004521 emitido por $229.670.</p>
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
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* User Menu Dropdown Popover */}
          {isUserOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge size="sm" variant="success" dot>
                    {currentUser.role}
                  </Badge>
                  <span className="text-[10px] text-slate-400">• {currentUser.position}</span>
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
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4 text-blue-500" />
                  <span>Mi Perfil de Usuario</span>
                </button>

                {/* Option 2: Configuración de Cuenta */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserOpen(false)
                    router.push("/configuracion")
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Configuración de Cuenta</span>
                </button>

                {/* Option 3: Cambiar Sucursal / Negocio */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserOpen(false)
                    setIsTenantOpen(true)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Store className="h-4 w-4 text-amber-500" />
                  <span>Cambiar Sucursal / Negocio</span>
                </button>
              </div>

              {/* Option 4: Cerrar Sesión */}
              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors"
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
