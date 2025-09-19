'use client'

// Liste des images à précharger pour le mode hors ligne
const IMAGES_TO_PRECACHE = [
  // Photos page d'accueil
  '/photos_page_accueil/20250402_094519.jpg',
  '/photos_page_accueil/Amplexus de Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
  '/photos_page_accueil/Bufotes viridis balearicus-Lucciana-2011-© Hamoric N..jpg',
  '/photos_page_accueil/Bufotes viridis balearicus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
  '/photos_page_accueil/crapaud vert, lucciana, 2011 N Hamoric 3.jpg',
  '/photos_page_accueil/image.png',
  
  // Photos personnel
  '/photos_personnel/Arnaud Geyssels.jpg',
  '/photos_personnel/Thomas Muller.jpg',
  
  // Logos
  '/Logo_CENCorse.png',
  '/Logo_CENCorse.jpg',
  '/logo_pwa.png',
  '/small_cen.png',
  
  // Images générales
  '/EQUIPE.jpg',
  '/GALERIE.jpg',
  '/PROJ_LING.jpg',
  '/PROJETS.jpg',
  '/SONDAGE.jpg',
  '/SUPPORTS.jpg',
  '/MULLER.jpg',
  '/BukaLab.PNG'
]

// Fonction pour précharger toutes les images
export async function preloadImages(): Promise<void> {
  if (typeof window === 'undefined') return
  
  console.log('🖼️ Début du préchargement des images...')
  
  const promises = IMAGES_TO_PRECACHE.map(async (imagePath) => {
    try {
      const response = await fetch(imagePath)
      if (response.ok) {
        console.log('✅ Image préchargée:', imagePath)
      } else {
        console.log('❌ Image non trouvée:', imagePath)
      }
    } catch (error) {
      console.log('❌ Erreur lors du préchargement:', imagePath, error)
    }
  })
  
  await Promise.allSettled(promises)
  console.log('🖼️ Préchargement des images terminé')
}

// Fonction pour vérifier si une image est en cache
export async function isImageCached(imagePath: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    const response = await fetch(imagePath, { cache: 'force-cache' })
    return response.ok
  } catch {
    return false
  }
}

// Fonction pour obtenir une image avec fallback
export async function getImageWithFallback(imagePath: string, fallbackPath?: string): Promise<string> {
  if (typeof window === 'undefined') return imagePath
  
  try {
    // Essayer d'abord l'image demandée
    const response = await fetch(imagePath, { cache: 'force-cache' })
    if (response.ok) {
      return imagePath
    }
  } catch (error) {
    console.log('❌ Image non disponible:', imagePath)
  }
  
  // Si fallback fourni, l'utiliser
  if (fallbackPath) {
    try {
      const fallbackResponse = await fetch(fallbackPath, { cache: 'force-cache' })
      if (fallbackResponse.ok) {
        return fallbackPath
      }
    } catch (error) {
      console.log('❌ Image de fallback non disponible:', fallbackPath)
    }
  }
  
  // Retourner l'image par défaut
  return '/Logo_CENCorse.png'
}
