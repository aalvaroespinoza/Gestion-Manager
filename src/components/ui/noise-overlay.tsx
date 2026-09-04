"use client"

import React from "react"

export function NoiseOverlay() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.025] mix-blend-overlay transform-gpu"
      aria-hidden="true"
    >
      <filter id="procedural-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#procedural-noise)" />
    </svg>
  )
}
