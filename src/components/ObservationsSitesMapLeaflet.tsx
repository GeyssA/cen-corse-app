'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { watchPosition } from '@/lib/geolocation'
import { createUserPositionIcon, createCircleIcon } from '@/lib/mapIcons'
import { MapScale, MapLegend } from '@/components/MapControls'
import type { MapPoint } from './ObservationsSitesMapModal'

// Fix des icônes Leaflet avec Next.js / webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

const USER_ICON = createUserPositionIcon()
const SITE_ICON = createCircleIcon('#10b981', 22)
const OBS_ICON = createCircleIcon('#f59e0b', 16)

/** Clé pour grouper les points au même endroit (arrondi ~10 m) */
function locationKey(lat: number, lng: number, decimals = 5): string {
  return `${lat.toFixed(decimals)}_${lng.toFixed(decimals)}`
}

/** Répartit les points qui se superposent sur un petit cercle pour tous les voir. Les sites linéaires sont exclus (tracés à part). */
function spreadOverlappingPoints(points: MapPoint[]): { point: MapPoint; displayLat: number; displayLng: number }[] {
  const pointLike = points.filter((p) => {
    if (p.type === 'site') {
      const path = (p as { path_coordinates?: [number, number][] }).path_coordinates
      return !path || path.length < 2
    }
    return true
  })
  const radiusDeg = 0.00012
  const groups = new Map<string, MapPoint[]>()
  for (const p of pointLike) {
    const key = locationKey(p.latitude, p.longitude)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(p)
  }
  const result: { point: MapPoint; displayLat: number; displayLng: number }[] = []
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
      const displayLng = centerLng + radiusDeg * Math.cos(angle)
      const displayLat = centerLat + radiusDeg * Math.sin(angle)
      result.push({ point, displayLat, displayLng })
    })
  }
  return result
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const length = positions.length
  const positionsRef = React.useRef(positions)
  positionsRef.current = positions
  useEffect(() => {
    if (length === 0) return
    const bounds = L.latLngBounds(positionsRef.current)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, length])
  return null
}

interface ObservationsSitesMapLeafletProps {
  points: MapPoint[]
  initialCenter: [number, number]
}

const DEFAULT_ZOOM = 8

export default function ObservationsSitesMapLeaflet({ points, initialCenter }: ObservationsSitesMapLeafletProps) {
  const [livePosition, setLivePosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    const unsubscribe = watchPosition(
      (pos) => setLivePosition([pos.latitude, pos.longitude]),
      () => setLivePosition(null)
    )
    return unsubscribe
  }, [])

  const spreadPoints = useMemo(() => spreadOverlappingPoints(points), [points])
  const linearSites = useMemo(() =>
    points.filter((p): p is MapPoint & { type: 'site'; path_coordinates: [number, number][] } =>
      p.type === 'site' && !!(p as { path_coordinates?: [number, number][] }).path_coordinates && (p as { path_coordinates: [number, number][] }).path_coordinates.length >= 2
    ),
    [points]
  )
  const boundsPositions = useMemo(() => {
    const fromPoints = spreadPoints.map((s) => [s.displayLat, s.displayLng] as [number, number])
    linearSites.forEach((s) => s.path_coordinates.forEach((pt) => fromPoints.push(pt)))
    if (livePosition) return [...fromPoints, livePosition]
    return fromPoints
  }, [spreadPoints, linearSites, livePosition])

  const pointsToShow = useMemo(() => {
    if (!livePosition) return spreadPoints
    return spreadPoints.filter((s) => s.point.type !== 'user')
  }, [spreadPoints, livePosition])

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapScale />
        {boundsPositions.length > 0 && <FitBounds positions={boundsPositions} />}
      {livePosition && (
        <Marker position={livePosition} icon={USER_ICON}>
          <Popup closeButton>
            <div className="p-1 min-w-[140px] text-sm">
              <p className="font-semibold text-blue-600">Ma position</p>
              <p className="text-xs text-gray-500">Position GPS actuelle</p>
            </div>
          </Popup>
        </Marker>
      )}
      {linearSites.map((site) => {
        const pathPositions = site.path_coordinates.map((pt) => [pt[0], pt[1]] as [number, number])
        return (
          <Polyline key={`site-line-${site.id}`} positions={pathPositions} pathOptions={{ color: '#10b981', weight: 4 }}>
            <Popup closeButton>
              <div className="p-2 min-w-[200px] text-sm space-y-1.5">
                <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-1">Site linéaire – {site.nom_du_site}</p>
                <p className="text-gray-600"><span className="font-medium">Protocole :</span> {site.protocole}</p>
                {site.date && <p className="text-gray-500 text-xs">Créé le {site.date}</p>}
              </div>
            </Popup>
          </Polyline>
        )
      })}
      {pointsToShow.map(({ point, displayLat, displayLng }) => {
        const icon =
          point.type === 'user' ? USER_ICON :
          point.type === 'site' ? SITE_ICON : OBS_ICON
        return (
          <Marker
            key={`${point.type}-${point.id}`}
            position={[displayLat, displayLng]}
            icon={icon}
          >
            <Popup closeButton>
              {point.type === 'user' && (
                <div className="p-1 min-w-[140px] text-sm">
                  <p className="font-semibold text-blue-600">Ma position</p>
                  <p className="text-xs text-gray-500">Position GPS actuelle</p>
                </div>
              )}
              {point.type === 'site' && (
                <div className="p-2 min-w-[200px] text-sm space-y-1.5">
                  <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-1">{(point as any).nom_du_site}</p>
                  <p className="text-gray-600"><span className="font-medium">Protocole :</span> {(point as any).protocole}</p>
                  {(point as any).date && <p className="text-gray-500 text-xs">Créé le {(point as any).date}</p>}
                  <p className="text-xs text-emerald-600 font-medium pt-0.5">Site d’observation</p>
                </div>
              )}
              {point.type === 'observation' && (
                <div className="p-2 min-w-[220px] text-sm space-y-1.5">
                  <p className="font-semibold text-amber-800 border-b border-amber-200 pb-1">{(point as any).nom_espece || '—'}</p>
                  <p className="text-gray-600"><span className="font-medium">Date :</span> {(point as any).date}</p>
                  <p className="text-gray-600"><span className="font-medium">Site :</span> {(point as any).site || '—'}</p>
                  {(point as any).protocole && <p className="text-gray-500 text-xs"><span className="font-medium">Protocole :</span> {(point as any).protocole}</p>}
                  {(point as any).groupe && <p className="text-gray-500 text-xs"><span className="font-medium">Groupe :</span> {(point as any).groupe}</p>}
                  {(point as any).effectif && <p className="text-gray-500 text-xs"><span className="font-medium">Effectif :</span> {(point as any).effectif}</p>}
                  {((point as any).stade || (point as any).sexe) && (
                    <p className="text-gray-500 text-xs">
                      {[(point as any).stade, (point as any).sexe].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {(point as any).observateur && <p className="text-gray-400 text-xs italic">{(point as any).observateur}</p>}
                  {(point as any).remarques && <p className="text-gray-500 text-xs mt-1 border-t border-gray-100 pt-1">{(point as any).remarques}</p>}
                  <p className="text-xs text-amber-600 font-medium pt-0.5">Observation</p>
                </div>
              )}
            </Popup>
          </Marker>
        )
      })}
      </MapContainer>
      <MapLegend dark />
    </div>
  )
}
