'use client'

import { Profile } from './auth'

const PROFILE_CACHE_KEY = 'cen-corse-profile-cache'
const PROFILE_CACHE_EXPIRATION = 10 * 60 * 1000 // 10 minutes

interface ProfileCache {
  profile: Profile
  timestamp: number
}

// Sauvegarder le profil dans le cache
export function cacheProfile(profile: Profile): void {
  try {
    if (typeof window === 'undefined') return
    
    const cacheData: ProfileCache = {
      profile,
      timestamp: Date.now()
    }
    
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData))
    console.log('💾 Profil mis en cache:', {
      role: profile.role,
      name: profile.full_name
    })
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du profil:', error)
  }
}

// Récupérer le profil depuis le cache
export function getCachedProfile(): Profile | null {
  try {
    if (typeof window === 'undefined') return null
    
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cached) return null
    
    const cacheData: ProfileCache = JSON.parse(cached)
    const age = Date.now() - cacheData.timestamp
    
    if (age > PROFILE_CACHE_EXPIRATION) {
      console.log('🗑️ Cache profil expiré, suppression...')
      localStorage.removeItem(PROFILE_CACHE_KEY)
      return null
    }
    
    console.log('✅ Profil trouvé dans le cache:', {
      role: cacheData.profile.role,
      name: cacheData.profile.full_name,
      age: Math.round(age / 1000) + 's'
    })
    
    return cacheData.profile
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache profil:', error)
    return null
  }
}

// Vider le cache du profil
export function clearProfileCache(): void {
  try {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(PROFILE_CACHE_KEY)
    console.log('🗑️ Cache profil vidé')
  } catch (error) {
    console.error('❌ Erreur lors du vidage du cache profil:', error)
  }
}

// Vérifier si le profil est en cache
export function hasCachedProfile(): boolean {
  return getCachedProfile() !== null
}
