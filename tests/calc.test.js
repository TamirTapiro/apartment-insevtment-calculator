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

import { calcPercentFee } from '../js/calc.js';

test('brokerage: 2% + 18% VAT on ₪2,000,000', () => {
  // 2,000,000 * 0.02 * 1.18 = 47,200
  assert.equal(calcPercentFee(2000000, 0.02), 47200);
});

test('attorney: 0.5% + 18% VAT on ₪2,000,000', () => {
  // 2,000,000 * 0.005 * 1.18 = 11,800
  assert.equal(calcPercentFee(2000000, 0.005), 11800);
});

import { mortgageMonthlyPayment } from '../js/calc.js';

test('amortized payment for ₪1,000,000 at 5% over 25y', () => {
  const m = mortgageMonthlyPayment(1000000, 0.05, 25);
  assert.ok(Math.abs(m - 5845.9) < 1, `got ${m}`);
});

test('zero-interest loan divides evenly', () => {
  assert.equal(mortgageMonthlyPayment(1000000, 0, 25), Math.round(1000000 / 300));
});

test('zero loan is zero payment', () => {
  assert.equal(mortgageMonthlyPayment(0, 0.05, 25), 0);
});
