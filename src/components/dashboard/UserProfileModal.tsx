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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600))

      if (onSave) {
        onSave(formData)
      }

      setSuccessMessage("¡Perfil actualizado con éxito!")
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <span>Mi Perfil de Usuario</span>
        </div>
      }
      description="Gestiona tu información personal, datos de contacto y credenciales de acceso."
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* User Avatar Card Header */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-blue-500/20">
            {formData.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {formData.name}
              </h4>
              <Badge variant="success" size="sm" dot>
                {formData.role}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formData.email} • {formData.position}
            </p>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
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
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-amber-500" />
              Cambio de Contraseña (Opcional)
            </h4>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
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
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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
