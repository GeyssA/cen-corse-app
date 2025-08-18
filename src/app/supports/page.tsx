'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

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
    category: "Amphibiens"
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
    title: "Le Silène velouté (Silene velutina) - Espèce patrimoniale endémique Corso-sarde",
    description: "Découvrez cette espèce patrimoniale de la flore insulaire endémique Corso-sarde menacée de disparition : description, habitat, menaces et actions de conservation.",
    coverImage: "/Nos fascicules/SILENE VELOUTE.jpg",
    images: [
      "/Nos fascicules/PAGE1-SILENE-VELOUTE (1).png",
      "/Nos fascicules/PAGE2-SILENE-VELOUTE (2).png"
    ],
    category: "Flore"
  },
  {
    id: "5",
    title: "Trame turquoise du Liamone",
    description: "Description succincte des milieux aquatiques et des espèces de reptiles et d'amphibiens présentes dans le bassin versant du Liamone.",
    coverImage: "/Nos fascicules/COLLIER_Geyssels.jpg",
    images: [
      "/Nos fascicules/COLLIER_Geyssels.jpg"
    ],
    pdfUrl: "/Nos fascicules/LIVRET-LIAMONE-VF (21 x 14.8 cm) (2).pdf",
    category: "Herpétologie"
  }
]

// Configuration des onglets
const tabs = [
  { id: "cen-corse", name: "CEN Corse", icon: "small_cen_removebg" },
  { id: "herpetologie", name: "Herpétologie", icon: "🐸🐢" },
  { id: "flore", name: "Flore", icon: "🌿" },
  { id: "eau", name: "Eau", icon: "💧" },
  { id: "oiseaux", name: "Oiseaux", icon: "🦅" }
]

// Composant modal de visualisation plein écran
function FullScreenModal({ support, isOpen, onClose }: { support: Support | null, isOpen: boolean, onClose: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0)
    }
  }, [isOpen])

  const nextImage = () => {
    if (support) {
      setCurrentImageIndex((prev) => (prev + 1) % support.images.length)
    }
  }

  const prevImage = () => {
    if (support) {
      setCurrentImageIndex((prev) => (prev - 1 + support.images.length) % support.images.length)
    }
  }

  // Gestion du swipe pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
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
      nextImage()
    }
    if (isRightSwipe) {
      prevImage()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const handleDownload = () => {
    if (support) {
      if (support.pdfUrl) {
        // Téléchargement du PDF
        const link = document.createElement('a')
        link.href = support.pdfUrl
        link.download = `${support.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Téléchargement des images
        support.images.forEach((image, index) => {
          const link = document.createElement('a')
          link.href = image
          link.download = `${support.title.replace(/[^a-zA-Z0-9]/g, '_')}_page_${index + 1}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
      }
    }
  }

  if (!isOpen || !support) return null

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Bouton télécharger */}
        <button
          onClick={handleDownload}
          className="absolute top-4 left-4 z-10 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Télécharger</span>
        </button>

        {/* Contenu principal - PDF ou Image */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {support.pdfUrl ? (
            // Affichage du PDF
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">{support.title}</h3>
                  <p className="text-gray-300 mb-6">Document PDF disponible</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg flex items-center justify-center space-x-3 transition-all duration-300 text-lg font-medium"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Télécharger le PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Affichage des images
            <>
              <img 
                src={support.images[currentImageIndex]} 
                alt={`${support.title} - Page ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Boutons de navigation pour les images */}
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Indicateurs de position - seulement pour les images */}
        {!support.pdfUrl && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {support.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Titre et compteur */}
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-sm opacity-80">{support.title}</p>
          {!support.pdfUrl && (
            <p className="text-xs opacity-60">Page {currentImageIndex + 1} sur {support.images.length}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Supports() {
  const { theme } = useTheme()
  const [selectedSupport, setSelectedSupport] = useState<Support | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("cen-corse")

  const handleOpenModal = (support: Support) => {
    setSelectedSupport(support)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSupport(null)
  }

  // Filtrer les supports selon l'onglet actif
  const getFilteredSupports = () => {
    if (activeTab === "cen-corse") {
      return supportsData.filter(support => support.category === "CEN Corse")
    } else if (activeTab === "herpetologie") {
      return supportsData.filter(support => support.category === "Amphibiens" || support.category === "Tortues" || support.category === "Herpétologie")
    } else if (activeTab === "flore") {
      return supportsData.filter(support => support.category === "Flore")
    } else if (activeTab === "eau") {
      return supportsData.filter(support => support.category === "Eau")
    } else if (activeTab === "oiseaux") {
      return supportsData.filter(support => support.category === "Oiseaux")
    }
    return []
  }

  return (
    <ProtectedRoute>
      {/* Header avec navigation */}
      <div className={`w-full glass-effect border-b h-16 overflow-hidden ${
        theme === 'light' ? 'border-gray-200/50' : 'border-white/10'
      }`}>
        <div className="max-w-md mx-auto px-4 py-3 h-full flex items-center justify-start w-full">
          <Link href="/" className="flex items-center space-x-4">
            <div className={`bg-white rounded-2xl shadow-2xl flex items-center justify-center ${
              theme === 'light' ? 'border border-gray-800' : ''
            }`} style={{ width: '150px', height: '56px' }}>
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-10/12 h-10/12 object-contain"
                style={{ display: 'block' }}
              />
            </div>
          </Link>
        </div>
      </div>

      {/* Fond adaptatif */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
      }`}>
        
        {/* Contenu principal */}
        <main className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-6 w-full overflow-x-hidden pl-4 pr-4 sm:pl-4 sm:pr-4 h-[calc(100vh-4rem)] flex flex-col">
          
          {/* Bouton retour */}
          <div className="flex items-center justify-start flex-shrink-0">
            <Link 
              href="/" 
              className={`flex items-center space-x-2 transition-colors ${
                theme === 'light' 
                  ? 'text-gray-600 hover:text-gray-800' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Retour</span>
            </Link>
          </div>

          {/* Titre principal */}
          <div className="text-center mb-6 flex-shrink-0">
            <h1 className={`text-2xl font-bold mb-2 gradient-text ${
              theme === 'light' ? 'text-gray-800' : 'text-white'
            }`}>
              Supports d'informations
            </h1>
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              Découvrez nos publications et fascicules
            </p>
          </div>

          {/* Onglets */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${tab.id === "herpetologie" ? "w-20 h-12 rounded-xl px-2" : "w-12 h-12 rounded-full"} flex items-center justify-center text-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? theme === 'light'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-blue-500/80 text-white shadow-lg'
                      : theme === 'light'
                        ? 'bg-white/80 hover:bg-white/90 border border-gray-200'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                  }`}
                  title={tab.name}
                >
                  {tab.icon === "small_cen_removebg" ? (
                    <img 
                      src="/Nos fascicules/small_cen-removebg-preview.png" 
                      alt="CEN Corse" 
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    tab.icon
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des supports */}
          <div className={`space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent pb-4`}>
            {getFilteredSupports().length > 0 ? (
              getFilteredSupports().map((support) => (
              <div 
                key={support.id} 
                className={`backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  theme === 'light' 
                    ? 'bg-white/80 border border-gray-200/50' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                                 <div className="flex">
                   {/* Image de couverture */}
                   <div className="w-1/3 flex-shrink-0">
                     <img 
                       src={support.coverImage} 
                       alt={support.title}
                       className="w-full h-full object-cover"
                     />
                   </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className={`font-bold text-sm mb-2 ${
                        theme === 'light' ? 'text-gray-800' : 'text-white'
                      }`}>
                        {support.title}
                      </h3>
                      <p className={`text-xs leading-relaxed ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      }`}>
                        {support.description}
                      </p>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex items-center space-x-2 mt-3">
                      {support.pdfUrl ? (
                        // Pour les PDFs : seulement télécharger
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = support.pdfUrl!
                            link.download = `${support.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                            theme === 'light'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                              : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Télécharger PDF</span>
                          </div>
                        </button>
                      ) : (
                        // Pour les images : voir et télécharger
                        <>
                          <button
                            onClick={() => handleOpenModal(support)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                              theme === 'light'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                                : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Voir</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              support.images.forEach((image, index) => {
                                const link = document.createElement('a')
                                link.href = image
                                link.download = `${support.title.replace(/[^a-zA-Z0-9]/g, '_')}_page_${index + 1}.png`
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              })
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                              theme === 'light'
                                ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                                : 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Télécharger</span>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
            ) : (
              /* Message si aucun support dans l'onglet actuel */
              <div className={`text-center py-4 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Aucun support disponible</p>
                <p className="text-sm">Aucun support n'est disponible pour la catégorie "{tabs.find(tab => tab.id === activeTab)?.name}".</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de visualisation plein écran */}
      <FullScreenModal 
        support={selectedSupport} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </ProtectedRoute>
  )
}
