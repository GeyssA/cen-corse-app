'use client'

import React, { useState } from 'react'
import { EMAILJS_CONFIG, SIGNALEMENT_TEMPLATE } from '@/lib/emailjs'
import { useEmailJS } from '@/hooks/useEmailJS'

interface ContactFormProps {
  onClose?: () => void
}

export default function ContactForm({ onClose }: ContactFormProps) {
  const { isLoaded, error: emailJSError } = useEmailJS()
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: '',
    typeProbleme: 'bug'
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Vérifier si EmailJS est disponible
      if (!isLoaded) {
        throw new Error('Service EmailJS en cours de chargement...')
      }
      
      if (emailJSError) {
        throw new Error(`Erreur EmailJS: ${emailJSError}`)
      }

      // Préparer les données pour EmailJS
      const now = new Date()
      const timestamp = now.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const templateParams = {
        from_name: formData.nom,
        from_email: formData.email,
        to_email: SIGNALEMENT_TEMPLATE.to_email,
        subject: `${SIGNALEMENT_TEMPLATE.subject} - ${formData.sujet}`,
        message: formData.message,
        type_probleme: formData.typeProbleme,
        description_detaille: formData.message, // Variable alternative
        date_heure: timestamp,
        timestamp: timestamp,
        user_agent: navigator.userAgent,
        // Variables supplémentaires pour compatibilité
        nom: formData.nom,
        email: formData.email,
        sujet: formData.sujet,
        type: formData.typeProbleme,
        description: formData.message
      }

      // Envoyer l'email via EmailJS
      const result = await window.emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      )

      console.log('✅ Email envoyé avec succès:', result)
      setSuccess(true)
      
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        email: '',
        sujet: '',
        message: '',
        typeProbleme: 'bug'
      })

      // Fermer le modal après 2 secondes
      if (onClose) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }

    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi:', err)
      setError('Erreur lors de l\'envoi du message. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Message envoyé !</h3>
        <p className="text-gray-300 text-sm">
          Votre signalement a été transmis à l'équipe. Nous vous répondrons dans les plus brefs délais.
        </p>
      </div>
    )
  }

  // Affichage du chargement d'EmailJS
  if (!isLoaded && !emailJSError) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300 text-sm">Chargement du service de contact...</p>
      </div>
    )
  }

  // Affichage d'erreur de chargement EmailJS
  if (emailJSError) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Erreur de service</h3>
        <p className="text-gray-300 text-sm mb-4">
          Le service de contact n'est pas disponible. Veuillez réessayer plus tard.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Signaler un problème</h3>
        <p className="text-gray-300 text-sm">
          Décrivez le problème que vous rencontrez et nous vous aiderons à le résoudre.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre nom"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="votre@email.com"
          />
        </div>

        {/* Type de problème */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Type de problème
          </label>
          <select
            name="typeProbleme"
            value={formData.typeProbleme}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="bug">Bug / Dysfonctionnement</option>
            <option value="feature">Demande de fonctionnalité</option>
            <option value="ui">Problème d'interface</option>
            <option value="performance">Lenteur / Performance</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Sujet */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Sujet *
          </label>
          <input
            type="text"
            name="sujet"
            value={formData.sujet}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Résumé du problème"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Description détaillée *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Décrivez le problème en détail, les étapes pour le reproduire, etc."
          />
        </div>

        {/* Erreur */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
