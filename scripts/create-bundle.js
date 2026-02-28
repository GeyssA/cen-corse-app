const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Création du bundle pour téléchargement...\n');

const projectRoot = path.join(__dirname, '..');
const bundleDir = path.join(projectRoot, 'bundle-for-phone');
const publicDir = path.join(projectRoot, 'public');
const outDir = path.join(projectRoot, 'out');

// Nettoyer le dossier bundle s'il existe
if (fs.existsSync(bundleDir)) {
  console.log('🧹 Nettoyage de l\'ancien bundle...');
  fs.rmSync(bundleDir, { recursive: true, force: true });
}

// Créer le dossier bundle
fs.mkdirSync(bundleDir, { recursive: true });

console.log('📋 Copie des fichiers nécessaires...\n');

// Copier le dossier public
if (fs.existsSync(publicDir)) {
  console.log('✅ Copie du dossier public...');
  copyDir(publicDir, path.join(bundleDir, 'public'));
}

// Copier le dossier out si il existe (build statique)
if (fs.existsSync(outDir)) {
  console.log('✅ Copie du dossier out (build statique)...');
  copyDir(outDir, path.join(bundleDir, 'out'));
} else {
  console.log('⚠️  Le dossier out n\'existe pas. Le build statique n\'a pas été créé.');
  console.log('   Pour créer le build, exécutez: npm run build:capacitor\n');
}

// Vérifier si un AAB existe et le copier (priorité pour Play Store)
const androidDir = path.join(projectRoot, 'android');
const aabPath = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

if (fs.existsSync(aabPath)) {
  console.log('✅ AAB trouvé, copie dans le bundle...');
  fs.copyFileSync(aabPath, path.join(bundleDir, 'app-release.aab'));
  const stats = fs.statSync(aabPath);
  console.log(`   Taille : ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('   Format : Android App Bundle (recommandé pour Play Store)\n');
} else if (fs.existsSync(apkPath)) {
  console.log('✅ APK trouvé, copie dans le bundle...');
  fs.copyFileSync(apkPath, path.join(bundleDir, 'app-release.apk'));
  const stats = fs.statSync(apkPath);
  console.log(`   Taille : ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('   Note : Pour le Play Store, générez plutôt un AAB :');
  console.log('   node scripts/build-aab-for-phone.js\n');
} else {
  console.log('⚠️  Aucun AAB ou APK trouvé.');
  console.log('   Pour générer un AAB (recommandé) : node scripts/build-aab-for-phone.js');
  console.log('   Pour générer un APK : node scripts/build-apk-for-phone.js\n');
}

// Créer un fichier README avec les instructions
const readmeContent = `# Bundle pour téléchargement sur téléphone

## 📱 Comment tester sur votre téléphone

### Option 1 : Via un serveur local (recommandé pour test rapide)

1. Installez un serveur HTTP simple sur votre PC :
   - Python : \`python -m http.server 8000\` (dans le dossier bundle-for-phone/out)
   - Node.js : \`npx serve out -p 8000\`
   - Ou utilisez un serveur comme XAMPP, WAMP, etc.

2. Connectez votre téléphone au même réseau WiFi que votre PC

3. Trouvez l'adresse IP de votre PC :
   - Windows : \`ipconfig\` → cherchez "IPv4 Address"
   - Exemple : 192.168.1.100

4. Sur votre téléphone, ouvrez un navigateur et allez à :
   \`http://192.168.1.100:8000\`

5. Ajoutez à l'écran d'accueil pour tester en mode PWA

### Option 2 : Créer un APK (pour installation directe)

1. Dans le dossier deploy/, exécutez :
   \`npm run build:capacitor\`

2. Puis :
   \`cd android && ./gradlew assembleRelease\`

3. L'APK sera dans :
   \`android/app/build/outputs/apk/release/app-release.apk\`

4. Transférez l'APK sur votre téléphone et installez-le

### Option 3 : Utiliser PWA Builder (le plus simple)

1. Déployez votre app sur Vercel (ou autre hébergeur)

2. Allez sur https://www.pwabuilder.com/

3. Entrez l'URL de votre app déployée

4. Cliquez sur "Build My PWA" → Android

5. Téléchargez l'APK et installez-le sur votre téléphone

## ✅ Vérifications

- Le logo utilisé pour l'icône d'application est : \`playstore-icon.png\`
- Vérifiez que l'icône apparaît correctement sur votre téléphone
- L'app doit s'ouvrir en mode plein écran (sans barre de navigation)

## 📝 Notes

- Ce bundle contient les fichiers statiques de l'application
- Pour un build complet avec Capacitor, utilisez \`npm run build:capacitor\`
- Les fichiers sont dans le dossier \`out/\` pour un build statique Next.js
`;

fs.writeFileSync(path.join(bundleDir, 'README.md'), readmeContent);
console.log('✅ README.md créé\n');

// Fonction pour copier un dossier récursivement
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('✅ Bundle créé avec succès !\n');
console.log('📁 Emplacement :', bundleDir);
console.log('\n💡 Pour créer un build statique complet, exécutez :');
console.log('   npm run build:capacitor\n');
