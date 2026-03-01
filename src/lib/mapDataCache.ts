/**
 * Cache léger pour les données de la carte (sites + observations).
 * Réduit le temps d'ouverture "Voir la map" quand on rouvre rapidement.
 */
import type { Observation } from './observations'
import type { ObservationSite } from './sites'

const CACHE_TTL_MS = 45_000 // 45 secondes

let cache: {
  userId: string
  observations: Observation[]
  sites: ObservationSite[]
  timestamp: number
} | null = null

export function getCachedMapData(userId: string): { observations: Observation[]; sites: ObservationSite[] } | null {
  if (!cache || cache.userId !== userId) return null
  if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
    cache = null
    return null
  }
  return { observations: cache.observations, sites: cache.sites }
}

export function setCachedMapData(userId: string, data: { observations: Observation[]; sites: ObservationSite[] }): void {
  cache = { userId, ...data, timestamp: Date.now() }
}

export function invalidateMapDataCache(): void {
  cache = null
}
