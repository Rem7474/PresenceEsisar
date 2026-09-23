import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { MailError } from '../src/mailer.js';

const PDF = Buffer.from('%PDF-1.7 contenu de test');

const withServer = async (sendPresenceEmail, run, options = {}) => {
  const server = createApp({ sendPresenceEmail, ...options }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
};

const form = (fields = {}, file = PDF) => {
  const data = new FormData();
  const values = { name: 'Jean Dupont', email: 'jean@esisar.fr', week: '38', ...fields };
  for (const [key, value] of Object.entries(values)) if (value !== undefined) data.append(key, value);
  if (file) data.append('file', new Blob([file], { type: 'application/pdf' }), 'scan.pdf');
  return data;
};

test('envoie le fichier renommé avec nom et e-mail fournis', async () => {
  const calls = [];
  await withServer(async (mail) => calls.push(mail), async (url) => {
    const res = await fetch(`${url}/api/upload`, { method: 'POST', body: form() });
    assert.equal(res.status, 200);
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].filename, 'Attestation présence P2027- Jean Dupont - Esisar- Semaine 38.pdf');
  assert.equal(calls[0].name, 'Jean Dupont');
  assert.equal(calls[0].email, 'jean@esisar.fr');
  assert.equal(calls[0].subject, 'Attestation présence P2027- Jean Dupont - Esisar- Semaine 38');
});

test('rejette les requêtes invalides sans appeler le SMTP', async () => {
  let called = false;
  await withServer(async () => { called = true; }, async (url) => {
    const post = (body) => fetch(`${url}/api/upload`, { method: 'POST', body });
    assert.equal((await post(form({}, null))).status, 400);
    assert.equal((await post(form({ name: undefined }))).status, 400);
    assert.equal((await post(form({ name: '' }))).status, 400);
    assert.equal((await post(form({ email: 'pas-un-mail' }))).status, 400);
    assert.equal((await post(form({ email: undefined }))).status, 400);
    assert.equal((await post(form({ week: '99' }))).status, 400);
    assert.equal((await post(form({}, Buffer.from('MZ pas un pdf ni une image')))).status, 400);
  });
  assert.equal(called, false);
});

test('propage le statut des erreurs SMTP', async () => {
  const send = async () => { throw new MailError('refusé', 401); };
  await withServer(send, async (url) => {
    const res = await fetch(`${url}/api/upload`, { method: 'POST', body: form() });
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, 'refusé');
  });
});

test('health, 404 API et en-têtes de sécurité', async () => {
  await withServer(async () => {}, async (url) => {
    const health = await fetch(`${url}/api/health`);
    assert.equal(health.status, 200);
    assert.match(health.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(health.headers.get('x-powered-by'), null);
    assert.equal((await fetch(`${url}/api/inconnue`)).status, 404);
  });
});

test('expose le destinataire configuré', async () => {
  await withServer(async () => {}, async (url) => {
    const body = await (await fetch(`${url}/api/config`)).json();
    assert.equal(body.recipient, 'apprentissage@esisar.grenoble-inp.fr');
  });
});

test('SMTP désactivé : /api/upload refusé et indiqué dans /api/config', async () => {
  let called = false;
  await withServer(
    async () => { called = true; },
    async (url) => {
      assert.equal((await fetch(`${url}/api/upload`, { method: 'POST', body: form() })).status, 403);
      assert.equal((await (await fetch(`${url}/api/config`)).json()).smtpEnabled, false);
    },
    { smtpEnabled: false }
  );
  assert.equal(called, false);
});

test('SMTP activé par défaut', async () => {
  await withServer(async () => {}, async (url) => {
    assert.equal((await (await fetch(`${url}/api/config`)).json()).smtpEnabled, true);
  });
});
