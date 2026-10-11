import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DIMENSION, fitWithin, jpegName } from '../src/lib/image.js';

test('fitWithin réduit le grand côté en conservant le ratio', () => {
  assert.deepEqual(fitWithin(4000, 3000), { width: 2000, height: 1500 });
  assert.deepEqual(fitWithin(3000, 4000), { width: 1500, height: 2000 });
});

test("fitWithin n'agrandit jamais une image plus petite", () => {
  assert.deepEqual(fitWithin(800, 600), { width: 800, height: 600 });
  assert.deepEqual(fitWithin(MAX_DIMENSION, 100), { width: MAX_DIMENSION, height: 100 });
});

test('jpegName remplace l\'extension par .jpg', () => {
  assert.equal(jpegName('IMG_0001.HEIC'), 'IMG_0001.jpg');
  assert.equal(jpegName('scan.final.png'), 'scan.final.jpg');
  assert.equal(jpegName('sans-extension'), 'sans-extension.jpg');
  assert.equal(jpegName('.png'), 'photo.jpg');
});
