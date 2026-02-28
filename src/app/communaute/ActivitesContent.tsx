'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import CarteCorseReact from '@/components/CarteCorseReact'
import { getActivities } from '@/lib/activities'
import { formatDateToDDMMYYYY, formatTimeToHHMM } from '@/lib/dateUtils'
import ActivityInterestBand from '@/components/ActivityInterestBand'

interface Activity {
  id?: string;
  creator_name?: string;
  name?: string;
  location?: string;
  activity_date?: string;
  activity_time?: string;
  description?: string;
  poll_name?: string;
  created_at?: string;
  region?: string;
  type?: string;
}

function CommunauteContent() {
  const { theme } = useTheme()
  const { profile } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)

  // Charger les activités
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

  // Gérer le clic sur une région de la carte
  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName)
    
    // Scroll vers les activités après un petit délai
    setTimeout(() => {
      if (activitiesRef.current) {
        activitiesRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
  }

  // Supprimer le filtre
  const clearFilter = () => {
    setSelectedRegion(null)
  }

  // Filtrer les activités par région si une région est sélectionnée
  const filteredActivities = selectedRegion 
    ? activities.filter(activity => activity.region === selectedRegion)
    : activities

  // Grouper les activités par type et trier par date
  const activitiesByType = {
    Formation: filteredActivities
      .filter(activity => activity.type === 'Formation')
      .sort((a, b) => new Date(a.activity_date || '').getTime() - new Date(b.activity_date || '').getTime()),
    Conférence: filteredActivities
      .filter(activity => activity.type === 'Conférence')
      .sort((a, b) => new Date(a.activity_date || '').getTime() - new Date(b.activity_date || '').getTime()),
    Bénévolat: filteredActivities
      .filter(activity => activity.type === 'Bénévolat')
      .sort((a, b) => new Date(a.activity_date || '').getTime() - new Date(b.activity_date || '').getTime()),
    Sortie: filteredActivities
      .filter(activity => activity.type === 'Sortie')
      .sort((a, b) => new Date(a.activity_date || '').getTime() - new Date(b.activity_date || '').getTime())
  }

  return (
    <>
      <style jsx>{`
        .section-title {
          color: white !important;
        }
      `}</style>
      <div className="space-y-6">
      {/* Carte interactive */}
      <div className="relative">
        <CarteCorseReact onRegionClick={handleRegionClick} />
      </div>

      {/* Indicateur de filtre actif - Design compact et épuré */}
      {selectedRegion && (
        <div className="mx-4 mb-4">
          <div className="relative group">
            {/* Fond principal avec effet de verre */}
            <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-xl border border-slate-600/20 rounded-xl p-3 shadow-lg shadow-slate-900/20">
              {/* Effet de brillance subtile */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent rounded-xl"></div>
              
              <div className="relative flex items-center justify-between">
                {/* Contenu principal */}
                <div className="flex items-center gap-2">
                  {/* Icône de filtre moderne */}
                  <div className="relative">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/25">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    </div>
                    {/* Indicateur de statut */}
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-800 animate-pulse"></div>
                  </div>
                  
                  {/* Texte informatif */}
                  <div className="flex items-center gap-2">
                    <span className={`${theme === 'light' ? 'text-slate-600' : 'text-slate-300'} text-xs font-medium uppercase tracking-wide`}>Filtre:</span>
                    <span className={`${theme === 'light' ? 'text-black' : 'text-white'} font-medium text-sm`}>{selectedRegion}</span>
                  </div>
                </div>
                
                {/* Bouton de suppression élégant */}
                <button
                  onClick={clearFilter}
                  className="group/btn relative w-7 h-7 bg-slate-700/40 hover:bg-slate-600/50 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-slate-600/30 hover:border-slate-500/50"
                  title="Supprimer le filtre"
                >
                  <svg className="w-3 h-3 text-slate-400 group-hover/btn:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  
                  {/* Effet de survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section des activités */}
      <div ref={activitiesRef} className="space-y-8">
        {/* Compartiment Formations */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600/40"></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-2 text-sm font-semibold text-white tracking-wide uppercase section-title`}>
                Formations ({activitiesByType.Formation.length})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
              </div>
            ) : (
              <>
                {activitiesByType.Formation.length > 0 ? (
                  activitiesByType.Formation.map((activity) => (
                    <div key={activity.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`${theme === 'light' ? 'text-black' : 'text-white'} font-semibold text-lg`}>{activity.name}</h4>
                        <div className={`text-xs ${theme === 'light' ? 'text-black/70' : 'text-white/70'} bg-white/10 px-2 py-1 rounded-full`}>
                          {formatDateToDDMMYYYY(activity.activity_date || '')}
                        </div>
                      </div>
                      <p className={`${theme === 'light' ? 'text-black/80' : 'text-white/80'} text-sm mb-3`}>{activity.description}</p>
                      <div className={`flex justify-between items-center text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>
                        <span>📍 {activity.location || 'Lieu à préciser'}</span>
                        <span>👤 {activity.creator_name}</span>
                      </div>
                      {activity.activity_time && (
                        <div className={`text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'} mt-1`}>
                          🕒 {formatTimeToHHMM(activity.activity_time || '')}
                        </div>
                      )}
                      {/* Bande d'intérêt */}
                      <div className="mt-3">
                        <ActivityInterestBand activityId={activity.id || ''} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${theme === 'light' ? 'text-black/60' : 'text-slate-400'}`}>
                    <div className="text-sm">
                      {selectedRegion 
                        ? `Aucune formation prévue pour ${selectedRegion}`
                        : 'Aucune formation prévue pour le moment'
                      }
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Compartiment Conférences */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600/40"></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-2 text-sm font-semibold text-white tracking-wide uppercase section-title`}>
                Conférences ({activitiesByType.Conférence.length})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
              </div>
            ) : (
              <>
                {activitiesByType.Conférence.length > 0 ? (
                  activitiesByType.Conférence.map((activity) => (
                    <div key={activity.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`${theme === 'light' ? 'text-black' : 'text-white'} font-semibold text-lg`}>{activity.name}</h4>
                        <div className={`text-xs ${theme === 'light' ? 'text-black/70' : 'text-white/70'} bg-white/10 px-2 py-1 rounded-full`}>
                          {formatDateToDDMMYYYY(activity.activity_date || '')}
                        </div>
                      </div>
                      <p className={`${theme === 'light' ? 'text-black/80' : 'text-white/80'} text-sm mb-3`}>{activity.description}</p>
                      <div className={`flex justify-between items-center text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>
                        <span>📍 {activity.location || 'Lieu à préciser'}</span>
                        <span>👤 {activity.creator_name}</span>
                      </div>
                      {activity.activity_time && (
                        <div className={`text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'} mt-1`}>
                          🕒 {formatTimeToHHMM(activity.activity_time || '')}
                        </div>
                      )}
                      {/* Bande d'intérêt */}
                      <div className="mt-3">
                        <ActivityInterestBand activityId={activity.id || ''} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${theme === 'light' ? 'text-black/60' : 'text-slate-400'}`}>
                    <div className="text-sm">
                      {selectedRegion 
                        ? `Aucune conférence prévue pour ${selectedRegion}`
                        : 'Aucune conférence prévue pour le moment'
                      }
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Compartiment Bénévolat */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600/40"></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-2 text-sm font-semibold text-white tracking-wide uppercase section-title`}>
                Bénévolat ({activitiesByType.Bénévolat.length})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
              </div>
            ) : (
              <>
                {activitiesByType.Bénévolat.length > 0 ? (
                  activitiesByType.Bénévolat.map((activity) => (
                    <div key={activity.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`${theme === 'light' ? 'text-black' : 'text-white'} font-semibold text-lg`}>{activity.name}</h4>
                        <div className={`text-xs ${theme === 'light' ? 'text-black/70' : 'text-white/70'} bg-white/10 px-2 py-1 rounded-full`}>
                          {formatDateToDDMMYYYY(activity.activity_date || '')}
                        </div>
                      </div>
                      <p className={`${theme === 'light' ? 'text-black/80' : 'text-white/80'} text-sm mb-3`}>{activity.description}</p>
                      <div className={`flex justify-between items-center text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>
                        <span>📍 {activity.location || 'Lieu à préciser'}</span>
                        <span>👤 {activity.creator_name}</span>
                      </div>
                      {activity.activity_time && (
                        <div className={`text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'} mt-1`}>
                          🕒 {formatTimeToHHMM(activity.activity_time || '')}
                        </div>
                      )}
                      {/* Bande d'intérêt */}
                      <div className="mt-3">
                        <ActivityInterestBand activityId={activity.id || ''} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${theme === 'light' ? 'text-black/60' : 'text-slate-400'}`}>
                    <div className="text-sm">
                      {selectedRegion 
                        ? `Aucune activité de bénévolat prévue pour ${selectedRegion}`
                        : 'Aucune activité de bénévolat prévue pour le moment'
                      }
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Compartiment Sorties */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600/40"></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-2 text-sm font-semibold text-white tracking-wide uppercase section-title`}>
                Sorties ({activitiesByType.Sortie.length})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
              </div>
            ) : (
              <>
                {activitiesByType.Sortie.length > 0 ? (
                  activitiesByType.Sortie.map((activity) => (
                    <div key={activity.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`${theme === 'light' ? 'text-black' : 'text-white'} font-semibold text-lg`}>{activity.name}</h4>
                        <div className={`text-xs ${theme === 'light' ? 'text-black/70' : 'text-white/70'} bg-white/10 px-2 py-1 rounded-full`}>
                          {formatDateToDDMMYYYY(activity.activity_date || '')}
                        </div>
                      </div>
                      <p className={`${theme === 'light' ? 'text-black/80' : 'text-white/80'} text-sm mb-3`}>{activity.description}</p>
                      <div className={`flex justify-between items-center text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>
                        <span>📍 {activity.location || 'Lieu à préciser'}</span>
                        <span>👤 {activity.creator_name}</span>
                      </div>
                      {activity.activity_time && (
                        <div className={`text-xs ${theme === 'light' ? 'text-black/60' : 'text-white/60'} mt-1`}>
                          🕒 {formatTimeToHHMM(activity.activity_time || '')}
                        </div>
                      )}
                      {/* Bande d'intérêt */}
                      <div className="mt-3">
                        <ActivityInterestBand activityId={activity.id || ''} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${theme === 'light' ? 'text-black/60' : 'text-slate-400'}`}>
                    <div className="text-sm">
                      {selectedRegion 
                        ? `Aucune sortie prévue pour ${selectedRegion}`
                        : 'Aucune sortie prévue pour le moment'
                      }
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default CommunauteContent