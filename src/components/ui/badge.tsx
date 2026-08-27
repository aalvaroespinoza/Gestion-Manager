import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  size?: "default" | "sm" | "lg"
  dot?: boolean
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  secondary: "bg-zinc-800 text-zinc-300 border-zinc-700",
  destructive: "bg-red-500/15 text-red-400 border-red-500/30",
  outline: "bg-transparent text-zinc-300 border-zinc-700",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
}

const dotStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-orange-400",
  secondary: "bg-zinc-400",
  destructive: "bg-red-400",
  outline: "bg-zinc-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  info: "bg-sky-400",
}

const sizeStyles: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[11px] font-medium rounded-full",
  default: "px-2.5 py-1 text-xs font-semibold rounded-full",
  lg: "px-3 py-1.5 text-sm font-semibold rounded-full",
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border transition-colors select-none font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotStyles[variant])} />}
      {children}
    </span>
  )
}
