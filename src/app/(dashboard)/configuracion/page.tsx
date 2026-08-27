"use client"

import React, { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { ThemeSelector } from "@/components/theme/ThemeSelector"
import { mockCategories } from "@/mocks/inventoryData"
import { Category } from "@/types/inventory"
import { DynamicFormFieldConfig } from "@/components/dynamic-forms/types"
import {
  Settings,
  Building2,
  Users,
  Layers,
  Bell,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  UserPlus,
  Mail,
  Sparkles,
  Palette,
  Receipt,
} from "lucide-react"

type ConfigTab = "GENERAL" | "USERS" | "FIELDS" | "NOTIFICATIONS"

interface UserMember {
  id: string
  name: string
  email: string
  role: "SUPERADMIN" | "ADMIN" | "VENDEDOR" | "BODEGUERO"
  status: "ACTIVO" | "INVITADO" | "INACTIVO"
  lastLogin: string
}

const initialTeam: UserMember[] = [
  {
    id: "usr-1",
    name: "Álvaro Espinoza",
    email: "alvaro@gestionmanager.com",
    role: "SUPERADMIN",
    status: "ACTIVO",
    lastLogin: "Hoy a las 08:30 (Esta sesión)",
  },
  {
    id: "usr-2",
    name: "Carolina Silva",
    email: "carolina.v@empresa.cl",
    role: "VENDEDOR",
    status: "ACTIVO",
    lastLogin: "Ayer a las 18:40",
  },
  {
    id: "usr-3",
    name: "Rodrigo Morales",
    email: "rmorales@bodega.cl",
    role: "BODEGUERO",
    status: "ACTIVO",
    lastLogin: "21/08/2026 14:15",
  },
  {
    id: "usr-4",
    name: "Patricio Araya",
    email: "paraya@contabilidad.cl",
    role: "ADMIN",
    status: "INVITADO",
    lastLogin: "Pendiente de activación",
  },
]

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("GENERAL")

  // Company Settings Form State
  const [companySettings, setCompanySettings] = useState({
    companyName: "Distribuidora Industrial S.A.",
    fantasyName: "Gestión Manager Materiales",
    taxId: "76.123.456-7",
    address: "Av. Industrial 4520, Quilicura, Región Metropolitana",
    economicActivity: "Venta al por mayor de materiales de construcción y ferretería",
    currency: "CLP",
    defaultTaxRate: 21,
    mainIndustry: "construccion",
  })

  // Users Management State
  const [teamUsers, setTeamUsers] = useState<UserMember[]>(initialTeam)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserMember["role"]>("VENDEDOR")

  // Dynamic Fields Builder State
  const [categoriesList, setCategoriesList] = useState<Category[]>(mockCategories)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(mockCategories[0].id)
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<DynamicFormFieldConfig["type"]>("text")

  // System Notifications Preferences
  const [notificationsSettings, setNotificationsSettings] = useState({
    emailCriticalStock: true,
    emailDailyReport: true,
    autoPrintReceipt: true,
    assignedPosTerminal: "Terminal Caja #01 - Casa Matriz",
    defaultReceiptType: "TICKET",
  })

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("Datos de la empresa actualizados con éxito.")
  }

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("Preferencias de notificaciones y POS guardadas.")
  }

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName || !inviteEmail) return

    const newUser: UserMember = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "INVITADO",
      lastLogin: "Invitación enviada",
    }

    setTeamUsers([...teamUsers, newUser])
    setIsInviteModalOpen(false)
    setInviteName("")
    setInviteEmail("")
    showToast(`Invitación enviada a ${inviteEmail}.`)
  }

  const handleDeleteUser = (id: string) => {
    setTeamUsers(teamUsers.filter((u) => u.id !== id))
    showToast("Usuario removido del equipo.")
  }

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldLabel || !newFieldName) return

    const newField: DynamicFormFieldConfig = {
      name: newFieldName,
      label: newFieldLabel,
      type: newFieldType,
      required: false,
      placeholder: `Ingrese ${newFieldLabel.toLowerCase()}`,
    }

    setCategoriesList((prev) =>
      prev.map((cat) =>
        cat.id === selectedCategoryTab
          ? {
              ...cat,
              dynamicFieldsConfig: [...cat.dynamicFieldsConfig, newField],
            }
          : cat
      )
    )

    setIsNewFieldModalOpen(false)
    setNewFieldName("")
    setNewFieldLabel("")
    showToast(`Campo "${newFieldLabel}" agregado al esquema dinámico.`)
  }

  const currentCategoryObj = categoriesList.find((c) => c.id === selectedCategoryTab)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl bg-primary text-primary-foreground border border-primary/40 font-bold text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-8 w-8 text-primary" />
          Configuración & Parámetros
        </h1>
        <p className="text-sm text-zinc-400 mt-1 font-medium">
          Ajustes del tenant, administración de equipo, esquemas dinámicos por rubro y facturación.
        </p>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("GENERAL")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "GENERAL"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>General / Empresa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "USERS"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Usuarios y Permisos</span>
          <Badge size="sm" variant="secondary">
            {teamUsers.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FIELDS")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "FIELDS"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Campos Dinámicos (Rubro)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "NOTIFICATIONS"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notificaciones & Facturación</span>
        </button>
      </div>

      {/* Tab 1: General / Empresa */}
      {activeTab === "GENERAL" && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de la Empresa & Tenant</CardTitle>
              <CardDescription>
                Información legal y tributaria utilizada en comprobantes, tickets y reportes fiscales.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Razón Social / Nombre Legal"
                  value={companySettings.companyName}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, companyName: e.target.value })
                  }
                  required
                />

                <Input
                  label="Nombre de Fantasía"
                  value={companySettings.fantasyName}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, fantasyName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="RUT / CUIT Empresa"
                  value={companySettings.taxId}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, taxId: e.target.value })
                  }
                  required
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Giro Comercial Principal"
                    value={companySettings.economicActivity}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, economicActivity: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Input
                label="Dirección Casa Matriz"
                value={companySettings.address}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, address: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Moneda de Operación"
                  value={companySettings.currency}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, currency: e.target.value })
                  }
                  options={[
                    { label: "Peso Chileno (CLP)", value: "CLP" },
                    { label: "Peso Argentino (ARS)", value: "ARS" },
                    { label: "Dólar Americano (USD)", value: "USD" },
                  ]}
                />

                <Input
                  label="Tasa de Impuesto IVA (%)"
                  type="number"
                  value={companySettings.defaultTaxRate}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      defaultTaxRate: Number(e.target.value),
                    })
                  }
                  required
                />

                <Select
                  label="Rubro Activo del Negocio"
                  value={companySettings.mainIndustry}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, mainIndustry: e.target.value })
                  }
                  options={[
                    { label: "Materiales de Construcción", value: "construccion" },
                    { label: "Indumentaria & Retail", value: "retail" },
                    { label: "Ferretería General", value: "ferreteria" },
                    { label: "Servicios Técnicos", value: "servicios" },
                  ]}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-zinc-800 pt-4">
              <Button type="submit" variant="default" leftIcon={<Save className="h-4 w-4" />}>
                Guardar Cambios de Empresa
              </Button>
            </CardFooter>
          </Card>

          {/* Theme Palette Customization Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Personalización de Paleta de Colores Global</span>
              </CardTitle>
              <CardDescription>
                Selecciona la estética visual que mejor se adapte a tu preferencia. Los cambios se aplican inmediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector variant="inline" />
            </CardContent>
          </Card>
        </form>
      )}

      {/* Tab 2: Usuarios y Permisos */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Miembros del Equipo</CardTitle>
                <CardDescription>
                  Administra los accesos y roles asignados a los operadores de tu empresa.
                </CardDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Invitar Nuevo Usuario
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Usuario</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Rol Asignado</TableHead>
                    <TableHead className="text-center font-bold">Estado</TableHead>
                    <TableHead className="font-bold">Último Acceso</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="font-bold text-xs text-white">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-zinc-400 font-mono">
                        {user.email}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            user.role === "SUPERADMIN"
                              ? "default"
                              : user.role === "ADMIN"
                              ? "info"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={
                            user.status === "ACTIVO"
                              ? "success"
                              : user.status === "INVITADO"
                              ? "warning"
                              : "destructive"
                          }
                          size="sm"
                          dot
                        >
                          {user.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-zinc-400">{user.lastLogin}</TableCell>

                      <TableCell className="text-right">
                        {user.role !== "SUPERADMIN" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remover Usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Campos Dinámicos (Rubro) */}
      {activeTab === "FIELDS" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Esquema de Atributos Dinámicos por Rubro (JSONB)</span>
                </CardTitle>
                <CardDescription>
                  Personaliza los campos técnicos autogenerados para cada categoría de productos.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewFieldModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Agregar Campo Personalizado
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Category Pills Switcher */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedCategoryTab === cat.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {cat.name} ({cat.dynamicFieldsConfig.length} atributos)
                  </button>
                ))}
              </div>

              {/* Dynamic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentCategoryObj?.dynamicFieldsConfig.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {field.label}
                      </span>
                      <Badge variant="info" size="sm">
                        {field.type}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-mono">
                      Clave JSON: <code className="text-primary font-bold">{field.name}</code>
                    </p>

                    {field.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2">
                        {field.description}
                      </p>
                    )}

                    {field.options && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {field.options.map((opt, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-200 font-medium"
                          >
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Notificaciones & Facturación */}
      {activeTab === "NOTIFICATIONS" && (
        <form onSubmit={handleSaveNotifications} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>Alertas del Sistema</span>
                </CardTitle>
                <CardDescription>
                  Configura los avisos automáticos y notificaciones push / email.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailCriticalStock}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailCriticalStock: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-zinc-700 bg-zinc-800 text-primary accent-primary h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-xs text-white">
                      Alertas de Stock Crítico
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Enviar email automático cuando un producto alcance su umbral mínimo de seguridad.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailDailyReport}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailDailyReport: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-zinc-700 bg-zinc-800 text-primary accent-primary h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-xs text-white">
                      Resumen Diario de Cierre de Caja
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Recibir reporte consolidado de ventas y caja al final de cada jornada.
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* POS & Invoicing Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-400" />
                  <span>Punto de Venta & Emisión</span>
                </CardTitle>
                <CardDescription>
                  Parámetros operativos para el terminal de mostrador (/ventas).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Select
                  label="Tipo de Comprobante por Defecto"
                  value={notificationsSettings.defaultReceiptType}
                  onChange={(e) =>
                    setNotificationsSettings({
                      ...notificationsSettings,
                      defaultReceiptType: e.target.value,
                    })
                  }
                  options={[
                    { label: "Ticket de Venta / Comprobante Térmico", value: "TICKET" },
                    { label: "Boleta Electrónica SII", value: "BOLETA" },
                    { label: "Factura Electrónica A / B", value: "FACTURA" },
                  ]}
                />

                <Input
                  label="Terminal / Punto de Venta Asignado"
                  value={notificationsSettings.assignedPosTerminal}
                  onChange={(e) =>
                    setNotificationsSettings({
                      ...notificationsSettings,
                      assignedPosTerminal: e.target.value,
                    })
                  }
                />

                <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.autoPrintReceipt}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        autoPrintReceipt: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-zinc-700 bg-zinc-800 text-primary accent-primary h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-xs text-white">
                      Impresión Inmediata de Ticket
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Abrir cuadro de diálogo de impresión automáticamente al confirmar una venta en el POS.
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="default" leftIcon={<Save className="h-4 w-4" />}>
              Guardar Preferencias de Notificaciones
            </Button>
          </div>
        </form>
      )}

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        size="default"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-white font-bold">Invitar Usuario al Equipo</span>
          </div>
        }
        description="El usuario recibirá un correo con las credenciales provisionales para ingresar a este Tenant."
      >
        <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
          <Input
            label="Nombre Completo"
            placeholder="Ej: Marcelo Gómez"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            required
          />

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="usuario@empresa.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Rol / Perfil de Acceso"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            options={[
              { label: "Vendedor (Punto de Venta POS)", value: "VENDEDOR" },
              { label: "Bodeguero (Gestión de Stock)", value: "BODEGUERO" },
              { label: "Administrador (Gestión Completa)", value: "ADMIN" },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" leftIcon={<Mail className="h-4 w-4" />}>
              Enviar Invitación
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Custom Field Modal */}
      <Modal
        isOpen={isNewFieldModalOpen}
        onClose={() => setIsNewFieldModalOpen(false)}
        size="default"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-white font-bold">Agregar Atributo a {currentCategoryObj?.name}</span>
          </div>
        }
        description="Define un nuevo campo personalizado que aparecerá en los formularios dinámicos de esta categoría."
      >
        <form onSubmit={handleAddCustomField} className="space-y-4 pt-2">
          <Input
            label="Etiqueta Visible (Label)"
            placeholder="Ej: Certificación ISO"
            value={newFieldLabel}
            onChange={(e) => {
              setNewFieldLabel(e.target.value)
              if (!newFieldName) {
                setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, "_"))
              }
            }}
            required
          />

          <Input
            label="Identificador de Campo (JSON Key)"
            placeholder="Ej: cert_iso"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            required
          />

          <Select
            label="Tipo de Dato"
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value as any)}
            options={[
              { label: "Texto Libre (String)", value: "text" },
              { label: "Numérico (Number)", value: "number" },
              { label: "Selector de Opciones (Select)", value: "select" },
              { label: "Interruptor Booleano (Sí/No)", value: "boolean" },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsNewFieldModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" leftIcon={<Plus className="h-4 w-4" />}>
              Crear Campo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
