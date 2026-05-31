# iOS sans Mac local : connexion à distance, simulateur, TestFlight

## 1) Se connecter à un Mac à distance (pour Xcode / build iOS)

Tu as besoin d’un **Mac** (physique ou loué) pour **Xcode**, **Archive** et **upload** vers App Store Connect. Options courantes :

### A. Service « Mac dans le cloud » (le plus simple pour débuter)

Fournisseurs (exemples, à comparer selon offres actuelles) : **MacInCloud**, **MacStadium**, AWS EC2 Mac instances, etc.

1. Crée un compte et choisis un plan avec **macOS récent** + **Xcode à jour**.
2. Le service te donne en général :
   - soit une **IP + identifiants** pour **Screen Sharing** (VNC) Apple,
   - soit un client **RDP** / **noVNC** dans le navigateur.
3. Depuis ton PC Windows :
   - **Microsoft Remote Desktop** (si le fournisseur le propose),
   - ou client **VNC** compatible,
   - ou **Chrome / navigateur** si accès web au bureau distant.
4. Sur le Mac distant, installe :
   - **Xcode** (App Store sur le Mac distant),
   - **Node.js**, **CocoaPods** (`sudo gem install cocoapods` ou via Homebrew),
   - clone ton repo (Git) ou copie le projet.
5. Dans le projet : `npm install` → `npm run build:capacitor` → `npx cap sync ios` → `npx cap open ios` → Archive dans Xcode.

**Astuce :** garde le même **Bundle ID** (`com.cencorse.app`) et la même **Team** Apple que sur App Store Connect.

### B. Partage d’écran Mac classique (si tu connais quelqu’un avec un Mac)

Sur le Mac « hôte » : **Réglages système → Partage** → activer **Partage d’écran** ou **Gestion à distance** (selon version macOS).  
Depuis un autre Mac ou un client VNC adapté, tu te connectes. Moins standard depuis Windows sans outil VNC.

### C. CI/CD (GitHub Actions macOS, Codemagic, etc.)

Build et upload **sans** ouvrir Xcode à la main, mais configuration initiale plus technique (certificats, API Key App Store Connect).

---

## 2) Pas d’iPhone : simulateur ?

**Oui**, tu peux **beaucoup** tester sur le **Simulateur iOS** (intégré à Xcode) :

- navigation, UI, une grande partie du WebView Capacitor,
- beaucoup de flux « réseau » / OAuth en **développement** (selon config).

**Limites importantes** (comportement réel différent) :

- **Sign in with Apple** : à tester de préférence sur **appareil réel**.
- **GPS** : le simulateur simule une position, ce n’est pas le vrai GPS.
- **Appareil photo / caméra** : souvent limité ou différent.
- **Performances** : pas représentatif d’un vrai iPhone.

**Pour publier une version**, tu peux **archiver et uploader** depuis le Mac **sans** iPhone physique.  
En revanche, pour être tranquille avant la **review Apple**, un test sur **vrai iPhone** (même emprunté) reste très recommandé.

---

## 3) Testeurs obligatoires sur l’App Store ?

**Non.**

- **TestFlight** (testeurs internes / externes) est **optionnel** mais **fortement conseillé** pour valider avant la mise en production.
- Tu peux **soumettre directement** une version **App Store** sans passer par TestFlight.

Résumé :

| Étape              | Obligatoire pour publier ? |
|-------------------|----------------------------|
| Compte Developer  | Oui                        |
| Build + upload    | Oui                        |
| TestFlight        | Non                        |
| Soumission review | Oui                        |

---

## Fichiers utiles dans ce repo

- `docs/APPLE-STORE-PROCEDURE.md` — procédure générale publication.
- `docs/SIGN-IN-WITH-APPLE.md` — Apple + Supabase.
