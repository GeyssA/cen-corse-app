'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface SessionGuardProps {
  children: React.ReactNode
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Attendre que l'authentification soit vérifiée
    if (loading) return

    // Si pas d'utilisateur et qu'on est sur une page protégée
    if (!user) {
      const currentPath = window.location.pathname
      const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
      
      if (protectedPaths.some(path => currentPath.startsWith(path))) {
        console.log('🛡️ Session perdue - redirection vers /auth')
        router.push('/auth')
      }
    }
  }, [user, loading, router])

  // Si on charge, ne rien afficher
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si pas d'utilisateur et qu'on est sur une page protégée, ne rien afficher
  if (!user) {
    const currentPath = window.location.pathname
    const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
    
    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirection vers la page d'authentification...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
