# Guide d'Installation et Déploiement - Attestation Présence Esisar

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation Locale](#installation-locale)
4. [Test de l'Application](#test-de-lapplication)
5. [Déploiement en Production](#déploiement-en-production)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   PWA Frontend      │  Vue 3 + Vite
│  (JavaScript)       │
└──────────┬──────────┘
           │
           │ HTTP/API
           │
┌──────────▼──────────┐
│  Node.js Backend    │  Express.js
│  (Port 3000)        │
└──────────┬──────────┘
           │
           │ SMTP (Port 587)
           │
┌──────────▼──────────┐
│  SMTP Esisar        │  smtps.esisar.grenoble-inp.fr
│  (Envoi Email)      │
└─────────────────────┘

Reverse Proxy: Nginx (Port 80/443)
```

---

## 📦 Prérequis

### Pour le développement local:
- **Node.js 18+** ([https://nodejs.org](https://nodejs.org))
- **npm** ou **yarn**
- **Git**

### Pour le déploiement:
- **Docker** et **Docker Compose** (optionnel mais recommandé)
- ou **Node.js 20+** pour un déploiement natif
- **Nginx** (pour le reverse proxy)

### Identifiants Esisar:
- Email et mot de passe valides pour l'authentification SMTP
- Accès au serveur SMTP: `smtps.esisar.grenoble-inp.fr:587`

---

## 🚀 Installation Locale

### 1. Cloner le repository

```bash
git clone https://github.com/Rem7474/PresenceEsisar.git
cd PresenceEsisar
```

### 2. Installer les dépendances du Backend

```bash
cd backend
npm install
cp .env.example .env
cd ..
```

### 3. Installer les dépendances du Frontend

```bash
cd frontend
npm install
cp .env.example .env
cd ..
```

### 4. Configuration Frontend & Backend

Éditer `frontend/.env`:
```bash
# Port et backend API
VITE_PORT=5173
VITE_BACKEND_URL=http://localhost:3000
```

Éditer `backend/.env`:
```bash
# Serveur
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Email (optionnel - valeurs par défaut si non défini)
RECIPIENT_EMAIL=apprentissage@esisar.grenoble-inp.fr
```

**Variables Frontend:**

| Variable | Défaut | Description |
|----------|--------|-------------|
| `VITE_PORT` | `5173` | Port du serveur Vite (dev) |
| `VITE_BACKEND_URL` | `http://localhost:3000` | URL du backend pour proxy API |

**Variables Backend:**

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `3000` | Port d'écoute du serveur |
| `FRONTEND_URL` | `http://localhost:5173` | URL du frontend (pour CORS) |
| `NODE_ENV` | `development` | Environnement (development/production) |
| `RECIPIENT_EMAIL` | `apprentissage@esisar.grenoble-inp.fr` | Email destinataire pour les envois |

---

## 🧪 Test de l'Application

### Démarrer l'application en mode développement

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Le serveur démarre sur http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# L'application est accessible sur http://localhost:5173
```

### Tester les fonctionnalités

#### 1. **Première connexion**
- Accéder à `http://localhost:5173`
- Remplir le formulaire:
  - Nom: `Jean Dupont`
  - E-mail: `votre.email@esisar.grenoble-inp.fr`
  - Mot de passe: Votre mot de passe SMTP Esisar
- Cliquer sur "Continuer"

#### 2. **Interface principale**
- Observer le calcul automatique de la semaine
- Affichage du nom de fichier: `Attestation présence P2027- Jean Dupont - Esisar- Semaine XX`

#### 3. **Upload de fichier**
- Cliquer sur "📷 Prendre une Photo" (nécessite les permissions de caméra)
- Ou cliquer sur "📁 Sélectionner un Fichier"
- Formats acceptés: **JPEG, PNG, WebP, PDF**
- Taille max: **10 MB**

#### 4. **Envoi d'Email**
- Vérifier que le fichier est sélectionné
- Cliquer sur "✉️ Envoyer"
- Observer le message de confirmation

#### 5. **Vérification de l'Email**
- L'email doit arriver à l'adresse configurée dans `.env` (par défaut: `apprentissage@esisar.grenoble-inp.fr`)
- Pièce jointe: Fichier renommé au format spécifié
- Objet: `Attestation de Présence - [nom du fichier]`

#### 🧪 Test avec un email différent

Pour tester avant de passer en production:

```bash
# Éditer backend/.env
RECIPIENT_EMAIL=votre.email.test@gmail.com

# Redémarrer le backend
npm run dev
```

L'email sera maintenant envoyé à `votre.email.test@gmail.com` au lieu de `apprentissage@esisar.grenoble-inp.fr`

---

## 🌐 Déploiement en Production

### Option A: Déploiement avec Docker Compose (Recommandé)

#### 1. Préparer la configuration

```bash
# À la racine du projet
# Copier et éditer le fichier .env
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos configurations

# Démarrer les services
docker-compose up -d
```

**Important:** Docker Compose lit automatiquement `backend/.env` grâce à la directive `env_file` du docker-compose.yml. Assurez-vous que ce fichier existe et contient vos variables avant de lancer les conteneurs.

**Vérifier que tout fonctionne:**
```bash
curl http://localhost/api/health
# Réponse: {"status":"ok","timestamp":"..."}
```

#### 2. Configurer le domaine

Modifier `nginx.conf` pour votre domaine:
```nginx
server_name votre-domaine.com www.votre-domaine.com;
```

#### 3. SSL/HTTPS avec Let's Encrypt

```bash
# Installer certbot
sudo apt-get install certbot python3-certbot-nginx

# Générer le certificat
sudo certbot certonly --standalone -d votre-domaine.com

# Décommenter la section HTTPS dans nginx.conf
# Redémarrer nginx
docker-compose restart nginx
```

---

### Option B: Déploiement natif sur Linux

#### 1. Installation du backend

```bash
cd backend
npm install --production
cp .env.example .env
# Éditer .env avec les paramètres de production
```

#### 2. Créer un service systemd

```bash
sudo nano /etc/systemd/system/presence-backend.service
```

Contenu:
```ini
[Unit]
Description=Présence Esisar Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/PresenceEsisar/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Démarrer le service:
```bash
sudo systemctl daemon-reload
sudo systemctl start presence-backend
sudo systemctl enable presence-backend
```

#### 3. Installer et configurer Nginx

```bash
sudo apt-get install nginx
sudo cp docs/nginx.conf /etc/nginx/sites-available/presence-esisar
sudo ln -s /etc/nginx/sites-available/presence-esisar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Sécurité

### Points clés

1. **Chiffrement des passwords côté client**
   - Simple obfuscation en base64 (localStorage)
   - À améliorer en production (Web Crypto API)

2. **Communication SMTP**
   - Utilise STARTTLS (Port 587)
   - Décodage temporaire du password à chaque envoi
   - Aucun stockage du password côté serveur

3. **CORS**
   - Configuré pour le domaine du frontend
   - À ajuster en production

4. **Validation des fichiers**
   - Types MIME vérifiés
   - Taille limite: 10 MB
   - Noms obfuscés côté serveur

### Recommandations supplémentaires

- [ ] Passer à HTTPS obligatoire
- [ ] Implémenter le Web Crypto API pour le chiffrement client
- [ ] Ajouter une limite de débit (rate limiting)
- [ ] Logger tous les envois d'email
- [ ] Implémenter une authentification utilisateur robuste
- [ ] Ajouter 2FA pour les comptes sensibles
- [ ] Audit de sécurité avant le déploiement en production

---

## 🐛 Troubleshooting

### Erreur: "ECONNREFUSED" au démarrage

**Cause:** Le backend n'est pas actif
```bash
# Vérifier que le backend est bien démarré
cd backend
npm run dev
```

### Erreur: "Failed to send email"

**Vérifications:**
1. **Email/Mot de passe incorrect**
   ```bash
   # Tester avec telnet
   telnet smtps.esisar.grenoble-inp.fr 587
   ```

2. **Serveur SMTP indisponible**
   - Vérifier la connectivité réseau
   - Contacter le support Esisar

3. **Authentification échouée**
   - Vérifier que l'email est au format: `prenom.nom@esisar.grenoble-inp.fr`
   - Vérifier que le mot de passe est à jour

### Erreur: "File size exceeds limit"

- Taille max acceptée: **10 MB**
- Compresser l'image/PDF avant l'upload

### PWA ne s'installe pas

1. Vérifier que le site est en **HTTPS** (obligatoire)
2. Vérifier que `manifest.json` est présent
3. Vérifier le `service worker` dans les DevTools

```javascript
// Console du navigateur
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations))
```

### Fichier n'arrive pas à `apprentissage@esisar.grenoble-inp.fr`

Vérifications:
1. Email bien reçu localement (vérifier les logs du backend)
2. Adresse email destinataire correcte
3. Vérifier les filtres anti-spam de la boîte réceptrice

```bash
# Vérifier les logs du backend
docker logs presence-backend
# ou
tail -f /var/log/syslog | grep presence-backend
```

---

## 📞 Support

Pour tout problème:
1. Vérifier les logs du backend: `npm run dev`
2. Consulter la console du navigateur (F12)
3. Tester la connexion SMTP manuellement
4. Ouvrir une issue sur GitHub

---

## 📝 License

MIT - Voir le fichier LICENSE pour plus de détails.
