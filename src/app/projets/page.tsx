'use client'

import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import { useTheme } from '@/contexts/ThemeContext'

const SITE_URL = 'https://www.cen-corse.org'

export default function ProjetsPage() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen flex flex-col ${
          isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 to-gray-900'
        }`}
      >
        <header
          className={`relative border-b p-3 flex justify-between items-center ${
            isLight ? 'border-gray-200' : 'border-slate-700/60'
          }`}
        >
          <UserMenu className="flex-1" />
        </header>

        <main className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-8 space-y-6">
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Terrains et activités
          </h1>
          <p className={`text-base leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
            Cette section a été allégée pour se concentrer sur l’essentiel dans l’application. Pour
            l’annuaire détaillé des actions du CEN Corse, visitez le site institutionnel.
          </p>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 font-medium transition-colors ${
              isLight
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          >
            Ouvrir cen-corse.org
          </a>
          <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            <Link
              href="/apropos"
              className={`font-medium underline decoration-2 underline-offset-4 ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              À propos
            </Link>
            <span> — l’association et l’app.</span>
          </p>
        </main>
        <MainNavigation />
      </div>
    </ProtectedRoute>
  )
}
