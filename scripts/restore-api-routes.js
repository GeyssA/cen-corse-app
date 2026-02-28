const fs = require('fs');
const path = require('path');

// Script pour restaurer les routes API après le build Capacitor
console.log('🔄 Restauration des routes API...');

const apiDir = path.join(__dirname, '../src/app/api');
const apiBackupDir = path.join(__dirname, '../src/app/_api_backup');

// Si le backup existe, restaurer
if (fs.existsSync(apiBackupDir)) {
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
  
  // Restaurer depuis le backup
  copyRecursive(apiBackupDir, apiDir);
  
  // Supprimer le backup
  fs.rmSync(apiBackupDir, { recursive: true, force: true });
  
  console.log('✅ Routes API restaurées');
} else {
  console.log('⚠️  Aucun backup trouvé');
}










