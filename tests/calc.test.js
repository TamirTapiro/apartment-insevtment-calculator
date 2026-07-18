// tests/calc.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcPurchaseTax } from '../js/calc.js';

test('single: below first threshold is 0', () => {
  assert.equal(calcPurchaseTax(1978745, 'single'), 0);
});

test('single: ₪2,000,000 taxes only the slice above the threshold', () => {
  // (2,000,000 - 1,978,745) * 3.5% = 743.925 -> 744
  assert.equal(calcPurchaseTax(2000000, 'single'), 744);
});

test('additional: 8% from first shekel', () => {
  assert.equal(calcPurchaseTax(2000000, 'additional'), 160000);
});

test('additional: crosses into 10% slice', () => {
  // 6,055,070*8% + (7,000,000-6,055,070)*10% = 484405.6 + 94493 = 578898.6 -> 578899
  assert.equal(calcPurchaseTax(7000000, 'additional'), 578899);
});

test('defaults to additional regime', () => {
  assert.equal(calcPurchaseTax(2000000), 160000);
});
