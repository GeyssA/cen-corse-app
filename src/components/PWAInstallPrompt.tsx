'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt()
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ Application installée avec succès')
        setIsInstalled(true)
        setShowInstallPrompt(false)
      } else {
        console.log('❌ Installation refusée par l\'utilisateur')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation:', error)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  // Ne pas afficher si l'app est déjà installée ou si pas de prompt
  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-slide-up">
        <div className="flex items-start space-x-3">
          {/* Icône */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Installer CEN Corse
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Ajoutez l'application à votre écran d'accueil pour un accès rapide et une utilisation hors ligne.
            </p>

            {/* Boutons */}
            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95"
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-slate-500 text-xs font-medium hover:text-slate-700 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 