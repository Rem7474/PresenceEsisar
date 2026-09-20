# 🚀 Démarrage Rapide (5 minutes)

## Installation & Lancement Local

### Étape 1: Installer les dépendances

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Créer le fichier .env
cd ..

# Frontend
cd frontend
npm install
cp .env.example .env  # Créer le fichier .env
cd ..
```

### Étape 2: Configurer Backend & Frontend (optionnel)

**Backend** - Éditer `backend/.env`:
```bash
PORT=3000                                           # Port du serveur
FRONTEND_URL=http://localhost:5173                 # URL du frontend
RECIPIENT_EMAIL=apprentissage@esisar.grenoble-inp.fr  # Email destinataire
```

**Frontend** - Éditer `frontend/.env`:
```bash
VITE_PORT=5173                                      # Port Vite dev server
VITE_BACKEND_URL=http://localhost:3000              # URL du backend
```

### Étape 3: Démarrer le Backend (Terminal 1)

```bash
cd backend
npm run dev
```

**Résultat attendu:**
```
Server running on http://localhost:3000
```

### Étape 4: Démarrer le Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

**Résultat attendu:**
```
VITE v5.0.0 ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Étape 5: Accéder à l'application

Ouvrir dans le navigateur: **http://localhost:5173**

---

## 🧪 Test Complet

### 1. **Créer un compte** (1ère connexion)

Remplir le formulaire:
- **Nom:** Jean Dupont
- **E-mail:** votre-email@esisar.grenoble-inp.fr
- **Mot de passe:** Votre mot de passe SMTP Esisar

Cliquer **"Continuer"**

### 2. **Tester la prise de photo** (optionnel)

Cliquer sur **"📷 Prendre une Photo"**
- Donner l'accès à la caméra quand demandé
- Une photo sera capturée automatiquement

### 3. **Tester l'upload de fichier**

Cliquer sur **"📁 Sélectionner un Fichier"**
- Choisir une image (JPG, PNG, WebP) ou PDF
- Taille max: 10 MB

### 4. **Vérifier le nom du fichier**

Observez le champ **"Nom du fichier final"** 
```
Attestation présence P2027- Jean Dupont - Esisar- Semaine 38.jpg
```

### 5. **Envoyer l'email**

Cliquer sur **"✉️ Envoyer"**

**Vérifier:**
- ✅ Message de succès dans l'app
- ✅ Email reçu à `apprentissage@esisar.grenoble-inp.fr` avec le fichier joint

---

## 🐛 Dépannage Rapide

### Erreur: "Cannot GET /api/upload"
**Cause:** Backend non lancé  
**Solution:** Vérifier que `npm run dev` tourne dans le dossier backend

### Erreur: "Failed to send email"
**Cause:** Email/Mot de passe incorrect ou serveur SMTP indisponible  
**Solution:** Vérifier les identifiants Esisar

### Service Worker non installé
**Cause:** Application nécessite HTTPS pour PWA  
**Solution:** En développement, c'est normal. Voir la production pour HTTPS

---

## ✨ Prochaines Étapes

- 📖 Lire le [Guide Complet](docs/GUIDE.md) pour le déploiement
- 🔌 Consulter [API Documentation](docs/API.md) pour l'intégration
- 🐳 Déployer avec Docker: `docker-compose up -d`

---

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| [README.md](README.md) | Vue d'ensemble du projet |
| [GUIDE.md](docs/GUIDE.md) | **Installation + Déploiement complet** |
| [API.md](docs/API.md) | Endpoints API + exemples |
| [STRUCTURE.md](STRUCTURE.md) | Explication de la structure des fichiers |

---

## 💡 Astuces

### Développement plus rapide
```bash
# Utiliser le mode watch pour rebuild auto
cd frontend
npm run build -- --watch

# Utiliser nodemon pour auto-reload backend
npm install -g nodemon
nodemon backend/server.js
```

### Forcer la réinstallation
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tester l'email sans navigateur
```bash
cd backend
node test-email.js
```

---

**Prêt à utiliser ! 🎉**  
Besoin d'aide → Voir [GUIDE.md](docs/GUIDE.md#-troubleshooting)
