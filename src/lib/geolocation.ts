/**
 * Récupère la position GPS.
 * Sur app (Capacitor Android/iOS) : utilise le plugin natif (demande d'autorisation système une seule fois).
 * Sur navigateur : utilise l'API Web Geolocation.
 */
export interface GeoPosition {
  latitude: number
  longitude: number
}

export interface GeoError {
  code: 1 | 2 | 3 // 1=permission denied, 2=position unavailable, 3=timeout
  message: string
}

/** true si on tourne dans l'app native (Capacitor Android/iOS), false en navigateur / run dev */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return cap?.isNativePlatform?.() === true
}

/**
 * Sur l'app (Capacitor) : demande la permission de localisation au système.
 * À appeler sur un clic utilisateur (ex. ouverture de la modale d'observation).
 * La réponse (Autoriser / Refuser) est conservée par Android/iOS pour les prochaines fois.
 */
export async function requestLocationPermissionIfNeeded(): Promise<void> {
  if (!isCapacitorNative()) return
  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    await Geolocation.requestPermissions()
  } catch {
    // Ignorer : l'utilisateur a refusé ou erreur ; la modale affichera le bouton si besoin
  }
}

/** Utilise Capacitor Geolocation sur app native, sinon navigator.geolocation. */
export async function getCurrentPositionAsync(): Promise<GeoPosition> {
  if (isCapacitorNative()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      })
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      const msg = typeof err?.message === 'string' ? err.message : ''
      const isPermission = /permission|denied|refus|autoris/i.test(msg)
      const message = isPermission
        ? 'L’app a besoin de la localisation. Au premier enregistrement, acceptez la demande du téléphone (« Autoriser »). Vous ne devrez le faire qu’une fois.'
        : msg || 'Position indisponible. Vérifiez le GPS et réessayez.'
      throw { code: isPermission ? 1 : 2, message } as GeoError
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw { code: 2, message: 'Géolocalisation non supportée.' } as GeoError
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err: GeolocationPositionError) => {
        const code = err.code as 1 | 2 | 3
        const message =
          code === 1
            ? 'Autorisez l’accès à la position (navigateur ou app).'
            : code === 2
              ? 'Position indisponible. Vérifiez le GPS.'
              : 'Délai dépassé. Réessayez (extérieur ou meilleur signal).'
        reject({ code, message } as GeoError)
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )
  })
}
