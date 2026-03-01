'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NewActivity {
  name: string
  description: string
  location: string
  activity_date: string
  activity_time: string
  type: string
  region: string
  creator_name: string
}

interface AddActivityModalProps {
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  onAddActivity: (activity: NewActivity) => Promise<void>
}

export default function AddActivityModal({ showAddModal, setShowAddModal, onAddActivity }: AddActivityModalProps) {
  const { profile } = useAuth()
  
  const [newActivity, setNewActivity] = useState<NewActivity>({
    name: '',
    description: '',
    location: '',
    activity_date: '',
    activity_time: '',
    type: '',
    region: '',
    creator_name: ''
  })

  const activityTypes = ['Formation', 'Conférence', 'Bénévolat', 'Sortie', 'Autre']
  const regions = [
    'Ouest', 
    'Sud', 
    'Corse_Orientale', 
    'Sartenais', 
    'Balagne', 
    'Pays_Ajaccien', 
    'Castagniccia', 
    'Centre_Corse', 
    'Pays_Bastiais'
  ]

  const handleSubmit = async () => {
    if (!newActivity.name.trim() || !newActivity.description.trim() || !newActivity.activity_date || !newActivity.type || !newActivity.region || !newActivity.creator_name.trim()) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!profile) {
      alert('Erreur : Aucun profil utilisateur trouvé. Veuillez vous reconnecter.')
      return
    }

    try {
      console.log('🚀 Tentative de création d\'activité...')
      
      // Préparer les données de l'activité
      const activityData = {
        name: newActivity.name.trim(),
        description: newActivity.description.trim(),
        location: newActivity.location.trim(),
        activity_date: newActivity.activity_date,
        activity_time: newActivity.activity_time,
        type: newActivity.type,
        region: newActivity.region,
        creator_name: newActivity.creator_name.trim(),
        created_at: new Date().toISOString()
      }

      console.log('📊 Données de l\'activité:', activityData)

      // Créer l'activité directement dans Supabase (fonctionne en local et Capacitor)
      const { createActivity } = await import('@/lib/activities')
      const createdActivity = await createActivity(activityData)

      if (createdActivity) {
        console.log('✅ Activité créée avec succès:', createdActivity)
        
        // Appeler la fonction de callback pour mettre à jour l'interface
        await onAddActivity(newActivity)
        
        // Fermer le modal et réinitialiser le formulaire
        setShowAddModal(false)
        setNewActivity({
          name: '',
          description: '',
          location: '',
          activity_date: '',
          activity_time: '',
          type: '',
          region: '',
          creator_name: ''
        })
      } else {
        console.error('❌ Échec de la création de l\'activité')
        alert('Erreur lors de la création de l\'activité. Veuillez réessayer.')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'activité:', error)
      alert('Erreur lors de la création de l\'activité. Veuillez réessayer.')
    }
  }

  if (!showAddModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200/30 animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Nouvelle activité</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Nom de l'activité */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom de l'activité <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newActivity.name}
                onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="Nom de l'activité"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                rows={3}
                placeholder="Description de l'activité"
              />
            </div>

            {/* Type d'activité */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type d'activité <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="">Sélectionner un type...</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type} className="bg-white text-slate-700 py-2">{type}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Région */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Région <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={newActivity.region}
                  onChange={(e) => setNewActivity({...newActivity, region: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="">Sélectionner une région...</option>
                  {regions.map(region => (
                    <option key={region} value={region} className="bg-white text-slate-700 py-2">{region}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
              <input
                type="text"
                value={newActivity.location}
                onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="Lieu de l'activité"
              />
            </div>

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newActivity.activity_date}
                  onChange={(e) => setNewActivity({...newActivity, activity_date: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                <input
                  type="time"
                  value={newActivity.activity_time}
                  onChange={(e) => setNewActivity({...newActivity, activity_time: e.target.value})}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Personne responsable */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Personne responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newActivity.creator_name}
                onChange={(e) => setNewActivity({...newActivity, creator_name: e.target.value})}
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                placeholder="Nom de la personne responsable"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Créer l'activité
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
