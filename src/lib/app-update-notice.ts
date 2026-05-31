import { getPublicAppUrl } from '@/lib/auth-callback-url'

export type AndroidUpdateNotice = {
  latestVersionCode: number
  forceUpdate?: boolean
  title?: string
  message?: string
  playStoreUrl?: string
}

export type AppUpdateJson = {
  android?: AndroidUpdateNotice
}

const DEFAULT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.cencorse.app'

/** Clé localStorage : on ne réaffiche pas tant que latestVersionCode n’a pas changé. */
export const APP_UPDATE_DISMISS_KEY = 'app_update_notice_dismissed_for'

export function getAppUpdateJsonUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_UPDATE_JSON_URL) {
    return process.env.NEXT_PUBLIC_APP_UPDATE_JSON_URL
  }
  const base = getPublicAppUrl().replace(/\/$/, '')
  return `${base}/app-update.json`
}

export function parseAppUpdateJson(data: unknown): AppUpdateJson | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const android = o.android as Record<string, unknown> | undefined
  if (!android || typeof android.latestVersionCode !== 'number') return null
  return {
    android: {
      latestVersionCode: android.latestVersionCode,
      forceUpdate: typeof android.forceUpdate === 'boolean' ? android.forceUpdate : undefined,
      title: typeof android.title === 'string' ? android.title : undefined,
      message: typeof android.message === 'string' ? android.message : undefined,
      playStoreUrl: typeof android.playStoreUrl === 'string' ? android.playStoreUrl : undefined,
    },
  }
}

export async function fetchAppUpdateNotice(): Promise<AppUpdateJson | null> {
  try {
    const res = await fetch(getAppUpdateJsonUrl(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json: unknown = await res.json()
    return parseAppUpdateJson(json)
  } catch {
    return null
  }
}

export function getDefaultPlayStoreUrl(): string {
  return DEFAULT_PLAY_STORE
}
