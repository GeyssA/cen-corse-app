import { useState, useEffect, useCallback } from 'react'
import { getProjectsWithDetails } from '@/lib/projects'

interface Project {
  id: string
  title: string
  description: string
  status: string
  progress: number
  start_date: string
  end_date: string
  deadline?: string
  thematic: string
  pole: string
  location?: string
  employees: string[]
  partners: string[]
  thematics: string[]
  is_private_for_visitors?: boolean
  created_at?: string
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fonction pour charger les projets
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProjectsWithDetails()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des projets'))
      console.error('Erreur lors du chargement des projets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fonction pour ajouter un projet à la liste
  const addProject = useCallback((newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
  }, [])

  // Fonction pour mettre à jour un projet
  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    )
  }, [])

  // Fonction pour supprimer un projet
  const removeProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId))
  }, [])

  // Charger les projets au montage
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return {
    projects,
    loading,
    error,
    loadProjects,
    addProject,
    updateProject,
    removeProject
  }
}
