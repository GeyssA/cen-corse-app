/**
 * Mise en évidence unifiée des choix (listes, grilles, puces) — thème clair / sombre.
 * À utiliser partout pour une cohérence visuelle.
 */

export function choiceListRowSelected(isLight: boolean) {
  return isLight ? 'bg-teal-100 text-gray-900' : 'bg-teal-900/50 text-gray-100'
}

export function choiceListRowIdle(isLight: boolean) {
  return isLight ? 'hover:bg-gray-50 text-gray-800' : 'hover:bg-gray-700/80 text-gray-200'
}

export function choiceCheckIcon(isLight: boolean) {
  return isLight ? 'text-teal-700' : 'text-teal-300'
}

export function choiceGridSelected(isLight: boolean) {
  return isLight
    ? 'border-2 border-teal-500 bg-teal-100 text-gray-900 shadow-sm shadow-teal-500/15'
    : 'border-2 border-teal-400/80 bg-teal-950/90 text-gray-100 shadow-sm shadow-black/20'
}

export function choiceGridUnselected(isLight: boolean) {
  return isLight
    ? 'border-2 border-gray-200 bg-white text-gray-800 shadow-sm hover:border-gray-300 hover:bg-gray-50'
    : 'border-2 border-gray-600/80 bg-gray-800/30 text-gray-200 shadow-sm hover:border-gray-500 hover:bg-gray-800/50'
}

/** Puces / numéros (passage, effectif) : même logique bordure + fond léger, pas de plein teinte. */
export function choiceChipSelected(isLight: boolean) {
  return choiceGridSelected(isLight)
}

export function choiceChipUnselected(isLight: boolean) {
  return isLight
    ? 'border-2 border-gray-200 bg-gray-100 text-gray-800 shadow-sm hover:bg-gray-200/90'
    : 'border-2 border-gray-600/80 bg-gray-700/80 text-gray-200 shadow-sm hover:bg-gray-600/80'
}
