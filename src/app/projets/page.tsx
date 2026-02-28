'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import SubTabs from '@/components/navigation/SubTabs'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useProjectsContext } from '@/contexts/ProjectsContext'
import { LazyProjetsContent, LazyStatistiquesContent, LazyAddProjectModal } from '@/components/LazyComponent'

const subTabs = [
  {
    id: 'description',
    label: 'Description',
    icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
    )
  },
  {
    id: 'stats',
    label: 'Stats associées',
    icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
                          </svg>
    )
  }
]

export default function ProjetsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()
  const { loadProjects } = useProjectsContext()
  const [activeTab, setActiveTab] = useState('description')
  const [showAddModal, setShowAddModal] = useState(false)
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    planningProjects: 0
  })

  const handleAddProject = async () => {
    try {
      console.log('✅ Projet ajouté avec succès, rechargement du contexte...')
      // Recharger les projets dans le contexte (pour la page d'accueil notamment)
      await loadProjects()
    } catch (error) {
      console.error('Erreur lors de l\'ajout du projet:', error)
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
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-blue-500/25'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-glow'
                }`}
                title="Ajouter un projet"
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
          {activeTab === 'description' ? (
            <LazyProjetsContent
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}
              onStatsChange={setProjectStats}
            />
          ) : (
            <LazyStatistiquesContent projectStats={projectStats} />
          )}
        </main>

        {/* Modal d'ajout de projet */}
        <LazyAddProjectModal 
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          onAddProject={handleAddProject}
        />
              </div>

      {/* Navigation principale en bas */}
      <MainNavigation />
    </ProtectedRoute>
  )
}
