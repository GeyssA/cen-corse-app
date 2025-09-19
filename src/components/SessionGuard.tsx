'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import SmartLoading from './SmartLoading'

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

  // Si on charge, afficher un chargement simple
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Redirection...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
