'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { createObservation } from '@/lib/observations'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { getSitesByUserAndProtocole, type ObservationSite } from '@/lib/sites'
import { getCurrentPositionAsync, isCapacitorNative, type GeoError } from '@/lib/geolocation'
import MapPickModal from '@/components/MapPickModal'

const PROTOCOLE_OPTIONS = [
  { value: 'POPReptile', label: 'POP Reptile' },
  { value: 'POPAmphibien', label: 'POP Amphibien' },
  { value: 'IPA', label: 'IPA' },
  { value: 'Hors protocole', label: 'Hors protocole' }
]

const GROUPE_OPTIONS = [
  { value: 'Amphibiens', label: 'Amphibiens' },
  { value: 'Reptiles', label: 'Reptiles' },
  { value: 'Oiseaux', label: 'Oiseaux' },
  { value: 'Odonates', label: 'Odonates' },
  { value: 'Lépidoptères', label: 'Lépidoptères' },
  { value: 'Mammifères', label: 'Mammifères' },
  { value: 'Plantes', label: 'Plantes' }
]

const STADE_OPTIONS = [
  { value: 'Adulte', label: 'Adulte' },
  { value: 'Sub-Adulte', label: 'Sub-Adulte' },
  { value: 'Juvénile', label: 'Juvénile' },
  { value: 'Imago', label: 'Imago' },
  { value: 'Larve', label: 'Larve' },
  { value: 'Ponte', label: 'Ponte' }
]

const SEXE_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Femelle', label: 'Femelle' },
  { value: 'Indéterminé', label: 'Indéterminé' }
]

const AMPHIBIENS_ESPECES = [
  'Hyla sarda',
  'Pelophylax lessonae bergeri',
  'Bufotes viridis balearcius',
  'Discoglossus sardus',
  'Discoglossus montalentii',
  'Euproctus montanus',
  'Salamandra corsica'
]

const REPTILES_ESPECES = [
  'Hierophis viridiflavus',
  'Natrix helvetica corsa',
  'Podarcis tiliguerta',
  'Podarcis siculus',
  'Algyroides fitzingeri',
  'Tarentola mauritanica',
  'Hemidactylus turcicus',
  'Euleptes europaea',
  'Archaeolacerta bedriagae',
  'Testudo hermanni hermanni'
]

interface ObservationForm {
  date: string
  protocole: string
  passage: string
  site: string
  presence: boolean
  groupe: string
  nom_espece: string
  effectif: string
  stade: string
  sexe: string
  remarques: string
}

type FormKey = keyof ObservationForm

// Icône épingle (conserver la valeur pour la prochaine saisie)
function PinIcon({ pinned, isLight }: { pinned: boolean; isLight: boolean }) {
  const color = pinned ? (isLight ? 'text-blue-600' : 'text-blue-400') : (isLight ? 'text-gray-400' : 'text-gray-500')
  return (
    <svg className={`w-4 h-4 ${color}`} fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  )
}

interface ObservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  /** Incrémenter pour forcer le rechargement des sites (ex. après ajout d’un site). */
  sitesRefreshKey?: number
}

function getTodayISO(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export default function ObservationModal({ isOpen, onClose, onSuccess, sitesRefreshKey }: ObservationModalProps) {
  const { theme } = useTheme()
  const { user, profile } = useAuth()
  const [form, setForm] = useState<ObservationForm>({
    date: getTodayISO(),
    protocole: '',
    passage: '',
    site: '',
    presence: false,
    groupe: '',
    nom_espece: '',
    effectif: '',
    stade: '',
    sexe: '',
    remarques: ''
  })
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [protocoleOpen, setProtocoleOpen] = useState(false)
  const protocoleRef = useRef<HTMLDivElement>(null)
  const [groupeOpen, setGroupeOpen] = useState(false)
  const groupeRef = useRef<HTMLDivElement>(null)
  const [stadeOpen, setStadeOpen] = useState(false)
  const stadeRef = useRef<HTMLDivElement>(null)
  const [sexeOpen, setSexeOpen] = useState(false)
  const sexeRef = useRef<HTMLDivElement>(null)
  const [siteOpen, setSiteOpen] = useState(false)
  const siteRef = useRef<HTMLDivElement>(null)
  const [especeOpen, setEspeceOpen] = useState(false)
  const especeRef = useRef<HTMLDivElement>(null)
  const [especeAutreMode, setEspeceAutreMode] = useState(false)
  const [sites, setSites] = useState<ObservationSite[]>([])
  const [siteCustomMode, setSiteCustomMode] = useState(false)
  const [protocoleCustomMode, setProtocoleCustomMode] = useState(false)
  const [groupeCustomMode, setGroupeCustomMode] = useState(false)
  const [stadeCustomMode, setStadeCustomMode] = useState(false)
  const [sexeCustomMode, setSexeCustomMode] = useState(false)
  const [pinned, setPinned] = useState<Partial<Record<FormKey, boolean>>>({})
  const [showSuccessCheck, setShowSuccessCheck] = useState(false)
  const [successFadeOut, setSuccessFadeOut] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoCameraRef = useRef<HTMLInputElement>(null)

  const isLight = theme === 'light'
  const togglePin = (field: FormKey) => setPinned((p) => ({ ...p, [field]: !p[field] }))
  const isHorsProtocole = form.protocole === 'Hors protocole'

  const resetForm = () => {
    const defaultForm: ObservationForm = {
      date: getTodayISO(),
      protocole: '',
      passage: '',
      site: '',
      presence: false,
      groupe: '',
      nom_espece: '',
      effectif: '',
      stade: '',
      sexe: '',
      remarques: ''
    }
    const next = { ...defaultForm }
    ;(Object.keys(pinned) as FormKey[]).forEach((key) => {
      if (pinned[key] && key in next) (next as Record<string, unknown>)[key] = form[key]
    })
    setForm(next)
    setSiteCustomMode(sites.some((s) => s.nom_du_site === next.site) ? false : !!next.site)
    setProtocoleCustomMode(!PROTOCOLE_OPTIONS.some((o) => o.value === next.protocole) && !!next.protocole)
    setGroupeCustomMode(!GROUPE_OPTIONS.some((o) => o.value === next.groupe) && !!next.groupe)
    setStadeCustomMode(!STADE_OPTIONS.some((o) => o.value === next.stade) && !!next.stade)
    setSexeCustomMode(!SEXE_OPTIONS.some((o) => o.value === next.sexe) && !!next.sexe)
    setEspeceAutreMode(
      (next.groupe === 'Amphibiens' || next.groupe === 'Reptiles') &&
        !!next.nom_espece &&
        !(next.groupe === 'Amphibiens' ? AMPHIBIENS_ESPECES : REPTILES_ESPECES).includes(next.nom_espece)
    )
    setSubmitError(null)
    setPhotoFile(null)
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoPreviewUrl(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Fermer la liste Protocole au clic extérieur
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

  // Fermer la liste Groupe au clic extérieur
  useEffect(() => {
    if (!groupeOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (groupeRef.current && !groupeRef.current.contains(e.target as Node)) {
        setGroupeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [groupeOpen])

  // Fermer la liste Stade au clic extérieur
  useEffect(() => {
    if (!stadeOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (stadeRef.current && !stadeRef.current.contains(e.target as Node)) {
        setStadeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [stadeOpen])

  // Fermer la liste Sexe au clic extérieur
  useEffect(() => {
    if (!sexeOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sexeRef.current && !sexeRef.current.contains(e.target as Node)) {
        setSexeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sexeOpen])

  // Fermer la liste Site au clic extérieur
  useEffect(() => {
    if (!siteOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) {
        setSiteOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [siteOpen])

  // Fermer la liste Espèce (Amphibiens) au clic extérieur
  useEffect(() => {
    if (!especeOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (especeRef.current && !especeRef.current.contains(e.target as Node)) {
        setEspeceOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [especeOpen])

  // Réinitialiser le mode "Autre" espèce si on quitte Amphibiens/Reptiles
  useEffect(() => {
    if (form.groupe !== 'Amphibiens' && form.groupe !== 'Reptiles') setEspeceAutreMode(false)
  }, [form.groupe])

  // Charger les sites du user pour le protocole sélectionné
  useEffect(() => {
    if (!user?.id || !form.protocole) {
      setSites([])
      return
    }
    getSitesByUserAndProtocole(user.id, form.protocole).then(setSites)
  }, [user?.id, form.protocole, isOpen, sitesRefreshKey])

  // Réinitialiser le formulaire à l'ouverture. En app (Capacitor) : récup auto de la position (après 1ère autorisation). En run dev (navigateur) : pas d'auto pour éviter le refus silencieux — l'utilisateur clique sur le bouton.
  useEffect(() => {
    if (!isOpen) return
    setForm((f) => ({ ...f, date: getTodayISO() }))
    setSiteCustomMode(false)
    setProtocoleCustomMode(false)
    setGroupeCustomMode(false)
    setStadeCustomMode(false)
    setSexeCustomMode(false)
    setEspeceAutreMode(false)
    setSubmitError(null)
    setGeoError(null)
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

  const handleSubmit = async () => {
    setSubmitError(null)
    if (latitude == null || longitude == null) {
      setSubmitError('Une position GPS est obligatoire pour enregistrer l’observation.')
      return
    }
    if (!user) {
      setSubmitError('Vous devez être connecté pour enregistrer une observation.')
      return
    }
    if (form.effectif.trim() !== '') {
      const effectifNum = Number(form.effectif)
      if (Number.isNaN(effectifNum) || effectifNum < 0) {
        setSubmitError("L'effectif doit être un nombre positif.")
        return
      }
    }
    setSubmitLoading(true)
    try {
      let photo_url: string | null = null
      if (photoFile && user) {
        photo_url = await uploadPhoto(photoFile, 'observation', user.id)
        if (!photo_url) setSubmitError('Impossible d’envoyer la photo.')
      }
      if (photoFile && user && !photo_url) {
        setSubmitLoading(false)
        return
      }
      const result = await createObservation({
        ...form,
        latitude,
        longitude,
        observateur: profile?.full_name ?? '',
        user_id: user.id,
        photo_url: photo_url ?? undefined
      })
      if (result.data) {
        const defaultForm: ObservationForm = {
          date: getTodayISO(),
          protocole: '',
          passage: '',
          site: '',
          presence: false,
          groupe: '',
          nom_espece: '',
          effectif: '',
          stade: '',
          sexe: '',
          remarques: ''
        }
        const nextForm = { ...defaultForm }
        ;(Object.keys(pinned) as FormKey[]).forEach((key) => {
          if (pinned[key] && key in nextForm) (nextForm as any)[key] = form[key]
        })
        setForm(nextForm)
        setSiteCustomMode(sites.some((s) => s.nom_du_site === nextForm.site) ? false : !!nextForm.site)
        setProtocoleCustomMode(!PROTOCOLE_OPTIONS.some((o) => o.value === nextForm.protocole) && !!nextForm.protocole)
        setGroupeCustomMode(!GROUPE_OPTIONS.some((o) => o.value === nextForm.groupe) && !!nextForm.groupe)
        setStadeCustomMode(!STADE_OPTIONS.some((o) => o.value === nextForm.stade) && !!nextForm.stade)
        setSexeCustomMode(!SEXE_OPTIONS.some((o) => o.value === nextForm.sexe) && !!nextForm.sexe)
        setEspeceAutreMode(
          (nextForm.groupe === 'Amphibiens' || nextForm.groupe === 'Reptiles') &&
            !!nextForm.nom_espece &&
            !(nextForm.groupe === 'Amphibiens' ? AMPHIBIENS_ESPECES : REPTILES_ESPECES).includes(nextForm.nom_espece)
        )
        setSuccessFadeOut(false)
        setShowSuccessCheck(true)
        setTimeout(() =>         setSuccessFadeOut(true), 1100)
        setTimeout(() => setShowSuccessCheck(false), 1600)
        setPhotoFile(null)
        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
        setPhotoPreviewUrl(null)
        onSuccess?.()
        // Ne pas fermer : l'utilisateur peut enchaîner une autre donnée sur le même point
      } else {
        setSubmitError('Impossible d’enregistrer l’observation. Vérifiez la configuration Supabase.')
      }
    } catch (e) {
      setSubmitError('Erreur lors de l’enregistrement.')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (!isOpen) return null

  const inputClass = `w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
    isLight
      ? 'bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500'
      : 'bg-gray-800/80 border-gray-600 text-gray-100 placeholder-gray-400'
  }`
  const labelClass = `block text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`
  const labelRowClass = 'flex items-center justify-between gap-2 mb-1.5'
  const pinButtonTitle = (field: FormKey) => (pinned[field] ? 'Ne plus conserver cette valeur' : 'Conserver pour la prochaine saisie')

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isLight ? 'border-gray-200 bg-white/95' : 'border-gray-700/50 bg-gray-900/95'} backdrop-blur`}>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Nouvelle observation naturaliste
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-gray-700 text-gray-300'}`}
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Date (auto) */}
          <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Date</label>
              <button type="button" onClick={() => togglePin('date')} title={pinButtonTitle('date')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('date')}>
                <PinIcon pinned={!!pinned.date} isLight={isLight} />
              </button>
            </div>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div ref={protocoleRef} className="relative">
            <div className={labelRowClass}>
              <label className={labelClass}>Protocole</label>
              <button type="button" onClick={() => togglePin('protocole')} title={pinButtonTitle('protocole')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('protocole')}>
                <PinIcon pinned={!!pinned.protocole} isLight={isLight} />
              </button>
            </div>
            {protocoleCustomMode ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setProtocoleCustomMode(false)}
                  className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}
                >
                  Choisir dans la liste
                </button>
                <input
                  type="text"
                  value={form.protocole}
                  onChange={(e) => setForm((f) => ({ ...f, protocole: e.target.value }))}
                  className={inputClass}
                  placeholder="Protocole (saisie libre)"
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setProtocoleOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                >
                  <span className={form.protocole ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                    {form.protocole
                      ? PROTOCOLE_OPTIONS.find((o) => o.value === form.protocole)?.label ?? form.protocole
                      : 'Sélectionner un protocole…'}
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
                      isLight
                        ? 'bg-white border-gray-200 shadow-gray-200/50'
                        : 'bg-gray-800 border-gray-600 shadow-black/30'
                    }`}
                  >
                    {PROTOCOLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, protocole: opt.value }))
                          setProtocoleOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                          form.protocole === opt.value
                            ? isLight
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-blue-900/30 text-blue-300'
                            : isLight
                              ? 'hover:bg-gray-50 text-gray-800'
                              : 'hover:bg-gray-700/80 text-gray-200'
                        }`}
                      >
                        {form.protocole === opt.value && (
                          <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setProtocoleCustomMode(true)
                        setProtocoleOpen(false)
                        if (!form.protocole) setForm((f) => ({ ...f, protocole: '' }))
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                    >
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, protocole: '' }))
                        setProtocoleOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t ${
                        isLight
                          ? 'border-gray-100 text-gray-500 hover:bg-gray-50'
                          : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Supprimer la sélection</span>
                </button>
              </div>
                )}
              </>
            )}
          </div>

          {!isHorsProtocole && (
          <>
          <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Passage</label>
              <button type="button" onClick={() => togglePin('passage')} title={pinButtonTitle('passage')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('passage')}>
                <PinIcon pinned={!!pinned.passage} isLight={isLight} />
              </button>
            </div>
            {(form.protocole === 'POPReptile' || form.protocole === 'POPAmphibien') ? (
              <div className="flex flex-wrap gap-2">
                {(form.protocole === 'POPReptile' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]).map((num) => {
                  const value = String(num)
                  const selected = form.passage === value
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, passage: value }))}
                      className={`min-w-[2.75rem] py-3 rounded-xl text-sm font-semibold transition-all ${
                        selected
                          ? isLight
                            ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400 ring-offset-2 ring-offset-white'
                            : 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900'
                          : isLight
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            : 'bg-gray-700/80 text-gray-200 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      {num}
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                type="text"
                value={form.passage}
                onChange={(e) => setForm((f) => ({ ...f, passage: e.target.value }))}
                className={inputClass}
                placeholder="Passage"
              />
            )}
          </div>

          <div ref={siteRef} className="relative">
            <div className={labelRowClass}>
              <label className={labelClass}>Site</label>
              <button type="button" onClick={() => togglePin('site')} title={pinButtonTitle('site')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('site')}>
                <PinIcon pinned={!!pinned.site} isLight={isLight} />
              </button>
            </div>
            {!form.protocole ? (
              <div className={`${inputClass} opacity-75 cursor-default`}>
                <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Sélectionnez d’abord un protocole</span>
              </div>
            ) : siteCustomMode ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={form.site}
                  onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
                  className={inputClass}
                  placeholder="Nom du site (saisie libre)"
                />
                <button
                  type="button"
                  onClick={() => { setSiteCustomMode(false); setForm((f) => ({ ...f, site: '' })) }}
                  className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}
                >
                  Choisir un site existant
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSiteOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                >
                  <span className={form.site ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                    {form.site || 'Sélectionner un site…'}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${siteOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {siteOpen && (
                  <div
                    className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden max-h-56 overflow-y-auto ${
                      isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'
                    }`}
                  >
                    {sites.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, site: s.nom_du_site }))
                          setSiteOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                          form.site === s.nom_du_site
                            ? isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300'
                            : isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200'
                        }`}
                      >
                        {form.site === s.nom_du_site && (
                          <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{s.nom_du_site}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSiteCustomMode(true)
                        setSiteOpen(false)
                        setForm((f) => ({ ...f, site: '' }))
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t ${
                        isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'
                      }`}
                    >
                      <span>Saisie libre…</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Présence</label>
              <button type="button" onClick={() => togglePin('presence')} title={pinButtonTitle('presence')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('presence')}>
                <PinIcon pinned={!!pinned.presence} isLight={isLight} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, presence: true }))}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  form.presence
                    ? isLight
                      ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400 ring-offset-2 ring-offset-white'
                      : 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-900'
                    : isLight
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, presence: false }))}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  !form.presence
                    ? isLight
                      ? 'bg-gray-600 text-white shadow-md ring-2 ring-gray-500 ring-offset-2 ring-offset-white'
                      : 'bg-gray-600 text-white shadow-md ring-2 ring-gray-500 ring-offset-2 ring-offset-gray-900'
                    : isLight
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                Non
              </button>
            </div>
          </div>
          </>
          )}

          <div ref={groupeRef} className="relative">
            <div className={labelRowClass}>
              <label className={labelClass}>Groupe</label>
              <button type="button" onClick={() => togglePin('groupe')} title={pinButtonTitle('groupe')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('groupe')}>
                <PinIcon pinned={!!pinned.groupe} isLight={isLight} />
              </button>
            </div>
            {groupeCustomMode ? (
              <div className="space-y-1">
                <button type="button" onClick={() => setGroupeCustomMode(false)} className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}>
                  Choisir dans la liste
                </button>
                <input
                  type="text"
                  value={form.groupe}
                  onChange={(e) => setForm((f) => ({ ...f, groupe: e.target.value }))}
                  className={inputClass}
                  placeholder="Groupe (saisie libre)"
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setGroupeOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                >
                  <span className={form.groupe ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                    {form.groupe
                      ? GROUPE_OPTIONS.find((o) => o.value === form.groupe)?.label ?? form.groupe
                      : 'Sélectionner un groupe…'}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${groupeOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {groupeOpen && (
                  <div
                    className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden max-h-56 overflow-y-auto ${
                      isLight
                        ? 'bg-white border-gray-200 shadow-gray-200/50'
                        : 'bg-gray-800 border-gray-600 shadow-black/30'
                    }`}
                  >
                    {GROUPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, groupe: opt.value }))
                          setGroupeOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                          form.groupe === opt.value
                            ? isLight
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-blue-900/30 text-blue-300'
                            : isLight
                              ? 'hover:bg-gray-50 text-gray-800'
                              : 'hover:bg-gray-700/80 text-gray-200'
                        }`}
                      >
                        {form.groupe === opt.value && (
                          <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setGroupeCustomMode(true)
                        setGroupeOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                    >
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, groupe: '' }))
                        setGroupeOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Supprimer la sélection</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div ref={especeRef} className="relative">
            <div className={labelRowClass}>
              <label className={labelClass}>Nom espèce</label>
              <button type="button" onClick={() => togglePin('nom_espece')} title={pinButtonTitle('nom_espece')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('nom_espece')}>
                <PinIcon pinned={!!pinned.nom_espece} isLight={isLight} />
              </button>
            </div>
            {(form.groupe === 'Amphibiens' || form.groupe === 'Reptiles') && !especeAutreMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setEspeceOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                >
                  <span className={form.nom_espece ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                    {form.nom_espece || 'Sélectionner une espèce…'}
                  </span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${especeOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {especeOpen && (
                  <div className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden max-h-56 overflow-y-auto ${isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'}`}>
                    {(form.groupe === 'Amphibiens' ? AMPHIBIENS_ESPECES : REPTILES_ESPECES).map((esp) => (
                      <button
                        key={esp}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, nom_espece: esp }))
                          setEspeceOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${form.nom_espece === esp ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300') : (isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200')}`}
                      >
                        {form.nom_espece === esp && (
                          <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{esp}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEspeceAutreMode(true)
                        setEspeceOpen(false)
                        setForm((f) => ({ ...f, nom_espece: '' }))
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                    >
                      <span>Autre (saisie libre)…</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1">
                {(form.groupe === 'Amphibiens' || form.groupe === 'Reptiles') && especeAutreMode && (
                  <button
                    type="button"
                    onClick={() => setEspeceAutreMode(false)}
                    className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}
                  >
                    Choisir dans la liste {form.groupe === 'Amphibiens' ? 'Amphibiens' : 'Reptiles'}
                  </button>
                )}
                <input
                  type="text"
                  value={form.nom_espece}
                  onChange={(e) => setForm((f) => ({ ...f, nom_espece: e.target.value }))}
                  className={inputClass}
                  placeholder="Nom de l'espèce"
                />
              </div>
            )}
          </div>

          <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Effectif</label>
              <button type="button" onClick={() => togglePin('effectif')} title={pinButtonTitle('effectif')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('effectif')}>
                <PinIcon pinned={!!pinned.effectif} isLight={isLight} />
              </button>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={form.effectif}
              onChange={(e) => setForm((f) => ({ ...f, effectif: e.target.value }))}
              className={inputClass}
              placeholder="Nombre (optionnel)"
              inputMode="numeric"
            />
          </div>

          <div ref={stadeRef} className="relative">
            <div className={labelRowClass}>
              <label className={labelClass}>Stade</label>
              <button type="button" onClick={() => togglePin('stade')} title={pinButtonTitle('stade')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('stade')}>
                <PinIcon pinned={!!pinned.stade} isLight={isLight} />
              </button>
            </div>
            {stadeCustomMode ? (
              <div className="space-y-1">
                <button type="button" onClick={() => setStadeCustomMode(false)} className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}>
                  Choisir dans la liste
                </button>
                <input
                  type="text"
                  value={form.stade}
                  onChange={(e) => setForm((f) => ({ ...f, stade: e.target.value }))}
                  className={inputClass}
                  placeholder="Stade (saisie libre)"
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStadeOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                >
                  <span className={form.stade ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                    {form.stade ? STADE_OPTIONS.find((o) => o.value === form.stade)?.label ?? form.stade : 'Sélectionner un stade…'}
                  </span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${stadeOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {stadeOpen && (
                  <div className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden max-h-56 overflow-y-auto ${isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'}`}>
                    {STADE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, stade: opt.value })); setStadeOpen(false) }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${form.stade === opt.value ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300') : (isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200')}`}
                      >
                        {form.stade === opt.value && <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setStadeCustomMode(true); setStadeOpen(false) }} className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button type="button" onClick={() => { setForm((f) => ({ ...f, stade: '' })); setStadeOpen(false) }} className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span>Supprimer la sélection</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div ref={sexeRef} className="relative">
            <div className={labelRowClass}>
              <label className={labelClass}>Sexe</label>
              <button type="button" onClick={() => togglePin('sexe')} title={pinButtonTitle('sexe')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('sexe')}>
                <PinIcon pinned={!!pinned.sexe} isLight={isLight} />
              </button>
            </div>
            {sexeCustomMode ? (
              <div className="space-y-1">
                <button type="button" onClick={() => setSexeCustomMode(false)} className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}>
                  Choisir dans la liste
                </button>
                <input
                  type="text"
                  value={form.sexe}
                  onChange={(e) => setForm((f) => ({ ...f, sexe: e.target.value }))}
                  className={inputClass}
                  placeholder="Sexe (saisie libre)"
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSexeOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                >
                  <span className={form.sexe ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                    {form.sexe ? SEXE_OPTIONS.find((o) => o.value === form.sexe)?.label ?? form.sexe : 'Sélectionner…'}
                  </span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${sexeOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {sexeOpen && (
                  <div className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'}`}>
                    {SEXE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, sexe: opt.value })); setSexeOpen(false) }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${form.sexe === opt.value ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300') : (isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200')}`}
                      >
                        {form.sexe === opt.value && <svg className="w-4 h-4 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setSexeCustomMode(true); setSexeOpen(false) }} className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button type="button" onClick={() => { setForm((f) => ({ ...f, sexe: '' })); setSexeOpen(false) }} className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span>Supprimer la sélection</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Remarques</label>
              <button type="button" onClick={() => togglePin('remarques')} title={pinButtonTitle('remarques')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('remarques')}>
                <PinIcon pinned={!!pinned.remarques} isLight={isLight} />
              </button>
            </div>
            <textarea
              value={form.remarques}
              onChange={(e) => setForm((f) => ({ ...f, remarques: e.target.value }))}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Remarques"
              rows={3}
            />
          </div>

          {/* Photo */}
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

          {/* Géolocalisation — obligatoire */}
          <div className={`pt-4 border-t ${isLight ? 'border-gray-100' : 'border-gray-700/50'}`}>
            <label className={labelClass}>Position GPS <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-3">
              {(latitude != null && longitude != null) ? (
                <>
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
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={getPosition}
                    disabled={geoLoading}
                    className={`rounded-xl px-4 py-4 text-sm font-semibold flex items-center justify-center gap-3 ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500'} disabled:opacity-70 shadow-lg`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {geoLoading ? 'Demande en cours…' : 'Autoriser la localisation et récupérer ma position'}
                  </button>
                  {geoError && (
                    <p className="text-sm text-amber-600">{geoError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200' : 'bg-sky-900/40 text-sky-300 hover:bg-sky-800/60 border border-sky-600/50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                    Choisir sur la carte
                  </button>
                </>
              )}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-500">{submitError}</p>
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
                className={`flex flex-col items-center gap-3 rounded-2xl px-8 py-6 shadow-xl ${
                  isLight ? 'bg-white text-emerald-600' : 'bg-gray-800 text-emerald-400'
                }`}
              >
                <svg className="w-14 h-14 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-lg font-semibold">Donnée enregistrée</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium ${isLight ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'}`}
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={handleClose}
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
              {submitLoading ? 'Enregistrement…' : 'Ajouter la donnée'}
            </button>
          </div>
        </div>
      </div>
    </div>
    <MapPickModal
      isOpen={showMapPicker}
      onClose={() => setShowMapPicker(false)}
      onPick={(lat, lng) => {
        setLatitude(lat)
        setLongitude(lng)
        setGeoError(null)
        setShowMapPicker(false)
      }}
    />
    </>
  )
}
