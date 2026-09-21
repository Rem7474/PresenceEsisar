# Attestation Présence Esisar

PWA permettant à un étudiant de photographier (ou importer) sa feuille de présence hebdomadaire et de l'envoyer
par e-mail au service apprentissage, via le SMTP de l'école.

Le fichier joint est nommé `Attestation présence P2027- [NOM] - Esisar- Semaine [N].[ext]`
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
| `SMTP_HOST` / `SMTP_PORT` | `smtps.esisar.grenoble-inp.fr` / `465` | Serveur SMTP : 465 = SSL/TLS, autre port (587) = STARTTLS |
| `SMTP_SECURE` | déduit du port | `true` (SSL/TLS) ou `false` (STARTTLS) pour forcer le mode |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `true` | `false` uniquement si le SMTP présente un certificat non reconnu |

Mise à jour : `git pull && docker compose up -d --build`. Logs : `docker compose logs -f`.

## Architecture

```
navigateur ──HTTPS──> nginx (public) ──HTTPS auto-signé──> caddy ──HTTP──> app (Node) ──SSL/TLS──> SMTP école
```

- `caddy` : HTTPS interne auto-signé, compression, limite de taille des requêtes (12 Mo). Seul service publié.
  Il conserve l'en-tête `X-Forwarded-For` de nginx pour que la limitation de tentatives porte sur l'IP réelle.
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
- **SMTP** : SSL/TLS (port 465) ou STARTTLS obligatoire (587), certificat du serveur vérifié.
- **API** : type de fichier vérifié sur le contenu (JPEG, PNG, WebP, PDF, 10 Mo max), champs validés, nom de
  fichier assaini, limitation des tentatives échouées (20 / 15 min / IP) contre le brute-force d'identifiants.
- **Web** : CSP stricte, en-têtes Helmet (HSTS laissé à nginx), aucune source de script ou de style inline.

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
