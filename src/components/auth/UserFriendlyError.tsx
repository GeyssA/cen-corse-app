'use client'

import React, { useState } from 'react'

interface UserFriendlyErrorProps {
  error: string
  userFriendlyError: string
  debug?: any
}

export default function UserFriendlyError({ error, userFriendlyError, debug }: UserFriendlyErrorProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      {/* Message utilisateur compréhensible */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-red-800 text-sm font-medium">
            {userFriendlyError || 'Une erreur s\'est produite'}
          </p>
          
          {/* Bouton pour voir les détails techniques */}
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="mt-2 text-xs text-red-600 hover:text-red-700 underline focus:outline-none"
          >
            {showTechnicalDetails ? 'Masquer les détails techniques' : 'Voir les détails techniques'}
          </button>
          
          {/* Détails techniques (cachés par défaut) */}
          {showTechnicalDetails && (
            <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
              <p className="text-red-700 text-xs font-mono mb-2">
                <strong>Erreur technique :</strong>
              </p>
              <p className="text-red-600 text-xs mb-2">{error}</p>
              {debug && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                    Détails complets (JSON)
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded overflow-x-auto border border-red-200">
                    {JSON.stringify(debug, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 