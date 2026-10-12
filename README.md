# Attestation Présence Esisar

PWA permettant à un étudiant de photographier (ou importer) sa feuille de présence hebdomadaire et de l'envoyer
par e-mail au service apprentissage, directement depuis sa messagerie étudiante officielle (via l'API Zimbra de l'école).

Le fichier joint est nommé `Attestation présence P2027-[NOM]-Esisar-Semaine [N].[ext]`
(semaine ISO 8601, extension déduite du contenu réel du fichier).

## Démarrage

```bash
docker compose up -d --build
```

La stack expose un unique port HTTPS avec un certificat **auto-signé** (`127.0.0.1:8443` par défaut). Le HTTPS
public (certificat de confiance, HSTS, nom de domaine) est assuré par le reverse proxy nginx en amont, qui ne doit
pas vérifier ce certificat interne :

```nginx
location / {
    proxy_pass https://127.0.0.1:8443;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 12m;   # les photos dépassent la limite par défaut de nginx (1 Mo)
}
```

Une PWA n'est installable que sous HTTPS avec un certificat de confiance : c'est le rôle de nginx.
Configuration facultative via `.env` (voir `.env.example`, chaque variable a une valeur par défaut) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `HTTPS_PORT` | `8443` | Port HTTPS publié sur l'hôte |
| `BIND_ADDRESS` | `127.0.0.1` | Interface d'écoute (`0.0.0.0` si nginx est sur une autre machine) |
| `RECIPIENT_EMAIL` | `apprentissage@esisar.grenoble-inp.fr` | Destinataire des attestations |
| `MAIL_SUBJECT` | `feuille de présence - 5App` | Objet du mail envoyé |
| `DIRECT_SEND_ENABLED` | `true` | `false` désactive l'envoi direct depuis Zimbra |
| `ZIMBRA_URL` | `https://mail-etu.esisar.grenoble-inp.fr` | URL de base de la messagerie Zimbra étudiante |
| `APP_VERSION` | `git describe` | Version applicative injectée au build (tag Git ou hash) |

Mise à jour : `git pull && docker compose up -d --build`. Logs : `docker compose logs -f`.

## Versioning & Mises à jour PWA

L'application injecte automatiquement le tag Git courant (`git describe --tags --always`) au moment du build dans :
1. La constante client `__APP_VERSION__` (affichée dans la console du navigateur au démarrage).
2. Le nom de cache du Service Worker (`CACHE_NAME = 'presence-esisar-<version>'` dans `dist/sw.js`).

Pour publier une nouvelle version :
```bash
git tag v2.1.0
git push --tags
docker compose up -d --build
```

Le push d'un tag `vX.Y.Z` déclenche le workflow `Release` : tests, publication de l'image `ghcr.io/rem7474/presence-esisar` (tags `X.Y.Z`, `X.Y`, `latest`) et création de la release GitHub avec notes générées.

Dès le déploiement :
- La navigation étant en **Network-First**, les clients connectés récupèrent immédiatement la nouvelle version de l'application.
- Le Service Worker détecte le changement de version, active le nouveau cache (`skipWaiting`), supprime automatiquement l'ancien cache (`activate`) et prend le relais (`clients.claim`).

## Architecture

```
navigateur ──HTTPS──> nginx (public) ──HTTPS auto-signé──> caddy ──HTTP──> app (Node) ──HTTPS (443)──> Zimbra école
```

- `caddy` : HTTPS interne auto-signé, compression, limite de taille des requêtes (12 Mo). Seul service publié.
  Il conserve l'en-tête `X-Forwarded-For` de nginx pour que la limitation de tentatives porte sur l'IP réelle.
- `app` : image unique (build multi-étapes) contenant l'API Express 5 et la PWA Vue 3 compilée par Vite.
  Non exposée, utilisateur non-root, système de fichiers en lecture seule, toutes les capabilities retirées.

```
backend/    API Express (server.js, src/app.js, zimbra.js, attachment.js) + tests
frontend/   PWA Vue 3 / Vite (src/, public/ : manifest, service worker, icônes) + tests
Dockerfile, docker-compose.yml, Caddyfile, .env.example
.github/    CI (tests, build, Docker), release GHCR, CodeQL, Dependabot
```

## Sécurité

- **Identifiants de l'étudiant** :
  - **Chiffrement local AES-GCM (256 bits)** : la clé cryptographique est générée dans le navigateur et conservée dans `IndexedDB` (non-exportable). Le `localStorage` ne contient que le blob chiffré, inutilisable hors de ce navigateur.
  - **Aucun stockage serveur** : le mot de passe transite uniquement en HTTPS chiffré lors de l'upload. Il n'est **jamais stocké** sur disque, en base de données, ni consigné dans aucun fichier de log.
- **Envoi Zimbra** :
  - Authentification SOAP (`AuthRequest`) avec les identifiants étudiants.
  - Téléversement temporaire de l'attestation (`/service/upload?fmt=raw`).
  - Distribution du mail (`SendMsgRequest`) expédié directement depuis la boîte étudiante officielle avec copie automatique (`cc`).
- **API** : type de fichier vérifié sur le contenu (JPEG, PNG, WebP, PDF, 10 Mo max), champs validés, nom de fichier assaini, limitation de débit (`express-rate-limit`, 20 échecs max par 15 min).
- **Web** : CSP stricte, en-têtes Helmet (HSTS laissé à nginx), aucune source de script ou de style inline.

## API

`POST /api/upload` (`multipart/form-data`) : `file`, `name`, `email`, `password`, `week`.
Réponses : `200 {success:true}`, `400` requête invalide, `401` identifiants incorrects, `413` fichier trop gros, `429` trop de tentatives,
`502` Zimbra injoignable ou envoi refusé.
`GET /api/health` : `{status:"ok"}`.
`GET /api/config` : `{recipient, smtpEnabled, subject}`.

## Développement local

Node.js >= 22.12.

```bash
cd backend  && npm ci && npm start     # API sur :3000
cd frontend && npm ci && npm run dev   # Vite sur :5173, proxy /api -> :3000
npm test                               # dans backend/ et dans frontend/
```

Le service worker n'est actif que dans le build de production.
