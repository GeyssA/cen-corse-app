import { NextRequest, NextResponse } from 'next/server'
import { getWhisperPrompt } from '@/lib/voiceObservationParser'

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'

/**
 * POST /api/transcribe
 * Reçoit un fichier audio, appelle Whisper (Groq gratuit ou OpenAI), retourne le texte.
 * Variables d'environnement : GROQ_API_KEY (gratuit, prioritaire) ou OPENAI_API_KEY
 */
export async function POST(request: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY
  const useGroq = Boolean(groqKey)
  const apiKey = groqKey ?? openAiKey

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Reconnaissance vocale non configurée (ajoutez GROQ_API_KEY ou OPENAI_API_KEY dans .env.local).' },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') ?? formData.get('audio')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Fichier audio manquant (envoyez un champ "file" ou "audio").' },
        { status: 400 }
      )
    }

    const blob = file as Blob
    if (blob.size === 0) {
      return NextResponse.json(
        { error: 'Fichier audio vide.' },
        { status: 400 }
      )
    }

    const url = useGroq ? GROQ_URL : OPENAI_URL
    const body = new FormData()
    body.append('file', blob, 'audio.webm')
    body.append('model', useGroq ? 'whisper-large-v3-turbo' : 'whisper-1')
    body.append('language', 'fr')
    const prompt = getWhisperPrompt()
    if (prompt) body.append('prompt', prompt)

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    })

    if (!res.ok) {
      const errBody = await res.text()
      const message =
        res.status === 401
          ? 'Clé API invalide.'
          : res.status === 429
            ? 'Quota dépassé. Réessayez plus tard.'
            : errBody || res.statusText
      return NextResponse.json({ error: message }, { status: res.status })
    }

    const data = (await res.json()) as { text?: string }
    const text = typeof data?.text === 'string' ? data.text.trim() : ''
    return NextResponse.json({ text })
  } catch (e) {
    console.error('[transcribe]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur lors de la transcription.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/transcribe
 * Indique si la transcription Whisper est disponible (GROQ_API_KEY ou OPENAI_API_KEY).
 */
export async function GET() {
  const available = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY)
  return NextResponse.json({ available })
}
