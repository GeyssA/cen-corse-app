import { supabase } from './supabase'

export interface Activity {
  id?: string
  name: string
  description: string
  location?: string
  activity_date: string
  activity_time?: string
  type: string
  region: string
  creator_name: string
  created_at?: string
  updated_at?: string
}

// Récupérer toutes les activités (seulement les futures)
export async function getActivities(): Promise<Activity[]> {
  try {
    const today = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .gte('activity_date', today) // Seulement les activités d'aujourd'hui et futures
      .order('activity_date', { ascending: true }) // Trier par date croissante
      .order('activity_time', { ascending: true }) // Puis par heure croissante

    if (error) {
      console.error('Erreur lors de la récupération des activités:', error)
      return []
    }

    return activities || []
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des activités:', error)
    return []
  }
}

// Récupérer une activité par ID
export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    const { data: activity, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error)
      return null
    }

    return activity
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération de l\'activité:', error)
    return null
  }
}

// Créer une nouvelle activité
export async function createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity | null> {
  try {
    console.log('🚀 createActivity - Début')
    console.log('📝 ActivityData:', activityData)
    
    const { data: activity, error } = await supabase
      .from('activities')
      .insert([activityData]) // Insérer comme tableau
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur lors de la création de l\'activité:', error)
      console.error('❌ Détails de l\'erreur:', error.message, error.details, error.hint)
      return null
    }

    console.log('✅ Activité créée avec succès:', activity)
    return activity
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la création de l\'activité:', error)
    return null
  }
}

// Mettre à jour une activité
export async function updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'activité:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour de l\'activité:', error)
    return null
  }
}

// Supprimer une activité
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    console.log('🗑️ deleteActivity - Début pour l\'activité:', id)

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Erreur lors de la suppression de l\'activité:', error)
      return false
    }

    console.log('✅ Activité supprimée avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la suppression de l\'activité:', error)
    return false
  }
}

// Récupérer les activités par région (seulement les futures)
export async function getActivitiesByRegion(region: string): Promise<Activity[]> {
  try {
    const today = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('region', region)
      .gte('activity_date', today) // Seulement les activités d'aujourd'hui et futures
      .order('activity_date', { ascending: true })
      .order('activity_time', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des activités par région:', error)
      return []
    }

    return activities || []
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des activités par région:', error)
    return []
  }
}

// Récupérer les activités par type (seulement les futures)
export async function getActivitiesByType(type: string): Promise<Activity[]> {
  try {
    const today = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('type', type)
      .gte('activity_date', today) // Seulement les activités d'aujourd'hui et futures
      .order('activity_date', { ascending: true })
      .order('activity_time', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des activités par type:', error)
      return []
    }

    return activities || []
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des activités par type:', error)
    return []
  }
}

// ===== FONCTIONS POUR LES INTRÊTS D'ACTIVITÉS =====

// Ajouter un intérêt pour une activité
export async function addActivityInterest(activityId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('Utilisateur non authentifié')
      return false
    }

    // Récupérer le profil utilisateur pour obtenir le nom
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Récupérer le nom de l'activité
    const { data: activity } = await supabase
      .from('activities')
      .select('name')
      .eq('id', activityId)
      .single()

    if (!activity) {
      console.error('Activité non trouvée')
      return false
    }

    const { error } = await supabase
      .from('activity_interests')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        user_name: profile?.full_name || user.email || 'Utilisateur anonyme',
        activity_name: activity.name
      })

    if (error) {
      console.error('Erreur lors de l\'ajout de l\'intérêt:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors de l\'ajout de l\'intérêt:', error)
    return false
  }
}

// Supprimer un intérêt pour une activité
export async function removeActivityInterest(activityId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('Utilisateur non authentifié')
      return false
    }

    const { error } = await supabase
      .from('activity_interests')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la suppression de l\'intérêt:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression de l\'intérêt:', error)
    return false
  }
}

// Vérifier si l'utilisateur s'intéresse à une activité
export async function hasUserInterestInActivity(activityId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('activity_interests')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun résultat trouvé
        return false
      }
      console.error('Erreur lors de la vérification de l\'intérêt:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Erreur inattendue lors de la vérification de l\'intérêt:', error)
    return false
  }
}

// Récupérer le nombre d'intérêts pour une activité
export async function getActivityInterestCount(activityId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('activity_interests')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)

    if (error) {
      console.error('Erreur lors du comptage des intérêts:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Erreur inattendue lors du comptage des intérêts:', error)
    return 0
  }
}