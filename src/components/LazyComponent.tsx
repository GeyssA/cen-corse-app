'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface LazyComponentProps {
  fallback?: React.ReactNode
  delay?: number
}

// Hook pour le lazy loading avec délai
function useLazyWithDelay<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  delay: number = 200
) {
  const [Component, setComponent] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      importFunc()
        .then((module) => {
          setComponent(() => module.default)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Erreur lors du chargement du composant:', error)
          setIsLoading(false)
        })
    }, delay)

    return () => clearTimeout(timer)
  }, [importFunc, delay])

  return { Component, isLoading }
}

// Composant wrapper pour le lazy loading
export function LazyComponent<T extends ComponentType<any>>({
  importFunc,
  fallback,
  delay = 200,
  ...props
}: {
  importFunc: () => Promise<{ default: T }>
  fallback?: React.ReactNode
  delay?: number
} & React.ComponentProps<T>) {
  const { Component, isLoading } = useLazyWithDelay(importFunc, delay)

  if (isLoading || !Component) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner size="md" text="Chargement..." />}>
        <div className="flex items-center justify-center min-h-[200px]">
          {fallback || <LoadingSpinner size="md" text="Chargement..." />}
        </div>
      </Suspense>
    )
  }

  return <Component {...props} />
}

// Composants lazy prédéfinis pour les pages principales
export const LazyProjetsContent = lazy(() => import('@/app/projets/ProjetsContent'))
export const LazyStatistiquesContent = lazy(() => import('@/app/projets/StatistiquesContent'))
export const LazyStatsContent = lazy(() => import('@/app/projets/StatsContent'))
export const LazyCommunauteActivitesContent = lazy(() => import('@/app/communaute/ActivitesContent'))
export const LazyCommunauteCalendrierContent = lazy(() => import('@/app/communaute/CommunauteCalendrierContent'))
export const LazyAddProjectModal = lazy(() => import('@/components/modals/AddProjectModal'))
export const LazyAddActivityModal = lazy(() => import('@/components/modals/AddActivityModal'))
export const LazyOnboardingModal = lazy(() => import('@/components/OnboardingModal'))
export const LazyPWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'))

// Composants pour les ressources
export const LazyRessourcesContent = lazy(() => import('@/components/RessourcesContent'))
export const LazyGalerieContent = lazy(() => import('@/components/GalerieContent'))

// Hook pour charger des composants à la demande
export function useLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  delay: number = 200
) {
  const [Component, setComponent] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const loadComponent = React.useCallback(() => {
    if (Component) return Promise.resolve(Component)
    
    setIsLoading(true)
    setError(null)
    
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        importFunc()
          .then((module) => {
            const component = module.default
            setComponent(() => component)
            setIsLoading(false)
            resolve(component)
          })
          .catch((err) => {
            setError(err)
            setIsLoading(false)
            reject(err)
          })
      }, delay)
    })
  }, [importFunc, delay, Component])

  return { Component, isLoading, error, loadComponent }
}

// Composant pour les routes dynamiques
export function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Chargement de la page..." />}>
      {children}
    </Suspense>
  )
}

// Hook pour le préchargement intelligent
export function usePreloadComponent(importFunc: () => Promise<any>, priority: 'high' | 'low' = 'low') {
  React.useEffect(() => {
    if (priority === 'high') {
      // Précharger immédiatement pour les composants prioritaires
      importFunc().catch(console.error)
    } else {
      // Précharger après un délai pour les composants non prioritaires
      const timer = setTimeout(() => {
        importFunc().catch(console.error)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [importFunc, priority])
}

// Composant pour les modales lazy
export function LazyModal({
  isOpen,
  importFunc,
  fallback,
  ...props
}: {
  isOpen: boolean
  importFunc: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
} & any) {
  const { Component } = useLazyComponent(importFunc, 100)

  if (!isOpen) return null

  if (!Component) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {fallback || <LoadingSpinner size="lg" text="Chargement..." />}
      </div>
    )
  }

  return <Component {...props} />
}
