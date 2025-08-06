import { supabase } from './supabase'

export async function debugProjectCreation() {
  try {
    console.log('🔍 Debug création de projet...')
    
    // 1. Vérifier l'utilisateur actuel
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 Utilisateur actuel:', user?.email)
    console.log('👤 User ID:', user?.id)
    
    if (userError) {
      console.error('❌ Erreur utilisateur:', userError)
      return
    }
    
    // 2. Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single()
    
    console.log('👤 Profil:', profile)
    console.log('👤 Rôle:', profile?.role)
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError)
      return
    }
    
    // 3. Tenter de créer un projet de test
    const testProject = {
      title: 'Projet Test Debug',
      description: 'Test de création',
      status: 'planning',
      progress: 0,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      thematic: 'Test',
      pole: 'TOUS',
      created_by: user?.id
    }
    
    console.log('📝 Tentative de création avec:', testProject)
    
    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erreur création projet:', createError)
      console.error('❌ Code erreur:', createError.code)
      console.error('❌ Message:', createError.message)
      console.error('❌ Détails:', createError.details)
    } else {
      console.log('✅ Projet créé avec succès:', createdProject)
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
} 