import { supabase } from './supabase'

export async function testSupabaseConnection() {
  console.log('🔍 Test de connexion Supabase...')
  
  try {
    // Test 1: Connexion de base
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Erreur lors du test de connexion:', profilesError)
      return false
    }
    
    console.log('✅ Connexion Supabase réussie!')
    console.log('📊 Nombre de profils dans la base:', profiles)
    
    // Test 2: Accès aux tables
    const tables = ['projects', 'activities', 'project_employees', 'project_partners', 'poll_options', 'votes']
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.error(`❌ Table ${table} inaccessible:`, error)
        } else {
          console.log(`✅ Table ${table} accessible`)
        }
      } catch (err) {
        console.error(`❌ Erreur avec la table ${table}:`, err)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Erreur inattendue lors du test:', error)
    return false
  }
}

export async function testProjectInsertion() {
  console.log('🧪 Test d\'insertion de projet...')
  
  try {
    // Test d'insertion simple
    const testProject = {
      title: 'Test Insertion',
      description: 'Test de création de projet',
      status: 'planning' as const,
      progress: 0,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      thematic: 'Test',
      pole: 'TOUS',
      created_by: '9cb0b75c-dc5d-458d-a275-cfa1e44e2f24' // Ton ID utilisateur
    }
    
    console.log('📝 Tentative d\'insertion avec:', testProject)
    
    const { data, error } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur d\'insertion:', error)
      console.error('❌ Code:', error.code)
      console.error('❌ Message:', error.message)
      console.error('❌ Détails:', error.details)
      return false
    }
    
    console.log('✅ Insertion réussie:', data)
    
    // Nettoyer le test
    await supabase
      .from('projects')
      .delete()
      .eq('title', 'Test Insertion')
    
    console.log('🧹 Test nettoyé')
    return true
    
  } catch (error) {
    console.error('❌ Erreur inattendue lors du test d\'insertion:', error)
    return false
  }
} 