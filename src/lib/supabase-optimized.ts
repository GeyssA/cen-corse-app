'use client'

import { supabase } from './supabase'

interface ConnectionConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  timeout: number
}

const CONNECTION_CONFIG: ConnectionConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 seconde
  maxDelay: 8000,  // 8 secondes max
  timeout: 10000   // 10 secondes timeout
}

/**
 * Test de connectivité Supabase optimisé
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  latency: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    // Test simple avec timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONNECTION_CONFIG.timeout)
    )
    
    const testPromise = supabase
      .from('projects')
      .select('id')
      .limit(1)
      .single()
    
    await Promise.race([testPromise, timeoutPromise])
    
    const latency = Date.now() - startTime
    
    return {
      success: true,
      latency
    }
  } catch (error: any) {
    const latency = Date.now() - startTime
    
    return {
      success: false,
      latency,
      error: error.message
    }
  }
}

/**
 * Requête Supabase avec retry intelligent et gestion d'erreur optimisée
 */
export async function optimizedSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: Partial<ConnectionConfig> = {}
): Promise<{ data: T | null; error: any; latency?: number }> {
  const config = { ...CONNECTION_CONFIG, ...options }
  const startTime = Date.now()
  let lastError: any = null

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt}/${config.maxRetries} Supabase`)
      
      // Timeout pour cette tentative
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), config.timeout)
      )
      
      const result = await Promise.race([queryFn(), timeoutPromise]) as any
      
      if (result.error) {
        // Analyser le type d'erreur
        const errorType = analyzeError(result.error)
        
        if (errorType === 'auth') {
          console.log('🔐 Erreur d\'authentification - pas de retry')
          return { ...result, latency: Date.now() - startTime }
        }
        
        if (errorType === 'network' && attempt < config.maxRetries) {
          console.log(`🌐 Erreur réseau (tentative ${attempt}):`, result.error.message)
          lastError = result.error
          
          const delay = Math.min(
            config.baseDelay * Math.pow(2, attempt - 1),
            config.maxDelay
          )
          console.log(`⏳ Attente ${delay}ms avant retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        // Autres erreurs - pas de retry
        return { ...result, latency: Date.now() - startTime }
      }
      
      // Succès
      const latency = Date.now() - startTime
      console.log(`✅ Requête Supabase réussie (tentative ${attempt}, ${latency}ms)`)
      return { ...result, latency }
      
    } catch (error: any) {
      console.log(`❌ Erreur inattendue (tentative ${attempt}):`, error.message)
      lastError = error
      
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt - 1),
          config.maxDelay
        )
        console.log(`⏳ Attente ${delay}ms avant retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  const latency = Date.now() - startTime
  console.error(`❌ Échec définitif après ${config.maxRetries} tentatives (${latency}ms)`)
  return { data: null, error: lastError, latency }
}

/**
 * Analyser le type d'erreur Supabase
 */
function analyzeError(error: any): 'auth' | 'network' | 'database' | 'other' {
  const message = error.message?.toLowerCase() || ''
  const code = error.code?.toLowerCase() || ''
  
  // Erreurs d'authentification
  if (message.includes('jwt') || 
      message.includes('token') || 
      message.includes('auth') ||
      code.includes('auth')) {
    return 'auth'
  }
  
  // Erreurs réseau
  if (message.includes('network') || 
      message.includes('timeout') || 
      message.includes('fetch') ||
      message.includes('connection') ||
      code.includes('network')) {
    return 'network'
  }
  
  // Erreurs base de données
  if (message.includes('database') || 
      message.includes('sql') ||
      code.includes('db')) {
    return 'database'
  }
  
  return 'other'
}

/**
 * Vérifier la santé de la connexion Supabase
 */
export async function checkSupabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  details: string
}> {
  const result = await testSupabaseConnection()
  
  if (result.success) {
    if (result.latency < 1000) {
      return {
        status: 'healthy',
        latency: result.latency,
        details: `Connexion excellente (${result.latency}ms)`
      }
    } else if (result.latency < 3000) {
      return {
        status: 'degraded',
        latency: result.latency,
        details: `Connexion lente (${result.latency}ms)`
      }
    } else {
      return {
        status: 'degraded',
        latency: result.latency,
        details: `Connexion très lente (${result.latency}ms)`
      }
    }
  } else {
    return {
      status: 'unhealthy',
      latency: result.latency,
      details: `Connexion échouée: ${result.error}`
    }
  }
}
