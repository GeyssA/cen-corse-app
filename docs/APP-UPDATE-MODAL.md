# Modale « nouvelle version » (Android)

Fichier : `public/app-update.json` (déployé avec le site, ex. Vercel).

- **`latestVersionCode`** : si l’APK installée a un `versionCode` **inférieur**, une modale s’affiche (informative, **fermable**).
- **`title`**, **`message`**, **`playStoreUrl`** : optionnels.

Après **Plus tard**, la modale ne revient pas pour ce numéro ; si tu augmentes `latestVersionCode` sur le site, elle se réaffiche pour les utilisateurs encore en retard.

URL personnalisée : `NEXT_PUBLIC_APP_UPDATE_JSON_URL`.
