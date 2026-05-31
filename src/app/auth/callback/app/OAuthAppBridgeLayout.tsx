'use client'

import { useEffect } from 'react'

/** Plein écran au-dessus du reste, fond sombre (barre d’adresse Chrome moins visible visuellement). */
export default function OAuthAppBridgeLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlBg = html.style.backgroundColor
    const prevBodyBg = body.style.backgroundColor
    const prevOverflow = body.style.overflow
    html.style.backgroundColor = '#020617'
    body.style.backgroundColor = '#020617'
    body.style.overflow = 'hidden'

    const meta = document.querySelector('meta[name="theme-color"]')
    const prevTheme = meta?.getAttribute('content') ?? null
    if (meta) meta.setAttribute('content', '#020617')

    return () => {
      html.style.backgroundColor = prevHtmlBg
      body.style.backgroundColor = prevBodyBg
      body.style.overflow = prevOverflow
      if (meta && prevTheme !== null) meta.setAttribute('content', prevTheme)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden bg-[#020617]">{children}</div>
  )
}
