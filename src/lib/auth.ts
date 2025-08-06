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
    
    const profileData = {
      id: userId,
      email: userData.email,
      full_name: userData.user_metadata?.full_name || null,
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

// Fonction pour obtenir le profil utilisateur
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      // Si le profil n'existe pas, on essaie de le créer
      if (error.code === 'PGRST116') { // Code pour "not found"
        // Récupérer les données utilisateur
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          return await createProfile(userId, userData.user)
        }
      }
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
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