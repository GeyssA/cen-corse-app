'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

export interface UseVoiceRecognitionResult {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  reset: () => void
}

export function useVoiceRecognition(): UseVoiceRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition != null || window.webkitSpeechRecognition != null)

  const reset = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      try {
        rec.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Reconnaissance vocale non supportée par ce navigateur.')
      return
    }

    const SpeechRecognitionClass = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setError('Reconnaissance vocale non disponible.')
      return
    }

    setError(null)
    setTranscript('')
    const rec = new SpeechRecognitionClass()
    recognitionRef.current = rec

    rec.continuous = false
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setIsListening(true)

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex]
      const text = result[0]?.transcript ?? ''
      setTranscript((prev) => (prev ? `${prev} ${text}` : text).trim())
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('Aucune parole détectée. Réessayez.')
      } else if (event.error === 'not-allowed') {
        setError('Microphone non autorisé.')
      } else {
        setError(event.error || 'Erreur reconnaissance vocale.')
      }
      setIsListening(false)
      recognitionRef.current = null
    }

    rec.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      rec.start()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de démarrer le micro.')
      setIsListening(false)
      recognitionRef.current = null
    }
  }, [isSupported])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    reset
  }
}
