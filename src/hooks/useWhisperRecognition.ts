'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

/** Détection du silence : arrêt auto après cette durée (ms). 2 s pour laisser le temps de faire une courte pause sans déclencher l'envoi. */
const SILENCE_DURATION_MS = 2000
/** Délai supplémentaire après la fin de la parole avant d'arrêter (évite les coupures trop sèches). */
const POST_SPEECH_DELAY_MS = 500
const VOLUME_THRESHOLD = 0.012
const CHECK_INTERVAL_MS = 150

export interface UseWhisperRecognitionResult {
  isSupported: boolean
  isListening: boolean
  isTranscribing: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  reset: () => void
}

/** Enregistre l'audio au micro puis envoie à l'API Whisper pour une transcription précise. */
export function useWhisperRecognition(): UseWhisperRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const silenceStartRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices?.getUserMedia != null &&
    window.MediaRecorder != null

  const reset = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    silenceStartRef.current = null
    analyserRef.current = null
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
    }
    mediaRecorderRef.current = null
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Enregistrement audio non supporté.')
      return
    }

    setError(null)
    setTranscript('')
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        analyserRef.current = null
        setIsListening(false)
        const chunks = chunksRef.current
        if (chunks.length === 0) {
          setError('Aucun enregistrement. Parlez plus longtemps.')
          return
        }
        const blob = new Blob(chunks, { type: mimeType })
        setIsTranscribing(true)
        setError(null)
        try {
          const formData = new FormData()
          formData.append('file', blob, 'audio.webm')
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data?.error ?? 'Erreur de transcription.')
            return
          }
          const text = typeof data?.text === 'string' ? data.text.trim() : ''
          setTranscript(text)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Erreur réseau.')
        } finally {
          setIsTranscribing(false)
        }
      }

      mr.onerror = () => {
        setError('Erreur d\'enregistrement.')
        setIsListening(false)
        stream.getTracks().forEach((t) => t.stop())
      }

      mr.start(1000)
      setIsListening(true)
      silenceStartRef.current = null

      // Détection du silence : arrêt auto après SILENCE_DURATION_MS
      try {
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.6
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        intervalRef.current = setInterval(() => {
          if (!analyserRef.current || mediaRecorderRef.current?.state !== 'recording') return
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          const normalized = avg / 255
          if (normalized < VOLUME_THRESHOLD) {
            const now = Date.now()
            if (silenceStartRef.current === null) silenceStartRef.current = now
            else if (now - silenceStartRef.current >= SILENCE_DURATION_MS) {
              // Court délai après la fin de la parole avant d'arrêter
              const delay = POST_SPEECH_DELAY_MS
              silenceStartRef.current = null
              setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') stopListening()
              }, delay)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
            }
          } else {
            silenceStartRef.current = null
          }
        }, CHECK_INTERVAL_MS)
      } catch {
        // Pas de détection de silence (navigateur ou contexte audio)
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError('Microphone non autorisé.')
      } else {
        setError(e instanceof Error ? e.message : 'Impossible d\'accéder au micro.')
      }
      setIsListening(false)
    }
  }, [isSupported, stopListening])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  return {
    isSupported,
    isListening,
    isTranscribing,
    transcript,
    error,
    startListening,
    stopListening,
    reset,
  }
}
