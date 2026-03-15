'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ContactForm from '@/components/ContactForm'
import { useTheme } from '@/contexts/ThemeContext'

export default function SignalementPage() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleClose = () => {
    router.push('/')
  }

  if (!isClient) {
    return null
  }

  return (
    <ProtectedRoute>
      {/* Même bandeau que les autres pages : logo CEN + fond blanc identique */}
      <header className="app-header-bar w-full flex items-center justify-center">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 w-full h-full flex items-center justify-between py-0.5">
          <div className="flex items-center min-h-0">
            <button
              onClick={() => router.push('/')}
              className="rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg bg-white"
              style={{ width: 'clamp(120px, 30vw, 172px)', height: 'clamp(34px, 9vw, 44px)' }}
            >
              <img src="/Logo_CENCorse.png" alt="CEN Corse" className="h-9 w-auto max-w-[160px] object-contain block" />
            </button>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal — cadré comme le reste de l'app */}
      <div className={`min-h-screen w-full ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
        <div className="max-w-2xl mx-auto p-4 pt-6">
          <div className={`rounded-2xl border shadow-lg overflow-hidden ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <ContactForm onClose={handleClose} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
