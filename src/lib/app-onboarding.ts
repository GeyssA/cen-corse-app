/**
 * Clé d’onboarding / welcome pour l’app (install + mise à jour quand on augmente CEN_WELCOME_FLOW).
 * L’ancienne seule clé hasSeenOnboarding_ pouvait exister ailleurs (PWA) ou être incohérente.
 */
export const CEN_WELCOME_FLOW = 'v2' as const

export function getWelcomeFlowDoneKey(userId: string): string {
  return `cen_welcome_ok_${CEN_WELCOME_FLOW}_${userId}`
}
