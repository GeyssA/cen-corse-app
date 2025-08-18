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
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error)
          // Si erreur de token invalide, nettoyer la session
          if (error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut()
          }
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const userProfile = await getProfile(session.user.id)
          setProfile(userProfile)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Erreur dans getInitialSession:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        setUser((session as any)?.user ?? null)
        
        if ((session as any)?.user) {
          const userProfile = await getProfile((session as any).user.id)
          setProfile(userProfile)
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Erreur de connexion:', error)
      }
      
      return { error }
    } catch (err) {
      console.error('Erreur inattendue lors de la connexion:', err)
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
    await supabase.auth.signOut()
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