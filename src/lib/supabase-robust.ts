import { supabase } from './supabase'

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 seconde
  maxDelay: 10000, // 10 secondes
  backoffFactor: 2
}

/**
 * Exécute une requête Supabase avec retry automatique et gestion d'erreur robuste
 */
export async function robustSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any = null

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt}/${opts.maxRetries} pour requête Supabase`)
      
      const result = await queryFn()
      
      if (result.error) {
        // Erreur Supabase
        if (result.error.message?.includes('JWT') || 
            result.error.message?.includes('token') ||
            result.error.message?.includes('auth')) {
          console.log('🔐 Erreur d\'authentification - pas de retry')
          return result
        }
        
        if (result.error.message?.includes('network') ||
            result.error.message?.includes('timeout') ||
            result.error.message?.includes('fetch')) {
          console.log(`🌐 Erreur réseau (tentative ${attempt}):`, result.error.message)
          lastError = result.error
          
          if (attempt < opts.maxRetries) {
            const delay = Math.min(
              opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
              opts.maxDelay
            )
            console.log(`⏳ Attente ${delay}ms avant retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // Autres erreurs - pas de retry
        return result
      }
      
      // Succès
      console.log(`✅ Requête Supabase réussie (tentative ${attempt})`)
      return result
      
    } catch (error: any) {
      console.log(`❌ Erreur inattendue (tentative ${attempt}):`, error.message)
      lastError = error
      
      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
          opts.maxDelay
        )
        console.log(`⏳ Attente ${delay}ms avant retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  console.error(`❌ Échec définitif après ${opts.maxRetries} tentatives`)
  return { data: null, error: lastError }
}

/**
 * Vérifie la connectivité Supabase avec retry
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const result = await robustSupabaseQuery(
      async () => {
        const queryResult = await supabase.from('projects').select('id').limit(1)
        return queryResult
      },
      { maxRetries: 2, baseDelay: 500 }
    )
    return !result.error
  } catch {
    return false
  }
}

/**
 * Exécute une requête avec fallback sur le cache local
 */
export async function robustQueryWithCache<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  cacheExpiration: number = 5 * 60 * 1000, // 5 minutes
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
  
  // Essayer d'abord la requête Supabase
  const result = await robustSupabaseQuery(queryFn, options)
  
  if (!result.error && result.data) {
    // Succès - mettre en cache
    try {
      const cacheData = {
        data: result.data,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log(`💾 Données mises en cache: ${cacheKey}`)
    } catch (cacheError) {
      console.log('⚠️ Erreur mise en cache:', cacheError)
    }
    return result
  }
  
  // Échec - essayer le cache
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const cacheData = JSON.parse(cached)
      const age = Date.now() - cacheData.timestamp
      
      if (age < cacheExpiration) {
        console.log(`📱 Utilisation du cache: ${cacheKey} (âge: ${Math.round(age/1000)}s)`)
        return { data: cacheData.data, error: null, fromCache: true }
      } else {
        console.log(`🗑️ Cache expiré: ${cacheKey}`)
        localStorage.removeItem(cacheKey)
      }
    }
  } catch (cacheError) {
    console.log('⚠️ Erreur lecture cache:', cacheError)
  }
  
  // Pas de cache disponible
  return result
}
