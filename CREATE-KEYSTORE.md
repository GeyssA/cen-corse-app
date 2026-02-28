# Créer le Keystore pour Google Play Console

## ⚠️ Problème Actuel

Votre nouveau .AAB est signé avec une clé différente. Google Play Console attend le SHA1 : 
**`16:C1:2B:D0:C0:69:6B:F9:0E:BF:98:63:EE:ED:F1:F4:5F:93:99:3E`**

## ✅ Solution : Créer un Nouveau Keystore

### Option 1 : Si vous avez l'ancien keystore

1. **Trouvez votre ancien keystore** (fichier `.jks` ou `.keystore`)
2. Vérifiez son SHA1 :
   ```bash
   keytool -list -v -keystore votre-keystore.jks -alias votre-alias
   ```
3. Si le SHA1 correspond, utilisez-le pour signer votre nouveau .AAB

### Option 2 : Créer un nouveau keystore (si nouvelle app ou keystore perdu)

**⚠️ ATTENTION** : Si vous créez un nouveau keystore pour une app EXISTANTE sur Play Console, vous devrez :
- Soit supprimer l'app et en créer une nouvelle
- Soit contacter le support Google Play pour réinitialiser la clé

#### Étapes :

1. **Créer le keystore** :
   ```bash
   cd android/app
   keytool -genkey -v -keystore cencorse-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cencorse
   ```

2. **Remplir les informations** :
   - Nom et prénom : CEN Corse
   - Organisation : CEN Corse
   - Ville : [Votre ville]
   - État : Corse
   - Code pays : FR

3. **Sauvegardez précieusement** :
   - Le fichier `cencorse-release-key.jks`
   - Le mot de passe du store
   - Le mot de passe de la clé
   - L'alias (probablement `cencorse`)

4. **Vérifier le SHA1** :
   ```bash
   keytool -list -v -keystore cencorse-release-key.jks -alias cencorse
   ```

5. **Créer `android/keystore.properties`** :
   ```
   storeFile=../app/cencorse-release-key.jks
   storePassword=VOTRE_MOT_DE_PASSE_STORE
   keyAlias=cencorse
   keyPassword=VOTRE_MOT_DE_PASSE_KEY
   ```

6. **Configurer `android/app/build.gradle`** (déjà fait si vous suivez les instructions)

7. **Build l'AAB signé** :
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

8. **Le .AAB sera dans** :
   `android/app/build/outputs/bundle/release/app-release.aab`

## 📱 Upload sur Play Console

1. Allez sur https://play.google.com/console
2. Sélectionnez votre app
3. Production > Créer une nouvelle version
4. Upload le fichier `.aab`
5. Si le SHA1 correspond, ça fonctionnera !

## 🔐 Sécurité

**JAMAIS dans git** :
- ❌ `keystore.properties`
- ❌ `*.jks`
- ❌ `*.keystore`

**Ajoutez dans `.gitignore`** :
```
*.jks
*.keystore
keystore.properties
```










