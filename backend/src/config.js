import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const bool = (value, fallback) => (value === undefined || value === '' ? fallback : value !== 'false');

const smtpPort = Number.parseInt(process.env.SMTP_PORT ?? '465', 10);

export const config = {
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  // Nombre de reverse proxies devant l'app (nécessaire pour l'IP réelle du client).
  trustProxy: Number.parseInt(process.env.TRUST_PROXY ?? '1', 10),
  staticDir: process.env.STATIC_DIR ?? path.resolve(here, '../public'),
  recipient: process.env.RECIPIENT_EMAIL ?? 'apprentissage@esisar.grenoble-inp.fr',
  smtp: {
    // false : l'envoi direct est désactivé, seul l'envoi via une application e-mail externe reste proposé.
    enabled: bool(process.env.SMTP_ENABLED, true),
    host: process.env.SMTP_HOST ?? 'smtps.esisar.grenoble-inp.fr',
    port: smtpPort,
    // 465 : SSL/TLS dès la connexion ; autres ports (587) : STARTTLS obligatoire.
    secure: bool(process.env.SMTP_SECURE, smtpPort === 465),
    rejectUnauthorized: bool(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? (process.env.SMTP_USER || 'apprentissage@esisar.grenoble-inp.fr')
  },
  maxFileSize: 10 * 1024 * 1024
};
