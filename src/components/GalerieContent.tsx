'use client'

import React, { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useGaleriePhotos } from '@/hooks/useGaleriePhotos'

export default function GalerieContent() {
  const { theme } = useTheme()
  const { photos, loading, error } = useGaleriePhotos()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const handleImageClick = useCallback((src: string) => {
    setSelectedImage(src)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const closeInfoModal = useCallback(() => {
    setShowInfoModal(false)
  }, [])

  return (
    <div className="space-y-4">
      <section
        className={`rounded-xl border px-3 py-2.5 sm:px-4 ${
          theme === 'light'
            ? 'border-emerald-200/50 bg-gradient-to-b from-white to-emerald-50/20'
            : 'border-emerald-500/15 bg-gradient-to-b from-slate-900/90 to-emerald-950/15'
        } `}
      >
        <p
          className={`text-[9px] font-semibold uppercase tracking-widest ${
            theme === 'light' ? 'text-emerald-800' : 'text-emerald-400/90'
          }`}
        >
          Patrimoine & partage
        </p>
        <h2
          className={`mt-0.5 font-serif text-base font-bold leading-tight sm:text-lg ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}
        >
          Galerie photo
        </h2>
        <p
          className={`mt-0.5 text-xs leading-snug ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Photographies du territoire et de la biodiversité corse — auteurs indiqués sous chaque cliché.
        </p>
        <div className="mt-2 text-center sm:text-left">
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:opacity-95 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                : 'bg-gradient-to-r from-emerald-500/80 to-teal-600/80 text-white hover:from-emerald-500 hover:to-teal-500'
            } `}
          >
            <span>En savoir plus sur les tirages</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </section>

      {error && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            theme === 'light'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-amber-950/40 border-amber-800/50 text-amber-100'
          }`}
          role="alert"
        >
          <p className="font-medium">Impossible de charger la galerie</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Grille de photos - version verticale avec légendes (données Supabase : table galerie_photos + bucket app-static) */}
      {loading && (
        <p className={`py-8 text-center ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          Chargement de la galerie…
        </p>
      )}

      {!loading && !error && photos.length === 0 && (
        <p className={`py-8 text-center text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          Aucune photo n’est publiée pour le moment. Ajoutez des entrées dans{' '}
          <code className="rounded bg-black/10 px-1">galerie_photos</code> et les fichiers dans le stockage.
        </p>
      )}

      <div className="space-y-3.5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`group cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow ${
              theme === 'light' ? 'border-slate-200/80 bg-white' : 'border-white/10 bg-slate-900/40'
            }`}
            onClick={() => handleImageClick(photo.imageUrl)}
          >
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="h-52 w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
              loading="lazy"
            />
            <div className="border-t border-slate-100/80 p-2.5 dark:border-white/5">
              <h3
                className={`mb-1 text-sm font-semibold leading-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}
              >
                {photo.title}
              </h3>
              <div
                className={`space-y-0.5 text-[11px] leading-relaxed ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <p>
                  <strong>Lieu :</strong> {photo.location}
                </p>
                <p>
                  <strong>Date :</strong> {photo.date}
                </p>
                <p>
                  <strong>Auteur :</strong> {photo.author}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'image agrandie */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Modal d'information - plein écran avec fond flouté */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-lg animate-in rounded-2xl border p-8 shadow-2xl duration-300 ${
              theme === 'dark'
                ? 'border-white/10 bg-slate-900/95'
                : 'border-slate-200/80 bg-white'
            } `}
          >
            <button
              type="button"
              onClick={closeInfoModal}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              ✕
            </button>
            <div className="text-center">
              <h3
                className={`mb-4 font-serif text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                À propos de cette galerie
              </h3>
              <p
                className={`mb-6 text-base leading-relaxed ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Le CEN Corse est ravi de partager avec vous cette sélection de photographies mettant en valeur
                la beauté de notre patrimoine naturel. Ces clichés sont l&apos;œuvre de photographes passionnés
                et talentueux qui nous font l&apos;honneur de collaborer avec nous.
              </p>
              <div
                className={`rounded-xl p-4 ${
                  theme === 'dark' ? 'bg-emerald-950/40' : 'bg-emerald-50/90'
                } `}
              >
                <p
                  className={`text-sm ${
                    theme === 'dark' ? 'text-emerald-200/90' : 'text-emerald-900'
                  } `}
                >
                  <strong>Vous avez un coup de cœur ?</strong>
                  <br />
                  Avec l&apos;accord des auteurs, nous pouvons vous proposer des tirages ou des posters de qualité.
                  N&apos;hésitez pas à nous contacter pour faire vivre vos moments préférés.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


