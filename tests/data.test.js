// tests/data.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VAT, PURCHASE_TAX_BRACKETS, RENT_EXEMPTION_CEILING, RENT_DOUBLE_CEILING, SELF_RENT_OFFSET_CAP, DEFAULTS } from '../js/data.js';

test('VAT is 18%', () => assert.equal(VAT, 0.18));

test('purchase tax brackets exist for both regimes', () => {
  assert.ok(Array.isArray(PURCHASE_TAX_BRACKETS.single));
  assert.ok(Array.isArray(PURCHASE_TAX_BRACKETS.additional));
  assert.equal(PURCHASE_TAX_BRACKETS.additional[0].rate, 0.08);
});

test('rent ceilings and offset cap', () => {
  assert.equal(RENT_EXEMPTION_CEILING, 5654);
  assert.equal(RENT_DOUBLE_CEILING, 11308);
  assert.equal(SELF_RENT_OFFSET_CAP, 7500);
});

test('defaults include fixed fees', () => {
  assert.equal(DEFAULTS.tabu, 3500);
  assert.equal(DEFAULTS.advisor, 8000);
  assert.equal(DEFAULTS.fileOpening, 2500);
  assert.equal(DEFAULTS.appraiser, 3000);
});
