'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { createSite } from '@/lib/sites'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { getCurrentPositionAsync, isCapacitorNative, type GeoError } from '@/lib/geolocation'
import MapPickModal from '@/components/MapPickModal'
import MapLinePickModal, { type LinePickResult } from '@/components/MapLinePickModal'

const PROTOCOLE_OPTIONS = [
  { value: 'POPReptile', label: 'POP Reptile' },
  { value: 'POPAmphibien', label: 'POP Amphibien' },
  { value: 'IPA', label: 'IPA' },
  { value: 'Autre', label: 'Autre' }
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
  const [date] = useState(getTodayISO())
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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoCameraRef = useRef<HTMLInputElement>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [showLinePicker, setShowLinePicker] = useState(false)
  /** Pour POP Reptile site linéaire : tracé et longueur. */
  const [pathCoordinates, setPathCoordinates] = useState<[number, number][] | null>(null)
  const [lengthMeters, setLengthMeters] = useState<number | null>(null)
  /** 'point' | 'linear' pour POP Reptile uniquement. */
  const [sitePositionType, setSitePositionType] = useState<'point' | 'linear'>('point')

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
      setNomDuSite('')
      setProtocole('')
      setSubmitError(null)
      setGeoError(null)
      setPhotoFile(null)
      setPathCoordinates(null)
      setLengthMeters(null)
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
      setPhotoPreviewUrl(null)
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
  const inputClass = `w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
    isLight
      ? 'bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500'
      : 'bg-gray-800/80 border-gray-600 text-gray-100 placeholder-gray-400'
  }`

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!protocole) {
      setSubmitError('Veuillez sélectionner un protocole.')
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
      let photo_url: string | null = null
      if (photoFile && user) {
        photo_url = await uploadPhoto(photoFile, 'site', user.id)
        if (!photo_url) setSubmitError('Impossible d’envoyer la photo.')
      }
      if (photoFile && user && !photo_url) {
        setSubmitLoading(false)
        return
      }
      const lat = isLinear ? pathCoordinates![0][0] : latitude!
      const lng = isLinear ? pathCoordinates![0][1] : longitude!
      const created = await createSite({
        date,
        protocole,
        nom_du_site: nomDuSite.trim(),
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        photo_url: photo_url ?? undefined,
        path_coordinates: isLinear ? pathCoordinates : null,
        length_meters: isLinear ? lengthMeters! : null
      })
      if (created) {
        onSuccess?.()
        onClose()
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isLight ? 'border-gray-200 bg-white/95' : 'border-gray-700/50 bg-gray-900/95'} backdrop-blur`}>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Ajouter un site
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-gray-700 text-gray-300'}`}
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={date}
              readOnly
              className={`${inputClass} opacity-80 cursor-default`}
              aria-readonly
            />
            <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Renseignée automatiquement
            </p>
          </div>

          <div ref={protocoleRef} className="relative">
            <label className={labelClass}>Protocole</label>
            <button
              type="button"
              onClick={() => setProtocoleOpen((o) => !o)}
              className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
            >
              <span className={protocole ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                {protocole ? PROTOCOLE_OPTIONS.find((o) => o.value === protocole)?.label ?? protocole : 'Sélectionner un protocole…'}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${protocoleOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {protocoleOpen && (
              <div
                className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden ${
                  isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'
                }`}
              >
                {PROTOCOLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setProtocole(opt.value)
                      setProtocoleOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                      protocole === opt.value
                        ? isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300'
                        : isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200'
                    }`}
                  >
                    {protocole === opt.value && (
                      <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
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
          </div>

          <div>
            <label className={labelClass}>Photo</label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  setPhotoFile(f)
                  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
                  setPhotoPreviewUrl(URL.createObjectURL(f))
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
                if (f) {
                  setPhotoFile(f)
                  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
                  setPhotoPreviewUrl(URL.createObjectURL(f))
                }
                e.target.value = ''
              }}
            />
            {photoPreviewUrl ? (
              <div className="space-y-2">
                <img src={photoPreviewUrl} alt="Aperçu" className="rounded-xl max-h-40 object-cover w-full border border-gray-200 dark:border-gray-600" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    URL.revokeObjectURL(photoPreviewUrl)
                    setPhotoPreviewUrl(null)
                  }}
                  className={`text-sm ${isLight ? 'text-red-600 hover:text-red-700' : 'text-red-400 hover:text-red-300'}`}
                >
                  Supprimer la photo
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={`flex-1 rounded-xl px-4 py-3 border border-dashed flex flex-col items-center justify-center gap-1.5 text-sm ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => photoCameraRef.current?.click()}
                  className={`flex-1 rounded-xl px-4 py-3 border border-dashed flex flex-col items-center justify-center gap-1.5 text-sm ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50'}`}
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

          <div>
            <label className={labelClass}>Position GPS</label>
            {protocole === 'POPReptile' && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSitePositionType('point')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                    sitePositionType === 'point'
                      ? isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                      : isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Site ponctuel
                </button>
                <button
                  type="button"
                  onClick={() => setSitePositionType('linear')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                    sitePositionType === 'linear'
                      ? isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                      : isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'
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
                <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-700/50'}`}>
                  <svg className="w-5 h-5 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isLight ? 'text-green-800' : 'text-green-200'}`}>Position enregistrée</p>
                    <p className={`text-xs font-mono ${isLight ? 'text-green-700' : 'text-green-300'}`}>{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getPosition}
                  disabled={geoLoading}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'} disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {geoLoading ? 'Récupération…' : 'Actualiser la position'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200' : 'bg-sky-900/40 text-sky-300 hover:bg-sky-800/60 border border-sky-600/50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                  Choisir sur la carte
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={getPosition}
                  disabled={geoLoading}
                  className={`rounded-xl px-4 py-4 text-sm font-semibold flex items-center justify-center gap-3 w-full ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500'} disabled:opacity-70 shadow-lg`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {geoLoading ? 'Demande en cours…' : 'Récupérer ma position'}
                </button>
                {geoError && <p className="text-sm text-amber-600 mt-1">{geoError}</p>}
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200' : 'bg-sky-900/40 text-sky-300 hover:bg-sky-800/60 border border-sky-600/50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                  Choisir sur la carte
                </button>
              </>
            )}
            </>
            )}

            {protocole === 'POPReptile' && sitePositionType === 'linear' && (
              <div className="space-y-2">
                {pathCoordinates != null && pathCoordinates.length >= 2 ? (
                  <>
                    <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-700/50'}`}>
                      <svg className="w-5 h-5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isLight ? 'text-green-800' : 'text-green-200'}`}>Tracé enregistré</p>
                        <p className={`text-xs font-mono ${isLight ? 'text-green-700' : 'text-green-300'}`}>Longueur : {lengthMeters?.toFixed(1) ?? 0} m</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLinePicker(true)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200' : 'bg-sky-900/40 text-sky-300 hover:bg-sky-800/60 border border-sky-600/50'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                      Modifier le tracé
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLinePicker(true)}
                    className={`w-full rounded-xl px-4 py-4 text-sm font-semibold flex items-center justify-center gap-3 ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500'} shadow-lg`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Tracer la ligne sur la carte
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl text-sm font-medium ${isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitLoading ? 'Enregistrement…' : 'Enregistrer le site'}
            </button>
          </div>
        </div>
      </div>
      <MapPickModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialCenter={latitude != null && longitude != null ? [latitude, longitude] : undefined}
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
        onConfirm={({ path, lengthMeters: len }) => {
          setPathCoordinates(path)
          setLengthMeters(len)
          setShowLinePicker(false)
        }}
      />
    </div>
  )
}
