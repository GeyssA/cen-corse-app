'use client'

import React, { useState, useEffect } from 'react'

interface SmartLoadingProps {
  message?: string
}

export default function SmartLoading({ message = "Chargement..." }: SmartLoadingProps) {
  const [showTimeout, setShowTimeout] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Après 15 secondes, afficher l'option de redirection
    const timeoutId = setTimeout(() => {
      setShowTimeout(true)
    }, 15000)

    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (showTimeout && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showTimeout && countdown === 0) {
      // Redirection automatique après le countdown
      window.location.href = '/auth'
    }
  }, [showTimeout, countdown])

  const handleForceRedirect = () => {
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8">
        {/* Spinner */}
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {message}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Veuillez patienter pendant que nous vérifions votre session...
        </p>

        {/* Timeout message */}
        {showTimeout && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-2">
              Le chargement prend plus de temps que prévu.
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
              Redirection automatique vers la page d'authentification dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </p>
            <button
              onClick={handleForceRedirect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Aller à la page d'authentification maintenant
            </button>
          </div>
        )}

        {/* Debug info */}
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          <p>Si le problème persiste, essayez de :</p>
          <ul className="mt-1 space-y-1">
            <li>• Fermer complètement l'application</li>
            <li>• Vider le cache du navigateur</li>
            <li>• Redémarrer votre appareil</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
