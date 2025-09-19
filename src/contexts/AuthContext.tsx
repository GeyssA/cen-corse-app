'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, Profile, AuthState } from '@/lib/auth'
import { cacheProfile, getCachedProfile, clearProfileCache } from '@/lib/profile-cache'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signUp: (email: string, password: string, fullName: string, accountType: 'employee' | 'external' | 'visitor') => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<{ error: unknown }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // SESSION STABLE DE 5 MINUTES
    const getInitialSession = async () => {
      try {
        console.log('🔍 Vérification de la session...')
        
        // Vérifier d'abord le cache local (5 minutes)
        const lastSessionTime = localStorage.getItem('lastSessionTime')
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000 // 5 minutes
        
        if (lastSessionTime && (now - parseInt(lastSessionTime)) < fiveMinutes) {
          console.log('✅ Session récente dans le cache - utilisation directe')
          // Session récente, on peut continuer sans vérifier Supabase
          setUser({ id: 'cached-user' } as any) // User factice pour débloquer
          
          // Récupérer le profil depuis le cache
          const cachedProfile = getCachedProfile()
          if (cachedProfile) {
            console.log('✅ Profil récupéré depuis le cache:', cachedProfile.role)
            setProfile(cachedProfile)
          }
          
          setLoading(false)
          return
        }
        
        // Si pas de cache récent, vérifier Supabase avec timeout raisonnable
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000) // 5 secondes
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (error || !session) {
          console.log('❌ Pas de session - redirection vers /auth')
          // Seulement rediriger si on est sur une page protégée
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
            
            if (protectedPaths.some(path => currentPath.startsWith(path))) {
              window.location.href = '/auth'
              return
            }
          }
          setLoading(false)
          return
        }
        
        console.log('✅ Session trouvée')
        setUser(session.user)
        
        // Sauvegarder le timestamp de la session
        localStorage.setItem('lastSessionTime', now.toString())
        
        // Récupérer le profil en arrière-plan
        getProfile(session.user.id).then(userProfile => {
          setProfile(userProfile)
          // Mettre en cache le profil
          if (userProfile) {
            cacheProfile(userProfile)
          }
        }).catch(() => {
          console.log('⚠️ Erreur profil, essayer le cache')
          // En cas d'erreur, essayer le cache
          const cachedProfile = getCachedProfile()
          if (cachedProfile) {
            setProfile(cachedProfile)
          }
        })
        
        setLoading(false)
      } catch (error) {
        console.log('❌ Erreur session - utilisation du cache si disponible')
        
        // En cas d'erreur, vérifier si on a un cache récent
        const lastSessionTime = localStorage.getItem('lastSessionTime')
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000
        
        if (lastSessionTime && (now - parseInt(lastSessionTime)) < fiveMinutes) {
          console.log('✅ Utilisation du cache en cas d\'erreur')
          setUser({ id: 'cached-user' } as any)
          
          // Récupérer le profil depuis le cache
          const cachedProfile = getCachedProfile()
          if (cachedProfile) {
            setProfile(cachedProfile)
          }
          
          setLoading(false)
          return
        }
        
        // Seulement rediriger si vraiment pas de session
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
          
          if (protectedPaths.some(path => currentPath.startsWith(path))) {
            window.location.href = '/auth'
          }
        }
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        console.log('🔄 Changement d\'état d\'authentification:', event)
        setUser((session as any)?.user ?? null)
        
            if ((session as any)?.user) {
              console.log('👤 Récupération du profil après changement d\'état...')
              const userProfile = await getProfile((session as any).user.id)
              setProfile(userProfile)
              console.log('✅ Profil mis à jour:', !!userProfile)
              
              // Mettre en cache le profil
              if (userProfile) {
                cacheProfile(userProfile)
              }
              
              // Mettre à jour le timestamp de session
              localStorage.setItem('lastSessionTime', Date.now().toString())
            } else {
              setProfile(null)
              clearProfileCache()
            }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentative de connexion pour:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Erreur de connexion:', error)
        return { error }
      }
      
      console.log('✅ Connexion réussie:', !!data.user)
      return { error: null }
    } catch (err) {
      console.error('❌ Erreur inattendue lors de la connexion:', err)
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, accountType: 'employee' | 'external' | 'visitor') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    clearProfileCache(); // Vider le cache du profil
  }

  const updateUserProfile = async () => {
    if (!user) return
    
    const updatedProfile = await getProfile(user.id)
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
      }
      
      return { error }
    } catch (err) {
      console.error('Erreur inattendue lors de la réinitialisation:', err)
      return { error: err }
    }
  }

  const clearSession = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    clearProfileCache() // Vider le cache du profil
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
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