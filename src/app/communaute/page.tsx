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
      <header className="app-header-bar flex h-full w-full items-center justify-center">
        <div className="mx-auto flex h-full w-full max-w-sm items-center justify-between px-0 py-0.5 sm:max-w-md sm:px-3 md:max-w-lg md:px-5 lg:max-w-1xl">
          <div className="flex min-h-0 items-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{ width: 'clamp(120px, 30vw, 172px)', height: 'clamp(34px, 9vw, 44px)' }}
            >
              <img src="/Logo_CENCorse.png" alt="CEN Corse" className="block h-9 w-auto max-w-[160px] object-contain" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            {profile?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 sm:h-10 sm:w-10"
                title="Ajouter une activité"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <SubTabs tabs={subTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-100'
        }`}
      >
        <main className="mx-auto w-full max-w-3xl space-y-4 overflow-x-hidden px-4 pb-8 pt-2 sm:px-5">
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
