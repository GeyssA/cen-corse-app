'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
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
  pollName?: string
  pollOptions?: any[]
  votes?: any[]
  uniqueParticipants?: number
  votersByOption?: Record<string, string[]>
}

function CommunauteContent() {
  const { profile } = useAuth();
  const { theme } = useTheme();
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
    description: '',
    pollName: ''
  })

  const [pollOptions, setPollOptions] = useState<string[]>([])
  const [newPollOption, setNewPollOption] = useState('')
  const [pollName, setPollName] = useState('')
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({})
  const [voterNames, setVoterNames] = useState<Record<string, string[]>>({})
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({})

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

  // Empêcher le scroll de la page quand le modal est ouvert
  useEffect(() => {
    if (editActivity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editActivity]);

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

  // Voter ou retirer le vote pour une option - Version optimisée
  const toggleVote = async (pollOptionId: string, activityId: string) => {
    if (!profile?.id) return

    // Éviter les clics multiples
    const voteKey = `${activityId}-${pollOptionId}`
    if (votingStates[voteKey]) return

    try {
      // Indiquer que le vote est en cours
      setVotingStates(prev => ({ ...prev, [voteKey]: true }))

      const currentVotes = userVotes[activityId] || []
      const hasVoted = currentVotes.includes(pollOptionId)

      // Mise à jour optimiste de l'interface
      const newUserVotes = { ...userVotes }
      if (hasVoted) {
        newUserVotes[activityId] = currentVotes.filter(id => id !== pollOptionId)
      } else {
        newUserVotes[activityId] = [...currentVotes, pollOptionId]
      }
      setUserVotes(newUserVotes)

      // Mise à jour optimiste des activités
      setActivities(prevActivities => 
        prevActivities.map(activity => {
          if (activity.id === activityId && activity.pollOptions) {
            return {
              ...activity,
              pollOptions: activity.pollOptions.map(option => {
                if (option.id === pollOptionId) {
                  const currentVotes = option.votes || []
                  if (hasVoted) {
                    // Retirer le vote
                    return {
                      ...option,
                      votes: currentVotes.filter((vote: any) => vote.voter_id !== profile.id)
                    }
                  } else {
                    // Ajouter le vote
                    return {
                      ...option,
                      votes: [...currentVotes, { voter_id: profile.id }]
                    }
                  }
                }
                return option
              })
            }
          }
          return activity
        })
      )

      // Mise à jour optimiste des noms de votants
      if (voterNames[pollOptionId]) {
        setVoterNames(prev => {
          const { [pollOptionId]: _, ...rest } = prev
          return rest
        })
      }

      // Appel API en arrière-plan
      let success = false
      if (hasVoted) {
        success = await removeVote(pollOptionId, profile.id)
      } else {
        success = await voteForOption(pollOptionId, profile.id)
      }

      if (success) {
        // Recharger les données en arrière-plan pour synchronisation
        getUserVotesForActivity(activityId)
        getVoterNames(pollOptionId).then(names => {
          setVoterNames(prev => ({ ...prev, [pollOptionId]: names }))
        })
        
        console.log(`✅ Vote mis à jour pour l'option ${pollOptionId}`)
      } else {
        // En cas d'échec, revenir à l'état précédent
        setUserVotes(prev => ({ ...prev, [activityId]: currentVotes }))
        setActivities(prevActivities => 
          prevActivities.map(activity => {
            if (activity.id === activityId) {
              return { ...activity }
            }
            return activity
          })
        )
        console.error('❌ Échec de la mise à jour du vote')
      }
    } catch (error) {
      console.error('Erreur lors du vote:', error)
      // En cas d'erreur, revenir à l'état précédent
      const currentVotes = userVotes[activityId] || []
      const hasVoted = currentVotes.includes(pollOptionId)
      setUserVotes(prev => ({ ...prev, [activityId]: hasVoted ? currentVotes.filter(id => id !== pollOptionId) : [...currentVotes, pollOptionId] }))
    } finally {
      // Toujours libérer l'état de vote
      setVotingStates(prev => ({ ...prev, [voteKey]: false }))
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
        poll_name: pollName || undefined,
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
      description: '',
      pollName: ''
    })
        setPollOptions([])
        setNewPollOption('')
        setPollName('')
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
          description: editActivity.description,
          poll_name: editActivity.pollName || undefined
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
    <div className={`min-h-screen relative overflow-hidden transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
    }`}>
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
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes communityGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6); }
        }
      `}</style>
      {/* Fond décoratif communautaire avec animations conviviales */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Cercles communautaires avec pulsation douce */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl" style={{ 
          animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" style={{ 
          animation: 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s'
        }}></div>
        
        {/* Halos communautaires avec rotation lente */}
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl" style={{ 
          animation: 'spin 20s linear infinite'
        }}></div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl" style={{ 
          animation: 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite 2s'
        }}></div>
        
        {/* Motifs hexagones communautaires */}
        <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-gradient-to-tr from-emerald-400/30 to-transparent rounded-2xl blur-xl"
          style={{ 
            clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)',
            animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}>
        </div>
        <div className="absolute top-1/3 right-10 w-20 h-20 bg-gradient-to-br from-blue-400/30 to-transparent rounded-2xl blur-lg"
          style={{ 
            clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)',
            animation: 'pulse 7s cubic-bezier(0.4, 0, 0.6, 1) infinite 1.5s'
          }}>
        </div>
        
        {/* Courbes communautaires avec mouvement */}
        <div className="absolute top-0 right-1/4 w-64 h-12 bg-gradient-to-r from-emerald-400/20 to-transparent rounded-full blur-lg rotate-12" style={{ 
          animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}></div>
        <div className="absolute bottom-1/4 left-0 w-48 h-8 bg-gradient-to-l from-blue-400/20 to-transparent rounded-full blur-md -rotate-6" style={{ 
          animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite 3s'
        }}></div>
        
        {/* Particules communautaires flottantes */}
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-emerald-400/60 rounded-full blur-sm" style={{ 
          animation: 'sparkle 3s infinite 0.5s'
        }}></div>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400/60 rounded-full blur-sm" style={{ 
          animation: 'sparkle 4s infinite 1s'
        }}></div>
        <div className="absolute bottom-1/3 right-1/2 w-1.5 h-1.5 bg-purple-400/60 rounded-full blur-sm" style={{ 
          animation: 'sparkle 5s infinite 2s'
        }}></div>
        
        {/* Éléments communautaires supplémentaires */}
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-orange-400/50 rounded-full blur-sm" style={{ 
          animation: 'sparkle 6s infinite 0.8s'
        }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-emerald-400/50 rounded-full blur-sm" style={{ 
          animation: 'sparkle 7s infinite 1.5s'
        }}></div>
      </div>
      {/* Header communautaire moderne */}
      <header className="fixed top-0 left-0 right-0 glass-effect border-b border-white/10 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white font-heading gradient-text">Communauté</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">

            
            {/* Bouton de synchronisation */}
            {Object.keys(pendingUpdates).length > 0 && (
              <button
                onClick={forceSync}
                className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:shadow-glow active:scale-95 transition-all duration-300"
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
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:shadow-glow active:scale-95 transition-all duration-300"
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
          {/* Onglets principaux communautaires */}
          <div className="flex space-x-1 mb-6 glass-effect rounded-2xl p-1 shadow-2xl">
            <button
              onClick={() => setActiveTab('liste')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                activeTab === 'liste'
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Activités
            </button>
            <button
              onClick={() => setActiveTab('calendrier')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                activeTab === 'calendrier'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
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
              {/* Sous-onglets communautaires */}
              <div className="flex space-x-1 glass-effect rounded-xl p-1 shadow-lg">
                <button
                  onClick={() => setActiveSubTab('upcoming')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                    activeSubTab === 'upcoming'
                      ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
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
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Passées ({pastActivities.length})
                </button>
              </div>

              {/* Section de recherche communautaire */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{activeSubTab === 'upcoming' ? 'Activités à venir' : 'Activités passées'}</span>
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher une activité..."
                    className="glass-effect border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 w-full max-w-md"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Liste des activités */}
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center py-8 text-gray-300">Chargement des activités...</p>
                ) : (
                  (activeSubTab === 'upcoming' ? filteredUpcomingActivities : filteredPastActivities)
                    .filter(activity => activity.id) // Filtrer les activités sans ID
                    .map((activity) => (
                  <div 
                    key={activity.id!} 
                    className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group ${
                      theme === 'light' 
                        ? 'bg-blue-50/80 border-blue-200/50' 
                        : 'glass-effect border-white/20'
                    }`}
                    style={{ 
                      animation: `fadeInUp 0.5s ease-out ${activities.indexOf(activity) * 50}ms forwards`
                    }}
                  >
                    {/* En-tête de l'activité - Design compact et moderne */}
                    <div className="p-4 border-b border-white/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Header avec titre et badge de statut */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full animate-pulse"></div>
                                <h3 className="text-base font-bold text-white tracking-wide">
                                  {activity.name}
                                </h3>
                              </div>
                              
                              {/* Localisation avec design moderne */}
                              {activity.location && (
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{activity.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Grille d'informations compactes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {/* Colonne 1: Créateur et Date */}
                            <div className="space-y-2">
                              {/* Créateur avec design compact */}
                              <div className={`flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white/90 border-blue-200/60' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'} rounded-lg border`}>
                                <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>CRÉÉ PAR</div>
                                  <div className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-slate-300'}`}>{activity.creator_name}</div>
                                </div>
                              </div>

                              {/* Date avec design compact */}
                              <div className={`flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white/90 border-blue-200/60' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'} rounded-lg border`}>
                                <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>DATE</div>
                                  <div className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-slate-300'}`}>{formatDate(activity.activity_date)}</div>
                                </div>
                              </div>
                            </div>

                            {/* Colonne 2: Heure et Description */}
                            <div className="space-y-2">
                              {/* Heure avec design compact */}
                              {activity.activity_time && (
                                <div className={`flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white/90 border-blue-200/60' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'} rounded-lg border`}>
                                  <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>HEURE</div>
                                    <div className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-slate-300'}`}>{formatTime(activity.activity_time)}</div>
                                  </div>
                                </div>
                              )}

                              {/* Description avec design compact */}
                              <div className={`flex items-start space-x-2 px-4 py-2 rounded-lg border ${theme === 'light' ? 'bg-white/90 border-blue-200/60' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'}`}>
                                <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>DESCRIPTION</div>
                                  <div className={`text-xs font-semibold leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>
                                    {activity.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                            
                        {/* Bouton d'expansion et indicateur de synchronisation - Design compact */}
                        <div className="flex items-center space-x-2 ml-3">
                            {/* Indicateur de synchronisation compact */}
                            {activity.id && syncStatus[activity.id] && (
                              <div className="flex-shrink-0">
                                {syncStatus[activity.id] === 'pending' && (
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-sm shadow-yellow-400/50"></div>
                                )}
                                {syncStatus[activity.id] === 'synced' && (
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50"></div>
                                )}
                                {syncStatus[activity.id] === 'error' && (
                                  <div className="w-2 h-2 bg-red-400 rounded-full shadow-sm shadow-red-400/50"></div>
                                )}
                              </div>
                            )}
                          
                          <button
                            onClick={() => toggleActivity(activity.id!)}
                            className={`px-2 py-1 transition-all duration-200 rounded-md active:scale-95 shadow-sm hover:shadow-md border text-xs font-medium flex items-center space-x-1 flex-shrink-0 ${
                              theme === 'light'
                                ? 'bg-blue-100 hover:bg-blue-200 text-gray-800 border-blue-300'
                                : 'bg-gradient-to-br from-gray-700/50 to-gray-600/50 hover:from-gray-600/50 hover:to-gray-500/50 text-gray-300 hover:text-white border-white/10'
                            }`}
                            title={expandedActivities.has(activity.id!) ? "Réduire" : "Voir le sondage"}
                          >
                            <span className="whitespace-nowrap">
                              {expandedActivities.has(activity.id!) ? "Réduire" : "Sondage"}
                            </span>
                            <svg className={`w-3 h-3 transition-transform duration-300 ${expandedActivities.has(activity.id!) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contenu détaillé communautaire (développable) */}
                    {expandedActivities.has(activity.id!) && (
                      <div className={`p-4 space-y-3 backdrop-blur-sm ${
                        theme === 'light'
                          ? 'bg-blue-50/60'
                          : 'bg-gradient-to-br from-emerald-900/30 to-blue-900/30'
                      }`}>

                        {/* Section Sondage communautaire - Design épuré */}
                        {activity.pollOptions && activity.pollOptions.length > 0 ? (
                          <div className={`space-y-2 p-3 rounded-lg ${
                            theme === 'light' 
                              ? 'bg-blue-100/80 border border-blue-300/60' 
                              : 'bg-emerald-900/20 border border-emerald-500/20'
                          }`}>
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium flex items-center ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                {activity.pollName || 'Aucun nom de sondage'}
                              </h4>
                              {activity.uniqueParticipants && activity.uniqueParticipants > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                  theme === 'light'
                                    ? 'bg-blue-100 text-gray-800 border-blue-300'
                                    : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                                }`}>
                                  {activity.uniqueParticipants} participant{activity.uniqueParticipants > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                                            <div className="space-y-1.5">
                              {activity.pollOptions.map((option: any) => {
                                // Vérifier que option est un objet avec option_text
                                if (typeof option === 'object' && option !== null && 'option_text' in option) {
                                  return (
                                    <div key={option.id} className={`backdrop-blur-sm rounded-lg border p-3 transition-all duration-200 group ${
                                      theme === 'light'
                                        ? 'bg-white/90 border-blue-200/50 hover:border-blue-300/70'
                                        : 'glass-effect border-white/15 hover:border-white/25'
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                          <div className="flex-1">
                                            <div className={`text-sm font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{option.option_text}</div>
                                            {option.votes && option.votes.length > 0 && (
                                              <div className="text-xs text-gray-400 mt-0.5 flex items-center space-x-1">
                                                <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                                <span>{option.votes.length} vote{option.votes.length > 1 ? 's' : ''}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {/* Bouton pour voir les votants - compact */}
                                          {option.votes && option.votes.length > 0 && (
                                            <button
                                              onClick={() => toggleVoters(option.id)}
                                              className="p-1.5 text-gray-400 hover:text-emerald-400 transition-all duration-200 rounded-md hover:bg-emerald-400/10"
                                              title="Voir les votants"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                              </svg>
                                            </button>
                                          )}
                                          {/* Bouton de vote compact */}
                                          <button
                                            onClick={() => toggleVote(option.id, activity.id!)}
                                            disabled={votingStates[`${activity.id!}-${option.id}`]}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                              votingStates[`${activity.id!}-${option.id}`]
                                                ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                                                : userVotes[activity.id!]?.includes(option.id)
                                                ? 'bg-emerald-500/80 text-white hover:bg-emerald-500'
                                                : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/60 hover:text-white'
                                            }`}
                                            title={
                                              votingStates[`${activity.id!}-${option.id}`] 
                                                ? 'En cours...' 
                                                : userVotes[activity.id!]?.includes(option.id) 
                                                  ? 'Retirer le vote' 
                                                  : 'Voter pour cette option'
                                            }
                                          >
                                            {votingStates[`${activity.id!}-${option.id}`] ? (
                                              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                              </svg>
                                            ) : userVotes[activity.id!]?.includes(option.id) ? (
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            ) : (
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                            )}
                                          </button>
                                        </div>
                                  </div>
                                  
                                  {/* Liste des votants compacte */}
                                  {showVoters[option.id] && option.votes && option.votes.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/15">
                                      <div className="text-xs text-emerald-300 mb-2 font-medium flex items-center space-x-1">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                        <span>Votants ({option.votes.length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {voterNames[option.id] ? (
                                          voterNames[option.id].map((name, index) => (
                                            <span key={index} className={`text-xs px-2 py-0.5 rounded-md ${
                                              theme === 'light' 
                                                ? 'text-gray-800 bg-blue-100/60' 
                                                : 'text-gray-200 bg-white/10'
                                            }`}>
                                              {name}
                                            </span>
                                          ))
                                        ) : (
                                          <div className="text-xs text-gray-400 italic flex items-center space-x-1">
                                            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Chargement...</span>
                                          </div>
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
                        ) : (
                          /* Message quand il n'y a pas de sondage */
                          <div className={`p-3 rounded-lg text-center ${
                            theme === 'light'
                              ? 'bg-blue-50/60 border border-blue-200/40'
                              : 'bg-gray-800/30 border border-gray-600/30'
                          }`}>
                            <div className={`text-sm font-medium ${
                              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                            }`}>
                              Aucun sondage créé pour cette activité
                            </div>
                          </div>
                        )}

                        {/* Actions admin - Design compact */}
                        {isHydrated && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
                          <div className="admin-buttons pt-3 border-t border-white/15 flex items-center justify-between">
                            <button
                              className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors"
                              title="Modifier l'activité"
                              onClick={() => setEditActivity(activity)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Modifier</span>
                            </button>
                            <button
                              className="p-1.5 rounded-lg hover:bg-red-400/20 transition-colors"
                              title="Supprimer l'activité"
                              onClick={() => { setDeleteActivityId(activity.id!); setShowDeleteModal(true); }}
                            >
                              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
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
                
                <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
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
                    <div key={day} className={`text-center text-xs font-medium py-2 ${theme === 'light' ? 'text-slate-500' : 'text-white'}`}>
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
                            ? theme === 'light' 
                            ? 'text-slate-800 hover:bg-slate-100'
                              : 'text-white hover:bg-slate-700'
                            : theme === 'light' 
                              ? 'text-slate-400' 
                              : 'text-gray-400'
                        } ${
                          isToday ? (theme === 'light' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-800 text-white') + ' font-semibold' : ''
                        } ${
                          dayActivities.length > 0 ? (theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/30 border border-blue-400/30') : ''
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
                                <div className={`text-xs font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-300'}`}>+{dayActivities.length - 2}</div>
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in hover:shadow-glow">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Créateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newActivity.creator_name}
                    onChange={(e) => setNewActivity({...newActivity, creator_name: e.target.value})}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nom du créateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de l'activité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nom de l'activité"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lieu <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Lieu de l'activité"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newActivity.activity_date}
                      onChange={(e) => setNewActivity({...newActivity, activity_date: e.target.value})}
                      className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                    <input
                      type="time"
                      value={newActivity.activity_time || ''}
                      onChange={(e) => setNewActivity({...newActivity, activity_time: e.target.value})}
                      className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    rows={3}
                    placeholder="Description de l'activité"
                  />
                </div>

                {/* Section Sondage */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom du sondage</label>
                  <input
                    type="text"
                    value={pollName}
                    onChange={(e) => setPollName(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nom du sondage (optionnel)"
                  />
                </div>

                {/* Section Options de sondage */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Options de sondage</label>
                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-purple-600">📊</span>
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
                        className="flex-1 bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        placeholder="Ajouter une option..."
                      />
                      <button
                        onClick={addPollOption}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        +
                      </button>
                    </div>
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
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddActivity}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
          <div className="glass-effect w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in rounded-3xl border border-white/20">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  Activités du {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="text-gray-300 hover:text-white transition-colors"
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
                  <div key={activity.id!} className="glass-effect backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group">
                    {/* En-tête de l'activité - Design compact et moderne */}
                    <div className="p-4 border-b border-white/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Header avec titre et badge de statut */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full animate-pulse"></div>
                                <h3 className="text-base font-bold text-white tracking-wide">
                                  {activity.name}
                                </h3>
                              </div>
                              
                              {/* Localisation avec design moderne */}
                              {activity.location && (
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{activity.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Grille d'informations compactes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {/* Colonne 1: Créateur et Date */}
                            <div className="space-y-2">
                              {/* Créateur avec design compact */}
                              <div className={`flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white/95 border-blue-200/80' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'} rounded-lg border`}>
                                <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>CRÉÉ PAR</div>
                                  <div className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-slate-300'}`}>{activity.creator_name}</div>
                                </div>
                              </div>

                              {/* Date avec design compact */}
                              <div className={`flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white/95 border-blue-200/80' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'} rounded-lg border`}>
                                <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>DATE</div>
                                  <div className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-slate-300'}`}>{formatDate(activity.activity_date)}</div>
                                </div>
                              </div>
                            </div>

                            {/* Colonne 2: Heure et Description */}
                            <div className="space-y-2">
                              {/* Heure avec design compact */}
                              {activity.activity_time && (
                                <div className={`flex items-center space-x-2 px-4 py-2 ${theme === 'light' ? 'bg-white/95 border-blue-200/80' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'} rounded-lg border`}>
                                  <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>HEURE</div>
                                    <div className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-slate-300'}`}>{formatTime(activity.activity_time)}</div>
                                  </div>
                                </div>
                              )}

                              {/* Description avec design compact */}
                              <div className={`flex items-start space-x-2 px-4 py-2 rounded-lg border ${theme === 'light' ? 'bg-white/95 border-blue-200/80' : 'bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-slate-400/20'}`}>
                                <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>DESCRIPTION</div>
                                  <div className={`text-xs font-semibold leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>{activity.description}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Section des options de vote avec design moderne */}
                    {activity.pollOptions && activity.pollOptions.length > 0 && (
                      <div className="p-4 border-t border-white/20">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Options de vote</span>
                        </div>
                        <div className="space-y-2">
                          {activity.pollOptions.map((option, index) => {
                            // Vérifier que option est un objet avec option_text
                            if (typeof option === 'object' && option !== null && 'option_text' in option) {
                              const votes = activity.votes?.filter(vote => vote.poll_option_id === option.id)?.length || 0
                              return (
                                <div key={index} className={`rounded-lg border ${theme === 'light' ? 'bg-gradient-to-r from-emerald-50/90 to-emerald-100/80 border-emerald-200/60' : 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border-emerald-400/20'}`}>
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="flex-1">
                                        <div className={`text-sm font-medium ${theme === 'light' ? 'text-emerald-800' : 'text-emerald-200'}`}>{option.option_text}</div>
                                        {votes > 0 && (
                                          <div className={`text-xs mt-0.5 flex items-center space-x-1 ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'}`}>
                                            <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                            <span>{votes} vote{votes > 1 ? 's' : ''}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                <div className="flex items-center space-x-2">
                                      {/* Bouton pour voir les votants - compact */}
                                  {votes > 0 && (
                                        <button
                                          onClick={() => toggleVoters(option.id)}
                                          className={`p-1.5 transition-all duration-200 rounded-md hover:bg-emerald-400/10 ${theme === 'light' ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-300 hover:text-emerald-400'}`}
                                          title="Voir les votants"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                        </button>
                                      )}
                                      {/* Bouton de vote compact */}
                                      <button
                                        onClick={() => toggleVote(option.id, activity.id!)}
                                        disabled={votingStates[`${activity.id!}-${option.id}`]}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                          votingStates[`${activity.id!}-${option.id}`]
                                            ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                                            : userVotes[activity.id!]?.includes(option.id)
                                            ? 'bg-emerald-500/80 text-white hover:bg-emerald-500'
                                            : theme === 'light'
                                            ? 'bg-emerald-200/60 text-emerald-800 hover:bg-emerald-300/80'
                                            : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/60 hover:text-white'
                                        }`}
                                        title={
                                          votingStates[`${activity.id!}-${option.id}`] 
                                            ? 'En cours...' 
                                            : userVotes[activity.id!]?.includes(option.id) 
                                              ? 'Retirer le vote' 
                                              : 'Voter pour cette option'
                                        }
                                      >
                                        {votingStates[`${activity.id!}-${option.id}`] ? (
                                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                        ) : userVotes[activity.id!]?.includes(option.id) ? (
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        ) : (
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Liste des votants compacte */}
                                  {showVoters[option.id] && votes > 0 && (
                                    <div className="px-3 pb-3 border-t border-white/15">
                                      <div className={`text-xs mb-2 font-medium flex items-center space-x-1 mt-2 pt-2 ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'}`}>
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                        <span>Votants ({votes})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {voterNames[option.id] ? (
                                          voterNames[option.id].map((name, index) => (
                                            <span key={index} className={`text-xs px-2 py-0.5 rounded-md ${
                                              theme === 'light' 
                                                ? 'text-gray-800 bg-blue-100/60' 
                                                : 'text-gray-200 bg-white/10'
                                            }`}>
                                              {name}
                                            </span>
                                          ))
                                        ) : (
                                          <div className={`text-xs italic flex items-center space-x-1 ${theme === 'light' ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Chargement...</span>
                                    </div>
                                  )}
                                </div>
                                    </div>
                                  )}
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

            {/* Modal d'édition d'activité moderne */}
      {editActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
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
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Créateur</label>
                <input
                  type="text"
                  value={editActivity.creator_name}
                  onChange={e => setEditActivity({ ...editActivity, creator_name: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700"
                />
                <label className="block text-sm font-medium text-slate-700">Nom de l'activité</label>
                <input
                  type="text"
                  value={editActivity.name}
                  onChange={e => setEditActivity({ ...editActivity, name: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700"
                />
                <label className="block text-sm font-medium text-slate-700">Lieu</label>
                <input
                  type="text"
                  value={editActivity.location}
                  onChange={e => setEditActivity({ ...editActivity, location: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editActivity.activity_date}
                      onChange={e => setEditActivity({ ...editActivity, activity_date: e.target.value })}
                      className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                    <input
                      type="time"
                      value={editActivity.activity_time || ''}
                      onChange={e => setEditActivity({ ...editActivity, activity_time: e.target.value })}
                      className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700"
                    />
                  </div>
                </div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={editActivity.description}
                  onChange={e => setEditActivity({ ...editActivity, description: e.target.value })}
                  className="w-full bg-white/70 border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700"
                  rows={3}
                />

                {/* Section Nom du sondage pour l'édition */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom du sondage</label>
                  <input
                    type="text"
                    value={editActivity.pollName || ''}
                    onChange={e => setEditActivity({ ...editActivity, pollName: e.target.value })}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nom du sondage (optionnel)"
                  />
                </div>

                {/* Section Options de sondage pour l'édition */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Options de sondage</label>
                  <div className="space-y-3">
                    {editPollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-purple-600">📊</span>
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
                        className="flex-1 bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        placeholder="Ajouter une option..."
                      />
                      <button
                        onClick={addEditPollOption}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
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