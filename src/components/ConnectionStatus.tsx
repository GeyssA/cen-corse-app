'use client'

import React, { useState, useEffect } from 'react'

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      // Masquer le statut après 3 secondes
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
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
