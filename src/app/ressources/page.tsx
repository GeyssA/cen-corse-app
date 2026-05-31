'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import SubTabs from '@/components/navigation/SubTabs'
import { useTheme } from '@/contexts/ThemeContext'
import { LazyRessourcesContent, LazyGalerieContent } from '@/components/LazyComponent'

const subTabs = [
  {
    id: 'supports',
    label: 'Supports',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    id: 'galerie',
    label: 'Galerie',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
]

export default function RessourcesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('supports')

  // Détecter le paramètre tab dans l'URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'galerie') {
      setActiveTab('galerie')
    }
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  return (
    <ProtectedRoute>
      <header className="app-header-bar flex h-full w-full items-center justify-center">
        <div className="mx-auto flex h-full w-full max-w-sm items-center justify-between px-0 py-0.5 sm:max-w-md sm:px-3 md:max-w-lg md:px-5 lg:max-w-1xl">
          <div className="flex min-h-0 items-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{ width: 'clamp(120px, 30vw, 172px)', height: 'clamp(34px, 9vw, 44px)' }}
            >
              <img src="/Logo_CENCorse.png" alt="CEN Corse" className="block h-9 w-auto max-w-[160px] object-contain" />
            </button>
          </div>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </header>

      <SubTabs tabs={subTabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <div
        className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-100'
        }`}
      >
        <main className="mx-auto w-full max-w-3xl space-y-6 overflow-x-hidden px-4 pb-8 pt-2 sm:px-5">
          {activeTab === 'supports' ? (
            <LazyRessourcesContent />
          ) : (
            <LazyGalerieContent />
          )}
        </main>
      </div>

      {/* Navigation principale en bas */}
      <MainNavigation />
    </ProtectedRoute>
  )
}