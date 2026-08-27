"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "destructive" | "warning" | "info"

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, toast.duration || 4000)

    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    destructive: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  }

  const borderStyles = {
    success: "border-emerald-500/30 bg-white dark:bg-slate-900 shadow-emerald-500/10",
    destructive: "border-red-500/30 bg-white dark:bg-slate-900 shadow-red-500/10",
    warning: "border-amber-500/30 bg-white dark:bg-slate-900 shadow-amber-500/10",
    info: "border-blue-500/30 bg-white dark:bg-slate-900 shadow-blue-500/10",
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 w-full max-w-sm pointer-events-auto",
        borderStyles[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 space-y-0.5">
        <h5 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
          {toast.title}
        </h5>
        {toast.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 -mr-1 -mt-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
