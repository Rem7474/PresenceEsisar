// Stockage local des informations de l'étudiant (Nom et E-mail).
// Aucun mot de passe n'est requis ni stocké.

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

const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

const tryMigrateLegacy = async (raw) => {
  try {
    const parsed = JSON.parse(raw);
    // Format moderne (clair) : { name, email }
    if (parsed && typeof parsed === 'object' && ('name' in parsed || 'email' in parsed)) {
      return {
        name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
        email: typeof parsed.email === 'string' ? parsed.email.trim() : ''
      };
    }
    // Ancien format chiffré v2 : { v: 2, iv, data }
    if (parsed?.v === 2 && parsed.iv && parsed.data && globalThis.crypto?.subtle && globalThis.indexedDB) {
      const key = await withStore('readonly', (store) => store.get(KEY_ID));
      if (key) {
        const plain = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
          key,
          fromBase64(parsed.data)
        );
        const legacy = JSON.parse(new TextDecoder().decode(plain));
        const migrated = {
          name: typeof legacy.name === 'string' ? legacy.name.trim() : '',
          email: typeof legacy.email === 'string' ? legacy.email.trim() : ''
        };
        // Sauvegarde immédiate au format clair (sans mot de passe)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        // Nettoyage de l'ancienne clé IndexedDB
        try {
          await withStore('readwrite', (store) => store.delete(KEY_ID));
        } catch {}
        return migrated;
      }
    }
  } catch (e) {
    console.warn('Impossible de lire les identifiants précédents:', e);
  }
  return null;
};

export const canPersist = () => typeof localStorage !== 'undefined';

export const saveCredentials = async (user) => {
  const data = {
    name: typeof user.name === 'string' ? user.name.trim() : '',
    email: typeof user.email === 'string' ? user.email.trim() : ''
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadCredentials = async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return await tryMigrateLegacy(raw);
};

export const clearCredentials = async () => {
  localStorage.removeItem(STORAGE_KEY);
  try {
    if (globalThis.indexedDB) {
      await withStore('readwrite', (store) => store.delete(KEY_ID));
    }
  } catch {}
};
