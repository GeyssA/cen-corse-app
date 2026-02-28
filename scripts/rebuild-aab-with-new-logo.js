const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Rebuild de l\'AAB avec le nouveau logo logo_pwa_format.png...\n');

const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const aabPath = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const bundleDir = path.join(projectRoot, 'bundle-for-phone');

console.log('📋 Étapes :');
console.log('   1. Build Capacitor (avec logo_pwa_format.png)');
console.log('   2. Génération de l\'AAB');
console.log('   3. Copie dans bundle-for-phone\n');

console.log('⚠️  Note : Cette opération nécessite :');
console.log('   - Java JDK installé et configuré');
console.log('   - Android SDK configuré');
console.log('   - Gradle disponible\n');

console.log('💡 Si vous avez des erreurs, vous pouvez :');
console.log('   1. Utiliser Android Studio pour générer l\'AAB');
console.log('   2. Ou utiliser PWA Builder (plus simple) : https://www.pwabuilder.com/\n');

try {
  console.log('🔨 Étape 1/2 : Build Capacitor...\n');
  execSync('npm run build:capacitor', { 
    cwd: projectRoot, 
    stdio: 'inherit',
    shell: true
  });
  
  console.log('\n🔨 Étape 2/2 : Génération de l\'AAB...\n');
  execSync('gradlew bundleRelease', { 
    cwd: androidDir, 
    stdio: 'inherit',
    shell: true
  });
  
  if (fs.existsSync(aabPath)) {
    const stats = fs.statSync(aabPath);
    console.log('\n✅ AAB généré avec succès !');
    console.log('   Emplacement :', aabPath);
    console.log('   Taille :', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('   Date :', stats.mtime.toLocaleString(), '\n');
    
    // Copier l'AAB dans le bundle
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true });
    }
    const destAab = path.join(bundleDir, 'app-release.aab');
    fs.copyFileSync(aabPath, destAab);
    console.log('✅ AAB copié dans bundle-for-phone/app-release.aab\n');
    console.log('📱 Le nouveau logo logo_pwa_format.png est maintenant dans l\'AAB !\n');
  } else {
    console.error('❌ L\'AAB n\'a pas été généré. Vérifiez les erreurs ci-dessus.');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Erreur lors du rebuild :');
  console.error('   ', error.message);
  console.error('\n💡 Solutions :');
  console.error('   1. Vérifiez que Java et Android SDK sont installés');
  console.error('   2. Utilisez Android Studio : File > Build > Generate Signed Bundle / APK');
  console.error('   3. Ou utilisez PWA Builder : https://www.pwabuilder.com/\n');
  process.exit(1);
}
