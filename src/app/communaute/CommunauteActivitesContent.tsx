'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getActivities, createActivity, updateActivityWithPollOptions, deleteActivity } from '@/lib/activities'
import { formatDateToDDMMYYYY, formatTimeToHHMM } from '@/lib/dateUtils'
import ActivityInterestBand from '@/components/ActivityInterestBand'

interface Activity {
  id?: string
  creator_name: string
  name: string
  location: string
  activity_date: string
  activity_time?: string
  description: string
  created_at?: string
  poll_name?: string
  pollOptions?: string[]
  votes?: { id: string; activity_id: string; poll_option_id: string; user_id: string; created_at: string }[]
  uniqueParticipants?: number
  votersByOption?: Record<string, string[]>
}

export default function CommunauteActivitesContent() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'upcoming' | 'past'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  // const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set()) // Temporairement commenté car non utilisé

  const [newActivity, setNewActivity] = useState({
    creator_name: '',
    name: '',
    location: '',
    activity_date: '',
    activity_time: '',
    description: '',
    poll_name: ''
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true)
      try {
        const fetchedActivities = await getActivities()
        setActivities(fetchedActivities)
      } catch (error) {
        console.error('Error loading activities:', error)
      } finally {
        setLoading(false)
      }
    }
    loadActivities()
  }, [])

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

  const handleAddActivity = async () => {
    if (!profile?.id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      setNotification({ type: 'error', message: 'Permissions insuffisantes pour ajouter une activité.' })
      return
    }

    if (!newActivity.creator_name || !newActivity.name || !newActivity.location || !newActivity.activity_date) {
      setNotification({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires.' })
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
        poll_name: newActivity.poll_name || undefined,
        created_by: profile?.id
      }

      console.log('📊 ActivityData:', activityData)
      console.log('🗳️ PollOptions:', [])

      const createdActivity = await createActivity(activityData, [])

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
      poll_name: ''
    })
      } else {
        console.error('❌ Échec de la création de l\'activité')
        setNotification({ type: 'error', message: '❌ Erreur lors de la création de l\'activité' })
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'activité:', error)
      setNotification({ type: 'error', message: '❌ Erreur lors de la création de l\'activité' })
    }
  }

  const handleEditActivity = async () => {
    if (!editActivity?.id || !profile?.id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      setNotification({ type: 'error', message: 'Permissions insuffisantes ou activité non sélectionnée.' })
      return
    }

    if (!editActivity.creator_name || !editActivity.name || !editActivity.location || !editActivity.activity_date) {
      setNotification({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires.' })
      return
    }

    try {
      console.log('🚀 Tentative de mise à jour d\'activité...')
        
        const activityUpdates = {
          creator_name: editActivity.creator_name,
        name: editActivity.name,
          location: editActivity.location,
          activity_date: editActivity.activity_date,
          activity_time: editActivity.activity_time || undefined,
          description: editActivity.description,
        poll_name: editActivity.poll_name || undefined,
        created_by: profile?.id
      }

      console.log('📊 ActivityUpdates:', activityUpdates)
      console.log('🗳️ PollOptions:', [])

      const updatedActivity = await updateActivityWithPollOptions(editActivity.id, activityUpdates, [])

      if (updatedActivity) {
        console.log('✅ Activité mise à jour avec succès:', updatedActivity)
        
        // Message de confirmation
        setNotification({ type: 'success', message: `🎉 Activité "${updatedActivity.name}" mise à jour avec succès !` })
        
            // Recharger les activités depuis Supabase
            const activitiesData = await getActivities()
            setActivities(activitiesData)
        
        // Fermer le modal d'édition
        setEditActivity(null)
          } else {
        console.error('❌ Échec de la mise à jour de l\'activité')
        setNotification({ type: 'error', message: '❌ Erreur lors de la mise à jour de l\'activité' })
      }
      } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'activité:', error)
      setNotification({ type: 'error', message: '❌ Erreur lors de la mise à jour de l\'activité' })
    }
  }

  const handleDeleteActivity = async () => {
    if (!deleteActivityId || !profile?.id || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      setNotification({ type: 'error', message: 'Permissions insuffisantes ou activité non sélectionnée.' })
      return
    }

    try {
      console.log('🚀 Tentative de suppression d\'activité...')
      
      const deletedActivity = await deleteActivity(deleteActivityId)
      
      if (deletedActivity) {
        console.log('✅ Activité supprimée avec succès:', deletedActivity)
        
        // Message de confirmation
        setNotification({ type: 'success', message: `🎉 Activité supprimée avec succès !` })
        
        // Recharger les activités depuis Supabase
        const activitiesData = await getActivities()
        setActivities(activitiesData)
        
        // Fermer le modal de suppression
        setShowDeleteModal(false)
        setDeleteActivityId(null)
      } else {
        console.error('❌ Échec de la suppression de l\'activité')
        setNotification({ type: 'error', message: '❌ Erreur lors de la suppression de l\'activité' })
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'activité:', error)
      setNotification({ type: 'error', message: '❌ Erreur lors de la suppression de l\'activité' })
    }
  }

  // const toggleActivityExpansion = (id: string) => {
  //   setExpandedActivities(prev => {
  //     const newSet = new Set(prev)
  //     if (newSet.has(id)) {
  //       newSet.delete(id)
  //     } else {
  //       newSet.add(id)
  //     }
  //     return newSet
  //   })
  // }


  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' ||
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.creator_name.toLowerCase().includes(searchTerm.toLowerCase())

    const activityDate = new Date(activity.activity_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const isUpcoming = activityDate >= now
    const matchesTab = activeSubTab === 'all' ? true : 
                      activeSubTab === 'upcoming' ? isUpcoming : !isUpcoming
    
    return matchesSearch && matchesTab
  })

  // Calculer les statistiques
  const totalActivities = activities.length
  const upcomingActivities = activities.filter(activity => {
    const activityDate = new Date(activity.activity_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return activityDate >= now
  }).length
  const pastActivities = totalActivities - upcomingActivities

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Statistiques avec design identique à Projets > Description */}
      <div className="animate-fade-in">
        <div className={`grid gap-4 mb-4 ${
          isHydrated && (profile?.role === 'admin' || profile?.role === 'super_admin') 
            ? 'grid-cols-4' 
            : 'grid-cols-3'
        }`}>
          {/* Total - mis en évidence comme dans l'image */}
          <button
            onClick={() => setActiveSubTab('all')}
            className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              activeSubTab === 'all'
                ? 'bg-blue-500/20'
                : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
            }`}
          >
            <div className={`text-2xl font-bold gradient-text ${
              activeSubTab === 'all' 
                ? 'text-blue-400' 
                : theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>{totalActivities}</div>
            <div className={`text-sm font-medium ${
              activeSubTab === 'all'
                ? 'text-blue-400'
                : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>Total</div>
          </button>
          
          {/* À venir */}
          <button
            onClick={() => setActiveSubTab('upcoming')}
            className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              activeSubTab === 'upcoming'
                ? 'bg-emerald-500/20'
                : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
            }`}
          >
            <div className={`text-2xl font-bold gradient-text ${
              activeSubTab === 'upcoming' 
                ? 'text-emerald-400' 
                : theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>{upcomingActivities}</div>
            <div className={`text-sm font-medium ${
              activeSubTab === 'upcoming'
                ? 'text-emerald-400'
                : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>À venir</div>
          </button>
          
          {/* Passées */}
          <button
            onClick={() => setActiveSubTab('past')}
            className={`space-y-1 p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              activeSubTab === 'past'
                ? 'bg-orange-500/20'
                : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
            }`}
          >
            <div className={`text-2xl font-bold gradient-text ${
              activeSubTab === 'past' 
                ? 'text-orange-400' 
                : theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>{pastActivities}</div>
            <div className={`text-sm font-medium ${
              activeSubTab === 'past'
                ? 'text-orange-400'
                : theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>Passées</div>
          </button>
          
          {/* Bouton d'ajout */}
          {isHydrated && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <div className="flex items-center justify-center">
              <button 
                onClick={() => setShowAddModal(true)}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-blue-500/25'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-glow'
                }`}
                title="Ajouter une activité"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="animate-fade-in">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 transition-all duration-300 backdrop-blur-sm ${
              theme === 'light'
                ? 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50'
                : 'glass-effect border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Liste des activités */}
                {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>Chargement des activités...</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-300'}>
                {searchTerm ? 'Aucune activité trouvée' : 'Aucune activité pour cette période'}
              </p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Ligne de séparation fine */}
                {index > 0 && (
                  <div className={`h-px w-full ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                  }`} />
                )}
                
                <div className="py-4 transition-all duration-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 relative">
                  {/* Badge de statut en haut à droite */}
                  <div className="absolute top-4 right-4">
                    {(() => {
                      const activityDate = new Date(activity.activity_date)
                      const now = new Date()
                      now.setHours(0, 0, 0, 0)
                      const isUpcoming = activityDate >= now
                      
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                          isUpcoming
                            ? 'bg-green-500/20 text-green-700 border-green-500/30'
                            : 'bg-orange-500/20 text-orange-700 border-orange-500/30'
                        }`}>
                          {isUpcoming ? 'À venir' : 'Passée'}
                        </span>
                      )
                    })()}
                  </div>
                  
                  <div className="flex justify-between items-start pr-20">
                    <div className="flex-1">
                      <h3 className={`text-base font-semibold ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {activity.name}
                      </h3>
                      
                      <div className="mt-3 space-y-2">
                        <p className={`text-sm flex items-center ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        }`}>
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {activity.location}
                        </p>
                        <p className={`text-sm flex items-center ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        }`}>
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateToDDMMYYYY(activity.activity_date)}
                          {activity.activity_time && (
                            <>
                              <span className="mx-2">•</span>
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTimeToHHMM(activity.activity_time || '')}
                            </>
                          )}
                        </p>
                        {activity.description && (
                          <p className={`text-sm ${
                            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                          }`}>
                            {activity.description}
                          </p>
                        )}
                        
                        {/* Espacement amélioré pour "Créé par" */}
                        <div className="mt-4 pt-2">
                          <p className={`text-xs ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Créé par {activity.creator_name}
                          </p>
                        </div>
                        
                        {/* Bande d'intérêt */}
                        {activity.id && (
                          <div className="mt-3">
                            <ActivityInterestBand activityId={activity.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Boutons d'action pour les admins - Hauteur très réduite */}
                  {isHydrated && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <div className="mt-2 pt-2 border-t border-gray-200/20 dark:border-gray-700/20 flex items-center justify-between">
                      <button
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors hover:scale-105 active:scale-95"
                        title="Modifier l'activité"
                        onClick={() => setEditActivity(activity)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Modifier</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          className="p-1 rounded-full hover:bg-red-100 transition-colors hover:scale-105 active:scale-95"
                          title="Supprimer l'activité"
                          onClick={() => { setDeleteActivityId(activity.id!); setShowDeleteModal(true); }}
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
          )}

      {/* Modal d'ajout d'activité */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border ${
            theme === 'light'
              ? 'bg-white/95 border-blue-200/30'
              : 'glass-effect border-white/10'
          }`}>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Ajouter une activité</h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Nom de l&apos;activité <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Créateur <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newActivity.creator_name}
                    onChange={(e) => setNewActivity({ ...newActivity, creator_name: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Lieu <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                  />
                </div>
                  <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={newActivity.activity_date}
                    onChange={(e) => setNewActivity({ ...newActivity, activity_date: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                    />
                  </div>
                  <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Heure (optionnel)</label>
                    <input
                      type="time"
                    value={newActivity.activity_time}
                    onChange={(e) => setNewActivity({ ...newActivity, activity_time: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    />
                  </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Description (optionnel)</label>
                  <textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    rows={3}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                    className={`py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddActivity}
                    className="py-3 px-6 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:bg-emerald-600 transition-all duration-200"
                >
                    Ajouter
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'activité */}
      {editActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border ${
            theme === 'light'
              ? 'bg-white/95 border-blue-200/30'
              : 'glass-effect border-white/10'
          }`}>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Modifier l&apos;activité</h2>
              <div className="space-y-4">
                                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Nom de l&apos;activité <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editActivity.name}
                    onChange={(e) => setEditActivity({ ...editActivity, name: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                  />
                                    </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Créateur <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editActivity.creator_name}
                    onChange={(e) => setEditActivity({ ...editActivity, creator_name: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Lieu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editActivity.location}
                    onChange={(e) => setEditActivity({ ...editActivity, location: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                  />
                </div>
                  <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={editActivity.activity_date}
                    onChange={(e) => setEditActivity({ ...editActivity, activity_date: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    required
                    />
                  </div>
                  <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Heure (optionnel)</label>
                    <input
                      type="time"
                      value={editActivity.activity_time || ''}
                    onChange={(e) => setEditActivity({ ...editActivity, activity_time: e.target.value })}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                    />
                  </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Description (optionnel)</label>
                <textarea
                    value={editActivity.description || ''}
                    onChange={(e) => setEditActivity({ ...editActivity, description: e.target.value })}
                  rows={3}
                    className={`w-full p-3 rounded-lg border focus:ring-emerald-500 focus:border-emerald-500 ${
                      theme === 'light'
                        ? 'bg-gray-50 text-gray-800 border-gray-300'
                        : 'bg-gray-700 text-white border-gray-600'
                    }`}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditActivity(null)}
                    className={`py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                >
                  Annuler
                </button>
                <button
                    onClick={handleEditActivity}
                    className="py-3 px-6 bg-blue-500 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-600 transition-all duration-200"
                >
                    Sauvegarder
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className={`rounded-2xl w-full max-w-sm p-6 shadow-2xl border ${
            theme === 'light'
              ? 'bg-white/95 border-red-200/30'
              : 'glass-effect border-white/10'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Confirmer la suppression</h2>
            <p className={`mb-6 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
                <button
                onClick={() => setShowDeleteModal(false)}
                className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                >
                  Annuler
                </button>
                <button
                onClick={handleDeleteActivity}
                className="py-2 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all duration-200"
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