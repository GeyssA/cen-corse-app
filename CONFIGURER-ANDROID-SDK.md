# Configurer l’Android SDK pour générer l’APK

Java (Eclipse Temurin) et Gradle sont déjà OK. Il manque **l’Android SDK** pour pouvoir builder l’APK.

## Option 1 : Installer Android Studio (recommandé)

1. Téléchargez **Android Studio** : https://developer.android.com/studio  
2. Installez-le (l’installation met aussi l’Android SDK en place).  
3. Au premier lancement, terminez l’assistant d’installation (installation du SDK si demandé).  
4. Le SDK est en général ici :  
   `C:\Users\VOTRE_NOM\AppData\Local\Android\Sdk`  
   (remplacez `VOTRE_NOM` par votre nom d’utilisateur Windows).

Ensuite, créez le fichier `deploy/android/local.properties` avec une seule ligne :

```text
sdk.dir=C:\\Users\\VOTRE_NOM\\AppData\\Local\\Android\\Sdk
```

Remplacez `VOTRE_NOM` par votre nom d’utilisateur (ex. `arnau`).  
Utilisez des **double backslashes** `\\` comme ci‑dessus.

## Option 2 : Variable d’environnement ANDROID_HOME

1. Installez Android Studio (ou uniquement les “Command line tools” Android).  
2. Dans **Paramètres Windows** → **Variables d’environnement**, ajoutez :  
   - **ANDROID_HOME** = `C:\Users\VOTRE_NOM\AppData\Local\Android\Sdk`  
3. Redémarrez le terminal / Cursor.

Le script de build pourra alors utiliser ANDROID_HOME pour générer `local.properties` automatiquement.

## Générer l’APK après configuration du SDK

Dans un terminal (depuis la racine du projet) :

```bash
cd deploy
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
cd android
gradlew.bat assembleRelease
copy app\build\outputs\apk\release\app-release.apk ..\bundle-for-phone\app-release.apk
```

Ou double‑cliquez sur `deploy\generer-apk-apres-java.bat` après avoir défini **ANDROID_HOME** (ou créé `local.properties` comme ci‑dessus).

L’APK avec le favicon **playstore-icon.png** sera dans `deploy\bundle-for-phone\app-release.apk`.
