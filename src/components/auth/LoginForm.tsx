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
  const [debug, setDebug] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  
  const { signIn } = useAuth()

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
    setLoading(true)
    setError('')
    setUserFriendlyError('')
    setDebug(null)
    setShowTechnicalDetails(false)
    let finished = false

    // Timeout de secours : si rien ne se passe en 5s, on affiche une erreur
    const timeout = setTimeout(() => {
      if (!finished) {
        const timeoutError = 'Aucune réponse du serveur après 5 secondes. Problème réseau ou configuration Supabase ?'
        setError(timeoutError)
        setUserFriendlyError('La connexion a pris trop de temps. Veuillez réessayer')
        setLoading(false)
      }
    }, 5000)

    try {
      console.log('[LoginForm] Tentative de connexion', { email })
      const result = await signIn(email, password)
      finished = true
      clearTimeout(timeout)
      setDebug(result)
      console.log('[LoginForm] Résultat signIn', result)
      
      if (result && result.error) {
        const technicalError = (result.error as any).message || 'Erreur inconnue'
        const friendlyError = translateError(technicalError)
        
        console.log('🔍 Erreur reçue:', {
          original: result.error,
          message: technicalError,
          translated: friendlyError
        })
        
        setError(technicalError)
        setUserFriendlyError(friendlyError)
      } else if (result && !result.error) {
        window.location.href = '/'
      } else {
        const unexpectedError = 'Réponse inattendue du serveur.'
        setError(unexpectedError)
        setUserFriendlyError('Impossible de se connecter. Veuillez réessayer')
      }
    } catch (err: unknown) {
      finished = true
      clearTimeout(timeout)
      const technicalError = (err as any)?.message || 'Une erreur inattendue s\'est produite'
      const friendlyError = translateError(technicalError)
      
      setError(technicalError)
      setUserFriendlyError(friendlyError)
      setDebug(err)
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              {/* Message utilisateur compréhensible */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium">
                    {userFriendlyError || 'Une erreur s\'est produite'}
                    {/* Test temporaire pour déboguer */}
                    {error && !userFriendlyError && (
                      <span className="block text-xs text-red-600 mt-1">
                        (Test: {translateError(error)})
                      </span>
                    )}
                  </p>
                  
                  {/* Bouton pour voir les détails techniques */}
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 underline focus:outline-none"
                  >
                    {showTechnicalDetails ? 'Masquer les détails techniques' : 'Voir les détails techniques'}
                  </button>
                  
                  {/* Détails techniques (cachés par défaut) */}
                  {showTechnicalDetails && (
                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                      <p className="text-red-700 text-xs font-mono mb-2">
                        <strong>Erreur technique :</strong>
                      </p>
                      <p className="text-red-600 text-xs mb-2">{error}</p>
                      {debug && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                            Détails complets (JSON)
                          </summary>
                          <pre className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded overflow-x-auto border border-red-200">
                            {JSON.stringify(debug, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
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