'use client'

import React from 'react'
import { PROTOCOLE_GUIDED_VISUAL, GROUPE_GUIDED_VISUAL, SEXE_EMOJI } from '@/components/fieldFlow/guidedFieldMeta'
import { getGuidedObservationStepLabel } from '@/components/fieldFlow/buildGuidedObservationSteps'
import { choiceChipSelected, choiceChipUnselected, choiceGridSelected, choiceGridUnselected } from '@/lib/choiceSelection'
import { MAX_PHOTOS } from '@/lib/photoUrls'
import type { ObservationForm, ObservationFormKey } from '@/types/observationForm'
import type { ObservationSite } from '@/lib/sites'
import SimpleDateInput from '@/components/ui/SimpleDateInput'

const STADE_LIST: { value: string; label: string }[] = [
  { value: 'Adulte', label: 'Adulte' },
  { value: 'Sub-Adulte', label: 'Sub-Adulte' },
  { value: 'Juvénile', label: 'Juvénile' },
  { value: 'Imago', label: 'Imago' },
  { value: 'Larve', label: 'Larve' },
  { value: 'Ponte', label: 'Ponte' }
]

const SEXE_LIST: { value: string; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Femelle', label: 'Femelle' },
  { value: 'Indéterminé', label: 'Indéterminé' }
]

const EFFECTIF_RACC: string[] = ['1', '2', '3', '5', '10', '20', '50', '100']

type Pin = (field: ObservationFormKey) => void
type PTitle = (field: ObservationFormKey) => string

function StepShell({
  title,
  sub,
  onPin,
  pinTitle,
  field,
  PinIcon,
  pinned,
  isLight,
  children
}: {
  title: string
  sub: string
  onPin: Pin
  pinTitle: PTitle
  field: ObservationFormKey
  PinIcon: (p: { pinned: boolean; isLight: boolean }) => React.JSX.Element
  pinned: boolean
  isLight: boolean
  children: React.ReactNode
}) {
  return (
    <div className="pt-1">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-lg sm:text-xl font-semibold text-left pr-2">{title}</h3>
        <button
          type="button"
          onClick={() => onPin(field)}
          title={pinTitle(field)}
          className={`p-2 rounded-xl shrink-0 ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}
          aria-label={pinTitle(field)}
        >
          <PinIcon pinned={pinned} isLight={isLight} />
        </button>
      </div>
      <p className={`text-sm mb-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>
      {children}
    </div>
  )
}

const subDefault =
  'Une seule information. « Passer » sur les étapes vraiment optionnelles, ou revenez en arrière quand vous voulez.'

export type ObservationModalGuidedBodyProps = {
  stepId: string
  isLight: boolean
  inputClass: string
  form: ObservationForm
  setForm: React.Dispatch<React.SetStateAction<ObservationForm>>
  isHorsProtocole: boolean
  groupeForcedByProtocole: string | null
  getSpeciesListForGroup: (g: string) => string[]
  speciesByGroup: Record<string, string[]> | null
  sites: ObservationSite[]
  pinned: Partial<Record<ObservationFormKey, boolean>>
  pinToggle: Pin
  pinButtonTitle: PTitle
  PinIcon: (p: { pinned: boolean; isLight: boolean }) => React.JSX.Element
  voiceFieldClass: (k: ObservationFormKey) => string
  onShowProtocoleInfo: () => void
  onShowPresenceInfo: () => void
  setProtocoleCustomMode: (v: boolean) => void
  protocoleCustomMode: boolean
  setGroupeCustomMode: (v: boolean) => void
  groupeCustomMode: boolean
  setStadeCustomMode: (v: boolean) => void
  stadeCustomMode: boolean
  setSexeCustomMode: (v: boolean) => void
  sexeCustomMode: boolean
  setSiteOpen: (v: boolean) => void
  siteOpen: boolean
  setSiteCustomMode: (v: boolean) => void
  siteCustomMode: boolean
  siteQuery: string
  setSiteQuery: (q: string) => void
  setEspeceOpen: (v: boolean) => void
  especeOpen: boolean
  speciesQuery: string
  setSpeciesQuery: (q: string) => void
  setProtocoleOpen: (v: boolean) => void
  siteRef: React.RefObject<HTMLDivElement | null>
  siteInputRef: React.RefObject<HTMLInputElement | null>
  especeRef: React.RefObject<HTMLDivElement | null>
  protocoleRef: React.RefObject<HTMLDivElement | null>
  photoItems: Array<{ file: File; preview: string; loadFailed?: boolean }>
  setPhotoItems: React.Dispatch<React.SetStateAction<Array<{ file: File; preview: string; loadFailed?: boolean }>>>
  onAddPhotoFile: (f: File) => void
  photoFileError: string | null
  maxPhotoFileLabel: string
  photoInputRef: React.RefObject<HTMLInputElement | null>
  photoCameraRef: React.RefObject<HTMLInputElement | null>
  latitude: number | null
  longitude: number | null
  geoError: string | null
  geoLoading: boolean
  getPosition: () => void
  onOpenMap: () => void
}

export default function ObservationModalGuidedBody(p: ObservationModalGuidedBodyProps) {
  const { stepId, isLight, inputClass, form, setForm, pinToggle, pinButtonTitle, PinIcon, voiceFieldClass } = p

  const title = getGuidedObservationStepLabel(stepId)

  if (stepId === 'date') {
    return (
      <StepShell
        title={title}
        sub=""
        onPin={pinToggle}
        pinTitle={pinButtonTitle}
        field="date"
        PinIcon={PinIcon}
        pinned={!!p.pinned.date}
        isLight={isLight}
      >
        <p className={`text-base mb-3 font-medium ${isLight ? 'text-gray-800' : 'text-gray-100'}`}>
          {form.date
            ? new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : '—'}
        </p>
        <div className="max-w-md">
          <SimpleDateInput
            value={form.date}
            onChange={(nextIsoDate) => setForm((f) => ({ ...f, date: nextIsoDate }))}
            isLight={isLight}
            ariaLabel="Date d’observation"
          />
        </div>
      </StepShell>
    )
  }

  if (stepId === 'protocole') {
    return (
      <div ref={p.protocoleRef} className="relative pt-1">
        <StepShell
          title={title}
          sub="Choisissez le cadre de la saisie : opportuniste ou protocole scientifique."
          onPin={pinToggle}
          pinTitle={pinButtonTitle}
          field="protocole"
          PinIcon={PinIcon}
          pinned={!!p.pinned.protocole}
          isLight={isLight}
        >
          {p.protocoleCustomMode ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => p.setProtocoleCustomMode(false)}
                className={`text-sm font-medium ${isLight ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Retour à la sélection
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROTOCOLE_GUIDED_VISUAL.map((item) => {
                const selected = form.protocole === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      const g =
                        item.value === 'POPReptile'
                          ? 'Reptiles'
                          : item.value === 'POPAmphibien'
                            ? 'Amphibiens'
                            : item.value === 'IPA'
                              ? 'Oiseaux'
                              : form.groupe
                      setForm((f) => ({
                        ...f,
                        protocole: item.value,
                        groupe: item.value === 'Données opportunistes' ? f.groupe : g
                      }))
                      p.setProtocoleOpen(false)
                    }}
                    className={`group min-h-[5.25rem] rounded-xl p-3.5 text-left transition-colors ${
                      selected ? choiceGridSelected(isLight) : choiceGridUnselected(isLight)
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`
                        flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg
                        ${
                          selected
                            ? isLight
                              ? 'bg-white/90 text-gray-800 ring-1 ring-teal-200/60'
                              : 'bg-gray-900/40 text-gray-200 ring-1 ring-teal-500/20'
                            : isLight
                              ? 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
                              : 'bg-gray-700/50 text-gray-300 group-hover:bg-gray-600/60'
                        }`}
                        aria-hidden
                      >
                        {item.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-semibold text-[15px] leading-snug ${
                            isLight ? 'text-gray-900' : 'text-gray-100'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`mt-0.5 text-xs leading-relaxed ${
                            isLight ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {item.hint}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row flex-wrap gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => p.setProtocoleCustomMode(true)}
                  className={`text-sm font-medium py-1 ${isLight ? 'text-gray-600' : 'text-gray-300'}`}
                >
                  Autre protocole (saisie libre)…
                </button>
                {form.protocole === 'Données opportunistes' && (
                  <button
                    type="button"
                    onClick={p.onShowProtocoleInfo}
                    className={`text-sm font-medium ${isLight ? 'text-teal-700/90 hover:underline' : 'text-teal-400/90 hover:underline'}`}
                  >
                    Qu’est-ce qu’une donnée opportuniste ?
                  </button>
                )}
              </div>
            </div>
          )}
        </StepShell>
      </div>
    )
  }

  if (stepId === 'passage' && !p.isHorsProtocole) {
    return (
      <StepShell
        title={title}
        sub={subDefault}
        onPin={pinToggle}
        pinTitle={pinButtonTitle}
        field="passage"
        PinIcon={PinIcon}
        pinned={!!p.pinned.passage}
        isLight={isLight}
      >
        {form.protocole === 'POPReptile' || form.protocole === 'POPAmphibien' ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(form.protocole === 'POPReptile' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]).map((num) => {
              const value = String(num)
              const selected = form.passage === value
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, passage: value }))}
                  className={`min-h-14 rounded-2xl text-lg font-bold transition-colors ${
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
            placeholder="Identifiant du passage"
          />
        )}
      </StepShell>
    )
  }

  if (stepId === 'site' && !p.isHorsProtocole) {
    return (
      <div ref={p.siteRef} className="relative scroll-mt-16">
        <div className={voiceFieldClass('groupe') || undefined}>
          <StepShell
            title={title}
            sub="Lien avec un site d’inventaire déjà créé, ou saisie libre."
            onPin={pinToggle}
            pinTitle={pinButtonTitle}
            field="site"
            PinIcon={PinIcon}
            pinned={!!p.pinned.site}
            isLight={isLight}
          >
            {!form.protocole ? (
              <div className={`${inputClass} opacity-80`}>
                <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Choisissez d’abord un protocole (étape précédente)</span>
              </div>
            ) : p.siteCustomMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.site}
                  onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
                  className={inputClass}
                  placeholder="Nom du site (saisie libre)"
                />
                <button
                  type="button"
                  onClick={() => {
                    p.setSiteCustomMode(false)
                    setForm((f) => ({ ...f, site: '' }))
                    p.setSiteQuery('')
                  }}
                  className={`text-sm font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
                >
                  Choisir un site existant
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    ref={p.siteInputRef}
                    type="text"
                    value={form.site || p.siteQuery}
                    onChange={(e) => {
                      const q = e.target.value
                      p.setSiteQuery(q)
                      if (form.site) setForm((f) => ({ ...f, site: '' }))
                      p.setSiteOpen(true)
                    }}
                    onFocus={() => {
                      p.siteRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                      p.setSiteOpen(true)
                    }}
                    className={`${inputClass} pr-12`}
                    placeholder="Rechercher un site…"
                    autoComplete="off"
                  />
                </div>
                {p.siteOpen && (
                  <div
                    className={`mt-2 max-h-64 overflow-y-auto rounded-2xl border ${
                      isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'
                    }`}
                  >
                    {p.sites.length === 0 ? (
                      <p className={`p-4 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        Aucun site enregistré. Utilisez la saisie libre.
                      </p>
                    ) : (
                      (() => {
                        const q = (p.siteQuery || form.site || '').trim().toLowerCase()
                        const filtered = q
                          ? p.sites.filter((s) => s.nom_du_site.toLowerCase().includes(q)).slice(0, 80)
                          : p.sites.slice(0, 80)
                        return (
                          <>
                            {filtered.length === 0 && (
                              <p className={`p-3 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Aucun site ne correspond.</p>
                            )}
                            {filtered.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setForm((f) => ({ ...f, site: s.nom_du_site }))
                                  p.setSiteQuery('')
                                  p.setSiteOpen(false)
                                }}
                                className={`w-full text-left px-3 py-3.5 text-base border-b last:border-0 ${
                                  isLight
                                    ? 'hover:bg-teal-50/80 text-gray-800 border-gray-100'
                                    : 'hover:bg-gray-700/50 text-gray-200 border-gray-600'
                                }`}
                              >
                                {s.nom_du_site}
                              </button>
                            ))}
                          </>
                        )
                      })()
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        p.setSiteCustomMode(true)
                        p.setSiteOpen(false)
                        setForm((f) => ({ ...f, site: '' }))
                        p.setSiteQuery('')
                      }}
                      className={`w-full px-3 py-3 text-left text-sm font-medium ${isLight ? 'text-sky-700 bg-sky-50/60' : 'text-sky-300 bg-sky-900/25'}`}
                    >
                      Saisie libre (nouveau site)…
                    </button>
                  </div>
                )}
              </>
            )}
          </StepShell>
        </div>
      </div>
    )
  }

  if (stepId === 'presence' && !p.isHorsProtocole) {
    return (
      <div className="pt-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg sm:text-xl font-semibold pr-2 flex-1">{title}</h3>
          <div className="flex gap-0.5 shrink-0">
            <button
              type="button"
              onClick={p.onShowPresenceInfo}
              className={`p-2 rounded-xl ${isLight ? 'text-gray-500 hover:bg-gray-200' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => pinToggle('presence')}
              title={pinButtonTitle('presence')}
              className={`p-2 rounded-xl ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}
            >
              <PinIcon pinned={!!p.pinned.presence} isLight={isLight} />
            </button>
          </div>
        </div>
        <p className={`text-sm mb-6 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          A-t-on constaté la <strong>présence</strong> de l’espèce, ou une <strong>absence</strong> (non observation) sur ce passage / site ?
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, presence: true }))}
            className={`min-h-20 rounded-2xl text-base font-bold transition-colors ${
              form.presence ? choiceGridSelected(isLight) : choiceGridUnselected(isLight)
            }`}
          >
            Présent
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, presence: false }))}
            className={`min-h-20 rounded-2xl text-base font-bold transition-colors ${
              !form.presence ? choiceGridSelected(isLight) : choiceGridUnselected(isLight)
            }`}
          >
            Absent
          </button>
        </div>
      </div>
    )
  }

  if (stepId === 'groupe' && !p.groupeForcedByProtocole) {
    return (
      <StepShell
        title={title}
        sub="Le groupe sert surtout à filtrer le référentiel d’espèces. Touchez la vignette."
        onPin={pinToggle}
        pinTitle={pinButtonTitle}
        field="groupe"
        PinIcon={PinIcon}
        pinned={!!p.pinned.groupe}
        isLight={isLight}
      >
        {p.groupeCustomMode ? (
          <div className="space-y-2">
            <button type="button" onClick={() => p.setGroupeCustomMode(false)} className={`text-sm font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
              Voir la grille
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {GROUPE_GUIDED_VISUAL.map((g) => {
              const active = form.groupe === g.value
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, groupe: g.value }))}
                  className={`min-h-[4.5rem] flex flex-col items-center justify-center rounded-2xl p-2 text-sm font-semibold transition-colors ${
                    active ? choiceGridSelected(isLight) : choiceGridUnselected(isLight)
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {g.emoji}
                  </span>
                  <span className="mt-0.5 text-center leading-tight text-xs sm:text-sm">{g.label}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => p.setGroupeCustomMode(true)}
              className={`min-h-14 col-span-2 sm:col-span-3 rounded-2xl border-2 border-dashed text-sm font-medium ${
                isLight ? 'border-gray-300 text-gray-500' : 'border-gray-500 text-gray-400'
              }`}
            >
              + Autre (saisie libre)
            </button>
          </div>
        )}
      </StepShell>
    )
  }

  if (stepId === 'espece') {
    const list = p.getSpeciesListForGroup(form.groupe)
    return (
      <div ref={p.especeRef} className="relative">
        <div className={voiceFieldClass('nom_espece') || undefined}>
          <StepShell
            title={title}
            sub="D’abord le groupe, puis l’espèce. Si une liste s’ouvre, touchez une ligne pour valider."
            onPin={pinToggle}
            pinTitle={pinButtonTitle}
            field="nom_espece"
            PinIcon={PinIcon}
            pinned={!!p.pinned.nom_espece}
            isLight={isLight}
          >
            {!form.groupe ? (
              <div className={`${inputClass} opacity-80`}>
                <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>D’abord le groupe taxonomique (étape précédente)</span>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={list.length === 0 ? form.nom_espece : form.nom_espece || p.speciesQuery}
                  onChange={(e) => {
                    const v = e.target.value
                    if (list.length === 0) {
                      setForm((f) => ({ ...f, nom_espece: v }))
                      p.setSpeciesQuery('')
                    } else {
                      p.setSpeciesQuery(v)
                      if (form.nom_espece) setForm((f) => ({ ...f, nom_espece: '' }))
                      p.setEspeceOpen(true)
                    }
                  }}
                  onFocus={() => { if (list.length > 0) p.setEspeceOpen(true) }}
                  className={inputClass}
                  placeholder={list.length === 0 ? 'Nom de l’espèce' : 'Filtre sur la liste…'}
                  autoComplete="off"
                />
                {p.especeOpen && form.groupe && (
                  (() => {
                    const q = (p.speciesQuery || form.nom_espece || '').trim().toLowerCase()
                    const filtered = q
                      ? list.filter((n) => n.toLowerCase().includes(q)).slice(0, 80)
                      : list.slice(0, 80)
                    const isLoading = form.groupe !== 'Amphibiens' && form.groupe !== 'Reptiles' && p.speciesByGroup == null
                    return (
                      <div
                        className={`mt-2 max-h-56 overflow-y-auto rounded-2xl border ${
                          isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'
                        }`}
                      >
                        {isLoading ? (
                          <p className={`p-3 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Chargement des listes d’espèces…</p>
                        ) : (
                          filtered.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, nom_espece: name }))
                                p.setSpeciesQuery('')
                                p.setEspeceOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm border-b last:border-0 ${
                                isLight
                                  ? 'hover:bg-teal-50/80 text-gray-800 border-gray-100'
                                  : 'hover:bg-gray-700/50 text-gray-200 border-gray-600'
                              }`}
                            >
                              {name}
                            </button>
                          ))
                        )}
                      </div>
                    )
                  })()
                )}
              </>
            )}
          </StepShell>
        </div>
      </div>
    )
  }

  if (stepId === 'effectif') {
    return (
      <div className={voiceFieldClass('effectif') || undefined}>
        <StepShell
          title={title}
          sub="Raccourcis fréquents, ou clavier pour un autre nombre. Plus tard : « Passer » si inutile."
          onPin={pinToggle}
          pinTitle={pinButtonTitle}
          field="effectif"
          PinIcon={PinIcon}
          pinned={!!p.pinned.effectif}
          isLight={isLight}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            {EFFECTIF_RACC.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm((f) => ({ ...f, effectif: k }))}
                className={`min-h-12 w-16 rounded-xl text-lg font-bold transition-colors ${
                  form.effectif === k ? choiceChipSelected(isLight) : choiceChipUnselected(isLight)
                }`}
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, effectif: '' }))}
              className={`min-h-12 px-4 rounded-xl text-sm font-medium ${
                isLight ? 'bg-gray-200/80' : 'bg-gray-600/80'
              }`}
            >
              Effacer
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={form.effectif}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              setForm((f) => ({ ...f, effectif: v }))
            }}
            className={inputClass}
            placeholder="Autre nombre (optionnel)"
          />
        </StepShell>
      </div>
    )
  }

  if (stepId === 'stade') {
    return (
      <div>
        <div className={voiceFieldClass('stade') || undefined}>
          <StepShell
            title={title}
            sub="Stade biologique observé, ou saisie libre."
            onPin={pinToggle}
            pinTitle={pinButtonTitle}
            field="stade"
            PinIcon={PinIcon}
            pinned={!!p.pinned.stade}
            isLight={isLight}
          >
            {p.stadeCustomMode ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => p.setStadeCustomMode(false)}
                  className={`text-sm font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
                >
                  Grille
                </button>
                <input
                  type="text"
                  value={form.stade}
                  onChange={(e) => setForm((f) => ({ ...f, stade: e.target.value }))}
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STADE_LIST.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, stade: o.value }))}
                    className={`min-h-14 flex items-center justify-center rounded-2xl px-2 text-sm font-semibold transition-colors ${
                      form.stade === o.value ? choiceGridSelected(isLight) : choiceChipUnselected(isLight)
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => p.setStadeCustomMode(true)}
                  className="col-span-2 sm:col-span-3 min-h-11 rounded-2xl border-2 border-dashed text-sm"
                >
                  Stade (saisie libre)
                </button>
              </div>
            )}
          </StepShell>
        </div>
      </div>
    )
  }

  if (stepId === 'sexe') {
    return (
      <div>
        <div className={voiceFieldClass('sexe') || undefined}>
          <StepShell
            title={title}
            sub="Laissez vide ou touchez symbole, ou saisie libre."
            onPin={pinToggle}
            pinTitle={pinButtonTitle}
            field="sexe"
            PinIcon={PinIcon}
            pinned={!!p.pinned.sexe}
            isLight={isLight}
          >
            {p.sexeCustomMode ? (
              <div className="space-y-2">
                <button type="button" onClick={() => p.setSexeCustomMode(false)} className={`text-sm font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
                  Grille
                </button>
                <input
                  type="text"
                  value={form.sexe}
                  onChange={(e) => setForm((f) => ({ ...f, sexe: e.target.value }))}
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {SEXE_LIST.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sexe: o.value }))}
                    className={`min-h-[4.5rem] rounded-2xl flex flex-col items-center justify-center transition-colors ${
                      form.sexe === o.value ? choiceGridSelected(isLight) : choiceGridUnselected(isLight)
                    }`}
                  >
                    <span className="text-4xl font-light">{SEXE_EMOJI[o.value]}</span>
                    <span className="text-sm font-medium mt-1">{o.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => p.setSexeCustomMode(true)}
                  className="sm:col-span-3 min-h-10 rounded-2xl border-2 border-dashed text-sm"
                >
                  Saisie libre
                </button>
              </div>
            )}
          </StepShell>
        </div>
      </div>
    )
  }

  if (stepId === 'remarques') {
    return (
      <StepShell
        title={title}
        sub="Détail du terrain, météo, comptage approximatif… Vous pourrez sauter plus tard."
        onPin={pinToggle}
        pinTitle={pinButtonTitle}
        field="remarques"
        PinIcon={PinIcon}
        pinned={!!p.pinned.remarques}
        isLight={isLight}
      >
        <textarea
          value={form.remarques}
          onChange={(e) => setForm((f) => ({ ...f, remarques: e.target.value }))}
          className={`${inputClass} min-h-32 resize-y text-base leading-relaxed`}
          placeholder="Remarques (optionnel)"
          rows={5}
        />
      </StepShell>
    )
  }

  if (stepId === 'photos') {
    return (
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-1">Photos</h3>
        <p className={`text-sm mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          Optionnel — max {MAX_PHOTOS} clichés · {p.maxPhotoFileLabel} chacune, ou « Passer ».
        </p>
        <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          Si l’image est refusée ou l’aperçu gris, allégez ou changez de fichier.
        </p>
        {p.photoFileError && (
          <p
            className="mb-3 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2"
            role="alert"
          >
            {p.photoFileError}
          </p>
        )}
        <input
          ref={p.photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && p.photoItems.length < MAX_PHOTOS) p.onAddPhotoFile(f)
            e.target.value = ''
          }}
        />
        <input
          ref={p.photoCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && p.photoItems.length < MAX_PHOTOS) p.onAddPhotoFile(f)
            e.target.value = ''
          }}
        />
        {p.photoItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {p.photoItems.map((it, i) => (
              <div key={i} className="relative">
                {it.loadFailed ? (
                  <div
                    className={`rounded-xl h-28 w-full border flex items-center justify-center p-1.5 text-center text-[10px] leading-tight ${
                      isLight ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-800/80 border-gray-600 text-gray-300'
                    }`}
                  >
                    Aperçu indisponible — supprimez et reprenez (max. {p.maxPhotoFileLabel}).
                  </div>
                ) : (
                  <img
                    src={it.preview}
                    alt=""
                    className="rounded-xl h-28 w-full object-cover border border-gray-200 dark:border-gray-600"
                    onError={() => {
                      p.setPhotoItems((prev) => prev.map((x, j) => (j === i ? { ...x, loadFailed: true } : x)))
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(it.preview)
                    p.setPhotoItems((prev) => prev.filter((_, j) => j !== i))
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {p.photoItems.length < MAX_PHOTOS && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => p.photoInputRef.current?.click()}
              className={`flex-1 min-h-14 rounded-2xl border-2 border-dashed ${isLight ? 'border-gray-300' : 'border-gray-600'}`}
            >
              Galerie
            </button>
            <button
              type="button"
              onClick={() => p.photoCameraRef.current?.click()}
              className={`flex-1 min-h-14 rounded-2xl border-2 border-dashed ${isLight ? 'border-gray-300' : 'border-gray-600'}`}
            >
              Appareil photo
            </button>
          </div>
        )}
      </div>
    )
  }

  if (stepId === 'gps') {
    return (
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-1">Position GPS</h3>
        <p className={`text-sm mb-4 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>* Donnée obligatoire pour enregistrer.</p>
        {p.latitude != null && p.longitude != null ? (
          <>
            <div className={`rounded-2xl px-4 py-3 border mb-3 ${isLight ? 'bg-teal-50/90 border-teal-200' : 'bg-teal-900/25 border-teal-700/50'}`}>
              <p className={`text-sm font-medium ${isLight ? 'text-teal-800' : 'text-teal-200'}`}>Point enregistré</p>
              <p className="text-xs font-mono text-teal-700 dark:text-teal-300">
                {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={p.getPosition}
                disabled={p.geoLoading}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-medium ${isLight ? 'bg-gray-100' : 'bg-gray-700'}`}
              >
                {p.geoLoading ? '…' : 'Rafraîchir la position'}
              </button>
              <button
                type="button"
                onClick={p.onOpenMap}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-medium border ${isLight ? 'border-teal-200' : 'border-teal-600'}`}
              >
                Choisir sur la carte
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={p.getPosition}
              disabled={p.geoLoading}
              className={`w-full min-h-14 rounded-2xl font-semibold text-base ${isLight ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'}`}
            >
              {p.geoLoading ? 'Localisation…' : 'Utiliser ma position actuelle'}
            </button>
            {p.geoError && <p className="text-sm text-amber-600 dark:text-amber-400">{p.geoError}</p>}
            <button type="button" onClick={p.onOpenMap} className="w-full min-h-12 rounded-2xl border-2 text-sm font-medium">
              Choisir sur la carte
            </button>
          </div>
        )}
      </div>
    )
  }

  if (stepId === 'recap') {
    const lines: { l: string; v: string }[] = [
      { l: 'Date', v: form.date || '—' },
      { l: 'Protocole', v: form.protocole || '—' },
      ...(!p.isHorsProtocole
        ? [
            { l: 'Passage', v: form.passage || '—' },
            { l: 'Site', v: form.site || '—' },
            { l: 'Présence', v: form.presence ? 'Oui' : 'Non' }
          ]
        : []),
      { l: 'Groupe', v: form.groupe || '—' },
      { l: 'Espèce', v: form.nom_espece || '—' },
      { l: 'Effectif', v: form.effectif || '—' },
      { l: 'Stade', v: form.stade || '—' },
      { l: 'Sexe', v: form.sexe || '—' },
      { l: 'Remarques', v: form.remarques || '—' }
    ]
    return (
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-1">Avant d’enregistrer</h3>
        <p className={`text-sm mb-3 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Vérifiez l’essentiel. Vous pourrez revenir en arrière avec le bouton ci-dessous.</p>
        <ul className="space-y-2 rounded-2xl border p-3 text-sm mb-2">
          {lines.map((r) => (
            <li key={r.l} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 border-b border-gray-100/40 dark:border-gray-700/50 last:border-0 pb-1.5 last:pb-0">
              <span className="font-medium text-gray-500 dark:text-gray-400 shrink-0 w-32">{r.l}</span>
              <span className="break-words sm:flex-1">{r.v}</span>
            </li>
          ))}
          <li className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="font-medium text-gray-500 dark:text-gray-400 w-32">Photos</span>
            <span>{p.photoItems.length} fichier(s)</span>
          </li>
          <li className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="font-medium text-gray-500 dark:text-gray-400 w-32">GPS</span>
            <span>
              {p.latitude != null && p.longitude != null
                ? `${p.latitude.toFixed(5)} — ${p.longitude.toFixed(5)}`
                : 'Manquant (ne pas enregistrer sans position)'}
            </span>
          </li>
        </ul>
      </div>
    )
  }

  return <p className="text-amber-600 p-2">Étape inconnue : {stepId}</p>
}
