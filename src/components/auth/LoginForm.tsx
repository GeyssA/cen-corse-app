'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onSwitchToSignUp: () => void
  onSwitchToForgotPassword: () => void
}

export default function LoginForm({ onSwitchToSignUp, onSwitchToForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userFriendlyError, setUserFriendlyError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const { signIn, signInWithGoogle, signInWithApple } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)

  // Fonction pour traduire les erreurs techniques en messages compréhensibles
  const translateError = (errorMessage: string): string => {
    const message = errorMessage.toLowerCase()
    
    // Gestion des codes d'erreur Supabase
    if (message.includes('invalid_credentials') || message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return 'Le mot de passe ne correspond pas à cette adresse email'
    }
    
    if (message.includes('email_not_confirmed') || message.includes('email not confirmed')) {
      return 'Votre email n\'est pas encore confirmé. Vérifiez votre boîte de réception'
    }
    
    if (message.includes('user_not_found') || message.includes('user not found') || message.includes('user does not exist')) {
      return 'Aucun compte trouvé avec cette adresse email'
    }
    
    if (message.includes('too_many_requests') || message.includes('too many requests') || message.includes('rate limit')) {
      return 'Trop de tentatives de connexion. Veuillez attendre quelques minutes'
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Problème de connexion internet. Vérifiez votre connexion'
    }
    
    if (message.includes('timeout')) {
      return 'La connexion a pris trop de temps. Veuillez réessayer'
    }
    
    // Message par défaut pour les erreurs non reconnues
    return 'Impossible de se connecter. Veuillez vérifier vos informations'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 [MOBILE] handleSubmit déclenché !')
    setLoading(true)
    setError('')
    setUserFriendlyError('')
    try {
      console.log('🔍 [MOBILE] Tentative de connexion pour:', email)
      const result = await signIn(email, password)
      console.log('[LoginForm] Résultat signIn', {
        result,
        hasError: !!result?.error,
        errorMessage: result?.error?.message,
        timestamp: new Date().toISOString()
      })
      
      if (result && result.error) {
        const technicalError = (result.error as { message?: string }).message || 'Erreur inconnue'
        const friendlyError = translateError(technicalError)
        
        console.log('🔍 Erreur reçue:', {
          original: result.error,
          message: technicalError,
          translated: friendlyError
        })
        
        setError(technicalError)
        setUserFriendlyError(friendlyError)
      } else if (result && result.data && !result.error) {
        // Connexion réussie - Redirection immédiate
        console.log('✅ Connexion réussie, redirection...')
        window.location.href = '/'
      } else {
        const unexpectedError = 'Réponse inattendue du serveur.'
        setError(unexpectedError)
        setUserFriendlyError('Impossible de se connecter. Veuillez réessayer')
      }
    } catch (err: unknown) {
      const technicalError = (err as { message?: string })?.message || 'Une erreur inattendue s\'est produite'
      const friendlyError = translateError(technicalError)
      
      setError(technicalError)
      setUserFriendlyError(friendlyError)
      console.error('[LoginForm] Erreur dans handleSubmit', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Connexion
          </h2>
          <p className="text-gray-600">
            Accédez à votre espace personnel
          </p>
        </div>

        {/* Connexion OAuth */}
        <div className="mb-6">
          <div className="space-y-2">
            <button
              type="button"
              disabled={googleLoading || appleLoading}
              onClick={async () => {
                setGoogleLoading(true)
                setError('')
                try {
                  const result = await signInWithGoogle()
                  if (result?.error) {
                    setUserFriendlyError('Connexion Google annulée ou indisponible.')
                    setError(String((result.error as { message?: string })?.message ?? ''))
                  }
                } catch {
                  setUserFriendlyError('Connexion Google indisponible.')
                } finally {
                  setGoogleLoading(false)
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
            </button>

            <button
              type="button"
              disabled={googleLoading || appleLoading}
              onClick={async () => {
                setAppleLoading(true)
                setError('')
                try {
                  const result = await signInWithApple()
                  if (result?.error) {
                    setUserFriendlyError('Connexion Apple annulée ou indisponible.')
                    setError(String((result.error as { message?: string })?.message ?? ''))
                  }
                } catch {
                  setUserFriendlyError('Connexion Apple indisponible.')
                } finally {
                  setAppleLoading(false)
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium border border-gray-800 bg-black !text-white hover:bg-gray-900 focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
            >
              <svg className="h-5 w-5 flex-shrink-0 !text-white" viewBox="0 0 24 24" aria-hidden fill="currentColor">
                <path d="M16.365 1.43c0 1.14-.46 2.2-1.2 2.97-.8.84-2.1 1.48-3.26 1.38-.15-1.1.39-2.25 1.1-3.02.78-.84 2.16-1.43 3.36-1.33zM20.8 17.03c-.55 1.27-.82 1.83-1.52 2.93-.97 1.54-2.34 3.46-4.05 3.48-1.52.02-1.91-.99-3.97-.98-2.06.01-2.48.99-3.99.97-1.71-.02-3-1.75-3.97-3.29-2.7-4.3-2.98-9.35-1.32-11.9 1.17-1.8 3.01-2.86 4.74-2.86 1.77 0 2.88 1 4.34 1 1.42 0 2.29-1 4.33-1 1.54 0 3.18.84 4.35 2.3-3.8 2.08-3.18 7.5 1.06 8.35z"/>
              </svg>
              {appleLoading ? 'Connexion...' : 'Continuer avec Apple'}
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500">ou avec email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium">
                    {userFriendlyError || 'Connexion impossible. Veuillez réessayer.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
              placeholder="votre@email.com"
              style={{ 
                color: '#111827',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-gray-900 placeholder-gray-500 pr-12 ${showPassword ? 'input-password-security--visible' : 'input-password-security'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  // Icône œil barré
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                ) : (
                  // Icône œil
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 