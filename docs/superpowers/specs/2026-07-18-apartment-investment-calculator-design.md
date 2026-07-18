# Apartment Investment Calculator — Design Spec

**Date:** 2026-07-18
**Status:** Approved design, pre-implementation
**Owner:** tapirotamirsh@gmail.com

## 1. Goal

A single-page web app that helps someone evaluate a residential apartment as an **investment in Israel**. The user enters purchase, financing, renovation, tax and operating costs; the app sums them and computes rental-return metrics (yields, cash flow, payback). Hosted as a static site on GitHub Pages.

## 2. Users & context

- Primary user: an individual sizing up an investment apartment in Israel.
- Bilingual audience: **Hebrew (default, RTL)** and **English (LTR)**.
- Must work well on **mobile and desktop**.
- Israeli-specific tax logic (purchase tax, rental income tax, VAT) baked in with 2026 figures.

## 3. Tech approach

- **Static site, no build step.** Pure HTML/CSS/vanilla JS. Runs on GitHub Pages with no configuration and works offline.
- **File structure:**
  - `index.html` — markup shell
  - `css/styles.css` — styles, theming (light/dark), RTL/LTR
  - `js/data.js` — defaults, tax brackets, constants (the only file to touch when figures change)
  - `js/i18n.js` — EN + HE strings, field labels, tooltip explanations
  - `js/calc.js` — pure calculation engine (no DOM), unit-testable
  - `js/app.js` — state, rendering, toggles, currency, persistence
  - `README.md`, `.gitignore`
- **No dependencies, no framework, no backend.** State lives in memory + `localStorage`.
- `calc.js` is deliberately DOM-free so the formulas can be tested in isolation.

## 4. Global behavior

### 4.1 Toggles (header, all persisted in `localStorage`)
- **Dark mode** 🌙 — light/dark theme via CSS custom properties.
- **Language HE/EN** — swaps all text; flips document direction (RTL for Hebrew, LTR for English) and mirrors layout.
- **Currency ₪/$** — switches displayed currency.

### 4.2 Currency
- Editable **conversion rate** field, default **3.70 ₪/$** (₪ per $).
- **Canonical storage is in ₪.** Displaying in $ divides by the rate; typing a value while $ is active multiplies by the rate before storing. Switching currency reformats live with no data loss.
- Rate is user-editable at any time; no live FX fetch.

### 4.3 Language / i18n
- Every label, category name, tooltip, and unit has EN + HE text (see Appendix A).
- Default language **Hebrew**. Direction attribute on `<html>` flips with language.
- Numbers use grouping separators; currency symbol follows the active currency.

### 4.4 Explanations (tooltips)
- Desktop: hover a category or field name → tooltip with the explanation text.
- Mobile: a small **ⓘ** icon next to the name; tap toggles the same text.
- Explanation copy is the text supplied in the brief (Appendix A).

### 4.5 One-time vs monthly
- Each monthly field is tagged **(m)** in English / **(ח)** in Hebrew.
- The dashboard keeps **one-time** and **monthly** totals separate.

### 4.6 Editability
- Everything is editable **except VAT (18%, fixed)**.
- Computed fields (purchase tax, brokerage, attorney, mortgage payment, income tax) display their auto-calculated value but expose a manual **override**; clearing the override restores the formula.

### 4.7 Persistence
- All inputs, toggle states, and the conversion rate are saved to `localStorage` and restored on load.
- A **Reset** control clears saved data back to defaults.

## 5. Calculation engine (`calc.js`)

All money is handled in ₪ internally.

### 5.1 Reference constants (2026) — see Sources
- **VAT:** 18% (fixed).
- **Purchase tax — single apartment (דירה יחידה):** 0% ≤ 1,978,745 · 3.5% 1,978,745–2,347,040 · 5% 2,347,040–6,055,070 · 8% 6,055,070–20,183,565 · 10% > 20,183,565.
- **Purchase tax — additional/investor apartment (דירה נוספת):** 8% ≤ 6,055,070 · 10% > 6,055,070 (from the first shekel).
- **Rental income tax exemption ceiling:** 5,654 ₪/mo; **double ceiling:** 11,308 ₪/mo.
- **Self-rent offset cap:** 7,500 ₪/mo.
- **Default fixed fees:** Tabu 3,500 · Mortgage advisor 8,000 · File opening 2,500 · Appraiser 3,000.
- **Renovation reference (midrag, hints only):** complete ≈ 120,000–190,000 ₪ / 90 m² (~1,330–2,110 ₪/m²); cosmetic ≈ 300 ₪/m²; plumbing 18,670–22,820 · electrical 9,400–11,500 · flooring 27,400–33,450 · bathroom 25,000–33,000 · demolition/drywall 10,700–13,000.

### 5.2 Derived percentage costs
- **Brokerage fee** = `purchasePrice × brokeragePct × (1 + VAT)`, default `brokeragePct = 2%`.
- **Attorney** = `purchasePrice × attorneyPct × (1 + VAT)`, default `attorneyPct = 0.5%`.
- VAT (18%) fixed in both; percentages editable; result overridable.

### 5.3 Purchase tax
- Progressive brackets applied to `purchasePrice` per selected apartment type (default **additional/investor**).
- Output shown with a small breakdown; overridable.

### 5.4 Mortgage (optional section)
- Inputs: `loanAmount` **or** `LTV%` (LTV → `loanAmount = LTV% × purchasePrice`), `annualRate`, `termYears`.
- Monthly payment (standard amortization):
  `M = L·r / (1 − (1+r)^(−N))`, with `r = annualRate/12`, `N = termYears×12`; if `annualRate = 0`, `M = L/N`.
- `downPayment = purchasePrice − loanAmount`.

### 5.5 Rental income tax (track selector; default **10%**)
Let `R` = monthly rent. Income tax is computed on `R` and included in `monthlyOperating`.
- **10% flat:** `tax_month = 0.10 × R`.
- **Exemption track** (marginal rate `mr`, default 31%):
  - `R ≤ 5,654` → 0
  - `5,654 < R < 11,308` → taxable `= 2R − 2×5,654`; `tax_month = taxable × mr`
  - `R ≥ 11,308` → `tax_month = R × mr`
- **Self-rent offset:** `taxable = max(0, R − min(rentYouPay, 7,500))`; `tax_month = 0.10 × taxable`.

### 5.6 Aggregates
- `oneTimeCosts` = purchase tax + brokerage + attorney + tabu + advisor + file-opening + appraiser + renovation + furniture(Σ) + upgrades(Σ) + rental brokerage.
- `monthlyOperating` = property tax + house committee + current bills + life/building insurance + building/contents insurance + income tax + repairs/upkeep + fund for future repairs + management. (Advertising and legal are entered as **annual** amounts and divided by 12 when needed.)
- `totalInvested` (your cash in):
  - cash deal: `purchasePrice + oneTimeCosts`
  - financed: `downPayment + oneTimeCosts`

### 5.7 Rent, vacancy, returns
- `annualRentContract = R × 12`
- `annualRentEffective = R × (12 − vacancyMonths)` (default `vacancyMonths = 0.5`)
- **Unoccupancy loss (display only)** = `R × vacancyMonths` — already reflected in effective rent; not subtracted again.
- `annualOperating = monthlyOperating × 12 + advertising + legal`
- `NOI = annualRentEffective − annualOperating` (excludes mortgage)
- **Gross yield** = `annualRentContract / purchasePrice`
- **Net yield** = `NOI / totalInvested`
- `annualMortgage = M × 12`
- **Annual cash flow** = `NOI − annualMortgage`
- **Monthly cash flow** = `annualCashFlow / 12`
- **Cash-on-cash** (financed only) = `annualCashFlow / totalInvested`
- **Payback (years)** = `totalInvested / annualCashFlow` when positive, else "—"

> Denominator conventions (price vs. total-invested) are centralized in `calc.js` so they can be changed in one place if the user later prefers another convention.

## 6. Dashboard (sticky results panel)

Layout **A — sticky results sidebar**:
- **Desktop:** inputs column + results panel pinned alongside; live updates on every keystroke.
- **Mobile:** single column; a slim sticky bottom bar (net yield + monthly cash flow) expands on tap to the full panel.
- Panel shows: Total invested · Total monthly cost (m) · Gross yield · Net yield · Monthly cash flow · Cash-on-cash (when mortgage on) · Payback.
- Panel and all fields flip for RTL.

## 7. Input categories & fields

Type: **O** = one-time, **M** = monthly, **A** = annual. Bracketed = default.

**Purchase costs**
- Purchase price — O — (user)
- Purchase tax — O — computed (apartment-type selector, default investor), overridable
- Brokerage fee — O — computed `2%×(1+VAT)`, % editable
- Attorney — O — computed `0.5%×(1+VAT)`, % editable
- Tabu — O — [3,500]

**Mortgage costs**
- Mortgage advisor — O — [8,000]
- File opening — O — [2,500]
- Appraiser — O — [3,000]
- Insurance (life/building) — M — (user; ongoing premium)
- *Optional financing block:* loan amount **or** LTV%, annual interest, term → monthly payment (computed)

**Renovation & upgrades**
- Renovation — O — lump sum, with an optional **line-item helper** (demolition, plumbing, electrical, flooring, kitchen, bathroom, painting) pre-filled with midrag ranges as hints
- Furniture — O — **"＋" repeatable rows** (name + cost), summed into total
- Upgrades/additions — O — same ＋ repeatable rows

**Tax & operating**
- Property tax / arnona — M — editable amount; optional `area(m²) × rate-per-m²` helper (no national formula)
- House committee — M — [0] (editable; usually tenant)
- Current bills — M — [0] (typically only while vacant)
- Building & contents insurance — M — (user)
- Income tax — M — computed from rent via track selector (default 10%)

**Maintenance**
- Repairs & ongoing upkeep — M — (user)
- Fund for future repairs — M — (user)

**Operating & administrative**
- Rental brokerage — O — [= one month's rent]
- Management fees — M — (user)
- Advertising — A — (user)
- Unoccupancy loss — derived from `vacancyMonths` (default 0.5), display + feeds effective rent
- Legal expenses — A — (user)

## 8. Special widgets

1. **Purchase-tax mini-calc** — apartment-type toggle + bracket table → tax, with breakdown and override.
2. **Renovation line-item helper** — collapsible; each row has a midrag range as placeholder; sum flows up. Simple lump-sum mode is the default.
3. **Repeatable ＋ lists** (furniture, upgrades) — add/remove rows of {name, cost}; each row respects currency conversion.
4. **Income-tax track selector** — 10% / Exemption / Self-rent offset; reveals extra inputs (marginal rate, rent-you-pay) as needed.
5. **Arnona helper** — optional `area × rate/m²` that fills the amount.

## 9. Confirmed defaults

Language **Hebrew/RTL** · currency **₪** · rate **3.70** · purchase tax **additional/investor** · vacancy **0.5 month/yr** · exemption-track marginal rate **31%** · VAT **18% (fixed)**.

## 10. Out of scope (YAGNI)

No live FX fetch · no multi-property comparison · no appreciation/capital-gains (mas shevach) modeling · no backend or user accounts · no PDF/print export. All are candidate follow-ups.

## 11. Testing

- `calc.js` unit tests for: purchase-tax brackets (both regimes, boundary values), brokerage/attorney with VAT, mortgage amortization (incl. 0% rate), all three income-tax tracks (incl. exemption boundaries 5,654 / 11,308), aggregates, and every return metric.
- Manual UI checks: currency round-trip (₪→$→₪ stable), HE/RTL mirroring, mobile sticky bar, persistence across reload, dark mode.

## Appendix A — Bilingual field explanations (tooltip copy)

**Purchase costs (עלויות רכישה)**
- Purchase price / מחיר הרכישה — the main amount paid for the apartment, as agreed with the seller. / זהו הסכום העיקרי שתשלמו עבור הדירה, כפי שסוכם עם המוכר.
- Purchase tax / מס רכישה — tax on apartment buyers; rate depends on how many apartments you own and the price. / מס המוטל על רוכשי דירות, ושיעורו נקבע בהתאם למספר הדירות שבבעלותכם ומחיר הדירה.
- Brokerage fee / עמלת תיווך — broker fee for locating the apartment, usually a % of the price. / עמלה למתווך על איתור הדירה, לרוב אחוז ממחיר העסקה.
- Attorney / עלויות עו"ד — lawyer to accompany the purchase, check the property and draft the contract. / עורך דין לליווי הרכישה, בדיקת הנכס וניסוח החוזה.
- Tabu / אגרות טאבו — fees for registering the apartment in your name at the Land Registry. / תשלומים לרישום הדירה על שמכם בלשכת רישום המקרקעין.

**Mortgage costs (עלויות משכנתא)**
- Mortgage advisor / יועץ משכנתאות — guides you through the loan and helps get better terms. / מלווה אתכם בתהליך ההלוואה ומסייע בתנאים טובים יותר.
- File opening / עמלות פתיחת תיק — bank fees for opening and processing the mortgage file. / עמלות הבנק לפתיחת תיק משכנתא וטיפול בבקשה.
- Appraiser / עמלות הערכת שמאי — valuation of the property by a certified appraiser for the bank. / הערכת שווי הנכס על ידי שמאי מוסמך מטעם הבנק.
- Insurance / ביטוחים — life and building insurance often required by the bank. / ביטוח חיים ומבנה הנדרשים לרוב על ידי הבנק.

**Renovation & upgrades (הוצאות שיפוץ ושדרוג)**
- Renovation / עלויות שיפוץ — labor and materials; depends on the apartment's condition and scope. / עלויות עבודה וחומרים; תלוי במצב הדירה ובהיקף השיפוץ.
- Furniture / עלויות ריהוט — basic furniture and equipment if renting furnished. / ריהוט וציוד בסיסיים אם משכירים מרוהט.
- Upgrades / שדרוגים ותוספות — A/C, water filtration, solar heater, etc. that raise value and rental potential. / מיזוג, סינון מים, דוד שמש ועוד שמגדילים את הערך ואת פוטנציאל ההשכרה.

**Tax & operating (הוצאות מיסים ותפעול שוטף)**
- Property tax / ארנונה — municipal tax paid by the property owner. / מס עירוני המשולם על ידי בעל הנכס.
- House committee / ועד בית — regular payments for shared-area maintenance and building management. / תשלומים קבועים לאחזקת השטחים המשותפים וניהול הבניין.
- Current bills / חשבונות שוטפים — water, electricity, gas while the apartment is not rented. / מים, חשמל וגז בזמן שהדירה אינה מושכרת.
- Building & contents insurance / ביטוח מבנה ותכולה — protects the property against damage and lost income. / מגן על הנכס מפני נזקים ואובדן הכנסות.
- Income tax / מס הכנסה — rental income is taxed per the selected track. / הכנסות משכר דירה חייבות במס לפי המסלול שנבחר.

**Maintenance (עלויות תחזוקה ותיקונים)**
- Repairs & upkeep / תיקונים ותחזוקה שוטפת — budget for painting, plumbing, system upgrades. / תקציב לצביעה, אינסטלציה ושדרוג מערכות.
- Fund for future repairs / קרן לתיקונים עתידיים — reserve for major repairs or replacing costly items (appliances, A/C). / הפרשה לתיקונים גדולים או החלפת פריטים יקרים.

**Operating & administrative (עלויות תפעול ואדמיניסטרציה)**
- Rental brokerage / עמלות תיווך להשכרה — usually one month's rent. / לרוב בגובה שכר דירה לחודש.
- Management fees / דמי ניהול — monthly fee if a management company handles the apartment and tenants. / דמי ניהול חודשיים אם חברת ניהול מטפלת בדירה ובדיירים.
- Advertising / הוצאות פרסום — cost of advertising a rental listing when needed. / עלות פרסום מודעת השכרה במידת הצורך.
- Unoccupancy loss / הפסדים מאי-תפוסה — lost rent between tenants while costs continue. / אובדן שכר דירה בין שוכרים בזמן שההוצאות נמשכות.
- Legal expenses / הוצאות משפטיות — budget for disputes with tenants or lawsuits. / תקציב לסכסוכים עם שוכרים או תביעות.

## Sources

- Purchase tax 2026 brackets: [doron-aharoni.com](https://doron-aharoni.com/מדרגות-מס-רכישה-2026/), [kolzchut](https://www.kolzchut.org.il/he/חישוב_מס_רכישה)
- Rental income tax 2026: [kolzchut — exemption](https://www.kolzchut.org.il/he/פטור_ממס_על_הכנסה_מהשכרת_דירה_למגורים), [Grant Thornton](https://www.grantthornton.co.il/insights1/tax-insignths/2026/income_from_renting_an_apartment/)
- Renovation ranges: [midrag price guide](https://www.midrag.co.il/content/Price/7209)
- Arnona method: [kolzchut — arnona](https://www.kolzchut.org.il/he/ארנונה)
- VAT 18% since Jan 2025 (Israel Tax Authority).

> Tax figures are 2026 references for estimation only — not tax advice. Constants live in `js/data.js` for easy updates.
