export const DEFAULT_SUBJECT = 'feuille de présence - 5App';

/** Objet du mail d'attestation. */
export const buildSubject = (customSubject) => customSubject || DEFAULT_SUBJECT;

/** Le nom de l'attestation est rappelé dans le corps : certaines applications ignorent l'objet d'un partage. */
export const buildBody = (filename) => {
  const attestation = filename ? filename.replace(/\.[^.]+$/, '') : '';
  return `Bonjour,\n\nVeuillez trouver ci-joint mon attestation de présence${attestation ? ` : ${attestation}` : ''}.\n\nCordialement`;
};

/** Lien mailto: (ne peut pas contenir de pièce jointe). */
export const buildMailto = (recipient, subject, body) =>
  `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
