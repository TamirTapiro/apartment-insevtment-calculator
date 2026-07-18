// tests/i18n.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t } from '../js/i18n.js';

test('en and he have identical key sets', () => {
  const en = Object.keys(STRINGS.en).sort();
  const he = Object.keys(STRINGS.he).sort();
  assert.deepEqual(en, he);
});

test('t returns the string for a language', () => {
  assert.equal(t('cat_purchase', 'en'), STRINGS.en.cat_purchase);
  assert.equal(typeof t('cat_purchase', 'he'), 'string');
});

test('t falls back to the key when missing', () => {
  assert.equal(t('no_such_key', 'en'), 'no_such_key');
});
