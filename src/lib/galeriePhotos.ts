import { supabase } from './supabase'
import { appStaticMediaUrl } from './app-static-media'

export type GaleriePhoto = {
  id: string
  imageUrl: string
  title: string
  location: string
  date: string
  author: string
  /** Légende style page Présentation (lignes séparées par \n) */
  captionMultiline: string
}

type GalerieRow = {
  id: string
  image_path: string
  title: string
  location: string | null
  date_label: string | null
  author: string | null
}

function resolveGalerieImageUrl(path: string): string {
  const t = path.trim()
  if (t === '') return ''
  if (/^https?:\/\//i.test(t)) return t
  return appStaticMediaUrl(t)
}

function mapRow(r: GalerieRow): GaleriePhoto | null {
  const imageUrl = resolveGalerieImageUrl(r.image_path)
  if (!imageUrl) return null
  const loc = (r.location ?? '').trim() || '—'
  const dat = (r.date_label ?? '').trim() || '—'
  const aut = (r.author ?? '').trim() || '—'
  return {
    id: r.id,
    imageUrl,
    title: r.title,
    location: loc,
    date: dat,
    author: aut,
    captionMultiline: [r.title, loc, dat, aut].join('\n')
  }
}

/**
 * Photos galerie publiées (table `galerie_photos` + fichiers dans le bucket `app-static`).
 */
export async function fetchPublishedGaleriePhotos(): Promise<{
  data: GaleriePhoto[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('galerie_photos')
    .select('id, image_path, title, location, date_label, author, sort_order, created_at, published')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  const photos = (data as GalerieRow[] | null)
    ?.map(mapRow)
    .filter((p): p is GaleriePhoto => p != null) ?? []

  return { data: photos, error: null }
}

/** Indice « photo du jour » : déterministe par jour (même partout dans l’app). */
export function getPhotoOfDayIndex(dayOfYear: number, count: number): number {
  if (count <= 0) return 0
  return dayOfYear % count
}
