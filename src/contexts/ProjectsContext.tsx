'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useProjects } from '@/hooks/useProjects'

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

interface ProjectsContextType {
  projects: Project[]
  loading: boolean
  error: Error | null
  loadProjects: () => Promise<void>
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  removeProject: (projectId: string) => void
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const projectsData = useProjects()

  return (
    <ProjectsContext.Provider value={projectsData}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsContext() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error('useProjectsContext doit être utilisé dans un ProjectsProvider')
  }
  return context
}
