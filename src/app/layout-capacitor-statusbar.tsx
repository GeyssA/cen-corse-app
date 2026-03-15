'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useTheme } from '@/contexts/ThemeContext'

/** Couleurs alignées avec le fond du reste de l'app (bandeau = fond) */
const STATUS_BAR_COLORS = {
  dark: '#111827',  /* gray-900, même que le contenu */
  light: '#f1f5f9'
} as const

/** Page connexion : fond toujours sombre, pas de bandeau app → barre système seule */
const AUTH_STATUS_BAR_COLOR = '#111827'

export default function CapacitorStatusBar() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const isLight = theme === 'light' && !isAuthPage
    const color = isAuthPage ? AUTH_STATUS_BAR_COLOR : STATUS_BAR_COLORS[theme]
    const style = isLight ? Style.Light : Style.Dark

    const apply = async () => {
      try {
        await StatusBar.setBackgroundColor({ color })
        await StatusBar.setStyle({ style })
        await StatusBar.setOverlaysWebView({ overlay: false })
        const NavBar = await import('@capgo/capacitor-navigation-bar').then(m => m.NavigationBar).catch(() => null)
        const setNavColor = NavBar?.setNavigationBarColor ?? NavBar?.setColor
        if (setNavColor) {
          await setNavColor({ color: isAuthPage ? AUTH_STATUS_BAR_COLOR : color, darkButtons: isLight })
        }
      } catch {
        // ignore
      }
    }

    apply()
    const t = setTimeout(apply, 300)
    return () => clearTimeout(t)
  }, [theme, isAuthPage])

  return null
}
