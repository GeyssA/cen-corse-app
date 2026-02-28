'use client'

import React, { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

// Données de la galerie - version simplifiée comme avant
const galeriePhotos = [
  {
    id: "1",
    src: "/photos_page_accueil/Plaine de Linguizzetta-2025-© Geyssels A..jpg",
    name: 'Plaine de Linguizzetta',
    location: 'Plaine de Linguizzetta',
    date: '2025',
    author: '© Geyssels A.'
  },
  {
    id: "2", 
    src: "/photos_page_accueil/Col du Monaco-Pianottoli Caldarello-2024-© Geyssels A..jpg",
    name: 'Col du Monaco',
    location: 'Pianottoli Caldarello',
    date: '2024',
    author: '© Geyssels A.'
  },
  {
    id: "3",
    src: "/photos_page_accueil/Bufotes viridis balearicus-Lucciana-2011-© Hamoric N..jpg",
    name: 'Bufotes viridis balearicus',
    location: 'Lucciana',
    date: '2011',
    author: '© Hamoric N.'
  },
  {
    id: "4",
    src: "/photos_page_accueil/Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg",
    name: 'Bufotes viridis balearicus',
    location: 'Boziu (1100 m)',
    date: '2025',
    author: '© Ertzscheid N.'
  },
  {
    id: "5",
    src: "/photos_page_accueil/Amplexus de Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg",
    name: 'Amplexus de Bufotes viridis balearicus',
    location: 'Boziu (1100 m)',
    date: '2025',
    author: '© Ertzscheid N.'
  }
]

export default function GalerieContent() {
  const { theme } = useTheme()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const handleImageClick = useCallback((src: string) => {
    setSelectedImage(src)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const closeInfoModal = useCallback(() => {
    setShowInfoModal(false)
  }, [])

  return (
    <div className="space-y-6">
      {/* Bouton élégant */}
      <div className="text-center mb-4 mt-3">
        <button
          onClick={() => setShowInfoModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span>En savoir plus sur les tirages</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Grille de photos - version verticale avec légendes */}
      <div className="space-y-6">
        {galeriePhotos.map((photo) => (
          <div
            key={photo.id}
            className={`group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={() => handleImageClick(photo.src)}
          >
            <img
              src={photo.src}
              alt={photo.name}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white">
                {photo.name}
              </h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p><strong>Lieu:</strong> {photo.location}</p>
                <p><strong>Date:</strong> {photo.date}</p>
                <p><strong>Auteur:</strong> {photo.author}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'image agrandie */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Modal d'information - plein écran avec fond flouté */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`relative max-w-lg w-full rounded-2xl shadow-2xl p-8 border animate-in fade-in zoom-in duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              onClick={closeInfoModal}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-400 hover:bg-gray-500 text-white transition-all duration-200 flex items-center justify-center text-xs"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                À propos de cette galerie
              </h3>
              <p className={`text-base leading-relaxed mb-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Le CEN Corse est ravi de partager avec vous cette sélection de photographies 
                mettant en valeur la beauté de notre patrimoine naturel. Ces clichés sont 
                l'œuvre de photographes passionnés et talentueux qui nous font l'honneur 
                de collaborer avec nous.
              </p>
              <div className={`p-4 rounded-xl ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-blue-700'
                }`}>
                  <strong>Vous avez un coup de cœur ?</strong><br />
                  Avec l'accord des auteurs, nous pouvons vous proposer des tirages 
                  ou des posters de qualité. N'hésitez pas à nous contacter pour 
                  faire vivre vos moments préférés.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


