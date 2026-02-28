'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface AmbienceContextType {
  isMuted: boolean
  toggleMute: () => void
}

const AmbienceContext = createContext<AmbienceContextType | undefined>(undefined)

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true) // Par défaut, le son est coupé
  const [userInteracted, setUserInteracted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Créer l'élément audio une seule fois, mais ne pas le lancer
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/nature-ambience-323729.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.3 // Volume à 30% pour ne pas être trop fort
      audioRef.current.preload = 'metadata'
      // Ne pas lancer automatiquement, attendre que l'utilisateur clique sur le bouton
    }

    // Écouter les interactions utilisateur pour permettre l'audio
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true)
        console.log('🎵 Interaction utilisateur détectée - audio autorisé')
      }
    }

    // Écouter différents types d'interactions
    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })
    document.addEventListener('keydown', handleUserInteraction, { once: true })

    // Nettoyer à la destruction
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [userInteracted])

  const toggleMute = async () => {
    if (audioRef.current) {
      if (isMuted) {
        // Unmute: reprendre la lecture
        if (!userInteracted) {
          console.log('⚠️ Interaction utilisateur requise pour l\'audio')
          setUserInteracted(true) // Marquer comme interagi lors du clic
        }
        
        try {
          // Pour les PWAs, il faut s'assurer que l'audio est prêt
          audioRef.current.currentTime = 0
          await audioRef.current.play()
          console.log('✅ Audio ambiant démarré avec succès')
        } catch (error) {
          console.error('❌ Erreur lecture audio:', error)
          // Si l'audio ne peut pas démarrer, on reste en mode muet
          return
        }
      } else {
        // Mute: mettre en pause
        audioRef.current.pause()
        console.log('🔇 Audio ambiant mis en pause')
      }
      setIsMuted(!isMuted)
    }
  }

  return (
    <AmbienceContext.Provider value={{ isMuted, toggleMute }}>
      {children}
    </AmbienceContext.Provider>
  )
}

export function useAmbience() {
  const context = useContext(AmbienceContext)
  if (context === undefined) {
    throw new Error('useAmbience doit être utilisé dans un AmbienceProvider')
  }
  return context
}

