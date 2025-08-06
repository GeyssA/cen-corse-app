'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProjectsWithDetails, createProject, deleteProject, updateProject, updateProjectEmployees, updateProjectPartners, updateProjectThematics } from '@/lib/projects'
// import { Project as SupabaseProject } from '@/lib/projects'
import { useSearchParams } from 'next/navigation'

interface NewProject {
  title: string
  description: string
  location: string
  employees: string[]
  partners: string[]
  thematics: string[]
  startDate: string
  endDate: string
  pole: string
  thematic: string
  status: string
  is_private_for_visitors: boolean
}

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
}

function ProjetsContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmployee, setNewEmployee] = useState('')
  const [newPartner, setNewPartner] = useState('')
  const [newThematic, setNewThematic] = useState('')
  const [editThematic, setEditThematic] = useState('')
  const [editEmployee, setEditEmployee] = useState('')
  const [editPartner, setEditPartner] = useState('')
  const [selectedTags, setSelectedTags] = useState<{type: string, value: string}[]>([])
  const [availableTags, setAvailableTags] = useState<{type: string, value: string}[]>([])
  const [selectedTagType, setSelectedTagType] = useState('')
  const [tagSearchTerm, setTagSearchTerm] = useState('')
  
  // États pour l'autocomplétion
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false)
  const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false)
  const [showThematicSuggestions, setShowThematicSuggestions] = useState(false)
  const [filteredEmployees, setFilteredEmployees] = useState<string[]>([])
  const [filteredPartners, setFilteredPartners] = useState<string[]>([])
  const [filteredThematics, setFilteredThematics] = useState<string[]>([])
  
  // États pour l'autocomplétion dans le modal d'édition
  const [showEditEmployeeSuggestions, setShowEditEmployeeSuggestions] = useState(false)
  const [showEditPartnerSuggestions, setShowEditPartnerSuggestions] = useState(false)
  const [showEditThematicSuggestions, setShowEditThematicSuggestions] = useState(false)
  const [filteredEditEmployees, setFilteredEditEmployees] = useState<string[]>([])
  const [filteredEditPartners, setFilteredEditPartners] = useState<string[]>([])
  const [filteredEditThematics, setFilteredEditThematics] = useState<string[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [projects, setProjects] = useState<Project[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const [newProject, setNewProject] = useState<NewProject>({
    title: '',
    description: '',
    location: '',
    employees: [],
    partners: [],
    thematics: [],
    startDate: '',
    endDate: '',
    pole: '',
    thematic: '',
    status: 'planning',
    is_private_for_visitors: false
  })

  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  // const [editDeadline, setEditDeadline] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  // const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  const poles = [
    'Accompagner',
    'Connaitre',
    'Gérer',
    'Valoriser',
    'Protéger'
  ]

  // Animation de chargement
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.suggestion-container')) {
        setShowEmployeeSuggestions(false)
        setShowPartnerSuggestions(false)
        setShowThematicSuggestions(false)
        setShowEditEmployeeSuggestions(false)
        setShowEditPartnerSuggestions(false)
        setShowEditThematicSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Charger les projets paginés depuis Supabase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true)
        
        const limit = 10
        const offset = page * limit
        const projectsData = await getProjectsWithDetails(limit, offset)
        // Filtrer les projets privés pour les visiteurs
        const filteredProjects = (projectsData || []).filter((project: any) => {
          // Si l'utilisateur est un visiteur (role === 'visitor'), masquer les projets privés
          if (profile?.role === 'visitor' && project.is_private_for_visitors) {
            return false
          }
          return true
        })

        const convertedProjects: Project[] = filteredProjects.map((project: any) => {
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            progress: project.progress || 0,
            start_date: project.start_date,
            end_date: project.end_date,
            deadline: project.end_date,
            thematic: project.thematic || '',
            pole: project.pole || '',
            location: project.location || '',
            employees: project.employees || [],
            partners: project.partners || [],
            thematics: project.thematics || [],
            is_private_for_visitors: project.is_private_for_visitors
          }
        })
        if (page === 0) {
          setProjects(convertedProjects)
          console.log('📊 Projets chargés:', convertedProjects.length)
          console.log('📊 État expanded initial:', Array.from(expandedProjects))
        } else {
          setProjects(prev => [...prev, ...convertedProjects])
        }
        setHasMore(projectsData.length === limit)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des projets:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [page, profile?.role])

  // Bouton pour charger plus de projets
  const handleLoadMore = () => {
    setPage(p => p + 1)
  }

  // Projets filtrés selon le rôle (utilise useMemo pour éviter les recalculs inutiles)
  const visibleProjects = useMemo(() => {
    if (profile?.role === 'visitor') {
      return projects.filter(project => !project.is_private_for_visitors)
    }
    return projects
  }, [projects, profile?.role])

  // Générer les tags disponibles
  useEffect(() => {
    const employeeSet = new Set<string>()
    const partnerSet = new Set<string>()
    const thematicSet = new Set<string>()
    const poleSet = new Set<string>()
    
    // Filtrer les projets selon le rôle et générer les tags
    const projectsToUse = profile?.role === 'visitor' 
      ? projects.filter(project => !project.is_private_for_visitors)
      : projects
    
    projectsToUse.forEach(project => {
      // Tags pour les employés
      if (project.employees && Array.isArray(project.employees)) {
        project.employees.forEach(emp => {
          const trimmedEmp = emp.trim()
          if (trimmedEmp) {
            employeeSet.add(trimmedEmp)
          }
        })
      }
      
      // Tags pour les partenaires
      if (project.partners && Array.isArray(project.partners)) {
        project.partners.forEach(partner => {
          const trimmedPartner = partner.trim()
          if (trimmedPartner) {
            partnerSet.add(trimmedPartner)
          }
        })
      }
      
      // Tags pour les thématiques
      if (project.thematics && Array.isArray(project.thematics)) {
        project.thematics.forEach(thematic => {
          const trimmedThematic = thematic.trim()
          if (trimmedThematic) {
            thematicSet.add(trimmedThematic)
          }
        })
      }
      
      // Fallback pour les anciennes thématiques (si pas encore migrées)
      if (project.thematic && (!project.thematics || project.thematics.length === 0)) {
        project.thematic.split(',').forEach(thematic => {
          const trimmedThematic = thematic.trim()
          if (trimmedThematic) {
            thematicSet.add(trimmedThematic)
          }
        })
      }
    })
    
    // Ajouter uniquement les pôles définis dans la variable poles
    poles.forEach(pole => {
      poleSet.add(pole)
    })
    
    // Convertir les Sets en tableau de tags
    const tags: {type: string, value: string}[] = []
    
    employeeSet.forEach(emp => {
      tags.push({type: 'employee', value: emp})
    })
    
    partnerSet.forEach(partner => {
      tags.push({type: 'partner', value: partner})
    })
    
    thematicSet.forEach(thematic => {
      tags.push({type: 'thematic', value: thematic})
    })
    
    poleSet.forEach(pole => {
      tags.push({type: 'pole', value: pole})
    })
    
    console.log('🏷️ Tags générés:', {
      employees: employeeSet.size,
      partners: partnerSet.size,
      thematics: thematicSet.size,
      poles: poleSet.size
    })
    
    setAvailableTags(tags)
  }, [projects, profile?.role])

  const filteredProjects = visibleProjects.filter(project => {
    const statusMatch = activeFilter === 'all' || project.status === activeFilter
    const searchMatch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       project.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtrage par tags sélectionnés
    const tagMatch = selectedTags.every(tag => {
      switch (tag.type) {
        case 'employee':
          return project.employees.includes(tag.value)
        case 'partner':
          return project.partners.includes(tag.value)
        case 'thematic':
          return project.thematics.includes(tag.value)
        case 'pole':
          return project.pole === tag.value
        default:
          return true
      }
    })
    
    return statusMatch && searchMatch && tagMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'planning': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
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

  // Formater les dates en format français
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Toggle l'expansion d'un projet
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
      console.log('🔽 Projet fermé:', projectId)
    } else {
      newExpanded.add(projectId)
      console.log('🔼 Projet ouvert:', projectId)
    }
    setExpandedProjects(newExpanded)
    console.log('📊 Projets expanded:', Array.from(newExpanded))
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

  // État pour éviter l'erreur d'hydratation
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Effet séparé pour gérer le paramètre create
  useEffect(() => {
    // Vérifier si on doit ouvrir le modal de création
    const shouldCreate = searchParams.get('create')
    if (shouldCreate === 'true' && profile?.role === 'admin') {
      setShowAddModal(true)
    } else if (shouldCreate === 'true' && profile?.role !== 'admin') {
      // Rediriger ou afficher un message d'erreur pour les visiteurs
      console.warn('⚠️ Tentative d\'accès non autorisé au modal de création de projet')
      alert('Vous n\'avez pas les permissions pour créer des projets.')
    }
  }, [searchParams, profile?.role])

  const handleAddProject = async () => {
    if (!profile) {
      console.error('❌ Aucun profil utilisateur trouvé')
      alert('Erreur : Aucun profil utilisateur trouvé. Veuillez vous reconnecter.')
      return
    }

    console.log('🚀 Tentative de création de projet depuis la page projets...')

    // Vérifier les champs requis avant d'envoyer
    const missingFields = []
    if (!newProject.title.trim()) missingFields.push('Titre')
    if (!newProject.description.trim()) missingFields.push('Description')
    if (!newProject.startDate) missingFields.push('Date de début')
    if (!newProject.endDate) missingFields.push('Date de fin')

    if (missingFields.length > 0) {
      const message = `Veuillez remplir les champs suivants : ${missingFields.join(', ')}`
      alert(message)
      return
    }

    try {
      const projectData = {
        title: newProject.title,
        description: newProject.description,
        location: newProject.location,
        status: newProject.status as 'planning' | 'active' | 'completed',
        progress: 0,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        thematic: newProject.thematic,
        pole: newProject.pole,
        created_by: profile.id,
        is_private_for_visitors: newProject.is_private_for_visitors
      }

      const createdProject = await createProject(projectData, newProject.employees, newProject.partners, newProject.thematics)

      if (createdProject) {
        console.log('✅ Projet créé avec succès:', createdProject)
        
        // Ajouter le nouveau projet au début de la liste
        const newProjectFormatted: Project = {
          id: createdProject.id!,
          title: createdProject.title,
          description: createdProject.description,
          status: createdProject.status,
          progress: createdProject.progress || 0,
          start_date: createdProject.start_date,
          end_date: createdProject.end_date,
          deadline: createdProject.end_date,
          thematic: createdProject.thematic || '',
          pole: createdProject.pole || 'TOUS',
          employees: newProject.employees,
          partners: newProject.partners,
          thematics: newProject.thematics,
          is_private_for_visitors: newProject.is_private_for_visitors
        }
        
        setProjects(prev => [newProjectFormatted, ...prev])
        
        // Réinitialiser la pagination
        setPage(0)
        setHasMore(true)
    
        // Fermer le modal et réinitialiser le formulaire
        setShowAddModal(false)
        setNewProject({
          title: '',
          description: '',
          location: '',
          employees: [],
          partners: [],
          thematics: [],
          startDate: '',
          endDate: '',
          pole: 'TOUS',
          thematic: '',
          status: 'planning',
          is_private_for_visitors: false
        })
        setNewEmployee('')
        setNewPartner('')
        setNewThematic('')
      } else {
        console.error('❌ Échec de la création du projet')
        alert('Erreur : Impossible de créer le projet. Veuillez vérifier que tous les champs requis sont remplis.')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du projet:', error)
      alert('Erreur : Impossible de créer le projet. Veuillez réessayer.')
    }
  }

  const addEmployee = () => {
    const trimmedEmployee = newEmployee.trim()
    if (trimmedEmployee) {
      // Vérifier si l'employé existe déjà (insensible à la casse)
      const employeeExists = newProject.employees.some(emp => 
        emp.toLowerCase() === trimmedEmployee.toLowerCase()
      )
      
      if (!employeeExists) {
      setNewProject({
        ...newProject,
          employees: [...newProject.employees, trimmedEmployee]
      })
      setNewEmployee('')
        console.log('✅ Employé ajouté au nouveau projet:', trimmedEmployee)
      } else {
        console.log('⚠️ Employé déjà présent dans le nouveau projet:', trimmedEmployee)
        alert('Cet employé est déjà présent dans le projet')
      }
    }
  }

  const removeEmployee = (index: number) => {
    setNewProject({
      ...newProject,
      employees: newProject.employees.filter((_, i) => i !== index)
    })
  }

  const addThematic = () => {
    const trimmedThematic = newThematic.trim()
    if (trimmedThematic) {
      // Vérifier si la thématique existe déjà (insensible à la casse)
      const thematicExists = newProject.thematics.some(thematic => 
        thematic.toLowerCase() === trimmedThematic.toLowerCase()
      )
      
      if (!thematicExists) {
        setNewProject({
          ...newProject,
          thematics: [...newProject.thematics, trimmedThematic]
        })
        setNewThematic('')
        console.log('✅ Thématique ajoutée au nouveau projet:', trimmedThematic)
      } else {
        console.log('⚠️ Thématique déjà présente dans le nouveau projet:', trimmedThematic)
        alert('Cette thématique est déjà présente dans le projet')
      }
    }
  }

  const removeThematic = (index: number) => {
    setNewProject({
      ...newProject,
      thematics: newProject.thematics.filter((_, i) => i !== index)
    })
  }

  const addEditThematic = () => {
    const trimmedThematic = editThematic.trim()
    if (trimmedThematic && editProject) {
      // Vérifier si la thématique existe déjà (insensible à la casse)
      const thematicExists = editProject.thematics.some(thematic => 
        thematic.toLowerCase() === trimmedThematic.toLowerCase()
      )
      
      if (!thematicExists) {
        setEditProject({
          ...editProject,
          thematics: [...editProject.thematics, trimmedThematic]
        })
        setEditThematic('')
        console.log('✅ Thématique ajoutée:', trimmedThematic)
      } else {
        console.log('⚠️ Thématique déjà présente:', trimmedThematic)
        alert('Cette thématique est déjà présente dans le projet')
      }
    }
  }

  const removeEditThematic = (index: number) => {
    if (editProject) {
      setEditProject({
        ...editProject,
        thematics: editProject.thematics.filter((_, i) => i !== index)
      })
    }
  }

  const addEditEmployee = () => {
    const trimmedEmployee = editEmployee.trim()
    if (trimmedEmployee && editProject) {
      // Vérifier si l'employé existe déjà (insensible à la casse)
      const employeeExists = editProject.employees.some(emp => 
        emp.toLowerCase() === trimmedEmployee.toLowerCase()
      )
      
      if (!employeeExists) {
      setEditProject({
        ...editProject,
          employees: [...editProject.employees, trimmedEmployee]
      })
      setEditEmployee('')
        console.log('✅ Employé ajouté:', trimmedEmployee)
      } else {
        console.log('⚠️ Employé déjà présent:', trimmedEmployee)
        alert('Cet employé est déjà présent dans le projet')
      }
    }
  }

  const removeEditEmployee = (index: number) => {
    if (editProject) {
      setEditProject({
        ...editProject,
        employees: editProject.employees.filter((_, i) => i !== index)
      })
    }
  }

  const addEditPartner = () => {
    const trimmedPartner = editPartner.trim()
    if (trimmedPartner && editProject) {
      // Vérifier si le partenaire existe déjà (insensible à la casse)
      const partnerExists = editProject.partners.some(partner => 
        partner.toLowerCase() === trimmedPartner.toLowerCase()
      )
      
      if (!partnerExists) {
      setEditProject({
        ...editProject,
          partners: [...editProject.partners, trimmedPartner]
      })
      setEditPartner('')
        console.log('✅ Partenaire ajouté:', trimmedPartner)
      } else {
        console.log('⚠️ Partenaire déjà présent:', trimmedPartner)
        alert('Ce partenaire est déjà présent dans le projet')
      }
    }
  }

  const removeEditPartner = (index: number) => {
    if (editProject) {
      setEditProject({
        ...editProject,
        partners: editProject.partners.filter((_, i) => i !== index)
      })
    }
  }

  const addPartner = () => {
    const trimmedPartner = newPartner.trim()
    if (trimmedPartner) {
      // Vérifier si le partenaire existe déjà (insensible à la casse)
      const partnerExists = newProject.partners.some(partner => 
        partner.toLowerCase() === trimmedPartner.toLowerCase()
      )
      
      if (!partnerExists) {
        setNewProject({
          ...newProject,
          partners: [...newProject.partners, trimmedPartner]
        })
        setNewPartner('')
        console.log('✅ Partenaire ajouté au nouveau projet:', trimmedPartner)
      } else {
        console.log('⚠️ Partenaire déjà présent dans le nouveau projet:', trimmedPartner)
        alert('Ce partenaire est déjà présent dans le projet')
      }
    }
  }

  const removePartner = (index: number) => {
    setNewProject({
      ...newProject,
      partners: newProject.partners.filter((_, i) => i !== index)
    })
  }

  // Fonctions pour l'autocomplétion
  const handleEmployeeInputChange = (value: string) => {
    setNewEmployee(value)
    if (value.trim()) {
      const filtered = availableTags
        .filter(tag => tag.type === 'employee' && tag.value.toLowerCase().includes(value.toLowerCase()))
        .map(tag => tag.value)
        .filter(emp => !newProject.employees.includes(emp))
      setFilteredEmployees(filtered)
      setShowEmployeeSuggestions(filtered.length > 0)
    } else {
      setShowEmployeeSuggestions(false)
    }
  }

  const handlePartnerInputChange = (value: string) => {
    setNewPartner(value)
    if (value.trim()) {
      const filtered = availableTags
        .filter(tag => tag.type === 'partner' && tag.value.toLowerCase().includes(value.toLowerCase()))
        .map(tag => tag.value)
        .filter(partner => !newProject.partners.includes(partner))
      setFilteredPartners(filtered)
      setShowPartnerSuggestions(filtered.length > 0)
    } else {
      setShowPartnerSuggestions(false)
    }
  }

  const handleThematicInputChange = (value: string) => {
    setNewThematic(value)
    if (value.trim()) {
      const filtered = availableTags
        .filter(tag => tag.type === 'thematic' && tag.value.toLowerCase().includes(value.toLowerCase()))
        .map(tag => tag.value)
        .filter(thematic => !newProject.thematics.includes(thematic))
      setFilteredThematics(filtered)
      setShowThematicSuggestions(filtered.length > 0)
    } else {
      setShowThematicSuggestions(false)
    }
  }

  const selectEmployeeSuggestion = (employee: string) => {
    setNewEmployee(employee)
    setShowEmployeeSuggestions(false)
  }

  const selectPartnerSuggestion = (partner: string) => {
    setNewPartner(partner)
    setShowPartnerSuggestions(false)
  }

  const selectThematicSuggestion = (thematic: string) => {
    setNewThematic(thematic)
    setShowThematicSuggestions(false)
  }

  // Fonctions pour l'autocomplétion dans le modal d'édition
  const handleEditEmployeeInputChange = (value: string) => {
    setEditEmployee(value)
    if (value.trim() && editProject) {
      const filtered = availableTags
        .filter(tag => tag.type === 'employee' && tag.value.toLowerCase().includes(value.toLowerCase()))
        .map(tag => tag.value)
        .filter(emp => !editProject.employees.includes(emp))
      setFilteredEditEmployees(filtered)
      setShowEditEmployeeSuggestions(filtered.length > 0)
    } else {
      setShowEditEmployeeSuggestions(false)
    }
  }

  const handleEditPartnerInputChange = (value: string) => {
    setEditPartner(value)
    if (value.trim() && editProject) {
      const filtered = availableTags
        .filter(tag => tag.type === 'partner' && tag.value.toLowerCase().includes(value.toLowerCase()))
        .map(tag => tag.value)
        .filter(partner => !editProject.partners.includes(partner))
      setFilteredEditPartners(filtered)
      setShowEditPartnerSuggestions(filtered.length > 0)
    } else {
      setShowEditPartnerSuggestions(false)
    }
  }

  const handleEditThematicInputChange = (value: string) => {
    setEditThematic(value)
    if (value.trim() && editProject) {
      const filtered = availableTags
        .filter(tag => tag.type === 'thematic' && tag.value.toLowerCase().includes(value.toLowerCase()))
        .map(tag => tag.value)
        .filter(thematic => !editProject.thematics.includes(thematic))
      setFilteredEditThematics(filtered)
      setShowEditThematicSuggestions(filtered.length > 0)
    } else {
      setShowEditThematicSuggestions(false)
    }
  }

  const selectEditEmployeeSuggestion = (employee: string) => {
    setEditEmployee(employee)
    setShowEditEmployeeSuggestions(false)
  }

  const selectEditPartnerSuggestion = (partner: string) => {
    setEditPartner(partner)
    setShowEditPartnerSuggestions(false)
  }

  const selectEditThematicSuggestion = (thematic: string) => {
    setEditThematic(thematic)
    setShowEditThematicSuggestions(false)
  }

  // Fonction de sauvegarde de l'édition
  const handleSaveEdit = async () => {
    if (!editProject) return;
    
    // Vérifier la session
    if (!isSessionValid()) {
      console.warn('⚠️ Session expirée, rafraîchissement nécessaire')
      alert('Votre session a expiré. Le formulaire va être rafraîchi.')
      await refreshEditModal()
      return
    }
    
    // Empêcher les sauvegardes multiples
    if (isSaving) {
      console.log('⏳ Sauvegarde déjà en cours...')
      return
    }
    
    setIsSaving(true)
    updateUserActivity()
    
    try {
      const updatedProject = await updateProject(editProject.id, {
        title: editProject.title,
        description: editProject.description,
        location: editProject.location,
        status: editProject.status as "planning" | "active" | "completed",
        progress: editProject.progress,
        start_date: editProject.start_date,
        end_date: editProject.deadline || editProject.end_date,
        thematic: editProject.thematic,
        pole: editProject.pole,
        is_private_for_visitors: editProject.is_private_for_visitors
      })

      if (updatedProject) {
        // Mettre à jour les employés, partenaires et thématiques
        const employeesSuccess = await updateProjectEmployees(editProject.id, editProject.employees)
        const partnersSuccess = await updateProjectPartners(editProject.id, editProject.partners)
        const thematicsSuccess = await updateProjectThematics(editProject.id, editProject.thematics)

        if (employeesSuccess && partnersSuccess && thematicsSuccess) {
          // Mettre à jour le projet dans le state local
          setProjects(prev => prev.map(project => 
            project.id === editProject.id 
              ? {
                  ...project,
                  title: editProject.title,
                  description: editProject.description,
                  location: editProject.location,
                  status: editProject.status,
                  progress: editProject.progress,
                  start_date: editProject.start_date,
                  end_date: editProject.deadline || editProject.end_date,
                  deadline: editProject.deadline || editProject.end_date,
                  thematic: editProject.thematic,
                  pole: editProject.pole,
                  employees: editProject.employees,
                  partners: editProject.partners,
                  thematics: editProject.thematics,
                  is_private_for_visitors: editProject.is_private_for_visitors
                }
              : project
          ))
          
          setEditProject(null)
        } else {
          alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error)
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculer les statistiques sur les projets visibles
  const totalProjects = visibleProjects.length
  const activeProjects = visibleProjects.filter(p => p.status === 'active').length
  const completedProjects = visibleProjects.filter(p => p.status === 'completed').length
  const planningProjects = visibleProjects.filter(p => p.status === 'planning').length

  // Fonction pour mettre à jour l'activité utilisateur
  const updateUserActivity = () => {
    setLastActivity(Date.now())
    console.log('🔄 Activité utilisateur mise à jour')
  }

  // Fonction pour vérifier si la session est encore valide
  const isSessionValid = () => {
    const timeSinceLastActivity = Date.now() - lastActivity
    const maxSessionTime = 30 * 60 * 1000 // 30 minutes
    return timeSinceLastActivity < maxSessionTime
  }

  // Fonction pour rafraîchir le modal d'édition
  const refreshEditModal = async () => {
    if (!editProject) return
    
    console.log('🔄 Rafraîchissement du modal d\'édition...')
    try {
      // Recharger les données du projet depuis la base
      const projectsData = await getProjectsWithDetails()
      const freshProject = projectsData.find(p => p.id === editProject.id)
      
      if (freshProject && freshProject.id) {
        setEditProject(freshProject as Project)
        setLastActivity(Date.now())
        console.log('✅ Modal d\'édition rafraîchi')
      } else {
        console.error('❌ Projet non trouvé lors du rafraîchissement')
        setEditProject(null)
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#cce7f5' }}>
      {/* Fond décoratif fixe, non intrusif */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Cercles flous */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-white/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl"></div>
        {/* Halo doux */}
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl"></div>
        {/* Motif hexagone flouté */}
        <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-2xl blur-xl"
          style={{ clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)' }}>
        </div>
        {/* Courbe fine */}
        <div className="absolute top-0 right-1/4 w-64 h-12 bg-gradient-to-r from-blue-300/20 to-transparent rounded-full blur-lg rotate-12"></div>
      </div>

      {/* Header moderne avec glassmorphism */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-blue-200/50 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-slate-800 font-heading">Projets & Études</h1>
          </div>
          {profile?.role === 'admin' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              title="Ajouter un projet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Contenu principal avec padding pour la barre fixe */}
      <div className="pt-24 pb-8">


        {/* Résumé moderne avec glassmorphism */}
        {isClient && (
          <div className="max-w-md mx-auto px-6 mb-6 animate-fade-in">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/30">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-800">{totalProjects}</div>
                  <div className="text-slate-600 text-sm font-medium">Total</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-emerald-600">{activeProjects}</div>
                  <div className="text-slate-600 text-sm font-medium">En cours</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">{completedProjects}</div>
                  <div className="text-slate-600 text-sm font-medium">Terminés</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-amber-600">{planningProjects}</div>
                  <div className="text-slate-600 text-sm font-medium">Planifiés</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres modernes */}
        <div className="max-w-md mx-auto px-6 mb-6 animate-fade-in">
          <div className="flex space-x-2 mb-4">
            {['all', 'active', 'completed', 'planning'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/70 text-slate-600 hover:bg-white/90 border border-blue-200/30'
                }`}
              >
                {filter === 'all' ? 'Tous' : 
                 filter === 'active' ? 'En cours' :
                 filter === 'completed' ? 'Terminés' : 'Planification'}
              </button>
            ))}
          </div>

          {/* Recherche moderne */}
          <div className="mb-4 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Tags sélectionnés */}
          {selectedTags.length > 0 && (
            <div className="mb-4 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, index) => (
                  <div key={index} className="flex items-center bg-blue-100/80 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200/50 transition-all duration-200 hover:shadow-md hover:scale-105">
                    <span>{tag.value}</span>
                    <button
                      onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== index))}
                      className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sélecteur de tags moderne */}
          <div className="mb-6 animate-fade-in">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filtrer par tags
            </label>
            <div className="space-y-3">
              {/* Sélecteur de catégorie */}
              <select
                value={selectedTagType}
                onChange={(e) => {
                  setSelectedTagType(e.target.value)
                  setTagSearchTerm('')
                }}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Sélectionner une catégorie...</option>
                <option value="employee">Employés impliqués</option>
                <option value="partner">Partenaires</option>
                <option value="thematic">Thématiques</option>
                <option value="pole">Pôle</option>
              </select>

              {/* Barre de recherche pour les tags */}
              {selectedTagType && (
                <div>
                  <input
                    type="text"
                    placeholder={`Rechercher dans ${selectedTagType === 'employee' ? 'les employés' : selectedTagType === 'partner' ? 'les partenaires' : selectedTagType === 'thematic' ? 'les thématiques' : 'les pôles'}...`}
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              )}

              {/* Liste des tags filtrés */}
              {selectedTagType && (
                <div className="max-h-32 overflow-y-auto space-y-1 bg-white/50 backdrop-blur-sm rounded-xl p-2 animate-fade-in">
                  {availableTags
                    .filter(tag => tag.type === selectedTagType)
                    .filter(tag => tag.value.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                    .map((tag) => (
                      <button
                        key={`${tag.type}-${tag.value}`}
                        onClick={() => {
                          if (!selectedTags.some(t => t.type === tag.type && t.value === tag.value)) {
                            setSelectedTags([...selectedTags, tag])
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {tag.value}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Liste des projets en accordéon */}
        <div className="max-w-md mx-auto px-6 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Chargement des projets...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Aucun projet trouvé</p>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
            <div 
              key={project.id} 
              className={`project-card bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/30 overflow-visible transition-all duration-500 ease-out ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                animation: `fadeInUp 0.5s ease-out ${index * 100}ms both`
              }}
              data-expanded={expandedProjects.has(project.id)}
            >
              {/* En-tête du projet */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {project.title}
                      </h3>
                      {/* Indicateur pour les projets masqués aux visiteurs */}
                      {project.is_private_for_visitors && (
                        <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium border border-red-200">
                          <span>🚫</span>
                          <span>Masqué</span>
                        </div>
                      )}
                    </div>
                    {/* Localisation avec icône moderne */}
                    {project.location && (
                      <div className="flex items-center space-x-1 text-xs text-slate-500 mb-2">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{project.location}</span>
                      </div>
                    )}
                    {/* Sous le titre, statut et membres */}
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{project.employees.length} membre{project.employees.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="ml-4 w-8 h-8 bg-blue-100/50 hover:bg-blue-200/50 rounded-lg flex items-center justify-center text-blue-600 transition-all duration-300 hover:scale-110"
                  >
                    <svg 
                      className={`w-5 h-5 transition-transform duration-300 ${
                        expandedProjects.has(project.id) ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenu dépliable */}
              {expandedProjects.has(project.id) && (
                <div className="expandable-content content-wrapper expanded max-h-none opacity-100 transition-all duration-500 ease-out">
                  <div className="px-6 pb-6 space-y-4 min-h-0">
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Indicateur de visibilité pour les visiteurs */}
                  {project.is_private_for_visitors && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-sm">🚫</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-800">Projet masqué aux visiteurs</h4>
                          <p className="text-xs text-red-600">Ce projet n'est visible que pour les administrateurs</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations clés sur 2 colonnes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Période</h4>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Début : {formatDate(project.start_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Fin : {formatDate(project.deadline || '')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Pôle</h4>
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{project.pole}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Thématiques</h4>
                      <div className="flex flex-wrap gap-1">
                        {project.thematics && project.thematics.length > 0 ? (
                          project.thematics.map((thematic, index) => (
                            <span key={index} className="bg-purple-100/80 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1 border border-purple-200/50">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span>{thematic}</span>
                            </span>
                          ))
                        ) : project.thematic ? (
                          // Séparer les thématiques par virgule et créer un tag pour chacune
                          project.thematic.split(',').map((thematic, index) => {
                            const trimmedThematic = thematic.trim()
                            if (!trimmedThematic) return null
                            return (
                              <span key={index} className="bg-purple-100/80 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1 border border-purple-200/50">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span>{trimmedThematic}</span>
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-slate-400 text-xs italic">Aucune thématique définie</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Statut</h4>
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barre d'échéance */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span className="font-medium">Échéance</span>
                      <span className="font-semibold">{calculateDeadline(project.start_date, project.deadline || '')}%</span>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calculateDeadline(project.start_date, project.deadline || '')}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Employés et partenaires côte à côte */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Employés */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>Employés ({project.employees.length})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {project.employees.length > 0 ? (
                          project.employees.map((employee, index) => (
                            <span key={index} className="bg-blue-100/80 text-blue-800 px-2 py-1 rounded-full text-xs border border-blue-200/50">
                              {employee}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">Aucun employé</span>
                        )}
                      </div>
                    </div>

                    {/* Partenaires */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Partenaires ({project.partners.length})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {project.partners.length > 0 ? (
                          project.partners.map((partner, index) => (
                            <span key={index} className="bg-emerald-100/80 text-emerald-800 px-2 py-1 rounded-full text-xs border border-emerald-200/50">
                              {partner}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">Aucun partenaire</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Espacement pour s'assurer que les boutons sont visibles */}
                  <div className="h-6"></div>

                  {/* Bouton édition admin - visible seulement après déroulement */}
                  {profile?.role === 'admin' && (
                    <div className="admin-buttons pt-4 pb-2 border-t border-slate-200/50 flex items-center justify-between">
                      <button
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        title="Modifier le projet"
                        onClick={() => setEditProject(project)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Modifier le projet</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Supprimer le projet"
                        onClick={() => { setDeleteProjectId(project.id); setShowDeleteModal(true); }}
                      >
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          ))
          )}
         {!loading && hasMore && (
           <div className="flex justify-center mt-4">
             <button
               onClick={handleLoadMore}
               className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-colors"
             >
               Charger plus
             </button>
           </div>
         )}
        </div>
      </div>

      {/* Modal d'ajout de projet moderne */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
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
                {/* Bouton de visibilité pour les visiteurs - Style Apple iPhone */}
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
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employés impliqués</label>
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
                    
                    {/* Suggestions d'autocomplétion pour les employés */}
                    {showEmployeeSuggestions && (
                      <div className="suggestion-container absolute z-50 w-full bg-white border border-blue-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredEmployees.map((employee, index) => (
                          <div
                            key={index}
                            onClick={() => selectEmployeeSuggestion(employee)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                          >
                            {employee}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProject.employees.map((employee, index) => (
                      <span key={index} className="bg-blue-100/80 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-blue-200/50">
                        <span>{employee}</span>
                        <button
                          onClick={() => removeEmployee(index)}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
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
                        placeholder="Nom du partenaire"
                      />
                      <button
                        onClick={addPartner}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                        style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Suggestions d'autocomplétion pour les partenaires */}
                    {showPartnerSuggestions && (
                      <div className="suggestion-container absolute z-50 w-full bg-white border border-emerald-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredPartners.map((partner, index) => (
                          <div
                            key={index}
                            onClick={() => selectPartnerSuggestion(partner)}
                            className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                          >
                            {partner}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProject.partners.map((partner, index) => (
                      <span key={index} className="bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-emerald-200/50">
                        <span>{partner}</span>
                        <button
                          onClick={() => removePartner(index)}
                          className="text-emerald-600 hover:text-emerald-800 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="text-red-500">*</span> Champs obligatoires
                </p>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddProject}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Créer le projet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition projet */}
      {editProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-slate-800">Modifier le projet</h2>
                <div className="flex items-center space-x-2">
                  {/* Bouton de rafraîchissement */}
                  <button
                    onClick={refreshEditModal}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Rafraîchir le formulaire"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {/* Bouton de fermeture */}
                <button
                  onClick={() => setEditProject(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
              <div className="space-y-3">
                {/* Bouton de visibilité pour les visiteurs - Style Apple iPhone */}
                <div className="mb-4">
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
                      onClick={() => {
                        setEditProject({...editProject, is_private_for_visitors: !editProject.is_private_for_visitors})
                        updateUserActivity()
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 ${
                        editProject.is_private_for_visitors 
                          ? 'bg-blue-600' 
                          : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          editProject.is_private_for_visitors 
                            ? 'translate-x-6' 
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <label className="block text-sm font-medium text-slate-700">Titre</label>
                <input
                  type="text"
                  value={editProject.title}
                  onChange={e => {
                    setEditProject({ ...editProject, title: e.target.value })
                    updateUserActivity()
                  }}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                />
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={editProject.description}
                  onChange={e => setEditProject({ ...editProject, description: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                  rows={3}
                />
                <label className="block text-sm font-medium text-slate-700">Date de début</label>
                <input
                  type="date"
                  value={editProject.start_date}
                  onChange={e => setEditProject({ ...editProject, start_date: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                />
                <label className="block text-sm font-medium text-slate-700">Date de fin</label>
                <input
                  type="date"
                  value={editProject.deadline}
                  onChange={e => setEditProject({ ...editProject, deadline: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                />
                <label className="block text-sm font-medium text-slate-700">Pôle</label>
                <div className="relative">
                  <select
                    value={editProject.pole}
                    onChange={e => setEditProject({ ...editProject, pole: e.target.value })}
                    className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner un pôle...</option>
                    {poles.map(pole => (
                      <option key={pole} value={pole} className="bg-white text-slate-700 py-2">{pole}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <label className="block text-sm font-medium text-slate-700">Localisation</label>
                <input
                  type="text"
                  value={editProject.location || ''}
                  onChange={e => setEditProject({ ...editProject, location: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                  placeholder="Localisation du projet"
                />
                <label className="block text-sm font-medium text-slate-700">Thématiques</label>
                <div className="relative">
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={editThematic}
                      onChange={e => handleEditThematicInputChange(e.target.value)}
                      onFocus={() => {
                        if (editThematic.trim()) {
                          handleEditThematicInputChange(editThematic)
                        }
                      }}
                      className="flex-1 bg-white/70 border border-purple-200/50 rounded-xl px-4 py-3 text-slate-700"
                      placeholder="Ajouter une thématique"
                    />
                    <button
                      type="button"
                      onClick={addEditThematic}
                      className="px-4 py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                      style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Suggestions d'autocomplétion pour les thématiques (édition) */}
                  {showEditThematicSuggestions && (
                    <div className="suggestion-container absolute z-50 w-full bg-white border border-purple-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredEditThematics.map((thematic, index) => (
                        <div
                          key={index}
                          onClick={() => selectEditThematicSuggestion(thematic)}
                          className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                        >
                          {thematic}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {editProject.thematics.map((thematic, index) => (
                    <span key={index} className="bg-purple-100/80 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-purple-200/50">
                      <span>{thematic}</span>
                      <button
                        type="button"
                        onClick={() => removeEditThematic(index)}
                        className="text-purple-600 hover:text-purple-800 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <label className="block text-sm font-medium text-slate-700">Statut</label>
                <select
                  value={editProject.status}
                  onChange={e => setEditProject({ ...editProject, status: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                >
                  <option value="planning">Planification</option>
                  <option value="active">En cours</option>
                  <option value="completed">Terminé</option>
                </select>
                <label className="block text-sm font-medium text-slate-700">Employés impliqués</label>
                <div className="relative">
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={editEmployee}
                      onChange={e => handleEditEmployeeInputChange(e.target.value)}
                      onFocus={() => {
                        if (editEmployee.trim()) {
                          handleEditEmployeeInputChange(editEmployee)
                        }
                      }}
                      className="flex-1 bg-white/70 border border-blue-200/50 rounded-xl px-4 py-3 text-slate-700"
                      placeholder="Ajouter un employé"
                    />
                    <button
                      type="button"
                      onClick={addEditEmployee}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Suggestions d'autocomplétion pour les employés (édition) */}
                  {showEditEmployeeSuggestions && (
                    <div className="suggestion-container absolute z-50 w-full bg-white border border-blue-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredEditEmployees.map((employee, index) => (
                        <div
                          key={index}
                          onClick={() => selectEditEmployeeSuggestion(employee)}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                        >
                          {employee}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {editProject.employees.map((employee, index) => (
                    <span key={index} className="bg-blue-100/80 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-blue-200/50">
                      <span>{employee}</span>
                      <button
                        type="button"
                        onClick={() => removeEditEmployee(index)}
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <label className="block text-sm font-medium text-slate-700">Partenaires</label>
                <div className="relative">
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={editPartner}
                      onChange={e => handleEditPartnerInputChange(e.target.value)}
                      onFocus={() => {
                        if (editPartner.trim()) {
                          handleEditPartnerInputChange(editPartner)
                        }
                      }}
                      className="flex-1 bg-white/70 border border-emerald-200/50 rounded-xl px-4 py-3 text-slate-700"
                      placeholder="Ajouter un partenaire"
                    />
                    <button
                      type="button"
                      onClick={addEditPartner}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                      style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Suggestions d'autocomplétion pour les partenaires (édition) */}
                  {showEditPartnerSuggestions && (
                    <div className="suggestion-container absolute z-50 w-full bg-white border border-emerald-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredEditPartners.map((partner, index) => (
                        <div
                          key={index}
                          onClick={() => selectEditPartnerSuggestion(partner)}
                          className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                        >
                          {partner}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {editProject.partners.map((partner, index) => (
                    <span key={index} className="bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-emerald-200/50">
                      <span>{partner}</span>
                      <button
                        type="button"
                        onClick={() => removeEditPartner(index)}
                        className="text-emerald-600 hover:text-emerald-800 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditProject(null)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                    isSaving 
                      ? 'bg-blue-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <span>Sauvegarder</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-sm shadow-2xl border border-blue-200/30 animate-fade-in p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Confirmer la suppression</h2>
            <p className="text-slate-700 mb-6">Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteProjectId(null); }}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (deleteProjectId !== null) {
                    // Retirer immédiatement le projet de l'interface
                    setProjects(prev => prev.filter(p => p.id !== deleteProjectId))
                    setShowDeleteModal(false)
                    setDeleteProjectId(null)
                    
                    // Suppression en arrière-plan
                    console.log('🗑️ Suppression en arrière-plan du projet:', deleteProjectId)
                    
                    try {
                      const success = await deleteProject(deleteProjectId)
                      if (success) {
                        console.log('✅ Projet supprimé avec succès de Supabase')
                      } else {
                        console.error('❌ Échec de la suppression dans Supabase')
                        // Optionnel : remettre le projet dans la liste si la suppression échoue
                        // setProjects(prev => [...prev, projectToDelete])
                      }
                    } catch (error) {
                      console.error('❌ Erreur lors de la suppression en arrière-plan:', error)
                    }
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Projets() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    }>
      <ProjetsContent />
    </Suspense>
  )
} 