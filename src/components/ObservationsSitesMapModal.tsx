'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { getObservationsByUser, deleteObservation, type Observation } from '@/lib/observations'
import { getSitesByUser, deleteSite, type ObservationSite } from '@/lib/sites'
import { isOnline } from '@/lib/offlineQueue'
import { getCurrentPositionAsync } from '@/lib/geolocation'
import { getCachedMapData, setCachedMapData, invalidateMapDataCache } from '@/lib/mapDataCache'
import { getAiresForUser, type SiteAire } from '@/lib/siteAires'
import dynamic from 'next/dynamic'
import ObservationModal from '@/components/ObservationModal'
import AddSiteModal from '@/components/AddSiteModal'
import { useLockMainChrome } from '@/hooks/useLockMainChrome'

const CORSICA_CENTER: [number, number] = [42.1, 9.1]
const DEFAULT_ZOOM = 8

type MapPoint =
  | { type: 'user'; id: string; latitude: number; longitude: number; label?: string }
  | {
      type: 'site'
      id: string
      latitude: number
      longitude: number
      nom_du_site: string
      protocole: string
      date?: string
      path_coordinates?: [number, number][]
      length_meters?: number | null
      siteRow?: ObservationSite
    }
  | {
      type: 'observation'
      id: string
      latitude: number
      longitude: number
      date: string
      nom_espece: string
      site: string
      protocole?: string
      groupe?: string
      effectif?: string
      stade?: string
      sexe?: string
      remarques?: string
      observateur?: string
      observationRow?: Observation
    }

// Carte Leaflet chargée côté client uniquement (évite erreurs SSR)
const LeafletMap = dynamic(() => import('./ObservationsSitesMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Chargement de la carte…</p>
    </div>
  )
})

/** Précharge le chunk Leaflet pour ouvrir la carte plus vite au clic. */
export function preloadMapChunk(): void {
  import('./ObservationsSitesMapLeaflet')
}

interface ObservationsSitesMapModalProps {
  isOpen: boolean
  onClose: () => void
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPersistedUuid(id: string | undefined): boolean {
  return !!id && UUID_RE.test(id)
}

export default function ObservationsSitesMapModal({ isOpen, onClose }: ObservationsSitesMapModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  useLockMainChrome(isOpen)
  const [points, setPoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aires, setAires] = useState<SiteAire[]>([])
  const [observationToEdit, setObservationToEdit] = useState<Observation | null>(null)
  const [siteToEdit, setSiteToEdit] = useState<ObservationSite | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'observation' | 'site'
    id: string
    title: string
  } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [deleteSuccessFadeOut, setDeleteSuccessFadeOut] = useState(false)
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('Donnée supprimée')
  const isLight = theme === 'light'

  const requestDeleteObservation = (row: Observation) => {
    if (!isPersistedUuid(row.id)) {
      setDeleteError('Cette observation n’a pas encore d’identifiant serveur : supprimez-la depuis la file d’attente ou réessayez après synchronisation.')
      return
    }
    if (!isOnline()) {
      setDeleteError('Une connexion réseau est nécessaire pour supprimer une observation.')
      return
    }
    setDeleteError(null)
    setDeleteDialog({
      type: 'observation',
      id: row.id!,
      title: row.nom_espece || row.site || 'cette observation',
    })
  }

  const requestDeleteSite = (row: ObservationSite) => {
    if (!isOnline()) {
      setDeleteError('Une connexion réseau est nécessaire pour supprimer un site.')
      return
    }
    setDeleteError(null)
    setDeleteDialog({
      type: 'site',
      id: row.id,
      title: row.nom_du_site || 'ce site',
    })
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteDialog(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteDialog || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      if (deleteDialog.type === 'observation') {
        const { error } = await deleteObservation(deleteDialog.id)
        if (error) {
          setDeleteError(error)
          return
        }
        setDeleteSuccessMessage('Observation supprimée')
      } else {
        const { error } = await deleteSite(deleteDialog.id)
        if (error) {
          setDeleteError(error)
          return
        }
        setDeleteSuccessMessage('Site supprimé')
      }
      invalidateMapDataCache()
      await loadData()
      setDeleteDialog(null)
      setShowDeleteSuccess(true)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!showDeleteSuccess) return
    setDeleteSuccessFadeOut(false)
    const fadeTimer = window.setTimeout(() => setDeleteSuccessFadeOut(true), 1200)
    const hideTimer = window.setTimeout(() => setShowDeleteSuccess(false), 1600)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [showDeleteSuccess])

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const cached = getCachedMapData(user.id)
      let observations: Observation[]
      let sites: ObservationSite[]
      let userPos: { latitude: number; longitude: number } | null = null

      if (cached) {
        observations = cached.observations
        sites = cached.sites as (ObservationSite & { path_coordinates?: [number, number][] | null })[]
        userPos = await getCurrentPositionAsync().catch(() => null)
      } else {
        const [obsResult, sitesResult, posResult] = await Promise.all([
          getObservationsByUser(user.id),
          getSitesByUser(user.id),
          getCurrentPositionAsync().catch((): null => null)
        ])
        observations = obsResult
        sites = sitesResult as (ObservationSite & { path_coordinates?: [number, number][] | null })[]
        userPos = posResult
        setCachedMapData(user.id, { observations, sites })
      }

      const newPoints: MapPoint[] = []
      if (userPos) {
        newPoints.push({
          type: 'user',
          id: 'user',
          latitude: userPos.latitude,
          longitude: userPos.longitude,
          label: 'Ma position'
        })
      }
      sites.forEach((s) => {
        const lat = s.latitude ?? (s.path_coordinates?.[0]?.[0])
        const lng = s.longitude ?? (s.path_coordinates?.[0]?.[1])
        if (lat != null && lng != null) {
          const sitePoint: Extract<MapPoint, { type: 'site' }> = {
            type: 'site',
            id: s.id,
            latitude: lat,
            longitude: lng,
            nom_du_site: s.nom_du_site,
            protocole: s.protocole,
            date: s.date,
            siteRow: s
          }
          if (s.path_coordinates && s.path_coordinates.length >= 2) {
            sitePoint.path_coordinates = s.path_coordinates
            if (s.length_meters != null) sitePoint.length_meters = s.length_meters
          }
          newPoints.push(sitePoint)
        }
      })
      ;observations.forEach((o) => {
        if (o.latitude != null && o.longitude != null) {
          newPoints.push({
            type: 'observation',
            id: o.id ?? o.site + o.date,
            latitude: o.latitude,
            longitude: o.longitude,
            date: o.date,
            nom_espece: o.nom_espece,
            site: o.site,
            protocole: o.protocole,
            groupe: o.groupe,
            effectif: o.effectif,
            stade: o.stade,
            sexe: o.sexe,
            remarques: o.remarques,
            observateur: o.observateur,
            observationRow: o
          })
        }
      })
      setPoints(newPoints)
      setAires(getAiresForUser(user.id))
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isOpen && user?.id) loadData()
  }, [isOpen, user?.id, loadData])

  if (!isOpen) return null

  const initialCenter: [number, number] = (() => {
    const userPoint = points.find((p) => p.type === 'user')
    if (userPoint) return [userPoint.latitude, userPoint.longitude]
    return CORSICA_CENTER
  })()

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/60 backdrop-blur-sm safe-area-modal">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}
      >
        <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Carte – Sites & observations
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-gray-700 text-gray-300'}`}
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className={`absolute inset-0 flex items-center justify-center ${isLight ? 'bg-gray-100' : 'bg-gray-900'}`}>
            <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>Chargement des données…</p>
          </div>
        ) : error ? (
          <div className={`absolute inset-0 flex items-center justify-center p-6 ${isLight ? 'bg-gray-100' : 'bg-gray-900'}`}>
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <LeafletMap
              points={points}
              initialCenter={initialCenter}
              aires={aires}
              onEditObservation={(row) => setObservationToEdit(row)}
              onDeleteObservation={(row) => requestDeleteObservation(row)}
              onEditSite={(row) => setSiteToEdit(row)}
              onDeleteSite={(row) => requestDeleteSite(row)}
            />
          </div>
        )}
      </div>

      <ObservationModal
        isOpen={!!observationToEdit}
        observationToEdit={observationToEdit}
        onClose={() => setObservationToEdit(null)}
        onSuccess={() => {
          setObservationToEdit(null)
          void loadData()
        }}
      />
      <AddSiteModal
        isOpen={!!siteToEdit}
        editingSite={siteToEdit}
        onClose={() => setSiteToEdit(null)}
        onSuccess={() => {
          setSiteToEdit(null)
          void loadData()
        }}
      />

      {deleteDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}>
            <h3 className={`text-base font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Confirmation de suppression
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Voulez-vous supprimer cette donnée ?
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              {deleteDialog.type === 'observation' ? 'Observation' : 'Site'} :
              <span className={`ml-1 font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {deleteDialog.title}
              </span>
            </p>
            <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Cette action est définitive.
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${isLight ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'} disabled:opacity-60`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div
          className={`fixed inset-0 z-[121] flex items-center justify-center p-4 pointer-events-none transition-opacity duration-300 ${
            deleteSuccessFadeOut ? 'opacity-0' : 'opacity-100'
          }`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex flex-col items-center gap-3 rounded-lg px-8 py-6 shadow-xl text-center ${
              isLight ? 'bg-white text-emerald-600' : 'bg-gray-800 text-emerald-400'
            }`}
          >
            <svg className="w-14 h-14 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-lg font-semibold">{deleteSuccessMessage}</span>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

export type { MapPoint }

