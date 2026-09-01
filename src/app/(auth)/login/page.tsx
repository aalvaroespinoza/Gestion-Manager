"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginAction } from "@/modules/auth/actions"
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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

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
      email: "admin@corralon.com",
      password: "admin123",
      rememberMe: true,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null)
    setAuthSuccess(false)

    try {
      const result = await loginAction({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      })

      if (!result.success) {
        setAuthError(result.error || "Credenciales inválidas. Verifique su correo y contraseña.")
        return
      }

      setAuthSuccess(true)
      const targetUrl = result.redirectUrl || callbackUrl || "/dashboard"
      window.location.href = targetUrl
    } catch {
      setAuthError("Ocurrió un error al intentar iniciar sesión. Inténtelo nuevamente.")
    }
  }

  return (
    <Card className="shadow-2xl border-zinc-800 bg-[#18181b]/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-1.5 text-center pb-4">
        <CardTitle className="text-2xl font-black tracking-tight text-white">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Accede a tu cuenta de empresa para gestionar tu inventario y ventas.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Error message alert */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 animate-in fade-in font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Success feedback alert */}
          {authSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>¡Autenticación exitosa! Ingresando al sistema...</span>
            </div>
          )}

          {/* Email input */}
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="usuario@empresa.com"
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
                  className="focus:outline-none hover:text-white transition-colors cursor-pointer"
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
            <label className="flex items-center gap-2 text-zinc-400 select-none cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary h-4 w-4"
                {...register("rememberMe")}
              />
              <span>Recordarme</span>
            </label>

            <button
              type="button"
              onClick={() => alert("Para restablecer su contraseña, contacte al administrador de su empresa o soporte@gestionmanager.com")}
              className="text-primary hover:underline font-medium"
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
            className="w-full mt-2 font-bold shadow-md"
          >
            {authSuccess ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center border-t border-zinc-800 pt-4 space-y-2 text-center text-xs text-zinc-400">
        <p>
          ¿No tienes una cuenta de empresa?{" "}
          <Link
            href="/register"
            className="font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Regístrate aquí</span>
          </Link>
        </p>

        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Acceso seguro cifrado con JWT & HttpOnly</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Cargando formulario de acceso...</div>}>
      <LoginForm />
    </Suspense>
  )
}
