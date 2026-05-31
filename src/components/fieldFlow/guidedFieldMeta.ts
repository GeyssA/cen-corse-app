/** Métadonnées visuelles pour les parcours « une étape à la fois » (icônes / couleurs). */

export const PROTOCOLE_GUIDED_VISUAL: Array<{
  value: string
  label: string
  hint: string
  emoji: string
}> = [
  {
    value: 'Données opportunistes',
    label: 'Opportuniste',
    hint: 'Hors protocole structuré (balade, sortie…)',
    emoji: '○'
  },
  {
    value: 'POPReptile',
    label: 'POP Reptile',
    hint: 'Protocole reptiles',
    emoji: '🦎'
  },
  {
    value: 'POPAmphibien',
    label: 'POP Amphibien',
    hint: 'Protocole amphibiens',
    emoji: '🐸'
  },
  {
    value: 'IPA',
    label: 'IPA',
    hint: 'Inventaire oiseaux',
    emoji: '🪶'
  }
]

export const GROUPE_GUIDED_VISUAL: Array<{
  value: string
  label: string
  emoji: string
}> = [
  { value: 'Amphibiens', label: 'Amphibiens', emoji: '🐸' },
  { value: 'Reptiles', label: 'Reptiles', emoji: '🦎' },
  { value: 'Oiseaux', label: 'Oiseaux', emoji: '🐦' },
  { value: 'Lépidoptères', label: 'Lépidoptères', emoji: '🦋' },
  { value: 'Arachnides', label: 'Arachnides', emoji: '🕷' },
  { value: 'Odonates', label: 'Odonates', emoji: '🐉' },
  { value: 'Orthoptères', label: 'Orthoptères', emoji: '🦗' },
  { value: 'Mammifères', label: 'Mammifères', emoji: '🦊' },
  { value: 'Poissons', label: 'Poissons', emoji: '🐟' },
  { value: 'Plantes', label: 'Plantes', emoji: '🌿' }
]

export const SEXE_EMOJI: Record<string, string> = {
  Male: '♂',
  Femelle: '♀',
  Indéterminé: '◯'
}
