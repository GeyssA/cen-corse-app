/**
 * Demande la permission micro côté natif (Android/iOS) avant d'appeler getUserMedia.
 * Sur Android, le WebView reçoit "Permission denied" si RECORD_AUDIO n'est pas accordée au runtime.
 */

import { isCapacitorNative } from './geolocation'

export type MicrophonePermissionResult = 'granted' | 'denied' | 'prompt'

/**
 * Demande la permission micro sur l'app native (Capacitor).
 * À appeler avant startListening() / getUserMedia pour que la boîte système soit bien "Microphone".
 * Retourne true si accordé ou si pas en natif (navigateur), ou si le plugin est indisponible (on laissera getUserMedia gérer).
 */
export async function requestMicrophonePermissionIfNeeded(): Promise<boolean> {
  if (!isCapacitorNative()) return true
  try {
    const { AudioPermission } = await import('capacitor-audio-permission')
    const status = await AudioPermission.requestPermissions()
    const audio = status?.audio
    if (audio === 'granted') return true
    if (audio === 'denied') return false
    /* 'prompt' / 'prompt-with-rationale' / 'undetermined' : on retourne true pour ne pas bloquer, getUserMedia déclenchera la boîte système */
    return true
  } catch {
    /* Plugin absent ou erreur (ex. build prod) : ne pas bloquer, laisser getUserMedia gérer */
    return true
  }
}

/**
 * Vérifie si la permission micro est déjà accordée (sans afficher de boîte).
 */
export async function checkMicrophonePermission(): Promise<MicrophonePermissionResult> {
  if (!isCapacitorNative()) return 'granted'
  try {
    const { AudioPermission } = await import('capacitor-audio-permission')
    const status = await AudioPermission.checkPermissions()
    const audio = status?.audio
    if (audio === 'granted') return 'granted'
    if (audio === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'prompt'
  }
}
