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
