// js/calc.js — pure calculation engine (no DOM).
import { VAT, PURCHASE_TAX_BRACKETS, RENT_EXEMPTION_CEILING, RENT_DOUBLE_CEILING, SELF_RENT_OFFSET_CAP } from './data.js';

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

export function calcPercentFee(price, pct, vat = VAT) {
  const value = (Number(price) || 0) * (Number(pct) || 0) * (1 + vat);
  return Math.round(value);
}

export function mortgageMonthlyPayment(loan, annualRate, termYears) {
  const L = Math.max(0, Number(loan) || 0);
  const n = Math.round((Number(termYears) || 0) * 12);
  if (L === 0 || n === 0) return 0;
  const r = (Number(annualRate) || 0) / 12;
  if (r === 0) return Math.round(L / n);
  const m = (L * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(m);
}

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
