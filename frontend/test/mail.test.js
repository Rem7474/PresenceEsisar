import test from 'node:test';
import assert from 'node:assert/strict';
import { MAIL_BODY, buildMailto, buildSubject } from '../src/lib/mail.js';

test('buildSubject retire l\'extension', () => {
  assert.equal(buildSubject('Attestation présence P2027- Jean Dupont - Esisar- Semaine 38.pdf'), 'Attestation présence P2027- Jean Dupont - Esisar- Semaine 38');
});

test('buildMailto encode destinataire, objet et corps', () => {
  const url = new URL(buildMailto('apprentissage@esisar.grenoble-inp.fr', 'Semaine 38 & co', MAIL_BODY));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(decodeURIComponent(url.pathname), 'apprentissage@esisar.grenoble-inp.fr');
  assert.equal(url.searchParams.get('subject'), 'Semaine 38 & co');
  assert.equal(url.searchParams.get('body'), MAIL_BODY);
});
