# Comment l’icône de l’app Android est choisie

## 1. Ce que dit le Manifest

Dans `AndroidManifest.xml` :
- **android:icon="@mipmap/ic_launcher"** → icône principale
- **android:roundIcon="@mipmap/ic_launcher_round"** → icône ronde (certains launchers)

Android utilise ces deux références. Le **téléphone** ne choisit pas une icône au hasard : il suit cette config.

---

## 2. Selon la version d’Android (API)

- **Android 8.0+ (API 26+)** : le système utilise l’**icône adaptive**.
  - Fichiers : `res/mipmap-anydpi-v26/ic_launcher.xml` et `ic_launcher_round.xml`
  - Ils déclarent :
    - **background** : `@color/ic_launcher_background` → couleur dans `res/values/ic_launcher_background.xml` (**#1e3a8a** = bleu CEN Corse)
    - **foreground** : `@mipmap/ic_launcher_foreground` → image du logo (PNG dans les dossiers mipmap-*)

- **Android &lt; 8** : le système utilise les **icônes classiques** :
  - `ic_launcher.png` et `ic_launcher_round.png` dans chaque dossier de densité (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, ldpi).

Ton **Pixel 7a** est en API 26+, donc c’est toujours l’icône **adaptive** (fond + premier plan) qui est utilisée.

---

## 3. Choix de la densité (selon le téléphone)

Android choisit **automatiquement** la bonne densité selon l’écran du téléphone :

| Dossier        | Densité | Exemple d’appareil        |
|----------------|---------|---------------------------|
| mipmap-ldpi    | ~120 dpi| Très vieux / petits écrans |
| mipmap-mdpi    | ~160 dpi| Écrans basse densité      |
| mipmap-hdpi    | ~240 dpi| Écrans moyenne densité    |
| mipmap-xhdpi   | ~320 dpi| Écrans haute densité      |
| mipmap-xxhdpi  | ~480 dpi| Très haute densité        |
| mipmap-xxxhdpi | ~640 dpi| Très haute densité (ex. Pixel) |

Sur un **Pixel 7a**, Android prend en général les ressources dans **xxhdpi** ou **xxxhdpi** pour l’icône. Tu n’as rien à configurer : le bon dossier est choisi selon la densité de l’écran.

---

## 4. Source des icônes : uniquement les mipmap

**L’app ne charge pas `logo_pwa_format.png`.** Elle utilise uniquement les PNG déjà présents dans :

- `res/mipmap-anydpi-v26/` (ic_launcher.xml, ic_launcher_round.xml + ic_launcher_foreground.png)
- `res/mipmap-mdpi/`, `mipmap-hdpi/`, `mipmap-xhdpi/`, `mipmap-xxhdpi/`, `mipmap-xxxhdpi/` (et éventuellement `mipmap-ldpi/`)

Ces fichiers sont la **source de vérité** pour l’icône. Pour changer l’icône, il faut **remplacer ces PNG** (par ex. export easyappicon, ou fichiers fournis par un graphiste). Le build **ne régénère pas** les icônes à partir de `logo_pwa_format.png`.

- **Fond** : `res/values/ic_launcher_background.xml` → **#1e3a8a** (bleu CEN Corse).
- **Premier plan (logo)** : **ic_launcher_foreground.png** dans chaque dossier mipmap ci‑dessus.

---

## 5. Changer l’icône

1. Obtenir ou générer les PNG pour toutes les densités (ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png dans mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, et anydpi-v26 pour les XML + un foreground).
2. Copier ces fichiers dans `android/app/src/main/res/` (en écrasant les mipmap-* existants).
3. Refaire le build (APK/AAB). Aucun script ne régénère les icônes pendant le build.
