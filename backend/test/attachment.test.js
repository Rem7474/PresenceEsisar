import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFilename, detectFileType, isValidEmail, isValidWeek, sanitizeName } from '../src/attachment.js';

const pad = (head) => Buffer.concat([head, Buffer.alloc(32)]);

test('detectFileType reconnaît JPEG, PNG, WebP et PDF par leur contenu', () => {
  assert.equal(detectFileType(pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0])))?.ext, 'jpg');
  assert.equal(detectFileType(pad(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))?.ext, 'png');
  assert.equal(detectFileType(pad(Buffer.from('%PDF-1.7')))?.ext, 'pdf');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(16)]);
  assert.equal(detectFileType(webp)?.ext, 'webp');
});

test('detectFileType rejette un contenu inconnu ou trop court', () => {
  assert.equal(detectFileType(Buffer.from('<script>alert(1)</script>')), null);
  assert.equal(detectFileType(Buffer.from([0xff, 0xd8, 0xff])), null);
});

test('sanitizeName neutralise séparateurs de chemin et caractères de contrôle', () => {
  assert.equal(sanitizeName('../../etc/passwd'), '.. .. etc passwd');
  assert.equal(sanitizeName('Jean\r\nBcc: x@y.z'), 'Jean Bcc x@y.z');
  assert.equal(sanitizeName('  Jean   Dupont  '), 'Jean Dupont');
});

test('buildFilename respecte le format exigé', () => {
  assert.equal(
    buildFilename('Jean Dupont', 38, 'pdf'),
    'Attestation présence P2027- Jean Dupont - Esisar- Semaine 38.pdf'
  );
});

test('validation e-mail et semaine', () => {
  assert.ok(isValidEmail('jean.dupont@esisar.grenoble-inp.fr'));
  assert.ok(!isValidEmail('jean@x'));
  assert.ok(!isValidEmail('@esisar.fr') && !isValidEmail('jean@') && !isValidEmail('a@@b.fr'));
  assert.ok(!isValidEmail('jean@esisar..fr') && !isValidEmail('jean@.fr') && !isValidEmail('jean@esisar.'));
  assert.ok(!isValidEmail(undefined) && !isValidEmail(`${'a'.repeat(250)}@b.fr`));
  assert.ok(!isValidEmail('a@b.fr\r\nBcc: c@d.fr'));
  assert.ok(isValidWeek(1) && isValidWeek(53));
  assert.ok(!isValidWeek(0) && !isValidWeek(54) && !isValidWeek(1.5) && !isValidWeek(NaN));
});
