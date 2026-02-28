'use client'

import { memo } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'blue'
  text?: string
  fullScreen?: boolean
  className?: string
}

const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    white: 'text-white',
    blue: 'text-blue-600'
  }

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Oiseau animé */}
      <div className="relative">
        <div className={`
          ${sizeClasses[size]} 
          flex items-center justify-center
        `}>
          <span className="text-4xl animate-bounce" style={{
            animation: 'flap 0.6s ease-in-out infinite',
            display: 'inline-block'
          }}>
            🐦
          </span>
        </div>
      </div>

      {/* Texte de chargement */}
      {text && (
        <p className={`mt-3 text-sm ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
      
      <style jsx>{`
        @keyframes flap {
          0%, 100% { 
            transform: rotate(-15deg) scale(1);
          }
          50% { 
            transform: rotate(15deg) scale(1.1);
          }
        }
      `}</style>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          {spinnerElement}
        </div>
      </div>
    )
  }

  return spinnerElement
})

// Composant de skeleton pour le chargement de contenu
export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="modern-card animate-pulse">
      <div className="h-48 bg-gray-300 rounded-t-xl" />
      <div className="p-6">
        <div className="h-4 bg-gray-300 rounded mb-3" />
        <div className="h-3 bg-gray-300 rounded mb-2" />
        <div className="h-3 bg-gray-300 rounded w-3/4" />
      </div>
    </div>
  )
})

// Composant de skeleton pour les listes
export const SkeletonList = memo(function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="modern-card animate-pulse">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

// Composant de skeleton pour les tableaux
export const SkeletonTable = memo(function SkeletonTable({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-300 rounded w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-3 bg-gray-300 rounded w-16" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default LoadingSpinner

















