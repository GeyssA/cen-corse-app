/**
 * Génère la favicon web à partir du logo Android (logo_pwa_format.png) :
 * - même source que l'icône Android
 * - fond blanc conservé, forme arrondie (comme l'icône de l'app)
 *
 * Usage: node scripts/generate-favicon.js
 * Fichiers générés dans public/: favicon.ico, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const sourceIcon = path.join(projectRoot, 'public', 'logo_pwa_format.png')
const fallback = path.join(projectRoot, 'public', 'logo_app.png')
const logoSource = fs.existsSync(sourceIcon) ? sourceIcon : fallback

if (!fs.existsSync(logoSource)) {
  console.error('❌ Logo source introuvable. Attendu: public/logo_pwa_format.png ou public/logo_app.png')
  process.exit(1)
}

let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('❌ sharp requis. Lancez: npm install --save-dev sharp')
  process.exit(1)
}

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

/** Masque alpha en rectangle à coins arrondis (radius = 22% du côté) */
function roundedRectMask(size, radiusPercent = 0.22) {
  const r = Math.max(2, Math.floor(size * radiusPercent))
  const buf = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      buf[i] = 255
      buf[i + 1] = 255
      buf[i + 2] = 255
      const inCenter = x >= r && x < size - r && y >= r && y < size - r
      const inTopLeft = x < r && y < r && (x - r) ** 2 + (y - r) ** 2 <= r * r
      const inTopRight = x >= size - r && y < r && (x - (size - 1 - r)) ** 2 + (y - r) ** 2 <= r * r
      const inBottomLeft = x < r && y >= size - r && (x - r) ** 2 + (y - (size - 1 - r)) ** 2 <= r * r
      const inBottomRight = x >= size - r && y >= size - r && (x - (size - 1 - r)) ** 2 + (y - (size - 1 - r)) ** 2 <= r * r
      buf[i + 3] = (inCenter || inTopLeft || inTopRight || inBottomLeft || inBottomRight) ? 255 : 0
    }
  }
  return buf
}

/** Resize logo sur fond blanc, puis applique le masque arrondi (comme l’icône app). */
async function applyRoundedFavicon(inputPath, size, radiusPercent = 0.22) {
  const resized = await sharp(inputPath)
    .resize(size, size, { fit: 'contain', background: WHITE })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const mask = roundedRectMask(size, radiusPercent)
  const { data, info } = resized
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = Math.floor((data[i + 3] * mask[i + 3]) / 255)
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png()
}

async function main() {
  console.log('🎨 Génération de la favicon (logo Android, fond blanc arrondi comme l’icône app)…')
  const publicDir = path.join(projectRoot, 'public')
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' }
  ]
  for (const { size, name } of sizes) {
    const outPath = path.join(publicDir, name)
    const png = await applyRoundedFavicon(logoSource, size)
    await png.toFile(outPath)
    console.log('✅', name, `(${size}x${size})`)
  }

  const png32 = await applyRoundedFavicon(logoSource, 32)
  const buf32 = await png32.png().toBuffer()
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf32)
  console.log('✅ favicon.ico (32x32)')
  console.log('✅ Favicon prête. Rafraîchissez la page (cache navigateur si besoin).')
}

main().catch((err) => {
  console.error('❌', err)
  process.exit(1)
})
