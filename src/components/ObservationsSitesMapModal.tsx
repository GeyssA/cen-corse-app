'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { getObservationsByUser } from '@/lib/observations'
import { getSitesByUser } from '@/lib/sites'
import { getCurrentPositionAsync } from '@/lib/geolocation'
import type { Observation } from '@/lib/observations'
import type { ObservationSite } from '@/lib/sites'
import dynamic from 'next/dynamic'

const CORSICA_CENTER: [number, number] = [42.1, 9.1]
const DEFAULT_ZOOM = 8

type MapPoint =
  | { type: 'user'; id: string; latitude: number; longitude: number; label?: string }
  | { type: 'site'; id: string; latitude: number; longitude: number; nom_du_site: string; protocole: string; date?: string }
  | { type: 'observation'; id: string; latitude: number; longitude: number; date: string; nom_espece: string; site: string; protocole?: string; groupe?: string; effectif?: string; stade?: string; sexe?: string; remarques?: string; observateur?: string }

// Carte Leaflet chargée côté client uniquement (évite erreurs SSR)
const LeafletMap = dynamic(() => import('./ObservationsSitesMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Chargement de la carte…</p>
    </div>
  )
})

interface ObservationsSitesMapModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ObservationsSitesMapModal({ isOpen, onClose }: ObservationsSitesMapModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [points, setPoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isLight = theme === 'light'

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const [observations, sites] = await Promise.all([
        getObservationsByUser(user.id),
        getSitesByUser(user.id)
      ])
      const userPos = await getCurrentPositionAsync().catch(() => null)

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
      ;(sites as (ObservationSite & { latitude?: number | null; longitude?: number | null })[]).forEach((s) => {
        if (s.latitude != null && s.longitude != null) {
          newPoints.push({
            type: 'site',
            id: s.id,
            latitude: s.latitude,
            longitude: s.longitude,
            nom_du_site: s.nom_du_site,
            protocole: s.protocole,
            date: s.date
          })
        }
      })
      ;(observations as Observation[]).forEach((o) => {
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
            observateur: o.observateur
          })
        }
      })
      setPoints(newPoints)
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-sm">
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
            <LeafletMap points={points} initialCenter={initialCenter} />
          </div>
        )}
      </div>
    </div>
  )
}

export type { MapPoint }

