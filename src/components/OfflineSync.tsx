'use client'

import { useEffect, useRef } from 'react'
import { runSync, isOnline } from '@/lib/offlineQueue'
import { useToast } from '@/components/ui/ToastProvider'

const SYNC_INTERVAL_MS = 25000 // Sync périodique quand l’app est visible (réseau parfois non signalé)

/**
 * Au chargement, au retour du réseau, au retour en avant-plan et périodiquement,
 * envoie les données en file d’attente (observations / sites) vers la base.
 * Affiche un toast quand des données sont synchronisées.
 */
export default function OfflineSync() {
  const syncingRef = useRef(false)
  const { showToast } = useToast()

  useEffect(() => {
    const doSync = async () => {
      if (!isOnline() || syncingRef.current) return
      syncingRef.current = true
      try {
        const { synced, errors } = await runSync()
        if (synced > 0) {
          showToast({
            type: 'success',
            title: 'Données synchronisées',
            message: `${synced} donnée(s) envoyée(s) avec succès.`
          })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('offline-sync-completed', { detail: { synced } }))
          }
        }
        if (errors.length > 0) {
          console.warn('[OfflineSync] Erreurs:', errors)
        }
      } finally {
        syncingRef.current = false
      }
    }

    doSync()

    const onOnline = () => doSync()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline()) {
        setTimeout(doSync, 400)
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && isOnline()) doSync()
    }, SYNC_INTERVAL_MS)

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [showToast])

  return null
}
