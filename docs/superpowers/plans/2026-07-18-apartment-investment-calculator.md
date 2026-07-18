# Apartment Investment Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, bilingual (HE/EN), light/dark, ₪/$ apartment-investment calculator for Israel that sums costs and computes rental-return metrics, hosted as a static site on GitHub Pages.

**Architecture:** Pure static site — no build step. ES modules load directly in the browser and in Node. A DOM-free calculation engine (`calc.js`) holds all math and is unit-tested with Node's built-in test runner (`node --test`, zero dependencies). A declarative field config drives generic rendering; special widgets (purchase-tax mini-calc, mortgage block, income-tax tracks, repeatable ＋ lists, renovation line-items) are handled explicitly. State is stored in ₪ and persisted to `localStorage`.

**Tech Stack:** HTML5, CSS (custom properties for theming + RTL), vanilla JS ES modules, `node --test` for unit tests, `python -m http.server` (or `npx serve`) for local preview. Reference: spec at `docs/superpowers/specs/2026-07-18-apartment-investment-calculator-design.md`.

---

## File Structure

```
index.html            # markup shell + module entry
css/styles.css        # theming (light/dark), layout, RTL, responsive
js/data.js            # constants + defaults (edit here when figures change)
js/i18n.js            # EN/HE strings: labels + tooltips + t()
js/fields.js          # declarative category/field config
js/calc.js            # pure calc engine (DOM-free): taxes, mortgage, currency, computeSummary
js/state.js           # default state, load/save localStorage, buildModel()
js/render.js          # DOM builders: fields, categories, dashboard, tooltips, ＋lists
js/app.js             # init, event wiring, recalc/render orchestration
tests/calc.test.js    # node --test unit tests for calc.js
package.json          # { "type":"module", scripts.test = "node --test" } — no deps
README.md             # usage + deploy notes
```

Responsibilities are split so each JS file has one job. `calc.js` never touches the DOM (so it is testable in Node). `render.js` only builds DOM from data. `app.js` wires events and orchestrates. `state.js` owns persistence and the state→model transform.

---

## Task 1: Project scaffold + test runner smoke test

**Files:**
- Create: `package.json`
- Create: `tests/calc.test.js` (temporary smoke test, replaced in Task 3)

- [x] **Step 1: Create `package.json`**

```json
{
  "name": "apartment-investment-calculator",
  "version": "1.0.0",
  "description": "Apartment investment calculator for Israel (static site)",
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "license": "MIT"
}
```

- [x] **Step 2: Write a smoke test**

```js
// tests/calc.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('smoke: test runner works', () => {
  assert.equal(1 + 1, 2);
});
```

- [x] **Step 3: Run the test to verify the runner works**

Run: `npm test`
Expected: PASS — output includes `# pass 1` and `tests 1`.

- [x] **Step 4: Commit**

```bash
git add package.json tests/calc.test.js
git commit -m "chore: scaffold static-site project with node --test runner"
```

---

## Task 2: Constants & defaults (`js/data.js`)

**Files:**
- Create: `js/data.js`
- Test: `tests/data.test.js`

- [x] **Step 1: Write the failing test**

```js
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
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/data.test.js`
Expected: FAIL — cannot find module `../js/data.js`.

- [x] **Step 3: Implement `js/data.js`**

```js
// js/data.js — reference figures for 2026. Edit here when figures change.
export const VAT = 0.18;

// Marginal brackets; each { upTo, rate } applies to the slice up to `upTo`.
export const PURCHASE_TAX_BRACKETS = {
  single: [
    { upTo: 1978745, rate: 0 },
    { upTo: 2347040, rate: 0.035 },
    { upTo: 6055070, rate: 0.05 },
    { upTo: 20183565, rate: 0.08 },
    { upTo: Infinity, rate: 0.10 },
  ],
  additional: [
    { upTo: 6055070, rate: 0.08 },
    { upTo: Infinity, rate: 0.10 },
  ],
};

export const RENT_EXEMPTION_CEILING = 5654;   // ₪/month, full exemption threshold
export const RENT_DOUBLE_CEILING = 11308;      // ₪/month, above = no exemption
export const SELF_RENT_OFFSET_CAP = 7500;      // ₪/month deductible rent-you-pay

export const DEFAULTS = {
  rate: 3.70,            // ₪ per $
  brokeragePct: 0.02,
  attorneyPct: 0.005,
  tabu: 3500,
  advisor: 8000,
  fileOpening: 2500,
  appraiser: 3000,
  annualRate: 0.05,      // mortgage
  termYears: 25,
  vacancyMonths: 0.5,
  marginalRate: 0.31,    // exemption-track marginal rate
};

// Renovation reference ranges (₪) — used as input placeholders/hints only.
export const RENOVATION_HINTS = {
  demolition: '10,700–13,000',
  plumbing: '18,670–22,820',
  electrical: '9,400–11,500',
  flooring: '27,400–33,450',
  kitchen: '30,000–60,000',
  bathroom: '25,000–33,000',
  painting: '6,000–12,000',
};
```

- [x] **Step 4: Run to verify it passes**

Run: `node --test tests/data.test.js`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add js/data.js tests/data.test.js
git commit -m "feat: add constants and defaults module"
```

---

## Task 3: Purchase-tax calculation (`js/calc.js`)

**Files:**
- Create: `js/calc.js`
- Replace smoke test: `tests/calc.test.js`

- [x] **Step 1: Write the failing test** (replace the whole file)

```js
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
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/calc.test.js`
Expected: FAIL — cannot find module `../js/calc.js`.

- [x] **Step 3: Implement in `js/calc.js`**

```js
// js/calc.js — pure calculation engine (no DOM).
import { VAT, PURCHASE_TAX_BRACKETS } from './data.js';

export function calcPurchaseTax(price, type = 'additional') {
  const brackets = PURCHASE_TAX_BRACKETS[type] || PURCHASE_TAX_BRACKETS.additional;
  const p = Math.max(0, Number(price) || 0);
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (p <= lower) break;
    const taxable = Math.min(p, b.upTo) - lower;
    tax += taxable * b.rate;
    lower = b.upTo;
  }
  return Math.round(tax);
}
```

- [x] **Step 4: Run to verify it passes**

Run: `node --test tests/calc.test.js`
Expected: PASS (5 tests).

- [x] **Step 5: Commit**

```bash
git add js/calc.js tests/calc.test.js
git commit -m "feat: add progressive purchase-tax calculation"
```

---

## Task 4: Percentage fees — brokerage & attorney (`js/calc.js`)

**Files:**
- Modify: `js/calc.js`
- Modify: `tests/calc.test.js`

- [ ] **Step 1: Add the failing test** (append to `tests/calc.test.js`)

```js
import { calcPercentFee } from '../js/calc.js';

test('brokerage: 2% + 18% VAT on ₪2,000,000', () => {
  // 2,000,000 * 0.02 * 1.18 = 47,200
  assert.equal(calcPercentFee(2000000, 0.02), 47200);
});

test('attorney: 0.5% + 18% VAT on ₪2,000,000', () => {
  // 2,000,000 * 0.005 * 1.18 = 11,800
  assert.equal(calcPercentFee(2000000, 0.005), 11800);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/calc.test.js`
Expected: FAIL — `calcPercentFee` is not exported.

- [ ] **Step 3: Implement** (append to `js/calc.js`)

```js
export function calcPercentFee(price, pct, vat = VAT) {
  const value = (Number(price) || 0) * (Number(pct) || 0) * (1 + vat);
  return Math.round(value);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/calc.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/calc.js tests/calc.test.js
git commit -m "feat: add percentage-fee calc for brokerage and attorney"
```

---

## Task 5: Mortgage monthly payment (`js/calc.js`)

**Files:**
- Modify: `js/calc.js`
- Modify: `tests/calc.test.js`

- [ ] **Step 1: Add the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/calc.test.js`
Expected: FAIL — `mortgageMonthlyPayment` not exported.

- [ ] **Step 3: Implement** (append to `js/calc.js`)

```js
export function mortgageMonthlyPayment(loan, annualRate, termYears) {
  const L = Math.max(0, Number(loan) || 0);
  const n = Math.round((Number(termYears) || 0) * 12);
  if (L === 0 || n === 0) return 0;
  const r = (Number(annualRate) || 0) / 12;
  if (r === 0) return Math.round(L / n);
  const m = (L * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(m);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/calc.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/calc.js tests/calc.test.js
git commit -m "feat: add mortgage monthly-payment calc"
```

---

## Task 6: Rental income tax — three tracks (`js/calc.js`)

**Files:**
- Modify: `js/calc.js`
- Modify: `tests/calc.test.js`

- [ ] **Step 1: Add the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/calc.test.js`
Expected: FAIL — `calcIncomeTaxMonthly` not exported.

- [ ] **Step 3: Implement** (append to `js/calc.js`)

```js
import { RENT_EXEMPTION_CEILING, RENT_DOUBLE_CEILING, SELF_RENT_OFFSET_CAP } from './data.js';

export function calcIncomeTaxMonthly({ rent, track = '10', marginalRate = 0.31, rentYouPay = 0 }) {
  const R = Math.max(0, Number(rent) || 0);
  if (R === 0) return 0;
  if (track === '10') return Math.round(R * 0.10);
  if (track === 'offset') {
    const deduction = Math.min(Math.max(0, Number(rentYouPay) || 0), SELF_RENT_OFFSET_CAP);
    const taxable = Math.max(0, R - deduction);
    return Math.round(taxable * 0.10);
  }
  // exemption track
  const mr = Number(marginalRate) || 0;
  if (R <= RENT_EXEMPTION_CEILING) return 0;
  if (R >= RENT_DOUBLE_CEILING) return Math.round(R * mr);
  const taxable = 2 * R - 2 * RENT_EXEMPTION_CEILING;
  return Math.round(taxable * mr);
}
```

Note: move the new `import` line to the top of `js/calc.js` alongside the existing imports (do not leave imports mid-file).

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/calc.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/calc.js tests/calc.test.js
git commit -m "feat: add rental income-tax calc for all three tracks"
```

---

## Task 7: Currency conversion & formatting (`js/calc.js`)

**Files:**
- Modify: `js/calc.js`
- Modify: `tests/calc.test.js`

- [ ] **Step 1: Add the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/calc.test.js`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement** (append to `js/calc.js`)

```js
export function toDisplay(valueNis, currency, rate) {
  const v = Number(valueNis) || 0;
  if (currency === 'USD') return v / (Number(rate) || 1);
  return v;
}

export function parseToNis(input, currency, rate) {
  const v = Number(input) || 0;
  if (currency === 'USD') return v * (Number(rate) || 1);
  return v;
}

export function formatMoney(valueNis, { currency = 'ILS', rate = 3.7 } = {}) {
  const shown = toDisplay(valueNis, currency, rate);
  const symbol = currency === 'USD' ? '$' : '₪';
  const rounded = Math.round(shown);
  return symbol + rounded.toLocaleString('en-US');
}

export function formatPercent(fraction) {
  if (fraction == null || !isFinite(fraction)) return '—';
  return (fraction * 100).toFixed(1) + '%';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/calc.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/calc.js tests/calc.test.js
git commit -m "feat: add currency conversion, money and percent formatting"
```

---

## Task 8: Aggregates & return metrics — `computeSummary` (`js/calc.js`)

**Files:**
- Modify: `js/calc.js`
- Modify: `tests/calc.test.js`

`computeSummary` takes a fully-resolved numeric `model` (the app resolves overrides/derived fees before calling). Shape:

```
model = {
  price,
  oneTime:  { purchaseTax, brokerage, attorney, tabu, advisor, fileOpening, appraiser, renovation, furniture, upgrades, rentalBrokerage },
  monthly:  { lifeBuilding, arnona, houseCommittee, currentBills, buildingContents, incomeTax, repairs, futureFund, management },
  annual:   { advertising, legal },
  mortgage: { enabled, loanAmount, monthlyPayment },
  rent, vacancyMonths
}
```

- [ ] **Step 1: Add the failing test**

```js
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
  // oneTime sum = 422500 ; + price 2,000,000 = 2,422,500
  assert.equal(s.oneTimeCosts, 422500);
  assert.equal(s.totalInvested, 2422500);
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
  // downPayment = 2,000,000 - 1,400,000 = 600,000 ; + oneTime 422,500 = 1,022,500
  assert.equal(s.totalInvested, 1022500);
  assert.equal(s.monthlyTotal, 2050 + 8000);
  assert.ok(s.cashOnCash !== null);
});

test('payback is null when cash flow is not positive', () => {
  const m = { ...baseModel, monthly: { ...baseModel.monthly, management: 100000 } };
  const s = computeSummary(m);
  assert.equal(s.paybackYears, null);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/calc.test.js`
Expected: FAIL — `computeSummary` not exported.

- [ ] **Step 3: Implement** (append to `js/calc.js`)

```js
const sum = (obj) => Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);

export function computeSummary(model) {
  const { price = 0, oneTime = {}, monthly = {}, annual = {}, mortgage = {}, rent = 0, vacancyMonths = 0 } = model;

  const oneTimeCosts = sum(oneTime);
  const financed = !!mortgage.enabled;
  const loanAmount = financed ? (Number(mortgage.loanAmount) || 0) : 0;
  const monthlyPayment = financed ? (Number(mortgage.monthlyPayment) || 0) : 0;
  const downPayment = price - loanAmount;

  const totalInvested = (financed ? downPayment : price) + oneTimeCosts;

  const monthlyOperating = sum(monthly);
  const monthlyTotal = monthlyOperating + monthlyPayment;

  const annualOperating = monthlyOperating * 12 + sum(annual);
  const annualRentContract = rent * 12;
  const annualRentEffective = rent * (12 - vacancyMonths);
  const unoccupancyLoss = rent * vacancyMonths;

  const grossYield = price > 0 ? annualRentContract / price : null;
  const noi = annualRentEffective - annualOperating;
  const netYield = totalInvested > 0 ? noi / totalInvested : null;

  const annualMortgage = monthlyPayment * 12;
  const annualCashFlow = noi - annualMortgage;
  const monthlyCashFlow = annualCashFlow / 12;
  const cashOnCash = financed && totalInvested > 0 ? annualCashFlow / totalInvested : null;
  const paybackYears = annualCashFlow > 0 ? totalInvested / annualCashFlow : null;

  return {
    oneTimeCosts, downPayment, totalInvested,
    monthlyOperating, monthlyTotal,
    annualOperating, annualRentContract, annualRentEffective, unoccupancyLoss,
    grossYield, noi, netYield,
    annualMortgage, annualCashFlow, monthlyCashFlow, cashOnCash, paybackYears,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/calc.test.js`
Expected: PASS (all calc tests).

- [ ] **Step 5: Commit**

```bash
git add js/calc.js tests/calc.test.js
git commit -m "feat: add computeSummary aggregates and return metrics"
```

---

## Task 9: Bilingual strings (`js/i18n.js`)

**Files:**
- Create: `js/i18n.js`
- Test: `tests/i18n.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/i18n.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/i18n.js`**

```js
// js/i18n.js — every key must exist in BOTH en and he (enforced by test).
export const STRINGS = {
  en: {
    app_title: 'Apartment Investment Calculator',
    toggle_theme: 'Dark mode', toggle_lang: 'עברית', toggle_currency: 'USD',
    rate_label: 'Conversion rate (₪ per $)', reset: 'Reset',
    unit_month: '(m)', unit_year: '(yr)',
    // dashboard
    dash_title: 'Investment summary',
    dash_total_invested: 'Total invested', dash_monthly_total: 'Total monthly cost',
    dash_gross_yield: 'Gross yield', dash_net_yield: 'Net yield',
    dash_cash_flow: 'Monthly cash flow', dash_coc: 'Cash-on-cash', dash_payback: 'Payback (years)',
    // categories
    cat_purchase: 'Purchase costs', cat_mortgage: 'Mortgage costs', cat_reno: 'Renovation & upgrades',
    cat_operating: 'Tax & operating', cat_maintenance: 'Maintenance', cat_admin: 'Operating & administrative',
    // fields
    f_price: 'Purchase price', f_apt_type: 'Apartment type',
    apt_single: 'Single apartment', apt_additional: 'Additional / investment',
    f_purchase_tax: 'Purchase tax', f_brokerage: 'Brokerage fee', f_attorney: 'Attorney',
    f_tabu: 'Tabu fees', f_pct: '%', f_override: 'override',
    f_advisor: 'Mortgage advisor', f_file_opening: 'File opening', f_appraiser: 'Appraiser',
    f_insurance_life: 'Insurance (life/building)',
    f_finance_toggle: 'Add mortgage financing', f_loan: 'Loan amount', f_use_ltv: 'Use LTV %',
    f_ltv: 'LTV %', f_rate: 'Annual interest %', f_term: 'Term (years)', f_monthly_payment: 'Monthly payment',
    f_reno: 'Renovation', f_reno_lineitems: 'Break down by work item',
    r_demolition: 'Demolition/drywall', r_plumbing: 'Plumbing', r_electrical: 'Electrical',
    r_flooring: 'Flooring', r_kitchen: 'Kitchen', r_bathroom: 'Bathroom', r_painting: 'Painting',
    f_furniture: 'Furniture', f_upgrades: 'Upgrades & additions', add_item: '＋ Add',
    item_name: 'Name', item_cost: 'Cost',
    f_arnona: 'Property tax (arnona)', f_arnona_helper: 'Estimate: area × rate/m²',
    f_area: 'Area (m²)', f_rate_m2: 'Rate per m²',
    f_house_committee: 'House committee', f_bills: 'Current bills',
    f_building_contents: 'Building & contents insurance', f_income_tax: 'Income tax',
    track_10: '10% flat', track_exemption: 'Exemption', track_offset: 'Self-rent offset',
    f_marginal: 'Marginal rate %', f_rent_you_pay: 'Rent you pay',
    f_repairs: 'Repairs & upkeep', f_future_fund: 'Fund for future repairs',
    f_rental_brokerage: 'Rental brokerage', f_management: 'Management fees',
    f_advertising: 'Advertising', f_legal: 'Legal expenses',
    f_rent: 'Expected monthly rent', f_vacancy: 'Vacancy (months/yr)',
    // tooltips
    tt_price: 'The main amount paid for the apartment, as agreed with the seller.',
    tt_purchase_tax: 'Tax on apartment buyers; the rate depends on how many apartments you own and the price.',
    tt_brokerage: 'Broker fee for locating the apartment, usually a % of the price (2% + VAT).',
    tt_attorney: 'Lawyer to accompany the purchase, check the property and draft the contract (0.5% + VAT).',
    tt_tabu: 'Fees for registering the apartment in your name at the Land Registry.',
    tt_advisor: 'Guides you through the loan and helps get better terms.',
    tt_file_opening: 'Bank fees for opening and processing the mortgage file.',
    tt_appraiser: 'Valuation of the property by a certified appraiser for the bank.',
    tt_insurance_life: 'Life and building insurance often required by the bank (ongoing premium).',
    tt_reno: 'Labor and materials; depends on the apartment condition and scope.',
    tt_furniture: 'Basic furniture and equipment if renting furnished.',
    tt_upgrades: 'A/C, water filtration, solar heater, etc. that raise value and rental potential.',
    tt_arnona: 'Municipal tax paid by the owner. No national formula — area × municipal rate/m².',
    tt_house_committee: 'Regular payments for shared-area maintenance and building management.',
    tt_bills: 'Water, electricity, gas while the apartment is not rented.',
    tt_building_contents: 'Protects the property against damage and resulting lost income.',
    tt_income_tax: 'Rental income is taxed per the selected track.',
    tt_repairs: 'Budget for painting, plumbing and system upgrades.',
    tt_future_fund: 'Reserve for major repairs or replacing costly items (appliances, A/C).',
    tt_rental_brokerage: "Usually one month's rent.",
    tt_management: 'Monthly fee if a management company handles the apartment and tenants.',
    tt_advertising: 'Cost of advertising a rental listing when needed.',
    tt_legal: 'Budget for disputes with tenants or lawsuits.',
    tt_rent: 'Expected monthly rent — drives all return metrics.',
    tt_vacancy: 'Average months per year with no tenant; reduces effective rent.',
    tax_disclaimer: 'Estimates only — 2026 reference figures, not tax advice.',
  },
  he: {
    app_title: 'מחשבון השקעה בדירה',
    toggle_theme: 'מצב כהה', toggle_lang: 'English', toggle_currency: '$',
    rate_label: 'שער המרה (₪ לכל $)', reset: 'איפוס',
    unit_month: '(ח)', unit_year: '(שנה)',
    dash_title: 'סיכום השקעה',
    dash_total_invested: 'סך השקעה', dash_monthly_total: 'עלות חודשית כוללת',
    dash_gross_yield: 'תשואה ברוטו', dash_net_yield: 'תשואה נטו',
    dash_cash_flow: 'תזרים חודשי', dash_coc: 'תשואה על ההון', dash_payback: 'החזר (שנים)',
    cat_purchase: 'עלויות רכישה', cat_mortgage: 'עלויות משכנתא', cat_reno: 'שיפוץ ושדרוג',
    cat_operating: 'מיסים ותפעול', cat_maintenance: 'תחזוקה', cat_admin: 'תפעול ואדמיניסטרציה',
    f_price: 'מחיר הרכישה', f_apt_type: 'סוג דירה',
    apt_single: 'דירה יחידה', apt_additional: 'דירה נוספת / השקעה',
    f_purchase_tax: 'מס רכישה', f_brokerage: 'עמלת תיווך', f_attorney: 'עלויות עו"ד',
    f_tabu: 'אגרות טאבו', f_pct: '%', f_override: 'עדכון ידני',
    f_advisor: 'יועץ משכנתאות', f_file_opening: 'פתיחת תיק', f_appraiser: 'שמאי',
    f_insurance_life: 'ביטוח (חיים/מבנה)',
    f_finance_toggle: 'הוספת מימון משכנתא', f_loan: 'סכום הלוואה', f_use_ltv: 'לפי אחוז מימון',
    f_ltv: 'אחוז מימון', f_rate: 'ריבית שנתית %', f_term: 'תקופה (שנים)', f_monthly_payment: 'תשלום חודשי',
    f_reno: 'שיפוץ', f_reno_lineitems: 'פירוט לפי עבודות',
    r_demolition: 'פירוק/גבס', r_plumbing: 'אינסטלציה', r_electrical: 'חשמל',
    r_flooring: 'ריצוף', r_kitchen: 'מטבח', r_bathroom: 'אמבטיה', r_painting: 'צביעה',
    f_furniture: 'ריהוט', f_upgrades: 'שדרוגים ותוספות', add_item: '＋ הוספה',
    item_name: 'שם', item_cost: 'עלות',
    f_arnona: 'ארנונה', f_arnona_helper: 'הערכה: שטח × תעריף למ"ר',
    f_area: 'שטח (מ"ר)', f_rate_m2: 'תעריף למ"ר',
    f_house_committee: 'ועד בית', f_bills: 'חשבונות שוטפים',
    f_building_contents: 'ביטוח מבנה ותכולה', f_income_tax: 'מס הכנסה',
    track_10: '10% קבוע', track_exemption: 'מסלול פטור', track_offset: 'קיזוז שכ"ד עצמי',
    f_marginal: 'מדרגת מס שולי %', f_rent_you_pay: 'שכ"ד שאתם משלמים',
    f_repairs: 'תיקונים ותחזוקה', f_future_fund: 'קרן לתיקונים עתידיים',
    f_rental_brokerage: 'תיווך להשכרה', f_management: 'דמי ניהול',
    f_advertising: 'פרסום', f_legal: 'הוצאות משפטיות',
    f_rent: 'שכר דירה חודשי צפוי', f_vacancy: 'אי-תפוסה (חודשים בשנה)',
    tt_price: 'הסכום העיקרי שתשלמו עבור הדירה, כפי שסוכם עם המוכר.',
    tt_purchase_tax: 'מס על רוכשי דירות; השיעור תלוי במספר הדירות שבבעלותכם ובמחיר.',
    tt_brokerage: 'עמלה למתווך על איתור הדירה, לרוב אחוז ממחיר העסקה (2% + מע"מ).',
    tt_attorney: 'עורך דין לליווי הרכישה, בדיקת הנכס וניסוח החוזה (0.5% + מע"מ).',
    tt_tabu: 'תשלומים לרישום הדירה על שמכם בלשכת רישום המקרקעין.',
    tt_advisor: 'מלווה אתכם בתהליך ההלוואה ומסייע בתנאים טובים יותר.',
    tt_file_opening: 'עמלות הבנק לפתיחת תיק משכנתא וטיפול בבקשה.',
    tt_appraiser: 'הערכת שווי הנכס על ידי שמאי מוסמך מטעם הבנק.',
    tt_insurance_life: 'ביטוח חיים ומבנה הנדרשים לרוב על ידי הבנק (תשלום שוטף).',
    tt_reno: 'עלויות עבודה וחומרים; תלוי במצב הדירה ובהיקף השיפוץ.',
    tt_furniture: 'ריהוט וציוד בסיסיים אם משכירים מרוהט.',
    tt_upgrades: 'מיזוג, סינון מים, דוד שמש ועוד שמגדילים את הערך ואת פוטנציאל ההשכרה.',
    tt_arnona: 'מס עירוני המשולם על ידי בעל הנכס. אין נוסחה ארצית — שטח × תעריף למ"ר.',
    tt_house_committee: 'תשלומים קבועים לאחזקת השטחים המשותפים וניהול הבניין.',
    tt_bills: 'מים, חשמל וגז בזמן שהדירה אינה מושכרת.',
    tt_building_contents: 'מגן על הנכס מפני נזקים ואובדן הכנסות כתוצאה מכך.',
    tt_income_tax: 'הכנסות משכר דירה חייבות במס לפי המסלול שנבחר.',
    tt_repairs: 'תקציב לצביעה, אינסטלציה ושדרוג מערכות.',
    tt_future_fund: 'הפרשה לתיקונים גדולים או החלפת פריטים יקרים.',
    tt_rental_brokerage: 'לרוב בגובה שכר דירה לחודש.',
    tt_management: 'דמי ניהול חודשיים אם חברת ניהול מטפלת בדירה ובדיירים.',
    tt_advertising: 'עלות פרסום מודעת השכרה במידת הצורך.',
    tt_legal: 'תקציב לסכסוכים עם שוכרים או תביעות.',
    tt_rent: 'שכר הדירה החודשי הצפוי — קובע את כל מדדי התשואה.',
    tt_vacancy: 'ממוצע חודשים בשנה ללא שוכר; מקטין את שכר הדירה האפקטיבי.',
    tax_disclaimer: 'הערכה בלבד — נתוני 2026 להמחשה, לא ייעוץ מס.',
  },
};

export function t(key, lang = 'he') {
  const table = STRINGS[lang] || STRINGS.he;
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/i18n.test.js`
Expected: PASS. If key-parity fails, add the missing key to the other language — do not delete.

- [ ] **Step 5: Commit**

```bash
git add js/i18n.js tests/i18n.test.js
git commit -m "feat: add bilingual strings (labels + tooltips) with parity test"
```

---

## Task 10: Declarative field config (`js/fields.js`)

Plain money fields are declared here and rendered generically. Special controls (purchase tax, brokerage/attorney computed, mortgage block, renovation, furniture/upgrades, income tax, arnona) carry `widget` names that `render.js`/`app.js` handle explicitly.

**Files:**
- Create: `js/fields.js`
- Test: `tests/fields.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/fields.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/fields.js`**

```js
// js/fields.js — declarative config. `path` maps into state.values.
// widget: 'money' (default numeric), 'computed-tax', 'percent-fee', 'mortgage',
//         'renovation', 'itemlist', 'income-tax', 'arnona', 'apt-type'
export const CATEGORIES = [
  { id: 'purchase', titleKey: 'cat_purchase', fields: [
    { id: 'price', path: 'price', labelKey: 'f_price', unit: 'once', tooltipKey: 'tt_price', widget: 'money' },
    { id: 'aptType', path: 'apartmentType', labelKey: 'f_apt_type', unit: 'once', widget: 'apt-type' },
    { id: 'purchaseTax', path: 'purchaseTax', labelKey: 'f_purchase_tax', unit: 'once', tooltipKey: 'tt_purchase_tax', widget: 'computed-tax' },
    { id: 'brokerage', path: 'brokerage', labelKey: 'f_brokerage', unit: 'once', tooltipKey: 'tt_brokerage', widget: 'percent-fee', pctPath: 'brokeragePct' },
    { id: 'attorney', path: 'attorney', labelKey: 'f_attorney', unit: 'once', tooltipKey: 'tt_attorney', widget: 'percent-fee', pctPath: 'attorneyPct' },
    { id: 'tabu', path: 'tabu', labelKey: 'f_tabu', unit: 'once', tooltipKey: 'tt_tabu', widget: 'money' },
  ]},
  { id: 'mortgage', titleKey: 'cat_mortgage', fields: [
    { id: 'advisor', path: 'advisor', labelKey: 'f_advisor', unit: 'once', tooltipKey: 'tt_advisor', widget: 'money' },
    { id: 'fileOpening', path: 'fileOpening', labelKey: 'f_file_opening', unit: 'once', tooltipKey: 'tt_file_opening', widget: 'money' },
    { id: 'appraiser', path: 'appraiser', labelKey: 'f_appraiser', unit: 'once', tooltipKey: 'tt_appraiser', widget: 'money' },
    { id: 'lifeBuilding', path: 'lifeBuilding', labelKey: 'f_insurance_life', unit: 'month', tooltipKey: 'tt_insurance_life', widget: 'money' },
    { id: 'financing', path: 'mortgage', labelKey: 'f_finance_toggle', unit: 'once', widget: 'mortgage' },
  ]},
  { id: 'reno', titleKey: 'cat_reno', fields: [
    { id: 'renovation', path: 'renovation', labelKey: 'f_reno', unit: 'once', tooltipKey: 'tt_reno', widget: 'renovation' },
    { id: 'furniture', path: 'furniture', labelKey: 'f_furniture', unit: 'once', tooltipKey: 'tt_furniture', widget: 'itemlist' },
    { id: 'upgrades', path: 'upgrades', labelKey: 'f_upgrades', unit: 'once', tooltipKey: 'tt_upgrades', widget: 'itemlist' },
  ]},
  { id: 'operating', titleKey: 'cat_operating', fields: [
    { id: 'arnona', path: 'arnona', labelKey: 'f_arnona', unit: 'month', tooltipKey: 'tt_arnona', widget: 'arnona' },
    { id: 'houseCommittee', path: 'houseCommittee', labelKey: 'f_house_committee', unit: 'month', tooltipKey: 'tt_house_committee', widget: 'money' },
    { id: 'currentBills', path: 'currentBills', labelKey: 'f_bills', unit: 'month', tooltipKey: 'tt_bills', widget: 'money' },
    { id: 'buildingContents', path: 'buildingContents', labelKey: 'f_building_contents', unit: 'month', tooltipKey: 'tt_building_contents', widget: 'money' },
    { id: 'incomeTax', path: 'incomeTax', labelKey: 'f_income_tax', unit: 'month', tooltipKey: 'tt_income_tax', widget: 'income-tax' },
  ]},
  { id: 'maintenance', titleKey: 'cat_maintenance', fields: [
    { id: 'repairs', path: 'repairs', labelKey: 'f_repairs', unit: 'month', tooltipKey: 'tt_repairs', widget: 'money' },
    { id: 'futureFund', path: 'futureFund', labelKey: 'f_future_fund', unit: 'month', tooltipKey: 'tt_future_fund', widget: 'money' },
  ]},
  { id: 'admin', titleKey: 'cat_admin', fields: [
    { id: 'rentalBrokerage', path: 'rentalBrokerage', labelKey: 'f_rental_brokerage', unit: 'once', tooltipKey: 'tt_rental_brokerage', widget: 'money' },
    { id: 'management', path: 'management', labelKey: 'f_management', unit: 'month', tooltipKey: 'tt_management', widget: 'money' },
    { id: 'advertising', path: 'advertising', labelKey: 'f_advertising', unit: 'year', tooltipKey: 'tt_advertising', widget: 'money' },
    { id: 'legal', path: 'legal', labelKey: 'f_legal', unit: 'year', tooltipKey: 'tt_legal', widget: 'money' },
  ]},
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/fields.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/fields.js tests/fields.test.js
git commit -m "feat: add declarative category/field config"
```

---

## Task 11: State model + persistence + buildModel (`js/state.js`)

**Files:**
- Create: `js/state.js`
- Test: `tests/state.test.js`

`state.js` owns the default state, `localStorage` load/save, and `buildModel(state)` which resolves overrides/derived fees using `calc.js` and returns the `model` that `computeSummary` consumes.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/state.js`**

```js
// js/state.js
import { DEFAULTS } from './data.js';
import { calcPurchaseTax, calcPercentFee, mortgageMonthlyPayment, calcIncomeTaxMonthly } from './calc.js';

const STORAGE_KEY = 'apt-calc-state-v1';

export function defaultState() {
  return {
    ui: { lang: 'he', currency: 'ILS', rate: DEFAULTS.rate, dark: false },
    values: {
      price: 0,
      apartmentType: 'additional',
      purchaseTaxOverride: null,
      brokeragePct: DEFAULTS.brokeragePct, brokerageOverride: null,
      attorneyPct: DEFAULTS.attorneyPct, attorneyOverride: null,
      tabu: DEFAULTS.tabu,
      advisor: DEFAULTS.advisor, fileOpening: DEFAULTS.fileOpening, appraiser: DEFAULTS.appraiser,
      lifeBuilding: 0,
      mortgage: { enabled: false, useLtv: false, loanAmount: 0, ltvPct: 0,
                  annualRate: DEFAULTS.annualRate, termYears: DEFAULTS.termYears },
      renovation: { useLineItems: false, lump: 0,
                    lineItems: { demolition: 0, plumbing: 0, electrical: 0, flooring: 0, kitchen: 0, bathroom: 0, painting: 0 } },
      furniture: [], upgrades: [],
      arnona: 0, arnonaArea: 0, arnonaRate: 0,
      houseCommittee: 0, currentBills: 0, buildingContents: 0,
      incomeTrack: '10', marginalRate: DEFAULTS.marginalRate, rentYouPay: 0,
      repairs: 0, futureFund: 0,
      rentalBrokerage: null, // null = default to one month rent
      management: 0, advertising: 0, legal: 0,
      rent: 0, vacancyMonths: DEFAULTS.vacancyMonths,
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    // shallow-merge to tolerate older shapes
    const base = defaultState();
    return { ui: { ...base.ui, ...saved.ui }, values: { ...base.values, ...saved.values,
      mortgage: { ...base.values.mortgage, ...(saved.values?.mortgage) },
      renovation: { ...base.values.renovation, ...(saved.values?.renovation),
        lineItems: { ...base.values.renovation.lineItems, ...(saved.values?.renovation?.lineItems) } },
      furniture: saved.values?.furniture ?? [], upgrades: saved.values?.upgrades ?? [] } };
  } catch { return defaultState(); }
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore quota */ }
}

export function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

const sumItems = (arr) => (arr || []).reduce((a, it) => a + (Number(it.cost) || 0), 0);

export function renovationTotal(v) {
  if (v.renovation.useLineItems) {
    return Object.values(v.renovation.lineItems).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return Number(v.renovation.lump) || 0;
}

export function resolveLoanAmount(v) {
  const m = v.mortgage;
  if (!m.enabled) return 0;
  return m.useLtv ? Math.round((Number(m.ltvPct) || 0) / 100 * (Number(v.price) || 0)) : (Number(m.loanAmount) || 0);
}

export function buildModel(state) {
  const v = state.values;
  const purchaseTax = v.purchaseTaxOverride != null ? Number(v.purchaseTaxOverride)
    : calcPurchaseTax(v.price, v.apartmentType);
  const brokerage = v.brokerageOverride != null ? Number(v.brokerageOverride)
    : calcPercentFee(v.price, v.brokeragePct);
  const attorney = v.attorneyOverride != null ? Number(v.attorneyOverride)
    : calcPercentFee(v.price, v.attorneyPct);
  const loanAmount = resolveLoanAmount(v);
  const monthlyPayment = v.mortgage.enabled
    ? mortgageMonthlyPayment(loanAmount, v.mortgage.annualRate, v.mortgage.termYears) : 0;
  const incomeTax = calcIncomeTaxMonthly({
    rent: v.rent, track: v.incomeTrack, marginalRate: v.marginalRate, rentYouPay: v.rentYouPay });
  const rentalBrokerage = v.rentalBrokerage != null ? Number(v.rentalBrokerage) : (Number(v.rent) || 0);

  return {
    price: Number(v.price) || 0,
    oneTime: {
      purchaseTax, brokerage, attorney, tabu: Number(v.tabu) || 0,
      advisor: Number(v.advisor) || 0, fileOpening: Number(v.fileOpening) || 0, appraiser: Number(v.appraiser) || 0,
      renovation: renovationTotal(v), furniture: sumItems(v.furniture), upgrades: sumItems(v.upgrades),
      rentalBrokerage,
    },
    monthly: {
      lifeBuilding: Number(v.lifeBuilding) || 0, arnona: Number(v.arnona) || 0,
      houseCommittee: Number(v.houseCommittee) || 0, currentBills: Number(v.currentBills) || 0,
      buildingContents: Number(v.buildingContents) || 0, incomeTax,
      repairs: Number(v.repairs) || 0, futureFund: Number(v.futureFund) || 0, management: Number(v.management) || 0,
    },
    annual: { advertising: Number(v.advertising) || 0, legal: Number(v.legal) || 0 },
    mortgage: { enabled: v.mortgage.enabled, loanAmount, monthlyPayment },
    rent: Number(v.rent) || 0, vacancyMonths: Number(v.vacancyMonths) || 0,
    // pass-throughs the UI needs for display:
    _derived: { purchaseTax, brokerage, attorney, loanAmount, monthlyPayment, incomeTax, rentalBrokerage },
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS. (Node has no `localStorage`; the tests only call `defaultState`/`buildModel`, so this is fine.)

- [ ] **Step 5: Commit**

```bash
git add js/state.js tests/state.test.js
git commit -m "feat: add state model, persistence, and buildModel resolver"
```

---

## Task 12: HTML shell + stylesheet (`index.html`, `css/styles.css`)

**Files:**
- Create: `index.html`
- Create: `css/styles.css`

- [ ] **Step 1: Create `index.html`**

```html
<!doctype html>
<html lang="he" dir="rtl" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>מחשבון השקעה בדירה</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="app-header">
    <h1 id="appTitle">מחשבון השקעה בדירה</h1>
    <div class="toggles">
      <label class="rate"><span id="rateLabel">שער המרה</span>
        <input id="rateInput" type="number" step="0.01" min="0.01" inputmode="decimal"></label>
      <button id="btnCurrency" class="toggle" type="button">$</button>
      <button id="btnLang" class="toggle" type="button">English</button>
      <button id="btnTheme" class="toggle" type="button">🌙</button>
      <button id="btnReset" class="toggle" type="button">↺</button>
    </div>
  </header>

  <main class="layout">
    <section id="inputs" class="inputs"><!-- categories rendered here --></section>
    <aside id="dashboard" class="dashboard"><!-- summary rendered here --></aside>
  </main>

  <div id="mobileBar" class="mobile-bar" hidden><!-- compact summary on mobile --></div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/styles.css`**

```css
:root {
  --blue-50:#eff3ff; --blue-200:#9ecae1; --blue-300:#6baed6; --blue-500:#3182bd; --blue-700:#08519c;
  --bg:#f7faff; --surface:#ffffff; --text:#0b2545; --muted:#5b7290; --border:#dbe7f7;
  --accent:var(--blue-500); --accent-strong:var(--blue-700);
}
:root[data-theme="dark"] {
  --bg:#0b1622; --surface:#12212f; --text:#e6eefb; --muted:#9db4cf; --border:#22384c;
  --accent:var(--blue-300); --accent-strong:var(--blue-200);
}
* { box-sizing:border-box; }
body { margin:0; font-family:system-ui,"Segoe UI",Arial,sans-serif; background:var(--bg); color:var(--text); }

.app-header { position:sticky; top:0; z-index:20; display:flex; flex-wrap:wrap; gap:12px;
  align-items:center; justify-content:space-between; padding:12px 16px; background:var(--accent-strong);
  color:#fff; }
.app-header h1 { font-size:18px; margin:0; }
.toggles { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.toggles .rate { display:flex; gap:6px; align-items:center; font-size:12px; color:#dbe7f7; }
.toggles .rate input { width:76px; padding:5px 7px; border-radius:8px; border:none; }
.toggle { border:1px solid rgba(255,255,255,.4); background:rgba(255,255,255,.12); color:#fff;
  border-radius:8px; padding:6px 10px; cursor:pointer; font-size:13px; }
.toggle:hover { background:rgba(255,255,255,.25); }

.layout { display:grid; grid-template-columns:1fr 340px; gap:18px; max-width:1100px;
  margin:18px auto; padding:0 16px; align-items:start; }
html[dir="rtl"] .layout { direction:rtl; }

.category { background:var(--surface); border:1px solid var(--border); border-radius:14px;
  margin-bottom:14px; overflow:hidden; }
.category > summary { list-style:none; cursor:pointer; padding:14px 16px; font-weight:700;
  color:var(--accent-strong); display:flex; justify-content:space-between; align-items:center; }
.category > summary::-webkit-details-marker { display:none; }
.category[open] > summary { border-bottom:1px solid var(--border); }
.cat-body { padding:8px 16px 16px; }

.field { display:flex; flex-direction:column; gap:5px; padding:9px 0; border-bottom:1px dashed var(--border); }
.field:last-child { border-bottom:none; }
.field .flabel { display:flex; align-items:center; gap:8px; font-size:14px; }
.field .unit { color:var(--muted); font-size:12px; }
.info { width:18px; height:18px; border-radius:50%; border:1px solid var(--accent);
  color:var(--accent); font-size:12px; line-height:16px; text-align:center; cursor:pointer;
  background:transparent; }
.tooltip { display:none; font-size:12px; color:var(--muted); background:var(--blue-50);
  border:1px solid var(--border); border-radius:8px; padding:7px 9px; }
:root[data-theme="dark"] .tooltip { background:#0e1b28; }
.field.show-tip .tooltip { display:block; }
@media (hover:hover) { .field .flabel:hover + .tooltip { display:block; } }

input[type="number"], input[type="text"], select { width:100%; padding:9px 10px; font-size:14px;
  border:1px solid var(--border); border-radius:9px; background:var(--bg); color:var(--text); }
.row { display:flex; gap:8px; align-items:center; }
.row > * { flex:1; }
.muted { color:var(--muted); font-size:12px; }
.computed { font-variant-numeric:tabular-nums; }
.itemrow { display:flex; gap:8px; margin-top:6px; }
.itemrow .name { flex:1.4; } .itemrow .cost { flex:1; }
.btn-add { margin-top:8px; background:var(--blue-50); color:var(--accent-strong);
  border:1px dashed var(--accent); border-radius:9px; padding:7px 10px; cursor:pointer; }
.btn-del { border:none; background:transparent; color:#c0392b; cursor:pointer; font-size:16px; }

.dashboard { position:sticky; top:78px; background:var(--surface); border:1px solid var(--border);
  border-radius:16px; padding:16px; }
.dashboard h2 { margin:0 0 10px; font-size:15px; color:var(--accent-strong); }
.metric { display:flex; justify-content:space-between; padding:9px 11px; border-radius:10px;
  margin-bottom:7px; background:var(--blue-50); font-size:14px; }
:root[data-theme="dark"] .metric { background:#0e1b28; }
.metric.primary { background:var(--accent-strong); color:#fff; font-weight:700; }
.metric.accent { background:var(--blue-300); color:#fff; font-weight:700; }
.metric .val { font-variant-numeric:tabular-nums; }
.disclaimer { margin-top:10px; font-size:11px; color:var(--muted); }

.mobile-bar { position:fixed; inset-inline:0; bottom:0; z-index:30; background:var(--accent-strong);
  color:#fff; display:flex; justify-content:space-around; padding:10px 14px; cursor:pointer; }

@media (max-width:820px) {
  .layout { grid-template-columns:1fr; }
  .dashboard { position:static; }
  .dashboard.collapsed-mobile { display:none; }
  .mobile-bar { display:flex; }
}
```

- [ ] **Step 3: Serve and eyeball the shell**

Run: `python -m http.server 8000` (or `npx serve -l 8000`), open `http://localhost:8000`.
Expected: Blue sticky header with title + toggle buttons and a rate input; empty two-column area below. No console errors except the missing `js/app.js` (added next). Stop the server with Ctrl-C when done.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: add HTML shell and themed responsive stylesheet"
```

---

## Task 13: Rendering engine (`js/render.js`)

Builds category/field DOM from `fields.js`, plus the dashboard. Emits change events via a passed-in `onChange(path, value)` callback and re-renders on demand. Special widgets are built here from small helpers.

**Files:**
- Create: `js/render.js`

- [ ] **Step 1: Implement `js/render.js`**

```js
// js/render.js
import { CATEGORIES } from './fields.js';
import { t } from './i18n.js';
import { RENOVATION_HINTS } from './data.js';
import { formatMoney, formatPercent, toDisplay, parseToNis } from './calc.js';

const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

// money <input> bound to a ₪ value in state; converts for display.
function moneyInput(valueNis, ui, onInput) {
  const inp = el('input'); inp.type = 'number'; inp.inputMode = 'decimal'; inp.step = 'any';
  inp.value = valueNis ? Math.round(toDisplay(valueNis, ui.currency, ui.rate)) : '';
  inp.addEventListener('input', () => onInput(inp.value === '' ? 0 : parseToNis(inp.value, ui.currency, ui.rate)));
  return inp;
}

function labelRow(f, lang, onToggleTip) {
  const wrap = el('div', 'flabel');
  wrap.appendChild(el('span', null, t(f.labelKey, lang)));
  if (f.unit === 'month') wrap.appendChild(el('span', 'unit', t('unit_month', lang)));
  if (f.unit === 'year') wrap.appendChild(el('span', 'unit', t('unit_year', lang)));
  if (f.tooltipKey) {
    const i = el('button', 'info', 'i'); i.type = 'button';
    i.addEventListener('click', onToggleTip);
    wrap.appendChild(i);
  }
  return wrap;
}

// Generic field container with label + tooltip; body filled by caller.
function fieldShell(f, lang) {
  const field = el('div', 'field');
  const tip = el('div', 'tooltip', f.tooltipKey ? t(f.tooltipKey, lang) : '');
  field.appendChild(labelRow(f, lang, () => field.classList.toggle('show-tip')));
  return { field, tip };
}

export function renderInputs(root, state, ctx) {
  root.innerHTML = '';
  const { lang } = state.ui;
  for (const cat of CATEGORIES) {
    const details = el('details', 'category'); details.open = true;
    const summary = el('summary'); summary.appendChild(el('span', null, t(cat.titleKey, lang)));
    details.appendChild(summary);
    const body = el('div', 'cat-body');
    for (const f of cat.fields) body.appendChild(buildField(f, state, ctx));
    details.appendChild(body);
    root.appendChild(details);
  }
}

function buildField(f, state, ctx) {
  const { lang } = state.ui;
  const v = state.values;
  const { field, tip } = fieldShell(f, lang);
  const set = (path, value) => ctx.onChange(path, value);

  const appendTipLast = (node) => { field.appendChild(node); field.appendChild(tip); };

  switch (f.widget) {
    case 'money': {
      appendTipLast(moneyInput(v[f.path], state.ui, (nis) => set(f.path, nis)));
      break;
    }
    case 'apt-type': {
      const sel = el('select');
      for (const [val, key] of [['additional', 'apt_additional'], ['single', 'apt_single']]) {
        const o = el('option', null, t(key, lang)); o.value = val; if (v.apartmentType === val) o.selected = true; sel.appendChild(o);
      }
      sel.addEventListener('change', () => set('apartmentType', sel.value));
      appendTipLast(sel);
      break;
    }
    case 'computed-tax': {
      const box = el('div', 'row');
      const shown = el('div', 'computed', formatMoney(ctx.derived.purchaseTax, state.ui));
      const override = el('input'); override.type = 'number'; override.placeholder = t('f_override', lang);
      override.value = v.purchaseTaxOverride != null ? Math.round(toDisplay(v.purchaseTaxOverride, state.ui.currency, state.ui.rate)) : '';
      override.addEventListener('input', () => set('purchaseTaxOverride', override.value === '' ? null : parseToNis(override.value, state.ui.currency, state.ui.rate)));
      box.append(shown, override);
      appendTipLast(box);
      break;
    }
    case 'percent-fee': {
      const box = el('div', 'row');
      const pct = el('input'); pct.type = 'number'; pct.step = '0.01'; pct.value = (v[f.pctPath] * 100);
      pct.title = t('f_pct', lang);
      pct.addEventListener('input', () => set(f.pctPath, (Number(pct.value) || 0) / 100));
      const shownKey = f.id === 'brokerage' ? 'brokerage' : 'attorney';
      const shown = el('div', 'computed', formatMoney(ctx.derived[shownKey], state.ui));
      const override = el('input'); override.type = 'number'; override.placeholder = t('f_override', lang);
      const ovPath = f.id === 'brokerage' ? 'brokerageOverride' : 'attorneyOverride';
      override.value = v[ovPath] != null ? Math.round(toDisplay(v[ovPath], state.ui.currency, state.ui.rate)) : '';
      override.addEventListener('input', () => set(ovPath, override.value === '' ? null : parseToNis(override.value, state.ui.currency, state.ui.rate)));
      box.append(pct, shown, override);
      appendTipLast(box);
      break;
    }
    case 'mortgage': {
      appendTipLast(buildMortgage(state, ctx));
      break;
    }
    case 'renovation': {
      appendTipLast(buildRenovation(state, ctx));
      break;
    }
    case 'itemlist': {
      appendTipLast(buildItemList(f.path, state, ctx));
      break;
    }
    case 'income-tax': {
      appendTipLast(buildIncomeTax(state, ctx));
      break;
    }
    case 'arnona': {
      appendTipLast(buildArnona(state, ctx));
      break;
    }
    default: appendTipLast(el('div'));
  }
  return field;
}

function buildMortgage(state, ctx) {
  const v = state.values, lang = state.ui.lang, set = ctx.onChange;
  const wrap = el('div');
  const toggle = el('label', 'row');
  const cb = el('input'); cb.type = 'checkbox'; cb.checked = v.mortgage.enabled;
  cb.addEventListener('change', () => set('mortgage.enabled', cb.checked));
  toggle.append(cb, el('span', null, t('f_finance_toggle', lang)));
  wrap.appendChild(toggle);
  if (v.mortgage.enabled) {
    const box = el('div');
    const useLtv = el('label', 'row');
    const lc = el('input'); lc.type = 'checkbox'; lc.checked = v.mortgage.useLtv;
    lc.addEventListener('change', () => set('mortgage.useLtv', lc.checked));
    useLtv.append(lc, el('span', null, t('f_use_ltv', lang)));
    box.appendChild(useLtv);
    const amount = el('div', 'row');
    if (v.mortgage.useLtv) {
      const ltv = el('input'); ltv.type = 'number'; ltv.value = v.mortgage.ltvPct || ''; ltv.placeholder = t('f_ltv', lang);
      ltv.addEventListener('input', () => set('mortgage.ltvPct', Number(ltv.value) || 0));
      amount.appendChild(ltv);
    } else {
      amount.appendChild(moneyInput(v.mortgage.loanAmount, state.ui, (nis) => set('mortgage.loanAmount', nis)));
    }
    box.appendChild(amount);
    const terms = el('div', 'row');
    const rate = el('input'); rate.type = 'number'; rate.step = '0.01'; rate.value = (v.mortgage.annualRate * 100) || ''; rate.placeholder = t('f_rate', lang);
    rate.addEventListener('input', () => set('mortgage.annualRate', (Number(rate.value) || 0) / 100));
    const term = el('input'); term.type = 'number'; term.value = v.mortgage.termYears || ''; term.placeholder = t('f_term', lang);
    term.addEventListener('input', () => set('mortgage.termYears', Number(term.value) || 0));
    terms.append(rate, term);
    box.appendChild(terms);
    box.appendChild(el('div', 'muted', t('f_monthly_payment', lang) + ': ' + formatMoney(ctx.derived.monthlyPayment, state.ui)));
    wrap.appendChild(box);
  }
  return wrap;
}

function buildRenovation(state, ctx) {
  const v = state.values, lang = state.ui.lang, set = ctx.onChange;
  const wrap = el('div');
  const toggle = el('label', 'row');
  const cb = el('input'); cb.type = 'checkbox'; cb.checked = v.renovation.useLineItems;
  cb.addEventListener('change', () => set('renovation.useLineItems', cb.checked));
  toggle.append(cb, el('span', null, t('f_reno_lineitems', lang)));
  if (!v.renovation.useLineItems) {
    wrap.appendChild(moneyInput(v.renovation.lump, state.ui, (nis) => set('renovation.lump', nis)));
    wrap.appendChild(toggle);
  } else {
    wrap.appendChild(toggle);
    for (const key of ['demolition', 'plumbing', 'electrical', 'flooring', 'kitchen', 'bathroom', 'painting']) {
      const row = el('div', 'row');
      row.appendChild(el('span', 'muted', t('r_' + key, lang)));
      const inp = moneyInput(v.renovation.lineItems[key], state.ui, (nis) => set('renovation.lineItems.' + key, nis));
      inp.title = RENOVATION_HINTS[key] || '';
      row.appendChild(inp);
      wrap.appendChild(row);
    }
  }
  return wrap;
}

function buildItemList(path, state, ctx) {
  const arr = state.values[path] || [], lang = state.ui.lang, set = ctx.onChange;
  const wrap = el('div');
  arr.forEach((item, idx) => {
    const row = el('div', 'itemrow');
    const name = el('input', 'name'); name.type = 'text'; name.placeholder = t('item_name', lang); name.value = item.name || '';
    name.addEventListener('input', () => set(`${path}.${idx}.name`, name.value));
    const cost = el('input', 'cost'); cost.type = 'number'; cost.placeholder = t('item_cost', lang);
    cost.value = item.cost ? Math.round(toDisplay(item.cost, state.ui.currency, state.ui.rate)) : '';
    cost.addEventListener('input', () => set(`${path}.${idx}.cost`, cost.value === '' ? 0 : parseToNis(cost.value, state.ui.currency, state.ui.rate)));
    const del = el('button', 'btn-del', '×'); del.type = 'button';
    del.addEventListener('click', () => ctx.removeItem(path, idx));
    row.append(name, cost, del);
    wrap.appendChild(row);
  });
  const add = el('button', 'btn-add', t('add_item', lang)); add.type = 'button';
  add.addEventListener('click', () => ctx.addItem(path));
  wrap.appendChild(add);
  return wrap;
}

function buildIncomeTax(state, ctx) {
  const v = state.values, lang = state.ui.lang, set = ctx.onChange;
  const wrap = el('div');
  const sel = el('select');
  for (const [val, key] of [['10', 'track_10'], ['exemption', 'track_exemption'], ['offset', 'track_offset']]) {
    const o = el('option', null, t(key, lang)); o.value = val; if (v.incomeTrack === val) o.selected = true; sel.appendChild(o);
  }
  sel.addEventListener('change', () => set('incomeTrack', sel.value));
  wrap.appendChild(sel);
  if (v.incomeTrack === 'exemption') {
    const mr = el('input'); mr.type = 'number'; mr.step = '0.5'; mr.value = (v.marginalRate * 100); mr.placeholder = t('f_marginal', lang);
    mr.addEventListener('input', () => set('marginalRate', (Number(mr.value) || 0) / 100));
    wrap.appendChild(mr);
  }
  if (v.incomeTrack === 'offset') {
    wrap.appendChild(moneyInput(v.rentYouPay, state.ui, (nis) => set('rentYouPay', nis)));
  }
  wrap.appendChild(el('div', 'muted', t('f_income_tax', lang) + ': ' + formatMoney(ctx.derived.incomeTax, state.ui) + ' ' + t('unit_month', lang)));
  return wrap;
}

function buildArnona(state, ctx) {
  const v = state.values, lang = state.ui.lang, set = ctx.onChange;
  const wrap = el('div');
  wrap.appendChild(moneyInput(v.arnona, state.ui, (nis) => set('arnona', nis)));
  const helper = el('div', 'row');
  const area = el('input'); area.type = 'number'; area.placeholder = t('f_area', lang); area.value = v.arnonaArea || '';
  const rate = el('input'); rate.type = 'number'; rate.placeholder = t('f_rate_m2', lang); rate.value = v.arnonaRate || '';
  const apply = () => { const val = (Number(area.value) || 0) * (Number(rate.value) || 0); if (val > 0) set('arnona', Math.round(val)); };
  area.addEventListener('input', () => { set('arnonaArea', Number(area.value) || 0); apply(); });
  rate.addEventListener('input', () => { set('arnonaRate', Number(rate.value) || 0); apply(); });
  helper.append(area, rate);
  wrap.appendChild(el('div', 'muted', t('f_arnona_helper', lang)));
  wrap.appendChild(helper);
  return wrap;
}

export function renderDashboard(root, mobileBar, summary, state) {
  const lang = state.ui.lang, ui = state.ui;
  root.innerHTML = '';
  root.appendChild(el('h2', null, t('dash_title', lang)));
  const metric = (labelKey, valueStr, cls) => {
    const m = el('div', 'metric' + (cls ? ' ' + cls : ''));
    m.append(el('span', null, t(labelKey, lang)), el('span', 'val', valueStr));
    return m;
  };
  root.appendChild(metric('dash_total_invested', formatMoney(summary.totalInvested, ui), 'primary'));
  root.appendChild(metric('dash_monthly_total', formatMoney(summary.monthlyTotal, ui) + ' ' + t('unit_month', lang), 'accent'));
  root.appendChild(metric('dash_gross_yield', formatPercent(summary.grossYield)));
  root.appendChild(metric('dash_net_yield', formatPercent(summary.netYield)));
  root.appendChild(metric('dash_cash_flow', formatMoney(summary.monthlyCashFlow, ui)));
  if (state.values.mortgage.enabled) root.appendChild(metric('dash_coc', formatPercent(summary.cashOnCash)));
  root.appendChild(metric('dash_payback', summary.paybackYears == null ? '—' : summary.paybackYears.toFixed(1)));
  root.appendChild(el('div', 'disclaimer', t('tax_disclaimer', lang)));

  if (mobileBar) {
    mobileBar.innerHTML = '';
    mobileBar.append(
      dashMini(t('dash_net_yield', lang), formatPercent(summary.netYield)),
      dashMini(t('dash_cash_flow', lang), formatMoney(summary.monthlyCashFlow, ui)),
    );
  }
}
function dashMini(label, val) {
  const d = el('div'); d.append(el('div', 'muted', label), el('div', null, val)); return d;
}
```

- [ ] **Step 2: Commit** (verified via the app in the next task)

```bash
git add js/render.js
git commit -m "feat: add DOM rendering engine for fields, widgets, and dashboard"
```

---

## Task 14: App orchestration + wiring (`js/app.js`)

Wires load → render → recalc, the three toggles + rate + reset, nested `set(path,value)`, and ＋list add/remove. Re-renders inputs only when structural state changes (widget toggles, list add/remove, language, currency); updates the dashboard on every keystroke.

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Implement `js/app.js`**

```js
// js/app.js
import { loadState, saveState, clearState, defaultState, buildModel } from './state.js';
import { computeSummary } from './calc.js';
import { renderInputs, renderDashboard } from './render.js';
import { t } from './i18n.js';

let state = loadState();

const $ = (id) => document.getElementById(id);
const inputsRoot = $('inputs');
const dashRoot = $('dashboard');
const mobileBar = $('mobileBar');

function setPath(path, value) {
  const parts = path.split('.');
  let obj = state.values;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
}

// Structural changes require a full input re-render; plain money edits do not.
const STRUCTURAL = new Set(['apartmentType', 'incomeTrack', 'mortgage.enabled', 'mortgage.useLtv', 'renovation.useLineItems']);

function onChange(path, value) {
  setPath(path, value);
  saveState(state);
  if (STRUCTURAL.has(path)) renderAll(); else recalc();
}

function addItem(path) {
  state.values[path] = [...(state.values[path] || []), { name: '', cost: 0 }];
  saveState(state); renderAll();
}
function removeItem(path, idx) {
  state.values[path] = (state.values[path] || []).filter((_, i) => i !== idx);
  saveState(state); renderAll();
}

function ctx() {
  return { onChange, addItem, removeItem, derived: buildModel(state)._derived };
}

function recalc() {
  const model = buildModel(state);
  const summary = computeSummary(model);
  renderDashboard(dashRoot, mobileBar, summary, state);
}

function applyChrome() {
  const { lang, currency, dark } = state.ui;
  document.documentElement.lang = lang === 'he' ? 'he' : 'en';
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('appTitle').textContent = t('app_title', lang);
  document.title = t('app_title', lang);
  $('rateLabel').textContent = t('rate_label', lang);
  $('rateInput').value = state.ui.rate;
  $('btnCurrency').textContent = currency === 'ILS' ? '$' : '₪';
  $('btnLang').textContent = t('toggle_lang', lang);
  $('btnTheme').textContent = dark ? '☀️' : '🌙';
  $('btnReset').textContent = '↺';
}

function renderAll() {
  applyChrome();
  renderInputs(inputsRoot, state, ctx());
  recalc();
}

function wireToggles() {
  $('btnCurrency').addEventListener('click', () => { state.ui.currency = state.ui.currency === 'ILS' ? 'USD' : 'ILS'; saveState(state); renderAll(); });
  $('btnLang').addEventListener('click', () => { state.ui.lang = state.ui.lang === 'he' ? 'en' : 'he'; saveState(state); renderAll(); });
  $('btnTheme').addEventListener('click', () => { state.ui.dark = !state.ui.dark; saveState(state); applyChrome(); });
  $('rateInput').addEventListener('input', () => { state.ui.rate = Number($('rateInput').value) || 1; saveState(state); renderAll(); });
  $('btnReset').addEventListener('click', () => { clearState(); state = defaultState(); renderAll(); });
}

wireToggles();
renderAll();
```

- [ ] **Step 2: Serve and verify the app end-to-end**

Run: `python -m http.server 8000`, open `http://localhost:8000`.
Verify:
- Enter Purchase price `2000000` → Purchase tax shows `₪160,000`; Brokerage `₪47,200`; Attorney `₪11,800`.
- Dashboard "Total invested" grows; entering rent `6000` sets Gross yield `3.6%`.
- Toggle **$** → all values divide by the rate (e.g. price shows ~`$540,541`); toggle back to **₪** restores.
- Toggle **English** → labels switch and layout flips to LTR; toggle back to Hebrew (RTL).
- Toggle **🌙** → dark theme; reload page → inputs, language, currency, theme all persisted.
- Enable **mortgage** → loan/rate/term appear, monthly payment shows, dashboard adds Cash-on-cash.
- Add a **furniture** row (＋), type a cost → Total invested increases; delete row → decreases.
Expected: all above behave correctly; no console errors.

- [ ] **Step 3: Run the whole unit suite**

Run: `npm test`
Expected: PASS — all calc/data/i18n/fields/state tests green.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: wire app orchestration, toggles, persistence, and list editing"
```

---

## Task 15: Mobile summary bar + polish

**Files:**
- Modify: `js/app.js`
- Modify: `css/styles.css` (only if adjustments needed during verification)

- [ ] **Step 1: Make the mobile bar expand the dashboard**

Add to `js/app.js` inside `wireToggles()` (before the final two lines):

```js
  mobileBar.addEventListener('click', () => {
    dashRoot.classList.toggle('collapsed-mobile');
    dashRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
```

And at the end of `applyChrome()` add responsive default (collapse dashboard on small screens so the bar drives it):

```js
  if (window.matchMedia('(max-width:820px)').matches) {
    dashRoot.classList.add('collapsed-mobile');
    mobileBar.hidden = false;
  } else {
    dashRoot.classList.remove('collapsed-mobile');
    mobileBar.hidden = true;
  }
```

- [ ] **Step 2: Verify on a narrow viewport**

Run: `python -m http.server 8000`, open `http://localhost:8000`, set the browser to a mobile width (~390px, DevTools device toolbar).
Verify: dashboard is hidden; a sticky bottom bar shows Net yield + Monthly cash flow; tapping it reveals the full dashboard. Resize wide → sidebar returns, bar hides.
Expected: correct responsive behavior in both directions; verify once in Hebrew (RTL) and once in English (LTR).

- [ ] **Step 3: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: add expandable mobile summary bar and responsive polish"
```

---

## Task 16: README + deploy notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Apartment Investment Calculator (Israel)

A single-page, bilingual (Hebrew/English), light/dark, ₪/$ calculator for evaluating an apartment as an investment in Israel. Enter purchase, mortgage, renovation, tax and operating costs; see total investment, monthly cost, gross/net yield, cash flow, cash-on-cash and payback.

No build step, no dependencies — plain HTML/CSS/ES-module JS.

## Run locally
Because it uses ES modules, open it through a local server (not `file://`):

```bash
python -m http.server 8000    # then open http://localhost:8000
# or: npx serve
```

## Tests
```bash
npm test    # runs node --test on the calc engine
```

## Deploy to GitHub Pages
1. Push this repo to GitHub.
2. Settings → Pages → Source: `main` branch, `/root`.
3. Open the published URL.

## Updating figures
All tax brackets, ceilings and default fees live in `js/data.js`. Update them there when the 2026 references change; `npm test` guards the math.

> Estimates only — 2026 reference figures, not tax advice.
```

- [ ] **Step 2: Final full-suite run**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with run, test, and deploy instructions"
```

---

## Self-Review (completed while writing)

**Spec coverage:** 3 toggles + rate (Tasks 12–14) ✓ · currency conversion both ways (Task 7, 14) ✓ · HE/EN + RTL (Task 9, 14) ✓ · tooltips hover + mobile ⓘ (Task 13 `field.show-tip` + CSS hover) ✓ · (m)/(ח) markers (Task 13 units) ✓ · all 6 categories + fields (Task 10) ✓ · purchase tax brackets both regimes (Task 3) ✓ · brokerage/attorney %+VAT (Task 4) ✓ · fixed defaults (Task 2) ✓ · optional mortgage + cash-on-cash (Tasks 5, 8, 13) ✓ · renovation lump/line-items (Task 13) ✓ · furniture/upgrades ＋lists (Task 13) ✓ · arnona helper (Task 13) ✓ · income tax 3 tracks (Task 6) ✓ · dashboard formulas §5.7 (Task 8) ✓ · persistence + reset (Task 11, 14) ✓ · VAT fixed 18% (Task 2, not user-editable) ✓ · disclaimer (Task 9, 13) ✓.

**Placeholder scan:** No "TBD/TODO/handle later" steps; every code step contains complete code. The one repeated pattern (30 near-identical fields) is implemented once via the generic renderer + declarative config, not duplicated.

**Type consistency:** `buildModel` returns `{ price, oneTime, monthly, annual, mortgage, rent, vacancyMonths, _derived }`; `computeSummary` consumes exactly those keys (Task 8 shape matches Task 11). `_derived` (purchaseTax, brokerage, attorney, monthlyPayment, incomeTax, rentalBrokerage) is the only object `render.js` reads via `ctx.derived`. Function names are stable across tasks: `calcPurchaseTax`, `calcPercentFee`, `mortgageMonthlyPayment`, `calcIncomeTaxMonthly`, `toDisplay`, `parseToNis`, `formatMoney`, `formatPercent`, `computeSummary`, `renderInputs`, `renderDashboard`.

---

## Execution Handoff

See the executing skill's handoff prompt after this plan is saved.
