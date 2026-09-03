'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const scrollContainerStyle = {
  minHeight: '100dvh',
  height: '100%',
  overflowY: 'auto' as const,
  overflowX: 'hidden' as const,
  WebkitOverflowScrolling: 'touch' as const,
  touchAction: 'pan-y' as const,
  overscrollBehavior: 'contain' as const,
}

/** Page auth : scroll possible (nécessaire pour le formulaire création de compte) */
const authContainerStyle = {
  minHeight: '100dvh',
  height: '100%',
  overflowY: 'auto' as const,
  overflowX: 'hidden' as const,
  WebkitOverflowScrolling: 'touch' as const,
  touchAction: 'pan-y' as const,
  overscrollBehavior: 'contain' as const,
}

export default function ScrollContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading: authLoading, user, profile } = useAuth()
  const isHome = pathname === '/'
  const isAuth = pathname?.startsWith('/auth')
  const isValidation = pathname?.startsWith('/validation')
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    if (isAuth) {
      document.body.setAttribute('data-auth-route', 'true')
    } else {
      document.body.removeAttribute('data-auth-route')
    }
  }, [isAuth])
  const isOAuthAppBridge = pathname?.includes('/auth/callback/app')
  /** Pleine page sans bandeau : chargement initial (milan) ou synchro profil (3 points) */
  const isLoginLoadingScreen = isHome && (authLoading || (user && !profile))
  return (
    <div
      className={`${isHome ? 'scroll-container has-footer' : 'scroll-container'} ${isAuth ? 'scroll-container-auth' : ''} ${isLoginLoadingScreen ? 'scroll-container-loading' : ''} ${isValidation ? 'scroll-container-fullpage' : ''} ${isOAuthAppBridge ? 'scroll-container-oauth-app' : ''}`}
      style={isAuth ? authContainerStyle : scrollContainerStyle}
    >
      {children}
    </div>
  )
}
