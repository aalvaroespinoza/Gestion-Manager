import React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, leftIcon, rightIcon, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-zinc-300 select-none flex items-center justify-between"
          >
            <span>{label}</span>
            {props.required && <span className="text-orange-500 text-xs font-bold ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-xl border border-zinc-700 bg-[#18181b] px-3 py-2 text-sm text-white placeholder:text-zinc-500 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:border-orange-500",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-zinc-900",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = "Input"
