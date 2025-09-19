'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, Profile, AuthState } from '@/lib/auth'

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
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        console.log('🔍 Vérification de la session initiale...')
        
        // TIMEOUT de sécurité - si ça prend plus de 10 secondes, on force la redirection
        const timeoutId = setTimeout(() => {
          console.log('⏰ TIMEOUT - Redirection forcée vers /auth')
          if (typeof window !== 'undefined') {
            window.location.href = '/auth'
          }
        }, 10000)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        if (error) {
          console.error('❌ Erreur lors de la récupération de la session:', error)
          // Si erreur de token invalide, nettoyer la session
          if (error.message.includes('Invalid Refresh Token')) {
            console.log('🔄 Token invalide, déconnexion...')
            await supabase.auth.signOut()
          }
          setLoading(false)
          return
        }
        
        console.log('✅ Session récupérée:', !!session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Récupération du profil utilisateur...')
          const userProfile = await getProfile(session.user.id)
          setProfile(userProfile)
          console.log('✅ Profil récupéré:', !!userProfile)
        } else {
          // Pas de session - vérifier si on est sur une page protégée
          console.log('❌ Aucune session trouvée')
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
            
            if (protectedPaths.some(path => currentPath.startsWith(path))) {
              console.log('🔄 Redirection vers la page d\'authentification...')
              window.location.href = '/auth'
              return
            }
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('❌ Erreur dans getInitialSession:', error)
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
        } else {
          setProfile(null)
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