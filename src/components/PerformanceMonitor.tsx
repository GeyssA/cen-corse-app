'use client'

import React, { useEffect, useState } from 'react'
import { useAuthPerformance } from '@/hooks/useAuthPerformance'

interface PerformanceMonitorProps {
  showInProduction?: boolean
}

export default function PerformanceMonitor({ 
  showInProduction = false 
}: PerformanceMonitorProps) {
  const { metrics, isSlow } = useAuthPerformance()
  const [showDetails, setShowDetails] = useState(false)
  
  // Ne pas afficher en production sauf si explicitement demandé
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null
  }

  if (!metrics) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-3 rounded-lg shadow-lg text-xs font-mono ${
        isSlow ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isSlow ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="font-semibold">
            {isSlow ? 'LENT' : 'RAPIDE'}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {showDetails ? 'Masquer' : 'Détails'}
          </button>
        </div>
        
        {showDetails && (
          <div className="mt-2 space-y-1">
            <div>Auth: {metrics.authTime}ms</div>
            <div>Profil: {metrics.profileLoadTime}ms</div>
            <div>Total: {metrics.totalTime}ms</div>
            {isSlow && (
              <div className="text-red-600 font-semibold">
                ⚠️ Performance dégradée
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
