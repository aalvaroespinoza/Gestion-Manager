"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react"

const registerSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
    industry: z
      .string()
      .min(1, "Debe seleccionar el rubro principal de su empresa"),
    adminName: z
      .string()
      .min(2, "El nombre del administrador debe tener al menos 2 caracteres"),
    email: z
      .string()
      .min(1, "El correo electrónico es obligatorio")
      .email("Ingrese un formato de correo electrónico válido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Debe confirmar la contraseña"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debe aceptar los términos y condiciones para continuar",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas ingresadas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const industryOptions = [
  { label: "Materiales de Construcción & Ferretería Industrial", value: "construccion" },
  { label: "Retail, Calzado & Indumentaria", value: "retail" },
  { label: "Ferretería General & Herramientas", value: "ferreteria" },
  { label: "Servicios Técnicos & Mantenimiento", value: "servicios" },
  { label: "Distribución Mayorista & Otro Rubro", value: "otro" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      industry: "construccion",
      adminName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setRegisterError(null)
    setRegisterSuccess(false)

    try {
      // Simulate tenant creation and account provisioning
      await new Promise((resolve) => setTimeout(resolve, 1100))

      setRegisterSuccess(true)

      // Set cookie for session if needed and redirect to dashboard
      document.cookie = `gestion_session=demo-valid-token; path=/; max-age=86400`

      setTimeout(() => {
        router.push("/dashboard")
      }, 700)
    } catch (err) {
      setRegisterError("Ocurrió un error al intentar crear la cuenta de empresa.")
    }
  }

  return (
    <Card className="shadow-xl border-slate-200/80 dark:border-slate-800 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-1.5 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Registrar Nueva Empresa
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Crea tu espacio de trabajo Multi-Tenant y comienza a controlar tu negocio hoy.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          {/* Error feedback alert */}
          {registerError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{registerError}</span>
            </div>
          )}

          {/* Success feedback alert */}
          {registerSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>¡Empresa configurada con éxito! Preparando tu entorno de trabajo...</span>
            </div>
          )}

          {/* Company Name */}
          <Input
            label="Nombre de la Empresa / Negocio"
            placeholder="Ej: Distribuidora Central SpA"
            leftIcon={<Building2 className="h-4 w-4" />}
            error={errors.companyName?.message}
            required
            {...register("companyName")}
          />

          {/* Industry Selection */}
          <Select
            label="Rubro Principal de la Empresa"
            options={industryOptions}
            error={errors.industry?.message}
            required
            {...register("industry")}
          />

          {/* Administrator Name */}
          <Input
            label="Nombre Completo del Administrador"
            placeholder="Ej: Álvaro Espinoza"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.adminName?.message}
            required
            autoComplete="name"
            {...register("adminName")}
          />

          {/* Email */}
          <Input
            label="Correo Electrónico Corporativo"
            type="email"
            placeholder="admin@tuempresa.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            required
            autoComplete="email"
            {...register("email")}
          />

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none hover:text-slate-700 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              required
              autoComplete="new-password"
              {...register("password")}
            />

            <Input
              label="Confirmar Contraseña"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="focus:outline-none hover:text-slate-700 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.confirmPassword?.message}
              required
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
          </div>

          {/* Accept Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                {...register("acceptTerms")}
              />
              <span>
                He leído y acepto los{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    alert("Términos de Servicio: Plataforma de demostración SaaS Gestión Manager.")
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Términos y Condiciones
                </button>{" "}
                del servicio.
              </span>
            </label>
            {errors.acceptTerms?.message && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={isSubmitting}
            disabled={registerSuccess}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/20"
          >
            {registerSuccess ? "Configurando Empresa..." : "Crear Cuenta de Empresa"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-center text-xs text-slate-500">
        <p>
          ¿Ya tienes una cuenta registrada?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Espacio de datos aislado (Multi-Tenant)</span>
        </div>
      </CardFooter>
    </Card>
  )
}
