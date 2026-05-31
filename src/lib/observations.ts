import { supabase } from './supabase'
import { serializePhotoUrls } from './photoUrls'

export interface Observation {
  id?: string
  date: string
  protocole: string
  passage: string
  site: string
  presence?: boolean
  groupe: string
  nom_espece: string
  effectif: string
  stade: string
  sexe: string
  remarques: string
  latitude: number | null
  longitude: number | null
  observateur?: string
  user_id?: string
  photo_url?: string | null
  validated?: boolean
  validated_at?: string | null
  created_at?: string
}

/** Résultat de la création d'une observation (donnée ou message d'erreur). */
export type CreateObservationResult =
  | { data: Observation; error: null }
  | { data: null; error: string }

/** Créer une observation naturaliste. Table Supabase attendue : observations (date, protocole, passage, site, groupe, nom_espece, effectif, remarques, latitude, longitude, user_id, photo_url). */
export async function createObservation(
  data: Omit<Observation, 'id' | 'created_at'>
): Promise<CreateObservationResult> {
  try {
    const { data: obs, error } = await supabase
      .from('observations')
      .insert([data])
      .select()
      .single()

    if (error) {
      const msg = error.message || error.details || error.hint || JSON.stringify(error) || 'Erreur inconnue'
      console.error('Erreur création observation:', { message: error.message, details: error.details, hint: error.hint, code: error.code, full: error })
      return { data: null, error: msg }
    }
    return { data: obs, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Erreur inattendue création observation:', e)
    return { data: null, error: msg }
  }
}

export async function getObservationsByUser(userId: string): Promise<Observation[]> {
  try {
    const { data, error } = await supabase
      .from('observations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération observations:', error)
      return []
    }
    return data ?? []
  } catch (e) {
    console.error('Erreur inattendue récupération observations:', e)
    return []
  }
}

export async function setObservationValidated(id: string, validated: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('observations')
      .update({
        validated: validated,
        validated_at: validated ? new Date().toISOString() : null
      })
      .eq('id', id)
    if (error) {
      console.error('Erreur mise à jour validation observation:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Erreur inattendue validation observation:', e)
    return false
  }
}

/** Met à jour les URLs de photos d'une observation (ex. après suppression dans le bucket). Passez la liste des URLs encore valides, ou [] pour tout retirer. */
export async function updateObservationPhotoUrls(
  observationId: string,
  urls: string[]
): Promise<{ error: Error | null }> {
  try {
    const photo_url = serializePhotoUrls(urls)
    const { error } = await supabase
      .from('observations')
      .update({ photo_url })
      .eq('id', observationId)
    return { error: error ? new Error(error.message) : null }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('Erreur mise à jour photo_url observation:', e)
    return { error: err }
  }
}

type ObservationUpdatePayload = Partial<
  Omit<Observation, 'id' | 'created_at' | 'validated' | 'validated_at'>
>

/** Met à jour une observation existante (champs métier + position + photos). */
export async function updateObservation(
  id: string,
  data: ObservationUpdatePayload
): Promise<{ error: string | null }> {
  try {
    const row = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>
    const { error } = await supabase.from('observations').update(row).eq('id', id)
    if (error) {
      const msg = error.message || error.details || error.hint || JSON.stringify(error) || 'Erreur inconnue'
      console.error('Erreur mise à jour observation:', error)
      return { error: msg }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Erreur inattendue mise à jour observation:', e)
    return { error: msg }
  }
}

export async function deleteObservation(id: string): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Utilisateur non authentifié.' }
    }

    const { data, error } = await supabase
      .from('observations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
    if (error) {
      const msg = error.message || error.details || error.hint || JSON.stringify(error) || 'Erreur inconnue'
      console.error('Erreur suppression observation:', error)
      return { error: msg }
    }
    if (!data || data.length === 0) {
      return { error: "Aucune observation supprimée (droits insuffisants ou donnée introuvable)." }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Erreur inattendue suppression observation:', e)
    return { error: msg }
  }
}
