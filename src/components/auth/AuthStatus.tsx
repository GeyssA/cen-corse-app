'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthStatus() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded">
        Chargement...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="fixed top-4 left-4 bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded">
        Non connecté
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-4 bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded">
      <div>✅ Connecté: {user.email}</div>
      {profile && (
        <div>👤 Profil: {profile.full_name} ({profile.role})</div>
      )}
      <button 
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
        className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
      >
        Nettoyer session
      </button>
    </div>
  )
} 