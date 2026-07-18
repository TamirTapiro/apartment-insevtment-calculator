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

import { calcIncomeTaxMonthly } from '../js/calc.js';

test('10% track: flat on rent', () => {
  assert.equal(calcIncomeTaxMonthly({ rent: 6000, track: '10' }), 600);
});

test('exemption: below ceiling is tax-free', () => {
  assert.equal(calcIncomeTaxMonthly({ rent: 5000, track: 'exemption', marginalRate: 0.31 }), 0);
});

test('exemption: partial band uses doubled excess * marginal', () => {
  // taxable = 2*8000 - 2*5654 = 4692 ; 4692 * 0.31 = 1454.52 -> 1455
  assert.equal(calcIncomeTaxMonthly({ rent: 8000, track: 'exemption', marginalRate: 0.31 }), 1455);
});

test('exemption: above double ceiling taxes full rent at marginal', () => {
  // 12000 * 0.31 = 3720
  assert.equal(calcIncomeTaxMonthly({ rent: 12000, track: 'exemption', marginalRate: 0.31 }), 3720);
});

test('self-rent offset: deducts capped rent-you-pay, 10% on remainder', () => {
  // (6000 - 5000) * 10% = 100
  assert.equal(calcIncomeTaxMonthly({ rent: 6000, track: 'offset', rentYouPay: 5000 }), 100);
});

test('self-rent offset: rent-you-pay capped at 7500, cannot go negative', () => {
  assert.equal(calcIncomeTaxMonthly({ rent: 6000, track: 'offset', rentYouPay: 9000 }), 0);
});

import { toDisplay, parseToNis, formatMoney } from '../js/calc.js';

test('toDisplay converts ₪ to $ by dividing by rate', () => {
  assert.equal(toDisplay(3700, 'USD', 3.7), 1000);
});

test('toDisplay in ₪ returns the same number', () => {
  assert.equal(toDisplay(3700, 'ILS', 3.7), 3700);
});

test('parseToNis converts a $ input back to ₪', () => {
  assert.equal(parseToNis(1000, 'USD', 3.7), 3700);
});

test('formatMoney renders a grouped symbol string', () => {
  assert.equal(formatMoney(3700, { currency: 'ILS', rate: 3.7 }), '₪3,700');
  assert.equal(formatMoney(3700, { currency: 'USD', rate: 3.7 }), '$1,000');
});

import { computeSummary } from '../js/calc.js';

const baseModel = {
  price: 2000000,
  oneTime: { purchaseTax: 160000, brokerage: 47200, attorney: 11800, tabu: 3500,
             advisor: 8000, fileOpening: 2500, appraiser: 3000, renovation: 150000,
             furniture: 20000, upgrades: 10000, rentalBrokerage: 6000 },
  monthly: { lifeBuilding: 150, arnona: 500, houseCommittee: 0, currentBills: 0,
             buildingContents: 100, incomeTax: 600, repairs: 200, futureFund: 200, management: 300 },
  annual: { advertising: 500, legal: 500 },
  mortgage: { enabled: false, loanAmount: 0, monthlyPayment: 0 },
  rent: 6000, vacancyMonths: 0.5,
};

test('cash deal: totalInvested = price + all one-time costs', () => {
  const s = computeSummary(baseModel);
  // oneTime sum = 422000 ; + price 2,000,000 = 2,422,000
  assert.equal(s.oneTimeCosts, 422000);
  assert.equal(s.totalInvested, 2422000);
});

test('gross yield = annual contract rent / price', () => {
  const s = computeSummary(baseModel);
  assert.ok(Math.abs(s.grossYield - (6000 * 12 / 2000000)) < 1e-9); // 0.036
});

test('monthly total sums monthly items (no mortgage in cash deal)', () => {
  const s = computeSummary(baseModel);
  // 150+500+0+0+100+600+200+200+300 = 2050
  assert.equal(s.monthlyTotal, 2050);
});

test('financed deal: totalInvested uses down payment and monthly total adds mortgage', () => {
  const m = { ...baseModel, mortgage: { enabled: true, loanAmount: 1400000, monthlyPayment: 8000 } };
  const s = computeSummary(m);
  // downPayment = 2,000,000 - 1,400,000 = 600,000 ; + oneTime 422,000 = 1,022,000
  assert.equal(s.totalInvested, 1022000);
  assert.equal(s.monthlyTotal, 2050 + 8000);
  assert.ok(s.cashOnCash !== null);
});

test('payback is null when cash flow is not positive', () => {
  const m = { ...baseModel, monthly: { ...baseModel.monthly, management: 100000 } };
  const s = computeSummary(m);
  assert.equal(s.paybackYears, null);
});
