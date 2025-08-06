# Déploiement de l'application CEN Corse

## 📋 Instructions de déploiement

### 1. **Prérequis sur le serveur**
- Node.js 18+ installé
- npm ou yarn installé
- Accès FTP au serveur

### 2. **Variables d'environnement**
Créez un fichier `.env.local` sur le serveur avec :
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase
```

### 3. **Installation et démarrage**
```bash
# Installer les dépendances
npm install

# Démarrer l'application en production
npm start
```

### 4. **Structure des fichiers**
```
deploy/
├── .next/           # Build de production
├── public/          # Assets statiques
├── package.json     # Dépendances
├── next.config.ts   # Configuration Next.js
├── tsconfig.json    # Configuration TypeScript
└── README.md        # Ce fichier
```

### 5. **Configuration serveur**
- Port par défaut : 3000
- L'application est prête pour la production
- Tous les fichiers nécessaires sont inclus

### 6. **Fonctionnalités incluses**
- ✅ Authentification Supabase
- ✅ Gestion des projets avec visibilité privée
- ✅ Système de sondages
- ✅ Statistiques
- ✅ Interface responsive
- ✅ Service Worker pour le cache
- ✅ PWA ready

### 7. **Support**
Pour toute question technique, contactez l'équipe de développement. 