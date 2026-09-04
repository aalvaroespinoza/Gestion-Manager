"use client"

import React, { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  KeyRound,
} from "lucide-react"

import { updateUserProfile } from "@/modules/settings/actions"

export interface UserProfileData {
  name: string
  email: string
  phone: string
  position: string
  role: string
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: UserProfileData
  onSave?: (data: UserProfileData) => void
}

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser = {
    name: "Álvaro Espinoza",
    email: "admin@gestionmanager.com",
    phone: "+56 9 8765 4321",
    position: "Gerente de Operaciones",
    role: "Superadmin",
  },
  onSave,
}: UserProfileModalProps) {
  const [formData, setFormData] = useState<UserProfileData>(currentUser)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync state if currentUser changes
  React.useEffect(() => {
    setFormData(currentUser)
  }, [currentUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (newPassword && newPassword.length < 6) {
      setErrorMessage("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage("Las nuevas contraseñas no coinciden.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await updateUserProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      })

      if (!res.success) {
        setErrorMessage(res.error || "No fue posible guardar los cambios de perfil.")
        return
      }

      if (onSave) {
        onSave(formData)
      }

      setSuccessMessage("¡Perfil actualizado con éxito en la base de datos!")
      setTimeout(() => {
        setSuccessMessage(null)
        onClose()
      }, 1200)
    } catch {
      setErrorMessage("Ocurrió un error al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
            <User className="h-5 w-5" />
          </div>
          <span className="text-foreground font-bold">Mi Perfil de Usuario</span>
        </div>
      }
      description="Gestiona tu información personal, datos de contacto y credenciales de acceso."
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* User Avatar Card Header */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shadow-md">
            {formData.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-sm">
                {formData.name}
              </h4>
              <Badge variant="success" size="sm" dot>
                {formData.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {formData.email} • {formData.position}
            </p>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Información Personal & Contacto
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Cargo o Puesto"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              leftIcon={<Briefcase className="h-4 w-4" />}
              required
            />

            <Input
              label="Correo Electrónico"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <Input
              label="Teléfono / Móvil"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Change Password Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-primary" />
              Cambio de Contraseña (Opcional)
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

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
