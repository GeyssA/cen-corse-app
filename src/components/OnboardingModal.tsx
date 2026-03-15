'use client'

import React, { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation' // Temporairement commenté car non utilisé
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export default function OnboardingModal({ isOpen, onClose, userId }: OnboardingModalProps) {
  const { theme } = useTheme()
  const { user, profile, updateUserProfile } = useAuth()
  // const router = useRouter() // Temporairement commenté car non utilisé
  const [currentStep, setCurrentStep] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [fullName, setFullName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const effectiveUserId = userId ?? user?.id

  useEffect(() => {
    if (profile?.full_name && profile.full_name !== 'Utilisateur') {
      setFullName(profile.full_name)
    }
  }, [profile?.full_name])

  const steps = [
    {
      title: "Vos données au service de la connaissance",
      content: (
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-4" style={{ width: '160px', height: '60px' }}>
            <img src="/Logo_CENCorse.png" alt="CEN Corse" className="w-10/12 h-10/12 object-contain" style={{ display: 'block' }} />
          </div>
          <h2 className={`text-base font-bold mb-3 text-center ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            Participez à la connaissance scientifique
          </h2>
          <div className={`text-sm leading-relaxed space-y-3 text-center mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            <p>Cette application permet de <strong>saisir des données naturalistes</strong> (observations, sites) et de <strong>contribuer à la connaissance de la biodiversité</strong>.</p>
            <p>Vos données sont enregistrées dans la <strong>base du CEN Corse</strong> et remontent au <strong>niveau national</strong> avec votre nom en tant qu’observateur, dans le respect des cadres de diffusion des données.</p>
            <p>Chaque observation compte pour la science et la préservation des espèces.</p>
          </div>
        </div>
      )
    },
    {
      title: "Découvrir l'application",
      content: (
        <div className="flex flex-col items-center justify-center space-y-1">
          <h2 className={`text-base font-bold mb-3 text-center ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            Bienvenue sur l’application du CEN Corse
          </h2>
          <div className={`text-sm leading-relaxed space-y-3 text-center mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            <p>Vous pourrez consulter les <strong>projets et études</strong> en cours, les <strong>activités</strong> proposées par l’association, découvrir l’<strong>équipe</strong> du CEN Corse, accéder à la <strong>galerie photo</strong> et aux supports d’information.</p>
            <p>Depuis l’accueil : <strong>ajoutez des observations</strong> et des <strong>sites</strong>, consultez la carte, exportez vos données. Profitez-en !</p>
          </div>
        </div>
      )
    },
    {
      title: "Votre nom pour les données naturalistes",
      content: (
        <div className="flex flex-col items-center justify-center space-y-1">
          <h2 className={`text-base font-bold mb-2 text-center ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            Prénom et Nom
          </h2>
          <p className={`text-sm text-center mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Pour que vos observations naturalistes soient correctement enregistrées et remontées au niveau national, indiquez votre nom d’affichage (tel qu’il figurera en tant qu’observateur).
          </p>
          <div className="w-full">
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setNameError(null)
              }}
              placeholder="Ex. Jean Dupont"
              className={`w-full rounded-xl border px-4 py-3 text-base ${
                theme === 'light'
                  ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
              }`}
            />
            {nameError && (
              <p className="mt-1.5 text-sm text-red-500 text-center">{nameError}</p>
            )}
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

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      return
    }

    // Dernière étape : valider et enregistrer le Prénom Nom
    const trimmed = fullName.trim()
    if (trimmed.length < 2) {
      setNameError('Veuillez saisir votre prénom et nom (au moins 2 caractères).')
      return
    }
    if (!effectiveUserId) {
      setNameError('Session invalide. Rechargez la page.')
      return
    }

    setSaving(true)
    setNameError(null)
    try {
      const updated = await updateProfile(effectiveUserId, {
        full_name: trimmed,
        updated_at: new Date().toISOString()
      })
      if (!updated) throw new Error('Impossible d\'enregistrer le nom.')
      await supabase.auth.updateUser({ data: { full_name: trimmed } })
      await updateUserProfile()
      if (effectiveUserId) {
        localStorage.setItem(`hasSeenOnboarding_${effectiveUserId}`, 'true')
      } else {
        localStorage.setItem('hasSeenOnboarding', 'true')
      }
      onClose()
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
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
            {/* Indicateur d'étapes */}
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? theme === 'light'
                        ? 'w-6 bg-blue-600'
                        : 'w-6 bg-blue-500'
                      : theme === 'light'
                        ? 'w-1.5 bg-gray-300'
                        : 'w-1.5 bg-gray-600'
                  }`}
                />
              ))}
            </div>
            {/* Contenu */}
            <div>
              {steps[currentStep].content}
            </div>

            {/* Bouton Suivant / Commencer */}
            <div className="mt-6">
              <button
                onClick={handleNext}
                disabled={saving}
                className={`w-full py-2 px-6 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    : 'bg-blue-500/80 text-white hover:bg-blue-500 shadow-lg'
                }`}
              >
                {currentStep < steps.length - 1 ? 'Suivant' : saving ? 'Enregistrement…' : 'Commencer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
