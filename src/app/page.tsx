'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { useAuth } from '@/contexts/AuthContext'
import { useOfflineSync } from '@/hooks/useOfflineSync'

// Liste des photos disponibles
const PHOTOS = [
  '/photos_page_accueil/image.png',
  '/photos_page_accueil/20250402_094519.jpg',
  '/photos_page_accueil/crapaud vert, lucciana, 2011 N Hamoric 3.jpg'
]

// Composant pour afficher une photo aléatoire
function RandomPhoto() {
  const [selectedPhoto, setSelectedPhoto] = useState<string>('')

  useEffect(() => {
    // Sélectionner une photo aléatoire au chargement
    const randomIndex = Math.floor(Math.random() * PHOTOS.length)
    setSelectedPhoto(PHOTOS[randomIndex])
  }, [])

  if (!selectedPhoto) {
    return (
      <div className="w-64 h-40 bg-gray-200 rounded-none shadow-lg animate-pulse">
        <div className="w-full h-full bg-gray-300"></div>
      </div>
    )
  }

  return (
    <img 
      src={selectedPhoto} 
      alt="Paysage CEN Corse" 
      className="w-64 h-40 object-cover rounded-none shadow-lg"
    />
  )
}

// Composant bandelette d'adhésion
function AdhesionBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animation d'apparition avec délai
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`w-full bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      {/* Formes de fond animées - petits ronds avec couleur CEN Corse */}
      <div className="relative">
        <div className="absolute top-2 left-4 w-3 h-3 bg-green-600/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1 right-6 w-2 h-2 bg-orange-500/15 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1 left-1/3 w-2.5 h-2.5 bg-green-600/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3 right-1/4 w-1.5 h-1.5 bg-orange-400/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-orange-500/10 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Contenu principal */}
        <div className="max-w-md mx-auto px-6 py-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-600 text-xs font-medium">Envie de nous soutenir ?</span>
                <span className="text-slate-800 text-sm font-bold">Devenez adhérent CEN Corse</span>
              </div>
            </div>
            
            <a 
              href="https://www.helloasso.com/associations/conservatoire-d-espaces-naturels-de-corse-cen-corse/adhesions/campagne-adhesion-2025" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-600/10 to-orange-500/10 hover:from-green-600/20 hover:to-orange-500/20 text-green-700 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 hover:scale-105 flex items-center space-x-2 group"
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

export default function Home() {
  const { profile } = useAuth();
  const router = useRouter();
  const { isOnline, pendingSync, isSyncing, forceSync } = useOfflineSync();

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

  return (
    <ProtectedRoute>
      {/* Barre de localisation moderne avec logo */}
      <div className="w-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 h-14 overflow-hidden">
        <div className="max-w-md mx-auto px-4 py-2 h-full flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <div className="bg-white/100 backdrop-blur-sm rounded-2xl p-0.5 shadow-lg flex items-center justify-center my-4" style={{ width: '150px', height: '56px' }}>
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-30 h-26 object-contain"
                style={{ display: 'block' }}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-red-400 text-xs">📍</span>
                <div className="text-slate-300 text-xs font-medium">Borgo, Corse</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 text-xs">📞</span>
                <div className="text-slate-300 text-xs font-medium">04 95 32 71 63</div>
              </div>
            </div>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Header avec photo et logos */}
      <header className="relative backdrop-blur-xl border-b border-slate-200/50" style={{ backgroundColor: '#cce7f5' }}>
        <div className="max-w-md mx-auto px-0 py-0 relative z-10 w-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="p-0 animate-fade-in">
                <div className="flex items-center justify-start">
                  {/* Photo aléatoire à gauche */}
                  <div className="flex-shrink-0">
                    <RandomPhoto />
                  </div>
                  
                  {/* Logos de réseaux sociaux en carré 2x2 à droite */}
                  <div className="flex flex-col space-y-4 items-start justify-center h-full ml-2.5">
                    {/* Première ligne : Facebook, Instagram */}
                    <div className="flex space-x-4">
                      <a href="https://www.facebook.com/CENcorse" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow hover:bg-blue-700">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a href="https://www.instagram.com/cen_corse/" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow hover:from-purple-600 hover:to-pink-600 -ml-2">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    </div>
                    {/* Deuxième ligne : LinkedIn, small_cen.png */}
                    <div className="flex space-x-4">
                      <a href="https://www.linkedin.com/company/conservatoire-d-espaces-naturels-corse/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-blue-700 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow hover:bg-blue-800">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                      <a href="https://www.cen-corse.org/" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-black hover:bg-gray-50 -ml-2">
                        <img 
                          src="/small_cen.png" 
                          alt="CEN" 
                          className="w-9 h-9 object-contain"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Fond sombre pour la section principale */}
      <div className="bg-slate-900/95 min-h-screen w-full overflow-x-hidden">
        {/* Contenu principal avec design moderne */}
        <main className="max-w-md mx-auto px-6 pt-4 pb-2 space-y-4 w-full overflow-x-hidden">
          {/* Bandelette d'adhésion moderne - déplacée au-dessus des projets */}
          <AdhesionBanner />
          
          {/* Cartes de navigation modernes */}
          <div className="space-y-4">
            {/* Projets */}
            <Link href="/projets" className="block">
              <div className="modern-card modern-card-hover p-6 group">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {/* Icône SVG dossier scientifique */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 font-title mb-1">
                      Projets & études
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Présentation et description des projets
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Statistiques */}
            <Link href="/statistiques" className="block">
              <div className="modern-card modern-card-hover p-6 group">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {/* Icône SVG graphique linéaire */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 font-title mb-1">
                      Statistiques
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Données & analyses
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Communauté */}
            <Link href="/communaute" className="block">
              <div className="modern-card modern-card-hover p-6 group">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {/* Icône SVG réseau/collaboration */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="7" r="3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v4m0 0c-2.21 0-4 1.79-4 4m4-4c2.21 0 4 1.79 4 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 font-title mb-1">
                      Communauté
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Activités du bureau
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Actions rapides pour les admins */}
          {profile?.role === 'admin' && (
            <div className="modern-card p-6 animate-slide-in">
              <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">
                Actions rapides
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="btn-primary text-sm"
                  onClick={() => router.push('/projets?create=true')}
                >
                  Nouveau projet
                </button>
                <button 
                  className="btn-secondary text-sm"
                  onClick={() => router.push('/communaute?create=true')}
                >
                  Nouvelle activité
                </button>
              </div>
            </div>
          )}



          {/* Footer moderne */}
          <div className="w-full flex flex-col items-center justify-center py-2">
            <span className="text-slate-500 text-xs">© Designed by <span className="font-semibold text-slate-700">BukaLab</span></span>
            <img 
              src="/BukaLab.PNG" 
              alt="BukaLab" 
              className="w-3/4 max-w-sm h-auto object-contain border border-white rounded-md bg-transparent p-0.5 shadow-sm mt-1"
              style={{ display: 'inline-block' }}
            />
          </div>

          {/* Indicateur de synchronisation */}
          {!isOnline && (
            <div className="fixed top-4 right-4 z-50">
              <div className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg">
                📡 Hors ligne
              </div>
                </div>
              )}
              
          {pendingSync.length > 0 && (
            <div className="fixed top-4 left-4 z-50">
              <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg flex items-center space-x-2">
                <span>🔄 {pendingSync.length} en attente</span>
                {isOnline && !isSyncing && (
                  <button
                    onClick={forceSync}
                    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                  >
                    Sync
                    </button>
                )}
            </div>
          </div>
        )}

          {/* Prompt d'installation PWA */}
          <PWAInstallPrompt />
                </main>
        </div>
    </ProtectedRoute>
  )
} 