'use client'

import React, { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import dynamic from 'next/dynamic'

const CORSICA_CENTER: [number, number] = [42.1, 9.1]

const MapPickContent = dynamic(
  () => import('./MapPickContent'),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Chargement de la carte…</p></div> }
)

interface MapPickModalProps {
  isOpen: boolean
  onClose: () => void
  onPick: (lat: number, lng: number) => void
  /** Centre initial de la carte (optionnel). */
  initialCenter?: [number, number]
}

export default function MapPickModal({ isOpen, onClose, onPick, initialCenter }: MapPickModalProps) {
  const { theme } = useTheme()
  const [position, setPosition] = useState<[number, number] | null>(null)
  const isLight = theme === 'light'

  const handleConfirm = useCallback(() => {
    if (position) {
      onPick(position[0], position[1])
      setPosition(null)
      onClose()
    }
  }, [position, onPick, onClose])

  const handleClose = useCallback(() => {
    setPosition(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[102] flex flex-col bg-black/70 backdrop-blur-sm">
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
        <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Choisir un point sur la carte
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-gray-700 text-gray-300'}`}
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-h-0 relative">
        <MapPickContent
          initialCenter={initialCenter ?? CORSICA_CENTER}
          position={position}
          onPositionChange={setPosition}
        />
      </div>
      <div className={`shrink-0 p-4 border-t flex gap-3 ${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
        <button
          type="button"
          onClick={handleClose}
          className={`flex-1 py-3 rounded-xl text-sm font-medium ${isLight ? 'bg-gray-200 text-gray-700' : 'bg-gray-700 text-gray-200'}`}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!position}
          className="flex-1 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Valider cette position
        </button>
      </div>
    </div>
  )
}
