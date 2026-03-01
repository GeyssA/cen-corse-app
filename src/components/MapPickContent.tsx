'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCurrentPositionAsync } from '@/lib/geolocation'
import { createUserPositionIcon, SITE_MARKER_ICON, OBS_MARKER_ICON } from '@/lib/mapIcons'
import { MapScale, MapLegend } from '@/components/MapControls'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

export interface ExistingMapPoint {
  type: 'site' | 'observation'
  id: string
  latitude: number
  longitude: number
  nom_du_site?: string
  nom_espece?: string
  /** Site linéaire : tracer la ligne au lieu d’un point */
  path_coordinates?: [number, number][]
  date?: string
  protocole?: string
  site?: string
  groupe?: string
  effectif?: string
  stade?: string
  sexe?: string
  remarques?: string
  observateur?: string
}

interface MapPickContentProps {
  initialCenter: [number, number]
  position: [number, number] | null
  onPositionChange: (pos: [number, number] | null) => void
  existingPoints?: ExistingMapPoint[]
  /** false = parent charge encore les points, on affiche la carte seulement quand true */
  existingPointsLoaded?: boolean
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (pos: [number, number]) => void }) {
  useMapEvents({
    click: (e) => {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

function FitBoundsOnce({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const doneRef = React.useRef(false)
  useEffect(() => {
    if (doneRef.current || positions.length === 0) return
    doneRef.current = true
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
  }, [map, positions])
  return null
}

/** Répartit les points au même endroit pour éviter la superposition (comme carte principale). */
export function spreadExistingPoints(
  points: ExistingMapPoint[]
): { point: ExistingMapPoint; displayLat: number; displayLng: number }[] {
  const pointLike = points.filter((p) => !p.path_coordinates || p.path_coordinates.length < 2)
  const radiusDeg = 0.00012
  const groups = new Map<string, ExistingMapPoint[]>()
  for (const p of pointLike) {
    const key = `${p.latitude.toFixed(5)}_${p.longitude.toFixed(5)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(p)
  }
  const result: { point: ExistingMapPoint; displayLat: number; displayLng: number }[] = []
  for (const [, group] of groups) {
    const centerLat = group[0].latitude
    const centerLng = group[0].longitude
    if (group.length === 1) {
      result.push({ point: group[0], displayLat: centerLat, displayLng: centerLng })
      continue
    }
    const step = (2 * Math.PI) / group.length
    group.forEach((point, i) => {
      const angle = i * step
      result.push({
        point,
        displayLat: centerLat + radiusDeg * Math.sin(angle),
        displayLng: centerLng + radiusDeg * Math.cos(angle)
      })
    })
  }
  return result
}

export default function MapPickContent({ initialCenter, position, onPositionChange, existingPoints = [], existingPointsLoaded = true }: MapPickContentProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null | undefined>(undefined)
  const handleClick = useCallback((pos: [number, number]) => onPositionChange(pos), [onPositionChange])

  useEffect(() => {
    getCurrentPositionAsync()
      .then((pos) => setUserPosition([pos.latitude, pos.longitude]))
      .catch(() => setUserPosition(null))
  }, [])

  const ready = userPosition !== undefined && existingPointsLoaded

  const initialBoundsPositions = useMemo((): [number, number][] => {
    if (!ready) return []
    const list: [number, number][] = []
    if (userPosition) list.push(userPosition)
    existingPoints.forEach((p) => {
      if (p.path_coordinates && p.path_coordinates.length >= 2) {
        p.path_coordinates.forEach((pt) => list.push(pt))
      } else {
        list.push([p.latitude, p.longitude])
      }
    })
    if (list.length === 0) list.push(initialCenter)
    return list
  }, [ready, userPosition, existingPoints, initialCenter])

  const hasSites = existingPoints.some((p) => p.type === 'site')
  const hasObs = existingPoints.some((p) => p.type === 'observation')
  const spreadPoints = useMemo(() => spreadExistingPoints(existingPoints), [existingPoints])

  if (!ready) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900/80">
        <p className="text-gray-300 text-sm">Chargement de la position et des points…</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={10}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapScale />
        {initialBoundsPositions.length > 0 && <FitBoundsOnce positions={initialBoundsPositions} />}
        <MapClickHandler onPositionChange={handleClick} />
        {userPosition && (
          <Marker position={userPosition} icon={createUserPositionIcon()}>
            <Popup closeButton>
              <div className="p-1 min-w-[120px] text-sm">
                <p className="font-semibold text-blue-600">Ma position</p>
              </div>
            </Popup>
          </Marker>
        )}
        {existingPoints.map((p) => {
          if (p.path_coordinates && p.path_coordinates.length >= 2) {
            const pathPositions = p.path_coordinates.map((pt) => [pt[0], pt[1]] as [number, number])
            return (
              <Polyline
                key={`${p.type}-${p.id}`}
                positions={pathPositions}
                pathOptions={{ color: '#10b981', weight: 4 }}
              >
                <Popup closeButton>
                  <div className="p-2 min-w-[200px] text-sm space-y-1.5">
                    <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-1">Site linéaire – {p.nom_du_site || '—'}</p>
                    <p className="text-gray-600"><span className="font-medium">Protocole :</span> {p.protocole || '—'}</p>
                    {p.date && <p className="text-gray-500 text-xs">Créé le {p.date}</p>}
                  </div>
                </Popup>
              </Polyline>
            )
          }
          return null
        })}
        {spreadPoints.map(({ point: p, displayLat, displayLng }) => (
          <Marker
            key={`${p.type}-${p.id}`}
            position={[displayLat, displayLng]}
            icon={p.type === 'site' ? SITE_MARKER_ICON : OBS_MARKER_ICON}
          >
            <Popup closeButton>
              {p.type === 'site' ? (
                <div className="p-2 min-w-[200px] text-sm space-y-1.5">
                  <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-1">{p.nom_du_site || '—'}</p>
                  <p className="text-gray-600"><span className="font-medium">Protocole :</span> {p.protocole || '—'}</p>
                  {p.date && <p className="text-gray-500 text-xs">Créé le {p.date}</p>}
                  <p className="text-xs text-emerald-600 font-medium pt-0.5">Site d’observation</p>
                </div>
              ) : (
                <div className="p-2 min-w-[220px] text-sm space-y-1.5">
                  <p className="font-semibold text-amber-800 border-b border-amber-200 pb-1">{p.nom_espece || '—'}</p>
                  <p className="text-gray-600"><span className="font-medium">Date :</span> {p.date || '—'}</p>
                  <p className="text-gray-600"><span className="font-medium">Site :</span> {p.site || '—'}</p>
                  {p.protocole && <p className="text-gray-500 text-xs"><span className="font-medium">Protocole :</span> {p.protocole}</p>}
                  {p.groupe && <p className="text-gray-500 text-xs"><span className="font-medium">Groupe :</span> {p.groupe}</p>}
                  {p.effectif && <p className="text-gray-500 text-xs"><span className="font-medium">Effectif :</span> {p.effectif}</p>}
                  {(p.stade || p.sexe) && (
                    <p className="text-gray-500 text-xs">
                      {[p.stade, p.sexe].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {p.observateur && <p className="text-gray-400 text-xs italic">{p.observateur}</p>}
                  {p.remarques && <p className="text-gray-500 text-xs mt-1 border-t border-gray-100 pt-1">{p.remarques}</p>}
                  <p className="text-xs text-amber-600 font-medium pt-0.5">Observation</p>
                </div>
              )}
            </Popup>
          </Marker>
        ))}
        {position && <Marker position={position} />}
      </MapContainer>
      <MapLegend showUser showSites={hasSites} showObs={hasObs} dark />
    </div>
  )
}
