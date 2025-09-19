'use client'

import { getProfile, Profile } from './auth'
import { cacheProfile, getCachedProfile } from './profile-cache'

/**
 * Récupérer le profil utilisateur de manière optimisée
 * Utilise le cache en priorité, puis Supabase en arrière-plan
 */
export async function getOptimizedProfile(userId: string): Promise<Profile | null> {
  // 1. Essayer le cache d'abord
  const cachedProfile = getCachedProfile()
  if (cachedProfile) {
    console.log('✅ Profil récupéré depuis le cache:', cachedProfile.role)
    
    // 2. Mettre à jour depuis Supabase en arrière-plan (sans bloquer)
    getProfile(userId).then(freshProfile => {
      if (freshProfile) {
        cacheProfile(freshProfile)
        console.log('✅ Profil mis à jour depuis Supabase en arrière-plan')
      }
    }).catch(() => {
      console.log('⚠️ Erreur mise à jour profil, on garde le cache')
    })
    
    return cachedProfile
  }
  
  // 3. Si pas de cache, essayer Supabase avec timeout court
  try {
    console.log('🌐 Récupération du profil depuis Supabase...')
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout profil')), 3000) // 3 secondes max
    )
    
    const profilePromise = getProfile(userId)
    
    const profile = await Promise.race([profilePromise, timeoutPromise]) as Profile
    
    if (profile) {
      cacheProfile(profile)
      console.log('✅ Profil récupéré depuis Supabase:', profile.role)
      return profile
    }
    
    return null
  } catch (error) {
    console.log('⚠️ Erreur récupération profil:', error)
    return null
  }
}

/**
 * Récupérer le profil de manière synchrone depuis le cache uniquement
 */
export function getCachedProfileSync(): Profile | null {
  return getCachedProfile()
}
