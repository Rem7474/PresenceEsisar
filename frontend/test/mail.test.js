import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBody, buildMailto, buildSubject } from '../src/lib/mail.js';

test('buildSubject retourne le sujet par défaut ou personnalisé', () => {
  assert.equal(buildSubject(), 'feuille de présence - 5App');
  assert.equal(buildSubject('Mon objet custom'), 'Mon objet custom');
});

test('buildMailto encode destinataire, objet et corps', () => {
  const url = new URL(buildMailto('apprentissage@esisar.grenoble-inp.fr', 'feuille de présence - 5App', buildBody('scan.pdf')));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(decodeURIComponent(url.pathname), 'apprentissage@esisar.grenoble-inp.fr');
  assert.equal(url.searchParams.get('subject'), 'feuille de présence - 5App');
  assert.equal(url.searchParams.get('body'), buildBody('scan.pdf'));
  assert.ok(!url.searchParams.get('body').includes('Destinataire'));
  assert.equal(url.searchParams.get('cc'), null);
});

test('buildMailto encode avec ou sans cc', () => {
  const withCc = new URL(buildMailto('dest@esisar.fr', 'Sujet', 'Corps', 'etudiant@esisar.fr'));
  assert.equal(withCc.searchParams.get('cc'), 'etudiant@esisar.fr');
  assert.equal(withCc.searchParams.get('subject'), 'Sujet');

  const withoutCc = new URL(buildMailto('dest@esisar.fr', 'Sujet', 'Corps', undefined));
  assert.equal(withoutCc.searchParams.get('cc'), null);
});

