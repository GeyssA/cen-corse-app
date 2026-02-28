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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header uniforme avec logo et menu utilisateur */}
        <div className="w-full glass-effect border-b border-white/10 h-16 overflow-hidden">
          <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 py-3 h-full flex items-center justify-between w-full">
            {/* Logo à gauche */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
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
            
            {/* Boutons à droite */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center text-white transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className={`rounded-2xl shadow-2xl ${
            theme === 'light'
              ? 'bg-white border border-gray-200'
              : 'bg-gray-800/95 backdrop-blur-sm border border-white/20'
          }`}>
            <ContactForm onClose={handleClose} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
