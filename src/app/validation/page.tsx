'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getObservationsByUser, type Observation } from '@/lib/observations'
import { getSitesByUser, type ObservationSite } from '@/lib/sites'
import { parsePhotoUrls } from '@/lib/photoUrls'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

function escapeCsvCell(val: unknown): string {
  if (val == null) return ''
  const s = String(val)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function ValidationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [observations, setObservations] = useState<Observation[]>([])
  const [sites, setSites] = useState<ObservationSite[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'observations' | 'sites'>('observations')

  const isLight = theme === 'light'

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    Promise.all([
      getObservationsByUser(user.id),
      getSitesByUser(user.id)
    ]).then(([obs, s]) => {
      setObservations(obs)
      setSites(s)
      setLoading(false)
    })
  }, [user?.id])

  const exportCsv = () => {
    const allObsKeys = [
      'id', 'date', 'protocole', 'passage', 'site', 'presence', 'groupe', 'nom_espece',
      'effectif', 'stade', 'sexe', 'remarques', 'latitude', 'longitude', 'observateur',
      'user_id', 'photo_url', 'validated', 'validated_at', 'created_at'
    ] as const
    const allSiteKeys = [
      'id', 'date', 'protocole', 'nom_du_site', 'latitude', 'longitude',
      'user_id', 'photo_url', 'validated', 'validated_at', 'created_at',
      'path_coordinates', 'length_meters'
    ] as const
    const allCols = ['type', ...new Set([...allObsKeys, ...allSiteKeys])]
    const rows: string[][] = []
    observations.forEach((o) => {
      const r: string[] = ['observation']
      allCols.slice(1).forEach((k) => {
        r.push(escapeCsvCell((o as Record<string, unknown>)[k]))
      })
      rows.push(r)
    })
    sites.forEach((s) => {
      const r: string[] = ['site']
      allCols.slice(1).forEach((k) => {
        r.push(escapeCsvCell((s as Record<string, unknown>)[k]))
      })
      rows.push(r)
    })
    const content = [allCols.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    downloadCsv(`cen-corse-donnees-${new Date().toISOString().slice(0, 10)}.csv`, content)
  }

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${isLight ? 'bg-gray-100' : 'bg-gray-900'}`}>
        <div className="sticky top-0 z-20 border-b bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Retour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
              Export des données
            </h1>
            <button
              onClick={exportCsv}
              disabled={observations.length === 0 && sites.length === 0}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              Exporter en CSV
            </button>
          </div>
          <div className="flex border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('observations')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'observations' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} ${isLight ? 'bg-white' : 'bg-gray-900/50'}`}
            >
              Observations ({observations.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'sites' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} ${isLight ? 'bg-white' : 'bg-gray-900/50'}`}
            >
              Sites ({sites.length})
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4">
          {loading ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement…</p>
          ) : activeTab === 'observations' ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Photo</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Protocole</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Passage</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Site</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Présence</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Groupe</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Espèce</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Effectif</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Stade</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Sexe</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Remarques</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Lat</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Lon</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Observateur</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Encodé le</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((o) => (
                    <tr key={o.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="p-2">
                        {(() => {
                          const urls = parsePhotoUrls(o.photo_url)
                          if (urls.length === 0) return <span className="text-gray-400">—</span>
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="p-2">{o.date ?? '—'}</td>
                      <td className="p-2">{o.protocole ?? '—'}</td>
                      <td className="p-2">{o.passage ?? '—'}</td>
                      <td className="p-2">{o.site ?? '—'}</td>
                      <td className="p-2">{o.presence ? 'Oui' : 'Non'}</td>
                      <td className="p-2">{o.groupe ?? '—'}</td>
                      <td className="p-2">{o.nom_espece ?? '—'}</td>
                      <td className="p-2">{o.effectif ?? '—'}</td>
                      <td className="p-2">{o.stade ?? '—'}</td>
                      <td className="p-2">{o.sexe ?? '—'}</td>
                      <td className="p-2 max-w-[120px] truncate" title={o.remarques ?? ''}>{o.remarques ?? '—'}</td>
                      <td className="p-2 font-mono text-xs">{o.latitude != null ? o.latitude.toFixed(5) : '—'}</td>
                      <td className="p-2 font-mono text-xs">{o.longitude != null ? o.longitude.toFixed(5) : '—'}</td>
                      <td className="p-2">{o.observateur ?? '—'}</td>
                      <td className="p-2 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {observations.length === 0 && (
                <p className="p-6 text-center text-gray-500 dark:text-gray-400">Aucune observation.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Photo</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Protocole</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Nom du site</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Lat</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Lon</th>
                    <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Encodé le</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="p-2">
                        {(() => {
                          const urls = parsePhotoUrls(s.photo_url)
                          if (urls.length === 0) return <span className="text-gray-400">—</span>
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="p-2">{s.date ?? '—'}</td>
                      <td className="p-2">{s.protocole ?? '—'}</td>
                      <td className="p-2">{s.nom_du_site ?? '—'}</td>
                      <td className="p-2 font-mono text-xs">{s.latitude != null ? s.latitude.toFixed(5) : '—'}</td>
                      <td className="p-2 font-mono text-xs">{s.longitude != null ? s.longitude.toFixed(5) : '—'}</td>
                      <td className="p-2 text-xs text-gray-500">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sites.length === 0 && (
                <p className="p-6 text-center text-gray-500 dark:text-gray-400">Aucun site.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
