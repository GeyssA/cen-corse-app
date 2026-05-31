'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getObservationsByUser, updateObservationPhotoUrls, deleteObservation, type Observation } from '@/lib/observations'
import { getSitesByUser, updateSitePhotoUrls, deleteSite, type ObservationSite } from '@/lib/sites'
import { parsePhotoUrls, serializePhotoUrls } from '@/lib/photoUrls'
import { runSync, isOnline } from '@/lib/offlineQueue'
import { shareTextFileOnNative } from '@/lib/shareTextFileNative'
import ObservationModal from '@/components/ObservationModal'

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

function toScientificLabel(raw: string | null | undefined): string {
  const source = (raw ?? '').trim()
  if (!source) return 'Espèce non renseignée'
  const dashIdx = source.indexOf(' - ')
  if (dashIdx >= 0) {
    const candidate = source.slice(dashIdx + 3).trim()
    if (candidate) return candidate
  }
  return source
}

function parseEffectif(value: string | null | undefined): number {
  const n = parseInt((value ?? '').trim(), 10)
  if (!Number.isNaN(n) && n > 0) return n
  return 1
}

function formatDayLabel(day: string): string {
  if (!day || day === 'Sans date') return 'Sans date'
  const d = new Date(`${day}T12:00:00`)
  if (Number.isNaN(d.getTime())) return day
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}


async function downloadCsv(filename: string, content: string) {
  const text = '\uFEFF' + content
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })

  if (Capacitor.isNativePlatform()) {
    if (await shareTextFileOnNative(filename, text)) {
      return
    }
    try {
      const file = new File([blob], filename, { type: 'text/csv;charset=utf-8' })
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename })
        return
      }
    } catch {
      // suite : blob URL
    }
    const url = URL.createObjectURL(blob)
    try {
      if (window.open(url, '_blank', 'noopener,noreferrer')) {
        window.setTimeout(() => URL.revokeObjectURL(url), 3000)
        return
      }
    } catch {
      // ancre
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
}


export default function ValidationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [observations, setObservations] = useState<Observation[]>([])
  const [sites, setSites] = useState<ObservationSite[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [activeTab, setActiveTab] = useState<'observations' | 'sites'>('observations')
  const [photoViewer, setPhotoViewer] = useState<{ urls: string[]; index: number } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'observation' | 'site'
    id: string
    title: string
  } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [observationToEdit, setObservationToEdit] = useState<Observation | null>(null)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [deleteSuccessFadeOut, setDeleteSuccessFadeOut] = useState(false)
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string>('Donnée supprimée')
  const [selectedObservationIds, setSelectedObservationIds] = useState<Set<string>>(new Set())
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set())

  const isLight = theme === 'light'
  const cellText = isLight ? 'text-gray-900' : 'text-gray-100'
  const cellMuted = isLight ? 'text-gray-600' : 'text-gray-300'
  const cellMeta = isLight ? 'text-gray-600' : 'text-gray-400'
  const headerShell = isLight
    ? 'border-gray-200 bg-white/95'
    : 'border-gray-700 bg-gray-900/95'
  const thText = isLight ? 'text-gray-700' : 'text-gray-300'
  const obsScrollRef = useRef<HTMLDivElement | null>(null)
  const sitesScrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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
    setSelectedObservationIds(new Set(observations.map((o) => o.id).filter((id): id is string => !!id)))
  }, [observations])

  useEffect(() => {
    setSelectedSiteIds(new Set(sites.map((s) => s.id)))
  }, [sites])

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

  useEffect(() => {
    if (!showDeleteSuccess) return
    setDeleteSuccessFadeOut(false)
    const fadeTimer = window.setTimeout(() => setDeleteSuccessFadeOut(true), 1200)
    const hideTimer = window.setTimeout(() => setShowDeleteSuccess(false), 1600)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [showDeleteSuccess])

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

  const requestDeleteObservationRow = (id?: string, label?: string) => {
    if (!id) return
    setDeleteError(null)
    setDeleteDialog({
      type: 'observation',
      id,
      title: label?.trim() || 'cette observation',
    })
  }

  const requestDeleteSiteRow = (id: string, label?: string) => {
    setDeleteError(null)
    setDeleteDialog({
      type: 'site',
      id,
      title: label?.trim() || 'ce site',
    })
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteDialog(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteDialog || deleting) return
    if (!isOnline()) {
      setDeleteError('Connexion requise pour supprimer une donnée.')
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      if (deleteDialog.type === 'observation') {
        const { error } = await deleteObservation(deleteDialog.id)
        if (error) {
          setDeleteError(error)
          return
        }
        setDeleteSuccessMessage('Observation supprimée')
      } else {
        const { error } = await deleteSite(deleteDialog.id)
        if (error) {
          setDeleteError(error)
          return
        }
        setDeleteSuccessMessage('Site supprimé')
      }
      await loadData()
      setDeleteDialog(null)
      setShowDeleteSuccess(true)
    } finally {
      setDeleting(false)
    }
  }

  const onRowTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }

  const onRowTouchEnd = (
    e: React.TouchEvent,
    type: 'observation' | 'site',
    id: string | undefined,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dy) > 40) return
    if (dx > -70) return
    if ((containerRef.current?.scrollLeft ?? 0) > 0) return
    if (type === 'observation') {
      requestDeleteObservationRow(id)
    } else if (id) {
      requestDeleteSiteRow(id)
    }
  }

  const observationsByDay = useMemo(() => {
    const groups = new Map<string, Observation[]>()
    observations.forEach((o) => {
      const day = o.date || 'Sans date'
      if (!groups.has(day)) groups.set(day, [])
      groups.get(day)!.push(o)
    })
    return Array.from(groups.entries()).map(([day, rows]) => {
      const speciesCounts = new Map<string, number>()
      rows.forEach((row) => {
        const species = toScientificLabel(row.nom_espece)
        speciesCounts.set(species, (speciesCounts.get(species) ?? 0) + parseEffectif(row.effectif))
      })
      const speciesSummary = Array.from(speciesCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([species, count]) => ({ species, count }))
      return { day, rows, speciesSummary }
    })
  }, [observations])

  const toggleObservationSelection = (id?: string) => {
    if (!id) return
    setSelectedObservationIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSiteSelection = (id: string) => {
    setSelectedSiteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exportCsv = async () => {
    const selectedObservations = observations.filter((o) => o.id && selectedObservationIds.has(o.id))
    const selectedSites = sites.filter((s) => selectedSiteIds.has(s.id))
    if (selectedObservations.length === 0 && selectedSites.length === 0) {
      window.alert('Sélectionnez au moins une donnée à exporter.')
      return
    }

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
    selectedObservations.forEach((o) => {
      const r: string[] = ['observation']
      allCols.slice(1).forEach((k) => {
        r.push(escapeCsvCell((o as Record<string, unknown>)[k]))
      })
      rows.push(r)
    })
    selectedSites.forEach((s) => {
      const r: string[] = ['site']
      allCols.slice(1).forEach((k) => {
        r.push(escapeCsvCell((s as Record<string, unknown>)[k]))
      })
      rows.push(r)
    })
    const content = [allCols.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    await downloadCsv(`cen-corse-donnees-selection-${new Date().toISOString().slice(0, 10)}.csv`, content)
  }

  if (!user) return null

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen min-h-[100dvh] w-full ${isLight ? 'bg-gray-100' : 'bg-gray-900'}`}
        style={{ margin: 0, padding: 0, colorScheme: isLight ? 'light' : 'dark' }}
      >
        <header
          className={`sticky top-0 z-20 border-b backdrop-blur ${headerShell}`}
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <button
              onClick={() => router.push('/')}
              className={`p-2 rounded-xl ${isLight ? 'hover:bg-gray-200 text-gray-800' : 'hover:bg-gray-700 text-gray-200'}`}
              aria-label="Retour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-lg font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Mes observations
            </h1>
            <button
              onClick={() => { void exportCsv() }}
              disabled={selectedObservationIds.size === 0 && selectedSiteIds.size === 0}
              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
            >
              Exporter la sélection
            </button>
          </div>
          <div className={`max-w-6xl mx-auto px-4 pb-3 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  viewMode === 'summary'
                    ? 'bg-blue-600 text-white'
                    : isLight
                      ? 'bg-white text-gray-700 border border-gray-200'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                }`}
              >
                Synthèse par jour
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  viewMode === 'detailed'
                    ? 'bg-blue-600 text-white'
                    : isLight
                      ? 'bg-white text-gray-700 border border-gray-200'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                }`}
              >
                Observations détaillées
              </button>
            </div>
          </div>
          {viewMode === 'detailed' && (
          <div className={`flex border-t ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
            <button
              onClick={() => setActiveTab('observations')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'observations'
                  ? isLight ? 'border-b-2 border-blue-500 text-blue-700 bg-white' : 'border-b-2 border-blue-500 text-blue-400 bg-gray-900/50'
                  : isLight ? 'text-gray-600 bg-white' : 'text-gray-400 bg-gray-900/50'
              }`}
            >
              Observations ({observations.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'sites'
                  ? isLight ? 'border-b-2 border-blue-500 text-blue-700 bg-white' : 'border-b-2 border-blue-500 text-blue-400 bg-gray-900/50'
                  : isLight ? 'text-gray-600 bg-white' : 'text-gray-400 bg-gray-900/50'
              }`}
            >
              Sites ({sites.length})
            </button>
          </div>
          )}
        </header>

        <div className="max-w-6xl mx-auto p-4">
          {loading ? (
            <p className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Chargement…</p>
          ) : viewMode === 'summary' ? (
            <div className="space-y-3">
              {observationsByDay.length === 0 && (
                <p className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Aucune observation.</p>
              )}
              {observationsByDay.map((group) => (
                <div key={group.day} className={`rounded-xl border p-3 ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800/60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{formatDayLabel(group.day)}</p>
                      <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        {group.rows.length} observation(s) · {group.speciesSummary.reduce((sum, s) => sum + s.count, 0)} individu(s)
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {group.rows.map((row) => (
                      <div key={row.id ?? `${row.date}-${row.nom_espece}-${row.created_at}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className={`${isLight ? 'text-gray-700' : 'text-gray-300'} truncate flex-1`}>
                          {parseEffectif(row.effectif)}x {toScientificLabel(row.nom_espece)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setObservationToEdit(row)}
                            title="Modifier"
                            aria-label="Modifier l'observation"
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
                              isLight
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-amber-900/30 text-amber-300 border-amber-700/50 hover:bg-amber-900/45'
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteObservationRow(row.id, row.nom_espece || row.site || undefined)}
                            title="Supprimer"
                            aria-label="Supprimer l'observation"
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
                              isLight
                                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                : 'bg-red-900/30 text-red-300 border-red-700/50 hover:bg-red-900/45'
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'observations' ? (
            <div ref={obsScrollRef} className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`h-10 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <th className={`px-2 py-1.5 font-medium w-12 ${thText}`}>Sel.</th>
                    <th className={`px-2 py-1.5 font-medium w-20 ${thText}`}>Photo</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Date</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Protocole</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Passage</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Site</th>
                    <th className={`px-2 py-1.5 font-medium w-16 ${thText}`}>Présence</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Groupe</th>
                    <th className={`px-2 py-1.5 font-medium min-w-[140px] max-w-[200px] ${thText}`}>Espèce</th>
                    <th className={`px-2 py-1.5 font-medium w-16 ${thText}`}>Effectif</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Stade</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Sexe</th>
                    <th className={`px-2 py-1.5 font-medium max-w-[100px] ${thText}`}>Remarques</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Lat</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Lon</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Observateur</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Encodé le</th>
                    <th className={`px-2 py-1.5 font-medium text-right ${thText}`}>Suppr.</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((o) => (
                    <tr
                      key={o.id}
                      className={`h-10 border-b ${isLight ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-700/50 hover:bg-gray-700/30'}`}
                      onTouchStart={onRowTouchStart}
                      onTouchEnd={(e) => onRowTouchEnd(e, 'observation', o.id, obsScrollRef)}
                    >
                      <td className={`px-2 py-1.5 ${cellText}`}>
                        <input
                          type="checkbox"
                          checked={!!o.id && selectedObservationIds.has(o.id)}
                          onChange={() => toggleObservationSelection(o.id)}
                          aria-label="Sélectionner observation"
                        />
                      </td>
                      <td className={`px-2 py-1.5 ${cellText}`}>
                        {(() => {
                          const urls = parsePhotoUrls(o.photo_url)
                          if (urls.length === 0) return <span className={cellMuted}>—</span>
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {urls.map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={openPhotoViewer(urls, i)}
                                  className={`block w-12 h-12 rounded overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-gray-100' : 'bg-gray-700'}`}
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
                      <td className={`px-2 py-1.5 whitespace-nowrap ${cellText}`}>{o.date ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.protocole ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.passage ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.site ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.presence ? 'Oui' : 'Non'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.groupe ?? '—'}</td>
                      <td className={`px-2 py-1.5 min-w-[140px] max-w-[200px] truncate ${cellText}`} title={o.nom_espece ?? ''}>{o.nom_espece ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.effectif ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.stade ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.sexe ?? '—'}</td>
                      <td className={`px-2 py-1.5 max-w-[100px] truncate ${cellText}`} title={o.remarques ?? ''}>{o.remarques ?? '—'}</td>
                      <td className={`px-2 py-1.5 font-mono text-xs ${cellText}`}>{o.latitude != null ? o.latitude.toFixed(5) : '—'}</td>
                      <td className={`px-2 py-1.5 font-mono text-xs ${cellText}`}>{o.longitude != null ? o.longitude.toFixed(5) : '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{o.observateur ?? '—'}</td>
                      <td className={`px-2 py-1.5 text-xs ${cellMeta}`}>{formatDate(o.created_at)}</td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => requestDeleteObservationRow(o.id, o.nom_espece || o.site || undefined)}
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            isLight ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-red-900/30 text-red-300 hover:bg-red-900/45'
                          }`}
                        >
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {observations.length === 0 && (
                <p className={`p-6 text-center ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Aucune observation.</p>
              )}
            </div>
          ) : (
            <div ref={sitesScrollRef} className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`h-10 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <th className={`px-2 py-1.5 font-medium w-12 ${thText}`}>Sel.</th>
                    <th className={`px-2 py-1.5 font-medium w-20 ${thText}`}>Photo</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Date</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Protocole</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Nom du site</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Lat</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Lon</th>
                    <th className={`px-2 py-1.5 font-medium ${thText}`}>Encodé le</th>
                    <th className={`px-2 py-1.5 font-medium text-right ${thText}`}>Suppr.</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((s) => (
                    <tr
                      key={s.id}
                      className={`h-10 border-b ${isLight ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-700/50 hover:bg-gray-700/30'}`}
                      onTouchStart={onRowTouchStart}
                      onTouchEnd={(e) => onRowTouchEnd(e, 'site', s.id, sitesScrollRef)}
                    >
                      <td className={`px-2 py-1.5 ${cellText}`}>
                        <input
                          type="checkbox"
                          checked={selectedSiteIds.has(s.id)}
                          onChange={() => toggleSiteSelection(s.id)}
                          aria-label="Sélectionner site"
                        />
                      </td>
                      <td className={`px-2 py-1.5 ${cellText}`}>
                        {(() => {
                          const urls = parsePhotoUrls(s.photo_url)
                          if (urls.length === 0) return <span className={cellMuted}>—</span>
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {urls.map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={openPhotoViewer(urls, i)}
                                  className={`block w-12 h-12 rounded overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-gray-100' : 'bg-gray-700'}`}
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
                      <td className={`px-2 py-1.5 ${cellText}`}>{s.date ?? '—'}</td>
                      <td className={`px-2 py-1.5 ${cellText}`}>{s.protocole ?? '—'}</td>
                      <td className={`px-2 py-1.5 min-w-[120px] max-w-[180px] truncate ${cellText}`} title={s.nom_du_site ?? ''}>{s.nom_du_site ?? '—'}</td>
                      <td className={`px-2 py-1.5 font-mono text-xs ${cellText}`}>{s.latitude != null ? s.latitude.toFixed(5) : '—'}</td>
                      <td className={`px-2 py-1.5 font-mono text-xs ${cellText}`}>{s.longitude != null ? s.longitude.toFixed(5) : '—'}</td>
                      <td className={`px-2 py-1.5 text-xs ${cellMeta}`}>{formatDate(s.created_at)}</td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => requestDeleteSiteRow(s.id, s.nom_du_site || undefined)}
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            isLight ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-red-900/30 text-red-300 hover:bg-red-900/45'
                          }`}
                        >
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sites.length === 0 && (
                <p className={`p-6 text-center ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Aucun site.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modale plein écran pour voir les photos (sans quitter l'app) */}
      {photoViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/95"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo en plein écran"
        >
          <button
            type="button"
            onClick={closePhotoViewer}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-300/80 text-slate-900 transition-colors hover:bg-slate-300"
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
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-300/85 text-slate-900 transition-colors hover:bg-slate-300"
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
                className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-300/85 text-slate-900 transition-colors hover:bg-slate-300"
                style={{ right: 'max(1rem, env(safe-area-inset-right))' }}
                aria-label="Photo suivante"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span
                className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-sm text-slate-900"
                style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              >
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

      {deleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}>
            <h3 className={`text-base font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Confirmation de suppression
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Voulez-vous supprimer cette donnée ?
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              {deleteDialog.type === 'observation' ? "Observation" : "Site"} :
              <span className={`ml-1 font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {deleteDialog.title}
              </span>
            </p>
            <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Cette action est définitive.
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${isLight ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'} disabled:opacity-60`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div
          className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none transition-opacity duration-300 ${
            deleteSuccessFadeOut ? 'opacity-0' : 'opacity-100'
          }`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex flex-col items-center gap-3 rounded-lg px-8 py-6 shadow-xl text-center ${
              isLight ? 'bg-white text-emerald-600' : 'bg-gray-800 text-emerald-400'
            }`}
          >
            <svg className="w-14 h-14 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-lg font-semibold">{deleteSuccessMessage}</span>
          </div>
        </div>
      )}

      <ObservationModal
        isOpen={!!observationToEdit}
        observationToEdit={observationToEdit}
        onClose={() => setObservationToEdit(null)}
        onSuccess={() => {
          setObservationToEdit(null)
          void loadData()
        }}
      />
    </ProtectedRoute>
  )
}
