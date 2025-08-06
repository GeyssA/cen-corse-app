'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getActivities, 
  createActivity, 
  updateActivityWithPollOptions, 
  deleteActivity,
  voteForOption,
  removeVote,
  // hasUserVotedForActivity,
  // getActivityVoteStats,
  getUserVotesForActivityRobust
} from '@/lib/activities'
import { supabase } from '@/lib/supabase'

interface Activity {
  id?: string
  creator_name: string
  name: string
  location: string
  activity_date: string
  activity_time?: string
  description: string
  created_at?: string
  pollOptions?: any[]
  votes?: any[]
  uniqueParticipants?: number
  votersByOption?: Record<string, string[]>
}

function CommunauteContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'liste' | 'calendrier'>('liste')
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'past'>('upcoming')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [editPollOptions, setEditPollOptions] = useState<string[]>([])
  const [newEditPollOption, setNewEditPollOption] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const [syncStatus, setSyncStatus] = useState<Record<string, 'synced' | 'pending' | 'error'>>({})
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, { activityUpdates: any }>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const [newActivity, setNewActivity] = useState({
    creator_name: '',
    name: '',
    location: '',
    activity_date: '',
    activity_time: '',
    description: ''
  })

  const [pollOptions, setPollOptions] = useState<string[]>([])
  const [newPollOption, setNewPollOption] = useState('')
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({})
  const [voterNames, setVoterNames] = useState<Record<string, string[]>>({})

  // État pour éviter l'erreur d'hydratation
  // const [isClient, setIsClient] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Auto-fermer les notifications après 5 secondes
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Charger les activités depuis Supabase
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true)
        const activitiesData = await getActivities()
        setActivities(activitiesData)
        
        // Précharger les noms des votants pour toutes les options
        await preloadVoterNames(activitiesData)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des activités:', error)
      } finally {
        setLoading(false)
      }
    }

    // setIsClient(true)
    setIsHydrated(true)
    loadActivities()
  }, [])

  // Précharger les noms des votants pour toutes les options
  const preloadVoterNames = async (activities: Activity[]) => {
    try {
      // Collecter tous les IDs d'options de sondage
      const allOptionIds = activities
        .flatMap(activity => activity.pollOptions || [])
        .map(option => option.id)
        .filter(id => id)

      if (allOptionIds.length === 0) return

      console.log(`🔄 Préchargement des noms pour ${allOptionIds.length} options de sondage...`)

      // Récupérer tous les votes
      const { data: allVotes, error } = await supabase
        .from('votes')
        .select('poll_option_id, voter_id')
        .in('poll_option_id', allOptionIds)

      if (error) {
        console.error('Erreur lors du préchargement des votants:', error)
        return
      }

      if (!allVotes) return

      // Collecter tous les IDs de votants uniques
      const allVoterIds = [...new Set(allVotes.map(vote => vote.voter_id))]
      console.log(`🔄 Récupération des noms pour ${allVoterIds.length} votants uniques...`)

      // Récupérer les noms via l'API route
      const response = await fetch('/api/get-voter-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voterIds: allVoterIds })
      })

      if (!response.ok) {
        console.error('Erreur lors de la récupération des noms via API')
        return
      }

      const voterNames = await response.json()
      const idToName = new Map(allVoterIds.map((id, index) => [id, voterNames[index]]))

      // Organiser les noms par option
      const voterNamesByOption: Record<string, string[]> = {}
      
      allVotes.forEach(vote => {
        const optionId = vote.poll_option_id
        const voterName = idToName.get(vote.voter_id)
        
        if (optionId && voterName) {
          if (!voterNamesByOption[optionId]) {
            voterNamesByOption[optionId] = []
          }
          voterNamesByOption[optionId].push(voterName)
        }
      })

      console.log(`✅ Préchargé les noms pour ${Object.keys(voterNamesByOption).length} options`)
      setVoterNames(voterNamesByOption)

    } catch (error) {
      console.error('Erreur lors du préchargement des noms des votants:', error)
    }
  }

  // Détecter le paramètre create=true et ouvrir automatiquement le modal
  useEffect(() => {
    const createParam = searchParams.get('create')
    if (createParam === 'true') {
      setShowAddModal(true)
    }
  }, [searchParams])

  // Initialiser les options de sondage quand le modal d'édition s'ouvre
  useEffect(() => {
    if (editActivity) {
      setEditPollOptions(editActivity.pollOptions?.map((option: any) => option.option_text) || [])
      setNewEditPollOption('')
    }
  }, [editActivity])

  // Récupérer tous les votes de l'utilisateur pour une activité
  const getUserVotesForActivity = async (activityId: string) => {
    if (!profile?.id) return []
    
    try {
      const votes = await getUserVotesForActivityRobust(activityId, profile.id)
      setUserVotes(prev => ({ ...prev, [activityId]: votes }))
      return votes
    } catch (error) {
      console.error('Erreur lors de la récupération des votes:', error)
      return []
    }
  }

  // Ajouter une option de sondage
  const addPollOption = () => {
    if (newPollOption.trim() && !pollOptions.includes(newPollOption.trim())) {
      setPollOptions([...pollOptions, newPollOption.trim()])
      setNewPollOption('')
    }
  }

  // Supprimer une option de sondage
  const removePollOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index))
  }

  // Voter ou retirer le vote pour une option
  const toggleVote = async (pollOptionId: string, activityId: string) => {
    if (!profile?.id) return

    try {
      const currentVotes = userVotes[activityId] || []
      const hasVoted = currentVotes.includes(pollOptionId)

      let success = false
      if (hasVoted) {
        // Retirer le vote
        success = await removeVote(pollOptionId, profile.id)
      } else {
        // Ajouter le vote
        success = await voteForOption(pollOptionId, profile.id)
      }

      if (success) {
        // Recharger les votes
        await getUserVotesForActivity(activityId)
        // Recharger les activités pour mettre à jour les statistiques
        const activitiesData = await getActivities()
        setActivities(activitiesData)
        
        // Rafraîchir les noms des votants pour cette option
        const updatedNames = await getVoterNames(pollOptionId)
        setVoterNames(prev => ({ ...prev, [pollOptionId]: updatedNames }))
        
        console.log(`✅ Vote mis à jour pour l'option ${pollOptionId}`)
      }
    } catch (error) {
      console.error('Erreur lors du vote:', error)
    }
  }

  // État pour afficher les votants
  const [showVoters, setShowVoters] = useState<Record<string, boolean>>({})

  // Basculer l'affichage des votants
  const toggleVoters = async (optionId: string) => {
    const newShowVoters = !showVoters[optionId]
    setShowVoters(prev => ({ ...prev, [optionId]: newShowVoters }))
    
    // Si on affiche les votants et qu'on n'a pas encore les noms, les récupérer
    if (newShowVoters && !voterNames[optionId]) {
      console.log(`🔄 Récupération des noms pour l'option ${optionId}...`)
      const names = await getVoterNames(optionId)
      setVoterNames(prev => ({ ...prev, [optionId]: names }))
    } else if (newShowVoters && voterNames[optionId]) {
      console.log(`✅ Utilisation des noms préchargés pour l'option ${optionId}`)
    }
  }

  // Récupérer les noms des votants pour une option
  const getVoterNames = async (optionId: string): Promise<string[]> => {
    try {
      // Récupérer les votes
      const { data: votes, error } = await supabase
        .from('votes')
        .select('voter_id')
        .eq('poll_option_id', optionId)

      if (error) {
        console.error('Erreur lors de la récupération des votants:', error)
        return []
      }

      if (!votes || votes.length === 0) return []

      const voterIds = votes.map(vote => vote.voter_id)
      console.log(`🔄 Récupération des noms pour ${voterIds.length} votants...`)

      // Récupérer les noms via une API route pour contourner les RLS
      const response = await fetch('/api/get-voter-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voterIds })
      })

      if (!response.ok) {
        console.error('Erreur lors de la récupération des noms via API')
        // Fallback: utiliser les IDs comme noms
        return voterIds.map(id => `Utilisateur ${id.slice(0, 8)}`)
      }

      const voterNames = await response.json()
      console.log(`📊 Récupéré ${voterNames.length} noms de votants pour l'option ${optionId}`)
      return voterNames

    } catch (error) {
      console.error('Erreur lors de la récupération des noms des votants:', error)
      return []
    }
  }

  // Ajouter une option de sondage pour l'édition
  const addEditPollOption = () => {
    if (newEditPollOption.trim() && !editPollOptions.includes(newEditPollOption.trim())) {
      setEditPollOptions([...editPollOptions, newEditPollOption.trim()])
      setNewEditPollOption('')
    }
  }

  // Supprimer une option de sondage pour l'édition
  const removeEditPollOption = (index: number) => {
    setEditPollOptions(editPollOptions.filter((_, i) => i !== index))
  }


  // Obtenir les initiales de l'utilisateur
  // const getUserInitials = () => {
  //   if (!profile?.full_name) return profile?.email?.charAt(0).toUpperCase() || 'U'
  //   return profile.full_name.split(' ').map(name => name.charAt(0)).join('').toUpperCase()
  // }

  const handleAddActivity = async () => {
    console.log('🔍 handleAddActivity - Début')
    console.log('👤 Profile:', profile)
    console.log('📝 NewActivity:', newActivity)
    
    if (!profile) {
      console.error('❌ Aucun profil utilisateur trouvé')
      alert('Vous devez être connecté pour créer une activité')
      return
    }

    // Vérifier les permissions (seuls admin et super_admin peuvent créer des activités)
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      console.error('❌ Permissions insuffisantes. Rôle requis: admin ou super_admin, Rôle actuel:', profile.role)
      alert('Vous devez être membre du CEN Corse pour créer des activités')
      return
    }

    if (!newActivity.creator_name || !newActivity.name || !newActivity.location || !newActivity.activity_date) {
      console.error('❌ Données manquantes:', {
        creator_name: !!newActivity.creator_name,
        name: !!newActivity.name,
        location: !!newActivity.location,
        activity_date: !!newActivity.activity_date
      })
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      console.log('🚀 Tentative de création d\'activité...')
      
      const activityData = {
        name: newActivity.name,
        creator_name: newActivity.creator_name,
        location: newActivity.location,
        activity_date: newActivity.activity_date,
        activity_time: newActivity.activity_time || undefined,
        description: newActivity.description,
        created_by: profile.id
      }

      console.log('📊 ActivityData:', activityData)
      console.log('🗳️ PollOptions:', pollOptions)

      const createdActivity = await createActivity(activityData, pollOptions)

      if (createdActivity) {
        console.log('✅ Activité créée avec succès:', createdActivity)
        
        // Message de confirmation
        setNotification({ type: 'success', message: `🎉 Activité "${createdActivity.name}" créée avec succès !` })
        
        // Recharger les activités depuis Supabase
        const activitiesData = await getActivities()
        setActivities(activitiesData)
        
        // Fermer le modal et réinitialiser le formulaire
        setShowAddModal(false)
        setNewActivity({
          creator_name: '',
          name: '',
          location: '',
          activity_date: '',
          activity_time: '',
          description: ''
        })
        setPollOptions([])
        setNewPollOption('')
      } else {
        console.error('❌ Échec de la création de l\'activité')
        setNotification({ type: 'error', message: '❌ Erreur lors de la création de l\'activité' })
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'activité:', error)
      setNotification({ type: 'error', message: '❌ Erreur lors de la création de l\'activité' })
    }
  }





  const today = new Date().toISOString().split('T')[0]
  
  const upcomingActivities = activities.filter(activity => activity.activity_date >= today)
  const pastActivities = activities.filter(activity => activity.activity_date < today)
  
  const filteredUpcomingActivities = upcomingActivities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredPastActivities = pastActivities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
  )



  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
      // Charger les votes de l'utilisateur quand l'activité est développée
      getUserVotesForActivity(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  const handleSaveEdit = async () => {
    if (editActivity) {
      try {
        console.log('🔄 handleSaveEdit - Début')
        console.log('📝 EditActivity:', editActivity)
        
        const activityUpdates = {
          name: editActivity.name,
          creator_name: editActivity.creator_name,
          location: editActivity.location,
          activity_date: editActivity.activity_date,
          activity_time: editActivity.activity_time || undefined,
          description: editActivity.description
        }

        // Mise à jour locale immédiate pour l'interface
        setActivities(prev => prev.map(activity => 
          activity.id === editActivity.id 
            ? { ...activity, ...activityUpdates }
            : activity
        ))
        
        // Marquer comme en attente de synchronisation
        setSyncStatus(prev => ({ ...prev, [editActivity.id!]: 'pending' }))
        setPendingUpdates(prev => ({ ...prev, [editActivity.id!]: { activityUpdates } }))
        
        // Fermer le modal d'édition
        setEditActivity(null)
        
        console.log('✅ Activité mise à jour localement')

        // Tentative de mise à jour sur Supabase en arrière-plan
        console.log('🔄 Tentative de mise à jour sur Supabase...')
        try {
          const updatedActivity = await updateActivityWithPollOptions(editActivity.id!, activityUpdates, editPollOptions)
          if (updatedActivity) {
            console.log('✅ Activité mise à jour sur Supabase')
            // Marquer comme synchronisé
            setSyncStatus(prev => ({ ...prev, [editActivity.id!]: 'synced' }))
            setPendingUpdates(prev => {
              const newPending = { ...prev }
              delete newPending[editActivity.id!]
              return newPending
            })
            // Recharger les activités depuis Supabase
            const activitiesData = await getActivities()
            setActivities(activitiesData)
          } else {
            console.warn('⚠️ Échec de la mise à jour sur Supabase, mais l\'interface a été mise à jour')
            setSyncStatus(prev => ({ ...prev, [editActivity.id!]: 'error' }))
          }
        } catch (supabaseError) {
          console.error('❌ Erreur Supabase:', supabaseError)
          console.warn('⚠️ L\'activité a été mise à jour localement mais pas sur Supabase')
          setSyncStatus(prev => ({ ...prev, [editActivity.id!]: 'error' }))
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la modification de l\'activité:', error)
        alert('Erreur lors de la modification de l\'activité')
      }
    }
  }

  // Fonction pour générer les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1)
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    
    // Ajouter les jours du mois précédent pour remplir la première semaine
    const firstDayOfWeek = firstDay.getDay()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: prevDate.toDateString() === new Date().toDateString()
      })
    }
    
    // Ajouter les jours du mois actuel
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day)
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: currentDate.toDateString() === new Date().toDateString()
      })
    }
    
    // Ajouter les jours du mois suivant pour remplir la dernière semaine
    const lastDayOfWeek = lastDay.getDay()
    for (let day = 1; day < 7 - lastDayOfWeek; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: nextDate.toDateString() === new Date().toDateString()
      })
    }
    
    return days
  }

  const getActivitiesForDate = (date: Date) => {
    // Utiliser le fuseau horaire local pour éviter les décalages
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    return activities.filter(activity => activity.activity_date === dateString)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  // Système de retry automatique pour les mises à jour en attente
  useEffect(() => {
    const retryPendingUpdates = async () => {
      const pendingIds = Object.keys(pendingUpdates)
      if (pendingIds.length === 0) return

      console.log('🔄 Tentative de synchronisation des mises à jour en attente...')
      
      for (const activityId of pendingIds) {
        const update = pendingUpdates[activityId]
        if (!update) continue

        try {
          console.log(`🔄 Synchronisation de l'activité ${activityId}...`)
          const updatedActivity = await updateActivityWithPollOptions(activityId, update.activityUpdates, [])
          
          if (updatedActivity) {
            console.log(`✅ Activité ${activityId} synchronisée avec succès`)
            setSyncStatus(prev => ({ ...prev, [activityId]: 'synced' }))
            setPendingUpdates(prev => {
              const newPending = { ...prev }
              delete newPending[activityId]
              return newPending
            })
          } else {
            console.warn(`⚠️ Échec de synchronisation pour l'activité ${activityId}`)
            setSyncStatus(prev => ({ ...prev, [activityId]: 'error' }))
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la synchronisation de l'activité ${activityId}:`, error)
          setSyncStatus(prev => ({ ...prev, [activityId]: 'error' }))
        }
      }

      // Recharger les activités si des synchronisations ont réussi
      if (Object.keys(pendingUpdates).length === 0) {
        const activitiesData = await getActivities()
        setActivities(activitiesData)
      }
    }

    // Retry toutes les 10 secondes si il y a des mises à jour en attente
    const interval = setInterval(retryPendingUpdates, 10000)
    
    return () => clearInterval(interval)
  }, [pendingUpdates])

  // Fonction pour forcer la synchronisation manuellement
  const forceSync = async () => {
    const pendingIds = Object.keys(pendingUpdates)
    if (pendingIds.length === 0) {
      alert('Aucune mise à jour en attente')
      return
    }

    console.log('🔄 Synchronisation manuelle...')
    
    for (const activityId of pendingIds) {
      const update = pendingUpdates[activityId]
      if (!update) continue

      setSyncStatus(prev => ({ ...prev, [activityId]: 'pending' }))
      
      try {
                  const updatedActivity = await updateActivityWithPollOptions(activityId, update.activityUpdates, [])
        
        if (updatedActivity) {
          console.log(`✅ Activité ${activityId} synchronisée`)
          setSyncStatus(prev => ({ ...prev, [activityId]: 'synced' }))
          setPendingUpdates(prev => {
            const newPending = { ...prev }
            delete newPending[activityId]
            return newPending
          })
        } else {
          setSyncStatus(prev => ({ ...prev, [activityId]: 'error' }))
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la synchronisation de ${activityId}:`, error)
        setSyncStatus(prev => ({ ...prev, [activityId]: 'error' }))
      }
    }

    // Recharger les activités
    const activitiesData = await getActivities()
    setActivities(activitiesData)
  }



  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#cce7f5' }}>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      {/* Fond décoratif amélioré avec animations subtiles */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Cercles flous avec pulsation douce */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-white/30 rounded-full blur-2xl" style={{ 
          animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl" style={{ 
          animation: 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s'
        }}></div>
        
        {/* Halos doux avec rotation lente */}
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl" style={{ 
          animation: 'spin 20s linear infinite'
        }}></div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-purple-200/25 rounded-full blur-2xl" style={{ 
          animation: 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite 2s'
        }}></div>
        
        {/* Motifs hexagones floutés */}
        <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-2xl blur-xl"
          style={{ 
            clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)',
            animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}>
        </div>
        <div className="absolute top-1/3 right-10 w-20 h-20 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-2xl blur-lg"
          style={{ 
            clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)',
            animation: 'pulse 7s cubic-bezier(0.4, 0, 0.6, 1) infinite 1.5s'
          }}>
        </div>
        
        {/* Courbes fines avec mouvement */}
        <div className="absolute top-0 right-1/4 w-64 h-12 bg-gradient-to-r from-blue-300/20 to-transparent rounded-full blur-lg rotate-12" style={{ 
          animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}></div>
        <div className="absolute bottom-1/4 left-0 w-48 h-8 bg-gradient-to-l from-emerald-300/15 to-transparent rounded-full blur-md -rotate-6" style={{ 
          animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite 3s'
        }}></div>
        
        {/* Particules flottantes subtiles */}
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/40 rounded-full blur-sm" style={{ 
          animation: 'bounce 3s infinite 0.5s'
        }}></div>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-300/50 rounded-full blur-sm" style={{ 
          animation: 'bounce 4s infinite 1s'
        }}></div>
        <div className="absolute bottom-1/3 right-1/2 w-1.5 h-1.5 bg-emerald-300/40 rounded-full blur-sm" style={{ 
          animation: 'bounce 5s infinite 2s'
        }}></div>
      </div>
      {/* Header moderne */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-slate-600 hover:text-slate-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-slate-800 font-heading">Communauté</h1>
          </div>
          <div className="flex items-center space-x-2">

            
            {/* Bouton de synchronisation */}
            {Object.keys(pendingUpdates).length > 0 && (
              <button
                onClick={forceSync}
                className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg active:shadow-xl active:scale-95 transition-all duration-150"
                title={`${Object.keys(pendingUpdates).length} mise(s) à jour en attente`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            

            
            {isHydrated && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg active:shadow-xl active:scale-95 transition-all duration-150"
              title="Ajouter une activité"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal avec padding pour la barre fixe */}
      <div className="pt-24 pb-8">
        <div className="max-w-md mx-auto px-6">
          {/* Onglets principaux */}
          <div className="flex space-x-1 mb-6 bg-white rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('liste')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                activeTab === 'liste'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 active:text-slate-800 active:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Liste
            </button>
            <button
              onClick={() => setActiveTab('calendrier')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                activeTab === 'calendrier'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-slate-600 active:text-slate-800 active:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendrier
            </button>
          </div>

          {activeTab === 'liste' && (
            <div className="space-y-6">
              {/* Sous-onglets */}
              <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-lg">
                <button
                  onClick={() => setActiveSubTab('upcoming')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                    activeSubTab === 'upcoming'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm'
                      : 'text-slate-600 active:text-slate-800 active:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  À venir ({upcomingActivities.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('past')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                    activeSubTab === 'past'
                      ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-md'
                      : 'text-slate-600 active:text-slate-800 active:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Passées ({pastActivities.length})
                </button>
              </div>

              {/* Tri */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  {activeSubTab === 'upcoming' ? 'Activités à venir' : 'Activités passées'}
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher une activité..."
                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 w-full max-w-md"
                  />
                </div>
              </div>

              {/* Liste des activités */}
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center py-8 text-slate-600">Chargement des activités...</p>
                ) : (
                  (activeSubTab === 'upcoming' ? filteredUpcomingActivities : filteredPastActivities)
                    .filter(activity => activity.id) // Filtrer les activités sans ID
                    .map((activity) => (
                  <div 
                    key={activity.id!} 
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                      animation: `fadeInUp 0.5s ease-out ${activities.indexOf(activity) * 50}ms forwards`
                    }}
                  >
                    {/* En-tête de l'activité - Version moderne */}
                    <div className="p-6 border-b border-slate-100/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Titre et localisation */}
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">
                              {activity.name}
                            </h3>
                            {/* Localisation avec icône moderne */}
                            {activity.location && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500 mb-2">
                                <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium">{activity.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Informations clés sur plusieurs lignes */}
                          <div className="space-y-2 mb-2">
                            {/* Créateur */}
                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                              <span className="font-medium">Créé par :</span>
                                  <span>{activity.creator_name}</span>
                            </div>
                            
                            {/* Date */}
                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                              <span className="font-medium">Date :</span>
                                  <span>{formatDate(activity.activity_date)}</span>
                            </div>
                            
                            {/* Heure */}
                                {activity.activity_time && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                <span className="font-medium">Heure :</span>
                                    <span>{formatTime(activity.activity_time)}</span>
                              </div>
                            )}
                            
                            {/* Description */}
                            <div className="text-xs text-slate-500">
                              <div className="flex items-start space-x-1 mb-0.5">
                                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium">Description :</span>
                              </div>
                              <div className="ml-4 text-slate-600 leading-relaxed">
                                {activity.description}
                              </div>
                            </div>
                              </div>
                            </div>
                            
                        {/* Bouton d'expansion et indicateur de synchronisation */}
                        <div className="flex items-center space-x-2 ml-4">
                            {/* Indicateur de synchronisation */}
                            {activity.id && syncStatus[activity.id] && (
                              <div className="flex-shrink-0">
                                {syncStatus[activity.id] === 'pending' && (
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                )}
                                {syncStatus[activity.id] === 'synced' && (
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                )}
                                {syncStatus[activity.id] === 'error' && (
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                )}
                              </div>
                            )}
                          
                          <button
                            onClick={() => toggleActivity(activity.id!)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 rounded-xl active:scale-95"
                            title={expandedActivities.has(activity.id!) ? "Réduire" : "Développer"}
                          >
                            <svg className={`w-5 h-5 transition-transform duration-200 ${expandedActivities.has(activity.id!) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contenu détaillé (développable) - Version moderne */}
                    {expandedActivities.has(activity.id!) && (
                      <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white/50 space-y-4">

                                                {/* Section Sondage */}
                        {activity.pollOptions && activity.pollOptions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                              <span className="mr-2">📊</span>
                              Sondage
                              {activity.uniqueParticipants && activity.uniqueParticipants > 0 && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {activity.uniqueParticipants} participant{activity.uniqueParticipants > 1 ? 's' : ''}
                                </span>
                              )}
                            </h4>
                                                        <div className="space-y-2">
                              {activity.pollOptions.map((option: any) => {
                                // Vérifier que option est un objet avec option_text
                                if (typeof option === 'object' && option !== null && 'option_text' in option) {
                                  return (
                                <div key={option.id} className="p-3 bg-white rounded-lg border border-slate-200">
                                  <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                      <div className="text-sm font-medium text-slate-700">{option.option_text}</div>
                                      {option.votes && option.votes.length > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                          {option.votes.length} vote{option.votes.length > 1 ? 's' : ''}
                                </div>
                                      )}
                              </div>
                                    <div className="flex items-center space-x-2">
                                      {/* Bouton pour voir les votants */}
                                      {option.votes && option.votes.length > 0 && (
                                    <button
                                          onClick={() => toggleVoters(option.id)}
                                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                          title="Voir les votants"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                        </button>
                                      )}
                                      {/* Bouton de vote */}
                                      <button
                                        onClick={() => toggleVote(option.id, activity.id!)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                          userVotes[activity.id!]?.includes(option.id)
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                      >
                                        {userVotes[activity.id!]?.includes(option.id) ? 'Retirer' : 'Voter'}
                                      </button>
                                        </div>
                                  </div>
                                  
                                  {/* Liste des votants */}
                                  {showVoters[option.id] && option.votes && option.votes.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                      <div className="text-xs text-slate-500 mb-2">Votants :</div>
                                      <div className="space-y-1">
                                        {voterNames[option.id] ? (
                                          voterNames[option.id].map((name, index) => (
                                            <div key={index} className="text-xs text-slate-600 flex items-center">
                                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                              <span>{name}</span>
                                        </div>
                                          ))
                                        ) : (
                                          <div className="text-xs text-slate-400 italic">Chargement...</div>
                                        )}
                                      </div>
                                        </div>
                                      )}
                                  </div>
                                )
                                } else {
                                  // Si option n'est pas un objet valide, afficher un message d'erreur
                                  console.error('Option invalide dans la liste principale:', option)
                                  return null
                                }
                              })}
                            </div>
                          </div>
                        )}

                        {/* Actions pour les administrateurs */}
                        {isHydrated && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
                          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200/50">
                            <button
                              onClick={() => setEditActivity(activity)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md active:scale-95"
                            >
                              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Modifier
                            </button>
                            <button
                              onClick={() => { setDeleteActivityId(activity.id!); setShowDeleteModal(true); }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md active:scale-95"
                            >
                              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'calendrier' && (
            <div className="space-y-6">
              {/* Navigation du calendrier */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setMonth(newDate.getMonth() - 1)
                    setCurrentDate(newDate)
                  }}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h2 className="text-lg font-semibold text-slate-800">
                  {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>
                
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setMonth(newDate.getMonth() + 1)
                    setCurrentDate(newDate)
                  }}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Grille du calendrier */}
              <div className="modern-card p-4">
                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Jours du mois */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((day, index) => {
                    const dayActivities = getActivitiesForDate(day.date)
                    const isToday = day.date.toDateString() === new Date().toDateString()
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(day.date)
                          if (dayActivities.length > 0) {
                            setShowDayModal(true)
                          }
                        }}
                        className={`aspect-square p-1 text-xs transition-all duration-200 ${
                          day.isCurrentMonth
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-slate-400'
                        } ${
                          isToday ? 'bg-emerald-100 text-emerald-800 font-semibold' : ''
                        } ${
                          dayActivities.length > 0 ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-sm font-medium">{day.date.getDate()}</span>
                          {dayActivities.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {dayActivities.slice(0, 2).map((activity, index) => (
                                <div key={`${activity.id!}-${index}`} className="w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
                              ))}
                              {dayActivities.length > 2 && (
                                <div className="text-xs text-blue-600 font-medium">+{dayActivities.length - 2}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout d'activité moderne */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="modern-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Nouvelle activité</h2>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Créateur</label>
                  <input
                    type="text"
                    value={newActivity.creator_name}
                    onChange={(e) => setNewActivity({...newActivity, creator_name: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Nom du créateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'activité</label>
                  <input
                    type="text"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Nom de l'activité"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                  <input
                    type="text"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Lieu de l'activité"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newActivity.activity_date}
                      onChange={(e) => setNewActivity({...newActivity, activity_date: e.target.value})}
                      className="input-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                    <input
                      type="time"
                      value={newActivity.activity_time || ''}
                      onChange={(e) => setNewActivity({...newActivity, activity_time: e.target.value})}
                      className="input-modern w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                    className="input-modern w-full"
                    rows={3}
                    placeholder="Description de l'activité"
                  />
                </div>

                {/* Section Options de sondage */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Options de sondage</label>
                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">📊</span>
                        <span className="flex-1 text-sm text-slate-700">{option}</span>
                        <button
                          onClick={() => removePollOption(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                    </div>
                  ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newPollOption}
                        onChange={(e) => setNewPollOption(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addPollOption()}
                        className="input-modern flex-1"
                        placeholder="Ajouter une option..."
                      />
                      <button
                        onClick={addPollOption}
                        className="btn-secondary px-3"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddActivity}
                  className="btn-primary flex-1"
                >
                  Créer l'activité
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'affichage des activités du jour */}
      {showDayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="modern-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Activités du {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {getActivitiesForDate(selectedDate)
                  .filter(activity => activity.id) // Filtrer les activités sans ID
                  .map((activity) => (
                  <div key={activity.id!} className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {activity.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{activity.name}</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-emerald-500">👤</span>
                            <span className="text-slate-700 font-medium">Créé par {activity.creator_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-500">📍</span>
                            <span className="text-slate-700">{activity.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-500">🕐</span>
                            <span className="text-slate-700 font-medium">{formatTime(activity.activity_time || '')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-indigo-500">📝</span>
                        <span className="text-sm font-medium text-slate-700">Description</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{activity.description}</p>
                    </div>
                    
                    {activity.pollOptions && activity.pollOptions.length > 0 && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-emerald-500">🗳️</span>
                          <span className="text-sm font-medium text-slate-700">Options de vote</span>
                        </div>
                        <div className="space-y-2">
                          {activity.pollOptions.map((option, index) => {
                            // Vérifier que option est un objet avec option_text
                            if (typeof option === 'object' && option !== null && 'option_text' in option) {
                              const votes = activity.votes?.filter(vote => vote.poll_option_id === option.id)?.length || 0
                              return (
                              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-700">{option.option_text}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-slate-500">{votes} vote(s)</span>
                                  {votes > 0 && (
                                    <div className="flex space-x-1">
                                      {Array.from({ length: votes }).map((_, index) => (
                                        <span key={index} className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xs font-medium">
                                          {profile?.id?.charAt(0)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                            } else {
                              // Si option n'est pas un objet valide, afficher un message d'erreur
                              console.error('Option invalide:', option)
                              return null
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'activité */}
      {editActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="modern-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Modifier l'activité</h2>
                <button
                  onClick={() => setEditActivity(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Créateur</label>
                  <input
                    type="text"
                    value={editActivity.creator_name}
                    onChange={(e) => setEditActivity({...editActivity, creator_name: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Nom du créateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'activité</label>
                  <input
                    type="text"
                    value={editActivity.name}
                    onChange={(e) => setEditActivity({...editActivity, name: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Nom de l'activité"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                  <input
                    type="text"
                    value={editActivity.location}
                    onChange={(e) => setEditActivity({...editActivity, location: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Lieu de l'activité"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editActivity.activity_date}
                      onChange={(e) => setEditActivity({...editActivity, activity_date: e.target.value})}
                      className="input-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                    <input
                      type="time"
                      value={editActivity.activity_time || ''}
                      onChange={(e) => setEditActivity({...editActivity, activity_time: e.target.value})}
                      className="input-modern w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={editActivity.description}
                    onChange={(e) => setEditActivity({...editActivity, description: e.target.value})}
                    className="input-modern w-full"
                    rows={3}
                    placeholder="Description de l'activité"
                  />
                </div>

                {/* Section Options de sondage pour l'édition */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Options de sondage</label>
                  <div className="space-y-3">
                    {editPollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">📊</span>
                        <span className="flex-1 text-sm text-slate-700">{option}</span>
                        <button
                          onClick={() => removeEditPollOption(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                    </div>
                  ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newEditPollOption}
                        onChange={(e) => setNewEditPollOption(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addEditPollOption()}
                        className="input-modern flex-1"
                        placeholder="Ajouter une option..."
                      />
                      <button
                        onClick={addEditPollOption}
                        className="btn-secondary px-3"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditActivity(null)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary flex-1"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-sm shadow-2xl border border-blue-200/30 animate-fade-in p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Confirmer la suppression</h2>
            <p className="text-slate-700 mb-6">Voulez-vous vraiment supprimer cette activité ? Cette action est irréversible.</p>
              <div className="flex space-x-3">
                <button
                onClick={() => { setShowDeleteModal(false); setDeleteActivityId(null); }}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                onClick={async () => {
                  if (deleteActivityId !== null) {
                    console.log('🗑️ Début de la suppression de l\'activité:', deleteActivityId)
                    
                    // Retirer immédiatement l'activité de l'interface
                    setActivities(prev => prev.filter(a => a.id !== deleteActivityId))
                    setShowDeleteModal(false)
                    setDeleteActivityId(null)
                    
                    // Suppression en arrière-plan - utiliser la fonction importée
                    console.log('🗑️ Suppression en arrière-plan de l\'activité:', deleteActivityId)
                    
                    try {
                      const success = await deleteActivity(deleteActivityId)
                      console.log('📊 Résultat de la suppression:', success)
                      
                      if (success) {
                        console.log('✅ Activité supprimée avec succès de la base de données')
                        setNotification({ type: 'success', message: '✅ Activité supprimée avec succès !' })
                      } else {
                        console.error('❌ Échec de la suppression de l\'activité dans la base de données')
                        setNotification({ type: 'error', message: '❌ Erreur lors de la suppression de l\'activité' })
                        
                        // Recharger les activités pour remettre l'activité dans la liste
                        const activitiesData = await getActivities()
                        setActivities(activitiesData)
                      }
                    } catch (error) {
                      console.error('❌ Erreur lors de la suppression en arrière-plan:', error)
                      setNotification({ type: 'error', message: '❌ Erreur lors de la suppression de l\'activité' })
                      
                      // Recharger les activités pour remettre l'activité dans la liste
                      const activitiesData = await getActivities()
                      setActivities(activitiesData)
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

      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-4 rounded-xl shadow-2xl border-2 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white border-green-400' 
              : 'bg-red-500 text-white border-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-xl">
                {notification.type === 'success' ? '🎉' : '❌'}
              </span>
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-white/80 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Communaute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de la communauté...</p>
        </div>
      </div>
    }>
      <CommunauteContent />
    </Suspense>
  )
} 