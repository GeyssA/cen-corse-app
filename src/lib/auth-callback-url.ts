import { isCapacitorShell } from '@/lib/geolocation'

/** Schéma enregistré dans AndroidManifest + Supabase Redirect URLs */
export const OAUTH_NATIVE_REDIRECT = 'cencorse://auth/callback'

/** URL publique de l’app (Vercel) — utilisée pour OAuth web. */
export function getPublicAppUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_URL) {
    const u = process.env.NEXT_PUBLIC_VERCEL_URL
    return u.startsWith('http') ? u : `https://${u}`
  }
  return 'https://cen-corse-app.vercel.app'
}

/**
 * URL de retour OAuth Supabase.
 * - Web : `/auth/callback` sur l’origine courante.
 * - App Capacitor : **schéma custom** — Google n’accepte pas la WebView (`disallowed_useragent`) ;
 *   on ouvre Chrome Custom Tabs puis Supabase redirige ici avec le `code` PKCE.
 */
export function getOAuthRedirectUrl(): string {
  if (typeof window === 'undefined') return '/auth/callback'
  if (isCapacitorShell()) {
    return OAUTH_NATIVE_REDIRECT
  }
  return `${window.location.origin}/auth/callback`
}
