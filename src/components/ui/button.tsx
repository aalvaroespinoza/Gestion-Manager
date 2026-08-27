import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "success" | "accent"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-black/20 border border-primary/20 active:scale-[0.99] focus-visible:ring-primary",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 active:scale-[0.99] focus-visible:ring-zinc-600",
  accent:
    "bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 active:scale-[0.99] focus-visible:ring-primary/50 font-semibold",
  destructive:
    "bg-red-600 hover:bg-red-500 text-white font-semibold shadow-md shadow-red-950/40 border border-red-500/20 active:scale-[0.99] focus-visible:ring-red-500",
  outline:
    "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white active:bg-zinc-800/80 focus-visible:ring-zinc-600",
  ghost:
    "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-800/80 focus-visible:ring-zinc-600",
  link:
    "bg-transparent text-primary hover:underline p-0 h-auto shadow-none focus-visible:ring-primary",
  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40 border border-emerald-500/20 active:scale-[0.99] focus-visible:ring-emerald-500",
}

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 text-sm rounded-xl",
  sm: "h-8 px-3 text-xs rounded-lg",
  lg: "h-11 px-6 text-base rounded-xl",
  icon: "h-9 w-9 p-0 justify-center rounded-xl",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = "Button"
