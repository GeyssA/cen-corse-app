'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { hasPermission } from '@/lib/auth'
import AuthLoading from './AuthLoading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'visitor' | 'admin' | 'super_admin'
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'visitor',
  fallback 
}: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [forceContinue, setForceContinue] = React.useState(false)
  
  // Timeout de sécurité pour éviter les blocages PWA - TOUJOURS appelé
  React.useEffect(() => {
    if (user && !profile && !forceContinue) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Timeout profil PWA - Mode dégradé activé après 6s')
        setForceContinue(true) // Forcer la continuation
      }, 6000) // 6 secondes max - plus généreux
      
      return () => clearTimeout(timeout)
    }
  }, [user, profile, forceContinue])

  // SOLUTION SIMPLE : Comportement identique dev/production
  React.useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    const isProduction = process.env.NODE_ENV === 'production'
    
    console.log('🔍 Debug ProtectedRoute:', { 
      isPWA, 
      isProduction, 
      user: user ? `CONNECTÉ: ${user.email}` : 'NON CONNECTÉ', 
      loading,
      userAgent: navigator.userAgent,
      location: window.location.href
    })
    
    // Comportement normal : redirection si pas connecté
    if (!loading && !user) {
      console.log('🔧 Redirection vers /auth - utilisateur non connecté')
      router.push('/auth')
    }
  }, [user, loading, router])

  // Redirection si non connecté (déjà géré ci-dessus)

  // Affichage du loading optimisé
  if (loading) {
    return <AuthLoading message="Chargement..." showProgress={false} />
  }

  // Retourner null si non connecté (la redirection se fait dans useEffect)
  if (!user) {
    return null
  }

  // Mode dégradé : permettre l'accès même sans profil pour éviter les blocages PWA
  if (user && !profile && !forceContinue) {
    // Afficher le loading pendant 6 secondes, puis continuer
    return <AuthLoading message="Synchronisation du profil..." showProgress={true} />
  }

  // Vérification des permissions
  if (profile && !hasPermission(profile.role, requiredRole)) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour aux données
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 