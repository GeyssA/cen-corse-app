'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

const THEME_PREF_PENDING_KEY = 'theme_pref_pending_after_onboarding'
const THEME_PREF_REQUEST_EVENT = 'theme-preference-requested'

function HomePreview({ mode }: { mode: 'light' | 'dark' }) {
  const isLight = mode === 'light'
  return (
    <div
      className={`mx-auto w-full max-w-[170px] overflow-hidden rounded-[16px] border shadow ${
        isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-700 bg-slate-900'
      }`}
    >
      <div className={`h-3 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
      <div className={`h-6 border-b px-2 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}>
        <div className={`mt-1 h-3 w-16 rounded ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
      </div>
      <div className={`h-20 ${isLight ? 'bg-slate-200' : 'bg-slate-800'} relative`}>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-2 bottom-1.5">
          <div className="h-1.5 w-10 rounded bg-white/80" />
          <div className="mt-1 h-2 w-16 rounded bg-white" />
        </div>
      </div>
      <div className={`p-2 space-y-1.5 ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
        <div className={`h-6 rounded ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-800 border border-slate-700'}`} />
        <div className={`h-9 rounded ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-800 border border-slate-700'}`} />
        <div className={`h-9 rounded ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-800 border border-slate-700'}`} />
      </div>
      <div className={`h-7 border-t px-2 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}>
        <div className="mt-2 flex items-center justify-between">
          <div className={`h-1.5 w-4 rounded ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
          <div className={`h-1.5 w-4 rounded ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
          <div className={`h-1.5 w-4 rounded ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
          <div className={`h-1.5 w-4 rounded ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
        </div>
      </div>
    </div>
  )
}

export default function ThemePreferenceModal() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<'dark' | 'light'>(theme)
  const isLightSelected = selected === 'light'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const pending = localStorage.getItem(THEME_PREF_PENDING_KEY) === '1'
    if (pending) {
      setSelected(theme)
      setOpen(true)
    }
  }, [mounted, theme])

  useEffect(() => {
    if (!mounted) return
    const onRequest = () => {
      setSelected(theme)
      setOpen(true)
    }
    window.addEventListener(THEME_PREF_REQUEST_EVENT, onRequest)
    return () => window.removeEventListener(THEME_PREF_REQUEST_EVENT, onRequest)
  }, [mounted, theme])

  const applyAndSelect = (nextTheme: 'dark' | 'light') => {
    setSelected(nextTheme)
    setTheme(nextTheme)
  }

  const confirm = () => {
    localStorage.removeItem(THEME_PREF_PENDING_KEY)
    setOpen(false)
  }

  if (!mounted || !open) return null

  return (
    <div className="fixed inset-0 z-[160000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl transition-colors ${
          isLightSelected
            ? 'border-slate-300 bg-gradient-to-b from-white to-slate-100 text-slate-900'
            : 'border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white'
        }`}
      >
        <h2 className="text-xl font-semibold tracking-tight">Choisir votre affichage</h2>
        <p className={`mt-1 text-sm ${isLightSelected ? 'text-slate-600' : 'text-slate-300'}`}>
          Aperçu de la page d&apos;accueil selon le thème.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => applyAndSelect('light')}
            className={`rounded-2xl border p-3 text-left transition ${
              selected === 'light'
                ? isLightSelected
                  ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/40'
                  : 'border-emerald-400 bg-white/[0.08] ring-1 ring-emerald-400/50'
                : isLightSelected
                  ? 'border-slate-300 bg-white/80 hover:border-slate-400'
                  : 'border-slate-600 bg-slate-800/80 hover:border-slate-400'
            }`}
          >
            <HomePreview mode="light" />
            <p className={`mt-2 text-center text-sm font-medium ${isLightSelected ? 'text-slate-900' : 'text-white'}`}>Mode jour</p>
          </button>

          <button
            type="button"
            onClick={() => applyAndSelect('dark')}
            className={`rounded-2xl border p-3 text-left transition ${
              selected === 'dark'
                ? isLightSelected
                  ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/40'
                  : 'border-emerald-400 bg-white/[0.08] ring-1 ring-emerald-400/50'
                : isLightSelected
                  ? 'border-slate-300 bg-white/80 hover:border-slate-400'
                  : 'border-slate-600 bg-slate-800/80 hover:border-slate-400'
            }`}
          >
            <HomePreview mode="dark" />
            <p className={`mt-2 text-center text-sm font-medium ${isLightSelected ? 'text-slate-900' : 'text-white'}`}>Mode nuit</p>
          </button>
        </div>

        <button
          type="button"
          onClick={confirm}
          className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Valider
        </button>
      </div>
    </div>
  )
}
