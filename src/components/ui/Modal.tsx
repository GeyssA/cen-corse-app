'use client'

import { useEffect, useRef, ReactNode, useCallback } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  className = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { trackRender, throttle } = usePerformance()

  trackRender('Modal')

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  // Gestion des événements clavier
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closable, onClose])

  // Gestion du clic en dehors de la modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closable) {
      onClose()
    }
  }

  // Gestion du scroll avec throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop avec animation */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
      />

      {/* Conteneur de la modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full ${sizeClasses[size]} 
            bg-white rounded-lg shadow-2xl
            transform transition-all duration-300 ease-out
            animate-slide-up
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || closable) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              
              {closable && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Contenu */}
          <div 
            className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin"
            onScroll={handleScroll}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
