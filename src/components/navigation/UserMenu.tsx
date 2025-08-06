'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDisplayName } from '@/lib/auth'

export default function UserMenu() {
  const { user, profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        document.getElementById('usermenu-portal') &&
        !(document.getElementById('usermenu-portal') as HTMLElement).contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
      // Rediriger vers la page d'authentification
      window.location.href = '/auth'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // En cas d'erreur, forcer la redirection
      window.location.href = '/auth'
    }
  }

  const handleOpenMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Chercher le parent max-w-md le plus proche
      let parent = buttonRef.current.parentElement as HTMLElement | null
      let containerRect = null
      while (parent) {
        if (parent.classList.contains('max-w-md')) {
          containerRect = parent.getBoundingClientRect()
          break
        }
        parent = parent.parentElement
      }
      // Largeur du menu (min 224px = min-w-56)
      const menuWidth = 224
      // Aligner la bordure droite du menu avec celle du bouton
      let left = rect.right - menuWidth
      if (containerRect) {
        const minLeft = containerRect.left + 8 // 8px de marge
        if (left < minLeft) left = minLeft
      }
      setMenuPosition({
        top: rect.bottom + 8, // 8px d'espace sous le bouton
        left,
        width: rect.width
      })
    }
    setIsOpen((prev) => !prev)
  }

  if (!user || !profile) return null

  // Menu déroulant via portail
  const menuDropdown = isOpen && typeof window !== 'undefined'
    ? createPortal(
      <div
        id="usermenu-portal"
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          zIndex: 10000,
        }}
        className="modern-card animate-fade-in bg-white shadow-2xl rounded-2xl min-w-56 w-auto"
      >
        <div className="p-4 border-b border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-semibold">
                {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {profile.full_name || user.email}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {getRoleDisplayName(profile.role)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-2">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100/80 rounded-lg transition-all duration-200 flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>,
      document.body
    ) : null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpenMenu}
        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-100/80 transition-all duration-200 group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
          <span className="text-white text-sm font-semibold">
            {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {menuDropdown}
    </div>
  )
}
