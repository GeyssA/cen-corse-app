'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCurrentPositionAsync } from '@/lib/geolocation'
import { createUserPositionIcon, SITE_MARKER_ICON, OBS_MARKER_ICON } from '@/lib/mapIcons'
import { MapScale, MapLegend, BASE_LAYERS, MapBaseLayerSwitcher, LINEAR_SITE_PATH_OPTIONS, LINEAR_SITE_HIT_WEIGHT, type BaseLayerId } from '@/components/MapControls'
import type { ExistingMapPoint } from './MapPickContent'
import { spreadExistingPoints } from './MapPickContent'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

interface MapLinePickContentProps {
  initialCenter: [number, number]
  path: [number, number][]
  onPathChange: (path: [number, number][]) => void
  existingPoints?: ExistingMapPoint[]
  existingPointsLoaded?: boolean
}

function MapClickHandler({
  onAddPoint
}: {
  onAddPoint: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onAddPoint(e.latlng.lat, e.latlng.lng)
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

export default function MapLinePickContent({
  initialCenter,
  path,
  onPathChange,
  existingPoints = [],
  existingPointsLoaded = true
}: MapLinePickContentProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null | undefined>(undefined)
  const [baseLayerId, setBaseLayerId] = useState<BaseLayerId>('osm')

  useEffect(() => {
    getCurrentPositionAsync()
      .then((pos) => setUserPosition([pos.latitude, pos.longitude]))
      .catch(() => setUserPosition(null))
  }, [])

  const ready = userPosition !== undefined && existingPointsLoaded

  const handleAddPoint = useCallback(
    (lat: number, lng: number) => {
      onPathChange([...path, [lat, lng]])
    },
    [path, onPathChange]
  )

  const positions = path.map(([lat, lng]) => [lat, lng] as [number, number])

  const initialBoundsPositions = useMemo((): [number, number][] => {
    if (!ready) return []
    const list: [number, number][] = []
    if (userPosition) list.push(userPosition)
    path.forEach((p) => list.push(p))
    existingPoints.forEach((p) => {
      if (p.path_coordinates && p.path_coordinates.length >= 2) {
        p.path_coordinates.forEach((pt) => list.push(pt))
      } else {
        list.push([p.latitude, p.longitude])
      }
    })
    if (list.length === 0) list.push(initialCenter)
    return list
  }, [ready, userPosition, path, existingPoints, initialCenter])

  const hasSites = existingPoints.some((p) => p.type === 'site')
  const hasLinearSites = existingPoints.some((p) => p.path_coordinates && p.path_coordinates.length >= 2)
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
          key={baseLayerId}
          attribution={BASE_LAYERS[baseLayerId].attribution}
          url={BASE_LAYERS[baseLayerId].url}
        />
        <MapScale />
        {initialBoundsPositions.length > 0 && <FitBoundsOnce positions={initialBoundsPositions} />}
        <MapClickHandler onAddPoint={handleAddPoint} />
        {userPosition && (
          <Marker position={userPosition} icon={createUserPositionIcon()}>
            <Popup closeButton>
              <div className="py-0.5 px-1.5 min-w-[120px] text-xs leading-none">
                <p className="font-semibold text-blue-600">Ma position</p>
              </div>
            </Popup>
          </Marker>
        )}
        {existingPoints.map((p) => {
          if (p.path_coordinates && p.path_coordinates.length >= 2) {
            const pathPositions = p.path_coordinates.map((pt) => [pt[0], pt[1]] as [number, number])
            return (
              <React.Fragment key={`${p.type}-${p.id}`}>
                <Polyline positions={pathPositions} pathOptions={LINEAR_SITE_PATH_OPTIONS} />
                <Polyline
                  positions={pathPositions}
                  pathOptions={{ color: 'transparent', weight: LINEAR_SITE_HIT_WEIGHT }}
                >
                  <Popup closeButton>
                    <div className="py-0.5 px-1.5 min-w-[200px] text-xs leading-none">
                      <p className="font-semibold text-red-800 border-b border-red-200 pb-px">Site linéaire – {p.nom_du_site || '—'}</p>
                      <p className="text-gray-600"><span className="font-medium">Protocole :</span> {p.protocole || '—'}</p>
                      {p.length_meters != null && <p className="text-red-600 font-medium text-xs">Longueur : {p.length_meters.toFixed(1)} m</p>}
                      {p.date && <p className="text-gray-500 text-xs">Créé le {p.date}</p>}
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
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
                <div className="py-0.5 px-1.5 min-w-[200px] text-xs leading-none">
                  <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-px">{p.nom_du_site || '—'}</p>
                  <p className="text-gray-600"><span className="font-medium">Protocole :</span> {p.protocole || '—'}</p>
                  {p.date && <p className="text-gray-500 text-xs">Créé le {p.date}</p>}
                  <p className="text-xs text-emerald-600 font-medium">Site d’observation</p>
                </div>
              ) : (
                <div className="py-0.5 px-1.5 min-w-[220px] text-xs leading-none">
                  <p className="font-semibold text-amber-800 border-b border-amber-200 pb-px">{p.nom_espece || '—'}</p>
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
                  {p.remarques && <p className="text-gray-500 text-xs mt-px border-t border-gray-100 pt-px">{p.remarques}</p>}
                  <p className="text-xs text-amber-600 font-medium">Observation</p>
                </div>
              )}
            </Popup>
          </Marker>
        ))}
        {path.length >= 2 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#2563eb', weight: 4 }}
        />
      )}
      {path.map((pos, i) => (
        <Marker key={i} position={pos} />
      ))}
      </MapContainer>
      <MapBaseLayerSwitcher currentLayer={baseLayerId} onChange={setBaseLayerId} dark />
      <MapLegend showUser showSites={hasSites} showObs={hasObs} showLinearSites={hasLinearSites} dark />
    </div>
  )
}
