'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { getProjectsWithDetails } from '@/lib/projects'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

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

export default function Statistiques() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  
  // DEBUG: Vérifier que theme fonctionne
  console.log('📊 Statistiques - Theme actuel:', theme)
  const [projects, setProjects] = useState<Project[]>([])
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)

  // Initialiser isClient
  useEffect(() => {
    setIsClient(true)
  }, [])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedThematics, setSelectedThematics] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Projets filtrés selon le rôle de l'utilisateur
  const visibleProjects = useMemo(() => {
    console.log('🔍 Debug statistiques - Profile:', profile?.role)
    console.log('🔍 Debug statistiques - Total projets:', projects.length)
    console.log('🔍 Debug statistiques - Projets privés:', projects.filter(p => p.is_private_for_visitors).length)
    
    // Attendre que le profil soit chargé
    if (!profile) {
      console.log('🔍 Debug statistiques - Profil non encore chargé, utilisation de tous les projets')
      return projects
    }
    
    if (profile.role === 'visitor') {
      const filtered = projects.filter(project => !project.is_private_for_visitors)
      console.log('🔍 Debug statistiques - Projets filtrés pour visiteur:', filtered.length)
      return filtered
    }
    console.log('🔍 Debug statistiques - Utilisation de tous les projets (admin)')
    return projects
  }, [projects, profile?.role])

  // Charger les projets depuis Supabase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true)
        const projectsData = await getProjectsWithDetails(100, 0) // Charger jusqu'à 100 projets pour les stats
        const convertedProjects: Project[] = (projectsData || []).map((project: any) => ({
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
          is_private_for_visitors: project.is_private_for_visitors || false
        }))
        setProjects(convertedProjects)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des projets pour les statistiques:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Filtrer les projets selon les critères (utilise visibleProjects au lieu de projects)
  const filteredProjects = visibleProjects.filter(project => {
    const statusMatch = selectedStatus === 'all' || project.status === selectedStatus
    
    let dateMatch = true
    if (selectedDateRange !== 'all') {
      const projectDate = new Date(project.start_date)
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      
      switch (selectedDateRange) {
        case 'recent':
          dateMatch = projectDate >= sixMonthsAgo
          break
        case 'old':
          dateMatch = projectDate < oneYearAgo
          break
        case 'current':
          dateMatch = projectDate >= oneYearAgo && projectDate < sixMonthsAgo
          break
      }
    }
    
    return statusMatch && dateMatch
  })

  // Calculer les statistiques basées sur les projets filtrés
  const stats = {
    totalProjects: filteredProjects.length,
    activeProjects: filteredProjects.filter(p => p.status === 'active').length,
    completedProjects: filteredProjects.filter(p => p.status === 'completed').length,
    planningProjects: filteredProjects.filter(p => p.status === 'planning').length,
    totalMembers: filteredProjects.reduce((sum, p) => sum + p.employees.length, 0)
  }

  // Statistiques par pôle
  const poleStats = filteredProjects.reduce((acc, project) => {
    acc[project.pole] = (acc[project.pole] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  // Statistiques par employé
  const employeeStats = filteredProjects.reduce((acc, project) => {
    project.employees.forEach(employee => {
      acc[employee] = (acc[employee] || 0) + 1
    })
    return acc
  }, {} as { [key: string]: number })

  // Statistiques par partenaire
  const partnerStats = filteredProjects.reduce((acc, project) => {
    project.partners.forEach(partner => {
      acc[partner] = (acc[partner] || 0) + 1
    })
    return acc
  }, {} as { [key: string]: number })

  // Statistiques par thématique
  const thematicStats = filteredProjects.reduce((acc, project) => {
    project.thematics.forEach(thematic => {
      acc[thematic] = (acc[thematic] || 0) + 1
    })
    return acc
  }, {} as { [key: string]: number })

  // Trier les données pour l'affichage
  const sortedPoleStats = Object.entries(poleStats).sort(([,a], [,b]) => b - a)
  const sortedEmployeeStats = Object.entries(employeeStats).sort(([,a], [,b]) => b - a)
  const sortedPartnerStats = Object.entries(partnerStats).sort(([,a], [,b]) => b - a)
  const sortedThematicStats = Object.entries(thematicStats).sort(([,a], [,b]) => b - a)



  // Couleurs pour le camembert
  const pieColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]

  // Calculer les angles pour le camembert
  const totalPoleProjects = sortedPoleStats.reduce((sum, [, count]) => sum + count, 0)
  let currentAngle = 0
  const pieData = sortedPoleStats.map(([pole, count], index) => {
    const percentage = (count / totalPoleProjects) * 100
    const startAngle = currentAngle
    currentAngle += (percentage / 100) * 360
    return {
      pole,
      count,
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: pieColors[index % pieColors.length]
    }
  })

  // Helper pour le statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'En cours'
      case 'completed':
        return 'Terminé'
      case 'planning':
        return 'Planification'
      default:
        return status
    }
  }

  // Fonction pour obtenir l'icône SVG d'une thématique
  const getThematicIcon = (thematic: string) => {
    const thematicLower = thematic.toLowerCase()
    
    // 🔬 Recherche - Microscope
    if (thematicLower.includes('recherche') || thematicLower.includes('projet de recherche')) {
      return '🔬'
    }
    
    // 🐢 Herpétologie - Tortue
    if (thematicLower.includes('herpétologie') || thematicLower.includes('herpetologie')) {
      return '🐢'
    }
    
    // 🌸 Flore - Fleur
    if (thematicLower.includes('flore') || thematicLower.includes('botanique') || thematicLower.includes('plante')) {
      return '🌸'
    }
    
    // 🦅 Ornithologie - Oiseau (corrigé)
    if (thematicLower.includes('ornithologie') || thematicLower.includes('oiseau') || thematicLower.includes('oiseaux')) {
      return '🦅'
    }
    
    // 💧 Hydrologie - Goutte d'eau
    if (thematicLower.includes('hydrologie') || thematicLower.includes('eau') || thematicLower.includes('hydrique')) {
      return '💧'
    }
    
    // 🐸 POPAmphibien - Grenouille
    if (thematicLower.includes('popamphibien') || thematicLower.includes('amphibien') || thematicLower.includes('grenouille')) {
      return '🐸'
    }
    
    // 🎧 Acoustique - Casque d'écoute
    if (thematicLower.includes('acoustique') || thematicLower.includes('son') || thematicLower.includes('audio')) {
      return '🎧'
    }
    
    // 🧬 Génétique - ADN
    if (thematicLower.includes('génétique') || thematicLower.includes('genetique') || thematicLower.includes('adn') || thematicLower.includes('dna')) {
      return '🧬'
    }
    
    // 🦊 Mammifère - Animal
    if (thematicLower.includes('mammifère') || thematicLower.includes('mammifere') || thematicLower.includes('mammal')) {
      return '🦊'
    }
    
    // 🛡️ Conservation - Bouclier
    if (thematicLower.includes('conservation') || thematicLower.includes('protection')) {
      return '🛡️'
    }
    
    // 🌿 Écologie - Feuille
    if (thematicLower.includes('écologie') || thematicLower.includes('ecologie') || thematicLower.includes('écosystème')) {
      return '🌿'
    }
    
    // ⭐ Biodiversité - Étoile
    if (thematicLower.includes('biodiversité') || thematicLower.includes('biodiversite')) {
      return '⭐'
    }
    
    // 📊 Monitoring - Graphique
    if (thematicLower.includes('monitoring') || thematicLower.includes('suivi')) {
      return '📊'
    }
    
    // 🗣️ Sensibilisation - Personne qui parle
    if (thematicLower.includes('sensibilisation') || thematicLower.includes('sensibiliser') || thematicLower.includes('éducation')) {
      return '🗣️'
    }
    
    // 📏 Écophysiologie/Écomorphologie - Instrument de mesure
    if (thematicLower.includes('écophysiologie') || thematicLower.includes('ecophysiologie') || thematicLower.includes('écomorphologie') || thematicLower.includes('ecomorphologie')) {
      return '📏'
    }
    
    // 🚧 Gestion de sites - Travaux sur le terrain
    if (thematicLower.includes('gestion de sites') || thematicLower.includes('gestion sites') || thematicLower.includes('site') || thematicLower.includes('terrain')) {
      return '🚧'
    }
    
    // 👨‍🌾 Agriculture - Paysan
    if (thematicLower.includes('agriculture') || thematicLower.includes('agricole') || thematicLower.includes('ferme') || thematicLower.includes('cultivation')) {
      return '👨‍🌾'
    }
    
    // 🐍 POPReptile - Serpent
    if (thematicLower.includes('popreptile') || thematicLower.includes('reptile') || thematicLower.includes('serpent')) {
      return '🐍'
    }
    
    // 📡 Télémétrie - Antenne satellite
    if (thematicLower.includes('télémétrie') || thematicLower.includes('telemetrie') || thematicLower.includes('gps') || thematicLower.includes('tracking')) {
      return '📡'
    }
    
    // Icône par défaut pour les thématiques non reconnues
    return '🔬'
  }

  // Fonction pour ouvrir le modal de projet
  const openProjectModal = (project: Project) => {
    console.log('🔍 DEBUG - Projet sélectionné:', {
      title: project.title,
      location: project.location,
      pole: project.pole,
      employees: project.employees.length,
      partners: project.partners.length,
      thematics: project.thematics.length
    })
    setSelectedProject(project)
  }

  // Fonction pour fermer le modal de projet
  const closeProjectModal = () => {
    setSelectedProject(null)
  }

  // Fonction pour calculer le pourcentage de progression
  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()
    
    if (now <= start) return 0
    if (now >= end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-blue-800 via-blue-700 to-blue-800' 
        : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
    }`}>
      {/* Fond décoratif fixe, non intrusif */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Cercles flous */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-white/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl"></div>
        {/* Halo doux */}
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        {/* Motif hexagone flouté */}
        <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-2xl blur-xl"
          style={{ clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)' }}>
        </div>
        {/* Courbe fine */}
        <div className="absolute top-0 right-1/4 w-64 h-12 bg-gradient-to-r from-blue-300/20 to-transparent rounded-full blur-lg rotate-12 animate-pulse"></div>
      </div>
      {/* Header moderne avec animations */}
      <header className="fixed top-0 left-0 right-0 glass-effect border-b border-white/10 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors hover:scale-110 transform duration-300 active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              textShadow: 'none !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>
              Statistiques
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse hover:shadow-lg hover:shadow-blue-500/30 hover:scale-110 transform transition-all duration-300">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

              {/* Contenu principal avec padding pour la barre fixe */}
        <div className="pt-20 pb-8">
          <div className="max-w-md mx-auto px-6 space-y-6">
          {/* Indicateur de chargement */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 animate-pulse shadow-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <p className="text-gray-300">Chargement des statistiques...</p>
            </div>
          )}

                      {/* Filtres modernes avec animations */}
            {!loading && (
              <div className="glass-effect p-6 animate-fade-in transition-all duration-300 border border-white/10 mt-2 mb-4 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
                            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              textShadow: 'none !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>
              <svg className="w-5 h-5 text-blue-400 animate-pulse hover:scale-110 transform transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              <span style={{color: theme === 'light' ? '#000000' : '#ffffff'}}>Filtres</span>
            </h3>
              <div className="space-y-4">
                {/* Filtre par statut */}
                <div>
                  <label className="block text-sm font-medium mb-2 font-body text-gray-300">Statut</label>
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm appearance-none pr-8"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="active">En cours</option>
                      <option value="completed">Terminés</option>
                      <option value="planning">Planification</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Filtre par période */}
                <div>
                  <label className="block text-sm font-medium mb-2 font-body text-gray-300">Période</label>
                  <div className="relative">
                    <select
                      value={selectedDateRange}
                      onChange={(e) => setSelectedDateRange(e.target.value)}
                      className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm appearance-none pr-8"
                    >
                      <option value="all">Toutes les périodes</option>
                      <option value="recent">6 derniers mois</option>
                      <option value="current">1 an</option>
                      <option value="old">Plus d'un an</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

                      {/* Statistiques générales modernes avec animations */}
            {!loading && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in transition-all duration-300">
                <div className="col-span-2 mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg px-3 py-1.5 inline-block shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transform transition-all duration-300">
                    <h3 className="text-sm font-semibold flex items-center space-x-2" style={{
                      color: '#ffffff !important',
                      background: 'none !important',
                      WebkitBackgroundClip: 'initial !important',
                      WebkitTextFillColor: '#ffffff !important',
                      backgroundClip: 'initial !important'
                    }}>
                      <svg className="w-4 h-4 text-white animate-pulse hover:scale-110 transform transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Vue d'ensemble</span>
                    </h3>
                  </div>
                </div>
                <div className="glass-effect p-4 text-center rounded-2xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transform transition-all duration-300 group h-24 flex flex-col justify-center">
                  {isClient && theme === 'light' ? (
                    <div className="text-2xl font-bold mb-1 group-hover:text-blue-300 transition-colors" style={{color: '#000000', fontWeight: 'bold'}}>{stats.totalProjects}</div>
                  ) : (
                    <div className="text-2xl font-bold mb-1 text-white group-hover:text-blue-300 transition-colors">{stats.totalProjects}</div>
                  )}
                  <div className="text-sm font-body text-gray-300 group-hover:text-gray-200 transition-colors">Total projets</div>
                </div>
                <div className="glass-effect p-4 text-center rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 transform transition-all duration-300 group h-24 flex flex-col justify-center">
                  <div className="text-2xl font-bold mb-1 group-hover:text-emerald-300 transition-colors" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>{stats.activeProjects}</div>
                  <div className="text-sm font-body text-gray-300 group-hover:text-gray-200 transition-colors">En cours</div>
                </div>
                <div className="glass-effect p-4 text-center rounded-2xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transform transition-all duration-300 group h-24 flex flex-col justify-center">
                  <div className="text-2xl font-bold mb-1 group-hover:text-blue-300 transition-colors" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>{stats.completedProjects}</div>
                  <div className="text-sm font-body text-gray-300 group-hover:text-gray-200 transition-colors">Terminés</div>
                </div>
                <div className="glass-effect p-4 text-center rounded-2xl hover:shadow-2xl hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transform transition-all duration-300 group h-24 flex flex-col justify-center">
                  <div className="text-2xl font-bold mb-1 group-hover:text-amber-300 transition-colors" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>{stats.planningProjects}</div>
                  <div className="text-sm font-body text-gray-300 group-hover:text-gray-200 transition-colors">Planification</div>
                </div>
              </div>
            )}

          {/* Graphique camembert pour les projets par pôle */}
          <div className="glass-effect p-6 animate-fade-in transition-all duration-300 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
            <h3 className="text-lg font-semibold mb-4" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              textShadow: 'none !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>Répartition par pôle</h3>
            {isClient && pieData.length > 0 && (
              <div className="flex flex-col items-center">
                {/* Graphique camembert */}
                <div className="flex flex-col items-center mb-6">
                  <div className="text-lg font-bold text-white mb-2">{totalPoleProjects} projets</div>
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {pieData.map((slice) => {
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + (slice.percentage / 100) * 360;
                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                        const x1 = 50 + 50 * Math.cos((Math.PI / 180) * (startAngle - 90));
                        const y1 = 50 + 50 * Math.sin((Math.PI / 180) * (startAngle - 90));
                        const x2 = 50 + 50 * Math.cos((Math.PI / 180) * (endAngle - 90));
                        const y2 = 50 + 50 * Math.sin((Math.PI / 180) * (endAngle - 90));
                        const d = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                        currentAngle = endAngle;
                        return (
                          <path
                            key={slice.pole}
                            d={d}
                            fill={slice.color}
                            stroke="white"
                            strokeWidth="0.5"
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>
                
                {/* Légende détaillée */}
                <div className="w-full space-y-2">
                  {pieData.map((slice) => (
                    <div key={slice.pole} className="flex items-center justify-between p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/50">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        ></div>
                        <span className="text-sm font-medium text-slate-800">{slice.pole}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-700">{slice.count} projet(s)</span>
                        <span className="text-xs text-slate-500">({slice.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Graphique en barres horizontal pour les projets par pôle */}
          <div className="glass-effect p-6 animate-fade-in transition-all duration-300 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
            <h3 className="text-lg font-semibold mb-4" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>Projets par pôle</h3>
            <div className="space-y-4">
              {sortedPoleStats.map(([pole, count], index) => {
                const maxCount = Math.max(...sortedPoleStats.map(([, c]) => c))
                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={pole} className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white truncate mr-2">{pole}</span>
                      <span className="text-sm font-semibold text-white min-w-fit">{count}</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-slate-200 rounded-lg h-6 overflow-hidden">
                        <div 
                          className="h-6 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2"
                          style={{ 
                            width: `${barWidth}%`,
                            backgroundColor: pieColors[index % pieColors.length],
                            backgroundImage: `linear-gradient(90deg, ${pieColors[index % pieColors.length]} 0%, ${pieColors[index % pieColors.length]}dd 100%)`
                          }}
                        >
                          <span className="text-xs font-medium text-white drop-shadow-sm">
                            {count > 0 ? count : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Légende des couleurs */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-white mb-2">Légende des couleurs :</div>
              <div className="grid grid-cols-2 gap-2">
                {sortedPoleStats.map(([pole], index) => (
                  <div key={pole} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    ></div>
                    <span className="text-xs text-white truncate">{pole}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistiques par employé */}
          <div className="glass-effect p-6 animate-fade-in transition-all duration-300 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
            <h3 className="text-lg font-semibold mb-4" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>Projets par employés</h3>
            {/* Sélection multi-employés */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Sélectionner un employé</label>
              <select
                value={selectedEmployees[0] || ''}
                onChange={e => setSelectedEmployees(e.target.value ? [e.target.value] : [])}
                className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-3 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
              >
                <option value="">-- Choisir un employé --</option>
                {sortedEmployeeStats.map(([employee]) => (
                  <option key={employee} value={employee}>{employee}</option>
                ))}
              </select>
            </div>

            {/* Affichage des projets et répartition par pôle si sélection */}
            {!!selectedEmployees[0] && (
              <div className="mt-6 space-y-6">
                {/* Liste moderne des projets */}
                <div>
                  <h4 className="text-md font-semibold mb-2" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>Projets impliquant {selectedEmployees[0]}</h4>
                  <div className="divide-y divide-slate-200 rounded-xl overflow-hidden border border-slate-200 bg-white/80">
                    {filteredProjects
                      .filter(p => p.employees.some(e => selectedEmployees.includes(e)))
                      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                      .map(project => (
                      <div 
                        key={project.id} 
                        className="p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => openProjectModal(project)}
                      >
                        <div>
                          <div className="font-semibold text-blue-900">{project.title}</div>
                          <div className="text-xs text-slate-500">{project.thematic} &bull; {project.pole}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{getStatusText(project.status)}</span>
                          <span className="text-xs text-slate-400">{new Date(project.start_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Répartition par pôle des projets sélectionnés */}
                <div>
                  <h4 className="text-md font-semibold mb-2" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>Répartition par pôle</h4>
                  {(() => {
                    const selectedProjects = filteredProjects.filter(p => p.employees.some(e => selectedEmployees.includes(e)));
                    const poleStatsSelected = selectedProjects.reduce((acc, project) => {
                      acc[project.pole] = (acc[project.pole] || 0) + 1;
                      return acc;
                    }, {} as { [key: string]: number });
                    const sortedPoleStatsSelected = Object.entries(poleStatsSelected).sort(([,a], [,b]) => b - a);
                    const maxCount = Math.max(...sortedPoleStatsSelected.map(([, c]) => c), 0);
                    return (
                      <div className="space-y-2">
                        {sortedPoleStatsSelected.length === 0 && <div className="text-slate-400 text-sm">Aucun projet pour cette sélection.</div>}
                        {sortedPoleStatsSelected.map(([pole, count], index) => {
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={pole} className="flex items-center gap-2">
                              <span className="w-24 text-xs text-white truncate">{pole}</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: pieColors[index % pieColors.length] }}></div>
                              </div>
                              <span className="text-xs text-white ml-2">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Si aucune sélection, afficher le top 10 comme avant */}
            {!!!selectedEmployees[0] && (
              <div className="space-y-3">
                {sortedEmployeeStats.slice(0, 10).map(([employee, count]) => (
                  <div 
                    key={employee} 
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg transition-all duration-200 hover:bg-slate-100 cursor-pointer"
                    onClick={() => setSelectedEmployees([employee])}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {employee.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{employee}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">{count} projet(s)</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistiques par thématique */}
          <div className="glass-effect p-6 animate-fade-in transition-all duration-300 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
            <h3 className="text-lg font-semibold mb-4" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>Projets par thématiques</h3>
            {/* Sélection multi-thématiques */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>Sélectionner une thématique</label>
              <select
                value={selectedThematics[0] || ''}
                onChange={e => setSelectedThematics(e.target.value ? [e.target.value] : [])}
                className="w-full bg-white/70 border border-purple-200/30 rounded-xl px-4 py-3 text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm"
              >
                <option value="">-- Choisir une thématique --</option>
                {sortedThematicStats.map(([thematic]) => (
                  <option key={thematic} value={thematic}>{thematic}</option>
                ))}
              </select>
            </div>

            {/* Affichage des projets et répartition par pôle si sélection */}
            {!!selectedThematics[0] && (
              <div className="mt-6 space-y-6">
                {/* Liste moderne des projets */}
                <div>
                  <h4 className="text-md font-semibold mb-2" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>Projets avec la thématique {selectedThematics[0]}</h4>
                  <div className="divide-y divide-slate-200 rounded-xl overflow-hidden border border-slate-200 bg-white/80">
                    {filteredProjects
                      .filter(p => p.thematics.some(t => selectedThematics.includes(t)))
                      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                      .map(project => (
                      <div 
                        key={project.id} 
                        className="p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-purple-50 transition-colors cursor-pointer"
                        onClick={() => openProjectModal(project)}
                      >
                        <div>
                          <div className="font-semibold text-purple-900">{project.title}</div>
                          <div className="text-xs text-slate-500">{project.thematic} &bull; {project.pole}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{getStatusText(project.status)}</span>
                          <span className="text-xs text-slate-400">{new Date(project.start_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Répartition par pôle des projets sélectionnés */}
                <div>
                  <h4 className="text-md font-semibold mb-2" style={{color: isClient && theme === 'light' ? '#000000' : '#ffffff'}}>Répartition par pôle</h4>
                  {(() => {
                    const selectedProjects = filteredProjects.filter(p => p.thematics.some(t => selectedThematics.includes(t)));
                    const poleStatsSelected = selectedProjects.reduce((acc, project) => {
                      acc[project.pole] = (acc[project.pole] || 0) + 1;
                      return acc;
                    }, {} as { [key: string]: number });
                    const sortedPoleStatsSelected = Object.entries(poleStatsSelected).sort(([,a], [,b]) => b - a);
                    const maxCount = Math.max(...sortedPoleStatsSelected.map(([, c]) => c), 0);
                    return (
                      <div className="space-y-2">
                        {sortedPoleStatsSelected.length === 0 && <div className="text-slate-400 text-sm">Aucun projet pour cette sélection.</div>}
                        {sortedPoleStatsSelected.map(([pole, count], index) => {
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={pole} className="flex items-center gap-2">
                              <span className="w-24 text-xs text-white truncate">{pole}</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: pieColors[index % pieColors.length] }}></div>
                              </div>
                              <span className="text-xs text-white ml-2">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Si aucune sélection, afficher le top 10 comme avant */}
            {!!!selectedThematics[0] && (
              <div className="space-y-3">
                {sortedThematicStats.slice(0, 10).map(([thematic, count]) => (
                  <div 
                    key={thematic} 
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg transition-all duration-200 hover:bg-slate-100 cursor-pointer"
                    onClick={() => setSelectedThematics([thematic])}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 flex items-center justify-center text-lg">
                        {getThematicIcon(thematic)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{thematic}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">{count} projet(s)</span>
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistiques par partenaire */}
          <div className="glass-effect p-6 animate-fade-in transition-all duration-300 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
            <h3 className="text-lg font-semibold mb-4" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>Partenaires principaux</h3>
            <div className="space-y-3">
              {sortedPartnerStats.slice(0, 10).map(([partner, count]) => (
                <div key={partner} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {partner.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{partner}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">{count} projet(s)</span>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Résumé des données */}
          <div className="glass-effect p-6 animate-fade-in transition-all duration-300 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-500">
            <h3 className="text-lg font-semibold mb-4" style={{
              color: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              fontWeight: 'bold !important',
              textShadow: 'none !important',
              background: 'none !important',
              WebkitBackgroundClip: 'initial !important',
              WebkitTextFillColor: theme === 'light' ? '#000000 !important' : '#ffffff !important',
              backgroundClip: 'initial !important'
            }}>Résumé</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                                  <span className="text-gray-300">Total des membres impliqués :</span>
                  <span className="font-semibold text-white">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Pôles actifs :</span>
                  <span className="font-semibold text-white">{sortedPoleStats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Employés impliqués :</span>
                  <span className="font-semibold text-white">{sortedEmployeeStats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Partenaires :</span>
                  <span className="font-semibold text-white">{sortedPartnerStats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Thématiques :</span>
                  <span className="font-semibold text-white">{sortedThematicStats.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails du projet */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Détails du projet</h2>
                <button
                  onClick={closeProjectModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Titre et statut */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedProject.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                      selectedProject.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {getStatusText(selectedProject.status)}
                    </span>
                    {selectedProject.is_private_for_visitors && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                        🚫 Masqué aux visiteurs
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedProject.description}</p>
                </div>

                {/* Progression */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Progression</h4>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${calculateProgress(selectedProject.start_date, selectedProject.end_date)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{calculateProgress(selectedProject.start_date, selectedProject.end_date)}%</span>
                    <span>{new Date(selectedProject.start_date).toLocaleDateString('fr-FR')} - {new Date(selectedProject.end_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Informations détaillées */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Pôle</h4>
                    <p className="text-slate-600 text-sm">{selectedProject.pole || 'Non défini'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Localisation</h4>
                    <p className="text-slate-600 text-sm">{selectedProject.location || 'Non définie'}</p>
                  </div>
                </div>

                {/* Employés */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Employés impliqués</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.employees.length > 0 ? (
                      selectedProject.employees.map((employee, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {employee}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm">Aucun employé assigné</span>
                    )}
                  </div>
                </div>

                {/* Partenaires */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Partenaires</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.partners.length > 0 ? (
                      selectedProject.partners.map((partner, index) => (
                        <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                          {partner}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm">Aucun partenaire</span>
                    )}
                  </div>
                </div>

                {/* Thématiques */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Thématiques</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.thematics.length > 0 ? (
                      selectedProject.thematics.map((thematic, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {thematic}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm">Aucune thématique</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 