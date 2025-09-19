import { supabase } from './supabase'
import { getCachedData, setCachedData, isOnline } from './cache'

export interface Project {
  id?: string
  title: string
  description: string
  location?: string
  status: 'planning' | 'active' | 'completed'
  progress: number
  start_date: string
  end_date: string
  deadline?: string
  thematic: string
  pole: string
  created_by?: string
  created_at?: string
  updated_at?: string
  is_private_for_visitors?: boolean
}

export interface ProjectEmployee {
  id?: string
  project_id: string
  employee_name: string
  created_at?: string
}

export interface ProjectPartner {
  id?: string
  project_id: string
  partner_name: string
  created_at?: string
}

export interface ProjectThematic {
  id?: string
  project_id: string
  thematic_name: string
  created_at?: string
}

// Récupérer tous les projets avec pagination
export async function getProjects(limit = 10, offset = 0): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, status, progress, start_date, end_date, thematic, pole, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erreur lors de la récupération des projets:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des projets:', error)
    return []
  }
}

// Récupérer un projet par ID avec ses employés et partenaires
export async function getProjectById(id: string): Promise<Project & { employees: string[], partners: string[], thematics: string[] } | null> {
  try {
    // Récupérer le projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError) {
      console.error('Erreur lors de la récupération du projet:', projectError)
      return null
    }

    // Récupérer les employés
    const { data: employees, error: employeesError } = await supabase
      .from('project_employees')
      .select('employee_name')
      .eq('project_id', id)

    if (employeesError) {
      console.error('Erreur lors de la récupération des employés:', employeesError)
    }

    // Récupérer les partenaires
    const { data: partners, error: partnersError } = await supabase
      .from('project_partners')
      .select('partner_name')
      .eq('project_id', id)

    if (partnersError) {
      console.error('Erreur lors de la récupération des partenaires:', partnersError)
    }

    // Récupérer les thématiques
    const { data: thematics, error: thematicsError } = await supabase
      .from('project_thematics')
      .select('thematic_name')
      .eq('project_id', id)

    if (thematicsError) {
      console.error('Erreur lors de la récupération des thématiques:', thematicsError)
    }

    return {
      ...project,
      employees: employees?.map(e => e.employee_name) || [],
      partners: partners?.map(p => p.partner_name) || [],
      thematics: thematics?.map(t => t.thematic_name) || []
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération du projet:', error)
    return null
  }
}

// Créer un nouveau projet
export async function createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>, employees: string[], partners: string[], thematics: string[] = []): Promise<Project | null> {
  try {
    console.log('🔍 createProject - Début')
    console.log('📊 projectData:', projectData)
    console.log('👤 created_by:', projectData.created_by)
    
    // Vérifier que les données requises sont présentes
    if (!projectData.title || !projectData.description || !projectData.start_date || !projectData.end_date) {
      console.error('❌ Données manquantes pour la création du projet')
      return null
    }

    // Préparer les données d'insertion
    const insertData = {
      title: projectData.title,
      description: projectData.description,
      location: projectData.location || '',
      status: projectData.status,
      progress: projectData.progress || 0,
      start_date: projectData.start_date,
      end_date: projectData.end_date,
      thematic: projectData.thematic || '',
      pole: projectData.pole || 'TOUS',
      created_by: projectData.created_by,
      is_private_for_visitors: projectData.is_private_for_visitors || false
    }
    
    console.log('📝 Données préparées pour insertion:', insertData)

    // Insérer le projet principal avec timeout court
    console.log('🚀 Tentative d\'insertion du projet principal...')
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single()
    
    console.log('📋 Résultat de l\'insertion:', { project, error: projectError })
    
    if (projectError) {
      console.error('❌ Erreur lors de la création du projet:', projectError)
      console.error('❌ Code d\'erreur:', projectError.code)
      console.error('❌ Message d\'erreur:', projectError.message)
      return null
    }

    if (!project) {
      console.error('❌ Aucun projet retourné après insertion')
      return null
    }

    console.log('✅ Projet créé avec succès:', project)

    // Insérer les employés si présents (en arrière-plan)
    if (employees && employees.length > 0) {
      const employeesData = employees.map(employee => ({
        project_id: project.id,
        employee_name: employee.trim()
      })).filter(emp => emp.employee_name.length > 0)

      if (employeesData.length > 0) {
        try {
          await supabase
            .from('project_employees')
            .insert(employeesData)
          console.log('✅ Employés ajoutés avec succès')
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajout des employés:', error)
        }
      }
    }

    // Insérer les partenaires si présents (en arrière-plan)
    if (partners && partners.length > 0) {
      const partnersData = partners.map(partner => ({
        project_id: project.id,
        partner_name: partner.trim()
      })).filter(partner => partner.partner_name.length > 0)

      if (partnersData.length > 0) {
        try {
          await supabase
            .from('project_partners')
            .insert(partnersData)
          console.log('✅ Partenaires ajoutés avec succès')
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajout des partenaires:', error)
        }
      }
    }

    // Insérer les thématiques si présentes (en arrière-plan)
    if (thematics && thematics.length > 0) {
      const thematicsData = thematics.map(thematic => ({
        project_id: project.id,
        thematic_name: thematic.trim()
      })).filter(thematic => thematic.thematic_name.length > 0)

      if (thematicsData.length > 0) {
        try {
          await supabase
            .from('project_thematics')
            .insert(thematicsData)
          console.log('✅ Thématiques ajoutées avec succès')
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajout des thématiques:', error)
        }
      }
    }

    console.log('🎉 createProject - Fin avec succès')
    return project
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la création du projet:', error)
    if (error instanceof Error) {
      console.error('❌ Type d\'erreur:', error.name)
      console.error('❌ Message d\'erreur:', error.message)
    }
    return null
  }
}

// Mettre à jour un projet
export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du projet:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour du projet:', error)
    return null
  }
}

// Supprimer un projet
export async function deleteProject(id: string): Promise<boolean> {
  try {
    console.log('🗑️ deleteProject - Début pour le projet:', id)
    
    // Suppression directe sans vérification préalable
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur lors de la suppression du projet:', error)
      console.error('❌ Code d\'erreur:', error.code)
      console.error('❌ Message d\'erreur:', error.message)
      return false
    }

    console.log('✅ Projet supprimé avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la suppression du projet:', error)
    if (error instanceof Error) {
      console.error('❌ Type d\'erreur:', error.name)
      console.error('❌ Message d\'erreur:', error.message)
    }
    return false
  }
}

// Mettre à jour les employés d'un projet
export async function updateProjectEmployees(projectId: string, employees: string[]): Promise<boolean> {
  try {
    // Supprimer les employés existants
    const { error: deleteError } = await supabase
      .from('project_employees')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Erreur lors de la suppression des employés:', deleteError)
      return false
    }

    // Ajouter les nouveaux employés avec gestion des conflits
    if (employees && employees.length > 0) {
      const employeesData = employees.map(employee => ({
        project_id: projectId,
        employee_name: employee.trim()
      })).filter(emp => emp.employee_name.length > 0)

      if (employeesData.length > 0) {
        const { error: insertError } = await supabase
          .from('project_employees')
          .upsert(employeesData, { 
            onConflict: 'project_id,employee_name',
            ignoreDuplicates: true 
          })

        if (insertError) {
          console.error('Erreur lors de l\'ajout des employés:', insertError)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour des employés:', error)
    return false
  }
}

// Mettre à jour les partenaires d'un projet
export async function updateProjectPartners(projectId: string, partners: string[]): Promise<boolean> {
  try {
    // Supprimer les partenaires existants
    const { error: deleteError } = await supabase
      .from('project_partners')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Erreur lors de la suppression des partenaires:', deleteError)
      return false
    }

    // Ajouter les nouveaux partenaires avec gestion des conflits
    if (partners && partners.length > 0) {
      const partnersData = partners.map(partner => ({
        project_id: projectId,
        partner_name: partner.trim()
      })).filter(partner => partner.partner_name.length > 0)

      if (partnersData.length > 0) {
        const { error: insertError } = await supabase
          .from('project_partners')
          .upsert(partnersData, { 
            onConflict: 'project_id,partner_name',
            ignoreDuplicates: true 
          })

        if (insertError) {
          console.error('Erreur lors de l\'ajout des partenaires:', insertError)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour des partenaires:', error)
    return false
  }
}

// Mettre à jour les thématiques d'un projet
export async function updateProjectThematics(projectId: string, thematics: string[]): Promise<boolean> {
  try {
    // Supprimer les thématiques existantes
    const { error: deleteError } = await supabase
      .from('project_thematics')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Erreur lors de la suppression des thématiques:', deleteError)
      return false
    }

    // Ajouter les nouvelles thématiques avec gestion des conflits
    if (thematics && thematics.length > 0) {
      const thematicsData = thematics.map(thematic => ({
        project_id: projectId,
        thematic_name: thematic.trim()
      })).filter(thematic => thematic.thematic_name.length > 0)

      if (thematicsData.length > 0) {
        const { error: insertError } = await supabase
          .from('project_thematics')
          .upsert(thematicsData, { 
            onConflict: 'project_id,thematic_name',
            ignoreDuplicates: true 
          })

        if (insertError) {
          console.error('Erreur lors de l\'ajout des thématiques:', insertError)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour des thématiques:', error)
    return false
  }
}

// Récupérer les projets avec leurs employés et partenaires pour les statistiques
export async function getProjectsWithDetails(limit = 100, offset = 0): Promise<(Project & { employees: string[], partners: string[], thematics: string[] })[]> {
  // Vérifier le cache d'abord
  const cachedData = getCachedData()
  if (cachedData && offset === 0) {
    console.log('📱 Utilisation du cache pour les projets')
    return cachedData.projects.slice(0, limit) as (Project & { employees: string[], partners: string[], thematics: string[] })[]
  }

  try {
    // Si pas de cache ou pagination, récupérer depuis Supabase
    console.log('🌐 Récupération des projets depuis Supabase')
    
    // Récupérer tous les projets
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (projectsError) {
      console.error('Erreur lors de la récupération des projets:', projectsError)
      
      // Si erreur et qu'on a du cache, l'utiliser
      const fallbackCache = getCachedData()
      if (fallbackCache && !isOnline()) {
        console.log('🔄 Utilisation du cache en cas d\'erreur réseau')
        return fallbackCache.projects.slice(0, limit) as (Project & { employees: string[], partners: string[], thematics: string[] })[]
      }
      
      return []
    }

    if (!projects || projects.length === 0) {
      return []
    }

    // Récupérer les employés pour tous les projets
    const { data: employees, error: employeesError } = await supabase
      .from('project_employees')
      .select('project_id, employee_name')
      .in('project_id', projects.map(p => p.id))

    if (employeesError) {
      console.error('Erreur lors de la récupération des employés:', employeesError)
    }

    // Récupérer les partenaires pour tous les projets
    const { data: partners, error: partnersError } = await supabase
      .from('project_partners')
      .select('project_id, partner_name')
      .in('project_id', projects.map(p => p.id))

    if (partnersError) {
      console.error('Erreur lors de la récupération des partenaires:', partnersError)
    }

    // Récupérer les thématiques pour tous les projets
    const { data: thematics, error: thematicsError } = await supabase
      .from('project_thematics')
      .select('project_id, thematic_name')
      .in('project_id', projects.map(p => p.id))

    if (thematicsError) {
      console.error('❌ Erreur lors de la récupération des thématiques:', thematicsError)
      console.error('❌ Code d\'erreur:', thematicsError.code)
      console.error('❌ Message d\'erreur:', thematicsError.message)
      console.error('❌ Détails:', thematicsError.details)
    } else {
      console.log('✅ Thématiques récupérées avec succès:', thematics?.length || 0, 'thématiques trouvées')
    }

    // Combiner les données
    const result = projects.map(project => ({
      ...project,
      employees: employees?.filter(e => e.project_id === project.id).map(e => e.employee_name) || [],
      partners: partners?.filter(p => p.project_id === project.id).map(p => p.partner_name) || [],
      thematics: thematics?.filter(t => t.project_id === project.id).map(t => t.thematic_name) || []
    }))

    // Mettre en cache si c'est la première page et qu'on est en ligne
    if (offset === 0 && isOnline()) {
      console.log('💾 Mise en cache des projets')
      setCachedData(result as Project[], [])
    }

    return result
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des projets avec détails:', error)
    
    // En cas d'erreur, essayer d'utiliser le cache
    const cachedData = getCachedData()
    if (cachedData && !isOnline()) {
      console.log('🔄 Utilisation du cache en cas d\'erreur')
      return cachedData.projects.slice(0, limit) as (Project & { employees: string[], partners: string[], thematics: string[] })[]
    }
    
    return []
  }
} 

// Fonction pour nettoyer automatiquement tous les doublons dans tous les projets
export async function cleanAllProjectDuplicates(): Promise<boolean> {
  try {
    console.log('🧹 cleanAllProjectDuplicates - Début')
    
    // Récupérer tous les projets
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')

    if (projectsError) {
      console.error('❌ Erreur lors de la récupération des projets:', projectsError)
      return false
    }

    if (!projects || projects.length === 0) {
      console.log('ℹ️ Aucun projet trouvé')
      return true
    }

    console.log(`📊 Nettoyage des doublons pour ${projects.length} projets`)

    let successCount = 0
    let errorCount = 0

    // Nettoyer chaque projet
    for (const project of projects) {
      try {
        // Utiliser les fonctions de mise à jour qui gèrent déjà les doublons
        const employeesSuccess = await updateProjectEmployees(project.id, [])
        const partnersSuccess = await updateProjectPartners(project.id, [])
        const thematicsSuccess = await updateProjectThematics(project.id, [])
        
        if (employeesSuccess && partnersSuccess && thematicsSuccess) {
          successCount++
          console.log(`✅ Projet "${project.title}" nettoyé`)
        } else {
          errorCount++
          console.log(`❌ Erreur lors du nettoyage du projet "${project.title}"`)
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Erreur lors du nettoyage du projet "${project.title}":`, error)
      }
    }

    console.log(`📊 Résultat du nettoyage global:`)
    console.log(`  - Projets nettoyés avec succès: ${successCount}`)
    console.log(`  - Erreurs: ${errorCount}`)
    console.log(`  - Total: ${projects.length}`)

    return errorCount === 0
  } catch (error) {
    console.error('❌ Erreur inattendue lors du nettoyage global:', error)
    return false
  }
} 