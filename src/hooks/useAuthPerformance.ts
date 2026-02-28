import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthPerformanceMetrics {
  authTime: number
  profileLoadTime: number
  totalTime: number
  isSlow: boolean
}

export function useAuthPerformance() {
  const { user, profile, loading } = useAuth()
  const [metrics, setMetrics] = useState<AuthPerformanceMetrics | null>(null)
  const startTimeRef = useRef<number>(0)
  const authTimeRef = useRef<number>(0)
  const profileTimeRef = useRef<number>(0)

  useEffect(() => {
    if (loading && !startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    if (!loading && user && !authTimeRef.current) {
      authTimeRef.current = Date.now()
    }

    if (!loading && user && profile && !profileTimeRef.current) {
      profileTimeRef.current = Date.now()
      
      const authTime = authTimeRef.current - startTimeRef.current
      const profileLoadTime = profileTimeRef.current - authTimeRef.current
      const totalTime = profileTimeRef.current - startTimeRef.current
      
      setMetrics({
        authTime,
        profileLoadTime,
        totalTime,
        isSlow: totalTime > 2000 // Plus de 2 secondes = lent
      })

      // Log des performances en développement
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [AuthPerformance]', {
          authTime: `${authTime}ms`,
          profileLoadTime: `${profileLoadTime}ms`,
          totalTime: `${totalTime}ms`,
          isSlow: totalTime > 2000
        })
      }
    }
  }, [loading, user, profile])

  // Reset des métriques lors de la déconnexion
  useEffect(() => {
    if (!user) {
      startTimeRef.current = 0
      authTimeRef.current = 0
      profileTimeRef.current = 0
      setMetrics(null)
    }
  }, [user])

  return {
    metrics,
    isSlow: metrics?.isSlow || false,
    totalTime: metrics?.totalTime || 0
  }
}
