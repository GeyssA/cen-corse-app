# Bundle - Icône playstore-icon.png

## Icône d'application

L'icône utilisée comme favicon / icône Android est : **`playstore-icon.png`**

## Tester le logo sans réinstaller

1. Ouvrez un terminal dans ce dossier
2. Lancez `serve-local.bat` (Windows) ou `./serve-local.sh` (Mac/Linux)
3. Sur votre téléphone (même WiFi), ouvrez `http://VOTRE_IP_PC:8000`
4. Dans le navigateur : « Ajouter à l’écran d’accueil »
5. Vérifiez que l’icône **playstore-icon.png** s’affiche correctement

## Fichiers inclus

- **public/** : tous les assets dont `playstore-icon.png`, `manifest.json` (icône = playstore-icon.png)
- **app-release.aab** : pour Play Store (icône actuelle = ancienne ; pour la nouvelle, il faut rebuild)
- **app-release.apk** : si présent, pour installer sur téléphone (idem, rebuild pour nouvelle icône)

## Pour avoir playstore-icon.png dans l’APK/AAB installé

Il faut regénérer le build Android :

```bash
cd deploy
npm run build:capacitor
cd android
gradlew assembleRelease
```

Puis copier `android/app/build/outputs/apk/release/app-release.apk` ici (ou utiliser `node scripts/build-apk-for-phone.js` si Java est configuré).
