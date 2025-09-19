'use client'

import React, { useEffect } from 'react'
import { preloadImages } from '@/lib/imageCache'

export default function ImagePreloader() {
  useEffect(() => {
    // Précharger les images en arrière-plan au démarrage de l'app
    const preload = async () => {
      try {
        console.log('🖼️ Début du préchargement global des images...')
        await preloadImages()
        console.log('✅ Préchargement global des images terminé')
      } catch (error) {
        console.error('❌ Erreur lors du préchargement global des images:', error)
      }
    }

    // Démarrer le préchargement après un court délai pour ne pas bloquer l'interface
    const timer = setTimeout(preload, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  // Ce composant ne rend rien visuellement
  return null
}
