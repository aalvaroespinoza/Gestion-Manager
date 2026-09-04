"use client"

import { useEffect, useRef } from "react"

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void
  maxIntervalMs?: number // Umbral máximo entre caracteres para considerarlo pistola USB (<45ms)
  minLength?: number     // Longitud mínima de código de barras
  enabled?: boolean
}

/**
 * Hook de grado industrial para la captura de escáneres de código de barras USB (Keyboard Wedge).
 * Discrimina entre tipeo humano lento (100-250ms) y ráfaga de escáner (<45ms).
 */
export function useBarcodeScanner({
  onScan,
  maxIntervalMs = 45,
  minLength = 3,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("")
  const lastKeyTimeRef = useRef<number>(0)
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar teclas modificadoras
      if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(event.key)) {
        return
      }

      const currentTime = performance.now()
      const timeDiff = currentTime - lastKeyTimeRef.current
      lastKeyTimeRef.current = currentTime

      // Si el tiempo entre caracteres supera el umbral, se reinicia el buffer (tipeo humano o pausa)
      if (timeDiff > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = ""
      }

      if (event.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          event.preventDefault()
          event.stopPropagation()
          const scannedCode = bufferRef.current.trim()
          bufferRef.current = ""
          onScanRef.current(scannedCode)
        } else {
          bufferRef.current = ""
        }
        return
      }

      // Solo acumulamos caracteres alfanuméricos simples
      if (event.key.length === 1) {
        bufferRef.current += event.key
      }
    }

    window.addEventListener("keydown", handleKeyDown, true) // capture phase
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [enabled, maxIntervalMs, minLength])
}
