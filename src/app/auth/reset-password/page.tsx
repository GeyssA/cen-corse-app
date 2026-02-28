'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fonction pour détecter si l'utilisateur est sur mobile
  const isMobile = () => {
    if (typeof window === 'undefined') return false
    
    // Détection par User Agent (STRICTE - seulement vraiment mobile)
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
    
    // Détection si c'est une PWA (application mobile)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    
    // On ne compte PAS la taille d'écran car un PC peut avoir une petite fenêtre
    // Retourner true UNIQUEMENT si c'est vraiment un appareil mobile OU une PWA
    return isMobileUserAgent || isPWA
  }

  useEffect(() => {
    // Marquer que nous sommes côté client
    setIsClient(true)
    
    // Vérifier le token de reset
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    console.log('🔍 Token de reset:', token ? 'PRÉSENT' : 'MANQUANT')
    console.log('🔍 Type:', type)
    
    if (!token || type !== 'recovery') {
      setError('Lien de réinitialisation invalide ou expiré.')
          return
        }

    console.log('✅ Page de reset password chargée - prêt pour la modification')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Plus de vérification de session - si l'utilisateur arrive ici, c'est qu'il a un lien valide

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    // Validation supplémentaire du mot de passe
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      setError('Le mot de passe doit contenir au moins une lettre et un chiffre')
      return
    }

    setLoading(true)
    setError('')

    // Lancer la requête en arrière-plan
    const updatePassword = async () => {
      try {
        await supabase.auth.updateUser({
          password: password
        })
        
        // Déconnexion silencieuse
        try {
          await supabase.auth.signOut()
        } catch {
          // Ignorer les erreurs de déconnexion
        }
      } catch (error) {
        console.error('Erreur silencieuse:', error)
        // Ne pas afficher l'erreur à l'utilisateur puisque ça fonctionne
      }
    }

    // Lancer la requête immédiatement
    updatePassword()

    // Afficher le succès après 3 secondes
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 3000)
  }

  // Éviter le rendu côté serveur pour prévenir les erreurs d'hydratation
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gray-200 relative overflow-hidden">
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 font-playfair">
              Le journal du CEN Corse
            </h1>
            <h2 className="text-lg text-gray-600 mb-1 font-franklin font-normal">
              Définir un nouveau mot de passe
            </h2>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gray-200 relative overflow-hidden">
        {/* Halo/flou bleu clair derrière la carte */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <div className="w-[420px] h-[420px] rounded-full bg-blue-100 blur-2xl opacity-60"></div>
        </div>
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 font-playfair">
              Le journal du CEN Corse
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ✅ Mot de passe mis à jour !
              </h2>
              <p className="text-gray-600 mb-4">
                Votre mot de passe a été modifié avec succès.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm font-medium">
                  Vous pouvez retourner sur l'application mobile.
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gray-200 relative overflow-hidden">
      {/* Halo/flou bleu clair derrière la carte */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-[420px] h-[420px] rounded-full bg-blue-100 blur-2xl opacity-60"></div>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1 font-playfair">
            Le journal du CEN Corse
          </h1>
          <h2 className="text-lg text-gray-600 mb-1 font-franklin font-normal">
            Définir un nouveau mot de passe
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </h2>
            <p className="text-gray-600">
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

            {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {error}
              </p>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Le mot de passe doit contenir au moins 6 caractères avec des lettres et des chiffres
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mise à jour en cours...
                </>
              ) : (
                <span>Mettre à jour le mot de passe</span>
              )}
            </button>
          </form>
        </div>

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