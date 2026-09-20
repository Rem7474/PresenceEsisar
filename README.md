# Attestation Présence Esisar

Une **Progressive Web App (PWA)** moderne pour automatiser l'envoi des feuilles de présence hebdomadaires des alternants.

## 🎯 Fonctionnalités

✅ **Interface PWA installable** - Fonctionne en mode offline  
✅ **Prise de photo** - Caméra directement depuis le smartphone  
✅ **Sélection de fichier** - Upload d'images ou PDF  
✅ **Calcul automatique de semaine** - Détecte la semaine actuelle  
✅ **Envoi par email** - Via le serveur SMTP Esisar  
✅ **Stockage persistant** - Sauvegarde des identifiants (localStorage)  
✅ **Design responsive** - Fonctionne sur tous les appareils  

## 📁 Structure du Projet

```
PresenceEsisar/
├── frontend/              # PWA Vue 3 + Vite
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   └── views/
│   │       ├── LoginView.vue
│   │       └── DashboardView.vue
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── backend/               # Express.js API
│   ├── services/
│   │   └── emailService.js
│   ├── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docs/                  # Documentation
│   ├── GUIDE.md          # Guide complet d'installation
│   └── nginx.conf        # Configuration du reverse proxy
│
├── docker-compose.yml    # Stack Docker
└── README.md            # Ce fichier
```

## ⚡ Démarrage Rapide

### Développement Local

```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

Accéder à `http://localhost:5173`

### Production avec Docker

```bash
docker-compose up -d
```

Accéder à `http://localhost`

**Voir le [Guide Complet](docs/GUIDE.md) pour les détails.**

## 🔧 Stack Technique

### Frontend
- **Vue 3** - Framework progressif
- **Vite** - Build tool ultra-rapide
- **Service Worker** - Support offline
- **LocalStorage** - Persistance des données

### Backend
- **Node.js 20+** - Runtime JavaScript
- **Express.js** - Framework web minimaliste
- **Nodemailer** - Client SMTP
- **Multer** - Gestion des uploads

### Infrastructure
- **Docker & Docker Compose** - Conteneurisation
- **Nginx** - Reverse proxy
- **SMTP Esisar** - Service d'envoi email

## 📋 Cahier des Charges

L'application respecte strictement le cahier des charges:

1. ✅ Enregistrement des identifiants (Nom, Email, Mot de passe)
2. ✅ Prise de photo / Upload de fichier
3. ✅ Calcul automatique du numéro de semaine
4. ✅ Affichage du nom de fichier généré
5. ✅ Envoi par email à `apprentissage@esisar.grenoble-inp.fr`
6. ✅ Format de nom: `Attestation présence P2027- [NOM] - Esisar- Semaine [N]`
7. ✅ Reverse proxy compatible (Nginx)

## 🔐 Sécurité

- **Obfuscation des passwords** (localStorage)
- **Validation des fichiers** (type MIME + taille)
- **STARTTLS SMTP** (Port 587)
- **CORS configuré** pour le domaine frontend
- **Escape HTML** pour prévenir les injections

## 📱 Compatibilité

| Navigateur | Support |
|-----------|---------|
| Chrome    | ✅ Complet |
| Firefox   | ✅ Complet |
| Safari    | ✅ Complet |
| Edge      | ✅ Complet |

Installation PWA: Disponible sur iOS, Android, Chrome desktop

## 🚀 Déploiement

3 options disponibles:

1. **Docker Compose** (Recommandé)
2. **Linux natif** avec systemd + Nginx
3. **Heroku/Vercel** (avec adaptations)

Voir le [Guide d'Installation](docs/GUIDE.md) pour les instructions détaillées.

## 📞 Troubleshooting

### Email ne s'envoie pas
- Vérifier les credentials SMTP
- Vérifier la connectivité vers `smtps.esisar.grenoble-inp.fr:587`
- Vérifier les logs du backend

### PWA ne s'installe pas
- HTTPS obligatoire en production
- Vérifier `manifest.json` et service worker

### Fichier trop volumineux
- Taille max: **10 MB**
- Compresser l'image avant upload

Voir le [Guide Complet](docs/GUIDE.md#-troubleshooting) pour plus de solutions.

## 📄 License

MIT - Libre d'utilisation

## 👨‍💻 Développeur

Créé pour la promotion d'alternants Esisar  
2024-2025

---

**Besoin d'aide?** → Consultez le [Guide Complet](docs/GUIDE.md)  
**Signaler un bug?** → Ouvrez une issue sur GitHub
