import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes:', {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
  // En mode build, ne pas lancer d'erreur
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.warn('⚠️ Build en cours, variables Supabase non disponibles')
  } else {
    throw new Error('Configuration Supabase manquante. Vérifiez vos variables d\'environnement.')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'cen-corse-app'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Fonction pour créer le client admin Supabase
function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuration Supabase admin manquante.')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Client admin Supabase (initialisé seulement quand nécessaire)
let supabaseAdminClient: SupabaseClient | null = null

export const supabaseAdmin = {
  get client() {
    if (!supabaseAdminClient) {
      supabaseAdminClient = createSupabaseAdminClient()
    }
    return supabaseAdminClient
  }
} 