import { supabase } from './supabase'

const BUCKET = 'photos'

/**
 * Upload une photo vers Supabase Storage et retourne l'URL publique.
 * Chemin : photos/{type}/{userId}/{timestamp}-{nom fichier}
 */
export async function uploadPhoto(
  file: File,
  type: 'observation' | 'site',
  userId: string
): Promise<string | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80)
  const path = `${type}/${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (error) {
    console.error('Erreur upload photo:', error)
    return null
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return urlData?.publicUrl ?? null
}
