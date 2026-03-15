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
      {/* Bandeau fixe : même couleur que la barre système, sans ligne */}
      <header className="app-header-bar w-full flex items-center justify-center">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 w-full h-full flex items-center justify-between py-0.5">
          <div className="flex items-center min-h-0">
            <button
              onClick={() => router.push('/')}
              className="rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg bg-white"
              style={{ width: 'clamp(120px, 30vw, 172px)', height: 'clamp(34px, 9vw, 44px)' }}
            >
              <img src="/Logo_CENCorse.png" alt="CEN Corse" className="h-9 w-auto max-w-[160px] object-contain block" />
            </button>
          </div>
          <div className="flex items-center justify-center flex-1">
            {profile?.role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}
                title="Ajouter un projet"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Sous-onglets */}
      <SubTabs 
        tabs={subTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Fond adaptatif pour la section principale */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
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
