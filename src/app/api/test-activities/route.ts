import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Test de diagnostic de base')
    
    // Test 1: Vérifier que l'import Supabase fonctionne
    let supabase
    try {
      const supabaseModule = await import('@/lib/supabase')
      supabase = supabaseModule.supabase
      console.log('✅ Import Supabase réussi')
    } catch (importError) {
      console.error('❌ Erreur d\'import Supabase:', importError)
      return NextResponse.json({
        success: false,
        error: 'Erreur d\'import Supabase',
        details: importError
      }, { status: 500 })
    }

    // Test 2: Vérifier la configuration Supabase
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('🔍 Test d\'authentification:', { user: !!user, error: authError })
    } catch (authTestError) {
      console.error('❌ Erreur d\'authentification:', authTestError)
    }

    // Test 3: Vérifier l'accès à la table
    try {
      const { data: testData, error: testError } = await supabase
        .from('activities')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ Erreur d\'accès à la table:', testError)
        return NextResponse.json({
          success: false,
          error: 'Erreur d\'accès à la table',
          details: testError,
          errorCode: testError.code,
          errorMessage: testError.message,
          errorDetails: testError.details,
          errorHint: testError.hint
        }, { status: 500 })
      }

      console.log('✅ Accès à la table réussi')

      return NextResponse.json({
        success: true,
        message: 'Tests de base réussis',
        tableAccess: true,
        testData
      }, { status: 200 })

    } catch (tableError) {
      console.error('❌ Erreur inattendue avec la table:', tableError)
      return NextResponse.json({
        success: false,
        error: 'Erreur inattendue avec la table',
        details: tableError
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erreur inattendue générale:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur inattendue générale',
      details: error,
      stack: error.stack
    }, { status: 500 })
  }
}
