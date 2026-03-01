const MAX_PHOTOS = 3

/**
 * Parse photo_url from DB: can be a JSON array string '["url1","url2"]'
 * or a single URL string (rétrocompatibilité).
 */
export function parsePhotoUrls(photo_url: string | null | undefined): string[] {
  if (photo_url == null || photo_url === '') return []
  const trimmed = photo_url.trim()
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed) as unknown
      return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === 'string') : [trimmed]
    } catch {
      return [trimmed]
    }
  }
  return [trimmed]
}

/**
 * Serialize an array of photo URLs for storage in photo_url (max 3).
 */
export function serializePhotoUrls(urls: string[]): string | null {
  const list = urls.filter(Boolean).slice(0, MAX_PHOTOS)
  return list.length > 0 ? JSON.stringify(list) : null
}

export { MAX_PHOTOS }
