'use client'

import React, { useState, useEffect } from 'react'

export default function PWADebug() {
  const [pwaInfo, setPwaInfo] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Détecter si l'app est installée comme PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInApp = window.navigator.standalone === true
      const isPWA = isStandalone || isInApp

      setPwaInfo({
        isStandalone,
        isInApp,
        isPWA,
        userAgent: navigator.userAgent,
        displayMode: window.matchMedia('(display-mode: standalone)').media,
        url: window.location.href
      })

      setIsInstalled(isPWA)
    }

    checkPWA()
  }, [])

  // Ne pas afficher en production
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-black/90 text-white p-3 rounded-lg text-xs max-w-sm">
        <h3 className="font-bold mb-2">📱 Debug PWA</h3>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isInstalled ? 'PWA Installée' : 'Navigateur normal'}</span>
          </div>

          {pwaInfo && (
            <div className="text-xs space-y-1">
              <div>Standalone: {pwaInfo.isStandalone ? '✅' : '❌'}</div>
              <div>InApp: {pwaInfo.isInApp ? '✅' : '❌'}</div>
              <div>URL: {pwaInfo.url}</div>
            </div>
          )}

          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  registrations.forEach(registration => {
                    registration.unregister()
                  })
                  window.location.reload()
                })
              }
            }}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
          >
            Désactiver SW
          </button>
        </div>
      </div>
    </div>
  )
}
