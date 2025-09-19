import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { voterIds } = await request.json()

    if (!voterIds || !Array.isArray(voterIds)) {
      return NextResponse.json({ error: 'voterIds array required' }, { status: 400 })
    }

    console.log(`🔍 Récupération des noms pour ${voterIds.length} votants...`)

    // Récupérer les profils avec le service role (contourne les RLS)
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id, full_name')
      .in('id', voterIds)

    if (error) {
      console.error('Erreur lors de la récupération des profils:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!profiles) {
      return NextResponse.json([])
    }

    // Créer un mapping ID -> nom
    const idToName = new Map(profiles.map(profile => [profile.id, profile.full_name]))

    // Retourner les noms dans l'ordre des voterIds
    const voterNames = voterIds
      .map(id => idToName.get(id))
      .filter(name => name) // Filtrer les noms vides

    console.log(`✅ Récupéré ${voterNames.length} noms:`, voterNames)

    return NextResponse.json(voterNames)

  } catch (error) {
    console.error('Erreur inattendue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 