'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import SubTabs from '@/components/navigation/SubTabs'
import { useTheme } from '@/contexts/ThemeContext'
import AproposCenTab from './AproposCenTab'
import AproposSoutenirTab from './AproposSoutenirTab'

const subTabs = [
  {
    id: 'cen',
    label: "L'association",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    )
  },
  {
    id: 'soutenir',
    label: 'Soutenir',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    )
  }
]

export default function AProposPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('cen')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'soutenir') {
      setActiveTab('soutenir')
    }
  }, [])

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

      <SubTabs tabs={subTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-100'
        }`}
      >
        <main className="mx-auto w-full max-w-3xl space-y-6 overflow-x-hidden px-4 pb-8 pt-4 sm:px-5">
          {activeTab === 'cen' && <AproposCenTab />}
          {activeTab === 'soutenir' && <AproposSoutenirTab />}
        </main>
      </div>

      <MainNavigation />
    </ProtectedRoute>
  )
}
