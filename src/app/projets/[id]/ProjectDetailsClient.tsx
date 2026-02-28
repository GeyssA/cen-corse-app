'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { defaultProjects, Project } from './projectsData'

interface ProjectDetailsClientProps {
  projectId: number
  initialProjects?: Project[]
}

export default function ProjectDetailsClient({ projectId, initialProjects = defaultProjects }: ProjectDetailsClientProps) {
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('projects')
      if (stored) {
        try {
          return JSON.parse(stored) as Project[]
        } catch {
          return initialProjects
        }
      }
    }
    return initialProjects
  })

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId])
  const [editedProject, setEditedProject] = useState<Project | null>(project)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [newEmployee, setNewEmployee] = useState('')
  const [newPartner, setNewPartner] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (project) {
      setEditedProject(project)
    } else {
      setEditedProject(null)
    }
  }, [project])

  const persistProjects = (updated: Project[]) => {
    setProjects(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('projects', JSON.stringify(updated))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'En cours'
      case 'completed':
        return 'Terminé'
      case 'planning':
        return 'Planification'
      default:
        return 'Inconnu'
    }
  }

  const calculateDeadline = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()

    if (now <= start) return 0
    if (now >= end) return 100

    return Math.round(((now - start) / (end - start)) * 100)
  }

  const handleFieldEdit = (field: string) => {
    setEditingField(field)
  }

  const handleFieldSave = (field: string, value: string | number | boolean) => {
    if (!editedProject) return
    const updatedProject = { ...editedProject, [field]: value }
    setEditedProject(updatedProject)

    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p))
    persistProjects(updatedProjects)
    setEditingField(null)
  }

  const handleSave = () => {
    if (!editedProject) return
    const updatedProjects = projects.map((p) => (p.id === projectId ? editedProject : p))
    persistProjects(updatedProjects)
    setEditingField(null)

    if (typeof window !== 'undefined') {
      alert('Modifications sauvegardées avec succès !')
      window.location.href = '/projets'
    }
  }

  const addEmployee = () => {
    if (!editedProject) return
    const value = newEmployee.trim()
    if (!value || editedProject.employees.includes(value)) return

    const updatedProject = { ...editedProject, employees: [...editedProject.employees, value] }
    setEditedProject(updatedProject)
    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p))
    persistProjects(updatedProjects)
    setNewEmployee('')
  }

  const removeEmployee = (index: number) => {
    if (!editedProject) return
    const updatedProject = {
      ...editedProject,
      employees: editedProject.employees.filter((_, i) => i !== index)
    }
    setEditedProject(updatedProject)
    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p))
    persistProjects(updatedProjects)
  }

  const addPartner = () => {
    if (!editedProject) return
    const value = newPartner.trim()
    if (!value || editedProject.partners.includes(value)) return

    const updatedProject = { ...editedProject, partners: [...editedProject.partners, value] }
    setEditedProject(updatedProject)
    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p))
    persistProjects(updatedProjects)
    setNewPartner('')
  }

  const removePartner = (index: number) => {
    if (!editedProject) return
    const updatedProject = {
      ...editedProject,
      partners: editedProject.partners.filter((_, i) => i !== index)
    }
    setEditedProject(updatedProject)
    const updatedProjects = projects.map((p) => (p.id === projectId ? updatedProject : p))
    persistProjects(updatedProjects)
  }

  const poles = [
    'TOUS',
    'Herpétologie',
    'Ornithologie',
    'Mesures compensatoires',
    'Flore',
    'Sensibilisation',
    'Communication'
  ]

  const allEmployees = useMemo(() => [...new Set(projects.flatMap((p) => p.employees))], [projects])
  const allPartners = useMemo(() => [...new Set(projects.flatMap((p) => p.partners))], [projects])

  const filteredEmployeeSuggestions = useMemo(() => {
    if (!editedProject) return []
    const base = allEmployees.filter((e) => !editedProject.employees.includes(e))
    if (!newEmployee) return base
    return base.filter((e) => e.toLowerCase().includes(newEmployee.toLowerCase()))
  }, [allEmployees, editedProject, newEmployee])

  const filteredPartnerSuggestions = useMemo(() => {
    if (!editedProject) return []
    const base = allPartners.filter((p) => !editedProject.partners.includes(p))
    if (!newPartner) return base
    return base.filter((p) => p.toLowerCase().includes(newPartner.toLowerCase()))
  }, [allPartners, editedProject, newPartner])

  if (!isClient) {
    return null
  }

  if (!project || !editedProject) {
    return (
      <div className="min-h-screen bg-blue-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
          <Link href="/projets" className="text-blue-400 hover:text-blue-300">
            ← Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-950 text-white">
      <header className="fixed top-0 left-0 right-0 bg-blue-900/95 backdrop-blur-sm p-4 border-b border-blue-700 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/projets" className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-white">Détails du projet</h1>
          <button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
                const updatedProjects = projects.filter((p) => p.id !== projectId)
                persistProjects(updatedProjects)
                window.location.href = '/projets'
              }
            }}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
            title="Supprimer le projet"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(editedProject.status)}`}>
              {getStatusText(editedProject.status)}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du projet</label>
              <div className="flex items-center justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      value={editedProject.title}
                      onChange={(e) => setEditedProject({ ...editedProject, title: e.target.value })}
                      onBlur={() => handleFieldSave('title', editedProject.title)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFieldSave('title', editedProject.title)}
                      className="w-full bg-transparent text-white text-lg font-semibold focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-white">{editedProject.title}</h2>
                  )}
                </div>
                <button onClick={() => handleFieldEdit('title')} className="ml-3 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <div className="flex items-start justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'description' ? (
                    <textarea
                      value={editedProject.description}
                      onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                      onBlur={() => handleFieldSave('description', editedProject.description)}
                      className="w-full bg-transparent text-gray-300 focus:outline-none resize-none"
                      rows={4}
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-300 leading-relaxed">{editedProject.description}</p>
                  )}
                </div>
                <button onClick={() => handleFieldEdit('description')} className="ml-3 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Statut</label>
                <select
                  value={editedProject.status}
                  onChange={(e) => handleFieldSave('status', e.target.value)}
                  className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="planning">Planification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Thématique</label>
                <input
                  type="text"
                  value={editedProject.thematic}
                  onChange={(e) => setEditedProject({ ...editedProject, thematic: e.target.value })}
                  onBlur={() => handleFieldSave('thematic', editedProject.thematic)}
                  className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pôle</label>
              <select
                value={editedProject.pole}
                onChange={(e) => handleFieldSave('pole', e.target.value)}
                className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {poles.map((pole) => (
                  <option key={pole} value={pole}>
                    {pole}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
                <input
                  type="date"
                  value={editedProject.startDate}
                  onChange={(e) => handleFieldSave('startDate', e.target.value)}
                  className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de fin</label>
                <input
                  type="date"
                  value={editedProject.deadline}
                  onChange={(e) => handleFieldSave('deadline', e.target.value)}
                  className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Membres</label>
                <input
                  type="number"
                  value={editedProject.members}
                  onChange={(e) => handleFieldSave('members', Number(e.target.value))}
                  className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Progression (%)</label>
                <input
                  type="number"
                  value={editedProject.progress}
                  onChange={(e) => handleFieldSave('progress', Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Progression du projet</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                  <span>{editedProject.progress}% réalisé</span>
                  <span>{calculateDeadline(editedProject.startDate, editedProject.deadline)}% du temps écoulé</span>
                </div>
                <div className="w-full bg-blue-900 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full" style={{ width: `${editedProject.progress}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Équipe</h3>
                <div className="space-y-3">
                  {editedProject.employees.map((employee, index) => (
                    <div key={`${employee}-${index}`} className="flex items-center justify-between bg-blue-900/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-200">{employee}</span>
                      <button onClick={() => removeEmployee(index)} className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ajouter un membre</label>
                  <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEmployee()}
                    className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du membre"
                  />
                  {filteredEmployeeSuggestions.length > 0 && (
                    <div className="mt-2 bg-blue-900/80 border border-blue-700 rounded-lg max-h-40 overflow-y-auto">
                      {filteredEmployeeSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setNewEmployee(suggestion)
                            addEmployee()
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-blue-800/60 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={addEmployee} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Partenaires</h3>
                <div className="space-y-3">
                  {editedProject.partners.map((partner, index) => (
                    <div key={`${partner}-${index}`} className="flex items-center justify-between bg-blue-900/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-200">{partner}</span>
                      <button onClick={() => removePartner(index)} className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ajouter un partenaire</label>
                  <input
                    type="text"
                    value={newPartner}
                    onChange={(e) => setNewPartner(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPartner()}
                    className="w-full bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du partenaire"
                  />
                  {filteredPartnerSuggestions.length > 0 && (
                    <div className="mt-2 bg-blue-900/80 border border-blue-700 rounded-lg max-h-40 overflow-y-auto">
                      {filteredPartnerSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setNewPartner(suggestion)
                            addPartner()
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-blue-800/60 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={addPartner} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button onClick={() => router.push('/projets')} className="px-4 py-2 border border-blue-600 text-blue-200 rounded-lg hover:bg-blue-900/60 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

