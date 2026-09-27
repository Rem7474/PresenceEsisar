import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const bool = (value, fallback) => (value === undefined || value === '' ? fallback : value !== 'false');

export const config = {
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  // Nombre de reverse proxies devant l'app (nécessaire pour l'IP réelle du client).
  trustProxy: Number.parseInt(process.env.TRUST_PROXY ?? '1', 10),
  staticDir: process.env.STATIC_DIR ?? path.resolve(here, '../public'),
  recipient: process.env.RECIPIENT_EMAIL ?? 'apprentissage@esisar.grenoble-inp.fr',
  mailSubject: process.env.MAIL_SUBJECT ?? 'feuille de présence - 5App',
  zimbra: {
    // false : l'envoi direct est désactivé, seul l'envoi via une application e-mail externe reste proposé.
    enabled: bool(process.env.DIRECT_SEND_ENABLED ?? process.env.SMTP_ENABLED, true),
    url: (process.env.ZIMBRA_URL ?? 'https://mail-etu.esisar.grenoble-inp.fr').replace(/\/+$/, '')
  },
  maxFileSize: 10 * 1024 * 1024
};
