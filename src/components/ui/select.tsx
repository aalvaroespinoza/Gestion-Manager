import React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options = [], placeholder, id, disabled, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-zinc-300 select-none flex items-center justify-between"
          >
            <span>{label}</span>
            {props.required && <span className="text-primary text-xs font-bold ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full appearance-none rounded-xl border border-zinc-700 bg-[#18181b] px-3 py-2 pr-9 text-sm text-white transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-zinc-900",
              error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected={!props.value && !props.defaultValue} className="bg-[#18181b] text-zinc-400">
                {placeholder}
              </option>
            )}
            {options.length > 0
              ? options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value} disabled={opt.disabled} className="bg-[#18181b] text-white">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute right-3 flex items-center text-zinc-400">
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = "Select"
