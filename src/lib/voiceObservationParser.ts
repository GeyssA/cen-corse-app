/**
 * Parse un texte en français (ex. dictée vocale) pour en extraire
 * les champs d'une observation naturaliste (espèce, stade, sexe, effectif, remarques).
 * Utilise la liste complète des espèces de l'app (species-by-group) quand elle est fournie.
 */

export interface VoiceParsedObservation {
  groupe: string
  nom_espece: string
  stade: string
  sexe: string
  effectif: string
  remarques: string
}

/** Type du fichier species-by-group.json : groupe → liste des libellés complets. */
export type SpeciesByGroup = Record<string, string[]>

/** Espèces en dur (fallback si pas de taxonomie fournie) : Amphibiens et Reptiles Corse. */
const FALLBACK_SPECIES: { groupe: string; fullName: string; shortName: string }[] = [
  { groupe: 'Amphibiens', fullName: 'Discoglosse sarde - Discoglossus sardus Tschudi in Otth, 1837', shortName: 'Discoglosse sarde' },
  { groupe: 'Amphibiens', fullName: 'Discoglosse corse - Discoglossus montalentii Lanza, Nascetti, Capula & Bullini, 1984', shortName: 'Discoglosse corse' },
  { groupe: 'Amphibiens', fullName: 'Crapaud vert des Baléares - Bufotes viridis balearicus (Boettger, 1880)', shortName: 'Crapaud vert des Baléares' },
  { groupe: 'Amphibiens', fullName: 'Crapaud vert des Baléares - Bufotes viridis balearicus (Boettger, 1880)', shortName: 'Crapaud vert' },
  { groupe: 'Amphibiens', fullName: 'Grenouille de Berger - Pelophylax lessonae bergeri (Günther in Engelmann, Fritzsche, Günther & Obst, 1986)', shortName: 'Grenouille de Berger' },
  { groupe: 'Amphibiens', fullName: 'Rainette sarde - Hyla sarda (Betta, 1857)', shortName: 'Rainette sarde' },
  { groupe: 'Amphibiens', fullName: 'Euprocte de Corse - Euproctus montanus (Savi, 1838)', shortName: 'Euprocte de Corse' },
  { groupe: 'Amphibiens', fullName: 'Salamandre corse - Salamandra corsica (Savi, 1838)', shortName: 'Salamandre corse' },
  { groupe: 'Reptiles', fullName: 'Lézard tyrrhénien - Podarcis tiliguerta (Gmelin, 1789)', shortName: 'Lézard tyrrhénien' },
  { groupe: 'Reptiles', fullName: 'Lézard sicilien - Podarcis siculus (Rafinesque-Schmaltz, 1810)', shortName: 'Lézard sicilien' },
  { groupe: 'Reptiles', fullName: 'Lézard de Bedriaga - Archaeolacerta bedriagae (Camerano, 1885)', shortName: 'Lézard de Bedriaga' },
  { groupe: 'Reptiles', fullName: 'Algyroïde de Fitzinger - Algyroides fitzingeri (Wiegmann, 1834)', shortName: 'Algyroïde de Fitzinger' },
  { groupe: 'Reptiles', fullName: 'Couleuvre helvétique de Corse - Natrix helvetica corsa (Hecht, 1930)', shortName: 'Couleuvre helvétique de Corse' },
  { groupe: 'Reptiles', fullName: 'Couleuvre verte et jaune - Hierophis viridiflavus (Lacepède, 1789)', shortName: 'Couleuvre verte et jaune' },
  { groupe: 'Reptiles', fullName: 'Tarente de maurétanie - Tarentola mauritanica (Linnaeus, 1758)', shortName: 'Tarente de maurétanie' },
  { groupe: 'Reptiles', fullName: "Phyllodactyle d'Europe - Euleptes europaea (Gené, 1839)", shortName: "Phyllodactyle d'Europe" },
  { groupe: 'Reptiles', fullName: 'Hémydactyle verruqueux - Hemidactylus turcicus (Linnaeus, 1758)', shortName: 'Hémydactyle verruqueux' },
  { groupe: 'Reptiles', fullName: "Tortue d'Hermann - Testudo hermanni Gmelin, 1789", shortName: "Tortue d'Hermann" },
  { groupe: 'Reptiles', fullName: 'Tortue de Floride - Trachemys scripta scripta (Schoepff, 1792)', shortName: 'Tortue de Floride' },
  { groupe: 'Reptiles', fullName: "Cistude d'Europe - Emys orbicularis (Linnaeus, 1758)", shortName: "Cistude d'Europe" }
]

/** Oiseaux courants (fallback) pour la reconnaissance vocale, évite que "rousse" ou "pie" matchent des lépidoptères. */
const FALLBACK_BIRDS: { groupe: string; fullName: string; shortName: string }[] = [
  { groupe: 'Oiseaux', fullName: 'Pie-grièche à tête rousse - Lanius collurio Linnaeus, 1758', shortName: 'Pie-grièche à tête rousse' },
  { groupe: 'Oiseaux', fullName: 'Pie-grièche méridionale - Lanius meridionalis Temminck, 1820', shortName: 'Pie-grièche méridionale' },
  { groupe: 'Oiseaux', fullName: 'Pie-grièche à poitrine rose - Lanius minor Gmelin, 1788', shortName: 'Pie-grièche à poitrine rose' },
  { groupe: 'Oiseaux', fullName: 'Pie-grièche grise - Lanius excubitor Linnaeus, 1758', shortName: 'Pie-grièche grise' }
]

/** Noms complets des oiseaux de repli (pour les inclure dans la liste Oiseaux de la modale d’observation). */
export const FALLBACK_BIRDS_FULL_NAMES: string[] = FALLBACK_BIRDS.map((x) => x.fullName)

/** Mots-clés vocaux → valeur stade. (Sub-Adulte avant Adulte pour éviter de matcher "adulte" dans "subadulte".) */
const STADE_KEYWORDS: { keywords: string[]; value: string }[] = [
  { keywords: ['sub-adulte', 'subadulte', 'sub adulte', 'sub adultes'], value: 'Sub-Adulte' },
  { keywords: ['adulte', 'adultes'], value: 'Adulte' },
  { keywords: ['juvénile', 'juvéniles', 'juvenile', 'juveniles'], value: 'Juvénile' },
  { keywords: ['imago'], value: 'Imago' },
  { keywords: ['larve', 'larves'], value: 'Larve' },
  { keywords: ['têtard', 'têtards', 'tetard', 'tetards'], value: 'Larve' },
  { keywords: ['ponte', 'pontes'], value: 'Ponte' }
]

/** Mots-clés vocaux → valeur sexe. */
const SEXE_KEYWORDS: { keywords: string[]; value: string }[] = [
  { keywords: ['mâle', 'male', 'males', 'mâles'], value: 'Male' },
  { keywords: ['femelle', 'femelles'], value: 'Femelle' },
  { keywords: ['indéterminé', 'indetermine'], value: 'Indéterminé' }
]

/** Mots-clés vocaux → groupe (si aucune espèce reconnue, ex. "j'ai vu 2 oiseaux"). */
const GROUPE_KEYWORDS: { keywords: string[]; value: string }[] = [
  { keywords: ['amphibien', 'amphibiens', 'crapaud', 'crapauds', 'grenouille', 'grenouilles', 'salamandre', 'rainette', 'euprocte', 'discoglosse'], value: 'Amphibiens' },
  { keywords: ['reptile', 'reptiles', 'lézard', 'lezard', 'couleuvre', 'tortue', 'tarente', 'cistude'], value: 'Reptiles' },
  { keywords: ['oiseau', 'oiseaux', 'pie', 'moineau', 'rougegorge', 'merle', 'mésange', 'mesange', 'hirondelle', 'pinson', 'corbeau', 'étourneau', 'pigeon', 'faucon', 'buse', 'aigle'], value: 'Oiseaux' },
  { keywords: ['lépidoptère', 'lepidoptere', 'papillon', 'papillons'], value: 'Lépidoptères' },
  { keywords: ['araignée', 'araignees', 'araignee'], value: 'Arachnides' },
  { keywords: ['libellule', 'libellules', 'odonate'], value: 'Odonates' },
  { keywords: ['orthoptère', 'orthoptere', 'criquet', 'sauterelle'], value: 'Orthoptères' },
  { keywords: ['mammifère', 'mammiferes', 'mammifere'], value: 'Mammifères' },
  { keywords: ['poisson', 'poissons'], value: 'Poissons' },
  { keywords: ['plante', 'plantes'], value: 'Plantes' }
]

function normalize(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

/** Enlève le "s" du pluriel en fin de mot (crapauds verts → crapaud vert). */
function stripPluralS(t: string): string {
  return t.replace(/\b(\w{3,})s\b/g, '$1')
}

/** Extrait le libellé court d'un nom complet (partie avant " - " ou tout le nom). */
function shortNameFromFull(fullName: string): string {
  const idx = fullName.indexOf(' - ')
  return (idx >= 0 ? fullName.slice(0, idx).trim() : fullName.trim()) || fullName
}

/** Construit la liste de recherche : groupe + nom complet + nom court + nom scientifique, triée par longueur (longs en premier). Les espèces de repli (Amphibiens, Reptiles Corse) sont toujours fusionnées pour que "lézard tyrrhénien" etc. soient reconnus même si le JSON ne contient pas ces groupes. */
function buildSearchList(speciesByGroup: SpeciesByGroup | null): { groupe: string; fullName: string; shortNameNorm: string; scientificNorm: string }[] {
  /** Extrait la partie scientifique du fullName (après " - ") et enlève (Auteur, année). */
  function scientificPart(fullName: string): string {
    const idx = fullName.indexOf(' - ')
    if (idx < 0) return ''
    const part = fullName.slice(idx + 3).trim()
    const paren = part.indexOf('(')
    const name = (paren >= 0 ? part.slice(0, paren).trim() : part).trim()
    return normalize(name)
  }

  const list: { groupe: string; fullName: string; shortNameNorm: string; scientificNorm: string }[] = []

  if (speciesByGroup && typeof speciesByGroup === 'object') {
    for (const [groupe, names] of Object.entries(speciesByGroup)) {
      if (Array.isArray(names)) {
        for (const fullName of names) {
          if (typeof fullName !== 'string' || !fullName.trim()) continue
          const shortName = shortNameFromFull(fullName)
          const shortNameNorm = stripPluralS(normalize(shortName)).replace(/-/g, ' ')
          const scientificNorm = scientificPart(fullName.trim())
          list.push({ groupe, fullName: fullName.trim(), shortNameNorm, scientificNorm })
        }
      }
    }
  }

  // Toujours ajouter les Amphibiens et Reptiles (Corse) pour que "lézard tyrrhénien", "crapaud vert" etc. soient reconnus même absents du JSON
  for (const { groupe, fullName, shortName } of FALLBACK_SPECIES) {
    const shortNameNorm = stripPluralS(normalize(shortName)).replace(/-/g, ' ')
    const scientificNorm = scientificPart(fullName)
    list.push({ groupe, fullName, shortNameNorm, scientificNorm })
  }
  // Toujours ajouter des oiseaux courants (ex. pie-grièche) pour éviter que "rousse" / "pie" matchent des lépidoptères
  for (const { groupe, fullName, shortName } of FALLBACK_BIRDS) {
    const shortNameNorm = stripPluralS(normalize(shortName)).replace(/-/g, ' ')
    const scientificNorm = scientificPart(fullName)
    list.push({ groupe, fullName, shortNameNorm, scientificNorm })
  }

  list.sort((a, b) => Math.max(b.shortNameNorm.length, b.scientificNorm.length) - Math.max(a.shortNameNorm.length, a.scientificNorm.length))
  return list
}

/** Échappe les caractères spéciaux pour une utilisation dans RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Retourne true si le texte contient le terme comme mot(s) entier(s) (limites de mot). */
function containsAsWordBoundary(text: string, term: string): boolean {
  if (!term.trim()) return false
  const escaped = escapeRegex(term.trim())
  try {
    const re = new RegExp(`\\b${escaped}\\b`, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      // Éviter le faux positif "Aï" dans "j'ai" : ne pas compter "ai" quand il suit "j'"
      if (term === 'ai' && m.index >= 2 && text.slice(m.index - 2, m.index) === "j'") continue
      return true
    }
    return false
  } catch {
    return text.includes(term)
  }
}

/** Trouve une espèce dans le texte : recherche dans la liste (nom court ou scientifique), avec normalisation identique liste + transcription (minuscules, tirets → espaces, " de " → espace). On retourne l'espèce dont le terme reconnu est le plus long (match le plus spécifique), pour éviter qu'un mot commun comme "tyrrhenien" fasse gagner une autre espèce avant "Lézard tyrrhénien". */
function findSpecies(
  textNorm: string,
  speciesByGroup: SpeciesByGroup | null
): { groupe: string; nom_espece: string } | null {
  const textForMatch = stripPluralS(textNorm)
    .replace(/\bpigrieches?\b/g, 'pie grieche')
    .replace(/\btiligarta\b/g, 'tiliguerta')
    .replace(/\s+de\s+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const list = buildSearchList(speciesByGroup)
  let best: { groupe: string; nom_espece: string; matchLength: number } | null = null
  for (const { groupe, fullName, shortNameNorm, scientificNorm } of list) {
    if (shortNameNorm && containsAsWordBoundary(textForMatch, shortNameNorm)) {
      const len = shortNameNorm.length
      if (!best || len > best.matchLength) best = { groupe, nom_espece: fullName, matchLength: len }
    }
    if (scientificNorm && containsAsWordBoundary(textForMatch, scientificNorm)) {
      const len = scientificNorm.length
      if (!best || len > best.matchLength) best = { groupe, nom_espece: fullName, matchLength: len }
    }
  }
  return best ? { groupe: best.groupe, nom_espece: best.nom_espece } : null
}

/** Trouve le groupe seul si aucune espèce reconnue. */
function findGroupeOnly(textNorm: string): string {
  for (const { keywords, value } of GROUPE_KEYWORDS) {
    if (keywords.some((k) => textNorm.includes(k))) return value
  }
  return ''
}

function findStade(textNorm: string): string {
  for (const { keywords, value } of STADE_KEYWORDS) {
    if (keywords.some((k) => textNorm.includes(k))) return value
  }
  return ''
}

function findSexe(textNorm: string): string {
  for (const { keywords, value } of SEXE_KEYWORDS) {
    if (keywords.some((k) => textNorm.includes(k))) return value
  }
  return ''
}

function findEffectif(text: string): string {
  const numbers = text.match(/\b(\d{1,4})\b/g)
  if (numbers && numbers.length > 0) return numbers[0]
  const textLower = text.toLowerCase().trim()
  const numberWords: [RegExp, string][] = [
    [/\b(un|une)\b/, '1'],
    [/\bdeux\b/, '2'],
    [/\btrois\b/, '3'],
    [/\bquatre\b/, '4'],
    [/\bcinq\b/, '5'],
    [/\bsix\b/, '6'],
    [/\bsept\b/, '7'],
    [/\bhuit\b/, '8'],
    [/\bneuf\b/, '9'],
    [/\bdix\b/, '10']
  ]
  for (const [re, val] of numberWords) {
    if (re.test(textLower)) return val
  }
  return ''
}

/**
 * Parse une phrase en français et retourne les champs pré-remplis.
 * Logique groupe/espèce : on cherche uniquement une espèce dans la liste (tous groupes).
 * Si une espèce est trouvée, groupe et nom_espece viennent d'elle. Sinon, groupe peut être
 * déduit des mots-clés (ex. "2 amphibiens" sans espèce), et nom_espece reste vide.
 */
export function parseVoiceToObservation(
  transcript: string,
  speciesByGroup?: SpeciesByGroup | null
): VoiceParsedObservation {
  const trimmed = transcript.trim()
  const textNorm = normalize(trimmed)

  const species = findSpecies(textNorm, speciesByGroup ?? null)
  let groupe = species?.groupe ?? ''
  let nom_espece = species?.nom_espece ?? ''
  if (!groupe) {
    groupe = findGroupeOnly(textNorm)
  }
  const stade = findStade(textNorm)
  const sexe = findSexe(textNorm)
  const effectif = findEffectif(trimmed)

  return {
    groupe,
    nom_espece,
    stade,
    sexe,
    effectif,
    remarques: '' // ne pas mettre la transcription ici ; la modale affichera un libellé fixe
  }
}

/** Construit un extrait de noms pour le prompt Whisper (optionnel, utilisé côté API). */
export function getWhisperPrompt(speciesByGroup?: SpeciesByGroup | null): string {
  const list = buildSearchList(speciesByGroup ?? null)
  const shortNames = [...new Set(list.map((x) => shortNameFromFull(x.fullName)))].slice(0, 200)
  const species = shortNames.join(', ')
  return `Observation naturaliste en français. Espèces possibles: ${species}. Stades: adulte, juvénile, larve, ponte. Sexe: mâle, femelle.`
}
