'use client'

import React, { useState, useEffect, Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthPageContent() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login')
  const [isMuted, setIsMuted] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get('type')
    const token = searchParams.get('token')
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (type === 'signup' || type === 'email_confirm' || type === 'recovery') {
      // Passer le token à la page appropriée
      if (type === 'recovery') {
        // Pour reset password, aller vers /auth/reset-password
        const resetUrl = token ? `/auth/reset-password?token=${token}&type=${type}` : '/auth/reset-password'
        router.replace(resetUrl)
      } else {
        // Pour confirmation, aller vers /auth/confirm
        const confirmUrl = token ? `/auth/confirm?token=${token}&type=${type}` : '/auth/confirm'
        router.replace(confirmUrl)
      }
    }
    
    // Gestion des messages de callback
    if (success === 'confirmed') {
      setMessage({
        type: 'success',
        text: '✅ Votre compte a été confirmé avec succès ! Vous pouvez maintenant vous connecter.'
      })
      // Nettoyer l'URL
      router.replace('/auth', { scroll: false })
    }
    
    if (error === 'confirmation_failed') {
      setMessage({
        type: 'error',
        text: '❌ Erreur lors de la confirmation de votre compte. Veuillez réessayer ou contacter le support.'
      })
      // Nettoyer l'URL
      router.replace('/auth', { scroll: false })
    }
  }, [searchParams, router])

  // Masquer le message après 8 secondes
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Lecture du son des oiseaux à la première interaction
  useEffect(() => {
    let audioPlayed = false
    
    const handleFirstInteraction = (event: Event) => {
      if (audioPlayed) return
      
      console.log('🎯 Première interaction détectée:', event.type)
      
      const audio = document.getElementById('birds-audio') as HTMLAudioElement
      if (audio) {
        console.log('🎵 Tentative de lecture audio...')
        audioPlayed = true
        
        // Forcer le volume à 0.15 (très discret)
        audio.volume = 0.15
        
        audio.play().then(() => {
          console.log('✅ Audio auth démarré avec succès')
          setIsMuted(false) // Mettre à jour l'état du bouton
        }).catch(e => {
          console.log('🔇 Erreur audio auth:', e)
          audioPlayed = false // Réinitialiser pour permettre un nouvel essai
        })
      } else {
        console.log('❌ Élément audio non trouvé')
      }
      
      // Nettoyer TOUS les listeners après la première interaction
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('touchmove', handleFirstInteraction)
      document.removeEventListener('scroll', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('scroll', handleFirstInteraction)
    }
    
    // Ajouter TOUS les types d'interactions possibles
    console.log('🎵 Audio auth: en attente d\'interaction utilisateur (clic, touch, scroll, clavier)')
    document.addEventListener('click', handleFirstInteraction, { once: true, capture: true })
    document.addEventListener('touchstart', handleFirstInteraction, { once: true, capture: true })
    document.addEventListener('touchmove', handleFirstInteraction, { once: true, capture: true })
    document.addEventListener('scroll', handleFirstInteraction, { once: true, capture: true })
    document.addEventListener('keydown', handleFirstInteraction, { once: true, capture: true })
    window.addEventListener('scroll', handleFirstInteraction, { once: true, capture: true })
    
    // Arrêter le son quand l'utilisateur quitte l'onglet, ferme l'app ou minimise
    const stopAudio = () => {
      const audio = document.getElementById('birds-audio') as HTMLAudioElement
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopAudio()
    }
    const handlePageHide = () => stopAudio()
    const handleBeforeUnload = () => stopAudio()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Nettoyer : arrêter le son quand on quitte la page (démontage du composant)
    return () => {
      stopAudio()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('touchmove', handleFirstInteraction)
      document.removeEventListener('scroll', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('scroll', handleFirstInteraction)
    }
  }, [])

  // Volume faible par défaut dès que l'élément audio est présent
  useEffect(() => {
    const audio = document.getElementById('birds-audio') as HTMLAudioElement
    if (audio) audio.volume = 0.15
  }, [])

  // Activer le scroll du conteneur uniquement sur "Créer un compte" et "Mot de passe oublié" (pas sur le login)
  useEffect(() => {
    const needsScroll = authMode === 'signup' || authMode === 'forgot-password'
    document.body.classList.toggle('auth-needs-scroll', needsScroll)
    return () => document.body.classList.remove('auth-needs-scroll')
  }, [authMode])

  // Gérer le mute/unmute
  const toggleMute = () => {
    const audio = document.getElementById('birds-audio') as HTMLAudioElement
    if (audio) {
      if (isMuted) {
        audio.play()
      } else {
        audio.pause()
      }
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-2 pb-6 relative overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      {/* Bouton mute/unmute en haut à droite */}
      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 group"
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
      >
        {isMuted ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Effet de particules et texture en arrière-plan */}
      <div className="absolute inset-0">
        {/* Texture subtile */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-purple-900/5"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-slate-800/10 via-transparent to-gray-900/10"></div>
        
        {/* Particules colorées */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Petits oiseaux avec battements d'ailes - Plus nombreux */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Première rangée - 5 oiseaux */}
        <div className="absolute animate-bird-fly-1" style={{ left: '2%', top: '10%' }}>
          <svg className="w-7 h-7 text-white/60 animate-flap" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-2" style={{ right: '8%', top: '15%', animationDelay: '1s' }}>
          <svg className="w-8 h-8 text-white/50 animate-flap" style={{ animationDelay: '0.3s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-3" style={{ left: '12%', top: '8%', animationDelay: '2s' }}>
          <svg className="w-6 h-6 text-white/65 animate-flap" style={{ animationDelay: '0.6s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-4" style={{ right: '25%', top: '12%', animationDelay: '3s' }}>
          <svg className="w-7 h-7 text-white/55 animate-flap" style={{ animationDelay: '0.9s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-5" style={{ left: '35%', top: '5%', animationDelay: '4s' }}>
          <svg className="w-6 h-6 text-white/70 animate-flap" style={{ animationDelay: '1.2s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>

        {/* Deuxième rangée - 5 oiseaux */}
        <div className="absolute animate-bird-fly-6" style={{ left: '5%', top: '35%', animationDelay: '1.5s' }}>
          <svg className="w-7 h-7 text-white/60 animate-flap" style={{ animationDelay: '0.4s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-7" style={{ right: '15%', top: '40%', animationDelay: '2.5s' }}>
          <svg className="w-6 h-6 text-white/55 animate-flap" style={{ animationDelay: '0.7s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-8" style={{ left: '20%', top: '45%', animationDelay: '3.5s' }}>
          <svg className="w-8 h-8 text-white/65 animate-flap" style={{ animationDelay: '1s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-1" style={{ right: '30%', top: '38%', animationDelay: '4.5s' }}>
          <svg className="w-7 h-7 text-white/58 animate-flap" style={{ animationDelay: '0.2s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-2" style={{ left: '45%', top: '42%', animationDelay: '5.5s' }}>
          <svg className="w-6 h-6 text-white/62 animate-flap" style={{ animationDelay: '0.8s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>

        {/* Troisième rangée - 5 oiseaux */}
        <div className="absolute animate-bird-fly-3" style={{ left: '8%', bottom: '25%', animationDelay: '1s' }}>
          <svg className="w-7 h-7 text-white/57 animate-flap" style={{ animationDelay: '0.5s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-4" style={{ right: '12%', bottom: '30%', animationDelay: '2s' }}>
          <svg className="w-8 h-8 text-white/63 animate-flap" style={{ animationDelay: '0.3s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-5" style={{ left: '25%', bottom: '20%', animationDelay: '3s' }}>
          <svg className="w-6 h-6 text-white/68 animate-flap" style={{ animationDelay: '0.9s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-6" style={{ right: '35%', bottom: '28%', animationDelay: '4s' }}>
          <svg className="w-7 h-7 text-white/54 animate-flap" style={{ animationDelay: '0.6s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-7" style={{ left: '50%', bottom: '22%', animationDelay: '5s' }}>
          <svg className="w-6 h-6 text-white/61 animate-flap" style={{ animationDelay: '1.1s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>

        {/* Oiseaux supplémentaires dispersés - 3 oiseaux */}
        <div className="absolute animate-bird-fly-8" style={{ left: '60%', top: '25%', animationDelay: '0.5s' }}>
          <svg className="w-7 h-7 text-white/59 animate-flap" style={{ animationDelay: '0.4s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-1" style={{ right: '5%', top: '55%', animationDelay: '3.8s' }}>
          <svg className="w-8 h-8 text-white/66 animate-flap" style={{ animationDelay: '0.7s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
        <div className="absolute animate-bird-fly-2" style={{ left: '70%', bottom: '35%', animationDelay: '4.8s' }}>
          <svg className="w-6 h-6 text-white/64 animate-flap" style={{ animationDelay: '1.3s' }} viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 14 L8 10 Q10 14 16 14 M16 14 L24 10 Q22 14 16 14 M16 14 L16 18" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-3xl relative z-10 py-2 flex flex-col justify-center">
        {/* Logo et titre épurés */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-3xl p-2.5 shadow-2xl">
              <img src="/Logo_CENCorse-removebg-preview.png" alt="Logo CEN Corse" className="w-40 h-auto object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Le journal du CEN Corse
          </h1>
          <h2 className="text-lg text-gray-300 mb-0">
            Suivez les projets et rejoignez la communauté
          </h2>
        </div>

        {/* Messages de succès/erreur */}
        {message && (
          <div className="max-w-lg mx-auto mb-4">
            <div className={`p-4 rounded-xl border-2 backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire direct sans cadre */}
        <div className="max-w-lg mx-auto flex-shrink-0">
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

        {/* Footer épuré — marge raisonnable en bas */}
        <div className="mt-4 text-center pb-6 flex-shrink-0">
          <p className="text-sm text-gray-400">
            © 2026 <span className="font-semibold">BukaLab</span>. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Audio ambiant - chants d'oiseaux */}
      <audio 
        id="birds-audio" 
        src="/birds.mp3" 
        loop 
        preload="metadata"
        className="hidden"
      />

      {/* Animations CSS pour les oiseaux */}
      <style jsx>{`
        @keyframes flap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.6); }
        }
        
        @keyframes bird-fly-1 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(120vw, -20vh); }
        }
        
        @keyframes bird-fly-2 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-120vw, 30vh); }
        }
        
        @keyframes bird-fly-3 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100vw, 15vh); }
        }
        
        @keyframes bird-fly-4 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-110vw, -25vh); }
        }
        
        @keyframes bird-fly-5 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(90vw, -35vh); }
        }
        
        @keyframes bird-fly-6 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-95vw, 10vh); }
        }
        
        @keyframes bird-fly-7 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(105vw, 25vh); }
        }
        
        @keyframes bird-fly-8 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-100vw, -15vh); }
        }
        
        .animate-flap {
          animation: flap 0.4s ease-in-out infinite;
        }
        
        .animate-bird-fly-1 { animation: bird-fly-1 25s linear infinite; }
        .animate-bird-fly-2 { animation: bird-fly-2 30s linear infinite; }
        .animate-bird-fly-3 { animation: bird-fly-3 28s linear infinite; }
        .animate-bird-fly-4 { animation: bird-fly-4 32s linear infinite; }
        .animate-bird-fly-5 { animation: bird-fly-5 27s linear infinite; }
        .animate-bird-fly-6 { animation: bird-fly-6 29s linear infinite; }
        .animate-bird-fly-7 { animation: bird-fly-7 26s linear infinite; }
        .animate-bird-fly-8 { animation: bird-fly-8 31s linear infinite; }
      `}</style>
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