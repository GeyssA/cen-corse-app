import { supabase } from './supabase'

export interface ObservationSite {
  id: string
  date: string
  protocole: string
  nom_du_site: string
  latitude?: number | null
  longitude?: number | null
  user_id: string | null
  photo_url?: string | null
  validated?: boolean
  validated_at?: string | null
  created_at?: string
  /** Pour site linéaire (ex. POP Reptile) : tableau des [lat, lng]. */
  path_coordinates?: [number, number][] | null
  /** Longueur du tracé en mètres (site linéaire). */
  length_meters?: number | null
}

export async function createSite(
  data: {
    date?: string
    protocole: string
    nom_du_site: string
    user_id: string
    latitude?: number | null
    longitude?: number | null
    photo_url?: string | null
    /** Pour site linéaire : chemin [[lat, lng], ...]. */
    path_coordinates?: [number, number][] | null
    /** Longueur du tracé en mètres (site linéaire). */
    length_meters?: number | null
  }
): Promise<ObservationSite | null> {
  try {
    const row = {
      date: data.date ?? new Date().toISOString().slice(0, 10),
      protocole: data.protocole,
      nom_du_site: data.nom_du_site.trim(),
      user_id: data.user_id,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      photo_url: data.photo_url ?? null,
      path_coordinates: data.path_coordinates ?? null,
      length_meters: data.length_meters ?? null
    }
    const { data: site, error } = await supabase
      .from('observation_sites')
      .insert([row])
      .select()
      .single()

    if (error) {
      console.error('Erreur création site:', error)
      return null
    }
    return site
  } catch (e) {
    console.error('Erreur inattendue création site:', e)
    return null
  }
}

export async function getSitesByUser(userId: string): Promise<ObservationSite[]> {
  try {
    const { data, error } = await supabase
      .from('observation_sites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération sites:', error)
      return []
    }
    return data ?? []
  } catch (e) {
    console.error('Erreur inattendue récupération sites:', e)
    return []
  }
}

export async function getSitesByUserAndProtocole(
  userId: string,
  protocole: string
): Promise<ObservationSite[]> {
  try {
    const { data, error } = await supabase
      .from('observation_sites')
      .select('*')
      .eq('user_id', userId)
      .eq('protocole', protocole)
      .order('nom_du_site', { ascending: true })

    if (error) {
      console.error('Erreur récupération sites par protocole:', error)
      return []
    }
    return data ?? []
  } catch (e) {
    console.error('Erreur inattendue récupération sites par protocole:', e)
    return []
  }
}

export async function setSiteValidated(id: string, validated: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('observation_sites')
      .update({
        validated: validated,
        validated_at: validated ? new Date().toISOString() : null
      })
      .eq('id', id)
    if (error) {
      console.error('Erreur mise à jour validation site:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Erreur inattendue validation site:', e)
    return false
  }
}
