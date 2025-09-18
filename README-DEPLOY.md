# Guide de déploiement Vercel

## Problème résolu : Chargement infini après authentification

Le problème de chargement infini après l'authentification était causé par l'utilisation de `window.location.href` qui force un rechargement complet de la page, perturbant le contexte React et l'état d'authentification.

### Corrections apportées :

1. **Remplacement de `window.location.href` par `router.push()`** dans :
   - `LoginForm.tsx` : Redirection après connexion réussie
   - `UserMenu.tsx` : Redirection après déconnexion
   - `projets/[id]/page.tsx` : Redirections après modifications/suppression

2. **Amélioration du contexte d'authentification** :
   - Gestion explicite du state `loading` dans `signIn`
   - Mise à jour immédiate de l'état utilisateur après connexion

3. **Configuration Vercel** :
   - Ajout du fichier `vercel.json` avec les bonnes configurations
   - Headers de sécurité
   - Configuration des variables d'environnement

## Configuration des variables d'environnement sur Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur "Settings" → "Environment Variables"
3. Ajoutez les variables suivantes :

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase
```

## Déploiement

1. Assurez-vous que votre branche `master` est à jour
2. Connectez votre repository GitHub à Vercel
3. Configurez le dossier racine sur `deploy/`
4. Vercel détectera automatiquement Next.js et utilisera la configuration `vercel.json`

## Vérification

Après déploiement, testez :
1. Connexion avec des identifiants valides
2. Vérifiez que la redirection se fait sans chargement infini
3. Testez la déconnexion
4. Vérifiez les redirections dans les pages de projets

## Notes importantes

- Le problème était spécifique à la branche `master` vs `main`
- Les redirections utilisent maintenant le router Next.js au lieu de rechargements complets
- Le contexte d'authentification gère mieux les états de chargement
