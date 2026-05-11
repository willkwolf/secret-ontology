/**
 * app.js — Bootstrap, scroll animations, UI wiring
 * Imports graph.js and i18n.js as ES modules.
 */

import { loadStrings, t, getLang, setLang } from './i18n.js';
import { initGraph, changeDomain, filterEdge } from './graph.js';

// ─── LANGUAGE ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gemd-lang';

async function bootstrap() {
  const savedLang = localStorage.getItem(STORAGE_KEY) || 'es';
  await loadStrings(savedLang);
  _applyStrings();
  await initGraph();
  _initScrollAnimations();
  _initTooltips();
  _initRegenDemo();
}

function _applyStrings() {
  // Nav
  document.querySelector('.nav-title').textContent = t('nav.title');
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const domain = btn.dataset.domain;
    if (domain) btn.textContent = t(`nav.${domain}`);
  });
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('switchLang');

  // Hero
  const overline = document.querySelector('.hero-overline');
  if (overline) overline.textContent = t('hero.overline');

  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) heroTitle.innerHTML = t('hero.title');

  const heroSub = document.querySelector('.hero-subtitle');
  if (heroSub) heroSub.textContent = t('hero.subtitle');

  const scrollLabel = document.querySelector('.hero-scroll span');
  if (scrollLabel) scrollLabel.textContent = t('hero.scroll');

  // Graph section
  const graphLabel = document.querySelector('.graph-section .section-label');
  if (graphLabel) graphLabel.textContent = t('graph.sectionLabel');

  const graphTitle = document.querySelector('.graph-section h2');
  if (graphTitle) graphTitle.innerHTML = t('graph.title');

  const graphHint = document.querySelector('.graph-hint');
  if (graphHint) graphHint.textContent = t('graph.hint');

  // Edge filter buttons
  const filterBtns = document.querySelectorAll('#edge-filters .ctrl-btn');
  filterBtns.forEach(btn => {
    const key = btn.dataset.filter;
    if (key) btn.textContent = t(`graph.filter${_capitalize(key)}`);
  });

  // Legend
  document.querySelectorAll('.legend-item[data-type]').forEach(el => {
    const type = el.dataset.type;
    const span = el.querySelector('span');
    if (span) span.textContent = t(`graph.legend${_capitalize(type)}`);
  });

  // Panel labels
  const panelLabels = {
    '#panel-label-agents':   'panel.agents',
    '#panel-label-contents': 'panel.contents',
    '#panel-label-horizon':  'panel.horizon',
    '#panel-label-refs':     'panel.refs',
  };
  Object.entries(panelLabels).forEach(([sel, key]) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  });

  const closeBtn = document.querySelector('.panel-close');
  if (closeBtn) closeBtn.setAttribute('aria-label', t('panel.close'));

  // Museum footer
  const museumInner = document.querySelector('.museum-inner');
  if (museumInner) museumInner.setAttribute('data-label', t('footer.label'));

  const museumTitle = document.querySelector('.museum-title');
  if (museumTitle) museumTitle.textContent = t('footer.title');

  _applyMuseumGrid();
}

function _applyMuseumGrid() {
  const grid = document.querySelector('.museum-grid');
  if (!grid) return;
  const rows = [
    ['footer.year',    'footer.yearVal'],
    ['footer.current', 'footer.currentVal'],
    ['footer.methods', 'footer.methodsVal'],
    ['footer.refs',    'footer.refsVal'],
    ['footer.stack',   'footer.stackVal'],
  ];
  grid.innerHTML = rows.map(([k, v]) => `
    <div class="museum-key">${t(k)}</div>
    <div class="museum-val">${t(v)}</div>
  `).join('');

  const limitsEl = document.querySelector('.museum-limitations');
  if (limitsEl) {
    limitsEl.innerHTML = `<strong style="color:var(--text-dim);font-style:normal;">${t('footer.limitsLabel')}</strong> ${t('footer.limitsVal')}`;
  }

  const ccEl = document.querySelector('.cc');
  if (ccEl) ccEl.textContent = t('footer.license');
}

// ─── LANGUAGE TOGGLE ──────────────────────────────────────────────────────────

window.toggleLang = async function() {
  const next = getLang() === 'es' ? 'en' : 'es';
  localStorage.setItem(STORAGE_KEY, next);
  await setLang(next);
  _applyStrings();
};

// ─── DOMAIN / EDGE FILTER WIRING ─────────────────────────────────────────────

window.changeDomainUI = function(domain, btn) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  changeDomain(domain);
};

window.filterEdgeUI = function(type, btn) {
  document.querySelectorAll('#edge-filters .ctrl-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterEdge(type);
};

window.closePanel = function() {
  document.getElementById('node-panel')?.classList.remove('visible');
};

// ─── SCROLL ANIMATIONS ────────────────────────────────────────────────────────

function _initScrollAnimations() {
  const fadeEls = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => observer.observe(el));
}

// ─── INLINE TOOLTIPS ──────────────────────────────────────────────────────────

function _initTooltips() {
  const tooltipEl = document.getElementById('tooltip');
  if (!tooltipEl) return;

  document.querySelectorAll('.tip').forEach(el => {
    el.addEventListener('mouseenter', e => {
      tooltipEl.textContent = el.dataset.tip;
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = (e.pageX + 12) + 'px';
      tooltipEl.style.top  = (e.pageY + 12) + 'px';
    });
    el.addEventListener('mousemove', e => {
      tooltipEl.style.left = (e.pageX + 12) + 'px';
      tooltipEl.style.top  = (e.pageY + 12) + 'px';
    });
    el.addEventListener('mouseleave', () => {
      tooltipEl.style.display = 'none';
    });
  });
}

// ─── REGENERATION DEMO ────────────────────────────────────────────────────────

function _initRegenDemo() {
  let triggered = false;
  const btn = document.getElementById('regen-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    triggered = !triggered;
    document.getElementById('regen-nodes').style.display   = triggered ? 'none' : 'flex';
    document.getElementById('regen-nodes-2').style.display = triggered ? 'flex' : 'none';
    btn.textContent = triggered ? 'Reiniciar ↺' : 'Revelar →';
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', bootstrap);
