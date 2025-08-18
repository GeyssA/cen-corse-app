'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [debug, setDebug] = useState<any>(null)
  
  // Essayer d'utiliser le contexte, sinon utiliser Supabase directement
  let authContext: any
  try {
    authContext = useAuth()
  } catch (err) {
    console.warn('AuthContext non disponible, utilisation directe de Supabase')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    setDebug(null)
    let finished = false

    // Timeout de secours : si rien ne se passe en 5s, on affiche une erreur
    const timeout = setTimeout(() => {
      if (!finished) {
        setError('Aucune réponse du serveur après 5 secondes. Problème réseau ou configuration Supabase ?')
        setLoading(false)
      }
    }, 5000)

    try {
      console.log('[ForgotPasswordForm] Tentative de réinitialisation', { email })
      
      let result
      
      // Utiliser le contexte si disponible, sinon Supabase directement
      if (authContext && authContext.resetPassword) {
        console.log('[ForgotPasswordForm] Utilisation du contexte Auth')
        result = await authContext.resetPassword(email)
      } else {
        console.log('[ForgotPasswordForm] Utilisation directe de Supabase')
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/reset-password`
          : '/auth/reset-password'
          
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        })
        
        result = { error }
      }
      
      finished = true
      clearTimeout(timeout)
      setDebug(result)
      console.log('[ForgotPasswordForm] Résultat resetPassword', result)
      
      if (result && result.error) {
        setError(result.error.message || 'Erreur inconnue')
      } else if (result && !result.error) {
        setSuccess(true)
      } else {
        setError('Réponse inattendue du serveur.')
      }
    } catch (err: unknown) {
      finished = true
      clearTimeout(timeout)
      setError((err as any)?.message || 'Une erreur inattendue s\'est produite')
      setDebug(err)
      console.error('[ForgotPasswordForm] Erreur dans handleSubmit', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email envoyé !
            </h2>
            <p className="text-gray-600 mb-6">
              Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vérifiez votre boîte de réception et cliquez sur le lien pour définir un nouveau mot de passe.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Mot de passe oublié
          </h2>
          <p className="text-gray-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
              {debug && (
                <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(debug as any, null, 2)}</pre>
              )}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="votre@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  )
} 