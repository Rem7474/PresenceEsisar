// Stockage local des identifiants.
// Le mot de passe est chiffré en AES-GCM ; la clé est non exportable et vit dans IndexedDB,
// le localStorage ne contient donc que du chiffré inutilisable hors de ce navigateur.

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

export const canPersist = () => Boolean(globalThis.crypto?.subtle && globalThis.indexedDB);

export const saveCredentials = async (user) => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(user)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, iv: toBase64(iv), data: toBase64(data) }));
};

/** Retourne l'utilisateur mémorisé, ou null (rien de stocké, ou stockage illisible → purgé). */
export const loadCredentials = async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const { iv, data } = JSON.parse(raw);
    const key = await getKey();
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    await clearCredentials();
    return null;
  }
};

export const clearCredentials = async () => {
  localStorage.removeItem(STORAGE_KEY);
  try {
    await withStore('readwrite', (store) => store.delete(KEY_ID));
  } catch {
    // IndexedDB indisponible : il n'y a alors aucune clé à supprimer.
  }
};
