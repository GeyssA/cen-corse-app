'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, saveProfileToStorage, Profile, AuthState } from '@/lib/auth'

// Cache simple pour les profils utilisateur (persiste tant que la session est active)
const profileCache = new Map<string, { profile: Profile; timestamp: number }>()
const PROFILE_CACHE_TTL = Infinity // Pas d'expiration - le cache reste jusqu'à déconnexion

// Fonction optimisée pour récupérer le profil avec cache et timeout PWA
const getCachedProfile = async (userId: string): Promise<Profile | null> => {
  const cached = profileCache.get(userId)
  const now = Date.now()
  
  // Vérifier si le cache est valide
  if (cached && (now - cached.timestamp) < PROFILE_CACHE_TTL) {
    return cached.profile
  }
  
  // Récupérer le profil avec timeout pour éviter les blocages PWA
  try {
    const profilePromise = getProfile(userId)
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout profil')), 8000) // 8 secondes max
    )
    
    const profile = await Promise.race([profilePromise, timeoutPromise])
    
    if (profile) {
      profileCache.set(userId, { profile, timestamp: now })
      saveProfileToStorage(profile)
    }
    
    return profile
  } catch (error) {
    console.warn('⚠️ Timeout ou erreur récupération profil:', error)
    // Retourner un profil par défaut pour éviter le blocage
    return {
      id: userId,
      email: 'user@example.com',
      full_name: 'Utilisateur',
      role: 'visitor' as const,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signInWithGoogle: () => Promise<{ error: unknown }>
  signUp: (email: string, password: string, fullName: string, accountType: 'employee' | 'external' | 'visitor') => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitializedRef = useRef(false)
  const sessionRefreshInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Détecter si on est sur PWA pour ajuster les timeouts
    const isPWA = typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false
    const timeoutDuration = isPWA ? 10000 : 5000 // 10s sur PWA, 5s sur navigateur
    
    // Timeout de sécurité adaptatif
    const safetyTimeout = setTimeout(() => {
      if (!isInitializedRef.current) {
        console.warn(`⚠️ Timeout sécurité ${isPWA ? 'PWA' : 'navigateur'} - Arrêt du loading après ${timeoutDuration/1000}s`)
        setLoading(false)
        isInitializedRef.current = true
      }
    }, timeoutDuration)

    // Récupérer la session initiale - OPTIMISÉ
    const getInitialSession = async () => {
      if (isInitializedRef.current) return
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session?.user) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          isInitializedRef.current = true
          return
        }
        
        // Session valide - charger le profil avec cache
        setUser(session.user)
        
        // Essayer de charger le profil, mais ne pas bloquer si ça échoue
        try {
          const userProfile = await getCachedProfile(session.user.id)
          setProfile(userProfile)
        } catch (error) {
          console.warn('⚠️ Erreur chargement profil, continuation sans profil:', error)
          // Continuer sans profil pour éviter le blocage
          setProfile(null)
        }
        
        setLoading(false)
        isInitializedRef.current = true
        
      } catch (error) {
        console.error('Erreur getInitialSession:', error)
        setUser(null)
        setProfile(null)
        setLoading(false)
        isInitializedRef.current = true
      }
    }

    // Fonction pour démarrer le refresh de session
    const startSessionRefresh = () => {
      // Rafraîchir la session toutes les 5 minutes
      if (sessionRefreshInterval.current) {
        clearInterval(sessionRefreshInterval.current)
      }
      
      sessionRefreshInterval.current = setInterval(async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (session && !error) {
            console.log('🔄 Session rafraîchie automatiquement')
          } else {
            console.warn('⚠️ Session expirée ou invalide')
          }
        } catch (error) {
          console.error('❌ Erreur lors du rafraîchissement de session:', error)
        }
      }, 5 * 60 * 1000) // Toutes les 5 minutes
    }

    // Écouter les changements d'authentification - OPTIMISÉ
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        const sessionData = session as { user?: User } | null
        
        setUser(sessionData?.user ?? null)
        
        if (sessionData?.user) {
          // Utiliser le cache pour éviter les requêtes multiples
          const userProfile = await getCachedProfile(sessionData.user.id)
          setProfile(userProfile)
          // Démarrer le refresh automatique de session
          startSessionRefresh()
        } else {
          setProfile(null)
          // Nettoyer le cache quand l'utilisateur se déconnecte
          profileCache.clear()
          // Arrêter le refresh de session
          if (sessionRefreshInterval.current) {
            clearInterval(sessionRefreshInterval.current)
            sessionRefreshInterval.current = null
          }
        }
        
        setLoading(false)
      }
    )

    // Démarrer l'initialisation
    getInitialSession()

    // Détecter la réouverture de l'appli (quand l'utilisateur revient après avoir fermé l'appli)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Application visible - Vérification de la session...')
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (session && !error && session.user) {
            console.log('✅ Session toujours valide')
            // Recharger le profil depuis le cache ou la BDD
            const userProfile = await getCachedProfile(session.user.id)
            if (userProfile && userProfile.role !== 'visitor') {
              setProfile(userProfile)
            }
          } else {
            console.warn('⚠️ Session invalide à la réouverture')
          }
        } catch (error) {
          console.error('❌ Erreur lors de la vérification de session:', error)
        }
      }
    }

    // Écouter les changements de visibilité de la page
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (sessionRefreshInterval.current) {
        clearInterval(sessionRefreshInterval.current)
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { error }
      }
      
      // Mise à jour optimisée de l'état
      if (data.user) {
        setUser(data.user)
        // Utiliser le cache pour éviter les requêtes multiples
        const userProfile = await getCachedProfile(data.user.id)
        setProfile(userProfile)
      }
      
      return { data, error: null }
    } catch (err) {
      return { error: err }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback'
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) return { error }
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url
      }
      return { data, error: null }
    } catch (err) {
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, accountType: 'employee' | 'external' | 'visitor') => {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/confirm`
      : '/auth/confirm'
      
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          account_type: accountType,
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    try {
      console.log('🔧 Déconnexion en cours...')
      
      // Arrêter le refresh de session
      if (sessionRefreshInterval.current) {
        clearInterval(sessionRefreshInterval.current)
        sessionRefreshInterval.current = null
      }
      
      // Déconnexion Supabase d'abord
      await supabase.auth.signOut()
      
      // Nettoyer l'état local
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      // Nettoyer le cache des profils
      profileCache.clear()
      
      // VIDER COMPLÈTEMENT LE CACHE : localStorage, sessionStorage, et cookies
      // MAIS préserver les informations d'onboarding pour ne pas les réafficher à chaque connexion
      if (typeof window !== 'undefined') {
        console.log('🧹 Nettoyage complet du cache...')
        
        // 1. Sauvegarder les clés d'onboarding avant de vider
        const onboardingKeys: { [key: string]: string } = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('hasSeenOnboarding_')) {
            const value = localStorage.getItem(key)
            if (value) {
              onboardingKeys[key] = value
              console.log('💾 Sauvegarde de la clé d\'onboarding:', key)
            }
          }
        }
        
        // 2. Vider localStorage complètement
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          console.log('🗑️ Suppression:', key)
          localStorage.removeItem(key)
        })
        
        // 3. Restaurer les clés d'onboarding
        Object.entries(onboardingKeys).forEach(([key, value]) => {
          localStorage.setItem(key, value)
          console.log('♻️ Restauration de la clé d\'onboarding:', key)
        })
        
        // 4. Vider sessionStorage
        sessionStorage.clear()
        
        // 5. Nettoyer les caches du service worker si présent
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              console.log('🗑️ Suppression cache SW:', name)
              caches.delete(name)
            })
          })
        }
        
        console.log('✅ Cache complètement vidé (onboarding préservé)')
      }
      
      console.log('✅ Déconnexion réussie')
      
      // Redirection vers /auth avec reload complet pour réinitialiser l'état
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, nettoyer et rediriger
      setUser(null)
      setProfile(null)
      setLoading(false)
      profileCache.clear()
      
      if (sessionRefreshInterval.current) {
        clearInterval(sessionRefreshInterval.current)
        sessionRefreshInterval.current = null
      }
      
      if (typeof window !== 'undefined') {
        // Sauvegarder les clés d'onboarding avant de nettoyer
        const onboardingKeys: { [key: string]: string } = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('hasSeenOnboarding_')) {
            const value = localStorage.getItem(key)
            if (value) {
              onboardingKeys[key] = value
            }
          }
        }
        
        // Nettoyer quand même en cas d'erreur
        localStorage.clear()
        sessionStorage.clear()
        
        // Restaurer les clés d'onboarding
        Object.entries(onboardingKeys).forEach(([key, value]) => {
          localStorage.setItem(key, value)
        })
        
        window.location.href = '/auth'
      }
    }
  }

  const updateUserProfile = async () => {
    if (!user) return
    
    // Invalider le cache et récupérer le profil mis à jour
    profileCache.delete(user.id)
    const updatedProfile = await getCachedProfile(user.id)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/reset-password`
        : '/auth/reset-password'
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      
      if (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error)
        throw error
      }
    } catch (err) {
      console.error('Erreur inattendue lors de la réinitialisation:', err)
      throw err
    }
  }

  const clearSession = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateUserProfile,
    resetPassword,
    clearSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
} 