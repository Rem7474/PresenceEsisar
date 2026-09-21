/** Objet du mail : le nom du fichier sans son extension. */
export const buildSubject = (filename) => filename.replace(/\.[^.]+$/, '');

/** Le nom de l'attestation est rappelé dans le corps : certaines applications ignorent l'objet d'un partage. */
export const buildBody = (subject) =>
  `Bonjour,\n\nVeuillez trouver ci-joint mon attestation de présence : ${subject}.\n\nCordialement`;

/** Lien mailto: (ne peut pas contenir de pièce jointe). */
export const buildMailto = (recipient, subject, body) =>
  `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
