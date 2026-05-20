/**
 * app.js — Bootstrap, scroll animations, UI wiring
 * Imports graph.js and i18n.js as ES modules.
 */

import { loadStrings, t, getLang, setLang } from './i18n.js';
import { initGraph, changeDomain, filterEdge } from './graph.js';
import layerSystem from './layers.js';

// ─── LANGUAGE ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gemd-lang';

async function bootstrap() {
  const savedLang = localStorage.getItem(STORAGE_KEY) || 'es';
  await loadStrings(savedLang);
  _applyStrings();
  await initGraph();
  _initLayerSelector();
  _initScrollAnimations();
  _initTooltips();
  _initRegenDemo();
}

function _applyStrings() {
  // Nav
  document.querySelector('.nav-title').textContent = t('nav.title');
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('switchLang');

  // Domain selector
  const domainLabel = document.getElementById('domain-selector-label');
  if (domainLabel) domainLabel.textContent = t('domainLabel');
  document.querySelectorAll('#domain-filters .ctrl-btn').forEach(btn => {
    const domain = btn.dataset.domain;
    if (domain) btn.textContent = t(`nav.${domain}`);
  });

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

  // Layer buttons
  document.querySelectorAll('.layer-btn').forEach(btn => {
    const layer = btn.dataset.layer;
    if (layer) btn.textContent = t(`graph.layers.${layer}`);
  });

  // Layer dropdown options
  document.querySelectorAll('#layer-dropdown option').forEach(opt => {
    const layer = opt.value;
    if (layer) opt.textContent = t(`graph.layers.${layer}`);
  });

  // Layer selector aria-labels
  document.querySelectorAll('.layer-btn').forEach(btn => {
    const layer = btn.dataset.layer;
    if (layer) btn.setAttribute('aria-label', t(`layers.ariaLabel.${layer}`));
  });
  const layerGroup = document.getElementById('layer-panel');
  if (layerGroup) layerGroup.setAttribute('aria-label', t('layers.ariaLabel.group'));
  const layerDropdown = document.getElementById('layer-dropdown');
  if (layerDropdown) layerDropdown.setAttribute('aria-label', t('layers.ariaLabel.group'));

  // Panel labels for new sections
  const panelLayersLabel = document.getElementById('panel-label-layers');
  if (panelLayersLabel) panelLayersLabel.textContent = t('panel.layers');
  const panelMetalogicLabel = document.getElementById('panel-label-metalogic');
  if (panelMetalogicLabel) panelMetalogicLabel.textContent = t('panel.metalogic');

  // Mobile showing label
  const showingEl = document.getElementById('layer-showing');
  if (showingEl) {
    const activeLayers = ['topology','epistemic','temporal','metalogic','narrative'];
    showingEl.textContent = `${t('layers.showingLabel') || 'Mostrando:'} ${t('graph.layers.narrative') || 'Narrativa'}`;
  }

  // Museum footer
  const museumInner = document.querySelector('.museum-inner');
  if (museumInner) museumInner.setAttribute('data-label', t('footer.label'));

  const museumTitle = document.querySelector('.museum-title');
  if (museumTitle) museumTitle.textContent = t('footer.title');

  // Nuclear Formula Legend translations
  const legendTitle = document.getElementById('formula-legend-title');
  if (legendTitle) legendTitle.textContent = t('formula.legendTitle');

  const legendSecretDef = document.getElementById('legend-secret-def');
  if (legendSecretDef) legendSecretDef.innerHTML = t('formula.secretDef');

  const legendEquivDef = document.getElementById('legend-equiv-def');
  if (legendEquivDef) legendEquivDef.innerHTML = t('formula.equivDef');

  const legendContentDef = document.getElementById('legend-content-def');
  if (legendContentDef) legendContentDef.innerHTML = t('formula.contentDef');

  const legendAndDef = document.getElementById('legend-and-def');
  if (legendAndDef) legendAndDef.innerHTML = t('formula.andDef');

  const legendNotDef = document.getElementById('legend-not-def');
  if (legendNotDef) legendNotDef.innerHTML = t('formula.notDef');

  const legendKnowDef = document.getElementById('legend-know-def');
  if (legendKnowDef) legendKnowDef.innerHTML = t('formula.knowDef');

  const legendWorldDef = document.getElementById('legend-world-def');
  if (legendWorldDef) legendWorldDef.innerHTML = t('formula.worldDef');

  const formulaNuclearExplanation = document.getElementById('formula-nuclear-explanation');
  if (formulaNuclearExplanation) formulaNuclearExplanation.innerHTML = t('formula.nuclearExplanation');

  // Distinction Section translations
  const distinctionSecretTitle = document.getElementById('distinction-secret-title');
  if (distinctionSecretTitle) distinctionSecretTitle.textContent = t('distinction.secretTitle');

  const distinctionSecretDesc = document.getElementById('distinction-secret-desc');
  if (distinctionSecretDesc) distinctionSecretDesc.innerHTML = t('distinction.secretDesc');

  const distinctionMysteryTitle = document.getElementById('distinction-mystery-title');
  if (distinctionMysteryTitle) distinctionMysteryTitle.textContent = t('distinction.mysteryTitle');

  const distinctionMysteryDesc = document.getElementById('distinction-mystery-desc');
  if (distinctionMysteryDesc) distinctionMysteryDesc.innerHTML = t('distinction.mysteryDesc');

  // Modal Explanation Section translations
  const explanationModalTitle = document.getElementById('explanation-modal-title');
  if (explanationModalTitle) explanationModalTitle.textContent = t('explanation.modalTitle');

  const explanationModalSecret = document.getElementById('explanation-modal-secret');
  if (explanationModalSecret) explanationModalSecret.innerHTML = t('explanation.modalSecret');

  const explanationModalMystery = document.getElementById('explanation-modal-mystery');
  if (explanationModalMystery) explanationModalMystery.innerHTML = t('explanation.modalMystery');

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
    ['footer.code',    'footer.codeVal'],
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
  document.querySelectorAll('#domain-filters .ctrl-btn').forEach(b => b.classList.remove('active'));
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

// ─── LAYER SELECTOR ───────────────────────────────────────────────────────────

function _initLayerSelector() {
  const isMobile = () => window.innerWidth <= 600;

  // Wire layer buttons
  document.querySelectorAll('.layer-btn').forEach(btn => {
    const layer = btn.dataset.layer;
    if (!layer) return;
    // Set initial state (all active)
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    btn.addEventListener('click', () => {
      const isActive = btn.classList.contains('active');
      layerSystem.setLayer(layer, !isActive);
    });
  });

  // Wire dropdown
  const dropdown = document.getElementById('layer-dropdown');
  if (dropdown) {
    dropdown.addEventListener('change', () => {
      // Mobile single-layer mode: deactivate all others, activate selected
      const LAYER_NAMES = ['topology', 'epistemic', 'temporal', 'metalogic', 'narrative'];
      LAYER_NAMES.forEach(l => {
        layerSystem.setLayer(l, l === dropdown.value);
      });
    });
  }

  // Sync UI on layer change
  document.addEventListener('layerchange', (e) => {
    const { activeLayers } = e.detail;
    // Update buttons
    document.querySelectorAll('.layer-btn').forEach(btn => {
      const layer = btn.dataset.layer;
      const active = activeLayers.includes(layer);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    // Update dropdown (show last active layer)
    if (dropdown && activeLayers.length > 0) {
      dropdown.value = activeLayers[activeLayers.length - 1];
    }
    // Update mobile showing label
    const showingEl = document.getElementById('layer-showing');
    if (showingEl && activeLayers.length > 0) {
      const lastLayer = activeLayers[activeLayers.length - 1];
      const layerLabel = t(`graph.layers.${lastLayer}`) || lastLayer;
      showingEl.textContent = `${t('layers.showingLabel') || 'Mostrando:'} ${layerLabel}`;
    }
  });

  // Handle resize: switch between panel and dropdown
  window.addEventListener('resize', () => {
    const panel = document.getElementById('layer-panel');
    const drop = document.getElementById('layer-dropdown');
    if (!panel || !drop) return;
    if (isMobile()) {
      panel.style.display = 'none';
      drop.style.display = 'block';
    } else {
      panel.style.display = '';
      drop.style.display = '';
    }
  });
}

// ─── SCROLL ANIMATIONS ────────────────────────────────────────────────────────

function _initScrollAnimations() {
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => fadeObserver.observe(el));

  // Layer-activating scroll steps
  const layerSections = document.querySelectorAll('section[data-layer]');
  const layerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const layer = entry.target.dataset.layer;
      const layerOff = entry.target.dataset.layerOff;
      if (entry.isIntersecting && layer) {
        layerSystem.setLayer(layer, true);
      }
      if (!entry.isIntersecting && layerOff) {
        layerSystem.setLayer(layerOff, false);
      }
    });
  }, { threshold: 0.4 });
  layerSections.forEach(el => layerObserver.observe(el));
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
