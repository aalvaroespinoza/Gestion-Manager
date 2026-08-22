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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es obligatorio")
    .email("Ingrese un formato de correo electrónico válido (ej: usuario@empresa.com)"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@gestionmanager.com",
      password: "password123",
      rememberMe: true,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null)
    setAuthSuccess(false)

    try {
      // Simulate authentication request
      await new Promise((resolve) => setTimeout(resolve, 900))

      // Demonstration mock check
      if (data.password.length < 6) {
        setAuthError("Credenciales inválidas. Por favor verifique su correo y contraseña.")
        return
      }

      setAuthSuccess(true)

      // Set cookie for session if needed and redirect to dashboard
      document.cookie = `gestion_session=demo-valid-token; path=/; max-age=86400`

      setTimeout(() => {
        router.push("/dashboard")
      }, 600)
    } catch (err) {
      setAuthError("Ocurrió un error al intentar iniciar sesión. Inténtelo nuevamente.")
    }
  }

  return (
    <Card className="shadow-xl border-slate-200/80 dark:border-slate-800 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-1.5 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Accede a tu cuenta de empresa para gestionar tu inventario y ventas.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Error message alert */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Success feedback alert */}
          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>¡Autenticación exitosa! Redirigiendo al panel de control...</span>
            </div>
          )}

          {/* Email input */}
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="admin@empresa.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            required
            autoComplete="email"
            {...register("email")}
          />

          {/* Password input with toggle */}
          <div className="space-y-1">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              required
              autoComplete="current-password"
              {...register("password")}
            />
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4"
                {...register("rememberMe")}
              />
              <span>Recordarme</span>
            </label>

            <button
              type="button"
              onClick={() => alert("Para restablecer su contraseña, contacte a soporte@gestionmanager.com")}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={isSubmitting}
            disabled={authSuccess}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/20"
          >
            {authSuccess ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-center text-xs text-slate-500">
        <p>
          ¿No tienes una cuenta aún?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Regístrate aquí</span>
          </Link>
        </p>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Acceso cifrado de extremo a extremo</span>
        </div>
      </CardFooter>
    </Card>
  )
}
