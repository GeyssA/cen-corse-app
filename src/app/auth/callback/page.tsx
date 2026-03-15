'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/** Récupère le code d'auth depuis la query string ou le hash (certains redirects OAuth passent par le hash). */
function getCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const search = new URLSearchParams(window.location.search)
  const code = search.get('code')
  if (code) return code
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hash.get('code')
}

/** Récupère access_token et refresh_token depuis le hash (flux OAuth avec fragment). */
function getTokensFromHash(): { access_token: string; refresh_token: string } | null {
  if (typeof window === 'undefined' || !window.location.hash) return null
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const access_token = hash.get('access_token')
  const refresh_token = hash.get('refresh_token')
  if (access_token && refresh_token) return { access_token, refresh_token }
  return null
}

/** Animation de chargement : cubes/carrés (fond identique à l'app). */
function CallbackLoader() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Particules / gradient comme l'app */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Grille de cubes/carrés animés */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm bg-sky-400 shadow-lg shadow-sky-400/40 animate-callback-cube"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
        <p className="text-gray-400 text-sm font-medium tracking-wide">
          Connexion en cours…
        </p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const code = searchParams.get('code') || getCodeFromUrl()
      const tokens = getTokensFromHash()

      // 1) Flux PKCE : échanger le code contre une session
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (cancelled) return
          if (error) {
            setErrorMessage(error.message)
            setStatus('error')
            return
          }
          setStatus('success')
          window.location.replace('/')
          return
        } catch (err) {
          if (cancelled) return
          setErrorMessage(err instanceof Error ? err.message : 'Erreur inattendue')
          setStatus('error')
          return
        }
      }

      // 2) Flux avec tokens dans le hash (ex. redirect Supabase/Google)
      if (tokens) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
          })
          if (cancelled) return
          if (error) {
            setErrorMessage(error.message)
            setStatus('error')
            return
          }
          setStatus('success')
          window.location.replace('/')
          return
        } catch (err) {
          if (cancelled) return
          setErrorMessage(err instanceof Error ? err.message : 'Erreur inattendue')
          setStatus('error')
          return
        }
      }

      // 3) Pas de code ni de tokens : peut-être que detectSessionInUrl a déjà consommé le hash (ex. confirmation email)
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) {
        setStatus('success')
        window.location.replace('/')
        return
      }

      // Vraiment rien : retour à la connexion
      if (!cancelled) router.replace('/auth')
    }

    run()
    return () => { cancelled = true }
  }, [searchParams, router])

  if (status === 'loading' || status === 'success') {
    return <CallbackLoader />
  }

  // Erreur : même fond app + message
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)
          `
        }}
      />
      <div className="relative z-10 text-center max-w-lg">
        <p className="text-red-300 text-sm mb-4">{errorMessage ?? 'Erreur de connexion'}</p>
        <a
          href="/auth"
          className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Retour à la connexion
        </a>
      </div>
    </div>
  )
}
