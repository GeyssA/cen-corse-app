'use client'

import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapPoint } from './ObservationsSitesMapModal'

// Fix des icônes Leaflet avec Next.js / webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

// Marqueurs personnalisés (couleur + taille : sites plus grands, observations plus petits)
function createCustomIcon(color: string, sizePx: number) {
  const half = sizePx / 2
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${sizePx}px; height: ${sizePx}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [sizePx, sizePx],
    iconAnchor: [half, half]
  })
}

const USER_ICON = createCustomIcon('#3b82f6', 24)   // blue
const SITE_ICON = createCustomIcon('#10b981', 22)  // emerald, légèrement plus grand
const OBS_ICON = createCustomIcon('#f59e0b', 16)   // amber, plus petit (observations)

/** Clé pour grouper les points au même endroit (arrondi ~10 m) */
function locationKey(lat: number, lng: number, decimals = 5): string {
  return `${lat.toFixed(decimals)}_${lng.toFixed(decimals)}`
}

/** Répartit les points qui se superposent sur un petit cercle pour tous les voir */
function spreadOverlappingPoints(points: MapPoint[]): { point: MapPoint; displayLat: number; displayLng: number }[] {
  const radiusDeg = 0.00012 // ~12 m en degrés, moins décalé pour les points d'obs
  const groups = new Map<string, MapPoint[]>()
  for (const p of points) {
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
  useEffect(() => {
    if (positions.length === 0) return
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, positions])
  return null
}

interface ObservationsSitesMapLeafletProps {
  points: MapPoint[]
  initialCenter: [number, number]
}

const DEFAULT_ZOOM = 8

export default function ObservationsSitesMapLeaflet({ points, initialCenter }: ObservationsSitesMapLeafletProps) {
  const spreadPoints = useMemo(() => spreadOverlappingPoints(points), [points])
  const boundsPositions = useMemo(() => spreadPoints.map((s) => [s.displayLat, s.displayLng] as [number, number]), [spreadPoints])

  return (
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
      {boundsPositions.length > 0 && <FitBounds positions={boundsPositions} />}
      {spreadPoints.map(({ point, displayLat, displayLng }) => {
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
  )
}
