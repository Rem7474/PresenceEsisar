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

const { saveCredentials, loadCredentials, clearCredentials } = await import('../src/lib/credentials.js');

test('sauvegarde et charge les informations nom et email', async () => {
  mockStorage.clear();
  await saveCredentials({ name: 'Alice Martin', email: 'alice@esisar.fr' });
  const loaded = await loadCredentials();
  assert.deepEqual(loaded, { name: 'Alice Martin', email: 'alice@esisar.fr' });
});

test('charge un utilisateur sans email (migration)', async () => {
  mockStorage.clear();
  localStorage.setItem('presenceUser', JSON.stringify({ name: 'Bob Dylan' }));
  const loaded = await loadCredentials();
  assert.equal(loaded?.name, 'Bob Dylan');
  assert.equal(loaded?.email, '');
});

test('clearCredentials vide le stockage', async () => {
  mockStorage.clear();
  await saveCredentials({ name: 'Test', email: 'test@example.com' });
  await clearCredentials();
  const loaded = await loadCredentials();
  assert.equal(loaded, null);
});
