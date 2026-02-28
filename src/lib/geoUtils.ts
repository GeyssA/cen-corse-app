'use client'

/** Distance en mètres entre deux points (formule de Haversine). */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // rayon Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Longueur totale d'une polyligne en mètres. */
export function polylineLengthMeters(path: [number, number][]): number {
  if (path.length < 2) return 0
  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += haversineDistanceMeters(
      path[i - 1][0],
      path[i - 1][1],
      path[i][0],
      path[i][1]
    )
  }
  return Math.round(total * 10) / 10
}
