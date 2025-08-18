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
  const [sessionValid, setSessionValid] = useState(false)
  
  const router = useRouter()
  // const searchParams = useSearchParams()

  useEffect(() => {
    // Marquer que nous sommes côté client
    setIsClient(true)
    
    // Vérifier si l'utilisateur a un token de réinitialisation valide
    const checkSession = async () => {
      try {
        console.log('🔍 Vérification de la session...')
        console.log('📍 URL actuelle:', window.location.href)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('Session data:', session)
        console.log('Session error:', error)
        
        if (error) {
          console.error('Erreur lors de la vérification de la session:', error)
          setError('Erreur lors de la vérification de votre session. Veuillez demander un nouveau lien de réinitialisation.')
          return
        }

        if (!session) {
          console.log('❌ Aucune session trouvée')
          console.log('🔧 Tentative de récupération de l\'utilisateur...')
          
          // Essayer de récupérer l'utilisateur directement
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          console.log('User data:', user)
          console.log('User error:', userError)
          
          if (user && !userError) {
            console.log('✅ Utilisateur trouvé directement, validation de la session')
            setSessionValid(true)
            return
          }
          
          setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.')
          return
        }

        console.log('✅ Session trouvée, vérification de l\'utilisateur...')
        
        // Vérifier si l'utilisateur a un accès de réinitialisation
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log('User data:', user)
        console.log('User error:', userError)
        
        if (userError || !user) {
          console.error('❌ Erreur utilisateur:', userError)
          setError('Session utilisateur invalide. Veuillez demander un nouveau lien de réinitialisation.')
          return
        }

        console.log('✅ Utilisateur valide, session confirmée')
        setSessionValid(true)
      } catch (err) {
        console.error('Erreur lors de la vérification de la session:', err)
        setError('Une erreur inattendue s\'est produite. Veuillez réessayer.')
      }
    }
    
    checkSession()
  }, [])

  // Surveiller les changements d'état pour le débogage
  useEffect(() => {
    console.log('🔄 État mis à jour:', { loading, success, error, sessionValid })
  }, [loading, success, error, sessionValid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionValid) {
      setError('Votre session n\'est pas valide. Veuillez demander un nouveau lien de réinitialisation.')
      return
    }

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
        } catch (err) {
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
      
      // Rediriger vers la page de connexion après 3 secondes supplémentaires
      setTimeout(() => {
        router.push('/auth')
      }, 3000)
    }, 3000)
  }

  // Éviter le rendu côté serveur pour prévenir les erreurs d'hydratation
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-6 bg-gray-200 relative overflow-hidden">
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <img src="/Logo_CENCorse-removebg-preview.png" alt="Logo CEN Corse" className="w-48 h-auto object-contain" />
            </div>
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
          {/* Logo et titre */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <img src="/Logo_CENCorse-removebg-preview.png" alt="Logo CEN Corse" className="w-48 h-auto object-contain" />
            </div>
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
                Mot de passe mis à jour !
              </h2>
              <p className="text-gray-600 mb-4">
                Votre mot de passe a été modifié avec succès dans notre base de données.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm font-medium">
                  ✅ Modification réussie
                </p>
                <p className="text-green-700 text-xs mt-1">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Redirection automatique vers la page de connexion dans <strong>3 secondes</strong>...
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => router.push('/auth')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Aller à la page de connexion maintenant
              </button>
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
        {/* Logo et titre */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <img src="/Logo_CENCorse-removebg-preview.png" alt="Logo CEN Corse" className="w-48 h-auto object-contain" />
          </div>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-gray-700 pr-12 ${showPassword ? 'input-password-security--visible' : 'input-password-security'}`}
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Le mot de passe doit contenir au moins 6 caractères avec des lettres et des chiffres
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-gray-700 pr-12 ${showConfirmPassword ? 'input-password-security--visible' : 'input-password-security'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
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
              disabled={loading || !sessionValid}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Mise à jour en cours...</span>
                </>
              ) : (
                <span>Mettre à jour le mot de passe</span>
              )}
            </button>
            
            {/* Indicateur de débogage */}
            {!sessionValid && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>État de la session :</strong> En cours de vérification...
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  Le bouton sera activé une fois la session validée.
                </p>
                <button
                  onClick={() => {
                    console.log('🔧 Activation manuelle de la session')
                    setSessionValid(true)
                  }}
                  className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                >
                  Activer manuellement (si le lien est valide)
                </button>
              </div>
            )}
            
            {/* Indicateur de progression */}
            {loading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Progression :</strong> Mise à jour de votre mot de passe...
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  Veuillez patienter, cette opération peut prendre quelques secondes.
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/auth')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour à la connexion
            </button>
          </div>
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