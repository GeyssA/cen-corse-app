'use client'

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Support {
  id: string
  title: string
  description: string
  coverImage: string
  images: string[]
  pdfUrl?: string
  category: string
}

// Données des supports d'informations organisées par catégories
const supportsData: Support[] = [
  {
    id: "1",
    title: "REVUE ESPÈCES : L'origine du Crapaud Vert en Corse",
    description: "Découvrez l'histoire fascinante du Crapaud Vert (Bufotes viridis balearicus) et son origine en Corse à travers cette article détaillé.",
    coverImage: "/Nos fascicules/REVUE BVI PAGE 1.png",
    images: [
      "/Nos fascicules/REVUE BVI PAGE 1.png",
      "/Nos fascicules/REVUE BVI PAGE 2.png",
      "/Nos fascicules/REVUE BVI PAGE 3.png"
    ],
    category: "Herpétologie"
  },
  {
    id: "2",
    title: "La Buglosse crépue (Anchusa crispa) - Espèce de la flore insulaire corse",
    description: "Découvrez cette espèce endémique de la flore corse : description, habitat, menaces et bons gestes pour sa préservation.",
    coverImage: "/Nos fascicules/Anchusa_crispa_fleur.jpg",
    images: [
      "/Nos fascicules/PAGE 1_recto_GP_AC.png",
      "/Nos fascicules/PAGE 2_verso_GP_AC.png"
    ],
    category: "Flore"
  },
  {
    id: "3",
    title: "Les Statices de Corse (Limonium sp.) - Espèces menacées de la flore insulaire",
    description: "Découvrez ces espèces menacées de la flore insulaire corse qui font l'objet d'un Plan National d'Action (PNA) : description, habitat, menaces et actions de conservation.",
    coverImage: "/Nos fascicules/photo_limonium.jpg",
    images: [
      "/Nos fascicules/PAGE 1_LIMONIUM.png",
      "/Nos fascicules/PAGE 2_LIMONIUM.png"
    ],
    category: "Flore"
  },
  {
    id: "4",
    title: "Le Silène velouté (Silene velutina) - Espèce de la flore insulaire corse",
    description: "Découvrez cette espèce endémique de la flore corse : description, habitat, menaces et bons gestes pour sa préservation.",
    coverImage: "/Nos fascicules/SILENE VELOUTE.jpg",
    images: [
      "/Nos fascicules/PAGE1-SILENE-VELOUTE (1).png",
      "/Nos fascicules/PAGE2-SILENE-VELOUTE (2).png"
    ],
    category: "Flore"
  },
  {
    id: "5",
    title: "RAPPORT D'ACTIVITÉ 2024",
    description: "Découvrez les activités et réalisations du CEN Corse en 2024 : projets, études, actions de conservation et perspectives d'avenir.",
    coverImage: "",
    images: [],
    pdfUrl: "/Rapport d'activité 2024_compressed.pdf",
    category: "Fascicule CEN"
  }
]

// Composant pour afficher un support - Design simple et efficace
const SupportCard = memo(function SupportCard({ 
  support, 
  onClick 
}: { 
  support: Support
  onClick: (support: Support) => void 
}) {
  const { theme } = useTheme()

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(support)
  }, [support, onClick])

  // Design compact pour les PDFs sans image de couverture
  if (!support.coverImage) {
    return (
      <div 
        className={`group relative rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
          theme === 'light' 
            ? 'bg-white border border-gray-200' 
            : 'bg-gray-800/80 backdrop-blur-sm'
        } p-4`}
      >
        {/* Badge catégorie */}
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md mb-2 ${
          theme === 'light' 
            ? 'bg-gray-100 text-gray-600' 
            : 'bg-gray-700 text-gray-300'
        }`}>
          {support.category}
        </span>
        
        {/* Titre */}
        <h3 className={`text-sm font-medium mb-3 ${
          theme === 'light' ? 'text-gray-900' : 'text-gray-200'
        }`}>
          {support.title}
        </h3>
        
        {/* Description complète sans troncature */}
        <p className={`text-xs leading-relaxed mb-3 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-400'
        }`}>
          {support.description}
        </p>
         
        {/* Boutons de même taille */}
        <div className="flex gap-2">
          <button
            onClick={handleViewClick}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Voir
          </button>
          
          {support.pdfUrl ? (
            <a
              href={support.pdfUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                theme === 'light'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
              }`}
            >
              Télécharger
            </a>
          ) : support.images.length > 0 && (
            <button
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                
                // Créer un ZIP avec toutes les images
                try {
                  const JSZip = (await import('jszip')).default
                  const zip = new JSZip()
                  
                  // Ajouter chaque image au ZIP
                  for (let idx = 0; idx < support.images.length; idx++) {
                    const img = support.images[idx]
                    const response = await fetch(img)
                    const blob = await response.blob()
                    const fileName = `page_${idx + 1}.${img.split('.').pop()}`
                    zip.file(fileName, blob)
                  }
                  
                  // Générer et télécharger le ZIP
                  const zipBlob = await zip.generateAsync({ type: 'blob' })
                  const link = document.createElement('a')
                  link.href = URL.createObjectURL(zipBlob)
                  link.download = `${support.title.replace(/[^a-z0-9]/gi, '_')}.zip`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(link.href)
                } catch (error) {
                  console.error('Erreur lors de la création du ZIP:', error)
                  // Fallback: téléchargement séquentiel
                  support.images.forEach((img, idx) => {
                    setTimeout(() => {
                      const link = document.createElement('a')
                      link.href = img
                      link.download = `${support.title.replace(/[^a-z0-9]/gi, '_')}_page_${idx + 1}`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }, idx * 500)
                  })
                }
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                theme === 'light'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
              }`}
            >
              Télécharger
            </button>
          )}
        </div>
      </div>
    )
  }

  // Design standard avec image pour les autres supports
  return (
    <div 
      className={`group relative rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
    >
      {/* Photo visible */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={support.coverImage}
          alt={support.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badge catégorie discret */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-md backdrop-blur-sm ${
            theme === 'light' 
              ? 'bg-white/80 text-gray-600' 
              : 'bg-gray-800/80 text-gray-300'
          }`}>
            {support.category}
          </span>
        </div>
      </div>

      {/* Contenu discret */}
       <div className={`p-4 ${
         theme === 'light' 
           ? 'bg-white border-t border-gray-200' 
           : 'bg-gray-800/80 backdrop-blur-sm'
       }`}>
        <h3 className={`text-sm font-medium mb-2 line-clamp-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-gray-200'
         }`}>
           {support.title}
         </h3>
        
        <p className={`text-xs leading-relaxed mb-4 line-clamp-3 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-400'
         }`}>
           {support.description}
         </p>
         
        {/* Boutons de même taille */}
         <div className="flex gap-2">
           <button
            onClick={handleViewClick}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
               theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
             }`}
           >
            Voir
           </button>
          
           {support.pdfUrl ? (
             <a
               href={support.pdfUrl}
               download
               onClick={(e) => e.stopPropagation()}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                 theme === 'light'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
               }`}
             >
              Télécharger
             </a>
           ) : support.images.length > 0 && (
             <button
               onClick={async (e) => {
                 e.preventDefault()
                 e.stopPropagation()
                 
                 // Créer un ZIP avec toutes les images
                 try {
                   const JSZip = (await import('jszip')).default
                   const zip = new JSZip()
                   
                   // Ajouter chaque image au ZIP
                   for (let idx = 0; idx < support.images.length; idx++) {
                     const img = support.images[idx]
                     const response = await fetch(img)
                     const blob = await response.blob()
                     const fileName = `page_${idx + 1}.${img.split('.').pop()}`
                     zip.file(fileName, blob)
                   }
                   
                   // Générer et télécharger le ZIP
                   const zipBlob = await zip.generateAsync({ type: 'blob' })
                   const link = document.createElement('a')
                   link.href = URL.createObjectURL(zipBlob)
                   link.download = `${support.title.replace(/[^a-z0-9]/gi, '_')}.zip`
                   document.body.appendChild(link)
                   link.click()
                   document.body.removeChild(link)
                   URL.revokeObjectURL(link.href)
                 } catch (error) {
                   console.error('Erreur lors de la création du ZIP:', error)
                   // Fallback: téléchargement séquentiel
                   support.images.forEach((img, idx) => {
                     setTimeout(() => {
                       const link = document.createElement('a')
                       link.href = img
                       link.download = `${support.title.replace(/[^a-z0-9]/gi, '_')}_page_${idx + 1}`
                       document.body.appendChild(link)
                       link.click()
                       document.body.removeChild(link)
                     }, idx * 500)
                   })
                 }
               }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                 theme === 'light'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
               }`}
             >
              Télécharger
             </button>
           )}
         </div>
       </div>
    </div>
  )
})

// Modal plein écran avec zoom et pan (style Messenger)
const SupportModal = memo(function SupportModal({ 
  support, 
  isOpen, 
  onClose 
}: { 
  support: Support | null
  isOpen: boolean
  onClose: () => void 
}) {
  const { theme } = useTheme()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)

  // Réinitialiser le zoom et la position lors du changement d'image
  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handlePrevImage = useCallback(() => {
    if (support?.images && support.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? support.images.length - 1 : prev - 1
      )
      resetZoom()
    }
  }, [support, resetZoom])

  const handleNextImage = useCallback(() => {
    if (support?.images && support.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === support.images.length - 1 ? 0 : prev + 1
      )
      resetZoom()
    }
  }, [support, resetZoom])

  // Gestion du zoom avec la molette
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(1, scale + delta), 5)
    setScale(newScale)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  // Gestion du drag pour déplacer l'image
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, scale, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Gestion du pinch-to-zoom sur mobile
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStartZoom = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      setLastTouchDistance(getTouchDistance(e.touches))
    }
  }, [])

  const handleTouchMoveZoom = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      e.preventDefault()
      const currentDistance = getTouchDistance(e.touches)
      const delta = (currentDistance - lastTouchDistance) * 0.01
      const newScale = Math.min(Math.max(1, scale + delta), 5)
      setScale(newScale)
      setLastTouchDistance(currentDistance)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    }
  }, [lastTouchDistance, scale])

  const handleTouchEndZoom = useCallback(() => {
    setLastTouchDistance(null)
  }, [])

  // Double-tap pour zoomer/dézoomer
  const [lastTap, setLastTap] = useState(0)
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTap < 300) {
      if (scale === 1) {
        setScale(2)
      } else {
        resetZoom()
      }
    }
    setLastTap(now)
  }, [lastTap, scale, resetZoom])

  // Gestion du swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleNextImage()
    }
    if (isRightSwipe) {
      handlePrevImage()
    }
  }

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'ArrowLeft') {
        handlePrevImage()
      } else if (e.key === 'ArrowRight') {
        handleNextImage()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrevImage, handleNextImage, onClose])

  if (!isOpen || !support) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Bouton fermer */}
          <button
            onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

      {/* Indicateur de zoom */}
      {scale > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Boutons de contrôle zoom */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => {
            const newScale = Math.min(scale + 0.5, 5)
            setScale(newScale)
          }}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          title="Zoom +"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={() => {
            const newScale = Math.max(scale - 0.5, 1)
            setScale(newScale)
            if (newScale === 1) setPosition({ x: 0, y: 0 })
          }}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          title="Zoom -"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        {scale > 1 && (
          <button
            onClick={resetZoom}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            title="Réinitialiser"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation gauche */}
      {support.images && support.images.length > 1 && (
                    <button
                      onClick={handlePrevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
      )}

      {/* Navigation droite */}
      {support.images && support.images.length > 1 && (
                    <button
                      onClick={handleNextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
      )}

      {/* Conteneur avec zoom et pan (style Messenger) */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          handleTouchStartZoom(e)
          handleTouchStart(e)
          handleDoubleTap()
        }}
        onTouchMove={(e) => {
          handleTouchMoveZoom(e)
          handleTouchMove(e)
        }}
        onTouchEnd={(e) => {
          handleTouchEndZoom()
          handleTouchEnd()
        }}
        style={{ cursor: scale > 1 ? 'move' : 'default' }}
      >
        {support.images && support.images.length > 0 ? (
          <img
            src={support.images[currentImageIndex]}
            alt={`${support.title} - Page ${currentImageIndex + 1}`}
            className="max-w-full max-h-screen object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            draggable={false}
          />
        ) : support.pdfUrl ? (
          <iframe
            src={support.pdfUrl}
            className="w-full h-screen"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              border: 'none'
            }}
            title={support.title}
          />
        ) : null}
      </div>
              
      {/* Indicateurs de pages */}
      {support.images && support.images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {support.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex
                  ? 'bg-white'
                  : 'bg-white/50'
                      }`}
                    />
                  ))}
            </div>
          )}

      {/* Compteur de pages */}
      {support.images && support.images.length > 1 && (
        <div className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          {currentImageIndex + 1} / {support.images.length}
        </div>
      )}
    </div>
  )
})

// Composant principal
const RessourcesContent = memo(function RessourcesContent() {
  const { theme } = useTheme()
  const [selectedSupport, setSelectedSupport] = useState<Support | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Fascicule CEN')

  // Onglets thématiques élégants avec émojis et logo
  const thematicTabs = useMemo(() => [
    {
      id: 'fascicules-cen',
      name: 'Fascicule CEN',
      icon: (
        <img 
          src="/Nos fascicules/small_cen-removebg-preview.png" 
          alt="CEN Corse" 
          className="w-6 h-6 object-contain"
        />
      ),
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700'
    },
    {
      id: 'herpetologie',
      name: 'Herpétologie',
      icon: '🦎',
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'from-green-600 to-green-700'
    },
    {
      id: 'oiseaux',
      name: 'Oiseaux',
      icon: '🦅',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700'
    },
    {
      id: 'eau',
      name: 'Eau',
      icon: '💧',
      gradient: 'from-cyan-500 to-cyan-600',
      hoverGradient: 'from-cyan-600 to-cyan-700'
    },
    {
      id: 'flore',
      name: 'Flore',
      icon: '🌺',
      gradient: 'from-pink-500 to-pink-600',
      hoverGradient: 'from-pink-600 to-pink-700'
    }
  ], [])

  // Filtrage des supports
  const filteredSupports = useMemo(() => {
    return supportsData.filter(support => {
      const matchesSearch = support.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           support.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = support.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const handleSupportClick = useCallback((support: Support) => {
    setSelectedSupport(support)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedSupport(null)
  }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 py-1">
        {/* Onglets thématiques élégants - une seule ligne avec symboles uniquement */}
        <div className="mb-8">
          <div className="flex justify-center gap-4">
            {thematicTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.name)}
                className={`group relative w-16 h-16 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 flex items-center justify-center ${
                  selectedCategory === tab.name
                    ? 'bg-gray-300/80 text-gray-800 shadow-xl'
                    : theme === 'light'
                      ? 'bg-white/60 text-gray-700 hover:bg-white/80 backdrop-blur-sm border border-white/20'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700/20'
                }`}
                title={tab.name}
              >
                <div className={`text-2xl transition-all duration-300 ${
                  selectedCategory === tab.name ? 'scale-130' : 'scale-100'
                }`}>
                  {tab.icon}
                </div>
                {selectedCategory === tab.name && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des supports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {filteredSupports.map(support => (
            <SupportCard
              key={support.id}
              support={support}
              onClick={handleSupportClick}
            />
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredSupports.length === 0 && (
          <div className="text-center py-12">
            <p className={`text-lg ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              Aucun document trouvé pour votre recherche.
            </p>
          </div>
        )}
      </div>

      {/* Modal avec swipe */}
      <SupportModal
        support={selectedSupport}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
})

export default RessourcesContent
