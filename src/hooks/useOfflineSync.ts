import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface OfflineData {
  id: string
  type: 'project' | 'activity' | 'vote'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Détecter l'état de la connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Connexion rétablie')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📡 Hors ligne')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // État initial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Charger les données en attente depuis le localStorage
  useEffect(() => {
    const loadPendingData = () => {
      try {
        const stored = localStorage.getItem('offlineSync')
        if (stored) {
          const data: OfflineData[] = JSON.parse(stored)
          setPendingSync(data)
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données hors ligne:', error)
      }
    }

    loadPendingData()
  }, [])

  // Synchroniser quand la connexion est rétablie
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncOfflineData()
    }
  }, [isOnline, pendingSync.length])

  // Ajouter une action à synchroniser
  const addOfflineAction = (type: OfflineData['type'], action: OfflineData['action'], data: any) => {
    const offlineData: OfflineData = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      action,
      data,
      timestamp: Date.now()
    }

    const newPendingSync = [...pendingSync, offlineData]
    setPendingSync(newPendingSync)

    // Sauvegarder dans localStorage
    try {
      localStorage.setItem('offlineSync', JSON.stringify(newPendingSync))
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde hors ligne:', error)
    }

    console.log('💾 Action sauvegardée hors ligne:', offlineData)
  }

  // Synchroniser les données hors ligne
  const syncOfflineData = async () => {
    if (pendingSync.length === 0 || isSyncing) return

    setIsSyncing(true)
    console.log('🔄 Synchronisation des données hors ligne...')

    const successfulSyncs: string[] = []
    const failedSyncs: string[] = []

    for (const item of pendingSync) {
      try {
        await processOfflineAction(item)
        successfulSyncs.push(item.id)
      } catch (error) {
        console.error(`❌ Erreur lors de la synchronisation de ${item.id}:`, error)
        failedSyncs.push(item.id)
      }
    }

    // Supprimer les synchronisations réussies
    const remainingSyncs = pendingSync.filter(item => !successfulSyncs.includes(item.id))
    setPendingSync(remainingSyncs)

    // Mettre à jour le localStorage
    try {
      localStorage.setItem('offlineSync', JSON.stringify(remainingSyncs))
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du localStorage:', error)
    }

    setIsSyncing(false)

    if (successfulSyncs.length > 0) {
      console.log(`✅ ${successfulSyncs.length} actions synchronisées avec succès`)
    }

    if (failedSyncs.length > 0) {
      console.log(`❌ ${failedSyncs.length} actions ont échoué`)
    }
  }

  // Traiter une action hors ligne
  const processOfflineAction = async (item: OfflineData) => {
    switch (item.type) {
      case 'project':
        await processProjectAction(item)
        break
      case 'activity':
        await processActivityAction(item)
        break
      case 'vote':
        await processVoteAction(item)
        break
      default:
        throw new Error(`Type d'action non supporté: ${item.type}`)
    }
  }

  // Traiter les actions de projet
  const processProjectAction = async (item: OfflineData) => {
    const { action, data } = item

    switch (action) {
      case 'create':
        await supabase.from('projects').insert(data)
        break
      case 'update':
        await supabase.from('projects').update(data).eq('id', data.id)
        break
      case 'delete':
        await supabase.from('projects').delete().eq('id', data.id)
        break
    }
  }

  // Traiter les actions d'activité
  const processActivityAction = async (item: OfflineData) => {
    const { action, data } = item

    switch (action) {
      case 'create':
        await supabase.from('activities').insert(data)
        break
      case 'update':
        await supabase.from('activities').update(data).eq('id', data.id)
        break
      case 'delete':
        await supabase.from('activities').delete().eq('id', data.id)
        break
    }
  }

  // Traiter les actions de vote
  const processVoteAction = async (item: OfflineData) => {
    const { action, data } = item

    switch (action) {
      case 'create':
        await supabase.from('votes').insert(data)
        break
      case 'delete':
        await supabase.from('votes').delete().eq('id', data.id)
        break
    }
  }

  // Forcer la synchronisation manuellement
  const forceSync = () => {
    if (isOnline) {
      syncOfflineData()
    }
  }

  // Effacer toutes les données en attente
  const clearOfflineData = () => {
    setPendingSync([])
    localStorage.removeItem('offlineSync')
    console.log('🗑️ Données hors ligne effacées')
  }

  return {
    isOnline,
    pendingSync,
    isSyncing,
    addOfflineAction,
    syncOfflineData,
    forceSync,
    clearOfflineData
  }
} 