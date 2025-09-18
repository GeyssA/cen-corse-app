'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDisplayName } from '@/lib/auth'
import { useTheme } from '@/contexts/ThemeContext'

export default function UserMenu() {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
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

  const handleAboutClick = () => {
    setShowAboutModal(true)
    setIsOpen(false)
  }

  const handleContactClick = () => {
    window.location.href = 'mailto:arnaud.geyssels@gmail.com'
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
      // Aligner la bordure droite du menu avec celle du bouton, avec un décalage vers la gauche
      let left = rect.right - menuWidth - 16 // 16px de décalage vers la gauche
      if (containerRect) {
        const minLeft = containerRect.left + 8 // 8px de marge
        if (left < minLeft) left = minLeft
      }
      setMenuPosition({
        top: rect.bottom + 2, // 2px d'espace sous le bouton
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
        className="modern-card animate-fade-in bg-gray-800/95 backdrop-blur-sm shadow-2xl rounded-2xl min-w-56 w-auto border border-white/20"
      >
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-semibold">
                {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {profile.full_name || user.email}
              </p>
              <p className="text-xs text-gray-300 font-medium">
                {getRoleDisplayName(profile.role)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-2 space-y-2">
          {/* Toggle Jour/Nuit */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM6.166 17.834a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 10-1.06-1.061l-1.591 1.59zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM6.166 6.166a.75.75 0 001.06-1.06L7.757 4.515a.75.75 0 00-1.06 1.06l1.59 1.591z"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-white font-medium">
                {theme === 'dark' ? 'Mode nuit' : 'Mode jour'}
              </span>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => {
                toggleTheme()
                setIsOpen(false)
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700' 
                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
          
          <div className="border-t border-white/10"></div>
          
          <Link
            href="/signalement"
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <span className="font-medium text-white">Problème avec l'app</span>
          </Link>
          
          <button
            onClick={handleAboutClick}
            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-medium text-white">À propos</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="font-medium text-white">Se déconnecter</span>
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
        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-100/80 transition-all duration-200 group mr-2"
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
      
      {/* Modale À propos */}
      {showAboutModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className={`max-w-sm w-full rounded-2xl shadow-2xl transition-all duration-300 ${
            theme === 'light'
              ? 'bg-white border border-gray-200'
              : 'bg-gray-800/95 backdrop-blur-sm border border-white/20'
          }`}>
            <div className="p-6 text-center">
              {/* Logo BukaLab */}
              <div className="mb-6">
                <div className="w-45 h-45 mx-auto rounded-2xl shadow-lg overflow-hidden">
                  <img 
                    src="/BukaLab.PNG" 
                    alt="BukaLab" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Texte */}
              <p className={`text-sm mb-6 leading-relaxed ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Conçue, développée et administrée par <span className="font-semibold text-blue-600">BukaLab</span>.
              </p>
              
              {/* Bouton Contactez-nous */}
              <button
                onClick={handleContactClick}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                }`}
              >
                Contactez-nous
              </button>
              
              {/* Bouton Fermer */}
              <button
                onClick={() => setShowAboutModal(false)}
                className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
