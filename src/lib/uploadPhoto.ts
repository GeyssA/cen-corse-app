import { supabase } from './supabase'
import { getMaxPhotoFileLabelFr } from './photoUploadLimits'

const BUCKET = 'photos'

export type UploadPhotoResult =
  | { ok: true; publicUrl: string }
  | { ok: false; message: string; canQueueOffline: boolean }

function mapStorageError(
  err: { message?: string; statusCode?: string } & Record<string, unknown>
): { message: string; canQueueOffline: boolean } {
  const m = (err?.message || '').toLowerCase()
  const code = String(err?.statusCode || '')
  if (code === '413' || m.includes('413') || m.includes('too large') || m.includes('payload') || m.includes('size limit')) {
    return {
      message: `Fichier refusé par le stockage (souvent trop lourd). L’appli accepte jusqu’à ${getMaxPhotoFileLabelFr()} par image ; le bucket Supabase peut aussi avoir sa propre limite (paramètres du projet).`,
      canQueueOffline: false
    }
  }
  if (m.includes('row-level security') || m.includes('not authorized') || m.includes('jwt') || code === '401') {
    return {
      message: 'Envoi de la photo refusé (session expirée ou droits). Reconnectez-vous et réessayez.',
      canQueueOffline: false
    }
  }
  return {
    message: 'Envoi de la photo impossible. Vérifiez la connexion, la taille du fichier et le format (image).',
    canQueueOffline: true
  }
}

/**
 * Upload une photo vers Supabase Storage.
 * Chemin : photos/{type}/{userId}/{timestamp}-{nom fichier}
 */
export async function uploadPhoto(
  file: File,
  type: 'observation' | 'site',
  userId: string
): Promise<UploadPhotoResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80)
  const path = `${type}/${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (error) {
    console.error('Erreur upload photo:', error)
    const mapped = mapStorageError(error)
    return { ok: false, message: mapped.message, canQueueOffline: mapped.canQueueOffline }
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = urlData?.publicUrl
  if (!publicUrl) {
    return { ok: false, message: 'Adresse de la photo introuvable après envoi. Réessayez.', canQueueOffline: true }
  }
  return { ok: true, publicUrl }
}
