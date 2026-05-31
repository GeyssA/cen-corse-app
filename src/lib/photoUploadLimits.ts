const MAX_PHOTO_FILE_BYTES = 20 * 1024 * 1024

function formatBytesFr(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) {
    const k = n / 1024
    return `${(k < 10 ? k.toFixed(1) : Math.round(k)).toString().replace('.', ',')} Kio`
  }
  const m = n / (1024 * 1024)
  return `${m.toFixed(1).replace('.', ',')} Mo`
}

export function getMaxPhotoFileBytes(): number {
  return MAX_PHOTO_FILE_BYTES
}

export function getMaxPhotoFileLabelFr(): string {
  return '20 Mo'
}

/**
 * Côté app, chaque photo d’observation / de site ne doit pas dépasser cette taille
 * (évite l’échec silencieux, les timeouts et les erreurs 413 côté Supabase Storage
 * — la limite exacte du bucket se règle aussi dans le tableau de bord Supabase).
 */
export function validatePhotoFileForUpload(file: File): string | null {
  if (file.size === 0) {
    return 'Ce fichier est vide. Choisissez une autre image.'
  }
  if (file.size > MAX_PHOTO_FILE_BYTES) {
    return `Cette image est trop lourde (max. ${getMaxPhotoFileLabelFr()} par fichier — ${formatBytesFr(
      file.size
    )} ici). Compressez ou recadrez l’image, puis réessayez.`
  }
  const t = (file.type || '').toLowerCase()
  if (t && !t.startsWith('image/')) {
    return 'Veuillez choisir un fichier image (JPEG, PNG, etc.).'
  }
  return null
}

export function validatePhotoFileListForUpload(files: File[]): string | null {
  for (const f of files) {
    const v = validatePhotoFileForUpload(f)
    if (v) return v
  }
  return null
}
