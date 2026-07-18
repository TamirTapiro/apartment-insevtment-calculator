// tests/fields.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from '../js/fields.js';
import { STRINGS } from '../js/i18n.js';

test('there are six categories', () => {
  assert.equal(CATEGORIES.length, 6);
});

test('every field label + tooltip key exists in i18n', () => {
  for (const cat of CATEGORIES) {
    assert.ok(STRINGS.en[cat.titleKey], `missing title ${cat.titleKey}`);
    for (const f of cat.fields) {
      assert.ok(STRINGS.en[f.labelKey], `missing label ${f.labelKey}`);
      if (f.tooltipKey) assert.ok(STRINGS.en[f.tooltipKey], `missing tooltip ${f.tooltipKey}`);
    }
  }
});

test('units are limited to once/month/year', () => {
  for (const cat of CATEGORIES) {
    for (const f of cat.fields) {
      assert.ok(['once', 'month', 'year'].includes(f.unit), `bad unit ${f.unit} on ${f.id}`);
    }
  }
});
