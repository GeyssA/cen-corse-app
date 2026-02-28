'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getActivities } from '@/lib/activities'
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
  pollOptions?: any[]
  votes?: any[]
  uniqueParticipants?: number
  votersByOption?: Record<string, string[]>
}

export default function CommunauteCalendrierContent() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [showDayModal, setShowDayModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

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

  // Fonction pour générer les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1)
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    
    // Ajouter les jours du mois précédent pour compléter la première semaine
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Lundi = 0
    for (let i = startDay - 1; i >= 0; i--) {
      const prevDate = new Date(firstDay)
      prevDate.setDate(prevDate.getDate() - (i + 1))
      days.push({
        date: prevDate,
        isCurrentMonth: false
      })
    }
    
    // Ajouter tous les jours du mois courant
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day)
      days.push({
        date: currentDate,
        isCurrentMonth: true
      })
    }
    
    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const remainingDays = 42 - days.length // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(lastDay)
      nextDate.setDate(nextDate.getDate() + day)
      days.push({
        date: nextDate,
        isCurrentMonth: false
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


  return (
    <div className="space-y-6">
      {/* Navigation du calendrier */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => {
            const newDate = new Date(currentDate)
            newDate.setMonth(newDate.getMonth() - 1)
            setCurrentDate(newDate)
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${
            theme === 'light'
              ? 'bg-white text-slate-600 hover:text-slate-800'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
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
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${
            theme === 'light'
              ? 'bg-white text-slate-600 hover:text-slate-800'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className={`rounded-2xl p-4 shadow-2xl border ${
        theme === 'light'
          ? 'bg-white/80 border-gray-200'
          : 'glass-effect border-white/10'
      }`}>
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className={`text-center text-xs font-medium py-2 ${
              theme === 'light' ? 'text-slate-500' : 'text-white'
            }`}>
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

      {/* Modal de détails du jour */}
      {showDayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border ${
            theme === 'light'
              ? 'bg-white/95 border-blue-200/30'
              : 'glass-effect border-white/10'
          }`}>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Activités du {selectedDate.toLocaleDateString('fr-FR')}
              </h2>
              <div className="space-y-0">
                {getActivitiesForDate(selectedDate).length === 0 ? (
                  <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Aucune activité prévue ce jour-là.</p>
                ) : (
                  getActivitiesForDate(selectedDate).map((activity, index) => (
                    <div key={activity.id} className="relative">
                      {/* Ligne de séparation fine */}
                      {index > 0 && (
                        <div className={`h-px w-full ${
                          theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                        }`} />
                      )}
                      
                      <div className="py-4 transition-all duration-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <div className="flex justify-between items-start">
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
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDayModal(false)}
                  className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
