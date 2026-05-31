'use client'

import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isCapacitorShell } from '@/lib/geolocation'
import { OAUTH_NATIVE_REDIRECT } from '@/lib/auth-callback-url'

/** Android peut livrer `intent://auth/callback?...#Intent;scheme=cencorse;...` au lieu de `cencorse://`. */
function normalizeDeepLinkUrl(url: string): string {
  const u = url.trim()
  if (/^intent:\/\//i.test(u)) {
    const hashIdx = u.indexOf('#Intent')
    const pathAndQuery = hashIdx >= 0 ? u.slice(0, hashIdx) : u
    return pathAndQuery.replace(/^intent:\/\//i, 'cencorse://')
  }
  return u
}

function parseOAuthReturn(url: string): { code?: string; access_token?: string; refresh_token?: string } | null {
  const normalized = normalizeDeepLinkUrl(url)
  const prefix = OAUTH_NATIVE_REDIRECT
  const lower = normalized.toLowerCase()
  const prefixLower = prefix.toLowerCase()
  if (!lower.startsWith(prefixLower)) return null
  try {
    const qIdx = normalized.indexOf('?')
    if (qIdx !== -1) {
      const query = normalized.slice(qIdx + 1).split('#')[0]
      const params = new URLSearchParams(query)
      const code = params.get('code')
      if (code) return { code }
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) return { access_token, refresh_token }
    }
    const hashIdx = normalized.indexOf('#')
    if (hashIdx !== -1) {
      const frag = normalized.slice(hashIdx + 1)
      if (frag.startsWith('Intent')) return null
      const params = new URLSearchParams(frag)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) return { access_token, refresh_token }
      const code = params.get('code')
      if (code) return { code }
    }
  } catch {
    return null
  }
  return null
}

/** Un seul rechargement dur : la session vient d’être écrite ; évite la course router vs AuthContext. */
function goHome() {
  if (typeof window === 'undefined') return
  window.location.replace(`${window.location.origin}/`)
}

/**
 * Retour OAuth : `cencorse://auth/callback?code=...` (PKCE) ou jetons dans le fragment.
 * Ferme l’onglet Chrome Custom Tabs ouvert par @capacitor/browser.
 */
export default function NativeAuthDeepLink() {
  useEffect(() => {
    if (!isCapacitorShell()) return

    const finish = async (parsed: NonNullable<ReturnType<typeof parseOAuthReturn>>) => {
      let sessionAfter: Session | null = null
      try {
        if (parsed.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.code)
          if (error) {
            console.error('NativeAuthDeepLink exchangeCode:', error.message)
            return false
          }
          sessionAfter = data.session ?? null
        } else if (parsed.access_token && parsed.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          })
          if (error) {
            console.error('NativeAuthDeepLink setSession:', error.message)
            return false
          }
          sessionAfter = data.session ?? null
        } else {
          return false
        }

        if (!sessionAfter?.user) {
          console.error('NativeAuthDeepLink: session absente après échange (réponse API)')
          return false
        }

        try {
          const { Browser } = await import('@capacitor/browser')
          await Browser.close()
        } catch {
          /* ok si déjà fermé */
        }

        goHome()
        return true
      } catch (e) {
        console.error('NativeAuthDeepLink', e)
        return false
      }
    }

    const handleUrl = async (url: string) => {
      const parsed = parseOAuthReturn(url)
      if (!parsed) return
      await finish(parsed)
    }

    let remove: (() => void) | undefined

    void (async () => {
      try {
        const { App } = await import('@capacitor/app')
        const sub = await App.addListener('appUrlOpen', ({ url }) => {
          void handleUrl(url)
        })
        remove = () => {
          void sub.remove()
        }
        if (typeof App.getLaunchUrl === 'function') {
          const launch = await App.getLaunchUrl()
          if (launch?.url) {
            await handleUrl(launch.url)
          }
        }
      } catch (e) {
        console.warn('NativeAuthDeepLink: @capacitor/app indisponible', e)
      }
    })()

    return () => remove?.()
  }, [])

  return null
}
