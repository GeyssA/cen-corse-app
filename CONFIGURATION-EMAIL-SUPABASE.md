# 📧 Configuration des Emails d'Authentification - Supabase

## 🎯 Objectif
Permettre l'envoi d'emails de confirmation lors de l'inscription des utilisateurs.

---

## 📋 ÉTAPE 1 : Créer le Trigger SQL (OBLIGATOIRE)

### Pourquoi ?
Le trigger crée **automatiquement** un profil dans la table `profiles` dès qu'un utilisateur s'inscrit, même avant la confirmation de l'email.

### Comment faire ?

1. Allez sur votre **Supabase Dashboard**
2. Naviguez vers : **SQL Editor** (dans le menu de gauche)
3. Cliquez sur **"New query"**
4. Copiez-collez le contenu du fichier `supabase-trigger-create-profile.sql`
5. Cliquez sur **"Run"** (ou Ctrl+Enter)
6. Vérifiez que le message indique **"Success"**

### ✅ Résultat attendu :
```
Success. Rows: 1
```

---

## 📋 ÉTAPE 2 : Configurer les Paramètres d'Authentification

### A. Activer la confirmation par email

1. Allez sur : **Dashboard > Authentication > Settings**
2. Dans la section **"Email Auth"**, configurez :

```
✅ Enable Email Confirmations = ACTIVÉ (coché)
❌ Enable Email Autoconfirm = DÉSACTIVÉ (décoché)
❌ Mailer autoconfirm = DÉSACTIVÉ (décoché)
```

### B. Configurer le SMTP

1. Allez sur : **Dashboard > Settings > Auth**
2. Scrollez jusqu'à **"SMTP Settings"**
3. Activez **"Enable Custom SMTP"**
4. Configurez les paramètres :

```
Host:          smtp.gmail.com
Port:          587
Sender email:  votre-email@gmail.com
Sender name:   CEN Corse
Username:      votre-email@gmail.com
Password:      [Votre App Password - voir étape 3]
```

5. Cliquez sur **"Save"**

---

## 📋 ÉTAPE 3 : Créer un App Password Gmail

### Pourquoi ?
Gmail bloque les connexions SMTP avec le mot de passe normal pour des raisons de sécurité. Il faut créer un **"App Password"** spécial.

### Comment faire ?

1. Allez sur : https://myaccount.google.com/security
2. **Activez la validation en 2 étapes** (si pas déjà fait)
   - Cliquez sur "Validation en 2 étapes"
   - Suivez les instructions
3. Une fois activée, retournez sur : https://myaccount.google.com/security
4. Cliquez sur **"Mots de passe des applications"** (App Passwords)
5. Sélectionnez :
   - **App** : Mail (ou "Autre")
   - **Appareil** : Autre (entrez "Supabase" ou "CEN Corse App")
6. Cliquez sur **"Générer"**
7. **Copiez le mot de passe de 16 caractères** (format : xxxx xxxx xxxx xxxx)
8. Collez-le dans le champ **"Password"** de la configuration SMTP Supabase

⚠️ **Important** : Conservez ce mot de passe en lieu sûr, vous ne pourrez plus le revoir après !

---

## 📋 ÉTAPE 4 : Configurer les Templates d'Email

### A. Template de confirmation de compte

1. Allez sur : **Dashboard > Authentication > Email Templates**
2. Sélectionnez **"Confirm signup"**
3. **Option 1 - Template personnalisé** (recommandé) :
   - Copiez le contenu du fichier `email-template-confirmation.html`
   - Collez-le dans l'éditeur
   - **Gardez impérativement** : `{{ .ConfirmationURL }}`
4. **Option 2 - Template simple** :
   ```html
   <h2>Confirmez votre email</h2>
   <p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
   <p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
   ```
5. Cliquez sur **"Save"**

### B. Template de réinitialisation de mot de passe

1. Dans **Dashboard > Authentication > Email Templates**
2. Sélectionnez **"Reset Password"** (Mot de passe oublié)
3. **Option 1 - Template personnalisé** (recommandé) :
   - Copiez le contenu du fichier `email-template-reset-password.html`
   - Collez-le dans l'éditeur
   - **Gardez impérativement** : `{{ .ConfirmationURL }}`
4. **Option 2 - Template simple** :
   ```html
   <h2>Réinitialisation de mot de passe</h2>
   <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
   <p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
   ```
5. Cliquez sur **"Save"**

### 📧 Templates disponibles

- `email-template-confirmation.html` : Email de confirmation de compte (bleu)
- `email-template-reset-password.html` : Email de réinitialisation de mot de passe (orange/jaune)

---

## 📋 ÉTAPE 5 : Configurer les URLs de Redirection

### ⚠️ IMPORTANT : Configuration de la page de confirmation

Quand un utilisateur clique sur "Confirmer mon compte" dans l'email, il sera redirigé vers une page spécifique de votre application qui affiche "Votre compte est validé - Retournez sur l'application".

### Comment configurer :

1. Allez sur : **Dashboard > Authentication > URL Configuration**
2. Configurez :

```
Site URL:
  - Développement : http://localhost:3000
  - Production : https://votre-domaine.vercel.app

Redirect URLs (liste des URLs autorisées) :
  - http://localhost:3000/**
  - http://localhost:3000/auth/confirm
  - https://votre-domaine.vercel.app/**
  - https://votre-domaine.vercel.app/auth/confirm
```

3. Cliquez sur **"Save"**

### 📍 Où se trouve la page de confirmation ?

La page de confirmation se trouve à : **`/auth/confirm`**

- **Développement** : http://localhost:3000/auth/confirm
- **Production** : https://votre-domaine.vercel.app/auth/confirm

Cette page :
- ✅ Confirme automatiquement le compte de l'utilisateur
- ✅ Affiche un message "Votre compte est validé !"
- ✅ Propose un bouton pour retourner à l'application
- ✅ Gère les erreurs (lien expiré, etc.)

### 🔧 Comment ça fonctionne ?

1. **Utilisateur clique sur le lien de confirmation dans l'email**
2. **Supabase redirige vers** : `https://votre-domaine.vercel.app/auth/confirm?code=XXXXX`
3. **La page `/auth/confirm`** :
   - Récupère le code de confirmation
   - Appelle `supabase.auth.exchangeCodeForSession(code)`
   - Affiche "Votre compte est validé !"
4. **L'utilisateur** clique sur "Retourner à l'application" ou "Se connecter"

---

## 🧪 ÉTAPE 6 : Tester le Système

### Test complet :

1. Allez sur votre application : `/auth`
2. Créez un compte avec un **email réel**
3. Vérifiez :
   - ✅ Message "Inscription réussie ! Vérifiez votre email..."
   - ✅ Email reçu (vérifiez les spams si besoin)
   - ✅ Profil créé dans Supabase Dashboard > Table Editor > profiles
4. Cliquez sur le lien dans l'email
5. Vous devriez être redirigé vers l'application
6. Connectez-vous avec vos identifiants
7. ✅ Accès à l'application accordé !

---

## 🔍 Vérifications en Cas de Problème

### L'email n'arrive pas ?

1. **Vérifiez les spams** de votre boîte mail
2. **Vérifiez les logs Supabase** :
   ```
   Dashboard > Logs > Auth Logs
   ```
   Recherchez les erreurs SMTP
3. **Testez le SMTP** depuis Supabase :
   ```
   Dashboard > Settings > Auth > SMTP Settings
   ```
   Utilisez le bouton "Send test email"

### Le profil n'est pas créé ?

1. Vérifiez que le trigger est bien créé :
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
2. Vérifiez les logs SQL :
   ```
   Dashboard > Logs > Postgres Logs
   ```

### L'utilisateur ne peut pas se connecter ?

1. Vérifiez que l'email est confirmé :
   ```
   Dashboard > Authentication > Users
   ```
   La colonne "Email Confirmed At" doit avoir une date
2. Si pas confirmé, renvoyez l'email ou confirmez manuellement

---

## 📊 Flux Final Attendu

```
┌──────────────────────────────────────────────────────────┐
│ 1. Utilisateur s'inscrit                                 │
│    → email: user@example.com                            │
│    → password: ********                                  │
│    → nom: Jean Dupont                                    │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 2. Supabase crée l'utilisateur dans auth.users          │
│    → email_confirmed_at: NULL (pas encore confirmé)     │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 3. TRIGGER SQL s'exécute automatiquement                │
│    → Crée le profil dans public.profiles                │
│    → role: 'visitor' (par défaut)                       │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 4. Supabase envoie l'email de confirmation (SMTP)       │
│    → À: user@example.com                                │
│    → Contient le lien de confirmation                   │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 5. Utilisateur clique sur le lien dans l'email          │
│    → Redirection vers /auth/confirm?code=XXXXX         │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 6. Page de confirmation traite le code                  │
│    → exchangeCodeForSession(code)                       │
│    → email_confirmed_at: 2025-10-11 10:30:00           │
│    → Message: "✅ Votre compte est validé !"           │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 7. Utilisateur retourne sur l'application               │
│    → Clique sur "Se connecter" ou "Retour à l'accueil" │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│ 8. Utilisateur se connecte                               │
│    → Profil déjà existant ✅                            │
│    → Accès à l'application ✅                           │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Gestion Manuelle des Rôles

Pour changer le rôle d'un utilisateur :

1. Allez sur : **Dashboard > Table Editor > profiles**
2. Trouvez l'utilisateur par son email
3. Cliquez sur la cellule **"role"**
4. Changez la valeur : `visitor` → `admin` ou `super_admin`
5. La modification est automatique

---

## 💡 Conseils de Sécurité

- ✅ Tous les nouveaux comptes = **visitor** par défaut
- ✅ Vous contrôlez manuellement qui devient admin
- ✅ Confirmation email obligatoire avant connexion
- ✅ App Password Gmail = sécurité renforcée
- ✅ Pas de risque qu'un utilisateur s'auto-attribue admin

---

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes :

1. Vérifiez les logs : **Dashboard > Logs > Auth Logs**
2. Testez le SMTP : **Dashboard > Settings > Auth > Send test email**
3. Contactez le support Supabase avec les messages d'erreur des logs

---

**Bonne configuration ! 🚀**


