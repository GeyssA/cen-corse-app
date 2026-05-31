import { supabase } from './supabase'

const STORAGE_BUCKET = 'app-static'

/**
 * URL affichable pour un fichier du bucket ou une URL absolue déjà complète.
 * Si `NEXT_PUBLIC_APP_STATIC_MEDIA_BASE_URL` est défini, il est utilisé ; sinon on
 * construit l’URL publique via l’API Storage (évite les `/chemin` vers `public/` qui 404).
 */
function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  if (pathOrUrl == null || pathOrUrl === '') return ''
  const t = pathOrUrl.trim()
  if (/^https?:\/\//i.test(t)) return t

  const relative = t.replace(/^\/+/, '')
  const base = (process.env.NEXT_PUBLIC_APP_STATIC_MEDIA_BASE_URL || '').replace(/\/$/, '')
  if (base) {
    const encoded = relative.split('/').map((seg) => encodeURIComponent(seg)).join('/')
    return `${base}/${encoded}`
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(relative)
  return data.publicUrl
}

/** Une vignette / page dans le lecteur : une image seule, ou recto + verso liés. */
export type ImageSlot =
  | { type: 'single'; url: string }
  | { type: 'pair'; recto: string; verso: string }

export interface NumericalSupport {
  id: string
  title: string
  description: string
  /** URL de couverture (carte liste) */
  coverImage: string
  /** Pages / planches utilisées par la modale (ordre = ordre du carousel) */
  slots: ImageSlot[]
  /**
   * Toutes les URLs à plat (recto puis verso pour chaque paire) — ZIP, fallback, etc.
   */
  images: string[]
  pdfUrl?: string
  category: string
}

type RessourceRow = {
  id: string
  title: string
  description: string | null
  category: string
  cover_image_path: string | null
  gallery_paths: unknown
  pdf_path: string | null
  sort_order: number | null
  published: boolean | null
}

/** Parse le jsonb gallery_paths : chaînes et/ou { recto, verso }. */
function parseGallerySlots(raw: unknown): ImageSlot[] {
  if (raw == null) return []
  let arr: unknown[] = []
  if (Array.isArray(raw)) {
    arr = raw
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return parseGallerySlots(parsed)
    } catch {
      return []
    }
  } else {
    return []
  }

  const slots: ImageSlot[] = []
  for (const item of arr) {
    if (typeof item === 'string') {
      const url = resolveMediaUrl(item)
      if (url) slots.push({ type: 'single', url })
      continue
    }
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const rectoRaw = o.recto
      const versoRaw = o.verso
      if (typeof rectoRaw === 'string' && typeof versoRaw === 'string') {
        const recto = resolveMediaUrl(rectoRaw)
        const verso = resolveMediaUrl(versoRaw)
        if (recto && verso) {
          slots.push({ type: 'pair', recto, verso })
        }
        continue
      }
    }
  }
  return slots
}

export function flattenSlotUrls(slots: ImageSlot[]): string[] {
  const out: string[] = []
  for (const s of slots) {
    if (s.type === 'single') out.push(s.url)
    else {
      out.push(s.recto, s.verso)
    }
  }
  return out
}

function firstDisplayUrl(slots: ImageSlot[]): string {
  if (slots.length === 0) return ''
  const s = slots[0]
  return s.type === 'single' ? s.url : s.recto
}

function rowToSupport(row: RessourceRow): NumericalSupport {
  const slots = parseGallerySlots(row.gallery_paths)
  const images = flattenSlotUrls(slots)
  const coverFromDb = resolveMediaUrl(row.cover_image_path)
  const coverImage = coverFromDb || firstDisplayUrl(slots)

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category,
    coverImage,
    slots,
    images,
    pdfUrl: row.pdf_path ? resolveMediaUrl(row.pdf_path) : undefined
  }
}

/**
 * Supports publiés pour l’onglet Ressources (tri : sort_order asc, puis création).
 */
export async function fetchPublishedNumericalSupports(): Promise<{
  data: NumericalSupport[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('ressources_numeriques')
      .select('id, title, description, category, cover_image_path, gallery_paths, pdf_path, sort_order, published, created_at')
      .eq('published', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('ressources_numeriques:', error)
      return { data: [], error: error.message || 'Impossible de charger les supports.' }
    }
    const rows = (data ?? []) as RessourceRow[]
    return { data: rows.map(rowToSupport), error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('fetchPublishedNumericalSupports:', e)
    return { data: [], error: msg }
  }
}
