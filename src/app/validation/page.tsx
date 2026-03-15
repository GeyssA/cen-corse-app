'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getObservationsByUser, updateObservationPhotoUrls, type Observation } from '@/lib/observations'
import { getSitesByUser, updateSitePhotoUrls, type ObservationSite } from '@/lib/sites'
import { parsePhotoUrls, serializePhotoUrls } from '@/lib/photoUrls'
import { runSync, isOnline } from '@/lib/offlineQueue'

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
  const [photoViewer, setPhotoViewer] = useState<{ urls: string[]; index: number } | null>(null)

  const isLight = theme === 'light'

  const openPhotoViewer = (urls: string[], index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setPhotoViewer({ urls, index })
  }
  const closePhotoViewer = () => setPhotoViewer(null)
  const goPrev = () => photoViewer && setPhotoViewer({ ...photoViewer, index: (photoViewer.index - 1 + photoViewer.urls.length) % photoViewer.urls.length })
  const goNext = () => photoViewer && setPhotoViewer({ ...photoViewer, index: (photoViewer.index + 1) % photoViewer.urls.length })

  const loadData = useCallback(() => {
    if (!user?.id) return
    Promise.all([
      getObservationsByUser(user.id),
      getSitesByUser(user.id)
    ]).then(([obs, s]) => {
      setObservations(obs)
      setSites(s)
      setLoading(false)
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    // Synchroniser d’abord les données hors ligne pour qu’elles transitent avant de charger la liste
    const run = async () => {
      if (isOnline()) {
        await runSync()
      }
      loadData()
    }
    run()
  }, [user?.id, loadData])

  useEffect(() => {
    const onSyncCompleted = () => loadData()
    window.addEventListener('offline-sync-completed', onSyncCompleted)
    return () => window.removeEventListener('offline-sync-completed', onSyncCompleted)
  }, [loadData])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePhotoViewer()
      if (!photoViewer) return
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [photoViewer])

  const handleObservationPhotoError = async (observationId: string, failedUrl: string) => {
    const o = observations.find((x) => x.id === observationId)
    if (!o) return
    const urls = parsePhotoUrls(o.photo_url).filter((u) => u !== failedUrl)
    const { error } = await updateObservationPhotoUrls(observationId, urls)
    if (!error) {
      setObservations((prev) =>
        prev.map((obs) =>
          obs.id === observationId ? { ...obs, photo_url: serializePhotoUrls(urls) } : obs
        )
      )
    }
  }

  const handleSitePhotoError = async (siteId: string, failedUrl: string) => {
    const s = sites.find((x) => x.id === siteId)
    if (!s) return
    const urls = parsePhotoUrls(s.photo_url).filter((u) => u !== failedUrl)
    const { error } = await updateSitePhotoUrls(siteId, urls)
    if (!error) {
      setSites((prev) =>
        prev.map((site) =>
          site.id === siteId ? { ...site, photo_url: serializePhotoUrls(urls) } : site
        )
      )
    }
  }

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
      <div className={`min-h-screen min-h-[100dvh] w-full ${isLight ? 'bg-gray-100' : 'bg-gray-900'}`} style={{ margin: 0, padding: 0 }}>
        <header
          className="sticky top-0 z-20 border-b bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
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
              Exporter en .csv
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
        </header>

        <div className="max-w-6xl mx-auto p-4">
          {loading ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement…</p>
          ) : activeTab === 'observations' ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 h-10">
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 w-20">Photo</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Protocole</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Passage</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Site</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 w-16">Présence</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Groupe</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 min-w-[140px] max-w-[200px]">Espèce</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 w-16">Effectif</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Stade</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Sexe</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 max-w-[100px]">Remarques</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Lat</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Lon</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Observateur</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Encodé le</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((o) => (
                    <tr key={o.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 h-10">
                      <td className="px-2 py-1.5">
                        {(() => {
                          const urls = parsePhotoUrls(o.photo_url)
                          if (urls.length === 0) return <span className="text-gray-400">—</span>
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {urls.map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={openPhotoViewer(urls, i)}
                                  className="block w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={() => o.id && handleObservationPhotoError(o.id, url)}
                                  />
                                </button>
                              ))}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{o.date ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.protocole ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.passage ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.site ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.presence ? 'Oui' : 'Non'}</td>
                      <td className="px-2 py-1.5">{o.groupe ?? '—'}</td>
                      <td className="px-2 py-1.5 min-w-[140px] max-w-[200px] truncate" title={o.nom_espece ?? ''}>{o.nom_espece ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.effectif ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.stade ?? '—'}</td>
                      <td className="px-2 py-1.5">{o.sexe ?? '—'}</td>
                      <td className="px-2 py-1.5 max-w-[100px] truncate" title={o.remarques ?? ''}>{o.remarques ?? '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{o.latitude != null ? o.latitude.toFixed(5) : '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{o.longitude != null ? o.longitude.toFixed(5) : '—'}</td>
                      <td className="px-2 py-1.5">{o.observateur ?? '—'}</td>
                      <td className="px-2 py-1.5 text-xs text-gray-500">{formatDate(o.created_at)}</td>
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
                  <tr className="border-b border-gray-200 dark:border-gray-700 h-10">
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 w-20">Photo</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Protocole</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Nom du site</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Lat</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Lon</th>
                    <th className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300">Encodé le</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 h-10">
                      <td className="px-2 py-1.5">
                        {(() => {
                          const urls = parsePhotoUrls(s.photo_url)
                          if (urls.length === 0) return <span className="text-gray-400">—</span>
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {urls.map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={openPhotoViewer(urls, i)}
                                  className="block w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={() => handleSitePhotoError(s.id, url)}
                                  />
                                </button>
                              ))}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-2 py-1.5">{s.date ?? '—'}</td>
                      <td className="px-2 py-1.5">{s.protocole ?? '—'}</td>
                      <td className="px-2 py-1.5 min-w-[120px] max-w-[180px] truncate" title={s.nom_du_site ?? ''}>{s.nom_du_site ?? '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{s.latitude != null ? s.latitude.toFixed(5) : '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{s.longitude != null ? s.longitude.toFixed(5) : '—'}</td>
                      <td className="px-2 py-1.5 text-xs text-gray-500">{formatDate(s.created_at)}</td>
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

      {/* Modale plein écran pour voir les photos (sans quitter l'app) */}
      {photoViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo en plein écran"
        >
          <button
            type="button"
            onClick={closePhotoViewer}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {photoViewer.urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                style={{ left: 'max(1rem, env(safe-area-inset-left))' }}
                aria-label="Photo précédente"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                style={{ right: 'max(1rem, env(safe-area-inset-right))' }}
                aria-label="Photo suivante"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/80 text-sm" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                {photoViewer.index + 1} / {photoViewer.urls.length}
              </span>
            </>
          )}
          <img
            src={photoViewer.urls[photoViewer.index]}
            alt="Photo en plein écran"
            className="max-w-full max-h-full object-contain"
            onClick={closePhotoViewer}
          />
        </div>
      )}
    </ProtectedRoute>
  )
}
