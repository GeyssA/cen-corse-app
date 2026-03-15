'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { useWhisperRecognition } from '@/hooks/useWhisperRecognition'
import { parseVoiceToObservation, type VoiceParsedObservation } from '@/lib/voiceObservationParser'
import { getCurrentPositionAsync, isCapacitorNative } from '@/lib/geolocation'
import { requestMicrophonePermissionIfNeeded } from '@/lib/microphonePermission'

const VOICE_INTRO_KEY = 'cencorse_voice_intro_seen'

export interface VoiceObservationFabProps {
  /** Afficher le FAB (mode vocal activé). */
  visible: boolean
  /** Appelé avec le formulaire pré-rempli et la position (ou null si GPS indisponible). */
  onObservationParsed: (
    initialForm: Partial<{
      groupe: string
      nom_espece: string
      stade: string
      sexe: string
      effectif: string
      remarques: string
    }>,
    position: { latitude: number; longitude: number } | null,
    transcript?: string
  ) => void
}

export default function VoiceObservationFab({ visible, onObservationParsed }: VoiceObservationFabProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [whisperAvailable, setWhisperAvailable] = useState<boolean | null>(null)

  const webSpeech = useVoiceRecognition()
  const whisper = useWhisperRecognition()

  useEffect(() => {
    if (!visible) return
    fetch('/api/transcribe')
      .then((r) => r.json())
      .then((data) => setWhisperAvailable(data?.available === true))
      .catch(() => setWhisperAvailable(false))
  }, [visible])

  const useWhisper = whisperAvailable === true
  const {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    reset
  } = useWhisper
    ? {
        isSupported: whisper.isSupported,
        isListening: whisper.isListening,
        transcript: whisper.transcript,
        error: whisper.error,
        startListening: whisper.startListening,
        stopListening: whisper.stopListening,
        reset: whisper.reset
      }
    : webSpeech

  const isTranscribing = useWhisper ? whisper.isTranscribing : false

  const positionRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const lastTranscriptRef = useRef('')
  const hasHandledRef = useRef(false)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [introModalOpen, setIntroModalOpen] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  /** Taxonomie complète (species-by-group) pour la recherche vocale sur toutes les espèces de l'app. */
  const [speciesByGroup, setSpeciesByGroup] = useState<Record<string, string[]> | null>(null)

  const hasSeenVoiceIntro = (): boolean => {
    if (typeof window === 'undefined') return true
    try {
      const key = user?.id ? `${VOICE_INTRO_KEY}_${user.id}` : VOICE_INTRO_KEY
      return localStorage.getItem(key) === '1'
    } catch { return true }
  }
  const setVoiceIntroSeen = () => {
    try {
      const key = user?.id ? `${VOICE_INTRO_KEY}_${user.id}` : VOICE_INTRO_KEY
      localStorage.setItem(key, '1')
    } catch {}
  }

  useEffect(() => {
    if (!visible) return
    fetch('/taxon/species-by-group.json')
      .then((r) => r.json())
      .then((data) => setSpeciesByGroup(typeof data === 'object' && data != null ? data as Record<string, string[]> : null))
      .catch(() => setSpeciesByGroup(null))
  }, [visible])

  useEffect(() => {
    if (!visible || isListening || isTranscribing || !transcript.trim()) return
    if (transcript === lastTranscriptRef.current && hasHandledRef.current) return
    lastTranscriptRef.current = transcript
    hasHandledRef.current = true

    const parsed: VoiceParsedObservation = parseVoiceToObservation(transcript, speciesByGroup)
    const initialForm: Parameters<typeof onObservationParsed>[0] = {
      groupe: parsed.groupe ? parsed.groupe.trim() : undefined,
      nom_espece: parsed.nom_espece ? parsed.nom_espece.trim() : undefined,
      stade: parsed.stade ? parsed.stade.trim() : undefined,
      sexe: parsed.sexe ? parsed.sexe.trim() : undefined,
      effectif: parsed.effectif ? parsed.effectif.trim() : undefined,
      remarques: 'donnée ajoutée grâce à la commande vocale'
    }
    onObservationParsed(initialForm, positionRef.current, transcript)
    reset()
    positionRef.current = null
    setVoiceModalOpen(false)
  }, [visible, isListening, isTranscribing, transcript, speciesByGroup, onObservationParsed, reset])

  const handleFabClick = async () => {
    if (!isSupported) return
    if (!hasSeenVoiceIntro()) {
      setIntroModalOpen(true)
      return
    }
    await startVoiceRecording()
  }

  const startVoiceRecording = async () => {
    hasHandledRef.current = false
    lastTranscriptRef.current = ''
    positionRef.current = null
    setPermissionError(null)
    setVoiceModalOpen(true)
    if (isCapacitorNative()) {
      const granted = await requestMicrophonePermissionIfNeeded()
      if (granted === false) {
        setPermissionError('Microphone non autorisé.')
        return
      }
    }
    startListening()
    getCurrentPositionAsync()
      .then((pos) => { positionRef.current = pos })
      .catch(() => {})
  }

  const handleIntroLancer = () => {
    setVoiceIntroSeen()
    setIntroModalOpen(false)
    startVoiceRecording()
  }

  const handleCloseVoiceModal = () => {
    setVoiceModalOpen(false)
    setPermissionError(null)
    if (isListening || (useWhisper && whisper.isTranscribing)) stopListening()
    reset()
  }

  const displayError = permissionError || error

  if (!visible) return null

  const isLight = theme === 'light'
  const showOverlay = voiceModalOpen

  return (
    <>
      <button
        type="button"
        onClick={handleFabClick}
        disabled={!isSupported || voiceModalOpen || introModalOpen}
        aria-label={showOverlay ? (isTranscribing ? 'Transcription en cours' : 'Enregistrement en cours') : 'Créer une observation à la voix'}
        className={`fixed bottom-32 right-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          voiceModalOpen
            ? 'bg-red-500 text-white focus:ring-red-400 animate-pulse'
            : isSupported
              ? `bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 animate-fab-mic`
              : 'bg-gray-400 cursor-not-allowed text-white'
        }`}
      >
        {voiceModalOpen ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {/* Modale d’intro commande vocale (première fois par compte) */}
      {introModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-intro-title"
        >
          <div className={`w-full max-w-sm px-6 py-5 rounded-2xl shadow-xl ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <h2 id="voice-intro-title" className={`text-lg font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Commande vocale
            </h2>
            <p className={`mt-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Décrivez ce que vous observez en une phrase. L’app remplira automatiquement le formulaire (groupe, espèce, effectif, stade, sexe).
            </p>
            <p className={`mt-3 text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Exemple de phrase à dire :
            </p>
            <p className={`mt-1 px-3 py-2 rounded-xl text-sm italic ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-200'}`}>
              « J’ai vu 2 crapauds des Baléares adultes mâles »
            </p>
            <p className={`mt-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Après avoir appuyé sur Lancer, parlez face au micro. L’enregistrement s’arrête après un court silence.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleIntroLancer}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                Lancer l’enregistrement
              </button>
              <button
                type="button"
                onClick={() => setIntroModalOpen(false)}
                className={`w-full py-2 text-sm ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale vocale : affichée dès le clic sur le micro */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/50 p-4"
          aria-live="polite"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-modal-title"
        >
          <div className={`w-full max-w-sm px-6 py-5 rounded-2xl shadow-xl ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <h2 id="voice-modal-title" className="sr-only">Saisie vocale</h2>
            {displayError ? (
              <>
                <p className={`text-lg font-medium text-red-600 ${isLight ? '' : 'text-red-400'}`}>{displayError}</p>
                <button
                  type="button"
                  onClick={handleCloseVoiceModal}
                  className="mt-4 w-full py-3 rounded-xl bg-slate-200 text-slate-800 font-medium hover:bg-slate-300"
                >
                  Fermer
                </button>
              </>
            ) : !isListening && !isTranscribing ? (
              <>
                <p className={`text-lg font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Chargement…
                </p>
                <p className={`mt-1 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Préparation du micro et de la position.
                </p>
              </>
            ) : isTranscribing ? (
              <>
                <p className={`text-lg font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Transcription en cours…
                </p>
                {transcript && (
                  <p className={`mt-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{transcript}</p>
                )}
              </>
            ) : (
              <>
                <p className={`text-lg font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Qu'avez-vous vu ?
                </p>
                <p className={`mt-1 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ex. « deux crapauds verts adultes mâles ». L’enregistrement s’arrête automatiquement après un court silence.
                </p>
                <button
                  type="button"
                  onClick={stopListening}
                  className="mt-4 w-full py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600"
                >
                  Arrête et envoie
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleCloseVoiceModal}
              className={`mt-3 w-full py-2 text-sm ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {displayError && !showOverlay && (
        <div className="fixed bottom-32 left-4 right-4 z-40 px-4 py-3 rounded-xl bg-red-100 text-red-800 text-sm shadow-lg">
          {displayError}
        </div>
      )}
    </>
  )
}
