'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Capacitor } from '@capacitor/core'
import {
  APP_UPDATE_DISMISS_KEY,
  fetchAppUpdateNotice,
  getDefaultPlayStoreUrl,
  type AndroidUpdateNotice,
} from '@/lib/app-update-notice'

function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export default function AppUpdateModal({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<AndroidUpdateNotice | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAndroidNative()) return

    let cancelled = false
    void (async () => {
      try {
        const data = await fetchAppUpdateNotice()
        if (cancelled || !data?.android) return

        const latest = data.android.latestVersionCode
        const forceUpdate = data.android.forceUpdate === true
        if (typeof window !== 'undefined') {
          const dismissed = window.localStorage.getItem(APP_UPDATE_DISMISS_KEY)
          if (!forceUpdate && dismissed === String(latest)) return
        }

        const { App } = await import('@capacitor/app')
        const info = await App.getInfo()
        const build = parseInt(String(info.build), 10)
        if (Number.isNaN(build) || build >= latest) return

        if (!cancelled) setNotice(data.android)
      } catch {
        /* silencieux */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    if (notice && typeof window !== 'undefined') {
      window.localStorage.setItem(APP_UPDATE_DISMISS_KEY, String(notice.latestVersionCode))
    }
    setNotice(null)
  }

  const openPlayStore = async () => {
    const url = notice?.playStoreUrl?.trim() || getDefaultPlayStoreUrl()
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const modal =
    notice &&
    mounted &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[150000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-update-title"
      >
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
          <h2 id="app-update-title" className="text-lg font-semibold text-white">
            {notice.title ?? 'Nouvelle version disponible'}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {notice.message ??
              'Une mise à jour est disponible sur le Play Store.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void openPlayStore()}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Voir sur le Play Store
            </button>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <>
      {children}
      {modal}
    </>
  )
}
