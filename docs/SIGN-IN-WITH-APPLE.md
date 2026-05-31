# Activer "Se connecter avec Apple" (Supabase + App iOS)

Ce projet est déjà câblé côté code pour l’OAuth Apple (comme Google), avec le même flux Capacitor/deep-link.

## 1) Côté Apple Developer

1. Ouvre **Apple Developer** > **Certificates, IDs & Profiles**.
2. Dans **Identifiers**, vérifie ton App ID (`com.cencorse.app`) et active la capability **Sign In with Apple**.
3. Crée un **Service ID** (ex: `com.cencorse.app.web`) :
   - Active **Sign In with Apple**.
   - Configure le domaine + redirect URL Supabase :
     - Domaine : ton projet Supabase (`<project-ref>.supabase.co`)
     - Redirect URL : `https://<project-ref>.supabase.co/auth/v1/callback`
4. Crée une **Key** de type **Sign in with Apple**.
   - Note bien : `Key ID`
   - Note le `Team ID`
   - Télécharge le fichier `.p8` (une seule fois).

## 2) Côté Supabase (Auth > Providers > Apple)

Renseigne :
- **Client ID** = Service ID Apple (ex `com.cencorse.app.web`)
- **Secret Key** = contenu de la clé `.p8` (ou secret généré selon UI Supabase)
- **Key ID** = Apple Key ID
- **Team ID** = Apple Team ID

Et dans **Auth > URL Configuration** :
- Ajouter `cencorse://auth/callback` dans **Redirect URLs**
- Garder aussi l’URL web callback si nécessaire (`https://.../auth/callback`)

## 3) Côté iOS (Xcode)

1. `npx cap open ios`
2. Dans **Signing & Capabilities**, ajouter **Sign In with Apple**.
3. Vérifier le **Bundle Identifier** = `com.cencorse.app`.
4. Build + run sur device iOS.

## 4) Vérification

- Sur l’écran login, bouton **Continuer avec Apple**.
- En iOS natif : ouverture navigateur système, puis retour app via `cencorse://auth/callback`.
- Après retour : session créée + redirection vers `/`.

## Notes

- Apple impose généralement Sign in with Apple si tu proposes d’autres SSO tiers (Google, etc.) pour l’app iOS.
- Le nom/email Apple peuvent être masqués selon le choix utilisateur ("Hide My Email").
