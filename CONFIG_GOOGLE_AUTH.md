# Configurer la connexion Google

Le bouton « Continuer avec Google » utilise Supabase Auth (OAuth). Pour qu’il fonctionne, il faut :

1. **Créer des identifiants Google (Google Cloud Console)**  
2. **Activer le provider Google dans Supabase** et y coller ces identifiants.

---

## 1. Google Cloud Console – identifiants OAuth

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Crée un projet ou sélectionne un projet existant.
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. Si demandé, configure l’**écran de consentement OAuth** (type « Externe », nom de l’app, email de support, etc.).
5. Type d’application : **Web application**.
6. **Authorized redirect URIs** : ajoute l’URL de callback Supabase :
   ```
   https://<TON_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   Remplace `<TON_PROJECT_REF>` par l’identifiant de ton projet Supabase (ex. `abcdefghijklmnop` dans `https://abcdefghijklmnop.supabase.co`).
7. Sauvegarde. Note le **Client ID** et le **Client Secret**.

---

## 2. Supabase – activer Google

1. Ouvre ton projet sur [Supabase Dashboard](https://supabase.com/dashboard).
2. **Authentication** → **Providers** → **Google**.
3. Active **Enable Sign in with Google**.
4. Colle le **Client ID** et le **Client Secret** obtenus à l’étape 1.
5. Sauvegarde.

---

## 3. Où mettre quelle URL (dev vs production)

### Côté Google Cloud Console

- **Authorized redirect URIs** : une seule URL, **toujours** celle de Supabase (dev et prod) :
  ```
  https://<TON_PROJECT_REF>.supabase.co/auth/v1/callback
  ```
  Tu ne mets **pas** l’URL de ton app ici : Google redirige vers Supabase, pas vers ton site.

- **Authorized JavaScript origins** (recommandé) : ajoute les origines depuis lesquelles l’utilisateur peut lancer la connexion Google :
  - `http://localhost:3000` (dev)
  - `https://ton-domaine.com` (production, sans slash final ; avec `www` si tu l’utilises : `https://www.ton-domaine.com`)

### Côté Supabase (le plus souvent oublié en prod)

C’est **Supabase** qui redirige l’utilisateur vers ton app après Google. Il n’accepte que les URLs que tu as autorisées.

1. Dashboard Supabase → **Authentication** → **URL Configuration** (ou **Project Settings** → **Auth** selon l’interface).
2. **Site URL** : mets l’URL de ton app en production, ex. `https://ton-domaine.com`.
3. **Redirect URLs** : liste des URLs autorisées. Ajoute au minimum :
   - `http://localhost:3000/auth/callback`
   - `https://ton-domaine.com/auth/callback`
   - **`https://ton-domaine.com/auth/callback/app`** ← retour OAuth **app** (obligatoire pour le Play Store).
   - **`https://ton-domaine.com/auth/callback/app?app_oauth=1`** ← même URL avec paramètre (utilisée par l’APK) ; ajoute-la si Supabase exige l’URL exacte.
   (remplace `ton-domaine.com` par ton domaine Vercel, ex. `cen-corse-app.vercel.app`.)

Sans l’URL de production dans **Redirect URLs**, Supabase refusera la redirection après connexion Google en prod.

---

## 5. App Android (Play Store) — flux actuel

1. **Supabase** → **Redirect URLs** : inclure **`cencorse://auth/callback`** (retour PKCE après Google). Garde aussi les URLs `https://…/auth/callback` pour le web.
2. Connexion Google : **Chrome Custom Tabs** (`@capacitor/browser`), pas la WebView (sinon erreur Google **403 disallowed_useragent**).
3. Après mise à jour : `npm install`, `npx cap sync android`, rebuild APK / AAB.
4. **Android** : schéma `cencorse` dans le manifest — ne pas retirer.

---

## 6. Google OAuth sur Android — WebView interdite (erreur 403 `disallowed_useragent`)

Google **refuse** la connexion dans une WebView intégrée. L’app utilise **Chrome Custom Tabs** (`@capacitor/browser`) + retour **`cencorse://auth/callback`** (deep link avec le `code` PKCE).

Dans **Supabase** → **Redirect URLs**, ajoute obligatoirement :

`cencorse://auth/callback`

(sans autre chemin — c’est ce que le code envoie comme `redirectTo` depuis l’APK.)

---

## 7. Option 1 — `allowNavigation` (navigation dans la WebView)

Dans `capacitor.config.ts`, **`server.allowNavigation`** liste les **noms d’hôte (sans `https://`)** autorisés dans la WebView. Capacitor construit un masque sur les segments de domaine ; si tu mets `https://accounts.google.com`, le masque est **invalide** et **Chrome s’ouvre quand même**.

Exemple correct : `accounts.google.com`, `*.google.com`, `cen-corse-app.vercel.app`, `*.supabase.co`.

Après modification : `npx cap sync android` puis rebuild de l’APK / AAB.

Si l’utilisateur ouvre encore Chrome (ancienne build), le flux **deep link** (`cencorse://`) reste disponible en secours.

---

## 4. Tester

1. Lance l’app (`npm run dev`).
2. Va sur la page de connexion et clique sur **Continuer avec Google**.
3. Tu dois être redirigé vers Google, puis après connexion vers `/auth/callback`, puis vers l’accueil de l’app.

Si ça ne marche pas :

- **En prod** : vérifie que l’URL `https://ton-domaine.com/auth/callback` est bien dans **Supabase** → Authentication → URL Configuration → **Redirect URLs**.
- Dans **Google** : redirect URI = uniquement `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (sans slash final) ; ajoute ton domaine en **Authorized JavaScript origins**.
- Vérifie que le provider Google est activé et que Client ID / Secret sont corrects dans Supabase.
