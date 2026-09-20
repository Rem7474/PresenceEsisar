# Configuration d'Environnement - Production

## 🎯 Configuration Essentielle

```
Backend Express (Port 3000)
├─ /api/*         → Routes API  
└─ / + /*         → Frontend Statique (compilé)

FRONTEND_URL = http://localhost:3000
(L'URL où le frontend est servi)
```

## 📋 Variables .env

```bash
# Port du serveur backend
PORT=3000

# URL d'accès au frontend (pour CORS)
# Local: http://localhost:3000
# Serveur: https://votre-domaine.com
FRONTEND_URL=http://localhost:3000

# Mode production
NODE_ENV=production

# Email destinataire des feuilles de présence
RECIPIENT_EMAIL=apprentissage@esisar.grenoble-inp.fr
```

## 🚀 Configuration par Déploiement

### Local (Docker)
```bash
PORT=3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
```

### Serveur Distant
```bash
PORT=3000
FRONTEND_URL=https://votre-domaine.com
NODE_ENV=production
```

### Port Custom
```bash
PORT=8000
FRONTEND_URL=http://localhost:8000
NODE_ENV=production
```

**Règle : FRONTEND_URL = l'URL accessible du frontend (même port que PORT en mono-port)**

---

**Dernière mise à jour:** 2024-09-20
