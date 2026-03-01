'use client'

import React, { useState } from 'react'
// import { useRouter } from 'next/navigation' // Temporairement commenté car non utilisé
import { useTheme } from '@/contexts/ThemeContext'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export default function OnboardingModal({ isOpen, onClose, userId }: OnboardingModalProps) {
  const { theme } = useTheme()
  // const router = useRouter() // Temporairement commenté car non utilisé
  const [currentStep, setCurrentStep] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const steps = [
    {
      title: "Bienvenue sur l'application du Conservatoire d'espaces naturels de Corse",
      content: (
        <div className="flex flex-col items-center justify-center space-y-1">
          {/* Logo CEN Corse en grand */}
          <div className="bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-6" style={{ width: '180px', height: '70px' }}>
            <img 
              src="/Logo_CENCorse.png" 
              alt="CEN Corse" 
              className="w-10/12 h-10/12 object-contain"
              style={{ display: 'block' }}
            />
          </div>
          
          {/* Titre */}
          <h1 className={`text-lg font-bold mb-5 text-center ${
            theme === 'light' ? 'text-gray-800' : 'text-white'
          }`}>
            Bienvenue sur l'application du Conservatoire d'espaces naturels de Corse
          </h1>
          
          {/* Message de bienvenue */}
          <div className="text-center space-y-2 mb-4">
            <div className={`text-sm leading-relaxed space-y-3 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <p>Cette application a été conçue pour permettre à chacun de connaître les projets et les études en cours, ainsi que les activités proposées au sein de l'association.</p>
              <p>Vous pourrez également découvrir l'équipe du CEN Corse, avoir accès à sa galerie photo, à ses supports d'informations en format numérique et plus encore !</p>
              <p>Profitez-en !</p>
            </div>
          </div>
        </div>
      )
    }
  ]

  // Gestion du swipe pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentStep < steps.length - 1) {
      // Swipe gauche = page suivante
      setCurrentStep(currentStep + 1)
    }
    if (isRightSwipe && currentStep > 0) {
      // Swipe droite = page précédente
      setCurrentStep(currentStep - 1)
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Fin de l'onboarding, marquer comme vu pour CET utilisateur
      console.log('🔧 Bouton Commencer cliqué')
      if (userId) {
        localStorage.setItem(`hasSeenOnboarding_${userId}`, 'true')
        console.log(`✅ Onboarding marqué comme vu pour l'utilisateur ${userId}`)
      } else {
        localStorage.setItem('hasSeenOnboarding', 'true')
        console.log('✅ Onboarding marqué comme vu (utilisateur générique)')
      }
      
      // Fermer l'onboarding - ProtectedRoute va gérer la redirection
      onClose()
    }
  }

  // const handlePrevious = () => {
  //   if (currentStep > 0) {
  //     setCurrentStep(currentStep - 1)
  //   }
  // }

  if (!isOpen) return null

  return (
    <>
      {/* Modal overlay - fond semi-transparent */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Fond semi-transparent */}
        <div 
          className={`absolute inset-0 ${
            theme === 'light' 
              ? 'bg-black/30 backdrop-blur-sm' 
              : 'bg-black/50 backdrop-blur-sm'
          }`} 
          onClick={onClose}
        />
        
        {/* Modal content */}
        <div 
          className={`relative max-w-lg w-full backdrop-blur-md rounded-lg overflow-hidden shadow-2xl ${
            theme === 'light' 
              ? 'bg-white/95 border border-gray-200/50' 
              : 'bg-gray-900/95 border border-white/20'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="p-4">
            {/* Contenu */}
            <div>
              {steps[currentStep].content}
            </div>



            {/* Bouton commencer */}
            <div className="mt-6">
              <button
                onClick={handleNext}
                className={`w-full py-2 px-6 rounded-xl font-medium transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    : 'bg-blue-500/80 text-white hover:bg-blue-500 shadow-lg'
                }`}
              >
                Commencer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
