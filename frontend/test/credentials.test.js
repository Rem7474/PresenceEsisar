import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage pour l'environnement de test Node
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// Mock minimal IndexedDB pour tester le chiffrement AES-GCM avec WebCrypto
const mockIdb = new Map();
globalThis.indexedDB = {
  open: () => {
    const req = {
      onsuccess: null,
      onerror: null,
      result: {
        transaction: () => ({
          objectStore: () => ({
            get: (k) => {
              const r = { result: mockIdb.get(k) };
              setTimeout(() => r.onsuccess && r.onsuccess(), 0);
              return r;
            },
            put: (v, k) => {
              mockIdb.set(k, v);
              const r = { result: k };
              setTimeout(() => r.onsuccess && r.onsuccess(), 0);
              return r;
            },
            delete: (k) => {
              mockIdb.delete(k);
              const r = {};
              setTimeout(() => r.onsuccess && r.onsuccess(), 0);
              return r;
            }
          })
        }),
        createObjectStore: () => {},
        close: () => {}
      }
    };
    setTimeout(() => {
      if (req.onupgradeneeded) req.onupgradeneeded();
      if (req.onsuccess) req.onsuccess();
    }, 0);
    return req;
  }
};

const { saveCredentials, loadCredentials, clearCredentials } = await import('../src/lib/credentials.js');

test('chiffre en AES-GCM et restitue nom, email et mot de passe', async () => {
  mockStorage.clear();
  mockIdb.clear();

  await saveCredentials({ name: 'Alice Martin', email: 'alice@esisar.fr', password: 'mon-super-mot-de-passe' });

  // Vérifie que le localStorage contient du chiffré et jamais le mot de passe en clair
  const raw = localStorage.getItem('presenceUser');
  assert.ok(raw);
  const parsedRaw = JSON.parse(raw);
  assert.equal(parsedRaw.v, 2);
  assert.ok(parsedRaw.iv);
  assert.ok(parsedRaw.data);
  assert.equal(raw.includes('mon-super-mot-de-passe'), false);

  // Vérifie le déchiffrement
  const loaded = await loadCredentials();
  assert.deepEqual(loaded, {
    name: 'Alice Martin',
    email: 'alice@esisar.fr',
    password: 'mon-super-mot-de-passe'
  });
});

test('charge un utilisateur sans mot de passe (migration depuis version précédente)', async () => {
  mockStorage.clear();
  localStorage.setItem('presenceUser', JSON.stringify({ name: 'Bob Dylan', email: 'bob@esisar.fr' }));
  const loaded = await loadCredentials();
  assert.equal(loaded?.name, 'Bob Dylan');
  assert.equal(loaded?.email, 'bob@esisar.fr');
  assert.equal(loaded?.password, '');
});

test('clearCredentials vide le stockage et supprime la clé', async () => {
  mockStorage.clear();
  mockIdb.clear();
  await saveCredentials({ name: 'Test', email: 'test@example.com', password: 'secret' });
  await clearCredentials();
  const loaded = await loadCredentials();
  assert.equal(loaded, null);
});
