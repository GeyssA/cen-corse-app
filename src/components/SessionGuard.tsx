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
    // TIMEOUT DE SÉCURITÉ : Si on charge plus de 2 secondes, rediriger vers /auth
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('🚨 TIMEOUT DE SÉCURITÉ - Redirection vers /auth')
        router.push('/auth')
      }
    }, 2000)

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

    return () => clearTimeout(safetyTimeout)
  }, [user, loading, router])

  // Si on charge, afficher un chargement simple
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si pas d'utilisateur et qu'on est sur une page protégée, ne rien afficher
  if (!user) {
    const currentPath = window.location.pathname
    const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
    
    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Redirection...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
