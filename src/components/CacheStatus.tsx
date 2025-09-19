'use client'

import React, { useState, useEffect } from 'react'
import { getCachedData, clearCache, isOnline, clearCacheAndRedirectToAuth } from '@/lib/cache'

export default function CacheStatus() {
  const [cacheInfo, setCacheInfo] = useState<{
    hasCache: boolean
    projects: number
    activities: number
    lastUpdated: string
  } | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateCacheInfo = () => {
      const cached = getCachedData()
      if (cached) {
        setCacheInfo({
          hasCache: true,
          projects: cached.projects.length,
          activities: cached.activities.length,
          lastUpdated: new Date(cached.lastUpdated).toLocaleTimeString('fr-FR')
        })
      } else {
        setCacheInfo({
          hasCache: false,
          projects: 0,
          activities: 0,
          lastUpdated: ''
        })
      }
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Vérifier le statut initial
    setIsOnline(navigator.onLine)
    updateCacheInfo()

    // Écouter les changements
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(updateCacheInfo, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleClearCache = () => {
    clearCache()
    setCacheInfo({
      hasCache: false,
      projects: 0,
      activities: 0,
      lastUpdated: ''
    })
  }

  const handleResetApp = () => {
    clearCacheAndRedirectToAuth()
  }

  if (!cacheInfo) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        
        {cacheInfo.hasCache ? (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div>📱 Cache: {cacheInfo.projects} projets, {cacheInfo.activities} activités</div>
            <div>🕒 Mis à jour: {cacheInfo.lastUpdated}</div>
            <div className="mt-1 space-y-1">
              <button
                onClick={handleClearCache}
                className="block text-xs text-red-600 hover:text-red-800 underline"
              >
                Vider le cache
              </button>
              <button
                onClick={handleResetApp}
                className="block text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Réinitialiser l'app
              </button>
              <button
                onClick={() => window.location.href = '/auth'}
                className="block text-xs text-green-600 hover:text-green-800 underline font-bold"
              >
                🚨 URGENCE: Aller à /auth
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Aucun cache disponible
          </div>
        )}
      </div>
    </div>
  )
}
