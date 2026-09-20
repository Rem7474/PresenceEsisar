# Déploiement sur Un Seul Port

Par défaut, le backend Express est configuré pour servir aussi le frontend compilé. Cela permet d'avoir une seule URL pour accéder à l'application entière.

## 🎯 Architecture

```
Client HTTP
    ↓
http://localhost:3000
    ↓
Backend Express (Port 3000)
    ├─ /api/*         → Routes API
    ├─ /              → Frontend statique (index.html)
    ├─ /js/*          → Fichiers JavaScript
    ├─ /css/*         → Fichiers CSS
    └─ /*             → Fallback SPA (index.html)
```

## 🚀 Setup pour Production (Un Seul Port)

### Étape 1: Build du Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

**Résultat:** Les fichiers compilés sont générés dans `frontend/dist/`

### Étape 2: Configurer le Backend

```bash
cd backend
cp .env.example .env
# Éditer .env selon vos besoins
```

Exemple `backend/.env`:
```bash
PORT=3000
NODE_ENV=production
RECIPIENT_EMAIL=apprentissage@esisar.grenoble-inp.fr
FRONTEND_URL=http://localhost:3000
```

### Étape 3: Installer et Lancer le Backend

```bash
npm install
npm start  # ou: NODE_ENV=production node server.js
```

**Résultat:** 
```
Server running on http://localhost:3000
```

### Étape 4: Accéder à l'application

Ouvrir le navigateur: **http://localhost:3000**

---

## 🐳 Docker (Single Port) - RECOMMANDÉ

Le Dockerfile utilise un **multi-stage build** qui :
1. ✅ Build le frontend dans le container
2. ✅ Build le backend dans le container
3. ✅ Copie le frontend compilé vers le backend
4. ✅ Sert tout sur un seul port

### Déployer avec Docker (Plus Simple !)

```bash
# 1. Configurer backend/.env
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos paramètres

# 2. Lancer Docker Compose (build + démarrage automatique)
docker-compose up -d

# 3. C'est tout ! Accéder à l'application
# http://localhost:3000
```

### Pourquoi c'est mieux ?

| Approche | Setup | Commandes | Complexité |
|----------|-------|-----------|-----------|
| Host npm | 4 étapes | `npm build`, `npm start`, `docker-compose` | ❌ Complexe |
| Docker multi-stage | 2 étapes | `cp .env.example`, `docker-compose up` | ✅ Simple |

**Aucun build npm nécessaire sur l'host !**

---

## 📊 Comparaison: Développement vs Production

| Aspect | Développement | Production |
|--------|---------------|-----------|
| **Frontend** | Vite (2 ports) | Build static + serveur backend |
| **Backend** | Node (port 3000) | Node (port 3000) |
| **Ports** | 2 (5173 + 3000) | 1 (3000) |
| **Commande** | `npm run dev` (2x) | `npm start` (1x) |
| **Performance** | Hot reload | Optimisé |

## 🔄 Workflow Complet

### Développement

```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && npm run dev
```

Accéder à **http://localhost:5173** (Frontend avec HMR)

### Production

```bash
# Build une fois
cd frontend && npm run build

# Lancer backend (qui sert aussi le frontend)
cd backend && npm start
```

Accéder à **http://localhost:3000** (Frontend + Backend sur le même port)

---

## 🔒 Configuration CORS pour Production

En production sur un seul port, CORS n'est plus nécessaire (même origine). Vous pouvez désactiver CORS :

```javascript
// backend/server.js - OPTIONNEL en production
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
}
```

Ou laisser tel quel (ne cause pas de problème).

---

## 📁 Structure après Build

```
PresenceEsisar/
├── frontend/
│   ├── dist/                    # ✅ Build output
│   │   ├── index.html
│   │   ├── assets/
│   │   │   ├── app-xxx.js
│   │   │   └── style-xxx.css
│   │   └── ...
│   └── src/                     # Source (pas utilisé en production)
│
├── backend/
│   ├── server.js                # Sert frontend/dist + API
│   ├── .env                     # Configuration
│   └── ...
```

---

## 🧪 Test en Production (Local)

```bash
# Build
cd frontend && npm run build && cd ..

# Vérifier le build
ls -la frontend/dist/

# Test avec backend
cd backend
NODE_ENV=production npm start

# Tester
curl http://localhost:3000
curl http://localhost:3000/api/health
```

---

## 🚨 Troubleshooting

### "Cannot GET /" - Frontend non trouvé

**Cause:** `frontend/dist/` n'existe pas

**Solution:**
```bash
cd frontend
npm run build
cd ..
npm start
```

### "404 on API calls"

**Cause:** Frontend tente d'appeler `/api/*` mais le backend n'écoute pas

**Solution:** Vérifier que les routes API existent dans `backend/server.js`

### Port 3000 déjà utilisé

```bash
# Changer le port
PORT=8000 npm start

# Ou tuer le processus
lsof -i :3000
kill -9 <PID>
```

---

## 🌐 Déploiement sur Serveur

### Serveur Linux (exemple)

```bash
# 1. Clone repo
git clone https://github.com/Rem7474/PresenceEsisar.git
cd PresenceEsisar

# 2. Build frontend
cd frontend
npm install
npm run build
cd ..

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos valeurs
cd ..

# 4. Lancer avec PM2 (optionnel mais recommandé)
npm install -g pm2
pm2 start backend/server.js --name presence-esisar --env "NODE_ENV=production"
pm2 save

# 5. Accéder
# http://votre-serveur.com:3000
```

### Avec Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 💡 Optimisations Production

- ✅ Frontend: Minification + gzip (Vite)
- ✅ Backend: `NODE_ENV=production`
- ✅ HTTPS: Configurer SSL/TLS
- ✅ Logging: Ajouter logs structurés
- ✅ Monitoring: PM2+, New Relic, DataDog
- ✅ Scaling: Load balancer + cluster Node.js

---

**Production Ready! 🚀**
