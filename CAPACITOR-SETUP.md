# Configuration Capacitor - Modifications Séparées

## ✅ Principe

Toutes les modifications nécessaires pour Capacitor sont **automatiquement injectées et retirées** par des scripts. Le code source reste propre et ne contient **PAS** de modifications Capacitor.

## 📁 Structure

### Scripts dans `/deploy/scripts/` :

1. **`prepare-capacitor-build.js`**
   - Masque temporairement les routes API (non compatibles avec export statique)
   - Sauvegarde les routes API dans `_api_backup/`

2. **`inject-capacitor-fixes.js`**
   - Injecte `generateStaticParams()` dans les pages dynamiques
   - Marque les modifications avec `[CAPACITOR FIX]` pour les retirer après

3. **`restore-api-routes.js`**
   - Restaure les routes API depuis `_api_backup/` après le build

4. **`revert-capacitor-fixes.js`**
   - Retire les modifications marquées `[CAPACITOR FIX]`
   - Restaure les fichiers à leur état original

### Modifications dans le code source :

**AUCUNE modification directe dans le code source !**

Toutes les modifications sont injectées temporairement pendant le build, puis retirées automatiquement.

## 🚀 Utilisation

```bash
# Build Capacitor complet
npm run build:capacitor
```

Ce script :
1. ✅ Masque les routes API
2. ✅ Injecte les fixes Capacitor
3. ✅ Build en mode export statique
4. ✅ Restaure les routes API
5. ✅ Retire les fixes Capacitor
6. ✅ Synchronise avec Capacitor Android

## 📝 Fichiers modifiés temporairement

- `src/app/presentation/[id]/page.tsx` → Ajoute `generateStaticParams()`
- `src/app/projets/[id]/page.tsx` → Ajoute `generateStaticParams()`
- `src/app/api/*` → Masqué pendant le build

Tous ces fichiers sont restaurés à leur état original après le build.

## ✅ Vérification

Pour vérifier que le code source est propre :

```bash
git status
```

Les fichiers source ne devraient **PAS** contenir de modifications (sauf si vous avez fait d'autres changements).

Les seuls fichiers qui doivent être commités sont :
- Les scripts dans `scripts/`
- `capacitor.config.ts`
- `next.config.ts` (configuration conditionnelle)
- `package.json` (scripts de build)










