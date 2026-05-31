'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { watchPosition } from '@/lib/geolocation'
import { createUserPositionIcon, createCircleIcon } from '@/lib/mapIcons'
import { MapScale, MapLegend, BASE_LAYERS, MapBaseLayerSwitcher, LINEAR_SITE_PATH_OPTIONS, LINEAR_SITE_HIT_WEIGHT, type BaseLayerId } from '@/components/MapControls'
import type { MapPoint } from './ObservationsSitesMapModal'
import type { Observation } from '@/lib/observations'
import type { ObservationSite } from '@/lib/sites'
import type { SiteAire } from '@/lib/siteAires'

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
  aires: SiteAire[]
  onEditObservation?: (row: Observation) => void
  onDeleteObservation?: (row: Observation) => void
  onEditSite?: (row: ObservationSite) => void
  onDeleteSite?: (row: ObservationSite) => void
}

const DEFAULT_ZOOM = 8
const EARTH_RADIUS_M = 6371000

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPersistedUuid(id: string | undefined): boolean {
  return !!id && UUID_RE.test(id)
}

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 3) return points
  const uniq = [...new Set(points.map((p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`))]
    .map((k) => k.split(',').map(Number) as [number, number])
    .sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1])) // sort by lng then lat
  if (uniq.length <= 3) return uniq.map(([lat, lng]) => [lat, lng])

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1])

  const lower: [number, number][] = []
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (let i = uniq.length - 1; i >= 0; i -= 1) {
    const p = uniq[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  const hullLngLat = lower.slice(0, -1).concat(upper.slice(0, -1))
  return hullLngLat.map(([lat, lng]) => [lat, lng])
}

function polygonAreaSqM(latLngs: [number, number][]): number {
  if (latLngs.length < 3) return 0
  const meanLatRad =
    latLngs.reduce((sum, [lat]) => sum + (lat * Math.PI) / 180, 0) / latLngs.length
  const pts = latLngs.map(([lat, lng]) => {
    const latRad = (lat * Math.PI) / 180
    const lngRad = (lng * Math.PI) / 180
    const x = EARTH_RADIUS_M * lngRad * Math.cos(meanLatRad)
    const y = EARTH_RADIUS_M * latRad
    return [x, y] as [number, number]
  })
  let area2 = 0
  for (let i = 0; i < pts.length; i += 1) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    area2 += x1 * y2 - x2 * y1
  }
  return Math.abs(area2) / 2
}

function formatFr(value: number, digits = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export default function ObservationsSitesMapLeaflet({
  points,
  initialCenter,
  aires,
  onEditObservation,
  onDeleteObservation,
  onEditSite,
  onDeleteSite
}: ObservationsSitesMapLeafletProps) {
  const [livePosition, setLivePosition] = useState<[number, number] | null>(null)
  const [baseLayerId, setBaseLayerId] = useState<BaseLayerId>('osm')

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

  const areaPolygons = useMemo(() => {
    const siteById = new Map<string, { coords: [number, number][]; isLinear: boolean }>()
    points.forEach((p) => {
      if (p.type !== 'site') return
      const maybeLinear = p as MapPoint & { path_coordinates?: [number, number][] }
      if (maybeLinear.path_coordinates && maybeLinear.path_coordinates.length >= 2) {
        siteById.set(p.id, { coords: maybeLinear.path_coordinates, isLinear: true })
        return
      }
      siteById.set(p.id, { coords: [[p.latitude, p.longitude]], isLinear: false })
    })
    return aires
      .map((aire) => {
        const siteEntries = aire.siteIds
          .map((id) => siteById.get(id))
          .filter((c): c is { coords: [number, number][]; isLinear: boolean } => !!c)
        const coords = siteEntries.flatMap((s) => s.coords)
        const uniqCoords = [...new Set(coords.map((c) => `${c[0].toFixed(7)},${c[1].toFixed(7)}`))]
          .map((k) => k.split(',').map(Number) as [number, number])
        if (uniqCoords.length < 3) return null
        const hull = convexHull(uniqCoords)
        if (hull.length < 3) return null
        const areaSqM = polygonAreaSqM(hull)
        return {
          name: aire.name,
          protocole: aire.protocole,
          positions: hull,
          siteCount: siteEntries.length,
          areaSqM,
        }
      })
      .filter((p): p is { name: string; protocole: string; positions: [number, number][]; siteCount: number; areaSqM: number } => p != null)
  }, [points, aires])

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          key={baseLayerId}
          attribution={BASE_LAYERS[baseLayerId].attribution}
          url={BASE_LAYERS[baseLayerId].url}
        />
        <MapScale />
        {boundsPositions.length > 0 && <FitBounds positions={boundsPositions} />}
      {livePosition && (
        <Marker position={livePosition} icon={USER_ICON}>
          <Popup closeButton>
            <div className="py-0.5 px-1.5 min-w-[140px] text-xs leading-none">
              <p className="font-semibold text-blue-600">Ma position</p>
              <p className="text-gray-500">Position GPS actuelle</p>
            </div>
          </Popup>
        </Marker>
      )}
      {areaPolygons.map((area) => (
        <Polygon
          key={`area-${area.protocole}-${area.name}`}
          positions={area.positions}
          pathOptions={{
            color: '#7c3aed',
            weight: 2,
            opacity: 0.8,
            fillColor: '#a78bfa',
            fillOpacity: 0.08,
            dashArray: '10 8',
          }}
        >
          <Popup closeButton>
            <div className="py-0.5 px-1.5 min-w-[220px] text-xs leading-none">
              <p className="font-semibold text-violet-800 border-b border-violet-200 pb-px">Aire – {area.name}</p>
              <p className="text-gray-600"><span className="font-medium">Protocole :</span> {area.protocole === 'POPReptile' ? 'POP Reptile' : 'POP Amphibien'}</p>
              <p className="text-gray-600"><span className="font-medium">Nombre de sites :</span> {area.siteCount}</p>
              <p className="text-violet-700"><span className="font-medium">Superficie :</span> {formatFr(area.areaSqM, 0)} m²</p>
              <p className="text-violet-700">{formatFr(area.areaSqM / 1_000_000, 4)} km²</p>
              <p className="text-violet-700">{formatFr(area.areaSqM / 10_000, 4)} ha</p>
            </div>
          </Popup>
        </Polygon>
      ))}
      {linearSites.map((site) => {
        const pathPositions = site.path_coordinates.map((pt) => [pt[0], pt[1]] as [number, number])
        return (
          <React.Fragment key={`site-line-${site.id}`}>
            <Polyline positions={pathPositions} pathOptions={LINEAR_SITE_PATH_OPTIONS} />
            <Polyline
              positions={pathPositions}
              pathOptions={{ color: 'transparent', weight: LINEAR_SITE_HIT_WEIGHT }}
            >
              <Popup closeButton>
                <div className="py-0.5 px-1.5 min-w-[200px] text-xs leading-none">
                  <p className="font-semibold text-red-800 border-b border-red-200 pb-px">Site linéaire – {site.nom_du_site}</p>
                  <p className="text-gray-600"><span className="font-medium">Protocole :</span> {site.protocole}</p>
                  {(site as { length_meters?: number | null }).length_meters != null && (
                    <p className="text-red-600 font-medium">Longueur : {(site as { length_meters: number }).length_meters.toFixed(1)} m</p>
                  )}
                  {site.date && <p className="text-gray-500">Créé le {site.date}</p>}
                  {site.siteRow && onEditSite && onDeleteSite && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-200 pt-1.5">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-medium"
                        onClick={() => onEditSite(site.siteRow!)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-medium"
                        onClick={() => onDeleteSite(site.siteRow!)}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
          </React.Fragment>
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
                <div className="py-0.5 px-1.5 min-w-[140px] text-xs leading-none">
                  <p className="font-semibold text-blue-600">Ma position</p>
                  <p className="text-gray-500">Position GPS actuelle</p>
                </div>
              )}
              {point.type === 'site' && (
                <div className="py-0.5 px-1.5 min-w-[200px] text-xs leading-none">
                  <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-px">{(point as any).nom_du_site}</p>
                  <p className="text-gray-600"><span className="font-medium">Protocole :</span> {(point as any).protocole}</p>
                  {(point as any).date && <p className="text-gray-500">Créé le {(point as any).date}</p>}
                  <p className="text-emerald-600 font-medium">Site d’observation</p>
                  {(point as Extract<MapPoint, { type: 'site' }>).siteRow && onEditSite && onDeleteSite && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-200 pt-1.5">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-medium"
                        onClick={() => onEditSite((point as Extract<MapPoint, { type: 'site' }>).siteRow!)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-medium"
                        onClick={() => onDeleteSite((point as Extract<MapPoint, { type: 'site' }>).siteRow!)}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
              {point.type === 'observation' && (
                <div className="py-0.5 px-1.5 min-w-[220px] text-xs leading-none">
                  <p className="font-semibold text-amber-800 border-b border-amber-200 pb-px">{(point as any).nom_espece || '—'}</p>
                  <p className="text-gray-600"><span className="font-medium">Date :</span> {(point as any).date} · <span className="font-medium">Site :</span> {(point as any).site || '—'}</p>
                  {(point as any).protocole && <p className="text-gray-500"><span className="font-medium">Protocole :</span> {(point as any).protocole}</p>}
                  {(point as any).groupe && <p className="text-gray-500"><span className="font-medium">Groupe :</span> {(point as any).groupe}</p>}
                  {(point as any).effectif && <p className="text-gray-500"><span className="font-medium">Effectif :</span> {(point as any).effectif}</p>}
                  {((point as any).stade || (point as any).sexe) && (
                    <p className="text-gray-500">
                      {[(point as any).stade, (point as any).sexe].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {(point as any).observateur && <p className="text-gray-400 italic">{(point as any).observateur}</p>}
                  {(point as any).remarques && <p className="text-gray-500 border-t border-gray-100 pt-px mt-px">{(point as any).remarques}</p>}
                  <p className="text-amber-600 font-medium">Observation</p>
                  {(point as Extract<MapPoint, { type: 'observation' }>).observationRow &&
                    onEditObservation &&
                    onDeleteObservation &&
                    isPersistedUuid((point as Extract<MapPoint, { type: 'observation' }>).observationRow?.id) && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-200 pt-1.5">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded bg-amber-600 text-white text-[11px] font-medium"
                        onClick={() =>
                          onEditObservation((point as Extract<MapPoint, { type: 'observation' }>).observationRow!)
                        }
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-medium"
                        onClick={() =>
                          onDeleteObservation((point as Extract<MapPoint, { type: 'observation' }>).observationRow!)
                        }
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Popup>
          </Marker>
        )
      })}
      </MapContainer>
      {/* z bas : la modale d’édition d’observation (z-[100]) doit recouvrir Fond + Légende */}
      <MapBaseLayerSwitcher currentLayer={baseLayerId} onChange={setBaseLayerId} dark overlayZClass="z-[40]" />
      <MapLegend dark showLinearSites={linearSites.length > 0} overlayZClass="z-[40]" />
    </div>
  )
}
