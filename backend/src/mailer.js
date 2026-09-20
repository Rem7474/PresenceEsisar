import nodemailer from 'nodemailer';
import { config } from './config.js';

export class MailError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const UNREACHABLE_CODES = ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'EHOSTUNREACH'];

/**
 * Envoie l'attestation via le SMTP de l'école (STARTTLS), en s'authentifiant
 * avec les identifiants de l'étudiant. Le mot de passe n'est ni journalisé ni conservé.
 */
export const sendPresenceEmail = async ({ email, password, filename, content }) => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    requireTLS: true,
    tls: { rejectUnauthorized: config.smtp.rejectUnauthorized },
    auth: { user: email, pass: password },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000
  });

  try {
    await transporter.sendMail({
      from: email,
      to: config.recipient,
      subject: filename.replace(/\.[^.]+$/, ''),
      text: `Veuillez trouver ci-joint l'attestation de présence.\n\nFichier : ${filename}`,
      attachments: [{ filename, content }]
    });
  } catch (error) {
    console.error(`Échec d'envoi SMTP (${error.code ?? 'UNKNOWN'}): ${error.message}`);
    if (error.code === 'EAUTH') {
      throw new MailError('Authentification refusée par le serveur SMTP : identifiant ou mot de passe incorrect.', 401);
    }
    if (UNREACHABLE_CODES.includes(error.code)) {
      throw new MailError('Serveur SMTP injoignable, réessayez plus tard.', 502);
    }
    throw new MailError("Échec de l'envoi de l'e-mail.", 502);
  } finally {
    transporter.close();
  }
};
