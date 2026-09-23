import test from 'node:test';
import assert from 'node:assert/strict';
import { isoWeek } from '../src/lib/week.js';
import { buildFilename } from '../src/lib/filename.js';

test('isoWeek suit la norme ISO 8601', () => {
  assert.equal(isoWeek(new Date(2026, 0, 1)), 1);
  assert.equal(isoWeek(new Date(2026, 11, 31)), 53);
  assert.equal(isoWeek(new Date(2027, 0, 1)), 53);
  assert.equal(isoWeek(new Date(2027, 0, 4)), 1);
  assert.equal(isoWeek(new Date(2026, 8, 20)), 38);
});

test('buildFilename suit le format exigé et choisit la bonne extension', () => {
  assert.equal(buildFilename('Jean Dupont', 38, 'application/pdf'), 'Attestation présence P2027-Jean Dupont-Esisar-Semaine 38.pdf');
  assert.equal(buildFilename('Jean/Dupont', 3, 'image/png'), 'Attestation présence P2027-Jean Dupont-Esisar-Semaine 3.png');
});
