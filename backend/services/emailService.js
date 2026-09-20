import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: 'smtps.esisar.grenoble-inp.fr',
  port: 587,
  secure: false,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  }
};

const RECIPIENT_EMAIL = 'apprentissage@esisar.grenoble-inp.fr';

const decodePassword = (encodedPassword) => {
  try {
    return Buffer.from(encodedPassword, 'base64').toString('utf-8');
  } catch (e) {
    return encodedPassword;
  }
};

export const sendPresenceEmail = async (userEmail, encodedPassword, filename, fileBuffer, mimeType) => {
  try {
    const password = decodePassword(encodedPassword);

    const transporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: {
        user: userEmail,
        pass: password
      }
    });

    const mailOptions = {
      from: userEmail,
      to: RECIPIENT_EMAIL,
      subject: `Attestation de Présence - ${filename}`,
      text: `Veuillez trouver ci-joint l'attestation de présence.\n\nFichier: ${filename}`,
      html: `
        <p>Veuillez trouver ci-joint l'attestation de présence.</p>
        <p><strong>Fichier:</strong> ${escapeHtml(filename)}</p>
        <p>Cordialement</p>
      `,
      attachments: [
        {
          filename: filename,
          content: fileBuffer,
          contentType: mimeType
        }
      ]
    };

    await transporter.verify();
    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);

    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed - incorrect password';
    } else if (error.code === 'EHOSTUNREACH') {
      errorMessage = 'SMTP server unreachable';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
};

const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};
