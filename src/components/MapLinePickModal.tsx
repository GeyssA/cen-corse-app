'use client'

import React, { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import dynamic from 'next/dynamic'
import { polylineLengthMeters } from '@/lib/geoUtils'

const CORSICA_CENTER: [number, number] = [42.1, 9.1]

const MapLinePickContent = dynamic(
  () => import('./MapLinePickContent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-500">Chargement de la carte…</p>
      </div>
    )
  }
)

export interface LinePickResult {
  path: [number, number][]
  lengthMeters: number
}

interface MapLinePickModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (result: LinePickResult) => void
  initialCenter?: [number, number]
  initialPath?: [number, number][]
  existingPoints?: import('./MapPickContent').ExistingMapPoint[]
  existingPointsLoaded?: boolean
}

export default function MapLinePickModal({
  isOpen,
  onClose,
  onConfirm,
  initialCenter,
  initialPath,
  existingPoints,
  existingPointsLoaded
}: MapLinePickModalProps) {
  const { theme } = useTheme()
  const [path, setPath] = useState<[number, number][]>([])
  const isLight = theme === 'light'

  // Ne synchroniser le path que lorsque le modal s'ouvre (évite la boucle si initialPath est une nouvelle ref à chaque rendu)
  React.useEffect(() => {
    if (isOpen) {
      setPath(Array.isArray(initialPath) && initialPath.length > 0 ? [...initialPath] : [])
    }
  }, [isOpen])

  const lengthMeters = polylineLengthMeters(path)

  const handleConfirm = useCallback(() => {
    if (path.length >= 2) {
      onConfirm({ path, lengthMeters })
      setPath([])
      onClose()
    }
  }, [path, lengthMeters, onConfirm, onClose])

  const handleClose = useCallback(() => {
    setPath([])
    onClose()
  }, [onClose])

  const removeLastPoint = useCallback(() => {
    setPath((p) => (p.length <= 1 ? [] : p.slice(0, -1)))
  }, [])

  const clearPath = useCallback(() => setPath([]), [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[102] flex flex-col bg-black/70 backdrop-blur-sm safe-area-modal">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}
      >
        <h2
          className={`text-lg font-semibold ${
            isLight ? 'text-gray-800' : 'text-white'
          }`}
        >
          Tracer le site linéaire (cliquez pour ajouter des points)
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className={`p-2 rounded-full transition-colors ${
            isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-gray-700 text-gray-300'
          }`}
          aria-label="Fermer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Affichage de la longueur */}
      <div
        className={`shrink-0 px-4 py-2 border-b flex items-center justify-between gap-2 ${
          isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-700/50'
        }`}
      >
        <span
          className={`text-sm font-medium ${
            isLight ? 'text-amber-800' : 'text-amber-200'
          }`}
        >
          Longueur du tracé : <strong>{lengthMeters.toFixed(1)} m</strong>
        </span>
        {path.length > 0 && (
          <span className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
            {path.length} point{path.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <MapLinePickContent
          initialCenter={initialCenter ?? CORSICA_CENTER}
          path={path}
          onPathChange={setPath}
          existingPoints={existingPoints}
          existingPointsLoaded={existingPointsLoaded}
        />
      </div>

      <div
        className={`shrink-0 p-4 border-t flex flex-col gap-2 ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={removeLastPoint}
            disabled={path.length === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
              isLight
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50'
            }`}
          >
            Supprimer le dernier point
          </button>
          <button
            type="button"
            onClick={clearPath}
            disabled={path.length === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
              isLight
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50'
            }`}
          >
            Recommencer
          </button>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className={`flex-1 py-3 rounded-xl text-sm font-medium ${
              isLight
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={path.length < 2}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider cette ligne
          </button>
        </div>
      </div>
    </div>
  )
}
