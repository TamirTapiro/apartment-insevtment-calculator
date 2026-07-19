// js/app.js
import { loadState, saveState, clearState, defaultState, buildModel } from './state.js';
import { computeSummary } from './calc.js';
import { renderInputs, renderDashboard, refreshDerived } from './render.js';
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
  refreshDerived(inputsRoot, model._derived, state.ui);
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
  if (window.matchMedia('(max-width:820px)').matches) {
    dashRoot.classList.add('collapsed-mobile');
    mobileBar.hidden = false;
  } else {
    dashRoot.classList.remove('collapsed-mobile');
    mobileBar.hidden = true;
  }
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
  mobileBar.addEventListener('click', () => {
    dashRoot.classList.toggle('collapsed-mobile');
    dashRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

wireToggles();
renderAll();
