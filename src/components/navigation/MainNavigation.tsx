'use client'

import React, { memo, useMemo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

const tabs = [
  {
    id: 'home',
    path: '/',
    label: 'Accueil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    id: 'projets',
    path: '/projets',
    label: 'Projets',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'communaute',
    path: '/communaute',
    label: 'Communauté',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 'ressources',
    path: '/ressources',
    label: 'Ressources',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    id: 'apropos',
    path: '/apropos',
    label: 'À propos',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
]

const MainNavigation = memo(function MainNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()

  const handleTabClick = useCallback((path: string) => {
    router.push(path)
  }, [router])

  const navigationTabs = useMemo(() => tabs, [])

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-sm ${
      theme === 'light' 
        ? 'bg-white/80 border-gray-200' 
        : 'glass-effect border-white/10'
    }`}
    style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
    >
      <div className="max-w-md mx-auto px-2 py-1.5">
        <div className="flex w-full">
          {navigationTabs.map((tab) => {
            const isHomeTab = tab.path === '/'
            const isActive = isHomeTab
              ? pathname === '/'
              : pathname === tab.path || pathname.startsWith(`${tab.path}/`)
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                  isActive
                    ? theme === 'light'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-blue-400 bg-blue-500/20'
                    : theme === 'light'
                      ? 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/50'
                }`}
              >
                <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}>
                  {tab.icon}
                </div>
                <span className={`text-xs font-medium mt-1 ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}>
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