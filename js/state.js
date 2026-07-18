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
