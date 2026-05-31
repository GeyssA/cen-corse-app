export interface SiteAire {
  name: string
  protocole: 'POPReptile' | 'POPAmphibien'
  siteIds: string[]
  updatedAt: string
}

function storageKey(userId: string): string {
  return `cencorse_site_aires_v1_${userId}`
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export function getAiresForUser(userId: string): SiteAire[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a): a is SiteAire => {
      if (!a || typeof a !== 'object') return false
      const obj = a as Record<string, unknown>
      return (
        typeof obj.name === 'string' &&
        (obj.protocole === 'POPReptile' || obj.protocole === 'POPAmphibien') &&
        Array.isArray(obj.siteIds)
      )
    })
  } catch {
    return []
  }
}

function saveAiresForUser(userId: string, aires: SiteAire[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(userId), JSON.stringify(aires))
}

export function getAireNamesForUser(
  userId: string,
  protocole?: 'POPReptile' | 'POPAmphibien'
): string[] {
  const names = getAiresForUser(userId)
    .filter((a) => !protocole || a.protocole === protocole)
    .map((a) => a.name.trim())
    .filter(Boolean)
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function getAireByNameForUser(
  userId: string,
  aireName: string,
  protocole: 'POPReptile' | 'POPAmphibien'
): SiteAire | null {
  const target = normalize(aireName)
  return (
    getAiresForUser(userId).find(
      (a) => a.protocole === protocole && normalize(a.name) === target
    ) ?? null
  )
}

export function upsertAireForUser(
  userId: string,
  aireName: string,
  protocole: 'POPReptile' | 'POPAmphibien',
  siteIds: string[]
): void {
  const trimmed = aireName.trim()
  if (!trimmed) return
  const uniqSiteIds = [...new Set(siteIds.filter(Boolean))]
  const now = new Date().toISOString()
  const current = getAiresForUser(userId)
  const target = normalize(trimmed)
  const idx = current.findIndex(
    (a) => a.protocole === protocole && normalize(a.name) === target
  )
  if (idx >= 0) {
    current[idx] = {
      ...current[idx],
      name: trimmed,
      siteIds: uniqSiteIds,
      updatedAt: now,
    }
  } else {
    current.push({
      name: trimmed,
      protocole,
      siteIds: uniqSiteIds,
      updatedAt: now,
    })
  }
  saveAiresForUser(userId, current)
}
