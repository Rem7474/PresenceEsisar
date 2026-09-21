/** Objet du mail : le nom du fichier sans son extension. */
export const buildSubject = (filename) => filename.replace(/\.[^.]+$/, '');

export const MAIL_BODY = "Bonjour,\n\nVeuillez trouver ci-joint mon attestation de présence.\n\nCordialement";

/** Lien mailto: (ne peut pas contenir de pièce jointe). */
export const buildMailto = (recipient, subject, body) =>
  `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
