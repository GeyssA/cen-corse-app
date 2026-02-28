const fs = require('fs');
const path = require('path');

// Script pour préparer le build Capacitor en masquant temporairement les routes API
console.log('🔧 Préparation du build Capacitor...');

const apiDir = path.join(__dirname, '../src/app/api');
const apiBackupDir = path.join(__dirname, '../src/app/_api_backup');

// Si le dossier API existe, le sauvegarder et le supprimer
if (fs.existsSync(apiDir)) {
  console.log('📦 Sauvegarde des routes API...');
  
  // Créer le dossier de backup s'il n'existe pas
  if (!fs.existsSync(apiBackupDir)) {
    fs.mkdirSync(apiBackupDir, { recursive: true });
  }
  
  // Copier le contenu
  function copyRecursive(src, dest) {
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
  }
  
  // Copier vers le backup
  copyRecursive(apiDir, apiBackupDir);
  
  // Supprimer le dossier API (il sera restauré après le build)
  fs.rmSync(apiDir, { recursive: true, force: true });
  
  console.log('✅ Routes API masquées temporairement');
} else {
  console.log('⚠️  Dossier API introuvable');
}

console.log('✅ Prêt pour le build Capacitor');










