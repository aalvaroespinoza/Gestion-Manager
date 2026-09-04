"use client"

import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  spotlightColor?: string
  borderColor?: string
}

export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  (
    {
      children,
      className,
      spotlightColor = "var(--primary-light, rgba(249, 115, 22, 0.12))",
      borderColor = "var(--primary, rgba(249, 115, 22, 0.35))",
      ...props
    },
    ref
  ) => {
    const localRef = useRef<HTMLDivElement>(null)
    const cardRef = (ref as React.RefObject<HTMLDivElement | null>) || localRef
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cardRef.current.style.setProperty("--mouse-x", `${x}px`)
      cardRef.current.style.setProperty("--mouse-y", `${y}px`)
    }

    return (
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl p-6 transition-all duration-300 card-specular",
          "hover:border-border hover:shadow-lg hover:shadow-black/10",
          className
        )}
        {...props}
      >
        {/* Glow de Superficie */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(450px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* Glow de Borde Fino */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl p-[1px] transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.75 : 0,
            background: `radial-gradient(280px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${borderColor}, transparent 60%)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
          }}
          aria-hidden="true"
        />

        {/* Contenido */}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)

SpotlightCard.displayName = "SpotlightCard"
