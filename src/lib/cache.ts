'use client'

import { Project } from './projects'
import { Activity } from './activities'

// Types pour le cache
interface CacheData {
  projects: Project[]
  activities: Activity[]
  lastUpdated: number
  version: string
}

interface CacheConfig {
  maxAge: number // en millisecondes
  version: string
}

const CACHE_CONFIG: CacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  version: '1.0.0'
}

const CACHE_KEY = 'cen-corse-data-cache'

// Vérifier si le cache est valide
function isCacheValid(cacheData: CacheData): boolean {
  const now = Date.now()
  const age = now - cacheData.lastUpdated
  
  return age < CACHE_CONFIG.maxAge && cacheData.version === CACHE_CONFIG.version
}

// Récupérer les données du cache
export function getCachedData(): CacheData | null {
  try {
    if (typeof window === 'undefined') return null
    
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const cacheData: CacheData = JSON.parse(cached)
    
    if (!isCacheValid(cacheData)) {
      console.log('🗑️ Cache expiré, suppression...')
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    console.log('✅ Cache valide trouvé:', {
      projects: cacheData.projects.length,
      activities: cacheData.activities.length,
      age: Math.round((Date.now() - cacheData.lastUpdated) / 1000) + 's'
    })
    
    return cacheData
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache:', error)
    return null
  }
}

// Sauvegarder les données dans le cache
export function setCachedData(projects: Project[], activities: Activity[]): void {
  try {
    if (typeof window === 'undefined') return
    
    const cacheData: CacheData = {
      projects,
      activities,
      lastUpdated: Date.now(),
      version: CACHE_CONFIG.version
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('💾 Données mises en cache:', {
      projects: projects.length,
      activities: activities.length
    })
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du cache:', error)
  }
}

// Vider le cache
export function clearCache(): void {
  try {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(CACHE_KEY)
    console.log('🗑️ Cache vidé')
  } catch (error) {
    console.error('❌ Erreur lors du vidage du cache:', error)
  }
}

// Vider le cache et forcer le rechargement
export function clearCacheAndReload(): void {
  clearCache()
  // Déclencher un événement pour forcer le rechargement
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cacheCleared'))
  }
}

// Vider le cache et rediriger vers l'authentification
export function clearCacheAndRedirectToAuth(): void {
  clearCache()
  if (typeof window !== 'undefined') {
    console.log('🔄 Cache vidé et redirection vers /auth')
    window.location.href = '/auth'
  }
}

// Vérifier si on est en ligne
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

// Attendre que la connexion soit rétablie
export function waitForConnection(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve()
      return
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline)
      resolve()
    }
    
    window.addEventListener('online', handleOnline)
  })
}

// Fonction utilitaire pour gérer les requêtes avec cache
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  fallbackFn?: () => T | null
): Promise<T | null> {
  try {
    // Essayer de récupérer depuis le réseau
    const data = await fetchFn()
    return data
  } catch (error) {
    console.log(`❌ Erreur réseau pour ${key}:`, error)
    
    // Si on est hors ligne et qu'on a un fallback, l'utiliser
    if (!isOnline() && fallbackFn) {
      console.log(`🔄 Utilisation du fallback pour ${key}`)
      return fallbackFn()
    }
    
    throw error
  }
}
