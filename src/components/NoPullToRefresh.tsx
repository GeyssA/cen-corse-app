'use client'

import { useEffect } from 'react'

export default function NoPullToRefresh() {
  useEffect(() => {
    // Dans l’APK (Capacitor), ne jamais bloquer le touch : le scroll doit marcher sur tout l’écran
    const isCapacitor = typeof window !== 'undefined' && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
    if (isCapacitor) return

    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    if (!isPWA) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) e.preventDefault()
    }
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return null
}
