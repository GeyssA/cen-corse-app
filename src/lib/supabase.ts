import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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