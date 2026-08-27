"use client"

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react"

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [isHydrated, setIsHydrated] = useState(false)
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Load from localStorage on mount (client-side only to avoid hydration mismatches)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key)
        if (item) {
          setStoredValue(JSON.parse(item))
        } else {
          // Initialize localStorage with initialValue
          window.localStorage.setItem(key, JSON.stringify(initialValue))
        }
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error)
    } finally {
      setIsHydrated(true)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }
          return valueToStore
        })
      } catch (error) {
        console.warn(`[useLocalStorage] Error writing key "${key}":`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue, isHydrated]
}
