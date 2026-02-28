'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProjectsWithDetails, deleteProject, updateProject, updateProjectEmployees, updateProjectPartners, updateProjectThematics } from '@/lib/projects'
// import { supabase } from '@/lib/supabase' // Temporairement commenté car non utilisé
import { useTheme } from '@/contexts/ThemeContext'
// import { Project as SupabaseProject } from '@/lib/projects'
import { useSearchParams } from 'next/navigation'


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

interface ProjectStatsSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  planningProjects: number
}

interface ProjetsContentProps {
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  onStatsChange: (stats: ProjectStatsSummary) => void
}

export default function ProjetsContent({ showAddModal, setShowAddModal, onStatsChange }: ProjetsContentProps) {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<{type: string, value: string}[]>([])
  const [availableTags, setAvailableTags] = useState<{type: string, value: string}[]>([])
  const [selectedTagType, setSelectedTagType] = useState('')
  const [tagSearchTerm, setTagSearchTerm] = useState('')
  
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  
  // États pour la gestion de session
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  
  // États pour le tri
  const [sortType, setSortType] = useState('date-creation-desc') // Tri par défaut
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  
  const [projects, setProjects] = useState<Project[]>([])
  
  // États pour l'autocomplétion (commentés car non utilisés actuellement)
  // const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false)
  // const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false)
  // const [showThematicSuggestions, setShowThematicSuggestions] = useState(false)
  // const [filteredEmployees, setFilteredEmployees] = useState<string[]>([])
  // const [filteredPartners, setFilteredPartners] = useState<string[]>([])
  // const [filteredThematics, setFilteredThematics] = useState<string[]>([])
  
  // États pour l'autocomplétion d'édition (commentés car non utilisés actuellement)
  // const [showEditEmployeeSuggestions, setShowEditEmployeeSuggestions] = useState(false)
  // const [showEditPartnerSuggestions, setShowEditPartnerSuggestions] = useState(false)
  // const [showEditThematicSuggestions, setShowEditThematicSuggestions] = useState(false)
  // const [filteredEditEmployees, setFilteredEditEmployees] = useState<string[]>([])
  // const [filteredEditPartners, setFilteredEditPartners] = useState<string[]>([])
  // const [filteredEditThematics, setFilteredEditThematics] = useState<string[]>([])
  
  // États pour l'édition et la suppression
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  

  // Fonction pour maintenir la session active
  const keepSessionAlive = async () => {
    try {
      // Importer supabase dynamiquement pour éviter les problèmes de scope
      const { supabase } = await import('@/lib/supabase')
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Erreur lors de la vérification de session:', error)
      } else if (session) {
        console.log('✅ Session maintenue active')
      }
    } catch (error) {
      console.error('❌ Erreur lors du maintien de session:', error)
    }
  }

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
        // setShowEmployeeSuggestions(false) // Commenté car non utilisé
        // setShowPartnerSuggestions(false) // Commenté car non utilisé
        // setShowThematicSuggestions(false) // Commenté car non utilisé
        // setShowEditEmployeeSuggestions(false) // Commenté car non utilisé
        // setShowEditPartnerSuggestions(false) // Commenté car non utilisé
        // setShowEditThematicSuggestions(false) // Commenté car non utilisé
      }
      
      // Fermer le menu de tri si on clique à l'extérieur
      if (!target.closest('.sort-menu-container')) {
        setShowSortMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fonction pour calculer le statut automatique en fonction des dates
  const calculateAutoStatus = (startDate: string, endDate: string): string => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Normaliser à minuit
    
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    
    // Si la date de fin est dépassée → Terminé
    if (now > end) {
      return 'completed'
    }
    
    // Si la date de début est passée mais pas la date de fin → En cours
    if (now >= start && now <= end) {
      return 'active'
    }
    
    // Si la date de début n'est pas encore arrivée → Planification
    if (now < start) {
      return 'planning'
    }
    
    return 'planning' // Par défaut
  }

  // Fonction de rechargement des projets (déclarée en dehors pour être réutilisable)
  const loadProjectsData = async () => {
    try {
      setLoading(true)
      
      const limit = 100 // Charger tous les projets d'un coup
      const offset = 0
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
        // Calculer le statut automatiquement en fonction des dates
        const autoStatus = calculateAutoStatus(project.start_date, project.end_date)
        
        console.log('🔍 Projet chargé:', { 
          title: project.title, 
          created_at: project.created_at,
          has_created_at: !!project.created_at,
          status_original: project.status,
          status_calculé: autoStatus
        })
        
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          status: autoStatus, // Utiliser le statut calculé automatiquement
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
          is_private_for_visitors: project.is_private_for_visitors,
          created_at: project.created_at
        }
      })
      setProjects(convertedProjects)
      console.log('📊 Projets chargés:', convertedProjects.length)
      console.log('📊 État expanded initial:', Array.from(expandedProjects))
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger les projets paginés depuis Supabase
  useEffect(() => {
    loadProjectsData()
  }, [profile?.role])

  // Recharger les projets quand le modal se ferme (après un ajout)
  // Utiliser une ref pour éviter les rechargements lors de l'ouverture
  const previousShowAddModal = useRef(showAddModal)
  
  useEffect(() => {
    // Si le modal vient de se fermer (était ouvert, maintenant fermé), recharger
    if (previousShowAddModal.current && !showAddModal) {
      console.log('🔄 Rechargement des projets après fermeture du modal')
      loadProjectsData()
    }
    previousShowAddModal.current = showAddModal
  }, [showAddModal])


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
    console.log('🏷️ Tags disponibles mis à jour:', tags.length, 'tags')
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
      console.warn('⚠️ Tentative d&apos;accès non autorisé au modal de création de projet')
      alert('Vous n&apos;avez pas les permissions pour créer des projets.')
    }
  }, [searchParams, profile?.role])

  // Effet pour gérer le paramètre employe et appliquer le filtre automatiquement
  useEffect(() => {
    const employeParam = searchParams.get('employe')
    if (employeParam) {
      // Décoder le nom de l'employé
      const employeName = decodeURIComponent(employeParam)
      console.log('🔍 Filtre employé détecté dans l&apos;URL:', employeName)
      
      // Ajouter le filtre employé aux tags sélectionnés
      const employeTag = { type: 'employee', value: employeName }
      setSelectedTags(prev => {
        // Vérifier si le tag n'est pas déjà présent
        const tagExists = prev.some(tag => tag.type === 'employee' && tag.value === employeName)
        if (!tagExists) {
          return [...prev, employeTag]
        }
        return prev
      })
    }
  }, [searchParams])

  // Maintenir la session active quand le modal est ouvert
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (showAddModal) {
      // Maintenir la session active toutes les 2 minutes
      interval = setInterval(keepSessionAlive, 120000)
      console.log('🔄 Démarrage du maintien de session active')
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
        console.log('🔄 Arrêt du maintien de session active')
      }
    }
  }, [showAddModal])





  // Fonction de tri des projets
  const sortProjects = (projectsToSort: Project[], sortBy: string) => {
    const sortedProjects = [...projectsToSort]
    
    console.log('🔍 Tri des projets:', sortBy)
    console.log('🔍 Nombre de projets à trier:', sortedProjects.length)
    
    switch (sortBy) {
      case 'date-debut-asc':
        return sortedProjects.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      case 'date-debut-desc':
        return sortedProjects.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      case 'date-fin-asc':
        return sortedProjects.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
      case 'date-fin-desc':
        return sortedProjects.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
      case 'date-creation-asc':
        console.log('🔍 Tri par date de création (asc):', sortedProjects.map(p => ({ title: p.title, created_at: p.created_at })))
        return sortedProjects.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime()
          const dateB = new Date(b.created_at || '').getTime()
          console.log(`🔍 Comparaison: ${a.title} (${a.created_at}) vs ${b.title} (${b.created_at})`)
          return dateA - dateB
        })
      case 'date-creation-desc':
        console.log('🔍 Tri par date de création (desc):', sortedProjects.map(p => ({ title: p.title, created_at: p.created_at })))
        return sortedProjects.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime()
          const dateB = new Date(b.created_at || '').getTime()
          console.log(`🔍 Comparaison: ${a.title} (${a.created_at}) vs ${b.title} (${b.created_at})`)
          return dateB - dateA
        })
      case 'echeance-asc':
        return sortedProjects.sort((a, b) => {
          const progressA = calculateDeadline(a.start_date, a.end_date)
          const progressB = calculateDeadline(b.start_date, b.end_date)
          return progressA - progressB
        })
      case 'echeance-desc':
        return sortedProjects.sort((a, b) => {
          const progressA = calculateDeadline(a.start_date, a.end_date)
          const progressB = calculateDeadline(b.start_date, b.end_date)
          return progressB - progressA
        })
      default:
        return sortedProjects
    }
  }

  // Fonction pour obtenir le texte du tri actuel
  const getSortText = (sortBy: string) => {
    switch (sortBy) {
      case 'date-debut-asc': return 'Début ↑'
      case 'date-debut-desc': return 'Début ↓'
      case 'date-fin-asc': return 'Fin ↑'
      case 'date-fin-desc': return 'Fin ↓'
      case 'date-creation-asc': return 'Ajout ↑'
      case 'date-creation-desc': return 'Ajout ↓'
      case 'echeance-asc': return 'Échéance ↑'
      case 'echeance-desc': return 'Échéance ↓'
      default: return 'Tri'
    }
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

  // Calculer les statistiques sur les projets filtrés (incluant les tags)
  // On utilise les projets filtrés par tags et recherche, mais sans le filtre de statut
  const projectsForStats = visibleProjects.filter(project => {
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
    
    return searchMatch && tagMatch
  })
  
  const totalProjects = projectsForStats.length
  const activeProjects = projectsForStats.filter(p => p.status === 'active').length
  const completedProjects = projectsForStats.filter(p => p.status === 'completed').length
  const planningProjects = projectsForStats.filter(p => p.status === 'planning').length

  useEffect(() => {
    onStatsChange({
      totalProjects,
      activeProjects,
      completedProjects,
      planningProjects
    })
  }, [totalProjects, activeProjects, completedProjects, planningProjects, onStatsChange])

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
    
    console.log('🔄 Rafraîchissement du modal d&apos;édition...')
    try {
      // Recharger les données du projet depuis la base
      const projectsData = await getProjectsWithDetails()
      const freshProject = projectsData.find(p => p.id === editProject.id)
      
      if (freshProject && freshProject.id) {
        setEditProject(freshProject as Project)
        setLastActivity(Date.now())
        console.log('✅ Modal d&apos;édition rafraîchi')
      } else {
        console.error('❌ Projet non trouvé lors du rafraîchissement')
        setEditProject(null)
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error)
    }
  }

  return (
    <div className="space-y-6">

        {/* Résumé moderne sans cadre */}
        {isClient && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-4 gap-4 text-center">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    activeFilter === 'all'
                      ? 'bg-blue-500/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`text-2xl font-bold gradient-text ${
                    activeFilter === 'all' 
                      ? 'text-blue-400' 
                      : theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>{totalProjects}</div>
                  <div className={`text-sm font-medium ${
                    activeFilter === 'all'
                      ? 'text-blue-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>Total</div>
                </button>
                <button 
                  onClick={() => setActiveFilter('active')}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    activeFilter === 'active'
                      ? 'bg-emerald-500/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`text-2xl font-bold gradient-text ${
                    activeFilter === 'active' 
                      ? 'text-emerald-400' 
                      : 'text-emerald-400'
                  }`}>{activeProjects}</div>
                  <div className={`text-sm font-medium ${
                    activeFilter === 'active'
                      ? 'text-emerald-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>En cours</div>
                </button>
                <button 
                  onClick={() => setActiveFilter('completed')}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    activeFilter === 'completed'
                      ? 'bg-blue-500/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`text-2xl font-bold gradient-text ${
                    activeFilter === 'completed' 
                      ? 'text-blue-400' 
                      : 'text-blue-400'
                  }`}>{completedProjects}</div>
                  <div className={`text-sm font-medium ${
                    activeFilter === 'completed'
                      ? 'text-blue-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>Terminés</div>
                </button>
                {/* Bouton de recherche designé */}
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center ${
                    showSearch
                      ? 'bg-blue-500/20'
                      : 'hover:bg-blue-500/10'
                  }`}
                  title="Rechercher un projet"
                >
                  <div className={`transition-all duration-300 ${
                    showSearch 
                      ? 'text-blue-400' 
                      : theme === 'light' ? 'text-gray-600 hover:text-blue-600' : 'text-gray-300 hover:text-blue-400'
                  }`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    showSearch
                      ? 'text-blue-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>Rechercher</div>
                </button>
            </div>
          </div>
        )}

        {/* Recherche cachée par défaut */}
        {showSearch && (
          <div className="mb-4 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className={`w-full border rounded-xl px-4 py-2 transition-all duration-300 backdrop-blur-sm ${
                  theme === 'light'
                    ? 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    : 'glass-effect border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                }`}
              />
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Effacer la recherche"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tags sélectionnés */}
        {selectedTags.length > 0 && (
          <div className="mb-4 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <div key={index} className="flex items-center glass-effect text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30 transition-all duration-300 hover:shadow-glow hover:scale-105 active:scale-95 backdrop-blur-sm">
                  <span>{tag.value}</span>
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== index))}
                    className="ml-2 text-blue-400 hover:text-blue-300 transition-colors"
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Filtrer par tags
            </label>
            
            {/* Bouton de tri moderne */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 shadow-lg ${
                  theme === 'light'
                    ? 'bg-white/90 text-blue-700 border border-blue-200/50 hover:bg-white hover:shadow-xl focus:ring-blue-500/50'
                    : 'bg-slate-800/70 text-blue-300 border border-slate-700/50 hover:bg-slate-800/90 hover:shadow-blue-500/20 focus:ring-blue-500/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>{getSortText(sortType)}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Menu déroulant de tri */}
              {showSortMenu && (
                <div className={`sort-menu-container absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-50 animate-fade-in border ${
                  theme === 'light'
                    ? 'bg-white/95 border-gray-200'
                    : 'bg-slate-800/95 border-slate-700'
                }`}>
                  <div className="py-2">
                    {/* Section Création */}
                    <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Création
                    </div>
                      <button
                        onClick={() => { setSortType('date-creation-desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'date-creation-desc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span>Plus récents</span>
                        </div>
                      </button>
                      <button
                        onClick={() => { setSortType('date-creation-asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'date-creation-asc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Plus anciens</span>
                        </div>
                      </button>
                      
                      <div className={`border-t my-2 ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}></div>
                      
                    {/* Section Début */}
                    <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Date de début
                    </div>
                      <button
                        onClick={() => { setSortType('date-debut-desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'date-debut-desc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span>Plus récent</span>
                        </div>
                      </button>
                      <button
                        onClick={() => { setSortType('date-debut-asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'date-debut-asc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Plus ancien</span>
                        </div>
                      </button>
                      
                      <div className={`border-t my-2 ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}></div>
                      
                    {/* Section Fin */}
                    <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Date de fin
                    </div>
                      <button
                        onClick={() => { setSortType('date-fin-desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'date-fin-desc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span>Plus récente</span>
                        </div>
                      </button>
                      <button
                        onClick={() => { setSortType('date-fin-asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'date-fin-asc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Plus ancienne</span>
                        </div>
                      </button>
                      
                      <div className={`border-t my-2 ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}></div>
                      
                    {/* Section Échéance */}
                    <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Échéance
                    </div>
                      <button
                        onClick={() => { setSortType('echeance-desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'echeance-desc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Plus urgente</span>
                        </div>
                      </button>
                      <button
                        onClick={() => { setSortType('echeance-asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortType === 'echeance-asc' 
                            ? theme === 'light' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-900/30 text-blue-300 font-medium'
                            : theme === 'light' ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Moins urgente</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
          </div>
          <div className="space-y-3">
            {/* Sélecteur de catégorie moderne avec dropdown personnalisé */}
            <div className="relative flex items-center space-x-3">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`w-11/12 rounded-lg px-4 py-3 py-3 pr-5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg hover:shadow-xl flex items-center justify-between ${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-white to-gray-50 border-2 border-gray-300 text-gray-800 hover:border-blue-400 focus:border-blue-500 hover:from-blue-50 hover:to-blue-100'
                    : 'bg-gradient-to-r from-gray-800/90 to-gray-700/90 border border-white/30 text-white backdrop-blur-sm hover:border-white/50 hover:from-gray-700/90 hover:to-gray-600/90'
                }`}
              >
                <span className="truncate">
                  {selectedTagType === 'employee' ? 'Employés impliqués' :
                   selectedTagType === 'partner' ? 'Partenaires' :
                   selectedTagType === 'thematic' ? 'Thématiques' :
                   selectedTagType === 'pole' ? 'Pôle' : 'Sélectionner une catégorie...'}
                </span>
                {/* Flèche dropdown - plus proche du bord */}
                <svg className={`w-4 h-4 transition-transform duration-300 ${showCategoryDropdown ? 'rotate-180' : ''} ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Bouton de suppression (croix) - à l'extérieur du bouton principal */}
              {selectedTagType && (
                <button
                  onClick={() => {
                    setSelectedTagType('')
                    setTagSearchTerm('')
                    setShowCategoryDropdown(false)
                  }}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    theme === 'light'
                      ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      : 'text-gray-400 hover:text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Dropdown personnalisé */}
              {showCategoryDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-50 animate-fade-in ${
                  theme === 'light'
                    ? 'bg-white'
                    : 'glass-effect backdrop-blur-sm border border-white/20'
                }`}>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setSelectedTagType('employee')
                        setTagSearchTerm('')
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                        theme === 'light'
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-blue-50'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Employés impliqués
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTagType('partner')
                        setTagSearchTerm('')
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                        theme === 'light'
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-blue-50'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Partenaires
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTagType('thematic')
                        setTagSearchTerm('')
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                        theme === 'light'
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-blue-50'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Thématiques
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTagType('pole')
                        setTagSearchTerm('')
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                        theme === 'light'
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-blue-50'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Pôle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Barre de recherche pour les tags */}
            {selectedTagType && (
              <div>
                <input
                  type="text"
                  placeholder={`Rechercher dans ${selectedTagType === 'employee' ? 'les employés' : selectedTagType === 'partner' ? 'les partenaires' : selectedTagType === 'thematic' ? 'les thématiques' : 'les pôles'}...`}
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  className="w-full glass-effect border border-white/20 rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            )}

            {/* Liste des tags filtrés */}
            {selectedTagType && (
              <div className="max-h-32 overflow-y-auto space-y-1 glass-effect rounded-xl p-2 animate-fade-in backdrop-blur-sm">
                {availableTags
                  .filter(tag => tag.type === selectedTagType)
                  .filter(tag => tag.value.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                  .map((tag) => (
                    <button
                      key={`${tag.type}-${tag.value}`}
                      onClick={() => {
                        if (!selectedTags.some(t => t.type === tag.type && t.value === tag.value)) {
                          setSelectedTags([...selectedTags, tag])
                          // Fermer la zone de sélection après ajout du tag
                          setSelectedTagType('')
                          setTagSearchTerm('')
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {tag.value}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Liste des projets en accordéon */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 animate-pulse shadow-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Chargement des projets...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Aucun projet trouvé</p>
            </div>
          ) : (
            sortProjects(filteredProjects, sortType).map((project, index) => (
            <div key={project.id} className="relative">
              {/* Ligne de séparation fine */}
              {index > 0 && (
                <div className={`h-px w-full ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                }`} />
              )}
              
              <div 
                className={`transition-all duration-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  animation: `fadeInUp 0.5s ease-out ${index * 100}ms both`
                }}
                data-expanded={expandedProjects.has(project.id)}
              >
              {/* En-tête du projet */}
              <div className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                                          <h3 className={`text-sm font-semibold ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {project.title}
                    </h3>
                      {/* Indicateur pour les projets masqués aux visiteurs */}
                      {project.is_private_for_visitors && (
                        <div className="flex items-center space-x-0.5 bg-red-500/20 text-red-400 px-1 py-0 rounded text-xxs font-medium border border-red-500/30 backdrop-blur-sm" style={{fontSize: '10px', lineHeight: '14px'}}>
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                          <span>Masqué</span>
                        </div>
                      )}
                    </div>
                    {/* Localisation avec icône moderne */}
                    {project.location && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400 mb-2">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{project.location}</span>
                      </div>
                    )}
                    {/* Sous le titre, statut et membres */}
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs">{project.employees.length} membre{project.employees.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="ml-4 w-8 h-8 bg-white/80 hover:bg-white/90 rounded-lg flex items-center justify-center text-blue-600 transition-all duration-300 hover:scale-110 active:scale-95"
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
                  <div className="pb-4 space-y-3 min-h-0">
                  {/* Description */}
                  <div>
                                          <h4 className="text-sm font-medium text-white mb-2">Description</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Indicateur de visibilité pour les visiteurs */}
                  {project.is_private_for_visitors && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-400">Projet masqué aux visiteurs</h4>
                          <p className="text-xs text-red-300">Ce projet n&apos;est visible que pour les administrateurs</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations clés sur 2 colonnes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Période</h4>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Début : {formatDate(project.start_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Fin : {formatDate(project.deadline || '')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Pôle</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{project.pole}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Thématiques</h4>
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
                          <span className="text-gray-400 text-xs italic">Aucune thématique définie</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Statut</h4>
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
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
                      <h4 className="text-sm font-medium text-white mb-2 flex items-center space-x-1">
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
                          <span className="text-gray-400 text-xs">Aucun employé</span>
                        )}
                      </div>
                    </div>

                    {/* Partenaires */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2 flex items-center space-x-1">
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
                          <span className="text-gray-400 text-xs">Aucun partenaire</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
              </div>
            </div>
          ))
          )}
        </div>

        {/* Modal d'édition */}
        {editProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">Modifier le projet</h2>
                  <button
                    onClick={() => setEditProject(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Titre</label>
                  <input
                    type="text"
                    value={editProject.title}
                    onChange={e => setEditProject({ ...editProject, title: e.target.value })}
                    className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                  />
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={editProject.description}
                    onChange={e => setEditProject({ ...editProject, description: e.target.value })}
                    className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700"
                    rows={3}
                  />
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
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setEditProject(null)}
                      className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
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
                        }
                      } catch (error) {
                        console.error('❌ Erreur lors de la suppression en arrière-plan:', error)
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
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
