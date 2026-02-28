'use client'

import { memo, useState, useCallback } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

interface OptimizedCardProps {
  title: string
  description?: string
  image?: string
  onClick?: () => void
  className?: string
  children?: React.ReactNode
  priority?: boolean
}

const OptimizedCard = memo(function OptimizedCard({
  title,
  description,
  image,
  onClick,
  className = '',
  children,
  priority = false
}: OptimizedCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { trackRender, debounce } = usePerformance()

  // Tracking des performances en développement
  trackRender('OptimizedCard')

  // Handlers optimisés
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
  }, [onClick])

  const handleMouseEnter = useCallback(
    debounce(() => {
      setIsHovered(true)
    }, 50),
    [debounce]
  )

  const handleMouseLeave = useCallback(
    debounce(() => {
      setIsHovered(false)
    }, 100),
    [debounce]
  )

  return (
    <div
      className={`
        modern-card modern-card-hover cursor-pointer transition-all duration-300
        ${isHovered ? 'scale-105 shadow-2xl' : 'scale-100'}
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Image avec lazy loading */}
      {image && (
        <div className="relative h-48 overflow-hidden rounded-t-xl">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Contenu */}
      <div className="p-6">
        <h3 className="font-heading text-xl font-semibold mb-2 text-white">
          {title}
        </h3>
        
        {description && (
          <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Contenu personnalisé */}
        {children && (
          <div className="text-gray-300">
            {children}
          </div>
        )}

        {/* Indicateur d'action */}
        {onClick && (
          <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
            <span>Voir plus</span>
            <svg 
              className="w-4 h-4 ml-2 transition-transform duration-200"
              style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
})

export default OptimizedCard













