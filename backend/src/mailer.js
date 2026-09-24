import nodemailer from 'nodemailer';
import { config } from './config.js';

export class MailError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const UNREACHABLE_CODES = ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'EHOSTUNREACH'];

let transporterInstance = null;

export const getTransporter = () => {
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      requireTLS: !config.smtp.secure,
      tls: { rejectUnauthorized: config.smtp.rejectUnauthorized },
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000
    });
  }
  return transporterInstance;
};

/**
 * Envoie l'attestation via le SMTP configuré sur le serveur.
 * Destinataire : service apprentissage (config.recipient).
 * Copie (cc) et réponse (replyTo) : adresse e-mail de l'étudiant.
 */
export const sendPresenceEmail = async ({ name, email, filename, subject, content }) => {
  const transporter = getTransporter();

  try {
    const cleanName = name.replace(/["\r\n]/g, '').trim();
    const mailSubject = (subject || config.mailSubject || 'feuille de présence - 5App').trim();

    await transporter.sendMail({
      from: `"${cleanName} (via Présence Esisar)" <${config.smtp.from}>`,
      to: config.recipient,
      cc: email,
      replyTo: `"${cleanName}" <${email}>`,
      subject: mailSubject,
      text: `Bonjour,\n\nVeuillez trouver ci-joint l'attestation de présence de ${cleanName}.\n\nÉtudiant : ${cleanName} (${email})\nFichier : ${filename}\n\nCordialement`,
      attachments: [{ filename, content }]
    });
  } catch (error) {
    console.error(`Échec d'envoi SMTP (${error.code ?? 'UNKNOWN'}): ${error.message}`);
    if (error.code === 'EAUTH') {
      throw new MailError('Échec d\'authentification du serveur SMTP d\'envoi.', 502);
    }
    if (UNREACHABLE_CODES.includes(error.code)) {
      throw new MailError('Serveur SMTP injoignable, réessayez plus tard.', 502);
    }
    throw new MailError("Échec de l'envoi de l'e-mail.", 502);
  }
};
