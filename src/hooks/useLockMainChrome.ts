'use client'

import { useEffect } from 'react'

const ATTR = 'data-fullscreen-overlays'

/**
 * Masque le chrome principal (barre d’onglets + bandeau logo/profil)
 * tant qu’une modale plein écran est ouverte — indispensable sur iOS où
 * le bandeau peut rester au-dessus et cacher la croix de fermeture.
 * Compteur : plusieurs modales empilées (carte → observation) restent correctes.
 */
export function useLockMainChrome(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return

    const root = document.body
    const prev = Number(root.getAttribute(ATTR) || '0')
    root.setAttribute(ATTR, String(prev + 1))
    root.classList.add('fullscreen-overlay-open')

    return () => {
      const next = Number(root.getAttribute(ATTR) || '1') - 1
      if (next <= 0) {
        root.removeAttribute(ATTR)
        root.classList.remove('fullscreen-overlay-open')
      } else {
        root.setAttribute(ATTR, String(next))
      }
    }
  }, [active])
}
