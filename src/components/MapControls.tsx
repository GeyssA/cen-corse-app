'use client'

import React, { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

/** Affiche l'échelle (km / m) en bas à gauche de la carte */
export function MapScale() {
  const map = useMap()
  useEffect(() => {
    const scale = L.control.scale({ imperial: false })
    scale.addTo(map)
    return () => {
      map.removeControl(scale)
    }
  }, [map])
  return null
}

/** Fonds de carte disponibles (id → url + attribution) */
export const BASE_LAYERS = {
  osm: {
    name: 'Plan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, et contributeurs'
  },
  topo: {
    name: 'Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="https://opentopomap.org">OpenTopoMap</a>'
  }
} as const

export type BaseLayerId = keyof typeof BASE_LAYERS

/** Style des sites linéaires (tracés) : rouge, trait plein */
export const LINEAR_SITE_PATH_OPTIONS = { color: '#dc2626', weight: 6 }
/** Épaisseur de la zone de clic invisible pour les sites linéaires */
export const LINEAR_SITE_HIT_WEIGHT = 28

interface MapBaseLayerSwitcherProps {
  currentLayer: BaseLayerId
  onChange: (id: BaseLayerId) => void
  dark?: boolean
  /** z-index Tailwind (ex. z-[40]) si la carte est dans une modale avec d’autres overlays au-dessus */
  overlayZClass?: string
}

/** Sélecteur de fond de carte (plan / satellite / relief) en overlay sur la carte */
export function MapBaseLayerSwitcher({
  currentLayer,
  onChange,
  dark = false,
  overlayZClass = 'z-[1000]'
}: MapBaseLayerSwitcherProps) {
  const bg = dark ? 'bg-gray-900/90 text-gray-100' : 'bg-white/95 text-gray-800'
  const border = dark ? 'border-gray-600' : 'border-gray-200'
  const btn = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  const active = dark ? 'bg-teal-700/80 text-white' : 'bg-teal-100 text-teal-800'
  return (
    <div
      className={`absolute top-3 right-3 ${overlayZClass} rounded-lg border px-2 py-1.5 shadow-lg flex flex-col gap-0.5 ${bg} ${border}`}
      aria-label="Fond de carte"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 px-1">Fond</span>
      {(Object.keys(BASE_LAYERS) as BaseLayerId[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`text-xs px-2 py-1 rounded text-left ${currentLayer === id ? active : btn}`}
        >
          {BASE_LAYERS[id].name}
        </button>
      ))}
    </div>
  )
}

interface MapLegendProps {
  showUser?: boolean
  showSites?: boolean
  showObs?: boolean
  showLinearSites?: boolean
  dark?: boolean
  /** z-index Tailwind, aligné sur MapBaseLayerSwitcher dans les mêmes contextes */
  overlayZClass?: string
}

/** Légende flottante (overlay sur la carte) */
export function MapLegend({
  showUser = true,
  showSites = true,
  showObs = true,
  showLinearSites = false,
  dark = false,
  overlayZClass = 'z-[1000]'
}: MapLegendProps) {
  const bg = dark ? 'bg-gray-900/90 text-gray-100' : 'bg-white/95 text-gray-800'
  const border = dark ? 'border-gray-600' : 'border-gray-200'
  return (
    <div
      className={`absolute bottom-12 left-3 ${overlayZClass} rounded-lg border px-3 py-2 text-xs shadow-lg ${bg} ${border}`}
      aria-hidden
    >
      <div className="font-semibold mb-1.5 opacity-90">Légende</div>
      <div className="space-y-1">
        {showUser && (
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" className="w-4 h-5" style={{ marginBottom: -2 }}>
                <path fill="#2563eb" stroke="white" strokeWidth="1" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"/>
                <circle cx="12" cy="11" r="4" fill="white"/>
              </svg>
            </span>
            <span>Ma position</span>
          </div>
        )}
        {showSites && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow flex-shrink-0" />
            <span>Sites</span>
          </div>
        )}
        {showLinearSites && (
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-6 h-0.5 rounded-full bg-red-500 border border-white shadow" style={{ borderWidth: 1 }} />
            <span>Sites linéaires</span>
          </div>
        )}
        {showObs && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow flex-shrink-0" />
            <span>Observations</span>
          </div>
        )}
      </div>
    </div>
  )
}
