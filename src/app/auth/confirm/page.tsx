'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [confirmationStatus, setConfirmationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [debugInfo, setDebugInfo] = useState<string>('')

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
    const handleAuthCallback = async () => {
      const code = searchParams.get('token') || searchParams.get('code')
      
      // Debug: Vérifier la configuration Supabase
      const debugData = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRÉSENT' : 'MANQUANT',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRÉSENT' : 'MANQUANT',
        code: code ? 'PRÉSENT' : 'MANQUANT',
        isMobile: isMobile()
      }
      console.log('🔍 Configuration Supabase:', debugData)
      setDebugInfo(`Debug: ${JSON.stringify(debugData, null, 2)}`)
      
      if (code) {
        try {
          // Confirmer l'email avec le token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'signup'
          })
          
          if (error) {
            console.error('Erreur lors de la confirmation:', error)
            setDebugInfo(`ERREUR: ${JSON.stringify(error, null, 2)}`)
            setConfirmationStatus('error')
          } else {
            // Succès de la confirmation
            console.log('Email confirmé avec succès:', data.user?.email)
            setDebugInfo(`SUCCÈS: Email confirmé pour ${data.user?.email}`)
            setConfirmationStatus('success')
            
            // Si mobile, rediriger vers /auth après 2 secondes
            if (isMobile()) {
              setTimeout(() => {
                router.push('/auth')
              }, 2000)
            }
          }
        } catch (error) {
          console.error('Erreur lors de la confirmation:', error)
          setDebugInfo(`ERREUR CATCH: ${JSON.stringify(error, null, 2)}`)
          setConfirmationStatus('error')
        }
      } else {
        // Si pas de code, vérifier si on vient d'une redirection depuis /auth
        const fromAuth = searchParams.get('from') === 'auth'
        if (fromAuth) {
          // L'utilisateur vient de /auth, on affiche le message de succès
          setConfirmationStatus('success')
        } else {
          // Pas de code et pas de redirection, erreur
          setDebugInfo('Lien de confirmation invalide ou expiré.')
          setConfirmationStatus('error')
        }
        
        // Si mobile, rediriger vers /auth après 2 secondes
        if (isMobile()) {
          setTimeout(() => {
            router.push('/auth')
          }, 2000)
        }
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
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
            <h1 className="text-white text-3xl font-bold mb-4">
              ✅ Opération réussie !
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Votre compte a été configuré avec succès.
            </p>
            <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
              <p className="text-green-200 text-base mb-2">
                📱 <strong>Prochaine étape :</strong>
              </p>
              <p className="text-gray-300 text-sm">
                Ouvrez l'application mobile CEN Corse sur votre téléphone pour vous connecter avec vos identifiants.
              </p>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Vous pouvez fermer cette page.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white text-3xl font-bold mb-4">
              ❌ Erreur de confirmation
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Une erreur s'est produite lors de la confirmation. Le lien est peut-être expiré.
            </p>
            {debugInfo && (
              <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-red-500/30">
                <p className="text-red-200 text-sm font-mono whitespace-pre-wrap">
                  {debugInfo}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}