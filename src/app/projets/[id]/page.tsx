import { redirect } from 'next/navigation'

/**
 * Obligatoire pour `output: export` sur une route dynamique.
 * On génère une entrée technique, mais la page redirige toujours vers `/projets`.
 */
export async function generateStaticParams() {
  return [{ id: 'legacy' }]
}

/** Les anciennes URLs fiche-projet ne sont plus maintenues dans l’app. */
export default function ProjetsDetailRedirect() {
  redirect('/projets')
}
