'use client'

import { useEffect, useCallback, useRef } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  networkRequests: number
  errors: number
}

interface PerformanceConfig {
  enableMonitoring: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  reportInterval: number
  maxMetrics: number
}

export function usePerformanceMonitoring(config: Partial<PerformanceConfig> = {}) {
  const {
    enableMonitoring = process.env.NODE_ENV === 'development',
    logLevel = 'info',
    reportInterval = 30000, // 30 secondes
    maxMetrics = 100
  } = config

  const metricsRef = useRef<PerformanceMetrics[]>([])
  const startTimeRef = useRef<number>(Date.now())
  const renderStartTimeRef = useRef<number>(0)
  const networkRequestCountRef = useRef<number>(0)
  const errorCountRef = useRef<number>(0)

  // Mesurer le temps de rendu
  const startRenderMeasurement = useCallback(() => {
    renderStartTimeRef.current = performance.now()
  }, [])

  const endRenderMeasurement = useCallback((componentName: string) => {
    if (!enableMonitoring) return

    const renderTime = performance.now() - renderStartTimeRef.current
    const memoryUsage = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0

    const metric: PerformanceMetrics = {
      loadTime: Date.now() - startTimeRef.current,
      renderTime,
      memoryUsage,
      networkRequests: networkRequestCountRef.current,
      errors: errorCountRef.current
    }

    metricsRef.current.push(metric)

    // Limiter le nombre de métriques stockées
    if (metricsRef.current.length > maxMetrics) {
      metricsRef.current = metricsRef.current.slice(-maxMetrics)
    }

    // Logger selon le niveau configuré
    if (shouldLog('info')) {
      console.log(`🎯 ${componentName} - Rendu: ${renderTime.toFixed(2)}ms`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        memory: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
        networkRequests: networkRequestCountRef.current,
        errors: errorCountRef.current
      })
    }

    // Avertir si le rendu est trop lent
    if (renderTime > 100 && shouldLog('warn')) {
      console.warn(`⚠️ ${componentName} - Rendu lent: ${renderTime.toFixed(2)}ms`)
    }
  }, [enableMonitoring, maxMetrics])

  // Compter les requêtes réseau
  const incrementNetworkRequests = useCallback(() => {
    networkRequestCountRef.current++
  }, [])

  // Compter les erreurs
  const incrementErrors = useCallback(() => {
    errorCountRef.current++
  }, [])

  // Vérifier si on doit logger
  const shouldLog = useCallback((level: string) => {
    const levels = ['error', 'warn', 'info', 'debug']
    return levels.indexOf(level) <= levels.indexOf(logLevel)
  }, [logLevel])

  // Générer un rapport de performance
  const generateReport = useCallback(() => {
    if (!enableMonitoring || metricsRef.current.length === 0) return null

    const metrics = metricsRef.current
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length
    const totalErrors = metrics[metrics.length - 1]?.errors || 0
    const totalNetworkRequests = metrics[metrics.length - 1]?.networkRequests || 0

    const report = {
      timestamp: new Date().toISOString(),
      totalMetrics: metrics.length,
      averageRenderTime: avgRenderTime,
      averageMemoryUsage: avgMemoryUsage,
      totalErrors,
      totalNetworkRequests,
      performanceScore: calculatePerformanceScore(avgRenderTime, avgMemoryUsage, totalErrors)
    }

    if (shouldLog('info')) {
      console.log('📊 Rapport de performance:', report)
    }

    return report
  }, [enableMonitoring, shouldLog])

  // Calculer un score de performance
  const calculatePerformanceScore = (avgRenderTime: number, avgMemoryUsage: number, totalErrors: number) => {
    let score = 100

    // Pénaliser le temps de rendu lent
    if (avgRenderTime > 50) score -= 20
    if (avgRenderTime > 100) score -= 30

    // Pénaliser l'usage mémoire élevé (si disponible)
    if (avgMemoryUsage > 0) {
      const memoryMB = avgMemoryUsage / 1024 / 1024
      if (memoryMB > 50) score -= 15
      if (memoryMB > 100) score -= 25
    }

    // Pénaliser les erreurs
    if (totalErrors > 0) score -= totalErrors * 10

    return Math.max(0, score)
  }

  // Monitoring automatique des erreurs
  useEffect(() => {
    if (!enableMonitoring) return

    const handleError = (event: ErrorEvent) => {
      incrementErrors()
      if (shouldLog('error')) {
        console.error('🚨 Erreur JavaScript:', event.error)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      incrementErrors()
      if (shouldLog('error')) {
        console.error('🚨 Promesse rejetée:', event.reason)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [enableMonitoring, incrementErrors, shouldLog])

  // Monitoring des requêtes réseau
  useEffect(() => {
    if (!enableMonitoring) return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      incrementNetworkRequests()
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime
        
        if (duration > 1000 && shouldLog('warn')) {
          console.warn(`🐌 Requête lente: ${duration.toFixed(2)}ms`, args[0])
        }
        
        return response
      } catch (error) {
        incrementErrors()
        if (shouldLog('error')) {
          console.error('🚨 Erreur réseau:', error)
        }
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [enableMonitoring, incrementNetworkRequests, incrementErrors, shouldLog])

  // Génération de rapports périodiques
  useEffect(() => {
    if (!enableMonitoring) return

    const interval = setInterval(() => {
      generateReport()
    }, reportInterval)

    return () => clearInterval(interval)
  }, [enableMonitoring, generateReport, reportInterval])

  return {
    startRenderMeasurement,
    endRenderMeasurement,
    incrementNetworkRequests,
    incrementErrors,
    generateReport,
    getMetrics: () => metricsRef.current,
    clearMetrics: () => {
      metricsRef.current = []
      networkRequestCountRef.current = 0
      errorCountRef.current = 0
      startTimeRef.current = Date.now()
    }
  }
}

















