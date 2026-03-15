# Configuration de la connexion Google (Supabase)

Ce guide détaille comment activer la connexion avec un compte Google sur la page d'authentification de l'application.

**Contexte :** l'app est une application **Android** (Capacitor) et **iOS** (Apple) prévue prochainement. La connexion Google passe par Supabase : on utilise donc un client OAuth de type **Application Web** (callback Supabase), pas un client « Android » ou « iOS » natif.

**Ton app Android n’est pas hébergée sur Vercel.**  
L’APK que tu installes sur le téléphone charge les fichiers depuis le téléphone (bundle local). Rien n’est « sur Vercel » à ce moment-là.  
On parle d’une **URL / domaine** pour une seule raison : **après** que l’utilisateur a cliqué sur « Continuer avec Google », le navigateur est redirigé par Google puis par Supabase vers **une adresse web réelle** (obligatoirement en `https://...`). Cette adresse doit exister quelque part sur internet : une page qui reçoit le code, appelle Supabase pour créer la session, puis redirige (vers l’app ou la home).  
Donc soit tu as **déjà** une version de ton app déployée quelque part (Vercel, Netlify, ton serveur) — et tu utilises cette URL comme « domaine » pour la redirection ; soit tu **ne déploies nulle part** et dans ce cas il faut au moins déployer une fois (par ex. sur Vercel en gratuit) pour avoir cette page `/auth/callback` accessible en HTTPS. Ce n’est pas « héberger l’app Android », c’est héberger une page web qui sert uniquement à ce retour après connexion Google (et éventuellement à tes appels API en mode Capacitor, voir `src/lib/api-config.ts`).

---

**Pour les apps distribuées uniquement via le Play Store (pas de site web)**  
Tu poses ton APK sur le Play Store, les utilisateurs téléchargent l'app depuis le Play Store. Le Play Store ne fournit **aucune URL** : il ne fait que distribuer le fichier. **D'où viendrait l'URL pour la connexion Google ?** De nulle part automatiquement. Pour que le bouton « Continuer avec Google » fonctionne, après la connexion sur Google le navigateur doit être redirigé vers **une page web réelle** en `https://...` (exigence OAuth). Cette page reçoit un code, l'échange contre une session Supabase, puis redirige. Donc **il faut qu'une telle page existe sur internet**. La seule façon : **toi** tu déploies ton app (ou au moins la route `/auth/callback`) **une fois** quelque part — par ex. Vercel (gratuit), Netlify, ou ton propre serveur. Tu obtiens alors une URL (ex. `https://ton-projet.vercel.app`) ; c'est **cette URL** que tu indiques dans Supabase (Redirect URLs). **En résumé : le Play Store distribue l'APK uniquement. L'URL pour la connexion Google, tu la crées en déployant ton app (ou une version minimale) une fois sur un hébergeur web.** Si tu ne déploies nulle part, tu n'as pas d'URL et la connexion Google depuis l'app ne pourra pas aboutir (sauf à utiliser un autre flux, ex. Google Sign-In natif, plus complexe).

---

## 1. Créer un projet et des identifiants Google

### 1.1 Accéder à la Google Cloud Console

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Connecte-toi avec ton compte Google.
3. En haut à gauche, clique sur le sélecteur de projet → **Nouveau projet**.
4. Donne un nom (ex. `CEN Corse App`) et valide.

### 1.2 Activer l'API et configurer l'écran de consentement OAuth

1. Dans le menu gauche : **APIs et services** → **Identifiants**.
2. Onglet **Écran de consentement OAuth** :
   - Type d'application : **Externe** (ou Interne si tu es en Google Workspace).
   - Renseigne **Nom de l'application** (ex. « CEN Corse »), **E-mail d'assistance**, **Domaine de l'application** (optionnel en dev).
   - Section **Champs d'application** : garde les champs par défaut (`.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`). Ajoute `openid` s'il n'est pas listé.
   - Enregistre et continue jusqu'à l'écran de résumé.

### 1.3 Créer les identifiants OAuth 2.0 (Application Web)

Même pour une app **Android** (et plus tard **Apple**), on crée un client **Application Web** : le flux OAuth passe par le serveur Supabase, qui reçoit le callback de Google sur une URL web. Un client « Android » ou « iOS » dans Google serait utilisé uniquement pour un SDK natif (ex. Google Sign-In Android/iOS), ce que Supabase n’utilise pas ici.

1. **APIs et services** → **Identifiants** → **Créer des identifiants** → **ID client OAuth**.
2. Type d'application : **Application Web** (obligatoire pour le callback Supabase).
3. Nom : ex. « CEN Corse – Web (Android / iOS via Supabase) ».
4. **URI de redirection autorisés** :  
   Tu les ajouteras **après** avoir récupéré l'URL dans Supabase (étape 2.2).  
   Pour l'instant, note bien cette page : tu y reviendras.
5. Clique sur **Créer**.
6. Note **ID client** et **Secret client** (tu en auras besoin dans Supabase).

---

## 2. Configurer Supabase

### 2.1 Activer le fournisseur Google

1. Ouvre ton projet sur [Supabase Dashboard](https://app.supabase.com/).
2. Menu gauche : **Authentication** → **Providers**.
3. Clique sur **Google**.
4. Active le fournisseur avec le bouton **Enable**.
5. Colle :
   - **Client ID** : l'ID client copié depuis Google Cloud Console.
   - **Client Secret** : le secret client copié depuis Google Cloud Console.
6. Enregistre (**Save**).

### 2.2 Récupérer l'URL de redirection Supabase (pour Google)

1. Toujours dans **Authentication** → **Providers** → **Google**.
2. Supabase affiche une URL du type :  
   `https://<TON-PROJECT-REF>.supabase.co/auth/v1/callback`
3. **Copie cette URL** : c'est celle que tu dois déclarer dans Google comme URI de redirection autorisée.

### 2.3 Revenir dans Google et ajouter l'URI de redirection

1. Retourne dans [Google Cloud Console](https://console.cloud.google.com/) → **Identifiants** → ton **ID client OAuth 2.0**.
2. Dans **URI de redirection autorisés**, clique **Ajouter un URI**.
3. Colle exactement :  
   `https://<TON-PROJECT-REF>.supabase.co/auth/v1/callback`  
   (la même que dans Supabase, sans espace ni slash en trop).
4. Enregistre (**Enregistrer**).

### 2.4 Redirect URLs dans Supabase (où ton app renvoie après connexion)

**Où trouver « ton domaine » ?**  
- **En dev (navigateur)** : l’URL où tu ouvres l’app, en général `http://localhost:3000`.  
- **En prod / app Android** : ce n’est **pas** l’endroit où « l’app est hébergée » (l’APK tourne en local). C’est l’URL **d’une version web** de ton app (ou d’une page dédiée) accessible en HTTPS, utilisée pour :  
  1) la **redirection après Google** (Supabase redirige le navigateur vers `https://.../auth/callback`) ;  
  2) éventuellement les **appels API** depuis l’app Capacitor (voir `src/lib/api-config.ts`).  
  Si tu as déjà déployé le projet sur Vercel / Netlify / ton serveur, utilise cette URL (ex. `https://cen-corse-app.vercel.app`). Si tu ne déploies nulle part : il faut déployer au moins une fois (ex. Vercel gratuit) pour avoir une URL HTTPS à mettre dans Supabase ; ça ne remplace pas ton APK, ça sert uniquement à cette redirection (et aux API si tu en utilises).
- **Sur Android** : on utilise la même URL HTTPS que ci‑dessus pour la redirection (le navigateur doit ouvrir une vraie page web).

1. Dans Supabase : **Authentication** → **URL Configuration**.
2. Section **Redirect URLs**.
3. Ajoute les URLs de **ton application** (pas celle de Google) :
   - En local (dev navigateur / émulateur) :  
     `http://localhost:3000/auth/callback`
   - En production (site web ou domaine utilisé par l’app Capacitor) :  
     `https://cen-corse-app.vercel.app/auth/callback`  
     (c’est l’URL de ce projet ; remplace si tu utilises un autre domaine).
   - Sur **Android** (Capacitor) : l’app ouvre en général un navigateur ou WebView qui utilise la même origine que ton front (donc la même URL que ci‑dessus). Aucun client OAuth « Android » à créer dans Google pour ce flux.
   - Sur **iOS** (plus tard) : idem, le flux passe par l’URL web de ton app ; pas de client « iOS » nécessaire pour Supabase.
4. Clique **Add URL** pour chacune, puis **Save**.

---

## 2.5 Apps mobiles Android / iOS

- **Android (Capacitor)** : au clic sur « Continuer avec Google », l’app ouvre le navigateur système ou un WebView, qui va vers Supabase puis Google, puis revient sur ton URL (ex. `https://cen-corse-app.vercel.app/auth/callback`). Cette URL doit être dans les **Redirect URLs** Supabase. Aucun identifiant OAuth de type « Android » n’est nécessaire dans Google pour ce flux.
- **iOS (à venir)** : même principe avec le navigateur ou Safari ; même Redirect URL. Pas de client « iOS » à créer pour Supabase.
- Si tu veux plus tard une expérience 100 % native (sans ouvrir le navigateur), il faudrait un autre flux (ex. Google Sign-In SDK) et éventuellement des clients Android / iOS dans Google ; ce guide couvre uniquement le flux Supabase actuel.

---

## 3. Récapitulatif des URLs

| Rôle | URL | Où la configurer |
|------|-----|-------------------|
| Redirection **Google → Supabase** | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` | Google Cloud Console → Identifiants → ID client OAuth → URI de redirection autorisés |
| Redirection **Supabase → ton app** | `http://localhost:3000/auth/callback` (dev) | Supabase → Authentication → URL Configuration → Redirect URLs |
| Redirection **Supabase → ton app** | `https://cen-corse-app.vercel.app/auth/callback` (prod / Android) | Idem (remplace par ton domaine si différent) |

---

## 4. Flux côté application (déjà en place)

1. L'utilisateur clique sur **« Continuer avec Google »** sur `/auth`.
2. L'app appelle `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback' } })`.
3. Supabase renvoie une URL vers Google ; l'app redirige le navigateur vers cette URL.
4. L'utilisateur se connecte (ou choisit un compte) sur Google.
5. Google redirige vers `https://<PROJECT_REF>.supabase.co/auth/v1/callback?...`.
6. Supabase échange le code contre une session et redirige vers la **Redirect URL** configurée, par ex. `https://cen-corse-app.vercel.app/auth/callback?code=...`.
7. La page `/auth/callback` de l'app appelle `exchangeCodeForSession(code)` puis redirige vers `/` (accueil).

---

## 5. Vérifications en cas de problème

**« J'ai mis `http://localhost:3000/auth/callback` et ça ne fonctionne pas »**

1. **Où tu testes ?**  
   - Si tu testes dans le **navigateur** sur ton PC (http://localhost:3000) : ça peut marcher. Vérifie les points ci-dessous.  
   - Si tu testes dans **l'app Android** (APK ou émulateur) : `localhost` sur le téléphone ne pointe pas vers ton PC. Supabase va rediriger vers `http://localhost:3000/...` mais le navigateur du téléphone ouvrira *son* localhost (vide). Il faut soit tester la connexion Google dans le navigateur sur ton PC, soit déployer (ex. Vercel) et utiliser l’URL de prod dans Supabase.

2. **Supabase – URL Configuration**  
   - **Redirect URLs** : ajoute **exactement** `http://localhost:3000/auth/callback` (sans slash final, pas de `https`, port 3000). Clique **Add** puis **Save**.  
   - **Site URL** : mets `http://localhost:3000` quand tu testes en local (Authentication → URL Configuration). Certains flux en dépendent.

3. **Google (Provider)**  
   - Dans Supabase, le fournisseur **Google** est activé avec un **Client ID** et **Secret** valides (récupérés depuis Google Cloud Console).  
   - Dans Google Cloud Console, l’URI de redirection est bien celle **Supabase** : `https://<TON-PROJECT-REF>.supabase.co/auth/v1/callback` (pas localhost dans Google).

4. **Erreur affichée**  
   - Si tu vois « redirect_uri_mismatch » : l’URI dans Google ne correspond pas à celle de Supabase (voir § 2.2 / 2.3).  
   - Si tu vois un message Supabase du type « URL not allowed » : l’URL exacte utilisée par l’app (ex. `http://localhost:3000/auth/callback`) doit être dans la liste **Redirect URLs** sans faute de frappe.

---

- **« redirect_uri_mismatch »**  
  L'URI dans Google Cloud Console n'est pas exactement celle affichée dans Supabase (Provider Google). Recopie-la sans rien modifier.

- **« Connexion Google annulée ou indisponible »**  
  Vérifie que le fournisseur Google est bien activé dans Supabase et que Client ID / Secret sont corrects. Vérifie aussi que l'écran de consentement OAuth est en état « Publié » ou « Test » avec ton adresse en testeur si en mode Test.

- **Boucle ou page blanche après Google**  
  Vérifie que l'URL de ton app (`http://localhost:3000/auth/callback` ou `https://cen-corse-app.vercel.app/auth/callback`) est bien dans **Redirect URLs** (Supabase → URL Configuration).

- **En local avec `http://localhost:3000`**  
  Si tu utilises un autre port, ajoute la même URL avec ce port dans Redirect URLs (ex. `http://localhost:3001/auth/callback`).

---

## 6. Fichiers concernés dans le projet

- **`src/contexts/AuthContext.tsx`** : `signInWithGoogle()` et exposition dans le contexte.
- **`src/components/auth/LoginForm.tsx`** : bouton « Continuer avec Google » en premier, puis « ou avec email », puis formulaire email/mot de passe, puis lien « Créer un compte ».
- **`src/app/auth/callback/page.tsx`** : échange du `code` via `exchangeCodeForSession` puis redirection vers `/`.

Une fois les étapes 1 à 2 effectuées (Google + Supabase + Redirect URLs), la connexion Google est opérationnelle.
