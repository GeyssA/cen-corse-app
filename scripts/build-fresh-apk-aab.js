/**
 * Génère des APK et AAB à jour (contenu actuel du projet, icône playstore-icon.png).
 * Nécessite : Java JDK installé et JAVA_HOME configuré (ou Android Studio avec son JBR).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');

// Chemins courants du JDK / JBR sur Windows
const possibleJavaPaths = [
  process.env.JAVA_HOME,
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Eclipse Adoptium', 'jdk-17.0.13.11-hotspot'),
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr'),
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Eclipse Adoptium', 'jdk-17.0.13.11-hotspot'),
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Java', 'jdk-17'),
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Java', 'jdk-21'),
  path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft', 'jdk-17.0.13.11'),
].filter(Boolean);

function findJavaHome() {
  if (process.env.JAVA_HOME) {
    const javaExe = path.join(process.env.JAVA_HOME, 'bin', 'java.exe');
    if (fs.existsSync(javaExe)) return process.env.JAVA_HOME;
  }
  for (const p of possibleJavaPaths) {
    if (!p || !fs.existsSync(p)) continue;
    const javaExe = path.join(p, 'bin', 'java.exe');
    if (fs.existsSync(javaExe)) return p;
  }
  // Dernier recours : dossiers Java dans Program Files
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  try {
    const dirs = fs.readdirSync(path.join(programFiles, 'Java'), { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const full = path.join(programFiles, 'Java', d.name);
      if (fs.existsSync(path.join(full, 'bin', 'java.exe'))) return full;
    }
  } catch (e) {}
  try {
    const asPath = path.join(programFiles, 'Android', 'Android Studio', 'jbr');
    if (fs.existsSync(path.join(asPath, 'bin', 'java.exe'))) return asPath;
  } catch (e) {}
  return null;
}

function run(cmd, opts = {}) {
  console.log('>', cmd);
  return execSync(cmd, { stdio: 'inherit', shell: true, cwd: opts.cwd || projectRoot, ...opts });
}

console.log('Build complet : contenu actualise (APK + AAB)\n');

const javaHome = findJavaHome();
if (!javaHome) {
  console.error('Java JDK introuvable.\n');
  console.error('Installez un JDK 17+ puis configurez JAVA_HOME :');
  console.error('  1. Télécharger : https://adoptium.net/ (Eclipse Temurin)');
  console.error('  2. Installer le JDK');
  console.error('  3. Variable d\'environnement JAVA_HOME = chemin du JDK (ex: C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.13.11-hotspot)');
  console.error('  4. Redémarrer le terminal et relancer : node scripts/build-fresh-apk-aab.js\n');
  process.exit(1);
}

process.env.JAVA_HOME = javaHome;
console.log('JAVA_HOME =', javaHome, '\n');

console.log('Etape 1/2 : Build Capacitor (Next.js + icones Android avec logo_pwa_format.png)...\n');
try {
  run('node scripts/prepare-capacitor-build.js');
  run('node scripts/inject-capacitor-fixes.js');
  run('npx cross-env CAPACITOR_BUILD=true npm run build', { env: { ...process.env, CAPACITOR_BUILD: 'true' } });
  run('node scripts/restore-api-routes.js');
  run('node scripts/revert-capacitor-fixes.js');
  // Icônes : on utilise les assets EasyAppIcon (déjà copiés dans res/mipmap-*). Pour regénérer depuis logo_pwa_format.png, décommenter :
  // run('node scripts/update-android-icon.js');
  run('npx cap sync android');
} catch (e) {
  console.error('Erreur build Capacitor:', e.message);
  process.exit(1);
}

console.log('\nEtape 2/2 : Clean + Generation APK et AAB...\n');
try {
  run('gradlew.bat clean', { cwd: androidDir });
  run('gradlew.bat assembleRelease bundleRelease', { cwd: androidDir });
} catch (e) {
  console.error('Erreur Gradle:', e.message);
  process.exit(1);
}

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const aabPath = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const bundleDir = path.join(projectRoot, 'bundle-for-phone');

if (!fs.existsSync(apkPath) || !fs.existsSync(aabPath)) {
  console.error('APK ou AAB non generes.');
  process.exit(1);
}

if (!fs.existsSync(bundleDir)) fs.mkdirSync(bundleDir, { recursive: true });
fs.copyFileSync(apkPath, path.join(bundleDir, 'app-release.apk'));
fs.copyFileSync(aabPath, path.join(bundleDir, 'app-release.aab'));

console.log('\nOK. Fichiers a jour dans deploy/bundle-for-phone/ :');
console.log('  - app-release.apk');
console.log('  - app-release.aab');
console.log('\nContenu actualise (icone logo_pwa_format.png, code actuel).\n');
