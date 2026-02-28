const fs = require('fs')
const path = require('path')

console.log('🎨 Mise à jour de l\'icône Android…')

const projectRoot = path.join(__dirname, '..')
// Utiliser logo_pwa_format.png (1024x1024) comme source principale pour icône nette et bien cadrée
const logoPWAFormat = path.join(projectRoot, 'public', 'logo_pwa_format.png')
const playstoreIcon = path.join(projectRoot, 'public', 'playstore-icon.png')
const logoApp = path.join(projectRoot, 'public', 'logo_app.png')
const logoCENCorse = path.join(projectRoot, 'public', 'Logo_CENCorse.png')
// Priorité: logo_pwa_format.png (1024), sinon playstore-icon, logo_app, Logo_CENCorse
const sourceIcon = fs.existsSync(logoPWAFormat) ? logoPWAFormat : (fs.existsSync(playstoreIcon) ? playstoreIcon : (fs.existsSync(logoApp) ? logoApp : logoCENCorse))
const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res')

if (!fs.existsSync(sourceIcon)) {
  console.error('❌ Icône source introuvable :', sourceIcon)
  console.error('   Tentatives:', logoCENCorse, logoPWA)
  process.exit(1)
}

console.log(`📸 Source icône: ${path.basename(sourceIcon)}`)

if (!fs.existsSync(resDir)) {
  console.error('❌ Dossier de ressources Android introuvable :', resDir)
  process.exit(1)
}

// Tailles pour chaque densité Android (pour ic_launcher.png)
const densities = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
}

// Tailles pour les adaptive icons (foreground)
const adaptiveIconSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432
}

// Vérifier si sharp est disponible
let sharp
try {
  sharp = require('sharp')
  console.log('✅ Utilisation de sharp pour redimensionner les icônes')
} catch (error) {
  console.warn('⚠️ sharp n\'est pas installé, tentative d\'installation...')
  try {
    const { execSync } = require('child_process')
    execSync('npm install --save-dev sharp', { cwd: projectRoot, stdio: 'inherit' })
    sharp = require('sharp')
    console.log('✅ sharp installé avec succès')
  } catch (installError) {
    console.error('❌ Impossible d\'installer sharp. Installation manuelle requise: npm install --save-dev sharp')
    console.log('⚠️ Copie simple du logo sans redimensionnement (peut être flou)')
  }
}

// Fonction pour supprimer le fond blanc et le rendre transparent (améliorée)
async function removeWhiteBackground(imageProcessor) {
  // Convertir en RGBA pour avoir le canal alpha
  let image = imageProcessor.ensureAlpha()
  
  // Obtenir les données de l'image
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true })
  
  // Parcourir les pixels et rendre le blanc transparent
  // Utiliser un seuil plus intelligent : détecter le blanc et les nuances proches
  // Un pixel est considéré comme blanc si R, G, B sont tous > 235 (plus permissif)
  // et utiliser une transition douce pour éviter les bords durs
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let alpha = data[i + 3]
    
    // Calculer la "blancheur" du pixel (distance du blanc pur)
    const whiteness = (r + g + b) / 3
    
    // Si le pixel est très blanc (> 235), le rendre complètement transparent
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0
    } 
    // Transition douce pour les pixels proches du blanc (235-245)
    else if (r > 230 && g > 230 && b > 230 && whiteness > 235) {
      // Réduire progressivement l'opacité
      const fadeFactor = (whiteness - 235) / 10 // 0 à 1
      data[i + 3] = Math.floor(alpha * (1 - fadeFactor * 0.8))
    }
  }
  
  // Reconstruire l'image avec les données modifiées
  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png()
}

// Fonction pour redimensionnement progressif ultra-optimisé (meilleure qualité)
// Accepte soit un chemin de fichier (string) soit un buffer (Buffer)
async function progressiveResize(source, targetSize) {
  let image = typeof source === 'string' ? sharp(source) : sharp(source)
  const metadata = await image.metadata()
  let currentSize = Math.min(metadata.width, metadata.height)
  
  // Toujours utiliser un redimensionnement progressif pour préserver la netteté
  // Créer un buffer temporaire pour le redimensionnement progressif
  let buffer = typeof source === 'string' 
    ? await sharp(source).png().toBuffer()
    : source
  
  // Redimensionner par étapes de 70% maximum (plus d'étapes = meilleure qualité)
  // S'arrêter quand on est à moins de 1.5x la taille cible
  while (currentSize > targetSize * 1.5) {
    // Réduire de 70% maximum à chaque étape pour préserver la qualité
    const nextSize = Math.max(targetSize, Math.floor(currentSize * 0.7))
    buffer = await sharp(buffer)
      .resize(nextSize, nextSize, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3, // Meilleur kernel pour la netteté
        fastShrinkOnLoad: false, // Désactiver pour meilleure qualité
        withoutEnlargement: true
      })
      .png({ compressionLevel: 0 }) // Pas de compression pendant les étapes intermédiaires
      .toBuffer()
    currentSize = nextSize
  }
  
  // Dernier redimensionnement à la taille exacte avec netteté optimisée
  return sharp(buffer)
    .resize(targetSize, targetSize, {
      fit: 'contain',
      kernel: sharp.kernel.lanczos3,
      fastShrinkOnLoad: false,
      withoutEnlargement: true
    })
    // Appliquer un filtre de netteté léger pour améliorer la netteté finale
    .sharpen({
      sigma: 0.5,
      flat: 1,
      jagged: 2
    })
}

async function resizeAndCopy(sourcePath, targetPath, size, isForeground = false) {
  const targetDir = path.dirname(targetPath)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // Fond bleu officiel de l'app (= ic_launcher_background) pour foreground opaque
  const bgBlue = { r: 30, g: 58, b: 138, alpha: 1 }
  const resizeOpts = {
    fit: 'contain',
    kernel: sharp.kernel.lanczos3,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  }

  try {
    if (sharp) {
      if (isForeground) {
        // Une seule réduction 1024→safeZone pour garder le détail. Fond BLEU UNI #1e3a8a (pas de dégradé).
        const safeZone = Math.floor(size * 0.72)
        const padding = Math.floor((size - safeZone) / 2)
        const logoLayer = await sharp(sourcePath)
          .resize(safeZone, safeZone, {
            fit: 'contain',
            kernel: sharp.kernel.lanczos3,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({ compressionLevel: 0 })
          .toBuffer()
        await sharp({
          create: { width: size, height: size, channels: 4, background: bgBlue }
        })
          .composite([{ input: logoLayer, top: padding, left: padding }])
          .png({ compressionLevel: 0 })
          .toFile(targetPath)
      } else {
        const resized = await progressiveResize(sourcePath, size)
        await resized
          .sharpen({ sigma: 0.6, flat: 1, jagged: 2 })
          .png({ compressionLevel: 0 })
          .toFile(targetPath)
      }
      console.log(`✅ Icône générée: ${path.basename(targetPath)} (${size}x${size})`)
    } else {
      // Fallback: copie simple
      fs.copyFileSync(sourcePath, targetPath)
    }
    return true
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la copie vers ${targetPath}:`, error.message)
    return false
  }
}

async function generateIcons() {
  let copied = 0
  const tasks = []

  // Générer les icônes standards
  Object.entries(densities).forEach(([dirName, size]) => {
    const targetDir = path.join(resDir, dirName)
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    tasks.push(
      resizeAndCopy(sourceIcon, path.join(targetDir, 'ic_launcher.png'), size),
      resizeAndCopy(sourceIcon, path.join(targetDir, 'ic_launcher_round.png'), size)
    )
  })

  // Générer les icônes adaptive foreground depuis la source (logo_pwa_format 1024)
  Object.entries(adaptiveIconSizes).forEach(([dirName, size]) => {
    const targetDir = path.join(resDir, dirName)
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    tasks.push(
      resizeAndCopy(sourceIcon, path.join(targetDir, 'ic_launcher_foreground.png'), size, true)
    )
  })
  
  // Générer aussi l'icône foreground dans mipmap-anydpi-v26 pour les adaptive icons
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26')
  if (!fs.existsSync(anydpiDir)) {
    fs.mkdirSync(anydpiDir, { recursive: true })
  }
  // Utiliser la taille xxxhdpi (432) pour mipmap-anydpi-v26
  tasks.push(
    resizeAndCopy(sourceIcon, path.join(anydpiDir, 'ic_launcher_foreground.png'), 432, true)
  )

  const results = await Promise.all(tasks)
  copied = results.filter(r => r === true).length

  if (copied === 0) {
    console.warn('⚠️ Aucune icône n\'a été générée. Vérifiez les chemins.')
    process.exit(1)
  } else {
    console.log(`✅ ${copied} icône(s) générée(s) avec succès`)
  }
}

generateIcons().catch(error => {
  console.error('❌ Erreur lors de la génération des icônes:', error)
  process.exit(1)
})
