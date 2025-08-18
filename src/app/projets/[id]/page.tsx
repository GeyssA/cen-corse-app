'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Project {
  id: number
  title: string
  description: string
  status: string
  progress: number
  members: number
  deadline: string
  startDate: string
  thematic: string
  pole: string
  employees: string[]
  partners: string[]
}

export default function ProjectDetails() {
  const params = useParams()
  const projectId = parseInt(params.id as string)

  // Récupérer les projets depuis le localStorage
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('projects')
      if (stored) {
        return JSON.parse(stored)
      }
    }
    
    // Données par défaut si aucun projet n'est stocké
    return [
      {
        id: 1,
        title: 'Analyse du génome humain',
        description: 'Étude des variations génétiques dans la population avec partenaires: CNRS, Université Paris',
        status: 'active',
        progress: 75,
        members: 4,
        deadline: '2024-06-15',
        startDate: '2024-01-15',
        thematic: 'Génétique',
        pole: 'Herpétologie',
        employees: ['Marie Dubois', 'Jean Martin', 'Sophie Chen'],
        partners: ['CNRS', 'Université Paris']
      },
      {
        id: 2,
        title: 'Développement de nouveaux médicaments',
        description: 'Recherche sur les composés anti-cancéreux avec partenaires: INSERM, Sanofi',
        status: 'active',
        progress: 45,
        members: 6,
        deadline: '2024-08-20',
        startDate: '2024-02-01',
        thematic: 'Biochimie',
        pole: 'Ornithologie',
        employees: ['Thomas Leroy', 'Emma Rodriguez', 'Lucas Bernard'],
        partners: ['INSERM', 'Sanofi']
      },
      {
        id: 3,
        title: 'Étude des cellules souches',
        description: 'Différenciation cellulaire et régénération avec partenaires: Institut Pasteur',
        status: 'completed',
        progress: 100,
        members: 3,
        deadline: '2024-03-10',
        startDate: '2023-09-01',
        thematic: 'Biologie Cellulaire',
        pole: 'Mesures compensatoires',
        employees: ['Camille Moreau', 'Alexandre Petit'],
        partners: ['Institut Pasteur']
      },
      {
        id: 4,
        title: 'Protéomique avancée',
        description: 'Analyse des protéines dans les tissus cancéreux avec partenaires: CNRS, Roche',
        status: 'planning',
        progress: 10,
        members: 5,
        deadline: '2024-12-01',
        startDate: '2024-05-01',
        thematic: 'Biologie Moléculaire',
        pole: 'Flore',
        employees: ['Marie Dubois', 'Thomas Leroy', 'Emma Rodriguez'],
        partners: ['CNRS', 'Roche']
      }
    ]
  })

  const project = projects.find(p => p.id === projectId)
  const [editedProject, setEditedProject] = useState<Project | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [newEmployee, setNewEmployee] = useState('')
  const [newPartner, setNewPartner] = useState('')

  // État pour éviter l'erreur d'hydratation
  const [isClient, setIsClient] = useState(false)

  // Initialiser editedProject quand le projet est trouvé
  useEffect(() => {
    if (project) {
      setEditedProject(project)
    }
  }, [project])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En cours'
      case 'completed': return 'Terminé'
      case 'planning': return 'Planification'
      default: return 'Inconnu'
    }
  }

  // Calculer l'échéance automatiquement basée sur les dates
  const calculateDeadline = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()
    
    if (now <= start) return 0
    if (now >= end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }

  const handleSave = () => {
    if (editedProject) {
      const updatedProjects = projects.map(p => 
        p.id === projectId ? editedProject : p
      )
      setProjects(updatedProjects)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
      setEditingField(null)
      
      // Afficher un message de confirmation et rediriger
      alert('Modifications sauvegardées avec succès !')
      window.location.href = '/projets'
    }
  }

  const handleFieldEdit = (field: string) => {
    setEditingField(field)
  }

  const handleFieldSave = (field: string, value: any) => {
    if (editedProject) {
      const updatedProject = { ...editedProject, [field]: value }
      setEditedProject(updatedProject)
      
      // Sauvegarder automatiquement dans le localStorage
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      )
      setProjects(updatedProjects)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
      
      setEditingField(null)
    }
  }

  const addEmployee = () => {
    if (newEmployee.trim() && editedProject && !editedProject.employees.includes(newEmployee.trim())) {
      const updatedProject = {
        ...editedProject,
        employees: [...editedProject.employees, newEmployee.trim()]
      }
      setEditedProject(updatedProject)
      
      // Sauvegarder automatiquement dans le localStorage
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      )
      setProjects(updatedProjects)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
      
      setNewEmployee('')
    }
  }

  const removeEmployee = (index: number) => {
    if (editedProject) {
      const updatedProject = {
        ...editedProject,
        employees: editedProject.employees.filter((_, i) => i !== index)
      }
      setEditedProject(updatedProject)
      
      // Sauvegarder automatiquement dans le localStorage
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      )
      setProjects(updatedProjects)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }
  }

  const addPartner = () => {
    if (newPartner.trim() && editedProject && !editedProject.partners.includes(newPartner.trim())) {
      const updatedProject = {
        ...editedProject,
        partners: [...editedProject.partners, newPartner.trim()]
      }
      setEditedProject(updatedProject)
      
      // Sauvegarder automatiquement dans le localStorage
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      )
      setProjects(updatedProjects)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
      
      setNewPartner('')
    }
  }

  const removePartner = (index: number) => {
    if (editedProject) {
      const updatedProject = {
        ...editedProject,
        partners: editedProject.partners.filter((_, i) => i !== index)
      }
      setEditedProject(updatedProject)
      
      // Sauvegarder automatiquement dans le localStorage
      const updatedProjects = projects.map(p => 
        p.id === projectId ? updatedProject : p
      )
      setProjects(updatedProjects)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }
  }

  // 1. Définir la liste des pôles comme dans l’ajout
  const poles = [
    'TOUS',
    'Herpétologie',
    'Ornithologie',
    'Mesures compensatoires',
    'Flore',
    'Sensibilisation',
    'Communication'
  ];

  // Extraire les employés et partenaires uniques de tous les projets pour l'autocomplétion
  const allEmployees = [...new Set(projects.flatMap(p => p.employees))];
  const allPartners = [...new Set(projects.flatMap(p => p.partners))];

  // 2. Suggestions filtrées pour l'autocomplete
  const filteredEmployeeSuggestions = newEmployee
    ? allEmployees.filter(e => e.toLowerCase().includes(newEmployee.toLowerCase()) && !editedProject?.employees.includes(e))
    : allEmployees.filter(e => !editedProject?.employees.includes(e));
  const filteredPartnerSuggestions = newPartner
    ? allPartners.filter(p => p.toLowerCase().includes(newPartner.toLowerCase()) && !editedProject?.partners.includes(p))
    : allPartners.filter(p => !editedProject?.partners.includes(p));

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
      {/* Header fixe */}
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
                const updatedProjects = projects.filter(p => p.id !== projectId)
                setProjects(updatedProjects)
                localStorage.setItem('projects', JSON.stringify(updatedProjects))
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

      {/* Contenu principal avec padding pour la barre fixe */}
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Statut en haut */}
          <div className="mb-8 text-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(editedProject.status)}`}>
              {getStatusText(editedProject.status)}
            </span>
          </div>

          {/* Champs dans l'ordre demandé */}
          <div className="space-y-6">
            {/* 1. Nom du projet */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom du projet</label>
              <div className="flex items-center justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      value={editedProject.title}
                      onChange={(e) => setEditedProject({...editedProject, title: e.target.value})}
                      onBlur={() => handleFieldSave('title', editedProject.title)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFieldSave('title', editedProject.title)}
                      className="w-full bg-transparent text-white text-lg font-semibold focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-white">{editedProject.title}</h2>
                  )}
                </div>
                <button
                  onClick={() => handleFieldEdit('title')}
                  className="ml-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 2. Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <div className="flex items-start justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'description' ? (
                    <textarea
                      value={editedProject.description}
                      onChange={(e) => setEditedProject({...editedProject, description: e.target.value})}
                      onBlur={() => handleFieldSave('description', editedProject.description)}
                      className="w-full bg-transparent text-gray-300 focus:outline-none resize-none"
                      rows={4}
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-300 leading-relaxed">{editedProject.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleFieldEdit('description')}
                  className="ml-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 3. Thématique */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Thématique</label>
              <div className="flex items-center justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'thematic' ? (
                    <input
                      type="text"
                      value={editedProject.thematic}
                      onChange={(e) => setEditedProject({...editedProject, thematic: e.target.value})}
                      onBlur={() => handleFieldSave('thematic', editedProject.thematic)}
                      onKeyPress={(e) => e.key === 'Enter' && handleFieldSave('thematic', editedProject.thematic)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white">{editedProject.thematic}</span>
                  )}
                </div>
                <button
                  onClick={() => handleFieldEdit('thematic')}
                  className="ml-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 4. Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Statut du projet</label>
              <div className="flex items-center justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'status' ? (
                    <select
                      value={editedProject.status}
                      onChange={(e) => handleFieldSave('status', e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      autoFocus
                    >
                      <option value="planning" className="bg-gray-800 text-white">Planification</option>
                      <option value="active" className="bg-gray-800 text-white">En cours</option>
                      <option value="completed" className="bg-gray-800 text-white">Terminé</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(editedProject.status)}`}>
                      {getStatusText(editedProject.status)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleFieldEdit('status')}
                  className="ml-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 5. Employés impliqués */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Employés impliqués</label>
              <div className="bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employés impliqués</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newEmployee}
                      onChange={e => setNewEmployee(e.target.value)}
                      className="flex-1 bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-blue-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nom de l'employé"
                    />
                    <button
                      onClick={addEmployee}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedProject.employees.map((employee, index) => (
                      <span key={index} className="bg-blue-100/80 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-blue-200/50">
                        <span>{employee}</span>
                        <button onClick={() => removeEmployee(index)} className="text-blue-600 hover:text-blue-800 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                {filteredEmployeeSuggestions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {filteredEmployeeSuggestions.slice(0, 5).map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded-full text-xs"
                        onClick={() => {
                          setNewEmployee(suggestion);
                          addEmployee();
                        }}
                      >{suggestion}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. Partenaires */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Partenaires</label>
              <div className="bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Partenaires</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newPartner}
                      onChange={e => setNewPartner(e.target.value)}
                      className="flex-1 bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-blue-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nom du partenaire"
                    />
                    <button
                      onClick={addPartner}
                      className="px-4 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedProject.partners.map((partner, index) => (
                      <span key={index} className="bg-green-100/80 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-green-200/50">
                        <span>{partner}</span>
                        <button onClick={() => removePartner(index)} className="text-green-600 hover:text-green-800 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                {filteredPartnerSuggestions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {filteredPartnerSuggestions.slice(0, 5).map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded-full text-xs"
                        onClick={() => {
                          setNewPartner(suggestion);
                          addPartner();
                        }}
                      >{suggestion}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 7. Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
              <div className="flex items-center justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'startDate' ? (
                    <input
                      type="date"
                      value={editedProject.startDate}
                      onChange={(e) => handleFieldSave('startDate', e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white">{new Date(editedProject.startDate).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                <button
                  onClick={() => handleFieldEdit('startDate')}
                  className="ml-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 8. Date butoire */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date butoire</label>
              <div className="flex items-center justify-between bg-blue-900/50 rounded-lg p-4 border border-blue-700">
                <div className="flex-1">
                  {editingField === 'deadline' ? (
                    <input
                      type="date"
                      value={editedProject.deadline}
                      onChange={(e) => handleFieldSave('deadline', e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white">{new Date(editedProject.deadline).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                <button
                  onClick={() => handleFieldEdit('deadline')}
                  className="ml-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Échéance calculée */}
            {isClient && (
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Échéance</span>
                  <span>{calculateDeadline(editedProject.startDate, editedProject.deadline)}%</span>
                </div>
                <div className="w-full bg-blue-800 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${calculateDeadline(editedProject.startDate, editedProject.deadline)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pôle en bas sur toute la largeur */}
          <div className="mt-8">
            <div className="bg-blue-800/50 rounded-lg p-4 border border-blue-700">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Pôle</label>
                <select
                  value={editedProject.pole}
                  onChange={e => setEditedProject({ ...editedProject, pole: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg font-medium"
                >
                  {poles.map((pole, idx) => (
                    <option key={idx} value={pole}>{pole}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sauvegarder et retourner à la liste</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 