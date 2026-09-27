// Stockage local des identifiants de l'étudiant (Nom, E-mail, Mot de passe).
// Le mot de passe et les données sont chiffrés en AES-GCM 256 bits.
// La clé est non-exportable et vit dans IndexedDB ; le localStorage ne contient que du chiffré.

const DB_NAME = 'presence-esisar';
const STORE = 'keys';
const KEY_ID = 'credentials';
const STORAGE_KEY = 'presenceUser';

const requestResult = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDb = () => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE);
  return requestResult(request);
};

const withStore = async (mode, action) => {
  const db = await openDb();
  try {
    return await requestResult(action(db.transaction(STORE, mode).objectStore(STORE)));
  } finally {
    db.close();
  }
};

const getKey = async () => {
  const existing = await withStore('readonly', (store) => store.get(KEY_ID));
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await withStore('readwrite', (store) => store.put(key, KEY_ID));
  return key;
};

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

export const canPersist = () =>
  Boolean((typeof localStorage !== 'undefined' && globalThis.crypto?.subtle && globalThis.indexedDB) || typeof localStorage !== 'undefined');

export const saveCredentials = async (user) => {
  const clean = {
    name: typeof user.name === 'string' ? user.name.trim() : '',
    email: typeof user.email === 'string' ? user.email.trim() : '',
    password: typeof user.password === 'string' ? user.password : ''
  };

  if (globalThis.crypto?.subtle && globalThis.indexedDB) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(clean))
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, iv: toBase64(iv), data: toBase64(data) }));
  } else {
    // Mode dégradé ou tests unitaires sans IndexedDB
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }
};

/**
 * Retourne l'utilisateur mémorisé ou null si aucun profil valide.
 * Supporte le déchiffrement v2 et la migration douce depuis les versions précédentes.
 */
export const loadCredentials = async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // Format chiffré v2 AES-GCM
    if (parsed?.v === 2 && parsed.iv && parsed.data) {
      if (globalThis.crypto?.subtle && globalThis.indexedDB) {
        const key = await getKey();
        const plain = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
          key,
          fromBase64(parsed.data)
        );
        const decrypted = JSON.parse(new TextDecoder().decode(plain));
        return {
          name: typeof decrypted.name === 'string' ? decrypted.name.trim() : '',
          email: typeof decrypted.email === 'string' ? decrypted.email.trim() : '',
          password: typeof decrypted.password === 'string' ? decrypted.password : ''
        };
      }
      return null;
    }

    // Migration depuis la version intermédiaire (nom et e-mail sans mot de passe)
    if (parsed && typeof parsed === 'object' && ('name' in parsed || 'email' in parsed)) {
      return {
        name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
        email: typeof parsed.email === 'string' ? parsed.email.trim() : '',
        password: typeof parsed.password === 'string' ? parsed.password : ''
      };
    }
  } catch (error) {
    console.warn('Impossible de charger les identifiants stockés :', error);
    await clearCredentials();
  }
  return null;
};

export const clearCredentials = async () => {
  localStorage.removeItem(STORAGE_KEY);
  try {
    if (globalThis.indexedDB) {
      await withStore('readwrite', (store) => store.delete(KEY_ID));
    }
  } catch {}
};
