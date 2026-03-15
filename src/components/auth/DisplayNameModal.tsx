'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface DisplayNameModalProps {
  isOpen: boolean
  onSubmit: (fullName: string) => Promise<void>
  isLoading?: boolean
}

export default function DisplayNameModal({ isOpen, onSubmit, isLoading = false }: DisplayNameModalProps) {
  const { theme } = useTheme()
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = fullName.trim()
    if (!trimmed) {
      setError('Veuillez saisir votre prénom et nom.')
      return
    }
    if (trimmed.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLight = theme === 'light'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl border animate-scale-in ${
          isLight
            ? 'bg-white border-gray-200'
            : 'bg-gray-900 border-gray-700'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="display-name-title"
        aria-describedby="display-name-desc"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <div>
              <h2 id="display-name-title" className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Complétez votre profil
              </h2>
              <p id="display-name-desc" className={`text-sm mt-0.5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                Pour enregistrer vos observations naturalistes, nous avons besoin de votre nom d&apos;affichage.
              </p>
            </div>
          </div>

          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
            Ce <strong>Prénom Nom</strong> sera associé à toutes vos observations (espèces, sites, etc.) et pourra être utilisé dans les exports et rapports du CEN Corse. Merci de le renseigner correctement.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="display-name-input" className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Prénom et Nom
              </label>
              <input
                id="display-name-input"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setError(null)
                }}
                placeholder="Ex. Jean Dupont"
                disabled={submitting || isLoading}
                autoComplete="name"
                className={`w-full rounded-xl border px-4 py-3 text-base transition-colors ${
                  isLight
                    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                }`}
              />
              {error && (
                <p className="mt-1.5 text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting || isLoading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
