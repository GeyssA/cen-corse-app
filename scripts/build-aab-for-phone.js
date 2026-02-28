const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Création de l\'AAB (Android App Bundle) pour téléchargement...\n');

const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const aabPath = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const bundleDir = path.join(projectRoot, 'bundle-for-phone');

// Vérifier si le dossier android existe
if (!fs.existsSync(androidDir)) {
  console.error('❌ Le dossier android/ n\'existe pas.');
  console.error('   Vous devez d\'abord initialiser Capacitor :');
  console.error('   npx cap add android\n');
  process.exit(1);
}

console.log('✅ Dossier Android trouvé\n');

// Vérifier si le keystore existe
const keystorePath = path.join(androidDir, 'app', 'cencorse-release-key.jks');
const keystorePropsPath = path.join(androidDir, 'keystore.properties');

if (!fs.existsSync(keystorePath) && !fs.existsSync(keystorePropsPath)) {
  console.warn('⚠️  Aucun keystore trouvé. L\'AAB sera signé avec le debug keystore.');
  console.warn('   Pour le Play Store, vous devez utiliser un keystore de release.\n');
}

// Vérifier si l'AAB existe déjà
if (fs.existsSync(aabPath)) {
  console.log('📦 AAB existant trouvé :', aabPath);
  const stats = fs.statSync(aabPath);
  console.log('   Taille :', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('   Date :', stats.mtime.toLocaleString());
  console.log('\n💡 Pour générer un nouvel AAB, exécutez :');
  console.log('   cd android');
  console.log('   gradlew bundleRelease\n');
  
  // Copier l'AAB dans le bundle
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }
  const destAab = path.join(bundleDir, 'app-release.aab');
  fs.copyFileSync(aabPath, destAab);
  console.log('✅ AAB copié dans bundle-for-phone/app-release.aab\n');
  console.log('📱 Format AAB (Android App Bundle) :');
  console.log('   - Format recommandé par Google Play Store');
  console.log('   - Plus petit que l\'APK');
  console.log('   - Google Play génère les APK optimisés pour chaque appareil');
  console.log('   - Prêt pour upload sur Play Console\n');
  process.exit(0);
}

console.log('🔨 Génération de l\'AAB...\n');
console.log('⚠️  Cette opération peut prendre plusieurs minutes.\n');

try {
  // Générer l'AAB avec gradlew bundleRelease
  console.log('📦 Build de l\'AAB en cours...');
  execSync('gradlew bundleRelease', { 
    cwd: androidDir, 
    stdio: 'inherit',
    shell: true
  });
  
  if (fs.existsSync(aabPath)) {
    const stats = fs.statSync(aabPath);
    console.log('\n✅ AAB généré avec succès !');
    console.log('   Emplacement :', aabPath);
    console.log('   Taille :', (stats.size / 1024 / 1024).toFixed(2), 'MB\n');
    
    // Copier l'AAB dans le bundle
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true });
    }
    const destAab = path.join(bundleDir, 'app-release.aab');
    fs.copyFileSync(aabPath, destAab);
    console.log('✅ AAB copié dans bundle-for-phone/app-release.aab\n');
    console.log('📱 Format AAB (Android App Bundle) :');
    console.log('   ✅ Format recommandé par Google Play Store');
    console.log('   ✅ Plus petit que l\'APK');
    console.log('   ✅ Google Play génère les APK optimisés pour chaque appareil');
    console.log('   ✅ Prêt pour upload sur Play Console\n');
    console.log('📤 Pour uploader sur Play Console :');
    console.log('   1. Allez sur https://play.google.com/console');
    console.log('   2. Sélectionnez votre app "CEN Corse"');
    console.log('   3. Production → Créer une nouvelle version');
    console.log('   4. Uploadez app-release.aab\n');
  } else {
    console.error('❌ L\'AAB n\'a pas été généré. Vérifiez les erreurs ci-dessus.');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Erreur lors de la génération de l\'AAB :');
  console.error('   ', error.message);
  console.error('\n💡 Solutions possibles :');
  console.error('   1. Installez Android Studio et configurez Gradle');
  console.error('   2. Vérifiez que le keystore est configuré dans keystore.properties');
  console.error('   3. Ou utilisez PWA Builder (plus simple) :');
  console.error('      - Déployez votre app sur Vercel');
  console.error('      - Allez sur https://www.pwabuilder.com/');
  console.error('      - Entrez votre URL Vercel');
  console.error('      - Téléchargez l\'AAB\n');
  process.exit(1);
}
