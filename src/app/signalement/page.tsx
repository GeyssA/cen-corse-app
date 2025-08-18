'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EMAILJS_CONFIG } from '@/lib/emailjs'
import { useTheme } from '@/contexts/ThemeContext'

export default function SignalementPage() {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    probleme: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Charger EmailJS
  useEffect(() => {
    const loadEmailJS = async () => {
      try {
        const emailjs = await import('@emailjs/browser')
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY)
      } catch (error) {
        console.error('Erreur lors du chargement d\'EmailJS:', error)
      }
    }
    loadEmailJS()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Vérifier la configuration
      console.log('Configuration EmailJS:', {
        SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID,
        TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID,
        PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY
      })

      // Vérifier si les clés sont configurées
      if (EMAILJS_CONFIG.SERVICE_ID === 'service_votre_service_id' || 
          EMAILJS_CONFIG.TEMPLATE_ID === 'template_votre_template_id' || 
          EMAILJS_CONFIG.PUBLIC_KEY === 'votre_public_key') {
        throw new Error('Les clés EmailJS ne sont pas configurées. Vérifiez votre fichier .env.local')
      }

      const emailjs = await import('@emailjs/browser')
      
      const templateParams = {
        to_email: 'arnaud.geyssels@gmail.com',
        from_name: formData.nom,
        from_email: formData.email,
        problem_type: formData.probleme,
        problem_description: formData.description,
        reply_to: formData.email,
        time: new Date().toLocaleString('fr-FR')
      }

      console.log('Envoi avec les paramètres:', templateParams)

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      )

      setIsSubmitted(true)
    } catch (error) {
      console.error('Erreur détaillée lors de l\'envoi:', error)
      setError(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200'
      }`}>
        <div className="max-w-md mx-auto px-6 py-8">
          <div className={`backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl ${
            theme === 'light'
              ? 'bg-white/80 border border-gray-200/50'
              : 'bg-white/5 border border-white/10'
          }`}>
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                theme === 'light' ? 'bg-green-100' : 'bg-green-500/20'
              }`}>
                <svg className={`w-8 h-8 ${
                  theme === 'light' ? 'text-green-600' : 'text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className={`text-2xl font-bold mb-4 ${
                theme === 'light' ? 'text-gray-800' : 'text-white'
              }`}>Signalement envoyé !</h1>
              <p className={`mb-6 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Votre signalement a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.
              </p>
              <Link
                href="/"
                className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-md ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-500'
                    : 'bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/50 hover:via-indigo-600/50 hover:to-purple-600/50 text-white border border-white/20 hover:border-white/40'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Retour à l'accueil</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b ${
        theme === 'light'
          ? 'bg-white/80 border-gray-200/50'
          : 'bg-black/20 border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className={`transition-colors duration-300 px-3 py-1.5 rounded-lg ${
              theme === 'light'
                ? 'text-gray-700 hover:text-blue-600 border border-gray-300 hover:border-blue-400'
                : 'text-white hover:text-blue-400 border border-white/20 hover:border-white/40'
            }`}>
              <span className="text-sm font-medium">Retour</span>
            </Link>
            <h1 className={`text-xl font-bold ml-4 ${
              theme === 'light' ? 'text-gray-800' : 'text-white'
            }`}>Signalement de problème</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl ${
          theme === 'light'
            ? 'bg-white/80 border border-gray-200/50'
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className="p-8">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                theme === 'light' ? 'bg-orange-100' : 'bg-orange-500/20'
              }`}>
                <svg className={`w-8 h-8 ${
                  theme === 'light' ? 'text-orange-600' : 'text-orange-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${
                theme === 'light' ? 'text-gray-800' : 'text-white'
              }`}>Signaler un problème</h2>
              <p className={`${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Aidez-nous à améliorer l'application en nous signalant les problèmes que vous rencontrez.
              </p>
            </div>

            {error && (
              <div className={`mb-6 p-4 rounded-xl ${
                theme === 'light'
                  ? 'bg-red-100 border border-red-300'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <p className={`text-sm ${
                  theme === 'light' ? 'text-red-700' : 'text-red-400'
                }`}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nom" className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-white'
                  }`}>
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    required
                    value={formData.nom}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm ${
                      theme === 'light'
                        ? 'bg-white border border-gray-300 text-gray-800 placeholder-gray-500'
                        : 'bg-white/10 border border-white/20 text-white placeholder-gray-400'
                    }`}
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-white'
                  }`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm ${
                      theme === 'light'
                        ? 'bg-white border border-gray-300 text-gray-800 placeholder-gray-500'
                        : 'bg-white/10 border border-white/20 text-white placeholder-gray-400'
                    }`}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="probleme" className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-white'
                }`}>
                  Type de problème *
                </label>
                <select
                  id="probleme"
                  name="probleme"
                  required
                  value={formData.probleme}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm ${
                    theme === 'light'
                      ? 'bg-white border border-gray-300 text-gray-800'
                      : 'bg-white/10 border border-white/20 text-white'
                  }`}
                >
                  <option value="">Sélectionnez un type de problème</option>
                  <option value="Bug technique">Bug technique</option>
                  <option value="Problème d'affichage">Problème d'affichage</option>
                  <option value="Problème de navigation">Problème de navigation</option>
                  <option value="Problème de performance">Problème de performance</option>
                  <option value="Erreur de contenu">Erreur de contenu</option>
                  <option value="Problème d'authentification">Problème d'authentification</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-white'
                }`}>
                  Description détaillée *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm resize-none ${
                    theme === 'light'
                      ? 'bg-white border border-gray-300 text-gray-800 placeholder-gray-500'
                      : 'bg-white/10 border border-white/20 text-white placeholder-gray-400'
                  }`}
                  placeholder="Décrivez le problème en détail, les étapes pour le reproduire, et tout autre information utile..."
                />
              </div>

              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group relative inline-flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 active:scale-95 backdrop-blur-md shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'light'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-400 hover:border-blue-500 hover:shadow-blue-500/25'
                      : 'bg-gradient-to-r from-orange-600/30 via-red-600/30 to-pink-600/30 hover:from-orange-600/50 hover:via-red-600/50 hover:to-pink-600/50 text-white border border-white/20 hover:border-white/40 hover:shadow-orange-500/25'
                  }`}
                >
                  {theme === 'dark' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  )}
                  <svg className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="relative z-10 text-lg">
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
