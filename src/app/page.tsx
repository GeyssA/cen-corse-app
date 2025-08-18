'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import OnboardingModal from '@/components/OnboardingModal'
import { useAuth } from '@/contexts/AuthContext'
import { useOfflineSync } from '@/hooks/useOfflineSync'
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

// Composant carrousel de photos
function PhotoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const router = useRouter()

  // Navigation
  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % PHOTOS.length)
  }

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + PHOTOS.length) % PHOTOS.length)
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
      nextPhoto()
    }
    if (isRightSwipe) {
      prevPhoto()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const currentPhoto = PHOTOS[currentIndex]

  return (
    <>
      {/* Carrousel principal */}
      <div 
        className="relative w-full h-40 rounded-2xl shadow-2xl overflow-hidden group cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          console.log('Clic sur le carrousel détecté')
          router.push('/gallery')
        }}
      >
        <img 
          src={currentPhoto.src} 
          alt="Paysage CEN Corse" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none pointer-events-none"
        />
        
        {/* Overlay avec gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-green-900/10 pointer-events-none"></div>
        
        {/* Boutons de navigation */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            prevPhoto()
          }}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation()
            nextPhoto()
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Indicateurs de position */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 pointer-events-none">
          {PHOTOS.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      
    </>
  )
}

// Composant bandelette d'adhésion modernisée
function AdhesionBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animation d'apparition avec délai
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`w-full glass-effect rounded-2xl overflow-hidden transition-all duration-1000 shadow-lg hover:shadow-xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      {/* Formes de fond animées - petits ronds avec couleur CEN Corse */}
      <div className="relative">
        <div className="absolute top-2 left-4 w-3 h-3 bg-gradient-to-r from-green-400/30 to-green-500/30 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-1 right-6 w-2 h-2 bg-gradient-to-r from-orange-400/25 to-orange-500/25 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-green-500/35 to-green-600/35 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3 right-1/4 w-1.5 h-1.5 bg-gradient-to-r from-orange-300/20 to-orange-400/20 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-orange-500/25 to-orange-600/25 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Contenu principal */}
        <div className="max-w-md mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-orange-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-300 text-xs font-medium">Envie de nous soutenir ?</span>
                <span className="text-white text-sm font-bold">Devenez adhérent CEN Corse</span>
              </div>
            </div>
            
            <a 
              href="https://www.helloasso.com/associations/conservatoire-d-espaces-naturels-de-corse-cen-corse/adhesions/campagne-adhesion-2025" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-600/20 to-orange-500/20 hover:from-green-600/30 hover:to-orange-500/30 text-green-400 px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm border border-green-500/30 hover:border-green-500/50 shadow-md hover:shadow-lg"
            >
              <span>Adhérer</span>
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant rapport d'activité modernisé
function RapportActiviteBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animation d'apparition avec délai
    const timer = setTimeout(() => setIsVisible(true), 700)
    return () => clearTimeout(timer)
  }, [])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/Rapport d\'activité 2024_compressed.pdf'
    link.download = 'Rapport d\'activité 2024_compressed.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`w-full glass-effect rounded-2xl overflow-hidden transition-all duration-1000 shadow-lg hover:shadow-xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      {/* Formes de fond animées - petits ronds avec couleur CEN Corse */}
      <div className="relative">
        <div className="absolute top-2 left-4 w-3 h-3 bg-gradient-to-r from-blue-400/30 to-blue-500/30 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-1 right-6 w-2 h-2 bg-gradient-to-r from-indigo-400/25 to-indigo-500/25 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-blue-500/35 to-blue-600/35 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3 right-1/4 w-1.5 h-1.5 bg-gradient-to-r from-indigo-300/20 to-indigo-400/20 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-indigo-500/25 to-indigo-600/25 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Contenu principal */}
        <div className="max-w-md mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-300 text-xs font-medium">Consultez notre</span>
                <span className="text-white text-sm font-bold">Rapport d'activité 2024</span>
              </div>
            </div>
            
            <button 
              onClick={handleDownload}
              className="inline-flex items-center space-x-1 bg-gradient-to-r from-blue-600/20 to-indigo-500/20 hover:from-blue-600/30 hover:to-indigo-500/30 text-blue-400 px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 shadow-md hover:shadow-lg"
            >
              <span>Télécharger</span>
              <svg className="w-3 h-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { profile } = useAuth();
  const router = useRouter();
  const { isOnline, pendingSync, isSyncing, forceSync } = useOfflineSync();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Vérifier si c'est la première connexion
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);


  const { theme } = useTheme();

  // Enregistrer le service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker enregistré:', registration)
        })
        .catch((error) => {
          console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error)
        })
    }
  }, [])



  // Animation de retour au début quand on arrive au dernier logo
  useEffect(() => {
    const container = document.querySelector('.overflow-x-auto') as HTMLElement;
    if (!container) return;

    const handleScroll = () => {
      const logosContainer = container.querySelector('.flex');
      if (!logosContainer) return;

      // Calculer la position exacte du dernier logo
      const logos = logosContainer.children;
      let totalWidth = 0;
      
      // Calculer la largeur jusqu'au dernier logo (sans la copie)
      for (let i = 0; i < logos.length / 2; i++) {
        totalWidth += logos[i].scrollWidth + 32; // 32px pour space-x-8
      }
      
      const containerWidth = container.clientWidth;
      const currentScroll = container.scrollLeft;
      
      // Déclencher dès qu'on dépasse le dernier logo original
      if (currentScroll >= totalWidth - containerWidth + 20) {
        // Animation de retour au tout premier logo (SHF)
        container.style.transition = 'scroll-left 0.2s ease-in-out';
        
        // Forcer le retour exact au début (premier logo SHF)
        // Utiliser setTimeout pour s'assurer que la transition est appliquée
        setTimeout(() => {
          container.scrollLeft = 0;
        }, 10);
        
        // Retirer la transition après l'animation
        setTimeout(() => {
          container.style.transition = '';
        }, 200);
      }
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [])







  return (
    <ProtectedRoute>
      {/* Barre de localisation moderne avec design futuriste */}
      <div className="w-full glass-effect border-b border-white/10 h-16 overflow-hidden">
        <div className="max-w-md mx-auto px-4 py-3 h-full flex items-center justify-between w-full -ml-1">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowOnboarding(true)}
              className={`bg-white rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                theme === 'light' ? 'border border-gray-800' : ''
              }`} 
              style={{ width: '150px', height: '56px' }}
            >
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-10/12 h-10/12 object-contain"
                style={{ display: 'block' }}
              />
            </button>
            <Link href="/presentation" className="relative px-5 py-2.5 bg-gradient-to-r from-yellow-500/80 via-orange-500/80 to-orange-600/80 backdrop-blur-sm border border-orange-300/30 rounded-full text-white text-sm font-medium tracking-wide hover:from-yellow-400/90 hover:via-orange-400/90 hover:to-orange-500/90 hover:border-orange-300/50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden group -ml-1">
              {/* Éléments décoratifs verts et bleus */}
              <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-green-400/80 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1 right-2 w-1 h-1 bg-blue-400/80 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-1/2 left-1/4 w-0.5 h-0.5 bg-green-300/70 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1.5 right-1/3 w-0.5 h-0.5 bg-blue-300/70 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              
              {/* Dégradé subtil en overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-transparent to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Texte et icône */}
              <div className="relative z-10 flex items-center space-x-2">
                <span className="whitespace-nowrap text-xs">Notre équipe</span>
                <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Header avec photo et logos - design futuriste */}
      <header className="relative glass-effect border-b border-white/10">
        <div className="max-w-md mx-auto px-2 py-0 relative z-10 w-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-start animate-fade-in">
                {/* Carrousel de photos à gauche */}
                <div className="flex-1 mr-2 pt-0.5 pb-1">
                  <PhotoCarousel />
                </div>
                
                {/* Logos de réseaux sociaux en carré 2x2 à droite */}
                <div className="flex flex-col space-y-4 items-start justify-center h-full ml-1">
                  {/* Première ligne : Facebook, Instagram */}
                  <div className="flex space-x-4">
                                          <a href="https://www.facebook.com/CENcorse" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-blue-700 hover:to-blue-800">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a href="https://www.instagram.com/cen_corse/" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 -ml-2">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  </div>
                  {/* Deuxième ligne : LinkedIn, small_cen.png */}
                  <div className="flex space-x-4">
                    <a href="https://www.linkedin.com/company/conservatoire-d-espaces-naturels-corse/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 hover:from-blue-800 hover:to-blue-900">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                                        <a href="https://www.cen-corse.org/" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 border border-white/20 hover:border-white/40 -ml-2">
                      <img 
                        src="/small_cen.png" 
                        alt="CEN" 
                        className="w-11 h-11 object-contain"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Fond adaptatif pour la section principale */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
      }`}>
        {/* Contenu principal avec design moderne */}
        <main className="max-w-lg mx-auto px-4 pt-3 pb-4 space-y-6 w-full overflow-x-hidden pl-3 pr-7 sm:pl-4 sm:pr-4">
          {/* Cartes de navigation modernes avec design futuriste */}
          <div className="space-y-4">
            {/* Projets */}
            <Link href="/projets" className="block">
              <div className="modern-card modern-card-hover p-6 group card-enter w-full rounded-2xl shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl group-hover:shadow-glow group-hover:scale-110 transition-all duration-300 animate-pulse">
                    {/* Icône SVG dossier scientifique */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white font-title mb-1 gradient-text">
                      Projets & études
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Présentation et description des projets
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-400 transition-colors transform group-hover:translate-x-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Statistiques */}
            <Link href="/statistiques" className="block">
              <div className="modern-card modern-card-hover p-6 group card-enter w-full rounded-2xl shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl group-hover:shadow-glow group-hover:scale-110 transition-all duration-300 animate-pulse">
                    {/* Icône SVG graphique linéaire */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white font-title mb-1 gradient-text">
                      Statistiques
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Données & analyses
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-purple-400 transition-colors transform group-hover:translate-x-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Communauté */}
            <Link href="/communaute" className="block">
              <div className="modern-card modern-card-hover p-6 group card-enter w-full rounded-2xl shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl group-hover:shadow-glow group-hover:scale-110 transition-all duration-300 animate-pulse">
                    {/* Icône SVG réseau/collaboration */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="7" r="3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v4m0 0c-2.21 0-4 1.79-4 4m4-4c2.21 0 4 1.79 4 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white font-title mb-1 gradient-text">
                      Communauté
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Activités du bureau
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-emerald-400 transition-colors transform group-hover:translate-x-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Boutons d'action pour les admins */}
          {profile?.role === 'admin' && (
            <div className="space-y-3 -mr-4 sm:mr-0 flex flex-col items-center">
              <button 
                className="w-4/5 btn-primary text-sm rounded-xl shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 py-4 flex items-center justify-center space-x-2"
                onClick={() => router.push('/projets?create=true')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nouveau projet</span>
              </button>
              <button 
                className="w-4/5 btn-secondary text-sm rounded-xl shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 py-4 flex items-center justify-center space-x-2"
                onClick={() => router.push('/communaute?create=true')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nouvelle activité</span>
              </button>
            </div>
          )}

          {/* Séparateur élégant */}
          <div className={`h-px bg-gradient-to-r from-transparent to-transparent ${
            theme === 'light' 
              ? 'via-gray-800/50' 
              : 'via-white/30'
          }`}></div>

          {/* Bouton Ressources */}
          <div className="flex justify-center -mr-4 sm:mr-0">
            <button 
              className={`w-4/5 text-sm rounded-xl shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 py-4 flex items-center justify-center space-x-2 ${
                theme === 'light' ? 'btn-secondary-light' : 'btn-secondary'
              }`}
              onClick={() => router.push('/supports')}
            >
              <span className="text-lg">📚</span>
              <span>Supports d'informations</span>
            </button>
          </div>

          {/* Espacement augmenté après Supports d'informations */}
          <div className="h-0"></div>

          {/* Bandelette d'adhésion moderne */}
          <div className="flex justify-end sm:block -mr-4 sm:mr-0">
            <AdhesionBanner />
          </div>

          {/* Espacement réduit entre les bandelettes */}
          <div className="h-0 -mt-4"></div>

          {/* Bandelette rapport d'activité moderne */}
          <div className="flex justify-end sm:block -mr-4 sm:mr-0">
            <RapportActiviteBanner />
          </div>

          {/* Section Nos collaborateurs & partenaires */}
          <div className={`w-screen -mx-4 sm:-mx-0 py-4 px-4 sm:px-0 mt-12 ${
            theme === 'light'
              ? 'bg-white/80'
              : 'bg-gray-400/95'
          }`}>
            <div className="text-center mb-4">
              <h3 className={`text-sm font-semibold mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-200'
              }`}>
                Nos collaborateurs & partenaires
              </h3>
            </div>
            
            <div className="relative overflow-x-auto scrollbar-hide">
              <div className="flex items-center space-x-8 animate-scroll min-w-max">
                {/* Logo SHF */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/SHF.png" 
                    alt="SHF" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Fonds Vert */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Fonds Vert.png" 
                    alt="Fonds Vert" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Eau & biodiversité */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Eau & biodiversité.png" 
                    alt="Eau & biodiversité" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo AERMC */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/AERMC.png" 
                    alt="AERMC" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Fond Maupertuis */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Fond Maupertuis.png" 
                    alt="Fond Maupertuis" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo MNHN */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/MNHN.png" 
                    alt="MNHN" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo EDF */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/EDF.png" 
                    alt="EDF" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo SOPTOM */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Logo_Soptom.png" 
                    alt="SOPTOM" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CBNC */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CBNC.jpg" 
                    alt="Conservatoire Botanique National de Corse" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CEN Lorraine */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CEN Lorraine.jpg" 
                    alt="CEN Lorraine" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CdCorse */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CdCorse.jpg" 
                    alt="Conseil départemental de Corse" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CPIE Corte */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CPIE CORTE.jpg" 
                    alt="CPIE Corte" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Biophonia */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/biophonia.png" 
                    alt="Biophonia" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo FaunaConsult */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/FaunaConsult.png" 
                    alt="FaunaConsult" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo La Poule Rousse */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/La Poule Rousse.png" 
                    alt="La Poule Rousse" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Copie pour boucle infinie */}
                {/* Logo SHF */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/SHF.png" 
                    alt="SHF" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Fonds Vert */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Fonds Vert.png" 
                    alt="Fonds Vert" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Eau & biodiversité */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Eau & biodiversité.png" 
                    alt="Eau & biodiversité" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo AERMC */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/AERMC.png" 
                    alt="AERMC" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Fond Maupertuis */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Fond Maupertuis.png" 
                    alt="Fond Maupertuis" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo MNHN */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/MNHN.png" 
                    alt="MNHN" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo EDF */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/EDF.png" 
                    alt="EDF" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo SOPTOM */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/Logo_Soptom.png" 
                    alt="SOPTOM" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CBNC */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CBNC.jpg" 
                    alt="Conservatoire Botanique National de Corse" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CEN Lorraine */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CEN Lorraine.jpg" 
                    alt="CEN Lorraine" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CdCorse */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CdCorse.jpg" 
                    alt="Conseil départemental de Corse" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo CPIE Corte */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/CPIE CORTE.jpg" 
                    alt="CPIE Corte" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo Biophonia */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/biophonia.png" 
                    alt="Biophonia" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo FaunaConsult */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/FaunaConsult.png" 
                    alt="FaunaConsult" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Logo La Poule Rousse */}
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/Logos_soutien/La Poule Rousse.png" 
                    alt="La Poule Rousse" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Indicateur de synchronisation */}
          {!isOnline && (
            <div className="fixed top-4 right-4 z-50">
              <div className="glass-effect text-orange-400 px-3 py-2 rounded-lg text-xs font-medium shadow-2xl border border-orange-500/30">
                📡 Hors ligne
              </div>
            </div>
          )}
              
          {pendingSync.length > 0 && (
            <div className="fixed top-4 left-4 z-50">
              <div className="glass-effect text-blue-400 px-3 py-2 rounded-lg text-xs font-medium shadow-2xl flex items-center space-x-2 border border-blue-500/30">
                <span>🔄 {pendingSync.length} en attente</span>
                {isOnline && !isSyncing && (
                  <button
                    onClick={forceSync}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-2 py-1 rounded text-xs transition-all duration-300 hover:scale-105"
                  >
                    Sync
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Prompt d'installation PWA */}
          <PWAInstallPrompt />

          {/* Modal d'onboarding */}
          <OnboardingModal 
            isOpen={showOnboarding} 
            onClose={() => setShowOnboarding(false)} 
          />


        </main>
      </div>
    </ProtectedRoute>
  )
} 