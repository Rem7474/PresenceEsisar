import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { buildFilename, detectFileType, isValidEmail, isValidWeek, sanitizeName } from './attachment.js';
import { MailError, sendPresenceEmail as defaultSend } from './mailer.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 1, fields: 6, fieldSize: 1024 }
});

const isBoundedString = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;

export const createApp = ({ sendPresenceEmail = defaultSend } = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      // Le HTTPS public (et donc HSTS) est géré par le reverse proxy en amont.
      strictTransportSecurity: false,
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'blob:', 'data:'],
          'style-src': ["'self'"],
          'font-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"]
        }
      }
    })
  );

  // Seuls les échecs sont comptés : limite le brute-force d'identifiants SMTP sans gêner l'usage normal.
  const failedAttempts = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Trop de tentatives, réessayez dans quelques minutes.' }
  });

  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok' });
  });

  // Utilisé par le frontend pour l'envoi via une application e-mail externe.
  app.get('/api/config', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ recipient: config.recipient });
  });

  app.post('/api/upload', failedAttempts, upload.single('file'), async (req, res, next) => {
    try {
      const { name, email, password, week: rawWeek } = req.body;
      const week = Number(rawWeek);

      if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni.' });
      if (!isBoundedString(name, 100) || !sanitizeName(name)) return res.status(400).json({ error: 'Nom invalide.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
      if (!isBoundedString(password, 256)) return res.status(400).json({ error: 'Mot de passe manquant.' });
      if (!isValidWeek(week)) return res.status(400).json({ error: 'Numéro de semaine invalide.' });

      const type = detectFileType(req.file.buffer);
      if (!type) return res.status(400).json({ error: 'Format non supporté (JPEG, PNG, WebP ou PDF).' });

      await sendPresenceEmail({
        email,
        password,
        filename: buildFilename(name, week, type.ext),
        content: req.file.buffer
      });

      res.set('Cache-Control', 'no-store').json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue.' }));

  app.use(
    express.static(config.staticDir, {
      index: false,
      setHeaders: (res, filePath) => {
        // Les fichiers de /assets sont hachés par Vite ; le reste doit toujours être revalidé.
        const hashed = filePath.includes(`${path.sep}assets${path.sep}`);
        res.set('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
      }
    })
  );
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.set('Cache-Control', 'no-cache').sendFile(path.join(config.staticDir, 'index.html'));
  });

  // Le middleware d'erreur Express doit déclarer 4 arguments.
  app.use((error, _req, res, _next) => {
    if (error instanceof MailError) return res.status(error.status).json({ error: error.message });
    if (error instanceof multer.MulterError) {
      const tooBig = error.code === 'LIMIT_FILE_SIZE';
      return res
        .status(tooBig ? 413 : 400)
        .json({ error: tooBig ? 'Fichier trop volumineux (10 Mo max).' : 'Requête invalide.' });
    }
    console.error('Erreur inattendue:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  });

  return app;
};
