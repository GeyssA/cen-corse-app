import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Sur WebView Android, l’ancre <a download> et navigator.canShare + File sont souvent inopérants.
 * Écrire le fichier en cache + Share avec l’URL convient FileProvider.
 */
export async function shareTextFileOnNative(
  filename: string,
  text: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'fichier.txt'
  const path = `cen_export_${Date.now()}_${safe}`

  try {
    await Filesystem.writeFile({
      path,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
  } catch {
    return false
  }

  try {
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    })
    if (!uri) return false
    await Share.share({
      title: safe,
      text: 'Export CEN Corse (table de données)',
      url: uri,
      dialogTitle: 'Enregistrer ou partager le fichier',
    })
    return true
  } catch {
    // Annulation utilisateur = « succès » inutile, mais on retourne false pour fallback
    return false
  }
}
