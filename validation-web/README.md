# Interface de validation des données — CEN Corse

Page HTML autonome pour **visualiser** et **valider** les données naturalistes (observations et sites) stockées dans Supabase. Déployable sur **GitHub Pages**.

## Fonctionnalités

- **Accès** : code d'accès **20290** (pas de compte Supabase).
- **Observations** : tableau avec toutes les colonnes, photo, date d’encodage, statut validé, bouton « Valider ».
- **Sites** : tableau avec colonnes, photo, longueur (sites linéaires), bouton « Valider ».
- **Carte** : fond OpenStreetMap, marqueurs pour les observations et sites, tracés pour les sites linéaires (POP Reptile).
- **Export CSV** : « Exporter tout » ou « Exporter validées » (données validées uniquement).
- **Fermer la session** : revient à l'écran de saisie du code.

## Configuration locale

1. Copiez `config.example.js` vers `config.js`.
2. Dans `config.js`, remplacez `VOTRE_PROJECT_REF` et `VOTRE_ANON_KEY` par l’URL et la clé anon de votre projet Supabase (Dashboard > Project Settings > API).

**Pourquoi ça ne marche pas en ouvrant `index.html` directement (double-clic / file://) ?**  
La page charge des scripts en **modules** et appelle Supabase. Les navigateurs bloquent ces requêtes depuis une origine `file://`. Il faut donc **servir le dossier avec un serveur HTTP**.

**Pour tester en local (avec les données du projet) :**

1. Depuis la racine du dépôt, copiez l’URL et la clé anon dans `validation-web/config.js` (ex. depuis `.env.local` : `NEXT_PUBLIC_SUPABASE_URL` → `window.SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `window.SUPABASE_ANON_KEY`). Ne commitez pas ce `config.js` s’il contient de vraies clés.
2. Lancez un serveur dans le dossier `validation-web` :

```bash
cd validation-web
npx serve . -p 5000
```

3. Ouvrez **http://localhost:5000**, entrez le code **20290**, puis cliquez sur « Accéder ».

Alternative (sans modifier `config.js`) : depuis la racine du dépôt :

```bash
npx serve validation-web -p 5000
```

Puis ouvrez http://localhost:5000 (la connexion Supabase ne fonctionnera que si `config.js` contient de vraies valeurs).

## Déploiement sur GitHub Pages

**Seul le contenu du dossier `validation-web/` (l’interface de validation des données) est déployé.** Le reste du dépôt (application Next.js, dossiers `deploy/`, `src/`, etc.) n’est pas publié sur GitHub Pages.

### Pourquoi une erreur apparaît parfois

Quand tu actives GitHub Pages avec l’option par défaut (« Deploy from a branch » sur la branche **main**), GitHub essaie de construire **tout** le dépôt avec un outil appelé Jekyll.  
Or ton dépôt contient d’autres dossiers (comme `deploy/`, `deploy-backup/`) avec des fichiers que Jekyll ne comprend pas bien. Il affiche alors des erreurs « Liquid » ou « ASCII incompatible ».  
**En résumé** : il ne faut pas laisser GitHub construire tout le dépôt. Il faut soit lui dire de ne pas utiliser Jekyll, soit de ne publier que la page de validation. C’est ce que font les deux options ci‑dessous.

---

### Avant de commencer

Tu dois avoir :

- Un dépôt GitHub pour ce projet (par ex. `cen-corse-app`).
- Les identifiants Supabase du projet : l’**URL** (ex. `https://xxxx.supabase.co`) et la **clé anon** (longue chaîne de caractères).  
  Tu les trouves dans le **Dashboard Supabase** : ton projet → **Project Settings** (icône engrenage) → **API** → **Project URL** et **anon public**.

---

### Option A — Utiliser « GitHub Actions » comme source (recommandé)

Avec cette option, seul le dossier de la page de validation est publié. Aucun Jekyll, donc pas d’erreur.

#### Étape 1 : Créer les secrets du dépôt

1. Ouvre ton dépôt sur GitHub.
2. Clique sur l’onglet **Settings** (Paramètres).
3. Dans le menu de gauche, clique sur **Secrets and variables** → **Actions**.
4. Clique sur **New repository secret**.
5. **Premier secret** :  
   - **Name** : `SUPABASE_URL`  
   - **Secret** : colle l’URL de ton projet Supabase (ex. `https://xxxx.supabase.co`).  
   Clique sur **Add secret**.
6. Clique à nouveau sur **New repository secret**.
7. **Deuxième secret** :  
   - **Name** : `SUPABASE_ANON_KEY`  
   - **Secret** : colle la clé anon de Supabase.  
   Clique sur **Add secret**.

Tu dois avoir au moins ces deux secrets : `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

#### Étape 2 : Choisir « GitHub Actions » comme source de Pages

1. Toujours dans **Settings** du dépôt.
2. Dans le menu de gauche, clique sur **Pages** (sous « Code and automation »).
3. Dans la section **Build and deployment** :
   - À la ligne **Source**, tu vois un menu déroulant (souvent réglé sur « Deploy from a branch »).
   - Clique dessus et sélectionne **GitHub Actions**.

C’est tout pour la configuration. À partir de là, chaque fois que le workflow de déploiement tourne (voir l’étape 3), GitHub publiera uniquement ce que ce workflow lui envoie (la page de validation), sans lancer Jekyll.

#### Étape 3 : Lancer un déploiement

1. Clique sur l’onglet **Actions** en haut du dépôt.
2. Dans la liste des workflows à gauche, clique sur **Deploy validation-web (GitHub Actions)**.
3. À droite, clique sur le bouton **Run workflow**.
4. Laisse **Branch: main** et clique sur **Run workflow** (le bouton vert).
5. La ligne du workflow qui vient de se lancer apparaît en haut. Clique dessus.
6. Attends que le job **deploy** (puis **deploy-pages**) soit terminé (coches vertes). Si tout est vert, le site est en ligne.

L’URL du site est indiquée en haut de la page **Settings > Pages**, du type :  
`https://<ton-username>.github.io/<nom-du-repo>/`

Les prochains déploiements se feront automatiquement à chaque push sur la branche **main** (ou tu peux relancer le workflow à la main comme à l’étape 3).

---

### Option B — Utiliser la branche « gh-pages » (sans toucher à main)

Avec cette option, GitHub Pages lit les fichiers depuis une branche dédiée appelée **gh-pages**. Un workflow du dépôt remplit cette branche avec **uniquement** la page de validation (plus un fichier qui désactive Jekyll). Donc seul le dossier `validation-web/` est publié, et il n’y a pas d’erreur Jekyll.

---

#### Étape 1 : Créer les deux secrets (URL et clé Supabase)

Sans ces secrets, le workflow ne peut pas écrire dans la branche **gh-pages** les bonnes valeurs pour se connecter à Supabase.

1. Ouvre ton dépôt sur GitHub (la page d’accueil du repo).
2. Clique sur l’onglet **Settings** (en haut, à côté de Insights).
3. Dans le menu de gauche, sous **Security**, clique sur **Secrets and variables** → **Actions**.
4. Tu arrives sur une page « Actions secrets and variables ». Clique sur le bouton vert **New repository secret**.
5. **Premier secret** :
   - Dans **Name**, tape exactement : `SUPABASE_URL`
   - Dans **Secret**, colle l’URL de ton projet Supabase (ex. `https://xxxxxxxx.supabase.co`), sans espace avant/après.
   - Clique sur **Add secret**.
6. Tu reviens sur la liste des secrets. Clique à nouveau sur **New repository secret**.
7. **Deuxième secret** :
   - **Name** : `SUPABASE_ANON_KEY`
   - **Secret** : colle la clé anon (longue chaîne), trouvable dans Supabase : Dashboard → Project Settings → API → « anon public ».
   - Clique sur **Add secret**.

Tu dois voir au moins ces deux lignes dans la liste : **SUPABASE_URL** et **SUPABASE_ANON_KEY**. Les valeurs ne sont pas affichées (c’est normal).

---

#### Étape 2 : Dire à GitHub Pages d’utiliser la branche gh-pages

Là, tu indiques à GitHub : « pour le site web, utilise la branche **gh-pages** », et pas **main**. Ainsi, seul ce qui sera poussé sur **gh-pages** par le workflow sera servi (donc uniquement la page de validation).

1. Toujours dans **Settings**, dans le menu de gauche, clique sur **Pages** (souvent sous « Code and automation » ou « General »).
2. Tu vois la section **Build and deployment**.
3. À la ligne **Source** : ouvre le menu déroulant. Choisis **Deploy from a branch** (ne prends pas « GitHub Actions »).
4. Un bloc apparaît en dessous avec **Branch** et **Folder**.
5. Dans le menu **Branch** : ouvre-le et sélectionne **gh-pages**.  
   - Si **gh-pages** n’apparaît pas encore, c’est normal (la branche sera créée à l’étape 3). Tu peux passer à l’étape 3 d’abord, puis revenir ici après le premier déploiement pour sélectionner **gh-pages**.
6. Pour **Folder**, laisse **/ (root)**.
7. S’il y a un bouton **Save**, clique dessus.

Résultat : GitHub Pages est réglé pour publier le contenu de la branche **gh-pages**. Pour l’instant cette branche peut être vide ou inexistante ; l’étape 3 va la remplir.

---

#### Étape 3 : Lancer le workflow qui envoie la page de validation sur gh-pages

Le workflow « Deploy validation-web to gh-pages branch » copie le dossier `validation-web/`, y injecte la config (depuis les secrets), puis pousse le tout sur la branche **gh-pages**. Une fois terminé, le site est en ligne.

1. Clique sur l’onglet **Actions** en haut du dépôt (à côté de Pull requests).
2. Dans la liste des workflows à gauche, clique sur **Deploy validation-web to gh-pages branch**.
3. À droite, clique sur le bouton **Run workflow**.
4. Une petite fenêtre s’ouvre. Laisse **Branch: main** tel quel, puis clique sur le bouton vert **Run workflow**.
5. Une ligne de travail apparaît en haut (par ex. « Run workflow » avec un point jaune). Clique sur cette ligne pour voir le détail.
6. Tu vois un job (par ex. « build and push »). Attends qu’il passe au vert (coche verte). En cas d’erreur, ouvre le job pour voir le message.

Quand le job est vert, le workflow a poussé le contenu de la page de validation sur la branche **gh-pages**. Si tu as bien réglé l’étape 2 sur la branche **gh-pages**, GitHub Pages sert maintenant ce contenu.

**Voir le site** : dans **Settings** → **Pages**, en haut de la page, tu vois souvent un encadré du type « Your site is live at … » avec l’URL, par ex.  
`https://<ton-username>.github.io/<nom-du-repo>/`

Tu peux relancer ce workflow à tout moment (après une modification de `validation-web/` et un push sur **main**) pour mettre à jour le site.

---

### Résumé

- **Erreur Jekyll / Liquid** : tu avais probablement **Source = Deploy from a branch** et **Branch = main**. Il faut soit passer à **Source = GitHub Actions** (Option A), soit garder « Deploy from a branch » mais avec **Branch = gh-pages** (Option B).
- **Option A** : Settings → Pages → Source = **GitHub Actions** ; secrets créés ; lancer le workflow « Deploy validation-web (GitHub Actions) ».
- **Option B** : Settings → Pages → Source = **Deploy from a branch**, Branch = **gh-pages** ; secrets créés ; lancer le workflow « Deploy validation-web to gh-pages branch ».

Une fois une des deux options en place, la page de validation est la seule chose publiée, et les erreurs de build Jekyll disparaissent.

## Voir toutes les données (politiques RLS)

Par défaut, les politiques RLS Supabase limitent souvent la lecture aux données de l’utilisateur connecté. Pour que l'interface de validation (code 20290, clé **anon**) voie **toutes** les observations et tous les sites :

1. Ouvre le **Dashboard Supabase** → ton projet.
2. Va dans **SQL Editor** → **New query**.
3. Ouvre le fichier **`validation-web/supabase-rls-anon.sql`** à la racine du dépôt, copie tout son contenu, colle-le dans l'éditeur SQL, puis clique sur **Run**.

Cela crée les politiques permettant au rôle `anon` de faire `SELECT` et `UPDATE` sur les tables `observations` et `observation_sites`. Sans ces politiques (ou équivalent), la page renverra 0 ligne ou une erreur du type « row-level security » / « policy ».

**Référence manuelle (si vous préférez créer les politiques à la main) :**

```sql
CREATE POLICY "Lecture globale observations"
  ON public.observations FOR SELECT TO anon USING (true);

CREATE POLICY "Lecture globale sites"
  ON public.observation_sites FOR SELECT TO anon USING (true);
CREATE POLICY "Update validation observations"
  ON public.observations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Update validation sites"
  ON public.observation_sites FOR UPDATE TO anon USING (true) WITH CHECK (true);
```
Sans ces politiques (ou équivalent), seules les lignes autorisées par vos règles RLS seront visibles. Pour la mise à jour (bouton Valider), ajoutez des politiques UPDATE sur `observations` et `observation_sites` pour le rôle `anon` (ou le rôle utilisé).

## Fichiers

| Fichier            | Rôle |
|--------------------|------|
| `index.html`       | Structure de la page, écran code d'accès, tableaux, carte, boutons. |
| `style.css`        | Styles (thème sombre, cartes, tableaux, carte). |
| `app.js`           | Logique : vérification code 20290, chargement Supabase, rendu tableaux, carte Leaflet, validation, export CSV. |
| `config.js`        | URL et clé Supabase (à ne pas committer avec de vraies clés en local ; en déploiement, le workflow les injecte depuis les secrets). |
| `config.example.js`| Exemple de configuration. |
| `supabase-rls-anon.sql` | Script SQL à exécuter dans Supabase pour autoriser la lecture/validation en anon (voir section RLS ci-dessus). |
