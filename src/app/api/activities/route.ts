import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('API Route - Début de la création d\'activité')
    
    const body = await request.json()
    console.log('Données reçues:', body)
    
    const { 
      name, 
      description, 
      location, 
      activity_date, 
      activity_time, 
      type, 
      region, 
      creator_name 
    } = body

    // Validation des champs obligatoires
    if (!name || !description || !activity_date || !type || !region || !creator_name) {
      console.log('Validation échouée - champs manquants')
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    console.log('Validation réussie, création de l\'activité...')

    // Vérifier que la table existe d'abord
    const { supabase } = await import('@/lib/supabase')
    console.log('Test d\'accès à la table...')
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('activities')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('Erreur de table:', tableError)
      console.error('Détails complets:', JSON.stringify(tableError, null, 2))
      return NextResponse.json(
        { error: `Erreur de base de données: ${tableError.message}` },
        { status: 500 }
      )
    }

    console.log('Table activities accessible')

    // Test d'insertion directe pour diagnostiquer
    console.log('Test d\'insertion directe...')
    const testData = {
      name,
      description,
      location: location || '',
      activity_date,
      activity_time: activity_time || '',
      type,
      region,
      creator_name
    }
    
    console.log('Données à insérer:', testData)
    
    const { data: directInsert, error: directError } = await supabase
      .from('activities')
      .insert([testData])
      .select()
      .single()

    if (directError) {
      console.error('Erreur d\'insertion directe:', directError)
      console.error('Détails complets:', JSON.stringify(directError, null, 2))
      return NextResponse.json(
        { error: `Erreur d'insertion: ${directError.message}` },
        { status: 500 }
      )
    }

    console.log('Insertion directe réussie:', directInsert)
    return NextResponse.json({ success: true, data: directInsert }, { status: 201 })

  } catch (error) {
    console.error('Erreur serveur dans API route:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('API Route - Récupération des activités')
    
    const { getActivities } = await import('@/lib/activities')
    const activities = await getActivities()

    console.log('Activités récupérées:', activities.length)
    return NextResponse.json({ data: activities }, { status: 200 })

  } catch (error) {
    console.error('Erreur serveur lors de la récupération:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

