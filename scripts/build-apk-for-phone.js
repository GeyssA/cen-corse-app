const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📱 Création de l\'APK pour téléchargement sur téléphone...\n');

const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const bundleDir = path.join(projectRoot, 'bundle-for-phone');

// Vérifier si le dossier android existe
if (!fs.existsSync(androidDir)) {
  console.error('❌ Le dossier android/ n\'existe pas.');
  console.error('   Vous devez d\'abord initialiser Capacitor :');
  console.error('   npx cap add android\n');
  process.exit(1);
}

console.log('✅ Dossier Android trouvé\n');

// Vérifier si Gradle est disponible
let gradleAvailable = false;
try {
  execSync('gradlew --version', { cwd: androidDir, stdio: 'ignore' });
  gradleAvailable = true;
} catch (error) {
  try {
    execSync('gradle --version', { stdio: 'ignore' });
    gradleAvailable = true;
  } catch (e) {
    console.warn('⚠️  Gradle n\'est pas disponible dans le PATH');
    console.warn('   Vous pouvez utiliser le wrapper Gradle (gradlew) dans le dossier android/\n');
  }
}

// Vérifier si l'APK existe déjà
if (fs.existsSync(apkPath)) {
  console.log('📦 APK existant trouvé :', apkPath);
  const stats = fs.statSync(apkPath);
  console.log('   Taille :', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('   Date :', stats.mtime.toLocaleString());
  console.log('\n💡 Pour générer un nouvel APK, exécutez :');
  console.log('   cd android');
  console.log('   gradlew assembleRelease\n');
  
  // Copier l'APK dans le bundle
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }
  const destApk = path.join(bundleDir, 'app-release.apk');
  fs.copyFileSync(apkPath, destApk);
  console.log('✅ APK copié dans bundle-for-phone/app-release.apk\n');
  process.exit(0);
}

console.log('🔨 Génération de l\'APK...\n');
console.log('⚠️  Cette opération peut prendre plusieurs minutes.\n');

try {
  // Essayer de générer l'APK avec gradlew
  console.log('📦 Build de l\'APK en cours...');
  execSync('gradlew assembleRelease', { 
    cwd: androidDir, 
    stdio: 'inherit',
    shell: true
  });
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    console.log('\n✅ APK généré avec succès !');
    console.log('   Emplacement :', apkPath);
    console.log('   Taille :', (stats.size / 1024 / 1024).toFixed(2), 'MB\n');
    
    // Copier l'APK dans le bundle
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true });
    }
    const destApk = path.join(bundleDir, 'app-release.apk');
    fs.copyFileSync(apkPath, destApk);
    console.log('✅ APK copié dans bundle-for-phone/app-release.apk\n');
    console.log('📱 Pour installer sur votre téléphone :');
    console.log('   1. Transférez app-release.apk sur votre téléphone');
    console.log('   2. Ouvrez le fichier depuis les téléchargements');
    console.log('   3. Autorisez l\'installation depuis des sources inconnues (si demandé)');
    console.log('   4. Installez l\'application\n');
  } else {
    console.error('❌ L\'APK n\'a pas été généré. Vérifiez les erreurs ci-dessus.');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Erreur lors de la génération de l\'APK :');
  console.error('   ', error.message);
  console.error('\n💡 Solutions possibles :');
  console.error('   1. Installez Android Studio et configurez Gradle');
  console.error('   2. Ou utilisez PWA Builder (plus simple) :');
  console.error('      - Déployez votre app sur Vercel');
  console.error('      - Allez sur https://www.pwabuilder.com/');
  console.error('      - Entrez votre URL Vercel');
  console.error('      - Téléchargez l\'APK\n');
  process.exit(1);
}
