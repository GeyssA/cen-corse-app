'use client'

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

const tabs = [
  {
    id: 'home',
    path: '/',
    label: 'Données',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.85} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    id: 'communaute',
    path: '/communaute',
    label: 'Communauté',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.85} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 'ressources',
    path: '/ressources',
    label: 'Ressources',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.85} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    id: 'apropos',
    path: '/apropos',
    label: 'À propos',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.85} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
]

const MainNavigation = memo(function MainNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const [isSamsungDevice, setIsSamsungDevice] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent || ''
    const isSamsung = /SamsungBrowser|SM-[A-Z0-9]+|Galaxy/i.test(ua)
    setIsSamsungDevice(isSamsung)
  }, [])

  const handleTabClick = useCallback((path: string) => {
    router.push(path)
  }, [router])

  const navigationTabs = useMemo(() => tabs, [])

  return (
    <div
      className={`main-navigation fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md ${
        theme === 'light'
          ? 'border-slate-200/80 bg-white/94 shadow-[0_-6px_28px_rgba(30,41,59,0.05)]'
          : 'border-slate-700/40 bg-slate-950/88 shadow-[0_-6px_32px_rgba(0,0,0,0.32)]'
      }`}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
    >
      <div className="mx-auto max-w-md px-3 pb-1 pt-2">
        <div className="flex w-full items-stretch justify-between gap-1">
          {navigationTabs.map((tab) => {
            const isHomeTab = tab.path === '/'
            const isActive = isHomeTab
              ? pathname === '/'
              : pathname === tab.path || pathname.startsWith(`${tab.path}/`)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.path)}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? theme === 'light'
                      ? 'bg-slate-100/95 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/90'
                      : 'bg-slate-800/55 text-slate-200 ring-1 ring-slate-500/25 shadow-sm'
                    : theme === 'light'
                      ? 'text-slate-400 hover:bg-slate-50/90 hover:text-slate-600'
                      : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                } ${isSamsungDevice ? 'py-1.5' : 'py-2'}`}
              >
                <div
                  className={`flex items-center justify-center transition-transform duration-200 ${
                    isActive ? 'scale-105' : 'scale-100'
                  } ${isSamsungDevice ? 'h-6.5 w-6.5' : 'h-7 w-7'}`}
                >
                  {tab.icon}
                </div>
                <span
                  className={`mt-0.5 truncate text-center leading-tight tracking-tight ${
                    isActive ? 'font-semibold' : 'font-medium'
                  } ${
                    isSamsungDevice
                      ? 'max-w-[4.8rem] text-[10px] sm:text-[10px]'
                      : 'max-w-[4.5rem] text-[11px] sm:text-xs'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default MainNavigation