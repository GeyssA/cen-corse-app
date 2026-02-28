// Configuration pour les appels API
// En mode Capacitor (app native), on pointe vers l'URL Vercel
// En mode web, on utilise les routes API locales

const getApiUrl = () => {
  // Vérifier si on est dans Capacitor
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    // Mode Capacitor : utiliser l'URL Vercel
    return process.env.NEXT_PUBLIC_VERCEL_URL || 'https://cen-corse-app.vercel.app'
  }
  
  // Mode web : utiliser les routes API locales
  return ''
}

export const API_BASE_URL = getApiUrl()

export const getApiEndpoint = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`
  }
  return path
}










