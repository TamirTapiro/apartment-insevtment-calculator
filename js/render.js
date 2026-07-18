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
