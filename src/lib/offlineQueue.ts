/**
 * File d'attente hors-ligne : observations et sites sont enregistrés localement
 * (IndexedDB) quand il n'y a pas de réseau, puis envoyés à la base au retour du réseau.
 */

import { createObservation } from './observations'
import { createSite } from './sites'
import { uploadPhoto } from './uploadPhoto'
import { serializePhotoUrls } from './photoUrls'
import { invalidateMapDataCache } from './mapDataCache'
import type { Observation } from './observations'

const DB_NAME = 'cencorse_offline'
const DB_VERSION = 1
const OBS_STORE = 'pending_observations'
const SITES_STORE = 'pending_sites'

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine === true
}

type StoredPhoto = { name: string; type: string; data: ArrayBuffer }

interface PendingObservation {
  id: string
  payload: Omit<Observation, 'id' | 'created_at'>
  photos: StoredPhoto[]
  createdAt: number
}

interface PendingSite {
  id: string
  payload: Parameters<typeof createSite>[0]
  photos: StoredPhoto[]
  createdAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(OBS_STORE)) {
        db.createObjectStore(OBS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SITES_STORE)) {
        db.createObjectStore(SITES_STORE, { keyPath: 'id' })
      }
    }
  })
}

function fileToStoredPhoto(file: File): Promise<StoredPhoto> {
  return file.arrayBuffer().then((data) => ({
    name: file.name,
    type: file.type || 'image/jpeg',
    data
  }))
}

/** Enregistre une observation en file d'attente (hors-ligne). */
export async function addPendingObservation(
  payload: Omit<Observation, 'id' | 'created_at'>,
  photoFiles: File[] = []
): Promise<void> {
  const id = crypto.randomUUID()
  const photos: StoredPhoto[] = await Promise.all(photoFiles.map(fileToStoredPhoto))
  const item: PendingObservation = { id, payload, photos, createdAt: Date.now() }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OBS_STORE, 'readwrite')
    const store = tx.objectStore(OBS_STORE)
    const req = store.add(item)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

/** Enregistre un site en file d'attente (hors-ligne). */
export async function addPendingSite(
  payload: Parameters<typeof createSite>[0],
  photoFiles: File[] = []
): Promise<void> {
  const id = crypto.randomUUID()
  const photos: StoredPhoto[] = await Promise.all(photoFiles.map(fileToStoredPhoto))
  const item: PendingSite = { id, payload, photos, createdAt: Date.now() }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SITES_STORE, 'readwrite')
    const store = tx.objectStore(SITES_STORE)
    const req = store.add(item)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

function getAll<T>(storeName: string): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result ?? [])
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
      })
  )
}

function remove(storeName: string, id: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const req = store.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
      })
  )
}

/** Nombre d'observations en attente. */
export async function getPendingObservationsCount(): Promise<number> {
  const list = await getAll<PendingObservation>(OBS_STORE)
  return list.length
}

/** Nombre de sites en attente. */
export async function getPendingSitesCount(): Promise<number> {
  const list = await getAll<PendingSite>(SITES_STORE)
  return list.length
}

/** Nombre total d'éléments en attente. */
export async function getPendingCount(): Promise<number> {
  const [obs, sites] = await Promise.all([
    getPendingObservationsCount(),
    getPendingSitesCount()
  ])
  return obs + sites
}

function storedPhotoToFile(sp: StoredPhoto): File {
  const blob = new Blob([sp.data], { type: sp.type })
  return new File([blob], sp.name, { type: sp.type })
}

/**
 * Envoie les données en file d'attente vers la base (à appeler quand on est en ligne).
 * Retourne le nombre d'éléments synchronisés avec succès.
 */
export async function runSync(): Promise<{ synced: number; errors: string[] }> {
  if (!isOnline()) return { synced: 0, errors: [] }

  const errors: string[] = []
  let synced = 0

  const observations = await getAll<PendingObservation>(OBS_STORE)
  for (const item of observations) {
    try {
      let photo_url: string | undefined
      if (item.photos.length > 0 && item.payload.user_id) {
        const urls: string[] = []
        for (const sp of item.photos) {
          const file = storedPhotoToFile(sp)
          const url = await uploadPhoto(file, 'observation', item.payload.user_id)
          if (url) urls.push(url)
        }
        photo_url = serializePhotoUrls(urls) ?? undefined
      }
      const result = await createObservation({
        ...item.payload,
        photo_url: photo_url ?? item.payload.photo_url ?? undefined
      })
      if (result.data) {
        await remove(OBS_STORE, item.id)
        synced++
      } else if (result.error) {
        errors.push(`Observation: ${result.error}`)
      }
    } catch (e) {
      errors.push(`Observation: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const sites = await getAll<PendingSite>(SITES_STORE)
  for (const item of sites) {
    try {
      let photo_url: string | null | undefined = item.payload.photo_url
      if (item.photos.length > 0 && item.payload.user_id) {
        const urls: string[] = []
        for (const sp of item.photos) {
          const file = storedPhotoToFile(sp)
          const url = await uploadPhoto(file, 'site', item.payload.user_id)
          if (url) urls.push(url)
        }
        photo_url = serializePhotoUrls(urls)
      }
      const created = await createSite({
        ...item.payload,
        photo_url: photo_url ?? undefined
      })
      if (created) {
        await remove(SITES_STORE, item.id)
        synced++
      } else {
        errors.push('Site: erreur lors de l’enregistrement.')
      }
    } catch (e) {
      errors.push(`Site: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (synced > 0) {
    invalidateMapDataCache()
  }

  return { synced, errors }
}
