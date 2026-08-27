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
  TableEmpty,
} from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { mockCategories } from "@/mocks/inventoryData"
import {
  Settings,
  Building2,
  Users,
  Layers,
  Bell,
  Save,
  Plus,
  Shield,
  CheckCircle2,
  Mail,
  UserPlus,
  Trash2,
  Edit2,
  Sparkles,
  Receipt,
  Printer,
  Sliders,
  DollarSign,
  Briefcase,
  Store,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react"

type ConfigTab = "GENERAL" | "USERS" | "FIELDS" | "NOTIFICATIONS"

interface TeamUser {
  id: string
  name: string
  email: string
  role: "SUPERADMIN" | "ADMIN" | "VENDEDOR" | "BODEGUERO"
  status: "ACTIVO" | "INVITADO" | "INACTIVO"
  lastLogin: string
}

const initialTeamUsers: TeamUser[] = [
  {
    id: "usr-1",
    name: "Álvaro Espinoza",
    email: "admin@gestionmanager.com",
    role: "SUPERADMIN",
    status: "ACTIVO",
    lastLogin: "Hace 5 minutos",
  },
  {
    id: "usr-2",
    name: "Carolina Morales",
    email: "carolina.ventas@empresa.com",
    role: "VENDEDOR",
    status: "ACTIVO",
    lastLogin: "Hoy 14:30",
  },
  {
    id: "usr-3",
    name: "Rodrigo Fuentes",
    email: "rodrigo.bodega@empresa.com",
    role: "BODEGUERO",
    status: "ACTIVO",
    lastLogin: "Ayer 18:20",
  },
  {
    id: "usr-4",
    name: "María Eugenia Tapia",
    email: "contabilidad@empresa.com",
    role: "ADMIN",
    status: "INVITADO",
    lastLogin: "Pendiente",
  },
]

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("GENERAL")

  // Tab 1: General & Company Form State
  const [companySettings, setCompanySettings] = useState({
    companyName: "Gestión Manager SpA",
    fantasyName: "Gestión Manager Almacén Central",
    taxId: "77.123.456-0",
    economicActivity: "Venta al por mayor y menor de materiales y artículos de ferretería",
    address: "Av. Industrial 4500, Bodega 12, Santiago",
    currency: "CLP",
    defaultTaxRate: 19,
    mainIndustry: "construccion",
  })

  // Tab 2: Users and Permissions
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(initialTeamUsers)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "VENDEDOR" | "BODEGUERO">("VENDEDOR")

  // Tab 3: Custom Category Fields
  const [categoriesList, setCategoriesList] = useState(mockCategories)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState(mockCategories[0].id)
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "select" | "boolean">("text")

  // Tab 4: Notifications & Invoicing
  const [notificationsSettings, setNotificationsSettings] = useState({
    emailCriticalStock: true,
    emailDailyReport: true,
    cashShiftAlerts: true,
    defaultReceiptType: "BOLETA",
    autoPrintReceipt: true,
    allowNegativeStock: false,
    assignedPosTerminal: "Caja Mostrador 01",
  })

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (text: string) => {
    setToastMessage(text)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle Save Company
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("Datos de la empresa y parámetros fiscales guardados.")
  }

  // Handle Save Notifications
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("Preferencias de facturación y notificaciones actualizadas.")
  }

  // Handle Invite User
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName || !inviteEmail) return

    const newUser: TeamUser = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "INVITADO",
      lastLogin: "Pendiente",
    }

    setTeamUsers((prev) => [...prev, newUser])
    setIsInviteModalOpen(false)
    setInviteName("")
    setInviteEmail("")
    showToast(`Invitación enviada exitosamente a ${inviteEmail}.`)
  }

  // Handle Delete User
  const handleDeleteUser = (id: string) => {
    setTeamUsers((prev) => prev.filter((u) => u.id !== id))
    showToast("Usuario removido del equipo.")
  }

  // Handle Add Custom Field to Category
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName || !newFieldLabel) return

    setCategoriesList((prev) =>
      prev.map((cat) => {
        if (cat.id === selectedCategoryTab) {
          return {
            ...cat,
            dynamicFieldsConfig: [
              ...cat.dynamicFieldsConfig,
              {
                name: newFieldName.toLowerCase().replace(/\s+/g, "_"),
                label: newFieldLabel,
                type: newFieldType,
                required: false,
              },
            ],
          }
        }
        return cat
      })
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl bg-emerald-600 text-white border border-emerald-500 font-medium text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          Configuración & Parámetros
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ajustes del tenant, administración de equipo, esquemas dinámicos por rubro y facturación.
        </p>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("GENERAL")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "GENERAL"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>General / Empresa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "USERS"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "FIELDS"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Campos Dinámicos (Rubro)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === "NOTIFICATIONS"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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

            <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button type="submit" variant="default" leftIcon={<Save className="h-4 w-4" />}>
                Guardar Cambios de Empresa
              </Button>
            </CardFooter>
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
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol Asignado</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 font-mono">
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

                      <TableCell className="text-xs text-slate-500">{user.lastLogin}</TableCell>

                      <TableCell className="text-right">
                        {user.role !== "SUPERADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="h-8 px-2 text-slate-400 hover:text-red-600"
                            title="Remover Usuario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
                  <Sparkles className="h-5 w-5 text-blue-500" />
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      selectedCategoryTab === cat.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {field.label}
                      </span>
                      <Badge variant="info" size="sm">
                        {field.type}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">
                      Clave JSON: <code>{field.name}</code>
                    </p>

                    {field.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {field.description}
                      </p>
                    )}

                    {field.options && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {field.options.map((opt, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300"
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
                  <Bell className="h-5 w-5 text-blue-500" />
                  <span>Alertas del Sistema</span>
                </CardTitle>
                <CardDescription>
                  Configura los avisos automáticos y notificaciones push / email.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailCriticalStock}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailCriticalStock: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-slate-300 text-blue-600 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Alertas de Stock Crítico
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enviar email automático cuando un producto alcance su umbral mínimo de seguridad.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailDailyReport}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailDailyReport: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-slate-300 text-blue-600 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Resumen Diario de Cierre de Caja
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
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
                  <Receipt className="h-5 w-5 text-emerald-500" />
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

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.autoPrintReceipt}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        autoPrintReceipt: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-slate-300 text-blue-600 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Impresión Inmediata de Ticket
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
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
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span>Invitar Usuario al Equipo</span>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
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
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span>Agregar Atributo a {currentCategoryObj?.name}</span>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsNewFieldModalOpen(false)}>
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
