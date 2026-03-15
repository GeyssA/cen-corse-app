'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { createSite, getSitesByUser, type ObservationSite } from '@/lib/sites'
import { isOnline, addPendingSite } from '@/lib/offlineQueue'
import { invalidateMapDataCache } from '@/lib/mapDataCache'
import { getObservationsByUser } from '@/lib/observations'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { serializePhotoUrls, MAX_PHOTOS } from '@/lib/photoUrls'
import { getCurrentPositionAsync, isCapacitorNative, type GeoError } from '@/lib/geolocation'
import MapPickModal from '@/components/MapPickModal'
import MapLinePickModal, { type LinePickResult } from '@/components/MapLinePickModal'

const PROTOCOLE_OPTIONS = [
  { value: 'POPReptile', label: 'POP Reptile' },
  { value: 'POPAmphibien', label: 'POP Amphibien' },
  { value: 'IPA', label: 'IPA' },
  { value: 'Données opportunistes', label: 'Données opportunistes' }
]

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

interface AddSiteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddSiteModal({ isOpen, onClose, onSuccess }: AddSiteModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [date, setDate] = useState(getTodayISO())
  const [protocole, setProtocole] = useState('')
  const [nomDuSite, setNomDuSite] = useState('')
  const [protocoleOpen, setProtocoleOpen] = useState(false)
  const protocoleRef = useRef<HTMLDivElement>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [photoItems, setPhotoItems] = useState<Array<{ file: File; preview: string }>>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoCameraRef = useRef<HTMLInputElement>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [showLinePicker, setShowLinePicker] = useState(false)
  /** Pour POP Reptile site linéaire : tracé et longueur. */
  const [pathCoordinates, setPathCoordinates] = useState<[number, number][] | null>(null)
  const [lengthMeters, setLengthMeters] = useState<number | null>(null)
  /** 'point' | 'linear' pour POP Reptile uniquement. */
  const [sitePositionType, setSitePositionType] = useState<'point' | 'linear'>('point')
  const [existingMapPoints, setExistingMapPoints] = useState<import('./MapPickContent').ExistingMapPoint[]>([])
  const [existingPointsLoaded, setExistingPointsLoaded] = useState(false)
  const [userSites, setUserSites] = useState<ObservationSite[]>([])
  const [showSuccessCheck, setShowSuccessCheck] = useState(false)
  const [successFadeOut, setSuccessFadeOut] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setExistingPointsLoaded(false)
      return
    }
    setExistingPointsLoaded(false)
    Promise.all([getSitesByUser(user.id), getObservationsByUser(user.id)])
      .then(([sites, observations]) => {
        setUserSites(sites)
        const points: import('./MapPickContent').ExistingMapPoint[] = []
        sites.forEach((s) => {
          const lat = s.latitude ?? (s.path_coordinates?.[0]?.[0])
          const lng = s.longitude ?? (s.path_coordinates?.[0]?.[1])
          if (lat != null && lng != null) {
            const point: import('./MapPickContent').ExistingMapPoint = {
              type: 'site',
              id: s.id,
              latitude: lat,
              longitude: lng,
              nom_du_site: s.nom_du_site,
              date: s.date,
              protocole: s.protocole
            }
            if (s.path_coordinates && s.path_coordinates.length >= 2) {
              point.path_coordinates = s.path_coordinates
              if (s.length_meters != null) point.length_meters = s.length_meters
            }
            points.push(point)
          }
        })
        observations.forEach((o) => {
          if (o.latitude != null && o.longitude != null) {
            points.push({
              type: 'observation',
              id: o.id ?? `${o.site}-${o.date}`,
              latitude: o.latitude,
              longitude: o.longitude,
              nom_espece: o.nom_espece,
              date: o.date,
              protocole: o.protocole,
              site: o.site,
              groupe: o.groupe,
              effectif: o.effectif,
              stade: o.stade,
              sexe: o.sexe,
              remarques: o.remarques,
              observateur: o.observateur
            })
          }
        })
        setExistingMapPoints(points)
        setExistingPointsLoaded(true)
      })
      .catch(() => {
        setUserSites([])
        setExistingMapPoints([])
        setExistingPointsLoaded(true)
      })
  }, [isOpen, user?.id])

  useEffect(() => {
    if (!protocoleOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (protocoleRef.current && !protocoleRef.current.contains(e.target as Node)) {
        setProtocoleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [protocoleOpen])

  useEffect(() => {
    if (protocole !== 'POPReptile') {
      setSitePositionType('point')
      setPathCoordinates(null)
      setLengthMeters(null)
    }
  }, [protocole])

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayISO())
      setNomDuSite('')
      setProtocole('')
      setProtocoleOpen(false)
      setSubmitError(null)
      setGeoError(null)
      setPhotoItems((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview))
        return []
      })
      setPathCoordinates(null)
      if (!isCapacitorNative()) {
        setLatitude(null)
        setLongitude(null)
        return
      }
      setGeoLoading(true)
      getCurrentPositionAsync()
        .then((pos) => {
          setLatitude(pos.latitude)
          setLongitude(pos.longitude)
          setGeoError(null)
        })
        .catch((err: GeoError) => {
          setLatitude(null)
          setLongitude(null)
          setGeoError(err.message ?? 'Position introuvable.')
        })
        .finally(() => setGeoLoading(false))
    }
  }, [isOpen])

  const getPosition = () => {
    setGeoLoading(true)
    setGeoError(null)
    getCurrentPositionAsync()
      .then((pos) => {
        setLatitude(pos.latitude)
        setLongitude(pos.longitude)
        setGeoError(null)
      })
      .catch((err: GeoError) => {
        setGeoError(err.message ?? 'Position introuvable.')
      })
      .finally(() => setGeoLoading(false))
  }

  const isLight = theme === 'light'
  const labelClass = `block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-gray-300'}`
  const inputClass = `w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors ${
    isLight
      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
      : 'bg-gray-800/80 border-gray-600 text-gray-100 placeholder-gray-400'
  }`
  const sectionTitleClass = `text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-gray-400'}`

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!protocole.trim()) {
      setSubmitError('Veuillez saisir un protocole.')
      return
    }
    if (!nomDuSite.trim()) {
      setSubmitError('Veuillez saisir le nom du site.')
      return
    }
    if (!user) {
      setSubmitError('Vous devez être connecté pour ajouter un site.')
      return
    }
    const isLinear = protocole === 'POPReptile' && pathCoordinates != null && pathCoordinates.length >= 2
    const hasPoint = latitude != null && longitude != null
    if (!isLinear && !hasPoint) {
      setSubmitError('Une position GPS est obligatoire pour enregistrer le site.')
      return
    }
    if (isLinear && (!lengthMeters || lengthMeters <= 0)) {
      setSubmitError('Veuillez tracer une ligne d’au moins 2 points sur la carte.')
      return
    }
    setSubmitLoading(true)
    try {
      const lat = isLinear ? pathCoordinates![0][0] : latitude!
      const lng = isLinear ? pathCoordinates![0][1] : longitude!
      const payload = {
        date,
        protocole: protocole.trim(),
        nom_du_site: nomDuSite.trim(),
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        photo_url: undefined as string | null | undefined,
        path_coordinates: isLinear ? pathCoordinates : null,
        length_meters: isLinear ? lengthMeters! : null
      }

      if (!isOnline()) {
        await addPendingSite(payload, photoItems.map((i) => i.file))
        setShowSuccessCheck(true)
        setSuccessFadeOut(false)
        setTimeout(() => setSuccessFadeOut(true), 1100)
        setTimeout(() => {
          setShowSuccessCheck(false)
          onSuccess?.()
          onClose()
        }, 1600)
        setSubmitLoading(false)
        return
      }

      const photoUrls: string[] = []
      if (photoItems.length > 0 && user) {
        for (const item of photoItems) {
          const url = await uploadPhoto(item.file, 'site', user.id)
          if (!url) {
            setSubmitError('Impossible d’envoyer une ou plusieurs photos.')
            setSubmitLoading(false)
            return
          }
          photoUrls.push(url)
        }
      }
      const photo_url = serializePhotoUrls(photoUrls) ?? undefined
      const created = await createSite({
        date,
        protocole: protocole.trim(),
        nom_du_site: nomDuSite.trim(),
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        photo_url: photo_url,
        path_coordinates: isLinear ? pathCoordinates : null,
        length_meters: isLinear ? lengthMeters! : null
      })
      if (created) {
        invalidateMapDataCache()
        setShowSuccessCheck(true)
        setSuccessFadeOut(false)
        setTimeout(() => setSuccessFadeOut(true), 1100)
        setTimeout(() => {
          setShowSuccessCheck(false)
          onSuccess?.()
          onClose()
        }, 1600)
      } else {
        setSubmitError('Impossible d’enregistrer le site.')
      }
    } catch {
      setSubmitError('Une erreur est survenue.')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div className={`fixed inset-0 z-[100] flex flex-col safe-area-modal ${isLight ? 'bg-slate-50' : 'bg-gray-950'}`} role="dialog" aria-modal="true" aria-labelledby="add-site-modal-title">
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
        <div className={`relative w-full min-h-full ${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
        <header className={`sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}>
          <h2 id="add-site-modal-title" className={`text-xl font-semibold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Nouveau site d’observation
          </h2>
          <button onClick={onClose} className={`p-2 -m-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-800 text-gray-400'}`} aria-label="Fermer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="px-4 sm:px-6 py-5 pb-8 max-w-2xl mx-auto space-y-6">
          <section>
            <h3 className={`${sectionTitleClass} mb-3`}>Identification</h3>
            <div className="space-y-4">
          <div>
            <label className={labelClass}>Date</label>
            <div className="date-input-wrapper">
              <div
                className={`date-input-overlay ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-800/80 border-gray-600 text-gray-100'}`}
                aria-hidden
              >
                <span>{date ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                <svg className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="cursor-pointer"
                aria-label="Date"
              />
            </div>
            <p className={`mt-1 text-xs ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
              Par défaut : aujourd’hui
            </p>
          </div>

          <div ref={protocoleRef} className="relative">
            <label className={labelClass}>Protocole</label>
            <div className={`${inputClass} flex items-center justify-between gap-2`}>
              <input
                type="text"
                value={protocole}
                onChange={(e) => setProtocole(e.target.value)}
                onFocus={() => setProtocoleOpen(true)}
                placeholder="Sélectionner ou saisir un protocole…"
                className={`flex-1 min-w-0 bg-transparent border-none outline-none py-0.5 ${protocole ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}`}
                aria-expanded={protocoleOpen}
                aria-haspopup="listbox"
                aria-controls="protocole-listbox"
                id="protocole-input"
              />
              {protocole ? (
                <button
                  type="button"
                  onClick={() => {
                    setProtocole('')
                    setProtocoleOpen(false)
                  }}
                  className={`p-1.5 rounded-md transition-colors shrink-0 ${isLight ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'text-gray-500 hover:bg-gray-700 hover:text-gray-300'}`}
                  aria-label="Effacer le protocole"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setProtocoleOpen((o) => !o)}
                className={`p-1.5 shrink-0 rounded-md transition-transform duration-200 ${protocoleOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                aria-label={protocoleOpen ? 'Fermer la liste' : 'Ouvrir la liste'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
            {protocoleOpen && (
              <div
                id="protocole-listbox"
                role="listbox"
                className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden ${
                  isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'
                }`}
              >
                {PROTOCOLE_OPTIONS.filter((opt) => !protocole || opt.label.toLowerCase().includes(protocole.toLowerCase()) || opt.value.toLowerCase().includes(protocole.toLowerCase())).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    onClick={() => {
                      setProtocole(opt.value)
                      setProtocoleOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                      protocole === opt.value
                        ? isLight ? 'bg-teal-50 text-teal-800' : 'bg-teal-900/30 text-teal-200'
                        : isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200'
                    }`}
                  >
                    {protocole === opt.value && (
                      <svg className="w-4 h-4 shrink-0 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Nom du site</label>
            <input
              type="text"
              value={nomDuSite}
              onChange={(e) => setNomDuSite(e.target.value)}
              className={inputClass}
              placeholder="Ex. Mare Sud, Transect A…"
            />
            {nomDuSite.trim() && (() => {
              const q = nomDuSite.trim().toLowerCase()
              const matching = userSites.filter((s) => s.nom_du_site.toLowerCase().includes(q))
              if (matching.length === 0) return null
              return (
                <div className={`mt-2 rounded-lg border px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-600'}`}>
                  <p className={`text-xs font-medium mb-1.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    Sites existants contenant « {nomDuSite.trim()} » (à titre indicatif, non cliquables)
                  </p>
                  <ul className="space-y-1" aria-hidden>
                    {matching.slice(0, 10).map((s) => (
                      <li key={s.id} className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'} pointer-events-none select-none`}>
                        {s.nom_du_site}
                      </li>
                    ))}
                    {matching.length > 10 && (
                      <li className={`text-xs ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>… et {matching.length - 10} autre(s)</li>
                    )}
                  </ul>
                </div>
              )
            })()}
          </div>
            </div>
          </section>

          <section>
            <h3 className={`${sectionTitleClass} mb-3`}>Photos <span className="font-normal normal-case">(max {MAX_PHOTOS})</span></h3>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && photoItems.length < MAX_PHOTOS) {
                  setPhotoItems((prev) => [...prev, { file: f, preview: URL.createObjectURL(f) }])
                }
                e.target.value = ''
              }}
            />
            <input
              ref={photoCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && photoItems.length < MAX_PHOTOS) {
                  setPhotoItems((prev) => [...prev, { file: f, preview: URL.createObjectURL(f) }])
                }
                e.target.value = ''
              }}
            />
            {photoItems.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {photoItems.map((item, index) => (
                    <div key={index} className="relative group">
                      <img src={item.preview} alt={`Aperçu ${index + 1}`} className="rounded-lg h-28 w-full object-cover border border-gray-200 dark:border-gray-600" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(item.preview)
                          setPhotoItems((prev) => prev.filter((_, i) => i !== index))
                        }}
                        className={`absolute top-1.5 right-1.5 p-1.5 rounded-md text-white opacity-90 hover:opacity-100 ${isLight ? 'bg-red-500 hover:bg-red-600' : 'bg-red-600 hover:bg-red-500'}`}
                        aria-label={`Supprimer la photo ${index + 1}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                {photoItems.length < MAX_PHOTOS && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className={`flex-1 rounded-lg px-3 py-2.5 border border-dashed flex flex-col items-center justify-center gap-1 text-sm ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => photoCameraRef.current?.click()}
                      className={`flex-1 rounded-lg px-3 py-2.5 border border-dashed flex flex-col items-center justify-center gap-1 text-sm ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
                      </svg>
                      Prendre une photo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={`flex-1 rounded-lg px-3 py-2.5 border border-dashed flex flex-col items-center justify-center gap-1 text-sm ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => photoCameraRef.current?.click()}
                  className={`flex-1 rounded-lg px-3 py-2.5 border border-dashed flex flex-col items-center justify-center gap-1 text-sm ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
                  </svg>
                  Prendre une photo
                </button>
              </div>
            )}
          </section>

          <section>
            <h3 className={`${sectionTitleClass} mb-3`}>Position GPS</h3>
            {protocole === 'POPReptile' && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSitePositionType('point')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    sitePositionType === 'point'
                      ? isLight ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                      : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Site ponctuel
                </button>
                <button
                  type="button"
                  onClick={() => setSitePositionType('linear')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    sitePositionType === 'linear'
                      ? isLight ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                      : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Site linéaire
                </button>
              </div>
            )}

            {((protocole !== 'POPReptile') || sitePositionType === 'point') && (
              <>
            {(latitude != null && longitude != null) ? (
              <div className="space-y-2">
                <div className={`rounded-lg px-3.5 py-2.5 border flex items-center gap-3 ${isLight ? 'bg-teal-50/80 border-teal-200' : 'bg-teal-900/20 border-teal-700/50'}`}>
                  <svg className="w-5 h-5 shrink-0 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isLight ? 'text-teal-800' : 'text-teal-200'}`}>Position enregistrée</p>
                    <p className={`text-xs font-mono ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={getPosition}
                  disabled={geoLoading}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'} disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {geoLoading ? 'Récupération…' : 'Actualiser'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                  Choisir sur la carte
                </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={getPosition}
                  disabled={geoLoading}
                  className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-center gap-3 w-full ${isLight ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'} disabled:opacity-70`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {geoLoading ? 'Demande en cours…' : 'Récupérer ma position'}
                </button>
                {geoError && <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{geoError}</p>}
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                  Choisir sur la carte
                </button>
              </div>
            )}
            </>
            )}

            {protocole === 'POPReptile' && sitePositionType === 'linear' && (
              <div className="space-y-2">
                {pathCoordinates != null && pathCoordinates.length >= 2 ? (
                  <>
                    <div className={`rounded-lg px-3.5 py-2.5 border flex items-center gap-3 ${isLight ? 'bg-teal-50/80 border-teal-200' : 'bg-teal-900/20 border-teal-700/50'}`}>
                      <svg className="w-5 h-5 shrink-0 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isLight ? 'text-teal-800' : 'text-teal-200'}`}>Tracé enregistré</p>
                        <p className={`text-xs font-mono ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>Longueur : {lengthMeters?.toFixed(1) ?? 0} m</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLinePicker(true)}
                      className={`w-full rounded-lg px-3.5 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                      Modifier le tracé
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLinePicker(true)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-center gap-3 ${isLight ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Tracer la ligne sur la carte
                  </button>
                )}
              </div>
            )}
          </section>

          {submitError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3.5 py-2">
              {submitError}
            </p>
          )}

          {showSuccessCheck && (
            <div
              className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none transition-opacity duration-300 ${
                successFadeOut ? 'opacity-0' : 'opacity-100'
              }`}
              role="status"
              aria-live="polite"
            >
              <div
                className={`flex flex-col items-center gap-3 rounded-lg px-8 py-6 shadow-xl ${
                  isLight ? 'bg-white text-emerald-600' : 'bg-gray-800 text-emerald-400'
                }`}
              >
                <svg className="w-14 h-14 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-lg font-semibold">Site enregistré</span>
              </div>
            </div>
          )}

          <footer className={`flex gap-3 pt-4 pb-1 border-t ${isLight ? 'border-gray-100' : 'border-gray-800'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg text-sm font-medium ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
              className="flex-1 py-3 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {submitLoading ? 'Enregistrement…' : 'Enregistrer le site'}
            </button>
          </footer>
        </div>
        </div>
      </div>
    </div>
    <MapPickModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialCenter={latitude != null && longitude != null ? [latitude, longitude] : undefined}
        existingPoints={existingMapPoints}
        existingPointsLoaded={existingPointsLoaded}
        onPick={(lat, lng) => {
          setLatitude(lat)
          setLongitude(lng)
          setGeoError(null)
          setShowMapPicker(false)
        }}
      />
      <MapLinePickModal
        isOpen={showLinePicker}
        onClose={() => setShowLinePicker(false)}
        initialCenter={
          (pathCoordinates != null && pathCoordinates.length > 0
            ? pathCoordinates[Math.floor(pathCoordinates.length / 2)]
            : latitude != null && longitude != null
              ? [latitude, longitude]
              : undefined) as [number, number] | undefined
        }
        initialPath={pathCoordinates ?? undefined}
        existingPoints={existingMapPoints}
        existingPointsLoaded={existingPointsLoaded}
        onConfirm={({ path, lengthMeters: len }) => {
          setPathCoordinates(path)
          setLengthMeters(len)
          setShowLinePicker(false)
        }}
      />
    </>
  )
}
