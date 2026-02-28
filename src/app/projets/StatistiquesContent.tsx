'use client'

// import Link from 'next/link' // Temporairement commenté car non utilisé
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

interface ProjectStatsSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  planningProjects: number
}

interface StatistiquesContentProps {
  projectStats?: ProjectStatsSummary
}

export default function StatistiquesContent({ projectStats }: StatistiquesContentProps) {
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
  const [selectedDateRange] = useState('all')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedThematics, setSelectedThematics] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showAllEmployees, setShowAllEmployees] = useState(false)
  const [showAllThematics, setShowAllThematics] = useState(false)
  const [showAllPartners, setShowAllPartners] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

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

  // Calculer les statistiques sur les projets visibles (comme dans ProjetsContent)
  const computedTotalProjects = visibleProjects.length
  const computedActiveProjects = visibleProjects.filter(p => p.status === 'active').length
  const computedCompletedProjects = visibleProjects.filter(p => p.status === 'completed').length
  const computedPlanningProjects = visibleProjects.filter(p => p.status === 'planning').length

  const summaryStats = projectStats ?? {
    totalProjects: computedTotalProjects,
    activeProjects: computedActiveProjects,
    completedProjects: computedCompletedProjects,
    planningProjects: computedPlanningProjects
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
    
    // 🗣️ Sensibilisation / Animation - Personne qui parle
    if (thematicLower.includes('sensibilisation') || thematicLower.includes('sensibiliser') || thematicLower.includes('éducation') || thematicLower.includes('animation')) {
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
    <div className="space-y-6">
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

          {/* Résumé moderne sans cadre */}
          {!loading && (
            <div className="animate-fade-in pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <button 
                  onClick={() => setSelectedStatus('all')}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    selectedStatus === 'all'
                      ? 'bg-blue-500/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`text-2xl font-bold gradient-text ${
                    selectedStatus === 'all' 
                      ? 'text-blue-400' 
                      : theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>{summaryStats.totalProjects}</div>
                  <div className={`text-sm font-medium ${
                    selectedStatus === 'all'
                      ? 'text-blue-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>Total</div>
                </button>
                <button 
                  onClick={() => setSelectedStatus('active')}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    selectedStatus === 'active'
                      ? 'bg-emerald-500/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`text-2xl font-bold gradient-text ${
                    selectedStatus === 'active' 
                      ? 'text-emerald-400' 
                      : 'text-emerald-400'
                  }`}>{summaryStats.activeProjects}</div>
                  <div className={`text-sm font-medium ${
                    selectedStatus === 'active'
                      ? 'text-emerald-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>En cours</div>
                </button>
                <button 
                  onClick={() => setSelectedStatus('completed')}
                  className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    selectedStatus === 'completed'
                      ? 'bg-blue-500/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className={`text-2xl font-bold gradient-text ${
                    selectedStatus === 'completed' 
                      ? 'text-blue-400' 
                      : 'text-blue-400'
                  }`}>{summaryStats.completedProjects}</div>
                  <div className={`text-sm font-medium ${
                    selectedStatus === 'completed'
                      ? 'text-blue-400'
                      : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>Terminés</div>
                </button>
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
              {sortedPoleStats.map(([pole, count]) => {
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
                             backgroundColor: pieColors[sortedPoleStats.findIndex(([p]) => p === pole) % pieColors.length],
                             backgroundImage: `linear-gradient(90deg, ${pieColors[sortedPoleStats.findIndex(([p]) => p === pole) % pieColors.length]} 0%, ${pieColors[sortedPoleStats.findIndex(([p]) => p === pole) % pieColors.length]}dd 100%)`
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
                 {sortedPoleStats.map(([pole]) => (
                  <div key={pole} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pieColors[sortedPoleStats.findIndex(([p]) => p === pole) % pieColors.length] }}
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
            
            {/* Tags employés sélectionnés */}
            {selectedEmployees.length > 0 && (
              <div className="mb-4 animate-fade-in">
                <div className="flex flex-wrap gap-2">
                  {selectedEmployees.map((employee, index) => (
                    <div 
                      key={`tag-${employee}-${index}`}
                      className={`flex items-center px-3 py-1.5 rounded-full text-sm border transition-all duration-300 hover:scale-105 active:scale-95 ${
                        theme === 'light'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-blue-900/30 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      <span className="font-medium">{employee}</span>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('🗑️ Suppression tag:', employee, 'Index:', index, 'Liste avant:', selectedEmployees)
                          setIsRemoving(true)
                          const newList = selectedEmployees.filter((_, i) => i !== index)
                          console.log('📋 Liste après:', newList)
                          setSelectedEmployees(newList)
                          setTimeout(() => setIsRemoving(false), 300)
                        }}
                        className={`ml-1 px-2 py-1 text-lg leading-none transition-colors rounded hover:bg-red-100 ${
                          theme === 'light' ? 'text-blue-500 hover:text-red-600' : 'text-blue-400 hover:text-red-400'
                        }`}
                        type="button"
                        aria-label={`Retirer ${employee}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
            </div>
              </div>
            )}

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
                        {sortedPoleStatsSelected.map(([pole, count]) => {
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={pole} className="flex items-center gap-2">
                              <span className="w-24 text-xs text-white truncate">{pole}</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: pieColors[sortedPoleStatsSelected.findIndex(([p]) => p === pole) % pieColors.length] }}></div>
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

            {/* Si aucune sélection, afficher le top 5 avec bouton "Voir plus" */}
            {!!!selectedEmployees[0] && (
              <>
              <div className="space-y-3">
                  {sortedEmployeeStats.slice(0, showAllEmployees ? sortedEmployeeStats.length : 5).map(([employee, count]) => (
                  <div 
                    key={employee} 
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm border ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-blue-50/80 via-blue-100/50 to-blue-50/80 hover:from-blue-100/90 hover:via-blue-200/60 hover:to-blue-100/90 border-blue-200/30 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-200/50'
                          : 'bg-gradient-to-r from-blue-900/20 via-blue-800/10 to-blue-900/20 hover:from-blue-900/30 hover:via-blue-800/20 hover:to-blue-900/30 border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20'
                      } hover:scale-[1.02] active:scale-[0.98]`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (isRemoving) {
                          console.log('⏸️ Action bloquée - suppression en cours')
                          return
                        }
                        console.log('➕ Clic sur employé:', employee, 'Liste actuelle:', selectedEmployees)
                        if (!selectedEmployees.includes(employee)) {
                          console.log('✅ Ajout de:', employee)
                          setSelectedEmployees([employee])
                        } else {
                          console.log('⚠️ Déjà sélectionné:', employee)
                        }
                      }}
                  >
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shadow-md">
                        {employee.charAt(0)}
                      </div>
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>{employee}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{count} projet{count > 1 ? 's' : ''}</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
                
                {/* Bouton "Voir plus" si plus de 5 employés */}
                {sortedEmployeeStats.length > 5 && (
                  <button
                    onClick={() => setShowAllEmployees(!showAllEmployees)}
                    className={`mt-4 w-full py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                    }`}
                  >
                    {showAllEmployees ? 'Voir moins' : `+ Voir plus (${sortedEmployeeStats.length - 5} autres)`}
                  </button>
                )}
              </>
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
            
            {/* Tags thématiques sélectionnées */}
            {selectedThematics.length > 0 && (
              <div className="mb-4 animate-fade-in">
                <div className="flex flex-wrap gap-2">
                  {selectedThematics.map((thematic, index) => (
                    <div 
                      key={`tag-thematic-${thematic}-${index}`}
                      className={`flex items-center px-3 py-1.5 rounded-full text-sm border transition-all duration-300 hover:scale-105 active:scale-95 ${
                        theme === 'light'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-blue-900/30 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      <span className="font-medium">{thematic}</span>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsRemoving(true)
                          const newList = selectedThematics.filter((_, i) => i !== index)
                          setSelectedThematics(newList)
                          setTimeout(() => setIsRemoving(false), 300)
                        }}
                        className={`ml-1 px-2 py-1 text-lg leading-none transition-colors rounded hover:bg-red-100 ${
                          theme === 'light' ? 'text-blue-500 hover:text-red-600' : 'text-blue-400 hover:text-red-400'
                        }`}
                        type="button"
                        aria-label={`Retirer ${thematic}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
            </div>
              </div>
            )}

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
                        {sortedPoleStatsSelected.map(([pole, count]) => {
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={pole} className="flex items-center gap-2">
                              <span className="w-24 text-xs text-white truncate">{pole}</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: pieColors[sortedPoleStatsSelected.findIndex(([p]) => p === pole) % pieColors.length] }}></div>
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

            {/* Si aucune sélection, afficher le top 5 avec bouton "Voir plus" */}
            {!!!selectedThematics[0] && (
              <>
              <div className="space-y-3">
                  {sortedThematicStats.slice(0, showAllThematics ? sortedThematicStats.length : 5).map(([thematic, count]) => (
                  <div 
                    key={thematic} 
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm border ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-blue-50/80 via-blue-100/50 to-blue-50/80 hover:from-blue-100/90 hover:via-blue-200/60 hover:to-blue-100/90 border-blue-200/30 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-200/50'
                          : 'bg-gradient-to-r from-blue-900/20 via-blue-800/10 to-blue-900/20 hover:from-blue-900/30 hover:via-blue-800/20 hover:to-blue-900/30 border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20'
                      } hover:scale-[1.02] active:scale-[0.98]`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (isRemoving) return
                        if (!selectedThematics.includes(thematic)) {
                          setSelectedThematics([thematic])
                        }
                      }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 flex items-center justify-center text-lg">
                        {getThematicIcon(thematic)}
                      </div>
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>{thematic}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{count} projet{count > 1 ? 's' : ''}</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
                
                {/* Bouton "Voir plus" si plus de 5 thématiques */}
                {sortedThematicStats.length > 5 && (
                  <button
                    onClick={() => setShowAllThematics(!showAllThematics)}
                    className={`mt-4 w-full py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                    }`}
                  >
                    {showAllThematics ? 'Voir moins' : `+ Voir plus (${sortedThematicStats.length - 5} autres)`}
                  </button>
                )}
              </>
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
            <>
            <div className="space-y-3">
                {sortedPartnerStats.slice(0, showAllPartners ? sortedPartnerStats.length : 5).map(([partner, count]) => (
                  <div 
                    key={partner} 
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 backdrop-blur-sm border ${
                      theme === 'light'
                        ? 'bg-gradient-to-r from-blue-50/80 via-blue-100/50 to-blue-50/80 border-blue-200/30'
                        : 'bg-gradient-to-r from-blue-900/20 via-blue-800/10 to-blue-900/20 border-blue-500/20'
                    }`}
                  >
                  <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shadow-md">
                      {partner.charAt(0)}
                    </div>
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>{partner}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{count} projet{count > 1 ? 's' : ''}</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
              
              {/* Bouton "Voir plus" si plus de 5 partenaires */}
              {sortedPartnerStats.length > 5 && (
                <button
                  onClick={() => setShowAllPartners(!showAllPartners)}
                  className={`mt-4 w-full py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                  }`}
                >
                  {showAllPartners ? 'Voir moins' : `+ Voir plus (${sortedPartnerStats.length - 5} autres)`}
                </button>
              )}
            </>
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
