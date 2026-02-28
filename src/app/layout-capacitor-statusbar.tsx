'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export default function CapacitorStatusBar() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Forcer les couleurs - BLEU MARINE FONCÉ #1e3a8a
      const forceColors = async () => {
        try {
          // Forcer la couleur de fond en premier
          await StatusBar.setBackgroundColor({ color: '#1e3a8a' })
          // Style.Dark = icônes claires (pour fond sombre) - correct pour notre fond bleu marine
          await StatusBar.setStyle({ style: Style.Dark })
          await StatusBar.setOverlaysWebView({ overlay: false })
          // Forcer à nouveau la couleur après le style pour s'assurer qu'elle persiste
          await StatusBar.setBackgroundColor({ color: '#1e3a8a' })
        } catch (e) {
          // Ignorer les erreurs
        }
      }
      
      // Forcer immédiatement
      forceColors()
      
      // Attendre que le DOM soit prêt (après le splash screen)
      if (document.readyState === 'complete') {
        forceColors()
      } else {
        window.addEventListener('load', forceColors)
      }
      
      // Forcer plusieurs fois avec des délais pour s'assurer que ça persiste après le splash
      const timeouts = [500, 1000, 2000, 3000, 5000]
      timeouts.forEach(delay => {
        setTimeout(forceColors, delay)
      })
      
      // Forcer en continu pendant 15 secondes pour s'assurer que ça persiste
      const startTime = Date.now()
      const interval = setInterval(() => {
        if (Date.now() - startTime < 15000) {
          forceColors()
        } else {
          clearInterval(interval)
        }
      }, 500) // Toutes les 500ms
      
      // Forcer quand la fenêtre reprend le focus
      window.addEventListener('focus', forceColors)
      window.addEventListener('pageshow', forceColors)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) forceColors()
      })
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('load', forceColors)
        window.removeEventListener('focus', forceColors)
        window.removeEventListener('pageshow', forceColors)
      }
    }
  }, [])

  return null
}

