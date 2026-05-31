/**
 * Enchaînement des étapes « guidées » (IDs stables) pour le modal observation.
 * Les champs contexte (passage, site, présence) ne sont proposés que hors « données opportunistes ».
 * Le groupe taxonomique n’a pas d’étape si imposé par le protocole (POP / IPA).
 */
export function buildGuidedObservationStepIds(
  isHorsProtocole: boolean,
  groupeForced: boolean
): string[] {
  const steps: string[] = ['date', 'protocole']
  if (!isHorsProtocole) {
    steps.push('passage', 'site', 'presence')
  }
  if (!groupeForced) steps.push('groupe')
  steps.push('espece', 'effectif', 'stade', 'sexe', 'remarques', 'photos', 'gps', 'recap')
  return steps
}

const LABELS: Record<string, string> = {
  date: 'Date d’observation',
  protocole: 'Protocole',
  passage: 'Passage',
  site: 'Site',
  presence: 'Présence sur le passage / site',
  groupe: 'Groupe taxonomique',
  espece: 'Espèce',
  effectif: 'Effectif',
  stade: 'Stade',
  sexe: 'Sexe',
  remarques: 'Remarques',
  photos: 'Photos',
  gps: 'Position GPS',
  recap: 'Vérification'
}

export function getGuidedObservationStepLabel(id: string): string {
  return LABELS[id] ?? id
}

export function isGuidedObservationSkippableStep(id: string): boolean {
  return (
    id === 'remarques' ||
    id === 'photos' ||
    id === 'effectif' ||
    id === 'stade' ||
    id === 'sexe' ||
    id === 'espece'
  )
}
