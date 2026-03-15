import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'super_admin' | 'admin' | 'visitor'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

// Fonction pour créer un profil utilisateur
export async function createProfile(userId: string, userData: User): Promise<Profile | null> {
  try {
    // Déterminer le rôle selon le type de compte
    const accountType = userData.user_metadata?.account_type as 'employee' | 'external' | undefined
    let role: 'super_admin' | 'admin' | 'visitor' = 'visitor' // Rôle par défaut
    
    if (accountType === 'employee') {
      role = 'admin' // Les employés du CEN Corse sont admins
    } else if (accountType === 'external') {
      role = 'visitor' // Les externes sont visiteurs
    }
    // Si pas de account_type spécifié, reste 'visitor' par défaut
    
    // Connexion Google/OAuth : on ne préremplit pas le nom pour afficher la modale "Prénom Nom"
    const isOAuthUser = !(userData.user_metadata?.account_type != null)
    const profileData = {
      id: userId,
      email: userData.email,
      full_name: isOAuthUser ? null : (userData.user_metadata?.full_name || null),
      role: role,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du profil:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la création du profil:', error)
    return null
  }
}

const PROFILE_STORAGE_KEY = 'cencorse_profile'

function getProfileFromStorage(userId: string): Profile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY}_${userId}`)
    if (!raw) return null
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

export function saveProfileToStorage(profile: Profile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${PROFILE_STORAGE_KEY}_${profile.id}`, JSON.stringify(profile))
  } catch {}
}

// Fonction pour obtenir le profil utilisateur - OPTIMISÉE PWA, avec cache local pour usage hors ligne
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    console.log('🔍 [getProfile] Début récupération profil pour:', userId)

    // Hors ligne : retourner le profil en cache pour garder le nom de l'observateur
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = getProfileFromStorage(userId)
      if (cached) {
        console.log('✅ [getProfile] Hors ligne, utilisation du profil en cache')
        return cached
      }
      return null
    }
    
    // Timeout de 8 secondes pour éviter les blocages PWA mais laisser le temps aux connexions lentes
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout getProfile')), 8000)
    )
    
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const result = await Promise.race([profilePromise, timeoutPromise])
    const { data, error } = result

    console.log('🔍 [getProfile] Résultat:', { hasData: !!data, hasError: !!error })

    if (error) {
      console.warn('⚠️ [getProfile] Erreur:', error.code, error.message)
      // En cas d'erreur réseau, tenter le cache local pour garder le compte utilisable hors ligne
      const cached = getProfileFromStorage(userId)
      if (cached) {
        console.log('✅ [getProfile] Erreur réseau, utilisation du profil en cache')
        return cached
      }
      // Si le profil n'existe pas, on essaie de le créer rapidement
      if (error.code === 'PGRST116') { // Code pour "not found"
        console.log('🔧 [getProfile] Profil non trouvé, création rapide...')
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const newProfile = await createProfile(userId, userData.user)
          console.log('✅ [getProfile] Profil créé:', !!newProfile)
          if (newProfile) saveProfileToStorage(newProfile)
          return newProfile
        }
      }
      return null
    }

    if (data) saveProfileToStorage(data)
    console.log('✅ [getProfile] Profil récupéré avec succès')
    return data
  } catch (error) {
    console.error('❌ [getProfile] Erreur inattendue:', error)
    const cached = getProfileFromStorage(userId)
    if (cached) return cached
    return null
  }
}

// Fonction pour mettre à jour le profil
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return null
  }
}

// Fonction pour vérifier les permissions
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'visitor': 0,
    'admin': 1,
    'super_admin': 2
  }

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy]
}

// Fonction pour obtenir le rôle d'affichage
export function getRoleDisplayName(role: string): string {
  const roleNames = {
    'super_admin': 'Administrateur en chef',
    'admin': 'Administrateur',
    'visitor': 'Visiteur'
  }
  return roleNames[role as keyof typeof roleNames] || role
} 