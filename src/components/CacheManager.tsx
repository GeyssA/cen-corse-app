'use client'

import React, { useState, useEffect } from 'react'

export default function CacheManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [cacheStatus, setCacheStatus] = useState<'unknown' | 'clearing' | 'cleared'>('unknown')

  useEffect(() => {
    // Écouter les changements de statut en ligne
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const clearCache = async () => {
    try {
      setCacheStatus('clearing')
      
      // Vider le cache du service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
      }

      // Vider le cache du navigateur
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }

      // Vider le localStorage et sessionStorage
      localStorage.clear()
      sessionStorage.clear()

      setCacheStatus('cleared')
      
      // Recharger la page après 1 seconde
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error)
      setCacheStatus('unknown')
    }
  }

  const forceRefresh = () => {
    // Forcer un refresh sans cache
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-black/90 text-white p-3 rounded-lg text-xs max-w-xs">
        <h3 className="font-bold mb-2">🗂️ Gestion du cache</h3>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={clearCache}
              disabled={cacheStatus === 'clearing'}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
            >
              {cacheStatus === 'clearing' ? 'Vidage...' : 'Vider cache'}
            </button>
            
            <button
              onClick={forceRefresh}
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
            >
              Refresh
            </button>
          </div>

          {cacheStatus === 'cleared' && (
            <div className="text-green-400 text-xs">
              ✅ Cache vidé, rechargement...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
