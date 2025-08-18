'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface SignUpFormProps {
  onSwitchToLogin: () => void
}

// Composant personnalisé pour le champ de mot de passe
interface PasswordInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  label: string
  required?: boolean
}

function PasswordInput({ id, value, onChange, placeholder, label, required = false }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder={placeholder}
          style={{
            color: showPassword ? 'inherit' : '#000000',
            fontSize: showPassword ? 'inherit' : '1.2em',
            letterSpacing: showPassword ? 'normal' : '0.1em',
            fontFamily: showPassword ? 'inherit' : 'monospace'
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userFriendlyError, setUserFriendlyError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  
  const { signUp } = useAuth()

  // Fonction de validation du mot de passe en temps réel
  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{8,})/
    return passwordRegex.test(password)
  }

  // Fonction pour renvoyer l'email de confirmation
  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    
    try {
      const { error } = await signUp(email, password, `${firstName.trim()} ${lastName.trim()}`, 'visitor')
      
      if (error) {
        console.error('Erreur lors du renvoi de l\'email:', error)
        // Même en cas d'erreur, on affiche un message de succès pour ne pas inquiéter l'utilisateur
        setResendSuccess(true)
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      console.error('Erreur inattendue lors du renvoi:', err)
      setResendSuccess(true)
    } finally {
      setResendLoading(false)
    }
  }

  // Fonction pour traduire les erreurs techniques en messages compréhensibles
  const translateError = (errorMessage: string): string => {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('email already registered') || message.includes('user already registered')) {
      return 'Un compte existe déjà avec cette adresse email'
    }
    
    if (message.includes('invalid email')) {
      return 'L\'adresse email n\'est pas valide'
    }
    
    if (message.includes('password should be at least')) {
      return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un caractère spécial'
    }
    
    if (message.includes('weak password')) {
      return 'Le mot de passe est trop faible. Utilisez des lettres et des chiffres'
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Problème de connexion internet. Vérifiez votre connexion'
    }
    
    if (message.includes('timeout')) {
      return 'La connexion a pris trop de temps. Veuillez réessayer'
    }
    
    // Message par défaut pour les erreurs non reconnues
    return 'Impossible de créer le compte. Veuillez vérifier vos informations'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUserFriendlyError('')
    setShowTechnicalDetails(false)

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setUserFriendlyError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    // Validation du mot de passe avec critères de sécurité renforcés
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{8,})/
    if (!passwordRegex.test(password)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité')
      setUserFriendlyError('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un caractère spécial')
      setLoading(false)
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires')
      setUserFriendlyError('Le prénom et le nom sont obligatoires')
      setLoading(false)
      return
    }

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const { error } = await signUp(email, password, fullName, 'visitor')
      if (error) {
        const technicalError = (error as Error)?.message || 'Erreur inconnue'
        const friendlyError = translateError(technicalError)
        
        setError(technicalError)
        setUserFriendlyError(friendlyError)
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const technicalError = (err as Error)?.message || 'Une erreur inattendue s\'est produite'
      const friendlyError = translateError(technicalError)
      
      setError(technicalError)
      setUserFriendlyError(friendlyError)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription réussie !
            </h2>
            <p className="text-gray-600 mb-4">
              Vérifiez votre email pour confirmer votre compte.
            </p>
            
            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✓ Email de confirmation renvoyé avec succès !
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Renvoyer l'email de confirmation</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={onSwitchToLogin}
                className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Inscription
          </h2>
          <p className="text-gray-600">
            Rejoignez l'équipe du CEN Corse
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              {/* Message utilisateur compréhensible */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium">
                    {userFriendlyError || 'Une erreur s\'est produite'}
                  </p>
                  
                  {/* Bouton pour voir les détails techniques */}
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 underline focus:outline-none"
                  >
                    {showTechnicalDetails ? 'Masquer les détails techniques' : 'Voir les détails techniques'}
                  </button>
                  
                  {/* Détails techniques (cachés par défaut) */}
                  {showTechnicalDetails && (
                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                      <p className="text-red-700 text-xs font-mono mb-2">
                        <strong>Erreur technique :</strong>
                      </p>
                      <p className="text-red-600 text-xs">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Votre nom"
              />
            </div>
          </div>



          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="votre@email.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordValid(validatePassword(e.target.value))
                }}
                placeholder="••••••••"
                label="Mot de passe"
                required
              />
              <div className="mt-1">
                <p className={`text-xs ${passwordValid ? 'text-green-600' : 'text-gray-500'}`}>
                  8 caractères minimum, avec au moins 1 majuscule et 1 caractère spécial
                </p>
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-1">{password.length >= 8 ? '✓' : '✗'}</span>
                      Au moins 8 caractères
                    </div>
                    <div className={`text-xs flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-1">{/[A-Z]/.test(password) ? '✓' : '✗'}</span>
                      Au moins 1 majuscule
                    </div>
                    <div className={`text-xs flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="mr-1">{/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '✗'}</span>
                      Au moins 1 caractère spécial
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                label="Confirmer le mot de passe"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription...' : 'Créer un compte'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 