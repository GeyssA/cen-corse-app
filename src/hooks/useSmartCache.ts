import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheOptions {
  ttl?: number // Time to live en millisecondes
  maxSize?: number // Taille maximale du cache
  staleWhileRevalidate?: boolean // Permet de servir des données obsolètes pendant la revalidation
}

export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 300000, // 5 minutes par défaut
    maxSize = 50,
    staleWhileRevalidate = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState(false)

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)

  // Nettoyer le cache si nécessaire
  const cleanCache = useCallback(() => {
    const cache = cacheRef.current
    const now = Date.now()

    // Supprimer les entrées expirées
    for (const [cacheKey, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(cacheKey)
      }
    }

    // Limiter la taille du cache
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, cache.size - maxSize)
      toDelete.forEach(([cacheKey]) => cache.delete(cacheKey))
    }
  }, [maxSize])

  // Fonction de récupération avec cache
  const fetchData = useCallback(async (forceRefresh = false) => {
    const cache = cacheRef.current
    const now = Date.now()
    const cachedEntry = cache.get(key)

    // Vérifier si on a des données en cache
    if (!forceRefresh && cachedEntry) {
      const isExpired = now - cachedEntry.timestamp > cachedEntry.ttl
      const isStaleData = now - cachedEntry.timestamp > cachedEntry.ttl / 2

      if (!isExpired) {
        // Données fraîches
        setData(cachedEntry.data)
        setError(null)
        
        if (isStaleData && staleWhileRevalidate) {
          setIsStale(true)
          // Revalider en arrière-plan
          fetchData(true)
        }
        return cachedEntry.data
      } else if (staleWhileRevalidate) {
        // Servir des données obsolètes pendant la revalidation
        setData(cachedEntry.data)
        setIsStale(true)
      }
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Créer un nouveau contrôleur d'abort
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      
      // Vérifier si la requête n'a pas été annulée
      if (!abortControllerRef.current.signal.aborted) {
        // Mettre en cache
        cache.set(key, {
          data: result,
          timestamp: now,
          ttl,
          key
        })

        setData(result)
        setIsStale(false)
        setError(null)

        // Nettoyer le cache si nécessaire
        cleanCache()

        return result
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Erreur de récupération des données')
        setError(error)
        
        // Si on a des données obsolètes, les conserver
        if (!staleWhileRevalidate || !cachedEntry) {
          setData(null)
        }
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false)
      }
    }
  }, [key, fetcher, ttl, staleWhileRevalidate, cleanCache])

  // Fonction pour invalider le cache
  const invalidate = useCallback(() => {
    cacheRef.current.delete(key)
    setData(null)
    setIsStale(false)
  }, [key])

  // Fonction pour mettre à jour le cache manuellement
  const updateCache = useCallback((newData: T) => {
    const now = Date.now()
    cacheRef.current.set(key, {
      data: newData,
      timestamp: now,
      ttl,
      key
    })
    setData(newData)
    setIsStale(false)
  }, [key, ttl])

  // Chargement initial
  useEffect(() => {
    fetchData()
    
    // Nettoyage
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  // Nettoyage périodique du cache
  useEffect(() => {
    const interval = setInterval(cleanCache, 60000) // Nettoyer toutes les minutes
    return () => clearInterval(interval)
  }, [cleanCache])

  return {
    data,
    loading,
    error,
    isStale,
    refetch: () => fetchData(true),
    invalidate,
    updateCache
  }
}

















