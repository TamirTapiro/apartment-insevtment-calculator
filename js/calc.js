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
