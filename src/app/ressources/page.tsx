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
  const [showOnboarding, setShowOnboarding] = useState(false)
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
      {/* Header uniforme avec logo et menu utilisateur */}
      <div className="w-full glass-effect border-b border-white/10 h-16 overflow-hidden">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 py-3 h-full flex items-center justify-between w-full">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <button
              onClick={() => setShowOnboarding(true)}
              className={`bg-white rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                theme === 'light' ? 'border border-gray-800' : ''
              }`}
              style={{ 
                width: 'clamp(130px, 32vw, 170px)', 
                height: 'clamp(48px, 13vw, 64px)' 
              }}
            >
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-10/12 h-10/12 object-contain"
                style={{ display: 'block' }}
              />
            </button>
          </div>

          {/* UserMenu à droite */}
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Fond adaptatif pour la section principale */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 pb-20 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
      }`}>
        {/* Navigation par onglets */}
        <SubTabs 
          tabs={subTabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />

        {/* Contenu principal */}
        <main className="max-w-lg mx-auto px-4 pt-3 pb-4 space-y-6 w-full overflow-x-hidden">
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