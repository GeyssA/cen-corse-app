'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AuthDebug() {
  const { user, profile, loading } = useAuth()
  const [envCheck, setEnvCheck] = useState<any>(null)
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null)

  useEffect(() => {
    // Vérifier les variables d'environnement
    const checkEnv = () => {
      setEnvCheck({
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      })
    }

    // Tester la connexion Supabase
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        setSupabaseStatus({
          connected: !error,
          error: error?.message,
          hasSession: !!data.session,
          userId: data.session?.user?.id
        })
      } catch (err) {
        setSupabaseStatus({
          connected: false,
          error: (err as Error).message
        })
      }
    }

    checkEnv()
    testSupabase()
  }, [])

  // Ne pas afficher en production
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🐛 Debug Auth</h3>
      
      <div className="space-y-2">
        <div>
          <strong>État Auth:</strong>
          <div className="ml-2">
            <div>Loading: {loading ? '✅' : '❌'}</div>
            <div>User: {user ? '✅' : '❌'}</div>
            <div>Profile: {profile ? '✅' : '❌'}</div>
          </div>
        </div>

        <div>
          <strong>Variables d'env:</strong>
          <div className="ml-2">
            <div>URL: {envCheck?.supabaseUrl ? '✅' : '❌'}</div>
            <div>Key: {envCheck?.supabaseKey ? '✅' : '❌'}</div>
            {envCheck?.supabaseUrlValue && (
              <div className="text-gray-300">{envCheck.supabaseUrlValue}</div>
            )}
          </div>
        </div>

        <div>
          <strong>Supabase:</strong>
          <div className="ml-2">
            <div>Connected: {supabaseStatus?.connected ? '✅' : '❌'}</div>
            {supabaseStatus?.error && (
              <div className="text-red-300">{supabaseStatus.error}</div>
            )}
            {supabaseStatus?.hasSession && (
              <div>Session: ✅</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

