/**
 * Médias « statiques » de l’app (hors photos terrain utilisateur, déjà dans le bucket `photos`).
 *
 * Plan de migration Supabase Storage (résumé) :
 * 1. Créer un bucket public dédié, ex. `app-static` (ou `ressources`), avec lecture anonyme.
 * 2. Reproduire la hiérarchie actuelle de `public/` : `photos_page_accueil/`, `Nos fascicules/`,
 *    `Logos_soutien/`, logos racine, etc.
 * 3. Uploader les fichiers (CLI Supabase, dashboard, ou script avec service role en local uniquement).
 * 4. Définir `NEXT_PUBLIC_APP_STATIC_MEDIA_BASE_URL` = URL publique du bucket + préfixe, par ex. :
 *    `https://<ref>.supabase.co/storage/v1/object/public/app-static`
 * 5. Remplacer dans le code les chaînes `/photos_page_accueil/...` par `appStaticMediaUrl('photos_page_accueil/...')`
 *    (sans slash initial dans l’argument, ou avec — la fonction normalise).
 * 6. Retirer les gros binaires du dépôt / du build une fois la prod validée.
 *
 * Supports numériques : table `ressources_numeriques` (gallery_paths : chaînes et/ou paires
 * `{"recto":"...","verso":"..."}`) + `fetchPublishedNumericalSupports()`.
 * Galerie : table `galerie_photos` + `fetchPublishedGaleriePhotos()`.
 */

const base = (process.env.NEXT_PUBLIC_APP_STATIC_MEDIA_BASE_URL || '').replace(/\/$/, '')

/**
 * Résout l’URL d’un fichier média statique.
 * Sans variable d’environnement : garde le comportement actuel (chemins sous `public/`).
 */
export function appStaticMediaUrl(path: string): string {
  const trimmed = path.replace(/^\/+/, '')
  if (!base) return `/${trimmed}`
  const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/')
  return `${base}/${encoded}`
}
