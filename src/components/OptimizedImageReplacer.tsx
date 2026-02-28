'use client'

import React from 'react'
import Image from 'next/image'

interface OptimizedImageReplacerProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  fill?: boolean
  style?: React.CSSProperties
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

// Composant pour remplacer les images non optimisées
export default function OptimizedImageReplacer({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  style,
  placeholder = 'blur',
  blurDataURL
}: OptimizedImageReplacerProps) {
  
  // Placeholder blur par défaut
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

  // Détecter si c'est une image externe
  const isExternal = src.startsWith('http://') || src.startsWith('https://')
  
  // Pour les images externes, utiliser un loader personnalisé
  if (isExternal) {
    return (
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width || 800}
        height={fill ? undefined : height || 600}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={`transition-opacity duration-300 ${className}`}
        style={style}
        unoptimized={isExternal} // Désactiver l'optimisation pour les images externes
      />
    )
  }

  // Pour les images locales, utiliser l'optimisation Next.js
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL || defaultBlurDataURL}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      className={`transition-opacity duration-300 ${className}`}
      style={style}
    />
  )
}

// Hook pour remplacer automatiquement les images
export function useImageOptimization() {
  const replaceImage = React.useCallback((imgElement: HTMLImageElement) => {
    const src = imgElement.src
    const alt = imgElement.alt
    const className = imgElement.className
    const width = imgElement.naturalWidth
    const height = imgElement.naturalHeight
    
    // Créer un composant React optimisé
    const optimizedElement = React.createElement(OptimizedImageReplacer, {
      src,
      alt,
      width,
      height,
      className,
      priority: false
    })
    
    return optimizedElement
  }, [])

  return { replaceImage }
}













