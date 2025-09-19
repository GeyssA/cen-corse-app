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

  // Si on charge, afficher le composant de chargement intelligent
  if (loading) {
    return <SmartLoading message="Vérification de votre session..." />
  }

  // Si pas d'utilisateur et qu'on est sur une page protégée, ne rien afficher
  if (!user) {
    const currentPath = window.location.pathname
    const protectedPaths = ['/projets', '/communaute', '/statistiques', '/gallery', '/presentation', '/signalement', '/supports']
    
    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      return <SmartLoading message="Redirection vers la page d'authentification..." />
    }
  }

  return <>{children}</>
}
