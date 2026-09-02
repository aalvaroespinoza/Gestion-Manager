"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { ToastContainer, ToastMessage } from "@/components/ui/toast"
import {
  updateUserProfile,
  updateTenantSettings,
  createBranch,
  deleteBranch,
  inviteUser,
  deleteUser,
  saveCustomFields,
  BranchItem,
} from "@/modules/settings/actions"
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
  Store,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Briefcase,
  Phone,
} from "lucide-react"

type ConfigTab = "PROFILE" | "GENERAL" | "BRANCHES" | "USERS" | "FIELDS" | "NOTIFICATIONS"

export interface UserProfileState {
  id: string
  name: string
  email: string
  phone: string
  position: string
  role: string
}

export interface CompanySettingsState {
  companyName: string
  fantasyName: string
  taxId: string
  address: string
  phone: string
  email: string
  economicActivity: string
  currency: string
  defaultTaxRate: number
  mainIndustry: string
  notifications?: any
}

export interface TeamUserState {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastLogin?: string
}

export interface CategoryWithFields {
  id: string
  name: string
  description?: string
  dynamicFieldsConfig: DynamicFormFieldConfig[]
}

interface ConfiguracionViewProps {
  initialUserProfile: UserProfileState
  initialCompanySettings: CompanySettingsState
  initialBranches: BranchItem[]
  initialTeamUsers: TeamUserState[]
  initialCategories: CategoryWithFields[]
}

export function ConfiguracionView({
  initialUserProfile,
  initialCompanySettings,
  initialBranches,
  initialTeamUsers,
  initialCategories,
}: ConfiguracionViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ConfigTab>("PROFILE")

  // 1. Profile State
  const [userProfile, setUserProfile] = useState<UserProfileState>(initialUserProfile)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // 2. Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettingsState>(initialCompanySettings)
  const [isSavingCompany, setIsSavingCompany] = useState(false)

  // 3. Branches State
  const [branches, setBranches] = useState<BranchItem[]>(initialBranches)
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false)
  const [branchName, setBranchName] = useState("")
  const [branchCode, setBranchCode] = useState("")
  const [branchRole, setBranchRole] = useState("Sucursal")
  const [branchAddress, setBranchAddress] = useState("")
  const [deletingBranch, setDeletingBranch] = useState<BranchItem | null>(null)
  const [isSavingBranch, setIsSavingBranch] = useState(false)

  // 4. Team Users State
  const [teamUsers, setTeamUsers] = useState<TeamUserState[]>(initialTeamUsers)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "SELLER" | "MANAGER">("SELLER")
  const [invitePassword, setInvitePassword] = useState("")
  const [deletingUser, setDeletingUser] = useState<TeamUserState | null>(null)
  const [isInvitingUser, setIsInvitingUser] = useState(false)

  // 5. Dynamic Fields Builder State
  const [categoriesList, setCategoriesList] = useState<CategoryWithFields[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategories[0]?.id || ""
  )
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<DynamicFormFieldConfig["type"]>("text")
  const [isSavingField, setIsSavingField] = useState(false)

  // 6. Notifications & POS
  const [notificationsSettings, setNotificationsSettings] = useState(
    initialCompanySettings.notifications || {
      emailCriticalStock: true,
      emailDailyReport: true,
      autoPrintReceipt: true,
      assignedPosTerminal: "Terminal Caja #01 - Casa Matriz",
      defaultReceiptType: "TICKET",
    }
  )
  const [isSavingNotifs, setIsSavingNotifs] = useState(false)

  // Toasts Stack
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage["type"] = "success") => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        title,
        description,
        type,
      }
      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Sync props on revalidation
  useEffect(() => {
    setUserProfile(initialUserProfile)
    setCompanySettings(initialCompanySettings)
    setBranches(initialBranches)
    setTeamUsers(initialTeamUsers)
    setCategoriesList(initialCategories)
    if (!selectedCategoryId && initialCategories.length > 0) {
      setSelectedCategoryId(initialCategories[0].id)
    }
  }, [initialUserProfile, initialCompanySettings, initialBranches, initialTeamUsers, initialCategories, selectedCategoryId])

  // --- Handlers ---

  // 1. Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword.length < 6) {
      addToast("Contraseña Inválida", "La nueva contraseña debe tener al menos 6 caracteres.", "destructive")
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      addToast("Error de Contraseña", "Las contraseñas no coinciden.", "destructive")
      return
    }

    try {
      setIsSavingProfile(true)
      const res = await updateUserProfile({
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        position: userProfile.position,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      })

      if (!res.success) {
        addToast("Error al Actualizar Perfil", res.error || "No se pudieron guardar los cambios.", "destructive")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      addToast("Perfil Actualizado", "Los datos de tu cuenta fueron guardados exitosamente.", "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsSavingProfile(false)
    }
  }

  // 2. Save Company
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingCompany(true)
      const res = await updateTenantSettings({
        companyName: companySettings.companyName,
        fantasyName: companySettings.fantasyName,
        taxId: companySettings.taxId,
        address: companySettings.address,
        economicActivity: companySettings.economicActivity,
        currency: companySettings.currency,
        defaultTaxRate: companySettings.defaultTaxRate,
        mainIndustry: companySettings.mainIndustry,
      })

      if (!res.success) {
        addToast("Error", res.error || "No se pudo guardar la configuración de empresa.", "destructive")
        return
      }

      addToast("Empresa Guardada", "Los datos comerciales de la empresa fueron actualizados en la base de datos.", "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsSavingCompany(false)
    }
  }

  // 3. Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchName || !branchCode) return

    try {
      setIsSavingBranch(true)
      const res = await createBranch({
        name: branchName,
        code: branchCode,
        role: branchRole,
        address: branchAddress,
      })

      if (!res.success || !res.data) {
        addToast("Error al Crear Sucursal", res.error || "No se pudo crear la sucursal.", "destructive")
        return
      }

      setBranches((prev) => [...prev, res.data as BranchItem])
      setIsNewBranchModalOpen(false)
      setBranchName("")
      setBranchCode("")
      setBranchAddress("")
      addToast("Sucursal Creada", `Se agregó la sucursal "${branchName}" al tenant.`, "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsSavingBranch(false)
    }
  }

  // Delete Branch
  const handleDeleteBranch = async () => {
    if (!deletingBranch) return
    try {
      const res = await deleteBranch(deletingBranch.id)
      if (!res.success) {
        addToast("Error al Eliminar", res.error || "No se pudo eliminar la sucursal.", "destructive")
        return
      }

      setBranches((prev) => prev.filter((b) => b.id !== deletingBranch.id))
      addToast("Sucursal Eliminada", `"${deletingBranch.name}" fue eliminada.`, "destructive")
      setDeletingBranch(null)
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    }
  }

  // 4. Invite / Create User
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName || !inviteEmail) return

    try {
      setIsInvitingUser(true)
      const res = await inviteUser({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        password: invitePassword || undefined,
      })

      if (!res.success) {
        addToast("Error al Registrar Usuario", res.error || "No se pudo registrar al usuario.", "destructive")
        return
      }

      const createdUser: TeamUserState = {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        status: res.data.status,
        lastLogin: "Reciente",
      }

      setTeamUsers((prev) => [...prev, createdUser])
      setIsInviteModalOpen(false)
      setInviteName("")
      setInviteEmail("")
      setInvitePassword("")
      addToast("Usuario Registrado", `"${inviteName}" fue agregado al equipo en base de datos.`, "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsInvitingUser(false)
    }
  }

  // Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return
    try {
      const res = await deleteUser(deletingUser.id)
      if (!res.success) {
        addToast("Error al Eliminar Usuario", res.error || "No se pudo eliminar el usuario.", "destructive")
        return
      }

      setTeamUsers((prev) => prev.filter((u) => u.id !== deletingUser.id))
      addToast("Usuario Removido", `"${deletingUser.name}" fue removido de la organización.`, "destructive")
      setDeletingUser(null)
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    }
  }

  // 5. Add Custom Dynamic Field
  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldLabel || !newFieldName || !selectedCategoryId) return

    const newField: DynamicFormFieldConfig = {
      name: newFieldName.toLowerCase().replace(/\s+/g, "_"),
      label: newFieldLabel,
      type: newFieldType,
      required: false,
      placeholder: `Ingrese ${newFieldLabel.toLowerCase()}`,
    }

    const targetCategory = categoriesList.find((c) => c.id === selectedCategoryId)
    if (!targetCategory) return

    const updatedFields = [...targetCategory.dynamicFieldsConfig, newField]

    try {
      setIsSavingField(true)
      const res = await saveCustomFields(selectedCategoryId, updatedFields)
      if (!res.success) {
        addToast("Error al Guardar Atributo", res.error || "No se pudo guardar el campo.", "destructive")
        return
      }

      setCategoriesList((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? { ...cat, dynamicFieldsConfig: updatedFields }
            : cat
        )
      )

      setIsNewFieldModalOpen(false)
      setNewFieldName("")
      setNewFieldLabel("")
      addToast("Atributo Guardado", `Campo "${newFieldLabel}" guardado en la categoría "${targetCategory.name}".`, "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsSavingField(false)
    }
  }

  // Delete Custom Dynamic Field
  const handleDeleteCustomField = async (fieldName: string) => {
    const targetCategory = categoriesList.find((c) => c.id === selectedCategoryId)
    if (!targetCategory) return

    const updatedFields = targetCategory.dynamicFieldsConfig.filter((f) => f.name !== fieldName)

    try {
      const res = await saveCustomFields(selectedCategoryId, updatedFields)
      if (!res.success) {
        addToast("Error al Eliminar", res.error || "No se pudo eliminar el campo.", "destructive")
        return
      }

      setCategoriesList((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? { ...cat, dynamicFieldsConfig: updatedFields }
            : cat
        )
      )

      addToast("Atributo Eliminado", "Campo dinámico eliminado de la base de datos.", "info")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    }
  }

  // 6. Save Notifications & POS
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingNotifs(true)
      const res = await updateTenantSettings({
        notifications: notificationsSettings,
      })

      if (!res.success) {
        addToast("Error", res.error || "No se pudieron guardar las notificaciones.", "destructive")
        return
      }

      addToast("Preferencias Guardadas", "Ajustes de alertas y POS actualizados con éxito.", "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsSavingNotifs(false)
    }
  }

  const currentCategoryObj = categoriesList.find((c) => c.id === selectedCategoryId)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-8 w-8 text-primary" />
          Configuración & Parámetros
        </h1>
        <p className="text-sm text-zinc-400 mt-1 font-medium">
          Ajustes de cuenta de usuario, datos de empresa, sucursales, colaboradores y campos dinámicos persistidos en base de datos.
        </p>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "PROFILE"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Mi Perfil de Usuario</span>
        </button>

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
          onClick={() => setActiveTab("BRANCHES")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "BRANCHES"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Sucursales</span>
          <Badge size="sm" variant="secondary">
            {branches.length}
          </Badge>
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
          <span>Notificaciones & POS</span>
        </button>
      </div>

      {/* Tab 1: Mi Perfil */}
      {activeTab === "PROFILE" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Datos Personales & Credenciales de Sesión</span>
              </CardTitle>
              <CardDescription>
                Información de contacto personal y cambio seguro de contraseña de acceso.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Avatar Header */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shadow-md">
                  {userProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">
                      {userProfile.name}
                    </h4>
                    <Badge variant="success" size="sm" dot>
                      {userProfile.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                    {userProfile.email} • {userProfile.position}
                  </p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />

                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />

                <Input
                  label="Cargo o Puesto en la Empresa"
                  value={userProfile.position}
                  onChange={(e) => setUserProfile({ ...userProfile, position: e.target.value })}
                  leftIcon={<Briefcase className="h-4 w-4" />}
                />

                <Input
                  label="Teléfono Móvil"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  leftIcon={<Phone className="h-4 w-4" />}
                />
              </div>

              {/* Password Change */}
              <div className="space-y-4 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Actualización de Contraseña (Opcional)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs text-primary hover:opacity-80 inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPasswords ? "Ocultar" : "Mostrar"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Contraseña Actual"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <Input
                    label="Nueva Contraseña"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <Input
                    label="Confirmar Nueva"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-zinc-800 pt-4">
              <Button
                type="submit"
                variant="default"
                isLoading={isSavingProfile}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Guardar Cambios de Perfil
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Tab 2: General / Empresa */}
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
              <Button
                type="submit"
                variant="default"
                isLoading={isSavingCompany}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Guardar Cambios de Empresa
              </Button>
            </CardFooter>
          </Card>

          {/* Theme Palette */}
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

      {/* Tab 3: Sucursales */}
      {activeTab === "BRANCHES" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <span>Sucursales & Puntos de Venta Físicos</span>
                </CardTitle>
                <CardDescription>
                  Administra las sucursales y bodegas asociadas a tu organización.
                </CardDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsNewBranchModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
                className="cursor-pointer"
              >
                Nueva Sucursal
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Código</TableHead>
                    <TableHead className="font-bold">Nombre de Sucursal</TableHead>
                    <TableHead className="font-bold">Tipo / Rol</TableHead>
                    <TableHead className="font-bold">Dirección</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id} className="hover:bg-zinc-800/60 transition-colors">
                      <TableCell className="font-mono text-xs font-medium text-primary">
                        {branch.code}
                      </TableCell>
                      <TableCell className="font-bold text-white text-sm">
                        {branch.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={branch.role === "Principal" ? "success" : "info"} size="sm">
                          {branch.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">
                        {branch.address || <span className="text-zinc-500 italic">Sin dirección asignada</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {branches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDeletingBranch(branch)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar Sucursal"
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

      {/* Tab 4: Usuarios y Permisos */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Miembros del Equipo</CardTitle>
                <CardDescription>
                  Administra los accesos y roles asignados a los operadores de tu empresa en PostgreSQL.
                </CardDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
                className="cursor-pointer"
              >
                Nuevo Usuario
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
                    <TableHead className="font-bold">Alta / Registro</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-zinc-800/60 transition-colors">
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
                            user.role === "ADMIN"
                              ? "default"
                              : user.role === "MANAGER"
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
                          variant={user.status === "ACTIVE" ? "success" : "destructive"}
                          size="sm"
                          dot
                        >
                          {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-zinc-400">{user.lastLogin}</TableCell>

                      <TableCell className="text-right">
                        {user.id !== userProfile.id && (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
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

      {/* Tab 5: Campos Dinámicos (Rubro) */}
      {activeTab === "FIELDS" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Esquema de Atributos Dinámicos por Categoría</span>
                </CardTitle>
                <CardDescription>
                  Personaliza los campos técnicos autogenerados para cada categoría en la base de datos.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewFieldModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
                className="cursor-pointer"
                disabled={categoriesList.length === 0}
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
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedCategoryId === cat.id
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
                    className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {field.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info" size="sm">
                          {field.type}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomField(field.name)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Eliminar Campo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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

      {/* Tab 6: Notificaciones & POS */}
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
                  Configura los avisos automáticos y notificaciones por correo.
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
            <Button
              type="submit"
              variant="default"
              isLoading={isSavingNotifs}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Guardar Preferencias de Notificaciones
            </Button>
          </div>
        </form>
      )}

      {/* Modal Nueva Sucursal */}
      <Modal
        isOpen={isNewBranchModalOpen}
        onClose={() => setIsNewBranchModalOpen(false)}
        size="default"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-white font-bold">Crear Nueva Sucursal</span>
          </div>
        }
        description="Agrega un nuevo punto de venta o bodega física al tenant."
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 pt-2">
          <Input
            label="Nombre de la Sucursal"
            placeholder="Ej: Sucursal Centro"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />

          <Input
            label="Código Identificador"
            placeholder="Ej: SUC-CENTRO-01"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            required
          />

          <Select
            label="Tipo de Sucursal"
            value={branchRole}
            onChange={(e) => setBranchRole(e.target.value)}
            options={[
              { label: "Sucursal Comercial", value: "Sucursal" },
              { label: "Bodega de Almacenamiento", value: "Bodega" },
              { label: "Canal Digital / E-commerce", value: "Virtual" },
            ]}
          />

          <Input
            label="Dirección Física"
            placeholder="Ej: Calle Comercio 123"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsNewBranchModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" isLoading={isSavingBranch} leftIcon={<Plus className="h-4 w-4" />}>
              Guardar Sucursal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Eliminar Sucursal */}
      <Modal
        isOpen={Boolean(deletingBranch)}
        onClose={() => setDeletingBranch(null)}
        size="sm"
        title={
          <div className="flex items-center gap-2.5 text-red-400 font-bold">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span>Eliminar Sucursal</span>
          </div>
        }
        description="¿Confirmas que deseas eliminar esta sucursal del sistema?"
      >
        {deletingBranch && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-zinc-300">
              Se eliminará <strong className="text-white">{deletingBranch.name}</strong> ({deletingBranch.code}).
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <Button type="button" variant="secondary" onClick={() => setDeletingBranch(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteBranch} leftIcon={<Trash2 className="h-4 w-4" />}>
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Invitar / Crear Usuario */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        size="default"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-white font-bold">Registrar Usuario en el Tenant</span>
          </div>
        }
        description="Crea un acceso con rol para un colaborador en la base de datos de tu organización."
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
              { label: "Vendedor (Punto de Venta POS)", value: "SELLER" },
              { label: "Administrador (Gestión Completa)", value: "ADMIN" },
              { label: "Gerente / Supervisor (MANAGER)", value: "MANAGER" },
            ]}
          />

          <Input
            label="Contraseña Provisional (Opcional)"
            type="password"
            placeholder="Por defecto: Password123!"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" isLoading={isInvitingUser} leftIcon={<Mail className="h-4 w-4" />}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Eliminar Usuario */}
      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        size="sm"
        title={
          <div className="flex items-center gap-2.5 text-red-400 font-bold">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span>Eliminar Usuario</span>
          </div>
        }
        description="Esta acción removerá el acceso del colaborador a la organización."
      >
        {deletingUser && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-zinc-300">
              ¿Estás seguro de que deseas dar de baja a <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})?
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <Button type="button" variant="secondary" onClick={() => setDeletingUser(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteUser} leftIcon={<Trash2 className="h-4 w-4" />}>
                Eliminar Usuario
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Campo Dinámico */}
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
        description="Define un nuevo campo personalizado que se guardará en PostgreSQL para esta categoría."
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
            <Button type="submit" variant="default" isLoading={isSavingField} leftIcon={<Plus className="h-4 w-4" />}>
              Crear Campo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
