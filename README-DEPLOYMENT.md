# Guide de déploiement sur Vercel

## Problème résolu : Chargement infini après authentification

### Causes identifiées :
1. **Variables d'environnement Supabase manquantes** sur Vercel
2. **Configuration Supabase incomplète** (options d'authentification)
3. **Redirection problématique** dans LoginForm
4. **Gestion d'erreur insuffisante** dans AuthContext

### Solutions implémentées :

#### 1. Configuration Supabase améliorée
- Ajout de vérification des variables d'environnement
- Configuration des options d'authentification Supabase
- Gestion d'erreur plus robuste

#### 2. Navigation améliorée
- Remplacement de `window.location.href` par `router.push()`
- Ajout de logs de débogage

#### 3. Composant de débogage
- Ajout d'un composant `AuthDebug` pour diagnostiquer les problèmes
- Affichage de l'état de l'authentification et de la configuration

## Instructions de déploiement

### 1. Configuration des variables d'environnement sur Vercel

Allez dans votre dashboard Vercel > Settings > Environment Variables et ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Vérification de la configuration Supabase

Assurez-vous que dans votre projet Supabase :
- L'authentification par email/mot de passe est activée
- Les URLs de redirection sont configurées pour votre domaine Vercel
- Les politiques RLS sont correctement configurées

### 3. Test du déploiement

1. Déployez sur Vercel
2. Ouvrez la console du navigateur (F12)
3. Vérifiez les logs de débogage
4. Le composant `AuthDebug` (en bas à droite) vous aidera à diagnostiquer les problèmes

### 4. Logs de débogage

Les logs suivants vous aideront à identifier les problèmes :
- `🔍 Vérification de la session initiale...`
- `✅ Session récupérée: true/false`
- `👤 Récupération du profil utilisateur...`
- `🔐 Tentative de connexion pour: email`
- `✅ Connexion réussie: true/false`

### 5. En cas de problème persistant

1. Vérifiez que toutes les variables d'environnement sont définies
2. Vérifiez la configuration Supabase
3. Consultez les logs de la console
4. Utilisez le composant de débogage pour identifier le problème

## Fichiers modifiés

- `src/lib/supabase.ts` - Configuration Supabase améliorée
- `src/contexts/AuthContext.tsx` - Logs de débogage ajoutés
- `src/components/auth/LoginForm.tsx` - Navigation améliorée
- `src/components/debug/AuthDebug.tsx` - Nouveau composant de débogage
- `src/app/layout.tsx` - Intégration du composant de débogage
