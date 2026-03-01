'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// import { useTheme } from '@/contexts/ThemeContext' // Temporairement commenté car non utilisé
import { createProject } from '@/lib/projects'

interface NewProject {
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
  pole: string
  thematics: string[]
  status: string
  employees: string[]
  partners: string[]
  is_private_for_visitors: boolean
}

interface AddProjectModalProps {
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  onAddProject: (project: NewProject) => Promise<void>
}

export default function AddProjectModal({ showAddModal, setShowAddModal, onAddProject }: AddProjectModalProps) {
  const { profile } = useAuth()
  // const { theme } = useTheme() // Temporairement commenté car non utilisé
  
  const [newProject, setNewProject] = useState<NewProject>({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    pole: '',
    thematics: [],
    status: 'planning',
    employees: [],
    partners: [],
    is_private_for_visitors: false
  })

  // États pour l'autocomplétion
  const [newThematic, setNewThematic] = useState('')
  const [newEmployee, setNewEmployee] = useState('')
  const [newPartner, setNewPartner] = useState('')
  const [showThematicSuggestions, setShowThematicSuggestions] = useState(false)
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false)
  const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false)

  // Données pour l'autocomplétion
  const [allThematics, setAllThematics] = useState<string[]>([])
  const [allEmployees, setAllEmployees] = useState<string[]>([])
  const [allPartners, setAllPartners] = useState<string[]>([])
  const [filteredThematics, setFilteredThematics] = useState<string[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<string[]>([])
  const [filteredPartners, setFilteredPartners] = useState<string[]>([])

  const poles = ['Accompagner', 'Connaitre', 'Gérer', 'Valoriser', 'Protéger']

  // Charger les données d'autocomplétion depuis les projets existants
  useEffect(() => {
    const loadAutocompleteData = async () => {
      try {
        // Charger les projets existants pour extraire les données d'autocomplétion
        const response = await fetch('/api/projects')
        if (response.ok) {
          const projects = await response.json()
          
          // Extraire les thématiques uniques
          const thematicsSet = new Set<string>()
          const employeesSet = new Set<string>()
          const partnersSet = new Set<string>()
          
          projects.forEach((project: { thematics?: string[], employees?: string[], partners?: string[] }) => {
            // Thématiques
            if (project.thematics && Array.isArray(project.thematics)) {
              project.thematics.forEach((thematic: string) => {
                const trimmed = thematic.trim()
                if (trimmed) thematicsSet.add(trimmed)
              })
            }
            
            // Employés
            if (project.employees && Array.isArray(project.employees)) {
              project.employees.forEach((employee: string) => {
                const trimmed = employee.trim()
                if (trimmed) employeesSet.add(trimmed)
              })
            }
            
            // Partenaires
            if (project.partners && Array.isArray(project.partners)) {
              project.partners.forEach((partner: string) => {
                const trimmed = partner.trim()
                if (trimmed) partnersSet.add(trimmed)
              })
            }
          })
          
          setAllThematics(Array.from(thematicsSet).sort())
          setAllEmployees(Array.from(employeesSet).sort())
          setAllPartners(Array.from(partnersSet).sort())
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'autocomplétion:', error)
      }
    }

    if (showAddModal) {
      loadAutocompleteData()
    }
  }, [showAddModal])

  // Gestion des thématiques
  const handleThematicInputChange = (value: string) => {
    setNewThematic(value)
    if (value.trim()) {
      const filtered = allThematics.filter(thematic =>
        thematic.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredThematics(filtered)
      setShowThematicSuggestions(filtered.length > 0)
    } else {
      setShowThematicSuggestions(false)
    }
  }

  const selectThematicSuggestion = (thematic: string) => {
    setNewThematic(thematic)
    setShowThematicSuggestions(false)
  }

  const addThematic = () => {
    if (newThematic.trim() && !newProject.thematics.includes(newThematic.trim())) {
      setNewProject({
        ...newProject,
        thematics: [...newProject.thematics, newThematic.trim()]
      })
      setNewThematic('')
    }
  }

  const removeThematic = (index: number) => {
    setNewProject({
      ...newProject,
      thematics: newProject.thematics.filter((_, i) => i !== index)
    })
  }

  // Gestion des employés
  const handleEmployeeInputChange = (value: string) => {
    setNewEmployee(value)
    if (value.trim()) {
      const filtered = allEmployees.filter(employee =>
        employee.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredEmployees(filtered)
      setShowEmployeeSuggestions(filtered.length > 0)
    } else {
      setShowEmployeeSuggestions(false)
    }
  }

  const selectEmployeeSuggestion = (employee: string) => {
    setNewEmployee(employee)
    setShowEmployeeSuggestions(false)
  }

  const addEmployee = () => {
    if (newEmployee.trim() && !newProject.employees.includes(newEmployee.trim())) {
      setNewProject({
        ...newProject,
        employees: [...newProject.employees, newEmployee.trim()]
      })
      setNewEmployee('')
    }
  }

  const removeEmployee = (index: number) => {
    setNewProject({
      ...newProject,
      employees: newProject.employees.filter((_, i) => i !== index)
    })
  }

  // Gestion des partenaires
  const handlePartnerInputChange = (value: string) => {
    setNewPartner(value)
    if (value.trim()) {
      const filtered = allPartners.filter(partner =>
        partner.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredPartners(filtered)
      setShowPartnerSuggestions(filtered.length > 0)
    } else {
      setShowPartnerSuggestions(false)
    }
  }

  const selectPartnerSuggestion = (partner: string) => {
    setNewPartner(partner)
    setShowPartnerSuggestions(false)
  }

  const addPartner = () => {
    if (newPartner.trim() && !newProject.partners.includes(newPartner.trim())) {
      setNewProject({
        ...newProject,
        partners: [...newProject.partners, newPartner.trim()]
      })
      setNewPartner('')
    }
  }

  const removePartner = (index: number) => {
    setNewProject({
      ...newProject,
      partners: newProject.partners.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (!newProject.title.trim() || !newProject.description.trim() || !newProject.startDate || !newProject.endDate) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!profile) {
      alert('Erreur : Aucun profil utilisateur trouvé. Veuillez vous reconnecter.')
      return
    }

    try {
      console.log('🚀 Tentative de création de projet...')
      
      // Préparer les données du projet
      const projectData = {
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        location: newProject.location.trim(),
        status: newProject.status,
        progress: 0,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        pole: newProject.pole,
        thematic: newProject.thematics[0] || 'Général', // Ajouter le champ thematic requis
        created_by: profile.id,
        is_private_for_visitors: newProject.is_private_for_visitors
      }

      console.log('📊 Données du projet:', projectData)
      console.log('👥 Employés:', newProject.employees)
      console.log('🤝 Partenaires:', newProject.partners)
      console.log('🏷️ Thématiques:', newProject.thematics)

      // Créer le projet dans Supabase
      const createdProject = await createProject(
        projectData, 
        newProject.employees, 
        newProject.partners, 
        newProject.thematics
      )

      if (createdProject) {
        console.log('✅ Projet créé avec succès:', createdProject)
        
        // Appeler la fonction de callback pour mettre à jour l'interface
        await onAddProject(newProject)
        
        // Fermer le modal et réinitialiser le formulaire
        setShowAddModal(false)
        setNewProject({
          title: '',
          description: '',
          location: '',
          startDate: '',
          endDate: '',
          pole: '',
          thematics: [],
          status: 'planning',
          employees: [],
          partners: [],
          is_private_for_visitors: false
        })
      } else {
        console.error('❌ Échec de la création du projet')
        alert('Erreur lors de la création du projet. Veuillez réessayer.')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du projet:', error)
      alert('Erreur lors de la création du projet. Veuillez réessayer.')
    }
  }

  if (!showAddModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Nouveau projet</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Bouton de visibilité pour les visiteurs */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-blue-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Visibilité pour les visiteurs</h3>
                    <p className="text-xs text-slate-600">Masquer ce projet aux utilisateurs externes</p>
                  </div>
                </div>
                <button
                  onClick={() => setNewProject({...newProject, is_private_for_visitors: !newProject.is_private_for_visitors})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 ${
                    newProject.is_private_for_visitors 
                      ? 'bg-blue-600' 
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      newProject.is_private_for_visitors 
                        ? 'translate-x-6' 
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titre du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="Nom du projet"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                rows={3}
                placeholder="Description du projet"
              />
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Localisation</label>
              <input
                type="text"
                value={newProject.location}
                onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="Localisation du projet"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Pôle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pôle</label>
              <div className="relative">
                <select
                  value={newProject.pole}
                  onChange={(e) => setNewProject({...newProject, pole: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="">Sélectionner un pôle...</option>
                  {poles.map(pole => (
                    <option key={pole} value={pole} className="bg-white text-slate-700 py-2">{pole}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Thématiques */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Thématiques</label>
              <div className="relative">
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newThematic}
                    onChange={(e) => handleThematicInputChange(e.target.value)}
                    onFocus={() => {
                      if (newThematic.trim()) {
                        handleThematicInputChange(newThematic)
                      }
                    }}
                    className="flex-1 bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ajouter une thématique"
                  />
                  <button
                    onClick={addThematic}
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
                
                {/* Suggestions d'autocomplétion pour les thématiques */}
                {showThematicSuggestions && (
                  <div className="suggestion-container absolute z-50 w-full bg-white border border-purple-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredThematics.map((thematic, index) => (
                      <div
                        key={index}
                        onClick={() => selectThematicSuggestion(thematic)}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                      >
                        {thematic}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {newProject.thematics.map((thematic, index) => (
                  <span key={index} className="bg-purple-100/80 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-purple-200/50">
                    <span>{thematic}</span>
                    <button
                      onClick={() => removeThematic(index)}
                      className="text-purple-600 hover:text-purple-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              >
                <option value="planning">Planification</option>
                <option value="active">En cours</option>
                <option value="completed">Terminé</option>
                <option value="paused">En pause</option>
              </select>
            </div>

            {/* Employés */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Employés</label>
              <div className="relative">
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => handleEmployeeInputChange(e.target.value)}
                    onFocus={() => {
                      if (newEmployee.trim()) {
                        handleEmployeeInputChange(newEmployee)
                      }
                    }}
                    className="flex-1 bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ajouter un employé"
                  />
                  <button
                    onClick={addEmployee}
                    className="px-4 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
                
                {/* Suggestions d'autocomplétion pour les employés */}
                {showEmployeeSuggestions && (
                  <div className="suggestion-container absolute z-50 w-full bg-white border border-green-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredEmployees.map((employee, index) => (
                      <div
                        key={index}
                        onClick={() => selectEmployeeSuggestion(employee)}
                        className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                      >
                        {employee}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {newProject.employees.map((employee, index) => (
                  <span key={index} className="bg-green-100/80 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-green-200/50">
                    <span>{employee}</span>
                    <button
                      onClick={() => removeEmployee(index)}
                      className="text-green-600 hover:text-green-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Partenaires */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Partenaires</label>
              <div className="relative">
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newPartner}
                    onChange={(e) => handlePartnerInputChange(e.target.value)}
                    onFocus={() => {
                      if (newPartner.trim()) {
                        handlePartnerInputChange(newPartner)
                      }
                    }}
                    className="flex-1 bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ajouter un partenaire"
                  />
                  <button
                    onClick={addPartner}
                    className="px-4 py-3 bg-orange-600 text-white rounded-xl shadow hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
                
                {/* Suggestions d'autocomplétion pour les partenaires */}
                {showPartnerSuggestions && (
                  <div className="suggestion-container absolute z-50 w-full bg-white border border-orange-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredPartners.map((partner, index) => (
                      <div
                        key={index}
                        onClick={() => selectPartnerSuggestion(partner)}
                        className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                      >
                        {partner}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {newProject.partners.map((partner, index) => (
                  <span key={index} className="bg-orange-100/80 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-orange-200/50">
                    <span>{partner}</span>
                    <button
                      onClick={() => removePartner(index)}
                      className="text-orange-600 hover:text-orange-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Créer le projet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
