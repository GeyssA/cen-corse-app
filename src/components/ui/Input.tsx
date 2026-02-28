'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outlined'
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const { trackRender } = usePerformance()
  trackRender('Input')

  const baseClasses = `
    w-full px-3 py-2 border rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400
  `

  const variantClasses = {
    default: `
      bg-white border-gray-300 text-gray-900
      hover:border-gray-400 focus:border-blue-500
    `,
    filled: `
      bg-gray-50 border-gray-200 text-gray-900
      hover:bg-gray-100 focus:bg-white focus:border-blue-500
    `,
    outlined: `
      bg-transparent border-2 border-gray-300 text-gray-900
      hover:border-gray-400 focus:border-blue-500
    `
  }

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : ''
  const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : ''

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Conteneur d'input */}
      <div className="relative">
        {/* Icône gauche */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 w-5 h-5">
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${errorClasses}
            ${iconPadding}
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Icône droite */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-400 w-5 h-5">
              {rightIcon}
            </span>
          </div>
        )}

        {/* Indicateur de focus */}
        {isFocused && !error && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-blue-500 ring-opacity-50 pointer-events-none" />
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Texte d'aide */}
      {helperText && !error && (
        <div className="mt-1 text-sm text-gray-500">
          {helperText}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

















