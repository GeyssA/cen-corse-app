'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import SubTabs from '@/components/navigation/SubTabs'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LazyCommunauteActivitesContent, LazyCommunauteCalendrierContent, LazyAddActivityModal } from '@/components/LazyComponent'

const subTabs = [
  {
    id: 'activites',
    label: 'Activités',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v4m0 0c-2.21 0-4 1.79-4 4m4-4c2.21 0 4 1.79 4 4" />
      </svg>
    )
  },
  {
    id: 'calendrier',
    label: 'Calendrier',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
]

export default function CommunautePage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('activites')
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddActivity = async () => {
    try {
      console.log('✅ Activité ajoutée avec succès')
      // Ici on pourrait recharger les activités si nécessaire
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'activité:', error)
    }
  }

  return (
    <ProtectedRoute>
      {/* Header uniforme avec logo et menu utilisateur */}
      <div className="w-full glass-effect border-b border-white/10 h-16 overflow-hidden">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 py-3 h-full flex items-center justify-between w-full">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className={`bg-white rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                theme === 'light' ? 'border border-gray-800' : ''
              }`}
              style={{ 
                width: 'clamp(130px, 32vw, 170px)', 
                height: 'clamp(48px, 13vw, 64px)' 
              }}
            >
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-10/12 h-10/12 object-contain"
                style={{ display: 'block' }}
              />
            </button>
          </div>

          {/* Zone centrale pour le bouton d'ajout (admin uniquement) */}
          <div className="flex items-center justify-center flex-1">
            {profile?.role === 'admin' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:shadow-emerald-500/25'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:shadow-glow'
                }`}
                title="Ajouter une activité"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* UserMenu à droite */}
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Sous-onglets */}
      <SubTabs 
        tabs={subTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Fond adaptatif pour la section principale */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 pb-20 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
      }`}>
        {/* Contenu principal */}
        <main className="max-w-lg mx-auto px-4 pt-3 pb-4 space-y-6 w-full overflow-x-hidden">
          {activeTab === 'activites' ? (
            <LazyCommunauteActivitesContent />
          ) : (
            <LazyCommunauteCalendrierContent />
          )}
        </main>

        {/* Modal d'ajout d'activité */}
        <LazyAddActivityModal 
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          onAddActivity={handleAddActivity}
        />
      </div>

      {/* Navigation principale en bas */}
      <MainNavigation />
    </ProtectedRoute>
  )
}
