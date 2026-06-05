# 📋 GUIDE DE DÉPLOIEMENT — Clinique Médicale Mahuénan
## Application d'aide au diagnostic multi-postes

---

## 🎯 VUE D'ENSEMBLE

Cette application web permet à tous les médecins de la clinique d'accéder aux dossiers patients depuis n'importe quel poste connecté à internet. Les données sont stockées dans le cloud (Supabase) et l'analyse IA utilise Claude d'Anthropic.

**Architecture :**
- Application web → hébergée sur **Netlify** (gratuit)
- Base de données → **Supabase** (gratuit jusqu'à 500 MB)
- Intelligence artificielle → **API Anthropic Claude**

---

## ÉTAPE 1 — Créer votre base de données Supabase

1. Rendez-vous sur **https://supabase.com** et cliquez "Start your project"
2. Créez un compte avec votre email
3. Cliquez **"New project"**
   - Nom du projet : `mahuenant-medical`
   - Choisissez un mot de passe fort (notez-le !)
   - Région : **West EU (Ireland)** (la plus proche d'Afrique de l'Ouest)
4. Attendez 2-3 minutes que le projet soit créé

**Configurer la base de données :**
1. Dans le menu gauche, cliquez **SQL Editor**
2. Cliquez **"New query"**
3. Copiez-collez TOUT le contenu du fichier `SCHEMA_SUPABASE.sql`
4. Cliquez **"Run"** (bouton vert)
5. Vous devriez voir "Success. No rows returned"

**Récupérer vos clés API :**
1. Dans le menu gauche, cliquez **Project Settings** (icône engrenage)
2. Cliquez **API**
3. Notez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJ...` (longue chaîne)

---

## ÉTAPE 2 — Créer les comptes médecins

Dans Supabase, vous devez créer les comptes pour chaque médecin :

1. Allez dans **Authentication** → **Users**
2. Cliquez **"Add user"** → **"Create new user"**
3. Entrez l'email et mot de passe du médecin
4. Notez l'**UUID** affiché (ex: `a1b2c3d4-...`)

**Ensuite, ajoutez les informations du médecin :**
1. Allez dans **Table Editor** → table `medecins`
2. Cliquez **"Insert row"**
3. Remplissez :
   - `id` : l'UUID du médecin (copié de l'étape précédente)
   - `email` : son email
   - `nom`, `prenom` : ses coordonnées
   - `specialite` : sa spécialité principale
   - `role` : `medecin` (ou `admin` pour vous)

Répétez pour chaque médecin de la clinique.

---

## ÉTAPE 3 — Obtenir votre clé API Anthropic

1. Rendez-vous sur **https://console.anthropic.com**
2. Créez un compte ou connectez-vous
3. Allez dans **API Keys** → **Create Key**
4. Nommez-la "Mahuénan Medical"
5. Copiez la clé : `sk-ant-api03-...` (visible une seule fois !)

**Important :** Cette clé est liée à votre facturation Anthropic. Le coût est d'environ $0.003 par consultation analysée (très faible).

---

## ÉTAPE 4 — Déployer l'application sur Netlify

### Option A : Via GitHub (recommandé)

1. Créez un compte sur **https://github.com** si vous n'en avez pas
2. Créez un nouveau dépôt "mahuenant-medical"
3. Uploadez tous les fichiers du projet
4. Rendez-vous sur **https://netlify.com**
5. Connectez-vous avec GitHub
6. Cliquez **"New site from Git"** → choisissez votre dépôt
7. Build command : `npm run build`
8. Publish directory : `dist`
9. Cliquez **Deploy**

### Option B : Upload direct (plus simple)

1. Dans le dossier du projet, ouvrez un terminal et tapez :
   ```
   npm install
   npm run build
   ```
2. Un dossier `dist` sera créé
3. Rendez-vous sur **https://netlify.com** → **"Add new site"** → **"Deploy manually"**
4. Glissez-déposez le dossier `dist`

### Configurer les variables d'environnement sur Netlify :

1. Dans votre site Netlify → **Site settings** → **Environment variables**
2. Ajoutez ces 3 variables :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anon Supabase
   - `VITE_ANTHROPIC_KEY` = votre clé API Anthropic
3. Cliquez **"Save"**
4. Allez dans **Deploys** → **"Trigger deploy"** → **"Deploy site"**

---

## ÉTAPE 5 — Accéder à l'application

Votre application sera accessible à une URL comme :
**https://mahuenant-medical.netlify.app**

Vous pouvez configurer un nom de domaine personnalisé (ex: `app.mahuenant.bj`) dans les paramètres Netlify.

### Partager l'accès :
- Donnez cette URL à tous les médecins de la clinique
- Chaque médecin se connecte avec son email/mot de passe
- Fonctionne sur ordinateur, tablette, et smartphone

---

## 🔒 SÉCURITÉ

- Les données sont chiffrées en transit (HTTPS)
- Chaque médecin a ses propres identifiants
- La base de données est protégée par Row Level Security
- Les clés API ne sont jamais exposées aux utilisateurs

---

## 💰 COÛTS ESTIMÉS

| Service | Coût |
|---------|------|
| Netlify (hébergement) | **Gratuit** (plan Free) |
| Supabase (base de données) | **Gratuit** jusqu'à 500 MB |
| Anthropic API | ~$0.003 par analyse IA |
| **Total pour 100 consultations/mois** | **~$0.30/mois** |

---

## 🆘 SUPPORT

En cas de problème :
- Supabase : https://supabase.com/docs
- Netlify : https://docs.netlify.com
- Anthropic API : https://docs.anthropic.com

---

## 📁 STRUCTURE DES FICHIERS

```
mahuenant-app/
├── index.html                    — Page HTML principale
├── package.json                  — Dépendances
├── vite.config.js                — Configuration du bundler
├── netlify.toml                  — Configuration Netlify
├── .env.example                  — Template des variables
├── SCHEMA_SUPABASE.sql           — Script base de données
└── src/
    ├── main.jsx                  — Point d'entrée
    ├── App.jsx                   — Routeur principal
    ├── lib/
    │   ├── supabase.js           — Client base de données
    │   ├── diagnostic.js         — Service IA
    │   └── data.js               — Données (symptômes, spécialités)
    ├── hooks/
    │   └── useAuth.jsx           — Authentification
    ├── components/
    │   └── Layout.jsx            — Mise en page avec sidebar
    └── pages/
        ├── LoginPage.jsx         — Connexion
        ├── Dashboard.jsx         — Tableau de bord
        ├── PatientsPage.jsx      — Liste des patients
        ├── DossierPatient.jsx    — Dossier complet + historique
        └── NouvelleConsultation.jsx — Formulaire consultation + IA
```
