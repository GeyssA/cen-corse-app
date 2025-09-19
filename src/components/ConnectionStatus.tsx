'use client'

import React, { useState, useEffect } from 'react'
import { clearCache } from '@/lib/cache'

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      console.log('🔄 Connexion rétablie - rechargement des données')
      setIsOnline(true)
      setShowStatus(true)
      
      // Forcer le rechargement des données après reconnexion
      setTimeout(() => {
        // NE PAS vider le cache - garder les données disponibles
        console.log('🔄 Reconnexion détectée - conservation du cache')
        
        // Déclencher un événement personnalisé pour notifier les composants
        window.dispatchEvent(new CustomEvent('connectionRestored'))
        console.log('📡 Événement de reconnexion envoyé')
      }, 1000)
      
      // Masquer le statut après 3 secondes
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      console.log('📴 Connexion perdue')
      setIsOnline(false)
      setShowStatus(true)
    }

    // Écouter les changements de statut
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérifier le statut initial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-white' : 'bg-white animate-pulse'
          }`}></div>
          <span>
            {isOnline ? 'Connexion rétablie' : 'Connexion perdue'}
          </span>
        </div>
      </div>
    </div>
  )
}
