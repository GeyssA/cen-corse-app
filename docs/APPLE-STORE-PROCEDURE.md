# Procédure complète publication Apple (App Store / TestFlight)

Ce guide est orienté pour ce projet Capacitor + Next export.

## A. Pré-requis

- Compte **Apple Developer Program** actif.
- Mac + Xcode installé.
- Bundle ID final : `com.cencorse.app`.
- Icônes, splash, politique de confidentialité, captures d’écran iPhone.

## B. Préparer le build iOS

1. Générer le web build Capacitor :
   - `npm run build:capacitor`
2. Synchroniser et ouvrir iOS :
   - `npx cap sync ios`
   - `npx cap open ios`
3. Dans Xcode :
   - Target `App` > **Signing & Capabilities**
   - Team, Bundle Identifier, Provisioning
   - Capability **Sign In with Apple** (si activée dans l’app)
4. Incrémente les versions iOS :
   - `Version` (marketing) ex `0.17`
   - `Build` ex `17`

## C. Créer l’app dans App Store Connect

1. App Store Connect > **My Apps** > `+` > **New App**.
2. Remplir :
   - Platform: iOS
   - Name
   - Primary language
   - Bundle ID `com.cencorse.app`
   - SKU (interne)

## D. Uploader le binaire

### Option 1 (recommandée) : Xcode Organizer
1. Xcode > Product > Archive
2. Organizer > Distribute App
3. App Store Connect > Upload
4. Attendre la fin de processing (quelques minutes)

### Option 2 : Transporter
Exporter `.ipa` puis upload via app **Transporter**.

## E. Configurer la fiche App Store

Dans App Store Connect :
- Description, mots-clés, support URL, marketing URL
- Catégorie
- Captures d’écran iPhone (obligatoires)
- Icône est prise depuis le binaire
- Privacy nutrition labels
- Export compliance (chiffrement)
- Sign in with Apple (si applicable)

## F. TestFlight

1. Onglet **TestFlight** > build uploadé.
2. Ajouter testeurs internes (immédiat) puis externes (review beta requise).
3. Tester login email, Google, Apple, cartes, permissions GPS/photo/micro.

## G. Soumission App Store

1. Créer une version (ex `0.17`).
2. Associer le build validé.
3. Remplir les questionnaires (contenu, droits, privacy).
4. **Submit for Review**.

## H. Checklist spéciale pour ce projet

- [ ] `cencorse://auth/callback` configuré dans Supabase Redirect URLs
- [ ] Apple provider actif dans Supabase
- [ ] Sign In with Apple capability active côté Xcode
- [ ] Test login Apple sur iPhone réel
- [ ] Permissions iOS cohérentes (GPS, micro, photo si utilisées)
- [ ] Version/Build alignés entre Xcode et App Store Connect

## I. Après publication

- Suivre crashs (Xcode Organizer / App Store Connect)
- Monitorer authentification (Supabase logs)
- Utiliser TestFlight pour les pré-releases suivantes
