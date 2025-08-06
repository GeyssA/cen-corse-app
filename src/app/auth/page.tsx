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
    <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gray-200 relative overflow-hidden">
      {/* Halo/flou bleu clair derrière la carte */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-[420px] h-[420px] rounded-full bg-blue-100 blur-2xl opacity-60"></div>
      </div>
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        {/* Bloc logo/titre/sous-titre */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <img src="/Logo_CENCorse-removebg-preview.png" alt="Logo CEN Corse" className="w-48 h-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 font-montserrat">
            Le journal du CEN Corse
          </h1>
          <h2 className="text-lg text-gray-600 mb-1 font-montserrat font-normal">
            Suivez les projets et rejoignez la communauté
          </h2>
        </div>

        {/* Formulaire */}
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 BukaLab. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
} 