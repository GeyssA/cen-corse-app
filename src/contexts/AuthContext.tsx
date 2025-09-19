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
    // SOLUTION RADICALE : TIMEOUT AGRESSIF + FALLBACK
    const getInitialSession = async () => {
      try {
        console.log('🔍 Vérification de la session (timeout 1s)...')
        
        // TIMEOUT AGRESSIF de 1 seconde maximum
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout 1s')), 1000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (error || !session) {
          console.log('❌ Pas de session ou timeout - redirection immédiate vers /auth')
          // REDIRECTION IMMÉDIATE vers /auth
          if (typeof window !== 'undefined') {
            window.location.href = '/auth'
          }
          return
        }
        
        console.log('✅ Session trouvée rapidement')
        setUser(session.user)
        
        // Récupérer le profil en arrière-plan (sans bloquer)
        getProfile(session.user.id).then(userProfile => {
          setProfile(userProfile)
        }).catch(() => {
          console.log('⚠️ Erreur profil, mais on continue')
        })
        
        setLoading(false)
      } catch (error) {
        console.log('❌ Timeout ou erreur - redirection immédiate vers /auth')
        // REDIRECTION IMMÉDIATE vers /auth
        if (typeof window !== 'undefined') {
          window.location.href = '/auth'
        }
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
          
          // Mettre à jour le timestamp de session
          localStorage.setItem('lastSessionTime', Date.now().toString())
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