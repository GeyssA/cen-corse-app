'use client'

import React, { useState, useEffect, Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthPageContent() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'signup' || type === 'email_confirm') {
      router.replace('/auth/confirm')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-6 relative overflow-hidden">
      {/* Effet de particules en arrière-plan */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo et titre avec design futuriste */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-3xl p-3 shadow-2xl border border-white/20">
              <img src="/Logo_CENCorse-removebg-preview.png" alt="Logo CEN Corse" className="w-48 h-auto object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-title gradient-text">
            Le journal du CEN Corse
          </h1>
          <h2 className="text-lg text-gray-300 mb-2 font-montserrat font-normal">
            Suivez les projets et rejoignez la communauté
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-4"></div>
        </div>

        {/* Formulaire avec glassmorphism */}
        <div className="glass-effect rounded-3xl p-8 shadow-2xl border border-white/10">
          {authMode === 'login' && (
            <LoginForm 
              onSwitchToSignUp={() => setAuthMode('signup')} 
              onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
            />
          )}
          {authMode === 'signup' && (
            <SignUpForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
          {authMode === 'forgot-password' && (
            <ForgotPasswordForm onBackToLogin={() => setAuthMode('login')} />
          )}
        </div>

        {/* Footer moderne */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2025 <span className="gradient-text font-semibold">BukaLab</span>. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 animate-pulse shadow-2xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-gray-300">Chargement...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
} 