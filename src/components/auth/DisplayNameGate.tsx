'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DisplayNameModal from './DisplayNameModal'

/** Affiche la modale "Prénom Nom" quand l'utilisateur est connecté mais n'a pas de nom (ex. première connexion Google). */
export default function DisplayNameGate() {
  const { user, profile, loading, updateUserProfile } = useAuth()

  const needsDisplayName = Boolean(
    !loading &&
    user &&
    profile &&
    (!profile.full_name || profile.full_name.trim() === '' || profile.full_name === 'Utilisateur')
  )

  const handleSubmit = async (fullName: string) => {
    if (!user) return
    const trimmed = fullName.trim()
    const updated = await updateProfile(user.id, {
      full_name: trimmed,
      updated_at: new Date().toISOString()
    })
    if (!updated) throw new Error('Impossible d\'enregistrer le nom.')
    await supabase.auth.updateUser({ data: { full_name: trimmed } })
    await updateUserProfile()
  }

  return (
    <DisplayNameModal
      isOpen={needsDisplayName}
      onSubmit={handleSubmit}
      isLoading={loading}
    />
  )
}
