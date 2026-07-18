// tests/state.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, buildModel } from '../js/state.js';
import { computeSummary, calcPurchaseTax } from '../js/calc.js';

test('defaultState has sane defaults', () => {
  const s = defaultState();
  assert.equal(s.ui.lang, 'he');
  assert.equal(s.ui.currency, 'ILS');
  assert.equal(s.ui.rate, 3.70);
  assert.equal(s.values.apartmentType, 'additional');
  assert.equal(s.values.tabu, 3500);
});

test('buildModel computes purchase tax when no override', () => {
  const s = defaultState();
  s.values.price = 2000000;
  const m = buildModel(s);
  assert.equal(m.oneTime.purchaseTax, calcPurchaseTax(2000000, 'additional'));
});

test('buildModel honors a purchase-tax override', () => {
  const s = defaultState();
  s.values.price = 2000000;
  s.values.purchaseTaxOverride = 123456;
  const m = buildModel(s);
  assert.equal(m.oneTime.purchaseTax, 123456);
});

test('buildModel defaults rental brokerage to one month rent', () => {
  const s = defaultState();
  s.values.rent = 6000;
  const m = buildModel(s);
  assert.equal(m.oneTime.rentalBrokerage, 6000);
});

test('buildModel feeds computeSummary without throwing', () => {
  const s = defaultState();
  s.values.price = 2000000; s.values.rent = 6000;
  const summary = computeSummary(buildModel(s));
  assert.ok(summary.totalInvested > 2000000);
});
