const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
};

export const ACCEPTED_TYPES = Object.keys(EXTENSIONS);
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Même nettoyage que le serveur, qui reste l'autorité sur le nom final. */
const cleanName = (name) =>
  [...name]
    .map((char) => (char.codePointAt(0) < 0x20 || '/\\:*?"<>|'.includes(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

export const buildFilename = (name, week, mimeType) =>
  `Attestation présence P2027-${cleanName(name)}-Esisar-Semaine ${week}.${EXTENSIONS[mimeType] ?? 'jpg'}`;
