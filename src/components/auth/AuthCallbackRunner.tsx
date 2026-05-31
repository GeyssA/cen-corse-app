'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isCapacitorShell } from '@/lib/geolocation'
import AppOAuthBridgeScreen from '@/components/auth/AppOAuthBridgeScreen'

/** Package Android (Play Store) — pour intent:// */
const ANDROID_PACKAGE = 'com.cencorse.app'

function getCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const search = new URLSearchParams(window.location.search)
  const code = search.get('code')
  if (code) return code
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hash.get('code')
}

function getTokensFromHash(): { access_token: string; refresh_token: string } | null {
  if (typeof window === 'undefined' || !window.location.hash) return null
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const access_token = hash.get('access_token')
  const refresh_token = hash.get('refresh_token')
  if (access_token && refresh_token) return { access_token, refresh_token }
  return null
}

/** Chrome Android bloque souvent la redirection auto vers un schéma custom : intent:// ouvre mieux l’APK. */
function buildAppReturnUrls(session: { access_token: string; refresh_token: string }) {
  const q = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }).toString()
  const customScheme = `cencorse://auth/callback?${q}`
  const intentUrl = `intent://auth/callback?${q}#Intent;scheme=cencorse;package=${ANDROID_PACKAGE};end`
  return { customScheme, intentUrl }
}

function tryOpenNativeApp(session: { access_token: string; refresh_token: string }) {
  const { customScheme, intentUrl } = buildAppReturnUrls(session)
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isAndroid = /Android/i.test(ua)

  if (isAndroid) {
    window.location.href = intentUrl
    window.setTimeout(() => {
      window.location.href = customScheme
    }, 400)
  } else {
    window.location.href = customScheme
  }
}

function CallbackLoaderWeb() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4">
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
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm bg-sky-400 shadow-lg shadow-sky-400/40 animate-callback-cube"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
        <p className="text-gray-400 text-sm font-medium tracking-wide text-center">Connexion en cours…</p>
      </div>
    </div>
  )
}

type Props = { fromNativeAppCallback?: boolean }

export default function AuthCallbackRunner({ fromNativeAppCallback }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /** Route /auth/callback/app OU prop explicite = on doit renvoyer vers l’APK (Chrome / Safari hors WebView). */
  const isAppOAuthReturn =
    fromNativeAppCallback === true ||
    pathname?.includes('/auth/callback/app') === true ||
    searchParams.get('app_oauth') === '1'

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'open_app'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionForApp, setSessionForApp] = useState<{
    access_token: string
    refresh_token: string
  } | null>(null)

  const finishSuccess = useCallback(
    async (routerInner: ReturnType<typeof useRouter>) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        routerInner.replace('/auth')
        return
      }

      // Hors coque Capacitor (ex. Chrome) → deep link. Dans la WebView (bridge présent) → rester sur l’URL HTTPS puis / (option 1)
      const needNative =
        isAppOAuthReturn && !isCapacitorShell()

      if (needNative) {
        setSessionForApp({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
        setStatus('open_app')
        tryOpenNativeApp(session)
        return
      }

      window.location.replace('/')
    },
    [isAppOAuthReturn]
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const code = searchParams.get('code') || getCodeFromUrl()
      const tokens = getTokensFromHash()

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
          await finishSuccess(router)
          return
        } catch (err) {
          if (cancelled) return
          setErrorMessage(err instanceof Error ? err.message : 'Erreur inattendue')
          setStatus('error')
          return
        }
      }

      if (tokens) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })
          if (cancelled) return
          if (error) {
            setErrorMessage(error.message)
            setStatus('error')
            return
          }
          setStatus('success')
          await finishSuccess(router)
          return
        } catch (err) {
          if (cancelled) return
          setErrorMessage(err instanceof Error ? err.message : 'Erreur inattendue')
          setStatus('error')
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) {
        setStatus('success')
        await finishSuccess(router)
        return
      }

      if (!cancelled) router.replace('/auth')
    }

    run()
    return () => {
      cancelled = true
    }
  }, [searchParams, router, finishSuccess])

  if (status === 'loading' || status === 'success') {
    if (isAppOAuthReturn) {
      return (
        <AppOAuthBridgeScreen phase={status === 'success' ? 'opening' : 'connecting'} />
      )
    }
    return <CallbackLoaderWeb />
  }

  if (status === 'open_app' && sessionForApp) {
    const { customScheme } = buildAppReturnUrls(sessionForApp)
    if (isAppOAuthReturn) {
      return (
        <AppOAuthBridgeScreen phase="manual">
          <p className="text-center text-sm text-slate-500">
            Si l’application ne s’ouvre pas tout de suite, touchez le bouton.
          </p>
          <a
            href={customScheme}
            className="inline-block w-full rounded-xl bg-blue-600 py-4 px-6 text-center text-base font-semibold text-white shadow-lg active:bg-blue-500"
          >
            Ouvrir l’application CEN Corse
          </a>
        </AppOAuthBridgeScreen>
      )
    }
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="relative z-10 max-w-md space-y-6 text-center">
          <p className="text-lg font-semibold text-white">Connexion réussie</p>
          <a
            href={customScheme}
            className="inline-block w-full rounded-xl bg-blue-600 py-4 px-6 text-center font-semibold text-white shadow-lg"
          >
            Continuer
          </a>
        </div>
      </div>
    )
  }

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
