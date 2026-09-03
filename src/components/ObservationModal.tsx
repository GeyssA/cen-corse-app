'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  createObservation,
  updateObservation,
  getObservationsByUser,
  type Observation as ObservationRow
} from '@/lib/observations'
import { isOnline, addPendingObservation } from '@/lib/offlineQueue'
import { uploadPhoto } from '@/lib/uploadPhoto'
import { parsePhotoUrls, serializePhotoUrls, MAX_PHOTOS } from '@/lib/photoUrls'
import { getMaxPhotoFileLabelFr, validatePhotoFileForUpload, validatePhotoFileListForUpload } from '@/lib/photoUploadLimits'
import { getSitesByUserAndProtocole, getSitesByUser, type ObservationSite } from '@/lib/sites'
import { getCurrentPositionAsync, isCapacitorNative, type GeoError } from '@/lib/geolocation'
import { invalidateMapDataCache } from '@/lib/mapDataCache'
import {
  choiceCheckIcon,
  choiceChipSelected,
  choiceChipUnselected,
  choiceListRowIdle,
  choiceListRowSelected
} from '@/lib/choiceSelection'
import MapPickModal from '@/components/MapPickModal'
import { FALLBACK_BIRDS_FULL_NAMES } from '@/lib/voiceObservationParser'
import {
  buildGuidedObservationStepIds,
  getGuidedObservationStepLabel,
  isGuidedObservationSkippableStep
} from '@/components/fieldFlow/buildGuidedObservationSteps'
import ObservationModalGuidedBody from '@/components/ObservationModalGuidedBody'
import type { ObservationForm } from '@/types/observationForm'
import SimpleDateInput from '@/components/ui/SimpleDateInput'

export type { ObservationForm }

const PROTOCOLE_OPTIONS = [
  { value: 'Données opportunistes', label: 'Données opportunistes' },
  { value: 'POPReptile', label: 'POP Reptile' },
  { value: 'POPAmphibien', label: 'POP Amphibien' },
  { value: 'IPA', label: 'IPA' }
]

const GROUPE_OPTIONS = [
  { value: 'Amphibiens', label: 'Amphibiens' },
  { value: 'Reptiles', label: 'Reptiles' },
  { value: 'Oiseaux', label: 'Oiseaux' },
  { value: 'Lépidoptères', label: 'Lépidoptères' },
  { value: 'Arachnides', label: 'Arachnides' },
  { value: 'Odonates', label: 'Odonates' },
  { value: 'Orthoptères', label: 'Orthoptères' },
  { value: 'Mammifères', label: 'Mammifères' },
  { value: 'Poissons', label: 'Poissons' },
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

// Espèces de Corse uniquement (sélection dans la liste = nom commun - acceptedNameUsage)
const AMPHIBIENS_CORSE: string[] = [
  'Discoglosse sarde - Discoglossus sardus Tschudi in Otth, 1837',
  'Discoglosse corse - Discoglossus montalentii Lanza, Nascetti, Capula & Bullini, 1984',
  'Crapaud vert des Baléares - Bufotes viridis balearicus (Boettger, 1880)',
  'Grenouille de Berger - Pelophylax lessonae bergeri (Günther in Engelmann, Fritzsche, Günther & Obst, 1986)',
  'Rainette sarde - Hyla sarda (Betta, 1857)',
  'Euprocte de Corse - Euproctus montanus (Savi, 1838)',
  'Salamandre corse - Salamandra corsica (Savi, 1838)'
]

const REPTILES_CORSE: string[] = [
  'Lézard tyrrhénien - Podarcis tiliguerta (Gmelin, 1789)',
  'Lézard sicilien - Podarcis siculus (Rafinesque-Schmaltz, 1810)',
  'Lézard de Bedriaga - Archaeolacerta bedriagae (Camerano, 1885)',
  'Algyroïde de Fitzinger - Algyroides fitzingeri (Wiegmann, 1834)',
  'Couleuvre helvétique de Corse - Natrix helvetica corsa (Hecht, 1930)',
  'Couleuvre verte et jaune - Hierophis viridiflavus (Lacepède, 1789)',
  'Tarente de maurétanie - Tarentola mauritanica (Linnaeus, 1758)',
  'Phyllodactyle d\'Europe - Euleptes europaea (Gené, 1839)',
  'Hémydactyle verruqueux - Hemidactylus turcicus (Linnaeus, 1758)',
  'Tortue d\'Hermann - Testudo hermanni Gmelin, 1789',
  'Tortue de Floride - Trachemys scripta scripta (Schoepff, 1792)',
  'Cistude d\'Europe - Emys orbicularis (Linnaeus, 1758)'
]

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
  /** Pré-remplir le formulaire (ex. après saisie vocale). */
  initialForm?: Partial<ObservationForm>
  /** Position GPS initiale (ex. après saisie vocale). */
  initialPosition?: { latitude: number; longitude: number } | null
  /** Transcription vocale à afficher au-dessus de Contexte (petit, italique). */
  voiceTranscript?: string
  /** Édition depuis la carte ou ailleurs : même modal, envoi en mise à jour. */
  observationToEdit?: ObservationRow | null
}

function getTodayISO(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export default function ObservationModal({
  isOpen,
  onClose,
  onSuccess,
  sitesRefreshKey,
  initialForm,
  initialPosition,
  voiceTranscript,
  observationToEdit = null
}: ObservationModalProps) {
  const { theme } = useTheme()
  const { user, profile } = useAuth()
  const [form, setForm] = useState<ObservationForm>({
    date: getTodayISO(),
    protocole: 'Données opportunistes',
    passage: '',
    site: '',
    presence: true,
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
  const siteInputRef = useRef<HTMLInputElement>(null)
  const [siteQuery, setSiteQuery] = useState('')
  const [especeOpen, setEspeceOpen] = useState(false)
  const [speciesByGroup, setSpeciesByGroup] = useState<Record<string, string[]> | null>(null)
  const [speciesQuery, setSpeciesQuery] = useState('')
  const especeRef = useRef<HTMLDivElement>(null)
  const modalScrollRef = useRef<HTMLDivElement>(null)
  const [sites, setSites] = useState<ObservationSite[]>([])
  const [siteCustomMode, setSiteCustomMode] = useState(false)
  const [protocoleCustomMode, setProtocoleCustomMode] = useState(false)
  const [groupeCustomMode, setGroupeCustomMode] = useState(false)
  const [stadeCustomMode, setStadeCustomMode] = useState(false)
  const [sexeCustomMode, setSexeCustomMode] = useState(false)
  const [pinned, setPinned] = useState<Partial<Record<FormKey, boolean>>>({})
  const [showSuccessCheck, setShowSuccessCheck] = useState(false)
  /** Champs pré-remplis par la saisie vocale (pour mise en exergue). */
  const [voicePrefilledKeys, setVoicePrefilledKeys] = useState<Set<string>>(new Set())
  const [successFadeOut, setSuccessFadeOut] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [showDonneesOpportunistesInfo, setShowDonneesOpportunistesInfo] = useState(false)
  const [showPresenceInfo, setShowPresenceInfo] = useState(false)
  const [existingMapPoints, setExistingMapPoints] = useState<import('./MapPickContent').ExistingMapPoint[]>([])
  const [existingPointsLoaded, setExistingPointsLoaded] = useState(false)
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
  const [showSlowSubmitHint, setShowSlowSubmitHint] = useState(false)

  const isLight = theme === 'light'
  const togglePin = (field: FormKey) => setPinned((p) => ({ ...p, [field]: !p[field] }))
  const isHorsProtocole = form.protocole === 'Données opportunistes'

  const getSpeciesListForGroup = (groupe: string): string[] => {
    if (groupe === 'Amphibiens') return AMPHIBIENS_CORSE
    if (groupe === 'Reptiles') return REPTILES_CORSE
    if (groupe === 'Oiseaux') return Array.from(new Set([...(speciesByGroup?.[groupe] ?? []), ...FALLBACK_BIRDS_FULL_NAMES]))
    return speciesByGroup?.[groupe] ?? []
  }

  const resetForm = () => {
    const defaultForm: ObservationForm = {
      date: getTodayISO(),
      protocole: 'Données opportunistes',
      passage: '',
      site: '',
      presence: true,
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
    setSpeciesQuery('')
    setSiteQuery('')
    setSubmitError(null)
    setPhotoFileError(null)
    setPhotoItems((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview))
      return []
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Appliquer le pré-remplissage (saisie vocale) à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    if (observationToEdit?.id) return
    if (initialForm && Object.keys(initialForm).length > 0) {
      const keys = new Set<string>()
      ;(Object.keys(initialForm) as (keyof ObservationForm)[]).forEach((k) => {
        const v = initialForm[k]
        if (v != null && v !== '') keys.add(k)
      })
      setVoicePrefilledKeys(keys)
      // Réinitialiser complètement le formulaire puis appliquer la voix (évite de garder groupe/espèce d'une ancienne commande)
      const baseForm: ObservationForm = {
        date: getTodayISO(),
        protocole: 'Données opportunistes',
        passage: '',
        site: '',
        presence: true,
        groupe: '',
        nom_espece: '',
        effectif: '',
        stade: '',
        sexe: '',
        remarques: ''
      }
      setForm({ ...baseForm, ...initialForm })
    } else {
      setVoicePrefilledKeys(new Set())
    }
    if (initialPosition) {
      setLatitude(initialPosition.latitude)
      setLongitude(initialPosition.longitude)
    }
  }, [isOpen, initialForm, initialPosition, observationToEdit?.id])

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

  // Charger les sites du user pour le protocole sélectionné
  useEffect(() => {
    if (!user?.id || !form.protocole) {
      setSites([])
      return
    }
    setSiteQuery('')
    getSitesByUserAndProtocole(user.id, form.protocole).then(setSites)
  }, [user?.id, form.protocole, isOpen, sitesRefreshKey])

  // Charger la liste des espèces par groupe (taxon) pour l'autocomplete
  useEffect(() => {
    if (!isOpen) return
    fetch('/taxon/species-by-group.json')
      .then((r) => r.json())
      .then(setSpeciesByGroup)
      .catch(() => setSpeciesByGroup({}))
  }, [isOpen])

  // Réinitialiser l'espèce seulement si elle n'est pas valide pour le nouveau groupe (préserve le pré-rempli vocal)
  useEffect(() => {
    setForm((f) => {
      const list = getSpeciesListForGroup(f.groupe)
      // Ne pas vider quand le groupe n'a pas de liste (ex. ouverture avec initialForm, groupe pas encore appliqué)
      const keep = list.length === 0 || !f.nom_espece || list.includes(f.nom_espece)
      return { ...f, nom_espece: keep ? f.nom_espece : '' }
    })
    setSpeciesQuery('')
    setEspeceOpen(false)
  }, [form.groupe])

  // Forcer le groupe quand le protocole l'impose (POP Reptile → Reptiles, etc.)
  const groupeForcedByProtocole =
    form.protocole === 'POPReptile' ? 'Reptiles'
    : form.protocole === 'POPAmphibien' ? 'Amphibiens'
    : form.protocole === 'IPA' ? 'Oiseaux'
    : null
  useEffect(() => {
    if (groupeForcedByProtocole) {
      setForm((f) => (f.groupe === groupeForcedByProtocole ? f : { ...f, groupe: groupeForcedByProtocole }))
      setGroupeOpen(false)
      setGroupeCustomMode(false)
    }
  }, [form.protocole, groupeForcedByProtocole])

  const isEditingObs = Boolean(observationToEdit?.id)
  const hasVoiceInit = Boolean(initialForm && Object.keys(initialForm).length > 0)
  const [formUiMode, setFormUiMode] = useState<'guided' | 'full'>(() => {
    if (typeof window === 'undefined') return 'guided'
    const v = localStorage.getItem('cc_obs_form_mode')
    return v === 'full' || v === 'guided' ? v : 'guided'
  })
  const [guidedStep, setGuidedStep] = useState(0)

  const useGuided = !isEditingObs && !hasVoiceInit && formUiMode === 'guided'

  const guidedStepIds = useMemo(
    () => buildGuidedObservationStepIds(isHorsProtocole, Boolean(groupeForcedByProtocole)),
    [isHorsProtocole, groupeForcedByProtocole]
  )
  const guidedMax = Math.max(0, guidedStepIds.length - 1)
  const guidedStepClamped = Math.min(Math.max(0, guidedStep), guidedMax)
  const guidedStepId = guidedStepIds[guidedStepClamped] ?? 'date'
  const guidedProgressLabel = getGuidedObservationStepLabel(guidedStepId)
  const guidedTotal = guidedStepIds.length

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('cc_obs_form_mode', formUiMode)
  }, [formUiMode])

  useEffect(() => {
    if (!isOpen) return
    setGuidedStep(0)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && hasVoiceInit) setFormUiMode('full')
  }, [isOpen, hasVoiceInit])

  useEffect(() => {
    setGuidedStep((i) => (i > guidedMax ? Math.max(0, guidedMax) : i))
  }, [guidedMax, guidedStepIds.length])

  // Charger sites + observations pour afficher sur la carte (choix de position)
  useEffect(() => {
    if (!isOpen || !user?.id) {
      setExistingPointsLoaded(false)
      return
    }
    setExistingPointsLoaded(false)
    Promise.all([getSitesByUser(user.id), getObservationsByUser(user.id)])
      .then(([sitesList, observationsList]) => {
        const points: import('./MapPickContent').ExistingMapPoint[] = []
        sitesList.forEach((s) => {
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
        observationsList.forEach((o) => {
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
        setExistingMapPoints([])
        setExistingPointsLoaded(true)
      })
  }, [isOpen, user?.id])

  // Réinitialiser le formulaire à l'ouverture, ou charger une observation à modifier.
  // En app (Capacitor) : récup auto de la position pour une nouvelle saisie uniquement.
  useEffect(() => {
    if (!isOpen) return
    if (observationToEdit?.id) {
      const o = observationToEdit
      setForm({
        date: (o.date || '').slice(0, 10) || getTodayISO(),
        protocole: o.protocole || 'Données opportunistes',
        passage: o.passage || '',
        site: o.site || '',
        presence: o.presence !== false,
        groupe: o.groupe || '',
        nom_espece: o.nom_espece || '',
        effectif: o.effectif ?? '',
        stade: o.stade || '',
        sexe: o.sexe || '',
        remarques: o.remarques || ''
      })
      setLatitude(o.latitude ?? null)
      setLongitude(o.longitude ?? null)
      setSiteCustomMode(false)
      setProtocoleCustomMode(!PROTOCOLE_OPTIONS.some((x) => x.value === o.protocole) && !!o.protocole)
      setGroupeCustomMode(!GROUPE_OPTIONS.some((x) => x.value === o.groupe) && !!o.groupe)
      setStadeCustomMode(!STADE_OPTIONS.some((x) => x.value === o.stade) && !!o.stade)
      setSexeCustomMode(!SEXE_OPTIONS.some((x) => x.value === o.sexe) && !!o.sexe)
      setSubmitError(null)
      setGeoError(null)
      setPhotoFileError(null)
      setPhotoItems((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview))
        return []
      })
      setGeoLoading(false)
      return
    }
    setForm((f) => ({ ...f, date: getTodayISO() }))
    setSiteCustomMode(false)
    setProtocoleCustomMode(false)
    setGroupeCustomMode(false)
    setStadeCustomMode(false)
    setSexeCustomMode(false)
    setSubmitError(null)
    setGeoError(null)
    setPhotoFileError(null)
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
  }, [isOpen, observationToEdit?.id])

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
    if (form.groupe && form.nom_espece) {
      const list = getSpeciesListForGroup(form.groupe)
      const allowed = list.length === 0 || list.includes(form.nom_espece)
      if (!allowed) {
        setSubmitError('Veuillez sélectionner une espèce dans la liste proposée.')
        return
      }
    }
    if (form.effectif.trim() !== '') {
      const effectifNum = Number(form.effectif)
      if (Number.isNaN(effectifNum) || effectifNum < 0) {
        setSubmitError("L'effectif doit être un nombre positif.")
        return
      }
    }
    setSubmitLoading(true)
    const editingId = observationToEdit?.id
    try {
      if (editingId && !isOnline()) {
        setSubmitError('La modification nécessite une connexion réseau.')
        setSubmitLoading(false)
        return
      }
      const payload = {
        ...form,
        latitude,
        longitude,
        observateur: profile?.full_name ?? '',
        user_id: user.id,
        photo_url: undefined as string | undefined
      }

      if (!editingId && !isOnline()) {
        const listErr = validatePhotoFileListForUpload(photoItems.map((i) => i.file))
        if (listErr) {
          setSubmitError(listErr)
          setSubmitLoading(false)
          return
        }
        await addPendingObservation(payload, photoItems.map((i) => i.file))
        const defaultForm: ObservationForm = {
          date: getTodayISO(),
          protocole: 'Données opportunistes',
          passage: '',
          site: '',
          presence: true,
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
        setSpeciesQuery('')
        setSiteQuery('')
        setProtocoleCustomMode(!PROTOCOLE_OPTIONS.some((o) => o.value === nextForm.protocole) && !!nextForm.protocole)
        setGroupeCustomMode(!GROUPE_OPTIONS.some((o) => o.value === nextForm.groupe) && !!nextForm.groupe)
        setStadeCustomMode(!STADE_OPTIONS.some((o) => o.value === nextForm.stade) && !!nextForm.stade)
        setSexeCustomMode(!SEXE_OPTIONS.some((o) => o.value === nextForm.sexe) && !!nextForm.sexe)
        setSuccessFadeOut(false)
        setShowSuccessCheck(true)
        setSubmitError(null)
        setSuccessMessage('Enregistré localement. Envoi automatique dès que vous serez en ligne.')
        setTimeout(() => setSuccessFadeOut(true), 2500)
        setTimeout(() => {
          setShowSuccessCheck(false)
          setSuccessMessage(undefined)
        }, 3000)
        setPhotoItems((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.preview))
          return []
        })
        onSuccess?.()
        setSubmitLoading(false)
        return
      }

      const photoUrls: string[] = []
      if (editingId) {
        photoUrls.push(...parsePhotoUrls(observationToEdit!.photo_url))
      }
      if (photoItems.length > 0 && user) {
        for (const item of photoItems) {
          const r = await uploadPhoto(item.file, 'observation', user.id)
          if (!r.ok) {
            if (editingId) {
              setSubmitError(r.message)
              setSubmitLoading(false)
              return
            }
            if (r.canQueueOffline) {
              await addPendingObservation(payload, photoItems.map((i) => i.file))
              setSuccessFadeOut(false)
              setShowSuccessCheck(true)
              setSuccessMessage('Enregistré localement. Envoi automatique dès que vous serez en ligne.')
              setTimeout(() => setSuccessFadeOut(true), 2500)
              setTimeout(() => { setShowSuccessCheck(false); setSuccessMessage(undefined) }, 3000)
              setPhotoItems((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.preview)); return [] })
              onSuccess?.()
              setSubmitLoading(false)
              return
            }
            setSubmitError(r.message)
            setSubmitLoading(false)
            return
          }
          photoUrls.push(r.publicUrl)
        }
      }
      const photo_url = serializePhotoUrls(photoUrls) ?? undefined
      if (editingId) {
        const { error: updErr } = await updateObservation(editingId, {
          ...form,
          latitude,
          longitude,
          observateur: profile?.full_name ?? '',
          user_id: user.id,
          photo_url: photo_url ?? null
        })
        if (updErr) {
          setSubmitError(updErr)
        } else {
          setSuccessFadeOut(false)
          setShowSuccessCheck(true)
          setSuccessMessage('Donnée modifiée')
          setTimeout(() => setSuccessFadeOut(true), 1100)
          setTimeout(() => {
            setShowSuccessCheck(false)
            setSuccessMessage(undefined)
            onClose()
          }, 1600)
          setPhotoItems((prev) => {
            prev.forEach((p) => URL.revokeObjectURL(p.preview))
            return []
          })
          invalidateMapDataCache()
          onSuccess?.()
        }
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
          protocole: 'Données opportunistes',
          passage: '',
          site: '',
          presence: true,
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
        setSpeciesQuery('')
        setSiteQuery('')
        setProtocoleCustomMode(!PROTOCOLE_OPTIONS.some((o) => o.value === nextForm.protocole) && !!nextForm.protocole)
        setGroupeCustomMode(!GROUPE_OPTIONS.some((o) => o.value === nextForm.groupe) && !!nextForm.groupe)
        setStadeCustomMode(!STADE_OPTIONS.some((o) => o.value === nextForm.stade) && !!nextForm.stade)
        setSexeCustomMode(!SEXE_OPTIONS.some((o) => o.value === nextForm.sexe) && !!nextForm.sexe)
        setSuccessFadeOut(false)
        setShowSuccessCheck(true)
        setSuccessMessage(undefined)
        setTimeout(() =>         setSuccessFadeOut(true), 1100)
        setTimeout(() => setShowSuccessCheck(false), 1600)
        setPhotoItems((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.preview))
          return []
        })
        onSuccess?.()
        invalidateMapDataCache()
        // Ne pas fermer : l'utilisateur peut enchaîner une autre donnée sur le même point
      } else {
        // Échec Supabase (réseau, config, etc.) : enregistrement en local, sync au retour du réseau
        const listErr = validatePhotoFileListForUpload(photoItems.map((i) => i.file))
        if (listErr) {
          setSubmitError(listErr)
        } else {
        await addPendingObservation(payload, photoItems.map((i) => i.file))
        const defaultForm: ObservationForm = {
          date: getTodayISO(),
          protocole: 'Données opportunistes',
          passage: '',
          site: '',
          presence: true,
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
        setSpeciesQuery('')
        setSiteQuery('')
        setProtocoleCustomMode(!PROTOCOLE_OPTIONS.some((o) => o.value === nextForm.protocole) && !!nextForm.protocole)
        setGroupeCustomMode(!GROUPE_OPTIONS.some((o) => o.value === nextForm.groupe) && !!nextForm.groupe)
        setStadeCustomMode(!STADE_OPTIONS.some((o) => o.value === nextForm.stade) && !!nextForm.stade)
        setSexeCustomMode(!SEXE_OPTIONS.some((o) => o.value === nextForm.sexe) && !!nextForm.sexe)
        setSubmitError(null)
        setSuccessFadeOut(false)
        setShowSuccessCheck(true)
        setSuccessMessage('Enregistré localement. Envoi automatique dès que vous serez en ligne.')
        setTimeout(() => setSuccessFadeOut(true), 2500)
        setTimeout(() => { setShowSuccessCheck(false); setSuccessMessage(undefined) }, 3000)
        setPhotoItems((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.preview)); return [] })
        onSuccess?.()
        }
      }
    } catch (e) {
      if (observationToEdit?.id) {
        setSubmitError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.')
      } else {
        // Erreur réseau ou inattendue : sauvegarde en local pour ne pas perdre la donnée
        try {
          const payload = {
            ...form,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            observateur: profile?.full_name ?? '',
            user_id: user?.id,
            photo_url: undefined as string | undefined
          }
          if (user && latitude != null && longitude != null) {
            const catchListErr = validatePhotoFileListForUpload(photoItems.map((i) => i.file))
            if (catchListErr) {
              setSubmitError(catchListErr)
            } else {
            await addPendingObservation(payload, photoItems.map((i) => i.file))
            setSubmitError(null)
            setSuccessFadeOut(false)
            setShowSuccessCheck(true)
            setSuccessMessage('Enregistré localement. Envoi automatique dès que vous serez en ligne.')
            setTimeout(() => setSuccessFadeOut(true), 2500)
            setTimeout(() => { setShowSuccessCheck(false); setSuccessMessage(undefined) }, 3000)
            setPhotoItems((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.preview)); return [] })
            onSuccess?.()
            }
          } else {
            setSubmitError('Erreur lors de l’enregistrement.')
          }
        } catch {
          setSubmitError('Erreur lors de l’enregistrement.')
        }
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  if (!isOpen) return null

  const inputClass = `w-full min-h-12 rounded-xl border px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors ${
    isLight
      ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
      : 'bg-gray-800/80 border-gray-600 text-gray-100 placeholder-gray-400'
  }`
  const labelClass = `block text-base font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`
  const labelRowClass = 'flex items-center justify-between gap-2 mb-2'
  const VOICE_FIELD_KEYS: FormKey[] = ['groupe', 'nom_espece', 'stade', 'sexe', 'effectif', 'remarques']
  const voiceFieldClass = (key: FormKey): string => {
    if (voicePrefilledKeys.has(key) && form[key]) {
      return isLight
        ? 'rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 pl-2 -ml-0.5'
        : 'rounded-lg border-l-4 border-emerald-500 bg-emerald-900/25 pl-2 -ml-0.5'
    }
    return ''
  }
  const sectionTitleClass = `text-sm font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-gray-400'}`
  const pinButtonTitle = (field: FormKey) => (pinned[field] ? 'Ne plus conserver cette valeur' : 'Conserver pour la prochaine saisie')

  const goNextGuided = () => {
    if (guidedStepId === 'gps' && (latitude == null || longitude == null)) {
      setSubmitError('Indiquez une position GPS (géolocalisation ou carte) avant de continuer ou d’enregistrer.')
      return
    }
    setSubmitError(null)
    if (guidedStepId === 'recap') return
    setGuidedStep((i) => Math.min(i + 1, guidedMax))
  }

  const goPrevGuided = () => {
    setSubmitError(null)
    setGuidedStep((i) => Math.max(0, i - 1))
  }

  const passGuided = () => {
    if (isGuidedObservationSkippableStep(guidedStepId)) {
      goNextGuided()
    }
  }

  return (
    <>
    <div
      className={`fixed inset-0 z-[100] flex flex-col safe-area-modal ${
        isLight ? 'bg-slate-50' : 'bg-gray-950'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="observation-modal-title"
    >
      <div ref={modalScrollRef} className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
        <div
          className={`relative w-full min-h-full ${
            isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
          }`}
        >
        <header className={`sticky top-0 z-10 flex flex-col gap-0 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}>
          {showSlowSubmitHint && (
            <div
              className={`px-4 py-2 text-xs sm:text-sm border-b ${isLight ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-amber-950/80 text-amber-100 border-amber-800/60'}`}
              role="status"
            >
              Enregistrement en cours… Si le réseau est lent ou les photos lourdes, cela peut prendre un peu plus de
              temps. Ne fermez pas l’écran tant que le message de confirmation n’apparaît pas.
            </div>
          )}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h2 id="observation-modal-title" className={`text-xl font-semibold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {observationToEdit?.id ? 'Modifier l’observation' : 'Nouvelle observation naturaliste'}
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 -m-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-800 text-gray-400'}`}
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </header>

        {!isEditingObs && (
          <div
            className={`px-4 sm:px-6 py-2.5 border-b ${
              isLight ? 'bg-gray-50/80 border-gray-200' : 'bg-gray-900/80 border-gray-700'
            }`}
          >
            <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <p
                className={`text-xs font-medium uppercase tracking-wide ${
                  isLight ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Mode de saisie
              </p>
              <div
                className={`inline-flex rounded-xl p-0.5 ${isLight ? 'bg-gray-200/80' : 'bg-gray-800/80'}`}
                role="group"
                aria-label="Mode d’affichage du formulaire"
              >
                <button
                  type="button"
                  onClick={() => setFormUiMode('guided')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    formUiMode === 'guided'
                      ? isLight
                        ? 'bg-white text-gray-900 shadow'
                        : 'bg-gray-700 text-white'
                      : isLight
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  }`}
                >
                  Pas à pas
                </button>
                <button
                  type="button"
                  onClick={() => setFormUiMode('full')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    formUiMode === 'full'
                      ? isLight
                        ? 'bg-white text-gray-900 shadow'
                        : 'bg-gray-700 text-white'
                      : isLight
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  }`}
                >
                  Tout sur une page
                </button>
              </div>
            </div>
            {useGuided && (
              <div className="max-w-2xl mx-auto mt-3 w-full">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: isLight ? '#e5e7eb' : '#374151' }}
                >
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-300"
                    style={{ width: `${((guidedStepClamped + 1) / Math.max(1, guidedTotal)) * 100}%` }}
                  />
                </div>
                <p className={`mt-2 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  Étape {guidedStepClamped + 1} / {guidedTotal} — {guidedProgressLabel}
                </p>
              </div>
            )}
          </div>
        )}

        {useGuided && (
        <div className="px-4 sm:px-6 py-4 pb-8 max-w-2xl mx-auto w-full">
          <ObservationModalGuidedBody
            stepId={guidedStepId}
            isLight={isLight}
            inputClass={inputClass}
            form={form}
            setForm={setForm}
            isHorsProtocole={isHorsProtocole}
            groupeForcedByProtocole={groupeForcedByProtocole}
            getSpeciesListForGroup={getSpeciesListForGroup}
            speciesByGroup={speciesByGroup}
            sites={sites}
            pinned={pinned}
            pinToggle={togglePin}
            pinButtonTitle={pinButtonTitle}
            PinIcon={PinIcon}
            voiceFieldClass={voiceFieldClass}
            onShowProtocoleInfo={() => setShowDonneesOpportunistesInfo(true)}
            onShowPresenceInfo={() => setShowPresenceInfo(true)}
            setProtocoleCustomMode={setProtocoleCustomMode}
            protocoleCustomMode={protocoleCustomMode}
            setGroupeCustomMode={setGroupeCustomMode}
            groupeCustomMode={groupeCustomMode}
            setStadeCustomMode={setStadeCustomMode}
            stadeCustomMode={stadeCustomMode}
            setSexeCustomMode={setSexeCustomMode}
            sexeCustomMode={sexeCustomMode}
            setSiteOpen={setSiteOpen}
            siteOpen={siteOpen}
            setSiteCustomMode={setSiteCustomMode}
            siteCustomMode={siteCustomMode}
            siteQuery={siteQuery}
            setSiteQuery={setSiteQuery}
            setEspeceOpen={setEspeceOpen}
            especeOpen={especeOpen}
            speciesQuery={speciesQuery}
            setSpeciesQuery={setSpeciesQuery}
            setProtocoleOpen={setProtocoleOpen}
            siteRef={siteRef}
            siteInputRef={siteInputRef}
            especeRef={especeRef}
            protocoleRef={protocoleRef}
            photoItems={photoItems}
            setPhotoItems={setPhotoItems}
            onAddPhotoFile={addPhotoFile}
            photoFileError={photoFileError}
            maxPhotoFileLabel={getMaxPhotoFileLabelFr()}
            photoInputRef={photoInputRef}
            photoCameraRef={photoCameraRef}
            latitude={latitude}
            longitude={longitude}
            geoError={geoError}
            geoLoading={geoLoading}
            getPosition={getPosition}
            onOpenMap={() => setShowMapPicker(true)}
          />
        </div>
        )}
        {!useGuided && (
        <div className="px-4 sm:px-6 py-5 pb-8 max-w-2xl mx-auto space-y-7">
          {voiceTranscript && (
            <div className={`rounded-xl border p-4 ${isLight ? 'bg-sky-50/80 border-sky-200' : 'bg-sky-900/20 border-sky-700/50'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                Phrase retranscrite
              </p>
              <p className={`text-sm italic mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                « {voiceTranscript} »
              </p>
              <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                L’application a extrait automatiquement les informations (espèce, effectif, stade, sexe) pour pré-remplir les champs ci-dessous. Vous pouvez les modifier avant d’enregistrer.
              </p>
            </div>
          )}
          <section>
            <h3 className={`${sectionTitleClass} mb-3`}>Contexte</h3>
            <div className="space-y-5">
            <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Date</label>
              <button type="button" onClick={() => togglePin('date')} title={pinButtonTitle('date')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('date')}>
                <PinIcon pinned={!!pinned.date} isLight={isLight} />
              </button>
            </div>
            <SimpleDateInput
              value={form.date}
              onChange={(nextIsoDate) => setForm((f) => ({ ...f, date: nextIsoDate }))}
              isLight={isLight}
              ariaLabel="Date de l'observation"
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
                          const groupeForProtocole =
                            opt.value === 'POPReptile' ? 'Reptiles'
                            : opt.value === 'POPAmphibien' ? 'Amphibiens'
                            : opt.value === 'IPA' ? 'Oiseaux'
                            : ''
                          setForm((f) => ({ ...f, protocole: opt.value, groupe: groupeForProtocole }))
                          setProtocoleOpen(false)
                        }}
                        className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                          form.protocole === opt.value ? choiceListRowSelected(isLight) : choiceListRowIdle(isLight)
                        }`}
                      >
                        {form.protocole === opt.value && (
                          <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="flex-1">{opt.label}</span>
                        {opt.value === 'Données opportunistes' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDonneesOpportunistesInfo(true)
                            }}
                            className={`p-1.5 rounded-lg shrink-0 transition-colors ${isLight ? 'hover:bg-sky-200/80 text-sky-600' : 'hover:bg-sky-800/50 text-sky-400'}`}
                            aria-label="En savoir plus sur les données opportunistes"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setProtocoleCustomMode(true)
                        setProtocoleOpen(false)
                        if (!form.protocole) setForm((f) => ({ ...f, protocole: '' }))
                      }}
                      className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                    >
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, protocole: '' }))
                        setProtocoleOpen(false)
                      }}
                      className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 border-t ${
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
                      className={`min-w-[2.75rem] py-3.5 rounded-xl text-base font-semibold transition-colors ${
                        selected ? choiceChipSelected(isLight) : choiceChipUnselected(isLight)
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

          <div ref={siteRef} className="relative scroll-mt-16">
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
                  onClick={() => { setSiteCustomMode(false); setForm((f) => ({ ...f, site: '' })); setSiteQuery('') }}
                  className={`text-xs ${isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-400 hover:text-sky-300'}`}
                >
                  Choisir un site existant
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    ref={siteInputRef}
                    type="text"
                    value={form.site || siteQuery}
                    onChange={(e) => {
                      const q = e.target.value
                      setSiteQuery(q)
                      if (form.site) setForm((f) => ({ ...f, site: '' }))
                      setSiteOpen(true)
                    }}
                    onFocus={() => {
                      siteRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                      setSiteOpen(true)
                    }}
                    className={`${inputClass} pr-9`}
                    placeholder="Tapez pour rechercher un site…"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, site: '' }))
                      setSiteQuery('')
                      setSiteOpen(false)
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isLight ? 'text-gray-400 hover:bg-gray-200 hover:text-gray-600' : 'text-gray-500 hover:bg-gray-600 hover:text-gray-300'}`}
                    title={form.site ? 'Supprimer le choix' : 'Fermer la liste'}
                    aria-label={form.site ? 'Supprimer le choix du site' : 'Fermer la liste déroulante'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {siteOpen && (
                  <div
                    className={`absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border shadow-lg overflow-hidden max-h-56 overflow-y-auto ${
                      isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'
                    }`}
                  >
                    {(() => {
                      const q = (siteQuery || form.site || '').trim().toLowerCase()
                      const filtered = q
                        ? sites.filter((s) => s.nom_du_site.toLowerCase().includes(q)).slice(0, 80)
                        : sites.slice(0, 80)
                      return (
                        <>
                          {sites.length === 0 ? (
                            <div className={`px-4 py-3.5 text-base ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                              Aucun site enregistré pour ce protocole. Utilisez « Saisie libre » ci-dessous pour en créer un.
                            </div>
                          ) : filtered.length === 0 ? (
                            <div className={`px-4 py-3.5 text-base ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                              Aucun site ne contient « {siteQuery.trim()} ». Affinez ou utilisez « Saisie libre ».
                            </div>
                          ) : null}
                          {filtered.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, site: s.nom_du_site }))
                                setSiteQuery('')
                                setSiteOpen(false)
                              }}
                              className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                                form.site === s.nom_du_site
                                  ? choiceListRowSelected(isLight)
                                  : choiceListRowIdle(isLight)
                              }`}
                            >
                              {form.site === s.nom_du_site && (
                                <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
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
                              setSiteQuery('')
                            }}
                            className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                          >
                            <span>Saisie libre…</span>
                          </button>
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <div className={labelRowClass}>
              <label className={labelClass}>Présence</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPresenceInfo(true)}
                  className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-gray-700 text-gray-400'}`}
                  aria-label="En savoir plus sur présence / absence"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button type="button" onClick={() => togglePin('presence')} title={pinButtonTitle('presence')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('presence')}>
                  <PinIcon pinned={!!pinned.presence} isLight={isLight} />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, presence: true }))}
                className={`flex-1 py-3.5 rounded-xl text-base font-semibold transition-colors ${
                  form.presence ? choiceChipSelected(isLight) : choiceChipUnselected(isLight)
                }`}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, presence: false }))}
                className={`flex-1 py-3.5 rounded-xl text-base font-semibold transition-colors ${
                  !form.presence ? choiceChipSelected(isLight) : choiceChipUnselected(isLight)
                }`}
              >
                Non
              </button>
            </div>
          </div>
          </>
          )}

            </div>
          </section>

          <div ref={groupeRef} className="relative">
            <div className={voiceFieldClass('groupe') || undefined}>
            <div className={labelRowClass}>
              <label className={labelClass}>Groupe</label>
              {!groupeForcedByProtocole && (
                <button type="button" onClick={() => togglePin('groupe')} title={pinButtonTitle('groupe')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('groupe')}>
                  <PinIcon pinned={!!pinned.groupe} isLight={isLight} />
                </button>
              )}
            </div>
            {groupeForcedByProtocole ? (
              <div className={`${inputClass} opacity-90 cursor-default pointer-events-none`}>
                <span className={form.groupe ? (isLight ? 'text-gray-800' : 'text-gray-100') : (isLight ? 'text-gray-500' : 'text-gray-400')}>
                  {GROUPE_OPTIONS.find((o) => o.value === groupeForcedByProtocole)?.label ?? groupeForcedByProtocole}
                </span>
              </div>
            ) : groupeCustomMode ? (
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
                        className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                          form.groupe === opt.value
                            ? choiceListRowSelected(isLight)
                            : choiceListRowIdle(isLight)
                        }`}
                      >
                        {form.groupe === opt.value && (
                          <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
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
                      className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
                    >
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, groupe: '' }))
                        setGroupeOpen(false)
                      }}
                      className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}
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
          </div>

          <div ref={especeRef} className="relative scroll-mt-18">
            <div className={voiceFieldClass('nom_espece') || undefined}>
            <div className={labelRowClass}>
              <label className={labelClass}>Nom espèce</label>
              <button type="button" onClick={() => togglePin('nom_espece')} title={pinButtonTitle('nom_espece')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('nom_espece')}>
                <PinIcon pinned={!!pinned.nom_espece} isLight={isLight} />
              </button>
            </div>
            {!form.groupe ? (
              <div className={`${inputClass} opacity-75 cursor-default`}>
                <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Sélectionnez d'abord un groupe</span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      getSpeciesListForGroup(form.groupe).length === 0
                        ? form.nom_espece
                        : (form.nom_espece || speciesQuery)
                    }
                    onChange={(e) => {
                      const q = e.target.value
                      const list = getSpeciesListForGroup(form.groupe)
                      if (list.length === 0) {
                        setForm((f) => ({ ...f, nom_espece: q }))
                        setSpeciesQuery('')
                      } else {
                        setSpeciesQuery(q)
                        if (form.nom_espece) setForm((f) => ({ ...f, nom_espece: '' }))
                        setEspeceOpen(true)
                      }
                    }}
                    onFocus={() => {
                      const list = getSpeciesListForGroup(form.groupe)
                      if (list.length > 0) setEspeceOpen(true)
                      const scrollEl = modalScrollRef.current
                      const fieldEl = especeRef.current
                      if (scrollEl && fieldEl) {
                        const scrollRect = scrollEl.getBoundingClientRect()
                        const fieldRect = fieldEl.getBoundingClientRect()
                        const topOffset = fieldRect.top - scrollRect.top + scrollEl.scrollTop
                        scrollEl.scrollTo({ top: Math.max(0, topOffset - 12), behavior: 'smooth' })
                      }
                    }}
                    className={`${inputClass} pr-9`}
                    placeholder={
                      getSpeciesListForGroup(form.groupe).length === 0
                        ? 'Saisissez le nom de l\'espèce'
                        : 'Tapez pour rechercher une espèce…'
                    }
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, nom_espece: '' }))
                      setSpeciesQuery('')
                      setEspeceOpen(false)
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isLight ? 'text-gray-400 hover:bg-gray-200 hover:text-gray-600' : 'text-gray-500 hover:bg-gray-600 hover:text-gray-300'}`}
                    title={form.nom_espece ? 'Supprimer le choix' : 'Fermer la liste'}
                    aria-label={form.nom_espece ? 'Supprimer le choix de l\'espèce' : 'Fermer la liste déroulante'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {especeOpen && form.groupe && (
                  (() => {
                    const list = getSpeciesListForGroup(form.groupe)
                    const q = (speciesQuery || form.nom_espece || '').trim().toLowerCase()
                    const filtered = q
                      ? list.filter((name) => name.toLowerCase().includes(q)).slice(0, 80)
                      : list.slice(0, 80)
                    const isLoading = form.groupe !== 'Amphibiens' && form.groupe !== 'Reptiles' && speciesByGroup == null
                    return (
                      <div
                        className={`absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border shadow-lg overflow-hidden max-h-56 overflow-y-auto ${
                          isLight ? 'bg-white border-gray-200 shadow-gray-200/50' : 'bg-gray-800 border-gray-600 shadow-black/30'
                        }`}
                      >
                        {isLoading ? (
                          <div className={`px-4 py-3.5 text-base ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            Chargement des espèces…
                          </div>
                        ) : filtered.length === 0 ? (
                          <div className={`px-4 py-3.5 text-base ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            {list.length === 0
                              ? 'Liste vide pour ce groupe. Saisissez le nom de l\'espèce ci-dessus (référentiel à compléter : voir scripts/rebuild-taxon-filtered.cjs).'
                              : q
                                ? `Aucune espèce ne contient « ${speciesQuery.trim()} ». Affinez votre recherche.`
                                : 'Tapez pour filtrer les espèces.'}
                          </div>
                        ) : (
                          filtered.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, nom_espece: name }))
                                setSpeciesQuery('')
                                setEspeceOpen(false)
                              }}
                              className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                                form.nom_espece === name
                                  ? choiceListRowSelected(isLight)
                                  : choiceListRowIdle(isLight)
                              }`}
                            >
                              {form.nom_espece === name && (
                                <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>{name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )
                  })()
                )}
              </>
            )}
            </div>
          </div>

          <div>
            <div className={voiceFieldClass('effectif') || undefined}>
            <div className={labelRowClass}>
              <label className={labelClass}>Effectif</label>
              <button type="button" onClick={() => togglePin('effectif')} title={pinButtonTitle('effectif')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('effectif')}>
                <PinIcon pinned={!!pinned.effectif} isLight={isLight} />
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.effectif}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                setForm((f) => ({ ...f, effectif: v }))
              }}
              className={inputClass}
              placeholder="Nombre (optionnel)"
            />
            </div>
          </div>

          <div ref={stadeRef} className="relative">
            <div className={voiceFieldClass('stade') || undefined}>
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
                        className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                          form.stade === opt.value ? choiceListRowSelected(isLight) : choiceListRowIdle(isLight)
                        }`}
                      >
                        {form.stade === opt.value && (
                          <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setStadeCustomMode(true); setStadeOpen(false) }} className={`w-full px-4 py-3.5 text-left text-base flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button type="button" onClick={() => { setForm((f) => ({ ...f, stade: '' })); setStadeOpen(false) }} className={`w-full px-4 py-3.5 text-left text-base flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span>Supprimer la sélection</span>
                    </button>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          <div ref={sexeRef} className="relative">
            <div className={voiceFieldClass('sexe') || undefined}>
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
                        className={`w-full px-4 py-3.5 text-left text-base transition-colors flex items-center gap-2 ${
                          form.sexe === opt.value ? choiceListRowSelected(isLight) : choiceListRowIdle(isLight)
                        }`}
                      >
                        {form.sexe === opt.value && (
                          <svg className={`w-4 h-4 shrink-0 ${choiceCheckIcon(isLight)}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => { setSexeCustomMode(true); setSexeOpen(false) }} className={`w-full px-4 py-3.5 text-left text-base flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <span>Autre (saisie libre)…</span>
                    </button>
                    <button type="button" onClick={() => { setForm((f) => ({ ...f, sexe: '' })); setSexeOpen(false) }} className={`w-full px-4 py-3.5 text-left text-base flex items-center gap-2 border-t ${isLight ? 'border-gray-100 text-gray-500 hover:bg-gray-50' : 'border-gray-700 text-gray-400 hover:bg-gray-700/80'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span>Supprimer la sélection</span>
                    </button>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          <div>
            <div className={voiceFieldClass('remarques') || undefined}>
            <div className={labelRowClass}>
              <label className={labelClass}>Remarques</label>
              <button type="button" onClick={() => togglePin('remarques')} title={pinButtonTitle('remarques')} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`} aria-label={pinButtonTitle('remarques')}>
                <PinIcon pinned={!!pinned.remarques} isLight={isLight} />
              </button>
            </div>
            <textarea
              value={form.remarques}
              onChange={(e) => setForm((f) => ({ ...f, remarques: e.target.value }))}
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder="Remarques"
              rows={3}
            />
            </div>
          </div>

          {/* Photos */}
          <section>
            <h3 className={`${sectionTitleClass} mb-1`}>
              Photos <span className="font-normal normal-case">(max {MAX_PHOTOS} · {getMaxPhotoFileLabelFr()} chacune)</span>
            </h3>
            <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Les images plus lourdes que {getMaxPhotoFileLabelFr()} sont refusées. Si l’aperçu reste gris, supprimez la photo et en choisissez une autre.
            </p>
            {photoFileError && (
              <p className="mb-3 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2" role="alert">
                {photoFileError}
              </p>
            )}
            <div>
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
                    <div key={index} className="relative">
                      {item.loadFailed ? (
                        <div
                          className={`rounded-xl h-32 w-full border flex items-center justify-center p-2 text-center text-xs ${
                            isLight ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-800/80 border-gray-600 text-gray-300'
                          }`}
                        >
                          Aperçu indisponible (fichier lourd, HEIC / format, ou image corrompue). Supprimez et reprenez une image plus légère (max. {getMaxPhotoFileLabelFr()}) si besoin.
                        </div>
                      ) : (
                        <img
                          src={item.preview}
                          alt={`Aperçu ${index + 1}`}
                          className="rounded-xl h-32 w-full object-cover border border-gray-200 dark:border-gray-600"
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
                        className={`absolute top-1 right-1 p-1 rounded-full text-white ${isLight ? 'bg-red-500 hover:bg-red-600' : 'bg-red-600 hover:bg-red-500'}`}
                        aria-label={`Supprimer la photo ${index + 1}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                {photoItems.length < MAX_PHOTOS && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className={`flex-1 rounded-xl px-4 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1.5 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => photoCameraRef.current?.click()}
                      className={`flex-1 rounded-xl px-4 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1.5 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50'}`}
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
                  className={`flex-1 rounded-xl px-4 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1.5 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => photoCameraRef.current?.click()}
                  className={`flex-1 rounded-xl px-4 py-3.5 min-h-[3.25rem] border border-dashed flex flex-col items-center justify-center gap-1.5 text-base ${isLight ? 'border-gray-300 text-gray-500 hover:bg-gray-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800/50'}`}
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
          </section>

          {/* Position GPS */}
          <section className={`pt-2 border-t ${isLight ? 'border-gray-100' : 'border-gray-800'}`}>
            <h3 className={`${sectionTitleClass} mb-3`}>Position GPS <span className="text-amber-500 font-normal normal-case">*</span></h3>
            <div className="flex flex-col gap-3">
              {(latitude != null && longitude != null) ? (
                <>
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
                    className={`rounded-xl px-4 py-3 text-base font-medium flex items-center justify-center gap-2 min-h-12 ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'} disabled:opacity-50`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {geoLoading ? 'Récupération…' : 'Actualiser la position'}
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
                </>
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
                  {geoError && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">{geoError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className={`rounded-xl px-3.5 py-3 text-base font-medium flex items-center justify-center gap-2 w-full min-h-12 ${isLight ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' : 'bg-teal-900/30 text-teal-200 hover:bg-teal-800/50 border border-teal-600/50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" /></svg>
                    Choisir sur la carte
                  </button>
                </div>
              )}
            </div>
          </section>

          {submitError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3.5 py-2">{submitError}</p>
          )}

          <div className={`flex gap-3 pt-4 border-t ${isLight ? 'border-gray-100' : 'border-gray-800'}`}>
            <button
              type="button"
              onClick={resetForm}
              className={`min-h-12 py-2.5 px-3 rounded-xl text-base font-medium ${isLight ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'}`}
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={handleClose}
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
              {submitLoading ? 'Enregistrement…' : 'Ajouter la donnée'}
            </button>
          </div>
        </div>
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
              className={`flex flex-col items-center gap-3 rounded-lg px-8 py-6 shadow-xl text-center ${
                isLight ? 'bg-white text-emerald-600' : 'bg-gray-800 text-emerald-400'
              }`}
            >
              <svg className="w-14 h-14 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg font-semibold">{successMessage ?? 'Donnée enregistrée'}</span>
            </div>
          </div>
        )}
        </div>
      </div>
    {useGuided && (
      <div
        className={`shrink-0 z-20 border-t px-4 sm:px-5 py-3 ${
          isLight ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'
        }`}
      >
        {submitError && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-2 max-w-2xl mx-auto">{submitError}</p>
        )}
        <div className="max-w-2xl mx-auto flex flex-wrap items-stretch justify-center gap-2">
          <button
            type="button"
            onClick={goPrevGuided}
            disabled={guidedStepClamped <= 0}
            className={`min-h-12 flex-1 min-w-[6rem] rounded-xl text-base font-medium border-2 ${
              guidedStepClamped <= 0
                ? 'opacity-40 border-transparent'
                : isLight
                  ? 'border-gray-200 text-gray-800 hover:bg-gray-50'
                  : 'border-gray-600 text-gray-200 hover:bg-gray-800'
            }`}
          >
            Précédent
          </button>
          {isGuidedObservationSkippableStep(guidedStepId) && guidedStepId !== 'recap' && (
            <button
              type="button"
              onClick={passGuided}
              className={`min-h-12 flex-1 min-w-[6rem] rounded-xl text-base font-medium ${
                isLight ? 'text-sky-700 border border-sky-200' : 'text-sky-300 border border-sky-700'
              }`}
            >
              Passer
            </button>
          )}
          {guidedStepId === 'recap' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
              className="min-h-12 flex-[2] min-w-[10rem] rounded-xl text-base font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {submitLoading ? 'Enregistrement…' : observationToEdit?.id ? 'Enregistrer' : 'Enregistrer l’observation'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNextGuided}
              disabled={
                guidedStepId === 'gps' && (latitude == null || longitude == null)
              }
              className={`min-h-12 flex-[2] min-w-[10rem] rounded-xl text-base font-semibold ${
                guidedStepId === 'gps' && (latitude == null || longitude == null)
                  ? isLight
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-gray-700 text-gray-500'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {guidedStepId === 'gps' && (latitude == null || longitude == null) ? 'Position requise' : 'Suivant'}
            </button>
          )}
        </div>
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-2 mt-2 text-sm">
          <button type="button" onClick={handleClose} className={isLight ? 'text-gray-500' : 'text-gray-400'}>
            Fermer le formulaire
          </button>
        </div>
      </div>
    )}
    </div>
    {/* Modale d'info Données opportunistes */}
    {showDonneesOpportunistesInfo && (
      <div
        className="fixed inset-0 z-[102] flex items-center justify-center p-4 bg-black/50"
        onClick={() => setShowDonneesOpportunistesInfo(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donnees-opportunistes-info-title"
      >
        <div
          className={`relative w-full max-w-md rounded-xl shadow-xl border p-5 ${
            isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="donnees-opportunistes-info-title" className={`text-lg font-semibold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Données opportunistes
          </h3>
          <p className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'} leading-relaxed`}>
            Choisissez <strong>« Données opportunistes »</strong> lorsque vous souhaitez saisir une observation réalisée à l’occasion d’une balade ou d’une sortie sur le terrain, sans suivre un protocole scientifique défini (POP, IPA, etc.).
          </p>
          <p className={`text-sm mt-3 ${isLight ? 'text-gray-600' : 'text-gray-400'} leading-relaxed`}>
            Pour les données collectées dans le cadre d’un protocole précis (passages numérotés, sites dédiés, etc.), sélectionnez plutôt le protocole correspondant dans la liste.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowDonneesOpportunistesInfo(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${isLight ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Modale d'info Présence / Absence */}
    {showPresenceInfo && (
      <div
        className="fixed inset-0 z-[102] flex items-center justify-center p-4 bg-black/50"
        onClick={() => setShowPresenceInfo(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="presence-info-title"
      >
        <div
          className={`relative w-full max-w-md rounded-xl shadow-xl border p-5 ${
            isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="presence-info-title" className={`text-lg font-semibold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Présence et absence
          </h3>
          <p className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'} leading-relaxed`}>
            Pour certains protocoles (POP, IPA, etc.), il est aussi important de préciser <strong>l’absence</strong> de l’espèce que sa présence. Une absence constatée sur un site ou un passage est une donnée à part entière : elle contribue à la connaissance de la répartition et de l’évolution des populations.
          </p>
          <p className={`text-sm mt-3 ${isLight ? 'text-gray-600' : 'text-gray-400'} leading-relaxed`}>
            Choisissez <strong>« Oui »</strong> si vous avez observé l’espèce, <strong>« Non »</strong> si vous étiez sur le site au moment prévu mais n’avez pas observé l’espèce.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowPresenceInfo(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${isLight ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    )}
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
    </>
  )
}
