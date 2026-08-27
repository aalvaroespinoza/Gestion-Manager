"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open: controlledOpen, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const context = useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within a Dialog")

  if (React.isValidElement(children) && asChild) {
    const childElement = children as React.ReactElement<any>
    return React.cloneElement(childElement, {
      onClick: (e: React.MouseEvent) => {
        childElement.props?.onClick?.(e)
        context.setOpen(true)
      },
    })
  }

  return (
    <button type="button" onClick={() => context.setOpen(true)}>
      {children}
    </button>
  )
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "xl" | "full"
  showCloseButton?: boolean
}

const sizeStyles: Record<NonNullable<DialogContentProps["size"]>, string> = {
  sm: "max-w-sm",
  default: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] h-[90vh]",
}

export function DialogContent({
  children,
  className,
  size = "default",
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const context = useContext(DialogContext)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!context?.open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        context.setOpen(false)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [context?.open, context])

  if (!context?.open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => context.setOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Body */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full rounded-2xl bg-[#18181b] text-zinc-100 border border-zinc-800 p-6 shadow-2xl transition-all duration-200 animate-in zoom-in-95",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={() => context.setOpen(false)}
            aria-label="Cerrar modal"
            className="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-bold leading-none tracking-tight text-white", className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-zinc-400 mt-1", className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-zinc-800", className)}
      {...props}
    />
  )
}

export function DialogClose({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const context = useContext(DialogContext)

  if (React.isValidElement(children) && asChild) {
    const childElement = children as React.ReactElement<any>
    return React.cloneElement(childElement, {
      onClick: (e: React.MouseEvent) => {
        childElement.props?.onClick?.(e)
        context?.setOpen(false)
      },
    })
  }

  return (
    <button type="button" onClick={() => context?.setOpen(false)}>
      {children}
    </button>
  )
}

// Standalone convenience Modal wrapper
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: DialogContentProps["size"]
}

export function Modal({ isOpen, onClose, title, description, children, footer, size = "default" }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size={size}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
