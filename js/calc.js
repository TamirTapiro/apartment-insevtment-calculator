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

export function calcPercentFee(price, pct, vat = VAT) {
  const value = (Number(price) || 0) * (Number(pct) || 0) * (1 + vat);
  return Math.round(value);
}
