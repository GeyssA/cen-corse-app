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

interface MapLegendProps {
  showUser?: boolean
  showSites?: boolean
  showObs?: boolean
  dark?: boolean
}

/** Légende flottante (overlay sur la carte) */
export function MapLegend({ showUser = true, showSites = true, showObs = true, dark = false }: MapLegendProps) {
  const bg = dark ? 'bg-gray-900/90 text-gray-100' : 'bg-white/95 text-gray-800'
  const border = dark ? 'border-gray-600' : 'border-gray-200'
  return (
    <div
      className={`absolute bottom-12 left-3 z-[1000] rounded-lg border px-3 py-2 text-xs shadow-lg ${bg} ${border}`}
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
