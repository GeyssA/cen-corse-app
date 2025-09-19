'use client'

import React, { useState, useEffect } from 'react'
import { checkSupabaseHealth, testSupabaseConnection } from '@/lib/supabase-optimized'

interface DiagnosticResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  details: string
}

export default function ConnectionDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostic = async () => {
    setIsRunning(true)
    try {
      const result = await checkSupabaseHealth()
      setDiagnostic(result)
    } catch (error) {
      setDiagnostic({
        status: 'unhealthy',
        latency: 0,
        details: `Erreur: ${error}`
      })
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    // Diagnostic automatique au chargement
    runDiagnostic()
  }, [])

  if (!diagnostic) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Diagnostic en cours...</span>
        </div>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (diagnostic.status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'unhealthy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (diagnostic.status) {
      case 'healthy': return 'Connexion excellente'
      case 'degraded': return 'Connexion lente'
      case 'unhealthy': return 'Connexion échouée'
      default: return 'Inconnu'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          {isRunning ? '...' : 'Test'}
        </button>
      </div>
      
      <div className="text-xs text-gray-300 space-y-1">
        <div>Latence: {diagnostic.latency}ms</div>
        <div className="text-xs">{diagnostic.details}</div>
      </div>
      
      {diagnostic.status === 'degraded' && (
        <div className="mt-2 text-xs text-yellow-300">
          ⚠️ Connexion lente détectée
        </div>
      )}
      
      {diagnostic.status === 'unhealthy' && (
        <div className="mt-2 text-xs text-red-300">
          ❌ Problème de connexion
        </div>
      )}
    </div>
  )
}
