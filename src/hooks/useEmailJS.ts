import { useEffect, useState } from 'react'

declare global {
  interface Window {
    emailjs: any
  }
}

export const useEmailJS = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEmailJS = () => {
      if (typeof window !== 'undefined') {
        // Vérifier si EmailJS est déjà chargé
        if (window.emailjs) {
          setIsLoaded(true)
          return
        }

        // Charger le script EmailJS
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
        script.async = true
        
        script.onload = () => {
          try {
            // Initialiser EmailJS avec la clé publique
            const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
            if (publicKey && window.emailjs) {
              window.emailjs.init(publicKey)
              setIsLoaded(true)
              console.log('✅ EmailJS chargé avec succès')
            } else {
              setError('Clé publique EmailJS non trouvée')
            }
          } catch (err) {
            setError('Erreur lors de l\'initialisation d\'EmailJS')
            console.error('❌ Erreur EmailJS:', err)
          }
        }
        
        script.onerror = () => {
          setError('Erreur lors du chargement du script EmailJS')
        }
        
        document.head.appendChild(script)
      }
    }

    loadEmailJS()
  }, [])

  return { isLoaded, error }
}
