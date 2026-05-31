'use client'

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  fetchPublishedNumericalSupports,
  type ImageSlot,
  type NumericalSupport
} from '@/lib/ressourcesNumeriques'
import { appStaticMediaUrl } from '@/lib/app-static-media'

async function openSupportUrl(url: string) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return
    }
  } catch {
    // fallback web
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function downloadSupportFile(url: string, filename: string) {
  if ((await import('@capacitor/core')).Capacitor.isNativePlatform()) {
    // Sur WebView Android, le download direct peut être bloqué : ouvrir la ressource dans le navigateur natif.
    await openSupportUrl(url)
    return
  }
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
  } catch {
    await openSupportUrl(url)
  }
}

function getFileNameFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url)
    const raw = parsed.pathname.split('/').pop() || fallback
    return decodeURIComponent(raw)
  } catch {
    return fallback
  }
}

async function downloadSupportImagesZip(title: string, images: string[]) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  for (let idx = 0; idx < images.length; idx++) {
    const img = images[idx]
    const response = await fetch(img)
    if (!response.ok) continue
    const blob = await response.blob()
    const ext = (img.split('.').pop() || 'jpg').split('?')[0]
    zip.file(`page_${idx + 1}.${ext}`, blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').slice(0, 60) || 'ressource'
  if ((await import('@capacitor/core')).Capacitor.isNativePlatform()) {
    try {
      const file = new File([zipBlob], `${safeTitle}.zip`, { type: 'application/zip' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${safeTitle}.zip` })
        return
      }
    } catch {
      // fallback anchor
    }
  }
  const objectUrl = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `${safeTitle}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
}

// Composant pour afficher un support - Design simple et efficace
const SupportCard = memo(function SupportCard({ 
  support, 
  onClick 
}: { 
  support: NumericalSupport
  onClick: (support: NumericalSupport) => void 
}) {
  const { theme } = useTheme()
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    setDescExpanded(false)
  }, [support.id])

  const desc = (support.description ?? '').trim()
  const showDescToggle = desc.length > 120

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(support)
  }, [support, onClick])

  // Design compact pour les PDFs sans image de couverture
  if (!support.coverImage) {
    return (
      <div
        className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-md ${
          theme === 'light'
            ? 'border-slate-200/80 bg-white/95'
            : 'border-white/10 bg-white/[0.05]'
        } `}
      >
        <span
          className={`mb-1.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
            theme === 'light' ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-500/15 text-emerald-200'
          }`}
        >
          {support.category}
        </span>

        <h3
          className={`mb-1.5 break-words text-sm font-medium leading-snug ${
            theme === 'light' ? 'text-slate-900' : 'text-slate-100'
          }`}
        >
          {support.title}
        </h3>

        {desc && (
          <div className="mb-2.5">
            <p
              className={`whitespace-pre-wrap text-xs leading-relaxed ${
                !descExpanded && showDescToggle ? 'line-clamp-3' : ''
              } ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              } `}
            >
              {desc}
            </p>
            {showDescToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDescExpanded((v) => !v)
                }}
                className={`mt-1 text-left text-[11px] font-semibold ${
                  theme === 'light'
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-emerald-400/90 hover:text-emerald-300'
                } `}
              >
                {descExpanded ? 'Réduire' : 'Lire la suite'}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleViewClick}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200/90'
                : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
            }`}
          >
            Voir
          </button>

          {support.pdfUrl ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void downloadSupportFile(
                  support.pdfUrl!,
                  getFileNameFromUrl(support.pdfUrl!, `${support.title}.pdf`)
                )
              }}
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35'
              }`}
            >
              Télécharger
            </button>
          ) : support.images.length > 0 && (
            <button
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                try {
                  await downloadSupportImagesZip(support.title, support.images)
                } catch {
                  if (support.images[0]) await openSupportUrl(support.images[0])
                }
              }}
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35'
              }`}
            >
              Télécharger
            </button>
          )}
        </div>
      </div>
    )
  }

  // Design standard avec image pour les autres supports
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${
        theme === 'light' ? 'border-slate-200/80 bg-white' : 'border-white/10 bg-slate-900/40'
      }`}
    >
      {/* Photo visible */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={support.coverImage}
          alt={support.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badge catégorie discret */}
        <div className="absolute left-3 top-3">
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium backdrop-blur-sm ${
              theme === 'light' ? 'bg-white/90 text-slate-700' : 'bg-slate-900/75 text-slate-200'
            }`}
          >
            {support.category}
          </span>
        </div>
      </div>

      <div
        className={`border-t p-3 ${
          theme === 'light' ? 'border-slate-100 bg-white' : 'border-white/5 bg-slate-900/50'
        }`}
      >
        <h3
          className={`mb-1.5 text-sm font-medium leading-snug break-words ${
            theme === 'light' ? 'text-slate-900' : 'text-slate-100'
          }`}
        >
          {support.title}
        </h3>

        {desc && (
          <div className="mb-2.5">
            <p
              className={`whitespace-pre-wrap text-xs leading-relaxed ${
                !descExpanded && showDescToggle ? 'line-clamp-3' : ''
              } ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              } `}
            >
              {desc}
            </p>
            {showDescToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDescExpanded((v) => !v)
                }}
                className={`mt-1 text-left text-[11px] font-semibold ${
                  theme === 'light'
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-emerald-400/90 hover:text-emerald-300'
                } `}
              >
                {descExpanded ? 'Réduire' : 'Lire la suite'}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleViewClick}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200/90'
                : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
            }`}
          >
            Voir
          </button>

          {support.pdfUrl ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void downloadSupportFile(
                  support.pdfUrl!,
                  getFileNameFromUrl(support.pdfUrl!, `${support.title}.pdf`)
                )
              }}
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35'
              }`}
            >
              Télécharger
            </button>
          ) : support.images.length > 0 && (
            <button
              onClick={async (e) => {
                 e.preventDefault()
                 e.stopPropagation()
                 try {
                   await downloadSupportImagesZip(support.title, support.images)
                 } catch {
                   if (support.images[0]) await openSupportUrl(support.images[0])
                 }
               }}
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35'
              }`}
            >
              Télécharger
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// Modal plein écran avec zoom et pan (style Messenger)
function renderImageSlot(slot: ImageSlot, title: string, slotIndex: number) {
  if (slot.type === 'single') {
    return (
      <img
        src={slot.url}
        alt={`${title} — ${slotIndex + 1}`}
        className="max-h-[88vh] w-auto max-w-full object-contain select-none"
        draggable={false}
      />
    )
  }
  return (
    <div className="flex w-full max-w-5xl flex-col items-stretch justify-center gap-3 px-2 sm:flex-row sm:gap-5">
      <figure className="flex min-w-0 flex-1 flex-col items-center">
        <figcaption className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/65">
          Recto
        </figcaption>
        <img
          src={slot.recto}
          alt={`${title} — recto`}
          className="max-h-[42vh] w-auto max-w-full object-contain select-none sm:max-h-[78vh]"
          draggable={false}
        />
      </figure>
      <figure className="flex min-w-0 flex-1 flex-col items-center">
        <figcaption className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/65">
          Verso
        </figcaption>
        <img
          src={slot.verso}
          alt={`${title} — verso`}
          className="max-h-[42vh] w-auto max-w-full object-contain select-none sm:max-h-[78vh]"
          draggable={false}
        />
      </figure>
    </div>
  )
}

const SupportModal = memo(function SupportModal({ 
  support, 
  isOpen, 
  onClose 
}: { 
  support: NumericalSupport | null
  isOpen: boolean
  onClose: () => void 
}) {
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)

  // Réinitialiser le zoom et la position lors du changement d'image
  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handlePrevImage = useCallback(() => {
    if (support?.slots && support.slots.length > 0) {
      setCurrentSlotIndex((prev) =>
        prev === 0 ? support.slots.length - 1 : prev - 1
      )
      resetZoom()
    }
  }, [support, resetZoom])

  const handleNextImage = useCallback(() => {
    if (support?.slots && support.slots.length > 0) {
      setCurrentSlotIndex((prev) =>
        prev === support.slots.length - 1 ? 0 : prev + 1
      )
      resetZoom()
    }
  }, [support, resetZoom])

  // Gestion du zoom avec la molette
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(1, scale + delta), 5)
    setScale(newScale)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  // Gestion du drag pour déplacer l'image
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, scale, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Gestion du pinch-to-zoom sur mobile
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStartZoom = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      setLastTouchDistance(getTouchDistance(e.touches))
    }
  }, [])

  const handleTouchMoveZoom = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      e.preventDefault()
      const currentDistance = getTouchDistance(e.touches)
      const delta = (currentDistance - lastTouchDistance) * 0.01
      const newScale = Math.min(Math.max(1, scale + delta), 5)
      setScale(newScale)
      setLastTouchDistance(currentDistance)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    }
  }, [lastTouchDistance, scale])

  const handleTouchEndZoom = useCallback(() => {
    setLastTouchDistance(null)
  }, [])

  useEffect(() => {
    if (!isOpen || !support) return
    setCurrentSlotIndex(0)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [isOpen, support?.id])

  // Double-tap pour zoomer/dézoomer
  const [lastTap, setLastTap] = useState(0)
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTap < 300) {
      if (scale === 1) {
        setScale(2)
      } else {
        resetZoom()
      }
    }
    setLastTap(now)
  }, [lastTap, scale, resetZoom])

  // Gestion du swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleNextImage()
    }
    if (isRightSwipe) {
      handlePrevImage()
    }
  }

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'ArrowLeft') {
        handlePrevImage()
      } else if (e.key === 'ArrowRight') {
        handleNextImage()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrevImage, handleNextImage, onClose])

  if (!isOpen || !support) return null
  const currentSlot = support.slots?.[currentSlotIndex]
  const currentSlotUrls = currentSlot
    ? currentSlot.type === 'single'
      ? [currentSlot.url]
      : [currentSlot.recto, currentSlot.verso]
    : []

  const topSafe = 'max(1rem, env(safe-area-inset-top, 0px))'
  const bottomSafe = 'max(1rem, env(safe-area-inset-bottom, 0px))'
  const leftSafe = 'max(1rem, env(safe-area-inset-left, 0px))'
  const rightSafe = 'max(1rem, env(safe-area-inset-right, 0px))'

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Bouton fermer — respecte la barre système */}
      <button
        onClick={onClose}
        className="absolute z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
        style={{ top: topSafe, right: rightSafe }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {currentSlotUrls.length > 0 && (
        <button
          onClick={async () => {
            if (currentSlotUrls.length === 1) {
              await downloadSupportFile(
                currentSlotUrls[0],
                getFileNameFromUrl(currentSlotUrls[0], `${support.title}.jpg`)
              )
              return
            }
            await downloadSupportImagesZip(support.title, currentSlotUrls)
          }}
          className="absolute z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          style={{ top: topSafe, right: `calc(${rightSafe} + 3rem)` }}
          title="Télécharger"
          aria-label="Télécharger"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </button>
      )}

      {/* Indicateur de zoom */}
      {scale > 1 && (
        <div className="absolute left-1/2 transform -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium" style={{ top: topSafe }}>
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Boutons de contrôle zoom — respectent la barre système */}
      <div className="absolute left-4 z-20 flex flex-col gap-2" style={{ top: topSafe }}>
        <button
          onClick={() => {
            const newScale = Math.min(scale + 0.5, 5)
            setScale(newScale)
          }}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          title="Zoom +"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={() => {
            const newScale = Math.max(scale - 0.5, 1)
            setScale(newScale)
            if (newScale === 1) setPosition({ x: 0, y: 0 })
          }}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          title="Zoom -"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        {scale > 1 && (
          <button
            onClick={resetZoom}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            title="Réinitialiser"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation gauche */}
      {support.slots && support.slots.length > 1 && (
        <button
          onClick={handlePrevImage}
          className="absolute top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          style={{ left: leftSafe }}
        >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
      )}

      {/* Navigation droite */}
      {support.slots && support.slots.length > 1 && (
        <button
          onClick={handleNextImage}
          className="absolute top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          style={{ right: rightSafe }}
        >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
      )}

      {/* Conteneur avec zoom et pan (style Messenger) */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          handleTouchStartZoom(e)
          handleTouchStart(e)
          if (e.touches.length === 1) handleDoubleTap()
        }}
        onTouchMove={(e) => {
          handleTouchMoveZoom(e)
          handleTouchMove(e)
        }}
        onTouchEnd={(e) => {
          handleTouchEndZoom()
          handleTouchEnd()
        }}
        style={{ cursor: scale > 1 ? 'move' : 'default' }}
      >
        {support.slots && support.slots.length > 0 ? (
          <div
            className="flex max-h-full max-w-full items-center justify-center"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {renderImageSlot(support.slots[currentSlotIndex], support.title, currentSlotIndex)}
          </div>
        ) : support.pdfUrl ? (
          <iframe
            src={support.pdfUrl}
            className="w-full h-screen"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              border: 'none'
            }}
            title={support.title}
          />
        ) : null}
      </div>
              
      {/* Indicateurs de pages / planches */}
      {support.slots && support.slots.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2">
                  {support.slots.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setCurrentSlotIndex(index)
                        resetZoom()
                      }}
              className={`h-2 w-2 rounded-full transition-colors ${
                        index === currentSlotIndex
                  ? 'bg-white'
                  : 'bg-white/50'
                      }`}
                    />
                  ))}
            </div>
          )}

      {/* Compteur : une planche = un slot (recto+verso = 1) */}
      {support.slots && support.slots.length > 1 && (
        <div className="absolute right-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full" style={{ bottom: bottomSafe }}>
          {currentSlotIndex + 1} / {support.slots.length}
        </div>
      )}
    </div>
  )
})

// Composant principal
const RessourcesContent = memo(function RessourcesContent() {
  const { theme } = useTheme()
  const [supports, setSupports] = useState<NumericalSupport[]>([])
  const [supportsLoading, setSupportsLoading] = useState(true)
  const [supportsError, setSupportsError] = useState<string | null>(null)
  const [selectedSupport, setSelectedSupport] = useState<NumericalSupport | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Fascicule CEN')

  useEffect(() => {
    let cancelled = false
    setSupportsLoading(true)
    setSupportsError(null)
    fetchPublishedNumericalSupports().then(({ data, error }) => {
      if (cancelled) return
      setSupportsLoading(false)
      if (error) setSupportsError(error)
      setSupports(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Onglets thématiques élégants avec émojis et logo
  const thematicTabs = useMemo(() => [
    {
      id: 'fascicules-cen',
      name: 'Fascicule CEN',
      icon: (
        <img
          src={appStaticMediaUrl('Nos fascicules/small_cen-removebg-preview.png')}
          alt="CEN Corse"
          className="h-7 w-7 object-contain"
        />
      ),
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700'
    },
    {
      id: 'herpetologie',
      name: 'Herpétologie',
      icon: '🦎',
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'from-green-600 to-green-700'
    },
    {
      id: 'oiseaux',
      name: 'Oiseaux',
      icon: '🦅',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700'
    },
    {
      id: 'flore',
      name: 'Flore',
      icon: '🌺',
      gradient: 'from-pink-500 to-pink-600',
      hoverGradient: 'from-pink-600 to-pink-700'
    },
    {
      id: 'publications',
      name: 'Publications',
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
      gradient: 'from-indigo-500 to-violet-600',
      hoverGradient: 'from-indigo-600 to-violet-700'
    }
  ], [])

  // Filtrage des supports
  const filteredSupports = useMemo(() => {
    return supports.filter((support) => {
      const matchesSearch = support.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           support.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = support.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [supports, searchTerm, selectedCategory])

  const handleSupportClick = useCallback((support: NumericalSupport) => {
    if ((!support.slots || support.slots.length === 0) && support.pdfUrl) {
      void openSupportUrl(support.pdfUrl)
      return
    }
    setSelectedSupport(support)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedSupport(null)
  }, [])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-1 py-1">
        <section
          className={`mb-3 rounded-xl border px-3 py-2.5 sm:px-4 ${
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
            Documentation
          </p>
          <h2
            className={`mt-0.5 font-serif text-base font-bold leading-tight sm:text-lg ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Supports numériques
          </h2>
          <p
            className={`mt-0.5 max-w-2xl text-xs leading-snug ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Fascicules, fiches thématiques et ressources à feuilleter ou télécharger.
          </p>
        </section>

        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {thematicTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.name)}
                className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 ${
                  selectedCategory === tab.name
                    ? theme === 'light'
                      ? 'border-emerald-500/50 bg-white text-slate-900 ring-1 ring-emerald-500/35'
                      : 'border-emerald-500/35 bg-emerald-950/40 text-white ring-1 ring-emerald-500/30'
                    : theme === 'light'
                      ? 'border-slate-200/80 bg-white/80 text-slate-700 hover:border-emerald-200/80'
                      : 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-emerald-500/30 hover:bg-white/[0.08]'
                } `}
                title={tab.name}
              >
                <div
                  className={`text-2xl leading-none transition-transform duration-200 sm:text-[1.75rem] ${
                    selectedCategory === tab.name ? 'scale-105' : 'scale-100'
                  }`}
                >
                  {tab.icon}
                </div>
                {selectedCategory === tab.name && (
                  <div className="absolute -bottom-1.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {supportsError && (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
              theme === 'light'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-100'
            }`}
            role="alert"
          >
            <p className="font-medium">Impossible de charger le catalogue</p>
            <p className="mt-1 opacity-90">{supportsError}</p>
            <p className="mt-2 text-xs opacity-80">
              Vérifiez que la table <code className="rounded bg-black/10 px-1">ressources_numeriques</code> existe
              (migration SQL dans <code className="rounded bg-black/10 px-1">supabase/migrations</code>).
            </p>
          </div>
        )}

        {supportsLoading ? (
          <div className="py-10 text-center">
            <p className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>Chargement des supports…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-4">
              {filteredSupports.map((support) => (
                <SupportCard
                  key={support.id}
                  support={support}
                  onClick={handleSupportClick}
                />
              ))}
            </div>

            {/* Message si aucun résultat */}
            {filteredSupports.length === 0 && !supportsError && (
              <div className="py-8 text-center">
                <p
                  className={`text-sm ${
                    theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  {supports.length === 0
                    ? 'Aucun support numérique publié pour le moment.'
                    : 'Aucun document trouvé pour cette catégorie.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal avec swipe */}
      <SupportModal
        support={selectedSupport}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
})

export default RessourcesContent
