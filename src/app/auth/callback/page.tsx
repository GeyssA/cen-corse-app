'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [confirmationStatus, setConfirmationStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      
      if (code) {
        try {
          // Échanger le code contre une session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Erreur lors de la confirmation:', error)
            setConfirmationStatus('error')
          } else {
            // Succès de la confirmation
            console.log('Email confirmé avec succès:', data.user?.email)
            setConfirmationStatus('success')
          }
        } catch (error) {
          console.error('Erreur lors de la confirmation:', error)
          setConfirmationStatus('error')
        }
      } else {
        // Pas de code, redirection vers la page d'auth
        router.push('/auth')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        {/* Logo CEN Corse */}
        <div className="mb-8">
          <img 
            src="/Logo_CENCorse.png" 
            alt="CEN Corse" 
            className="w-32 h-32 mx-auto rounded-2xl shadow-2xl bg-white p-4"
          />
        </div>
        
        {/* Animation de chargement ou icône de succès */}
        {confirmationStatus === 'loading' ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-6"></div>
            <h1 className="text-white text-2xl font-bold mb-4">
              Confirmation en cours...
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Nous confirmons votre compte, veuillez patienter.
            </p>
          </>
        ) : confirmationStatus === 'success' ? (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-4">
              ✅ Compte confirmé !
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter à l'application.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-4">
              ❌ Erreur de confirmation
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Une erreur s'est produite lors de la confirmation de votre compte. Veuillez réessayer.
            </p>
          </>
        )}
        
        {/* Informations selon le statut */}
        {confirmationStatus === 'loading' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h2 className="text-white text-lg font-semibold mb-4">
              🚀 Que se passe-t-il maintenant ?
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Confirmation automatique</strong><br />
                  Votre compte est en cours d'activation
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">→</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Message de succès</strong><br />
                  Vous verrez un message de confirmation
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">🔐</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Connexion</strong><br />
                  Vous pourrez vous connecter à l'application
                </p>
              </div>
            </div>
          </div>
        )}
        
        {confirmationStatus === 'success' && (
          <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-green-500/30">
            <h2 className="text-white text-lg font-semibold mb-4">
              🎉 Parfait ! Votre compte est prêt
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Compte activé</strong><br />
                  Votre compte est maintenant confirmé
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">🔐</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Vous pouvez maintenant vous connecter</strong><br />
                  Utilisez vos identifiants pour accéder à l'application
                </p>
              </div>
            </div>
          </div>
        )}
        
        {confirmationStatus === 'error' && (
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-red-500/30">
            <h2 className="text-white text-lg font-semibold mb-4">
              ⚠️ Problème de confirmation
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Erreur de confirmation</strong><br />
                  Le lien de confirmation n'est plus valide
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">🔄</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Solutions possibles</strong><br />
                  Demandez un nouvel email de confirmation ou contactez le support
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Message de fallback et boutons d'action */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          {confirmationStatus === 'loading' && (
            <>
              <p className="text-gray-400 text-sm mb-3">
                Si cette page reste affichée plus de 10 secondes :
              </p>
              <a 
                href="/auth" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Retourner à la connexion
              </a>
            </>
          )}
          
          {confirmationStatus === 'success' && (
            <>
              <p className="text-gray-300 text-sm mb-3">
                Vous pouvez maintenant accéder à l'application :
              </p>
              <a 
                href="/auth" 
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium mr-3"
              >
                Se connecter
              </a>
              <a 
                href="/" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Retour à l'accueil
              </a>
            </>
          )}
          
          {confirmationStatus === 'error' && (
            <>
              <p className="text-gray-300 text-sm mb-3">
                En cas de problème, vous pouvez :
              </p>
              <a 
                href="/auth" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium mr-3"
              >
                Essayer de se connecter
              </a>
              <a 
                href="/auth" 
                className="inline-block bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Demander un nouvel email
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
