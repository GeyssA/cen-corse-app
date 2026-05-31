'use client'

import { useState, useEffect } from 'react'
import { fetchPublishedGaleriePhotos, type GaleriePhoto } from '@/lib/galeriePhotos'

const GALERIE_PHOTOS_CACHE_KEY = 'galerie_photos_cache_v1'
const GALERIE_PHOTOS_CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6h

type GaleriePhotosCachePayload = {
  updatedAt: number
  photos: GaleriePhoto[]
}

function readGaleriePhotosCache(): GaleriePhoto[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GALERIE_PHOTOS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GaleriePhotosCachePayload
    if (!parsed?.updatedAt || !Array.isArray(parsed.photos)) return null
    if (Date.now() - parsed.updatedAt > GALERIE_PHOTOS_CACHE_TTL_MS) return null
    return parsed.photos
  } catch {
    return null
  }
}

function writeGaleriePhotosCache(photos: GaleriePhoto[]) {
  if (typeof window === 'undefined') return
  try {
    const payload: GaleriePhotosCachePayload = { updatedAt: Date.now(), photos }
    localStorage.setItem(GALERIE_PHOTOS_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota / sérialisation
  }
}

export function useGaleriePhotos() {
  const [photos, setPhotos] = useState<GaleriePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = readGaleriePhotosCache()
    if (cached && cached.length > 0) {
      setPhotos(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(null)

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (!cached || cached.length === 0) {
        setLoading(false)
        setError('Mode hors ligne')
      }
      return () => {
        cancelled = true
      }
    }

    fetchPublishedGaleriePhotos().then(({ data, error: err }) => {
      if (cancelled) return
      setLoading(false)
      if (err) setError(err)
      setPhotos(data)
      if (data.length > 0) writeGaleriePhotosCache(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { photos, loading, error }
}
