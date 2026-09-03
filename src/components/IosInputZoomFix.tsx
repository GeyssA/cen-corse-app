'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

/**
 * Sur iOS, un focus sur un champ < 16px zoome la WebView ; avec maximum-scale=1
 * l’utilisateur ne peut plus dézoomer. On force ≥16px via CSS, et au blur on
 * réapplique le viewport + un léger scroll pour rétablir l’échelle.
 */
export default function IosInputZoomFix() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!Capacitor.isNativePlatform()) return
    if (Capacitor.getPlatform() !== 'ios') return

    const meta =
      document.querySelector('meta[name="viewport"]') ||
      (() => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'viewport')
        document.head.appendChild(m)
        return m
      })()

    const resetZoom = () => {
      meta.setAttribute('content', VIEWPORT_CONTENT)
      // Double apply : certains iOS ne réinitialisent l’échelle qu’après un refresh du meta
      requestAnimationFrame(() => {
        meta.setAttribute('content', VIEWPORT_CONTENT)
        window.scrollTo(0, window.scrollY)
      })
    }

    const onFocusOut = (e: FocusEvent) => {
      const t = e.target
      if (!(t instanceof HTMLElement)) return
      const tag = t.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return
      // Laisser le clavier se fermer avant de reset
      window.setTimeout(resetZoom, 50)
    }

    document.addEventListener('focusout', onFocusOut, true)
    return () => document.removeEventListener('focusout', onFocusOut, true)
  }, [])

  return null
}
