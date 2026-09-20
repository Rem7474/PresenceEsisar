// Validation et nommage de la pièce jointe.

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SIGNATURES = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(PNG_MAGIC) },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP'
  },
  { mime: 'application/pdf', ext: 'pdf', test: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' }
];

/** Détecte le vrai type du fichier à partir de son contenu (le Content-Type client n'est pas fiable). */
export const detectFileType = (buffer) => {
  const match = SIGNATURES.find((s) => buffer.length > 12 && s.test(buffer));
  return match ? { mime: match.mime, ext: match.ext } : null;
};

const isForbiddenChar = (char) => {
  const code = char.codePointAt(0);
  return code < 0x20 || code === 0x7f || '/\\:*?"<>|'.includes(char);
};

/** Retire tout ce qui pourrait casser un nom de fichier ou un en-tête e-mail. */
export const sanitizeName = (name) =>
  [...String(name)]
    .map((char) => (isForbiddenChar(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

export const isValidWeek = (week) => Number.isInteger(week) && week >= 1 && week <= 53;

export const isValidEmail = (email) =>
  typeof email === 'string' &&
  email.length <= 254 &&
  /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/.test(email);

export const buildFilename = (name, week, ext) =>
  `Attestation présence P2027- ${sanitizeName(name)} - Esisar- Semaine ${week}.${ext}`;
