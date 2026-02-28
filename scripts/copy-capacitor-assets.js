const fs = require('fs');
const path = require('path');

// Script pour copier les fichiers nécessaires pour Capacitor après le build Next.js
function copyCapacitorAssets() {
  const standaloneDir = path.join(__dirname, '../.next/standalone');
  const publicDir = path.join(__dirname, '../public');
  const outDir = path.join(__dirname, '../out');
  
  console.log('📦 Copie des assets pour Capacitor dans out/...');
  
  // Créer le dossier out s'il n'existe pas
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Fonction pour copier récursivement
  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
      return false;
    }
    
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      files.forEach(file => {
        copyRecursive(
          path.join(src, file),
          path.join(dest, file)
        );
      });
    } else {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
    }
    return true;
  }
  
  let copied = false;
  
  // Copier depuis .next/standalone si disponible
  if (fs.existsSync(standaloneDir)) {
    // Copier public
    if (copyRecursive(path.join(standaloneDir, 'public'), path.join(outDir, 'public'))) {
      copied = true;
    }
    
    // Copier .next (fichiers statiques compilés)
    if (copyRecursive(path.join(standaloneDir, '.next'), path.join(outDir, '.next'))) {
      copied = true;
    }
    
    // Pour Capacitor, on a besoin des fichiers statiques, pas du serveur Node.js
    // Les routes API ne fonctionneront pas en local, elles devront pointer vers Vercel
  }
  
  // Copier le dossier public racine (toujours présent)
  if (fs.existsSync(publicDir)) {
    copyRecursive(publicDir, path.join(outDir, 'public'));
    copied = true;
  }
  
  // Créer un fichier index.html minimal pour Capacitor
  const indexHtml = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    fs.writeFileSync(indexHtml, `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>CEN Corse</title>
  <script>
    // Redirect vers la page d'accueil
    window.location.href = '/';
  </script>
</head>
<body>
  <div id="__next"></div>
</body>
</html>`, 'utf8');
  }
  
  if (copied) {
    console.log('✅ Assets copiés avec succès dans out/');
    console.log('⚠️  Note: Les routes API devront pointer vers votre URL Vercel en production');
  } else {
    console.warn('⚠️  Aucun fichier trouvé à copier. Assurez-vous d\'avoir fait "npm run build" d\'abord.');
  }
}

copyCapacitorAssets();

