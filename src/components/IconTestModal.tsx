'use client'

import React from 'react'

/** 12 configurations de zone safe pour l'icône adaptive Android (simulation écran d'accueil) */
const CONFIGS = [
  { id: 1, safePercent: 40, label: 'Très petite (marge max)' },
  { id: 2, safePercent: 44, label: 'Petite' },
  { id: 3, safePercent: 48, label: 'Petite +' },
  { id: 4, safePercent: 52, label: 'Actuelle (52%)' },
  { id: 5, safePercent: 55, label: 'Moyenne' },
  { id: 6, safePercent: 58, label: 'Moyenne +' },
  { id: 7, safePercent: 62, label: 'Grande' },
  { id: 8, safePercent: 66, label: 'Ancienne (66%)' },
  { id: 9, safePercent: 70, label: 'Grande +' },
  { id: 10, safePercent: 74, label: 'Très grande' },
  { id: 11, safePercent: 78, label: 'Très grande +' },
  { id: 12, safePercent: 82, label: 'Max (peut être coupée)' },
]

const LOGO_SRC = '/logo_pwa_format.png'
const PREVIEW_SIZE = 96

interface IconTestModalProps {
  isOpen: boolean
  onClose: () => void
  theme?: 'light' | 'dark'
}

export default function IconTestModal({ isOpen, onClose, theme = 'dark' }: IconTestModalProps) {
  if (!isOpen) return null

  const isLight = theme === 'light'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur ${isLight ? 'border-gray-200 bg-white/95' : 'border-gray-700/50 bg-gray-900/95'}`}>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Test icône app (12 configs)
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

        <div className="p-4 space-y-4">
          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Chaque cercle simule l’icône sur l’écran d’accueil Android. Choisis la config qui rend le logo le plus net et bien cadré, puis indique le <strong>numéro de référence</strong> (1 à 12).
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {CONFIGS.map((config) => (
              <div
                key={config.id}
                className={`flex flex-col items-center p-3 rounded-xl border ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                {/* Cercle = masque Android, logo à safePercent % du diamètre */}
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
                  style={{
                    width: PREVIEW_SIZE,
                    height: PREVIEW_SIZE,
                    background: isLight ? '#e5e7eb' : '#374151',
                  }}
                >
                  <div
                    className="flex items-center justify-center overflow-hidden"
                    style={{
                      width: `${config.safePercent}%`,
                      height: `${config.safePercent}%`,
                    }}
                  >
                    <img
                      src={LOGO_SRC}
                      alt={`Config ${config.id}`}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
                <span className={`mt-2 text-xs font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Réf. {config.id}
                </span>
                <span className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
                  Safe {config.safePercent}%
                </span>
              </div>
            ))}
          </div>

          <div className={`text-xs p-3 rounded-lg ${isLight ? 'bg-blue-50 text-blue-800' : 'bg-blue-900/20 text-blue-200'}`}>
            <strong>À faire :</strong> dis-moi « Config X » ou « Réf. X » (avec X entre 1 et 12) pour que j’applique cette valeur au prochain build d’icônes.
          </div>
        </div>
      </div>
    </div>
  )
}

export { CONFIGS }
