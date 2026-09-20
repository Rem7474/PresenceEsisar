# Attestation Présence Esisar

PWA permettant à un étudiant de photographier (ou importer) sa feuille de présence hebdomadaire et de l'envoyer
par e-mail au service apprentissage, via le SMTP de l'école.

Le fichier joint est nommé `Attestation présence P2027- [NOM] - Esisar- Semaine [N].[ext]`
(semaine ISO 8601, extension déduite du contenu réel du fichier).

## Démarrage

```bash
docker compose up -d --build
```

L'application est servie en HTTPS sur <https://localhost> (certificat auto-signé : à accepter une fois dans le
navigateur). Aucune configuration n'est obligatoire.

Pour un déploiement sur un vrai domaine, copier `.env.example` en `.env` et renseigner `DOMAIN` : Caddy obtient
et renouvelle automatiquement un certificat Let's Encrypt (ports 80 et 443 accessibles depuis Internet).
Une PWA n'est installable que sous HTTPS avec un certificat de confiance.

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `DOMAIN` | `localhost` | Nom de domaine servi par Caddy |
| `RECIPIENT_EMAIL` | `apprentissage@esisar.grenoble-inp.fr` | Destinataire des attestations |
| `SMTP_HOST` / `SMTP_PORT` | `smtps.esisar.grenoble-inp.fr` / `587` | Serveur SMTP (STARTTLS obligatoire) |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `true` | `false` uniquement si le SMTP présente un certificat non reconnu |

Mise à jour : `git pull && docker compose up -d --build`. Logs : `docker compose logs -f`.

## Architecture

```
navigateur ──HTTPS──> caddy (80/443) ──HTTP──> app (Node, port interne 3000) ──STARTTLS──> SMTP école
```

- `caddy` : reverse proxy, TLS automatique, compression, limite de taille des requêtes (12 Mo). Seul service exposé.
- `app` : image unique (build multi-étapes) contenant l'API Express 5 et la PWA Vue 3 compilée par Vite.
  Non exposée, utilisateur non-root, système de fichiers en lecture seule, toutes les capabilities retirées.

```
backend/    API Express (server.js, src/app.js, mailer.js, attachment.js) + tests
frontend/   PWA Vue 3 / Vite (src/, public/ : manifest, service worker, icônes) + tests
Dockerfile, docker-compose.yml, Caddyfile, .env.example
```

## Sécurité

- **Identifiants** : saisis une seule fois, le mot de passe est chiffré en AES-GCM dans le navigateur ; la clé,
  non exportable, est stockée dans IndexedDB. Le serveur reçoit le mot de passe en HTTPS pour la durée de
  l'envoi uniquement : il n'est ni stocké ni journalisé.
- **SMTP** : STARTTLS obligatoire, certificat du serveur vérifié.
- **API** : type de fichier vérifié sur le contenu (JPEG, PNG, WebP, PDF, 10 Mo max), champs validés, nom de
  fichier assaini, limitation des tentatives échouées (20 / 15 min / IP) contre le brute-force d'identifiants.
- **Web** : CSP stricte, HSTS, en-têtes Helmet, aucune source de script ou de style inline.

## API

`POST /api/upload` (`multipart/form-data`) : `file`, `name`, `email`, `password`, `week`.
Réponses : `200 {success:true}`, `400` requête invalide, `401` authentification SMTP refusée, `413` fichier
trop gros, `429` trop de tentatives, `502` SMTP injoignable ou envoi refusé.
`GET /api/health` : `{status:"ok"}`.

## Développement local

Node.js >= 22.12.

```bash
cd backend  && npm ci && npm start     # API sur :3000
cd frontend && npm ci && npm run dev   # Vite sur :5173, proxy /api -> :3000
npm test                               # dans backend/ et dans frontend/
```

Le service worker n'est actif que dans le build de production.
