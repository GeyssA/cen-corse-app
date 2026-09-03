'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { createSite, getSitesByUser, updateSite, type ObservationSite } from '@/lib/sites'
import { isOnline, addPendingSite } from '@/lib/offlineQueue'
import { invalidateMapDataCache } from '@/lib/mapDataCache'
import { getObservationsByUser } from '@/lib/observations'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { parsePhotoUrls, serializePhotoUrls, MAX_PHOTOS } from '@/lib/photoUrls'
import { getMaxPhotoFileLabelFr, validatePhotoFileForUpload } from '@/lib/photoUploadLimits'
import { getCurrentPositionAsync, isCapacitorNative, type GeoError } from '@/lib/geolocation'
import { getAireByNameForUser, getAireNamesForUser, upsertAireForUser } from '@/lib/siteAires'
import { choiceCheckIcon, choiceChipSelected, choiceChipUnselected, choiceListRowIdle, choiceListRowSelected } from '@/lib/choiceSelection'
import MapPickModal from '@/components/MapPickModal'
import MapLinePickModal, { type LinePickResult } from '@/components/MapLinePickModal'
import SimpleDateInput from '@/components/ui/SimpleDateInput'
import { useLockMainChrome } from '@/hooks/useLockMainChrome'

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
  /** Édition depuis la carte : préremplissage + envoi en mise à jour. */
  editingSite?: ObservationSite | null
}

export default function AddSiteModal({ isOpen, onClose, onSuccess, editingSite = null }: AddSiteModalProps) {
  const { theme } = useTheme()
  useLockMainChrome(isOpen)
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
  const [photoItems, setPhotoItems] = useState<Array<{ file: File; preview: string; loadFailed?: boolean }>>([])
  const [photoFileError, setPhotoFileError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoCameraRef = useRef<HTMLInputElement>(null)

  const addPhotoFile = useCallback((f: File) => {
    const err = validatePhotoFileForUpload(f)
    if (err) {
      setPhotoFileError(err)
      return
    }
    setPhotoFileError(null)
    setPhotoItems((prev) => {
      if (prev.length >= MAX_PHOTOS) return prev
      return [...prev, { file: f, preview: URL.createObjectURL(f) }]
    })
  }, [])
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
  const [successMessage, setSuccessMessage] = useState<string>('Site enregistré')
  const [aireName, setAireName] = useState('')
  const [knownAireNames, setKnownAireNames] = useState<string[]>([])
  const [siteNumber, setSiteNumber] = useState('')
  const [showSlowSubmitHint, setShowSlowSubmitHint] = useState(false)

  const isPopProtocol = protocole === 'POPReptile' || protocole === 'POPAmphibien'
  const popProtocole = isPopProtocol ? (protocole as 'POPReptile' | 'POPAmphibien') : null
  const aireCandidateSites = userSites.filter((s) => popProtocole != null && s.protocole === popProtocole)

  const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const aireSites = (() => {
    if (!popProtocole || !aireName.trim()) return [] as ObservationSite[]
    const pattern = new RegExp(`^${escapeRegExp(aireName.trim())}\\s+(\\d+)$`, 'i')
    return aireCandidateSites.filter((s) => pattern.test(s.nom_du_site.trim()))
  })()
  const aireSiteNumbers = (() => {
    if (!aireName.trim()) return [] as number[]
    const pattern = new RegExp(`^${escapeRegExp(aireName.trim())}\\s+(\\d+)$`, 'i')
    const nums = aireSites
      .map((s) => {
        const m = s.nom_du_site.trim().match(pattern)
        return m ? Number(m[1]) : null
      })
      .filter((n): n is number => Number.isInteger(n) && n > 0)
    return [...new Set(nums)].sort((a, b) => a - b)
  })()
  const suggestedNextNumber = aireSiteNumbers.length > 0 ? aireSiteNumbers[aireSiteNumbers.length - 1] + 1 : 1

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
    if (!isOpen) return
    if (editingSite) {
      setDate(editingSite.date || getTodayISO())
      setProtocole(editingSite.protocole)
      const pop = editingSite.protocole === 'POPReptile' || editingSite.protocole === 'POPAmphibien'
      if (pop) {
        const m = editingSite.nom_du_site.trim().match(/^(.+?)\s+(\d+)$/)
        if (m) {
          setAireName(m[1].trim())
          setSiteNumber(m[2])
        } else {
          setAireName('')
          setSiteNumber('')
        }
        setNomDuSite('')
      } else {
        setNomDuSite(editingSite.nom_du_site)
        setAireName('')
        setSiteNumber('')
      }
      const path = editingSite.path_coordinates
      const isLinear = path != null && path.length >= 2
      setPathCoordinates(isLinear ? path : null)
      setLengthMeters(editingSite.length_meters ?? null)
      setSitePositionType(isLinear ? 'linear' : 'point')
      setLatitude(editingSite.latitude ?? null)
      setLongitude(editingSite.longitude ?? null)
      setProtocoleOpen(false)
      setSubmitError(null)
      setGeoError(null)
      setPhotoFileError(null)
      setPhotoItems((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview))
        return []
      })
      setKnownAireNames(user?.id ? getAireNamesForUser(user.id).slice(0, 50) : [])
      setGeoLoading(false)
      return
    }
    setDate(getTodayISO())
    setNomDuSite('')
    setProtocole('')
    setProtocoleOpen(false)
    setSubmitError(null)
    setGeoError(null)
    setPhotoFileError(null)
    setPhotoItems((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview))
      return []
    })
    setPathCoordinates(null)
    setAireName('')
    setSiteNumber('')
    setKnownAireNames(user?.id ? getAireNamesForUser(user.id).slice(0, 50) : [])
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
  }, [isOpen, editingSite?.id])

  useEffect(() => {
    if (!submitLoading) {
      setShowSlowSubmitHint(false)
      return
    }
    const t = window.setTimeout(() => setShowSlowSubmitHint(true), 5000)
    return () => {
      window.clearTimeout(t)
      setShowSlowSubmitHint(false)
    }
  }, [submitLoading])

  useEffect(() => {
    if (!user?.id || !popProtocole) return
    setKnownAireNames(getAireNamesForUser(user.id, popProtocole).slice(0, 50))
  }, [user?.id, popProtocole])

  useEffect(() => {
    if (!isPopProtocol || !aireName.trim()) return
    if (!siteNumber) setSiteNumber(String(suggestedNextNumber))
  }, [isPopProtocol, aireName, suggestedNextNumber, siteNumber])

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
  const labelClass = `block text-base font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`
  const inputClass = `w-full min-h-12 rounded-xl border px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors ${
    isLight
      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
      : 'bg-gray-800/80 border-gray-600 text-gray-100 placeholder-gray-400'
  }`
  const sectionTitleClass = `text-sm font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-gray-400'}`

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!protocole.trim()) {
      setSubmitError('Veuillez saisir un protocole.')
      return
    }
    if (!isPopProtocol && !nomDuSite.trim()) {
      setSubmitError('Veuillez saisir le nom du site.')
      return
    }
    if (isPopProtocol && !aireName.trim()) {
      setSubmitError('Pour POP Reptile / POP Amphibien, le nom de l’aire est obligatoire.')
      return
    }
    if (isPopProtocol && (!siteNumber.trim() || !/^\d+$/.test(siteNumber.trim()) || Number(siteNumber.trim()) <= 0)) {
      setSubmitError('Pour un site POP, le numéro du site doit être un entier positif (1, 2, 3...).')
      return
    }
    if (!user) {
      setSubmitError('Vous devez être connecté pour ajouter un site.')
      return
    }
    if (editingSite && !isOnline()) {
      setSubmitError('La modification nécessite une connexion réseau.')
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
      const finalSiteName = isPopProtocol
        ? `${aireName.trim()} ${Number(siteNumber.trim())}`
        : nomDuSite.trim()

      if (
        userSites.some(
          (s) =>
            s.protocole === protocole.trim() &&
            s.nom_du_site.trim().toLowerCase() === finalSiteName.toLowerCase() &&
            (!editingSite || s.id !== editingSite.id)
        )
      ) {
        setSubmitError('Ce nom de site existe déjà pour ce protocole.')
        setSubmitLoading(false)
        return
      }

      const payload = {
        date,
        protocole: protocole.trim(),
        nom_du_site: finalSiteName,
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        photo_url: undefined as string | null | undefined,
        path_coordinates: isLinear ? pathCoordinates : null,
        length_meters: isLinear ? lengthMeters! : null
      }

      if (!editingSite && !isOnline()) {
        for (const it of photoItems) {
          const v = validatePhotoFileForUpload(it.file)
          if (v) {
            setSubmitError(v)
            setSubmitLoading(false)
            return
          }
        }
        await addPendingSite(payload, photoItems.map((i) => i.file))
        setSuccessMessage('Site enregistré')
        setShowSuccessCheck(true)
        setSuccessFadeOut(false)
        setTimeout(() => setSuccessFadeOut(true), 1100)
        setTimeout(() => {
          setShowSuccessCheck(false)
          setSuccessMessage('Site enregistré')
          onSuccess?.()
          onClose()
        }, 1600)
        setSubmitLoading(false)
        return
      }

      const photoUrls: string[] = []
      if (editingSite) {
        photoUrls.push(...parsePhotoUrls(editingSite.photo_url))
      }
      if (photoItems.length > 0 && user) {
        for (const item of photoItems) {
          const r = await uploadPhoto(item.file, 'site', user.id)
          if (!r.ok) {
            setSubmitError(r.message)
            setSubmitLoading(false)
            return
          }
          photoUrls.push(r.publicUrl)
        }
      }
      const photo_url = serializePhotoUrls(photoUrls) ?? undefined
      if (editingSite) {
        const { error: siteUpdErr } = await updateSite(editingSite.id, {
          date,
          protocole: protocole.trim(),
          nom_du_site: finalSiteName,
          latitude: lat,
          longitude: lng,
          photo_url: photo_url ?? null,
          path_coordinates: isLinear ? pathCoordinates : null,
          length_meters: isLinear ? lengthMeters! : null
        })
        if (siteUpdErr) {
          setSubmitError(siteUpdErr)
        } else {
          invalidateMapDataCache()
          setSuccessMessage('Site modifié')
          setShowSuccessCheck(true)
          setSuccessFadeOut(false)
          setTimeout(() => setSuccessFadeOut(true), 1100)
          setTimeout(() => {
            setShowSuccessCheck(false)
            setSuccessMessage('Site enregistré')
            onSuccess?.()
            onClose()
          }, 1600)
        }
      } else {
        const created = await createSite({
          date,
          protocole: protocole.trim(),
          nom_du_site: finalSiteName,
          user_id: user.id,
          latitude: lat,
          longitude: lng,
          photo_url: photo_url,
          path_coordinates: isLinear ? pathCoordinates : null,
          length_meters: isLinear ? lengthMeters! : null
        })
        if (created) {
          if (isPopProtocol && popProtocole && aireName.trim()) {
            upsertAireForUser(user.id, aireName, popProtocole, [...aireSites.map((s) => s.id), created.id])
          }
          invalidateMapDataCache()
          setSuccessMessage('Site enregistré')
          setShowSuccessCheck(true)
          setSuccessFadeOut(false)
          setTimeout(() => setSuccessFadeOut(true), 1100)
          setTimeout(() => {
            setShowSuccessCheck(false)
            setSuccessMessage('Site enregistré')
            onSuccess?.()
            onClose()
          }, 1600)
        } else {
          setSubmitError('Impossible d’enregistrer le site.')
        }
      }
    } catch {
      setSubmitError('Une erreur est survenue.')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <>
    <div className={`fixed inset-0 z-[200] flex flex-col safe-area-modal ${isLight ? 'bg-slate-50' : 'bg-gray-950'}`} role="dialog" aria-modal="true" aria-labelledby="add-site-modal-title">
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
        <div className={`relative w-full min-h-full ${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
        <header className={`sticky top-0 z-10 flex flex-col gap-0 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}>
          {showSlowSubmitHint && (
            <div
              className={`px-4 py-2 text-xs sm:text-sm border-b ${isLight ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-amber-950/80 text-amber-100 border-amber-800/60'}`}
              role="status"
            >
              Enregistrement en cours… Si le réseau est lent ou les photos lourdes, cela peut prendre un peu plus de
              temps.
            </div>
          )}
          <div className={`flex items-center justify-between px-4 sm:px-6 py-4`}>
          <h2 id="add-site-modal-title" className={`text-xl font-semibold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {editingSite ? 'Modifier le site' : 'Nouveau site d’observation'}
          </h2>
          <button onClick={onClose} className={`p-2 -m-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-800 text-gray-400'}`} aria-label="Fermer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-5 pb-8 max-w-2xl mx-auto space-y-7">
          <section>
            <h3 className={`${sectionTitleClass} mb-3`}>Identification</h3>
            <div className="space-y-5">
          <div>
            <label className={labelClass}>Date</label>
            <SimpleDateInput
              value={date}
              onChange={setDate}
              isLight={isLight}
              ariaLabel="Date du site"
            />
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
                    className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                      protocole === opt.value
                        ? choiceListRowSelected(isLight)
                        : choiceListRowIdle(isLight)
                    }`}
                  >
                    {protocole === opt.value && (
                      <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isPopProtocol && (
            <div className={`rounded-xl border p-3 ${isLight ? 'bg-teal-50/40 border-teal-200' : 'bg-teal-900/15 border-teal-700/40'}`}>
              <label className={labelClass}>Nom de l’aire (obligatoire)</label>
              <input
                type="text"
                value={aireName}
                onChange={(e) => setAireName(e.target.value)}
                list="aire-name-suggestions"
                className={inputClass}
                placeholder="Ex. Aire Vallée du Liamone"
              />
              <datalist id="aire-name-suggestions">
                {knownAireNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>

              <p className={`mt-2 text-xs ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                Les noms des sites POP suivent le format : <span className="font-semibold">Nom de l’aire + numéro</span>.
              </p>
              <div className={`mt-2 rounded-lg border px-3 py-2 ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800/60'}`}>
                <label className={labelClass}>Numéro du site dans l’aire</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={siteNumber}
                  onChange={(e) => setSiteNumber(e.target.value)}
                  className={inputClass}
                  placeholder={`Ex. ${suggestedNextNumber}`}
                />
                <p className={`mt-2 text-xs ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                  Nom généré : <span className="font-semibold">{aireName.trim() ? `${aireName.trim()} ${siteNumber || suggestedNextNumber}` : '—'}</span>
                </p>
                <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  Numéro conseillé : {suggestedNextNumber}
                </p>
              </div>
              <div className={`mt-2 max-h-36 overflow-y-auto rounded-lg border ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800/60'}`}>
                {aireSites.length === 0 ? (
                  <p className={`px-3 py-2 text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    Aucun site déjà enregistré dans cette aire.
                  </p>
                ) : (
                  <div className="px-3 py-2">
                    <p className={`text-xs font-medium mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Sites déjà ajoutés dans l’aire :</p>
                    <p className={`text-xs ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>
                      {aireSites.map((s) => s.nom_du_site).join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!isPopProtocol && (
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
          )}
            </div>
          </section>

          <section>
            <h3 className={`${sectionTitleClass} mb-1`}>
              Photos <span className="font-normal normal-case">(max {MAX_PHOTOS} · {getMaxPhotoFileLabelFr()} chacune)</span>
            </h3>
            <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Au-delà de {getMaxPhotoFileLabelFr()} par image, l’ajout est refusé. Aperçu gris = supprimez et reprenez une image plus légère.
            </p>
            {photoFileError && (
              <p
                className="mb-3 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2"
                role="alert"
              >
                {photoFileError}
              </p>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && photoItems.length < MAX_PHOTOS) {
                  addPhotoFile(f)
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
                  addPhotoFile(f)
                }
                e.target.value = ''
              }}
            />
            {photoItems.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {photoItems.map((item, index) => (
                    <div key={index} className="relative group">
                      {item.loadFailed ? (
                        <div
                          className={`rounded-lg h-28 w-full border flex items-center justify-center p-2 text-center text-[10px] leading-tight ${
                            isLight ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-800/80 border-gray-600 text-gray-300'
                          }`}
                        >
                          Aperçu indisponible. Supprimez et reprenez (max. {getMaxPhotoFileLabelFr()}).
                        </div>
                      ) : (
                        <img
                          src={item.preview}
                          alt={`Aperçu ${index + 1}`}
                          className="rounded-lg h-28 w-full object-cover border border-gray-200 dark:border-gray-600"
                          onError={() => {
                            setPhotoItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, loadFailed: true } : it))
                            )
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(item.preview)
                          setPhotoItems((prev) => prev.filter((_, i) => i !== index))
                          setPhotoFileError(null)
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
                      className={`flex-1 rounded-xl px-3 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => photoCameraRef.current?.click()}
                      className={`flex-1 rounded-xl px-3 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
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
                  className={`flex-1 rounded-xl px-3 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => photoCameraRef.current?.click()}
                  className={`flex-1 rounded-xl px-3 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-teal-200' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50 hover:border-teal-600/50'}`}
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
                  className={`flex-1 min-h-12 py-3 rounded-xl text-base font-medium transition-colors ${
                    sitePositionType === 'point' ? choiceChipSelected(isLight) : choiceChipUnselected(isLight)
                  }`}
                >
                  Site ponctuel
                </button>
                <button
                  type="button"
                  onClick={() => setSitePositionType('linear')}
                  className={`flex-1 min-h-12 py-3 rounded-xl text-base font-medium transition-colors ${
                    sitePositionType === 'linear' ? choiceChipSelected(isLight) : choiceChipUnselected(isLight)
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
                <div className={`rounded-xl px-3.5 py-3 border flex items-center gap-3 ${isLight ? 'bg-teal-50/80 border-teal-200' : 'bg-teal-900/20 border-teal-700/50'}`}>
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
                  className={`rounded-xl px-3.5 py-3 text-base font-medium flex items-center justify-center gap-2 min-h-12 ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'} disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {geoLoading ? 'Récupération…' : 'Actualiser'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className={`rounded-xl px-3.5 py-3 text-base font-medium flex items-center justify-center gap-2 min-h-12 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
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
                  className={`rounded-xl px-4 py-3.5 text-base font-medium flex items-center justify-center gap-3 w-full min-h-12 ${isLight ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'} disabled:opacity-70`}
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
                  className={`w-full rounded-xl px-3.5 py-3 text-base font-medium flex items-center justify-center gap-2 min-h-12 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
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
                    <div className={`rounded-xl px-3.5 py-3 border flex items-center gap-3 ${isLight ? 'bg-teal-50/80 border-teal-200' : 'bg-teal-900/20 border-teal-700/50'}`}>
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
                      className={`w-full rounded-xl px-3.5 py-3 text-base font-medium flex items-center justify-center gap-2 min-h-12 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                      Modifier le tracé
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLinePicker(true)}
                    className={`w-full rounded-xl px-4 py-3.5 text-base font-medium flex items-center justify-center gap-3 min-h-12 ${isLight ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
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
                <span className="text-lg font-semibold">{successMessage}</span>
              </div>
            </div>
          )}

          <footer className={`flex gap-3 pt-4 pb-1 border-t ${isLight ? 'border-gray-100' : 'border-gray-800'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 min-h-12 py-3.5 rounded-xl text-base font-medium ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
              className="flex-1 min-h-12 py-3.5 rounded-xl text-base font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
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
    </>,
    document.body
  )
}
