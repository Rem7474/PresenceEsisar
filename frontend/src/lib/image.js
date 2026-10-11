// Compression des photos avant envoi : une feuille de présence reste lisible à ~2000 px en JPEG.

export const MAX_DIMENSION = 2000;
export const JPEG_QUALITY = 0.8;

/** Réduit les dimensions pour que le grand côté ne dépasse pas `max`, sans jamais agrandir. */
export const fitWithin = (width, height, max = MAX_DIMENSION) => {
  const ratio = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
};

/** Nom du fichier compressé : même base, extension .jpg. */
export const jpegName = (name) => `${name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`;

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Redimensionne et ré-encode une image en JPEG. Retourne le fichier d'origine si le navigateur
 * ne sait pas la décoder ou si le résultat n'est pas plus léger.
 */
export const compressImage = async (file) => {
  let bitmap;
  try {
    // Applique l'orientation EXIF : la photo reste à l'endroit après ré-encodage.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    // Fond blanc : un PNG transparent deviendrait noir en JPEG.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: Date.now() });
  } catch (error) {
    console.warn('Compression impossible, envoi du fichier original:', error);
    return file;
  } finally {
    bitmap?.close();
  }
};
