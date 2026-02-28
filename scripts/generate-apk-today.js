const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📱 Génération de l\'APK pour installation sur téléphone...\n');

const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const bundleDir = path.join(projectRoot, 'bundle-for-phone');

// Vérifier si le dossier android existe
if (!fs.existsSync(androidDir)) {
  console.error('❌ Le dossier android/ n\'existe pas.');
  process.exit(1);
}

console.log('🔨 Génération de l\'APK...\n');
console.log('⚠️  Cette opération peut prendre plusieurs minutes.\n');

try {
  // Générer l'APK avec gradlew assembleRelease
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
    console.log('   Taille :', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('   Date :', stats.mtime.toLocaleString(), '\n');
    
    // Copier l'APK dans le bundle
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true });
    }
    const destApk = path.join(bundleDir, 'app-release.apk');
    fs.copyFileSync(apkPath, destApk);
    
    // Mettre à jour la date du fichier copié
    const now = new Date();
    fs.utimesSync(destApk, now, now);
    
    console.log('✅ APK copié dans bundle-for-phone/app-release.apk');
    console.log('   Date mise à jour :', new Date().toLocaleString(), '\n');
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
  console.error('   1. Installez Java JDK et configurez JAVA_HOME');
  console.error('   2. Installez Android Studio et configurez Android SDK');
  console.error('   3. Ou utilisez Android Studio :');
  console.error('      - Ouvrez le dossier android/');
  console.error('      - Build > Generate Signed Bundle / APK');
  console.error('      - Choisissez APK\n');
  process.exit(1);
}
