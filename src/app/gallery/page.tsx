'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useTheme } from '@/contexts/ThemeContext'

// Liste des photos disponibles avec leurs noms
const PHOTOS = [
  {
    src: '/photos_page_accueil/Plaine de Linguizzetta-2025-© Geyssels A..jpg',
    name: 'Plaine de Linguizzetta\n2025\n© Geyssels A.'
  },
  {
    src: '/photos_page_accueil/Col du Monaco-Pianottoli Caldarello-2024-© Geyssels A..jpg',
    name: 'Col du Monaco\nPianottoli Caldarello\n2024\n© Geyssels A.'
  },
  {
    src: '/photos_page_accueil/Bufotes viridis balearicus-Lucciana-2011-© Hamoric N..jpg',
    name: 'Bufotes viridis balearicus\nLucciana\n2011\n© Hamoric N.'
  },
  {
    src: '/photos_page_accueil/Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
    name: 'Bufotes viridis balericus\nBoziu (1100 m)\n2025\n© Ertzscheid N.'
  },
  {
    src: '/photos_page_accueil/Amplexus de Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
    name: 'Amplexus de Bufotes viridis balericus\nBoziu (1100 m)\n2025\n© Ertzscheid N.'
  }
]

export default function Gallery() {
  const router = useRouter()
  const { theme } = useTheme()
  const [showInfo, setShowInfo] = useState(false)

  return (
    <ProtectedRoute>
      {/* Page complète avec fond flouté élégant */}
      <div 
        className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-xl overflow-y-auto"
      >
        {/* Header minimaliste et élégant */}
        <div className="relative p-6 bg-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between w-full">
            <button 
              onClick={() => router.back()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border shadow-lg ${
                theme === 'light' 
                  ? 'bg-white/90 hover:bg-white text-gray-800 border-gray-200/50' 
                  : 'bg-black/30 hover:bg-black/50 text-white border-white/30'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-white font-black font-mono tracking-[0.05em] uppercase flex-1 text-center" style={{ fontSize: '24px', transform: 'translateX(-10px)' }}>
              Galerie Photos
            </div>
            
            {/* Bouton d'infos */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border shadow-lg ${
                theme === 'light' 
                  ? 'bg-white/90 hover:bg-white text-gray-800 border-gray-200/50' 
                  : 'bg-black/30 hover:bg-black/50 text-white border-white/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Popup d'infos */}
        {showInfo && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowInfo(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl p-6 max-w-md mx-auto shadow-2xl">
              <div className="text-gray-800 space-y-4">
                <h3 className="text-lg font-semibold text-center text-blue-800">
                  💡 Informations sur la galerie
                </h3>
                <p className="text-sm leading-relaxed">
                  Le Conservatoire est heureux de valoriser le travail des photographes qui enrichissent notre galerie. Si l'un de ces clichés vous séduit, nous pouvons en réaliser pour vous des impressions grand format ou des posters.
                </p>
                <p className="text-sm leading-relaxed">
                  Avec l'accord de l'auteur et moyennant une participation financière, nous vous proposerons ces images en tirages limités pour les particuliers, ou en plus grande quantité pour les organismes.
                </p>
                <p className="text-sm leading-relaxed font-medium">
                  N'hésitez pas à nous solliciter pour donner vie à votre coup de cœur !
                </p>
              </div>
              
              {/* Bouton fermer */}
              <button
                onClick={() => setShowInfo(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-gray-200/80 hover:bg-gray-300/80 text-gray-600 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Container pour toutes les photos */}
        <div className="px-2 py-6 space-y-8">
          {PHOTOS.map((photo, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Photo en très grande taille */}
              <div className="w-full flex justify-center">
                <img 
                  src={photo.src} 
                  alt="Paysage CEN Corse" 
                  className="w-full h-auto max-h-[110vh] object-contain select-none shadow-2xl"
                  draggable={false}
                />
              </div>
              
              {/* Légende simple sous la photo */}
              <div className="text-white text-sm italic text-center mt-3 opacity-80">
                {photo.name.split('\n').map((line, index) => (
                  <p key={index} className="leading-tight">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}
