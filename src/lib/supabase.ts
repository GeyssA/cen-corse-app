import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔍 Configuration Supabase:', {
  url: supabaseUrl ? 'PRÉSENT' : 'MANQUANT',
  key: supabaseAnonKey ? 'PRÉSENT' : 'MANQUANT',
  isPWA: typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : 'SSR'
})

// En PWA, désactiver la persistance de session pour forcer l'authentification
const isPWA = typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Refresh automatique activé
    persistSession: true,   // Persistance activée pour PWA aussi
    detectSessionInUrl: true
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