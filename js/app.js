/**
 * app.js — Bootstrap, scroll animations, UI wiring
 * Imports graph.js and i18n.js as ES modules.
 */

import { loadStrings, t, getLang, setLang } from './i18n.js?v=2.2';
import { initGraph, changeDomain, filterEdge, changeVersion, updateGraphLabels } from './graph.js?v=2.2';
import layerSystem from './layers.js?v=2.2';
import { initMicroGraphs, updatePlaygroundGraph } from './micro-graphs.js?v=2.2';

// ─── LANGUAGE ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gemd-lang';
const READING_STORAGE_KEY = 'gemd-reading-mode';
const THEME_STORAGE_KEY = 'gemd-theme';

function _initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
}

window.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
  _updateThemeButton();
};

function _updateThemeButton() {
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = isDark ? t('nav.themeLight') : t('nav.themeDark');
    themeBtn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro / Switch to light mode' : 'Cambiar a modo oscuro / Switch to dark mode');
  }
}

async function bootstrap() {
  document.documentElement.classList.add('js-loaded');
  _initTheme();
  const savedLang = localStorage.getItem(STORAGE_KEY) || 'es';
  await loadStrings(savedLang);

  const savedReading = localStorage.getItem(READING_STORAGE_KEY) === 'true';
  if (savedReading) {
    document.body.classList.add('reading-mode');
  }

  _applyStrings();
  await initGraph();
  initMicroGraphs();
  _initLayerSelector();
  _initScrollAnimations();
  _initTooltips();
  _initRegenDemo();
  _initPlayground();
  _initLegendOverlay();
  _initVersionSelector();
  _initFullscreen();
  _initHUDHoverHighlights();

  if (window.innerWidth <= 768) {
    document.querySelector('.graph-overlay-header')?.classList.add('collapsed');
  }
}

function _applyStrings() {
  // Nav
  document.querySelector('.nav-title').textContent = t('nav.title');
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('switchLang');

  const readingBtn = document.getElementById('reading-mode-btn');
  if (readingBtn) {
    const isReading = document.body.classList.contains('reading-mode');
    readingBtn.textContent = isReading ? t('nav.standardMode') : t('nav.readingMode');
  }
  _updateThemeButton();

  // Domain selector
  const domainLabel = document.getElementById('domain-selector-label');
  if (domainLabel) domainLabel.textContent = t('domainLabel');
  
  const layersSelectorLabel = document.getElementById('layers-selector-label');
  if (layersSelectorLabel) layersSelectorLabel.textContent = t('layers.selectorLabel');

  const edgeFilterLabel = document.getElementById('edge-filter-label');
  if (edgeFilterLabel) edgeFilterLabel.textContent = getLang() === 'es' ? 'Filtrar aristas' : 'Filter edges';
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

  // Translate mobile edge filter options
  const mobileEdgeFilter = document.getElementById('mobile-edge-filter');
  if (mobileEdgeFilter) {
    mobileEdgeFilter.querySelectorAll('option').forEach(opt => {
      const val = opt.value;
      opt.textContent = t(`graph.filter${_getI18nEdgeKey(val)}`);
    });
  }

  // Translate mobile domain select options
  const mobileDomainSelect = document.getElementById('mobile-domain-select');
  if (mobileDomainSelect) {
    mobileDomainSelect.querySelectorAll('option').forEach(opt => {
      const domain = opt.value;
      opt.textContent = t(`nav.${domain}`);
    });
  }

  // Translate mobile tour select options
  const mobileTourSelect = document.getElementById('mobile-tour-select');
  if (mobileTourSelect) {
    const optNone = document.getElementById('opt-tour-none');
    if (optNone) optNone.textContent = getLang() === 'es' ? 'Seleccionar recorrido...' : 'Select tour...';
    
    const optReveal = document.getElementById('opt-tour-reveal');
    if (optReveal) optReveal.textContent = t('tours.btnReveal');
    
    const optMystery = document.getElementById('opt-tour-mystery');
    if (optMystery) optMystery.textContent = t('tours.btnMystery');
    
    const optComputability = document.getElementById('opt-tour-computability');
    if (optComputability) optComputability.textContent = t('tours.btnComputability');
  }

  // Translate Legend Overlay Title & Toggle button
  const legendOverlayTitle = document.getElementById('legend-overlay-title');
  if (legendOverlayTitle) {
    legendOverlayTitle.textContent = getLang() === 'es' ? 'Aristas & Leyenda' : 'Edges & Legend';
  }

  const toggleLegendBtn = document.getElementById('toggle-legend-btn');
  if (toggleLegendBtn) {
    toggleLegendBtn.textContent = getLang() === 'es' ? 'Aristas & Leyenda ⇅' : 'Edges & Legend ⇅';
  }

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
  const panelFormulaLabel = document.getElementById('panel-label-formula');
  if (panelFormulaLabel) panelFormulaLabel.textContent = getLang() === 'es' ? 'Fórmula modal' : 'Modal formula';

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
  // a11y Skip Link
  const skipLink = document.getElementById('skip-link');
  if (skipLink) skipLink.textContent = t('sections.skipLink');

  // Section §01
  const s01Label = document.getElementById('s01-label');
  if (s01Label) s01Label.textContent = t('sections.s01.label');
  const s01Heading = document.getElementById('s01-heading');
  if (s01Heading) s01Heading.innerHTML = t('sections.s01.heading');
  const s01p1 = document.getElementById('s01-p1');
  if (s01p1) s01p1.innerHTML = t('sections.s01.p1');
  const s01p2 = document.getElementById('s01-p2');
  if (s01p2) s01p2.innerHTML = t('sections.s01.p2');
  const s01p3 = document.getElementById('s01-p3');
  if (s01p3) s01p3.innerHTML = t('sections.s01.p3');
  const dialecticTitle = document.getElementById('dialectic-title');
  if (dialecticTitle) dialecticTitle.textContent = t('sections.s01.dialecticTitle');
  const dialecticDesc = document.getElementById('dialectic-desc');
  if (dialecticDesc) dialecticDesc.innerHTML = t('sections.s01.dialecticDesc');

  // Section §02
  const s02Label = document.getElementById('s02-label');
  if (s02Label) s02Label.textContent = t('sections.s02.label');
  const s02Heading = document.getElementById('s02-heading');
  if (s02Heading) s02Heading.innerHTML = t('sections.s02.heading');
  const s02p1 = document.getElementById('s02-p1');
  if (s02p1) s02p1.innerHTML = t('sections.s02.p1');
  const s02p2 = document.getElementById('s02-p2');
  if (s02p2) s02p2.innerHTML = t('sections.s02.p2');
  const s02p3 = document.getElementById('s02-p3');
  if (s02p3) s02p3.innerHTML = t('sections.s02.p3');
  const s02p4 = document.getElementById('s02-p4');
  if (s02p4) s02p4.innerHTML = t('sections.s02.p4');
  const cryptoTag = document.getElementById('crypto-tag');
  if (cryptoTag) cryptoTag.textContent = t('sections.s02.cryptoTag');
  const cryptoTitle = document.getElementById('crypto-title');
  if (cryptoTitle) cryptoTitle.textContent = t('sections.s02.cryptoTitle');
  const cryptoDesc = document.getElementById('crypto-desc');
  if (cryptoDesc) cryptoDesc.innerHTML = t('sections.s02.cryptoDesc');

  // Section §03 Challenges
  const challengesTitle = document.getElementById('challenges-title');
  if (challengesTitle) challengesTitle.textContent = t('sections.s03.challengesTitle');
  const btnCh1 = document.getElementById('btn-challenge-1');
  if (btnCh1) btnCh1.textContent = t('sections.s03.btnChallenge1');
  const btnCh2 = document.getElementById('btn-challenge-2');
  if (btnCh2) btnCh2.textContent = t('sections.s03.btnChallenge2');
  const btnCh3 = document.getElementById('btn-challenge-3');
  if (btnCh3) btnCh3.textContent = t('sections.s03.btnChallenge3');

  // Section §05c
  const s05cLabel = document.getElementById('s05c-label');
  if (s05cLabel) s05cLabel.textContent = t('sections.s05c.label');
  const s05cHeading = document.getElementById('s05c-heading');
  if (s05cHeading) s05cHeading.innerHTML = t('sections.s05c.heading');
  const s05cp1 = document.getElementById('s05c-p1');
  if (s05cp1) s05cp1.innerHTML = t('sections.s05c.p1');
  const s05cp2 = document.getElementById('s05c-p2');
  if (s05cp2) s05cp2.innerHTML = t('sections.s05c.p2');
  const s05cp3 = document.getElementById('s05c-p3');
  if (s05cp3) s05cp3.innerHTML = t('sections.s05c.p3');
  const limitsTitle = document.getElementById('limits-title');
  if (limitsTitle) limitsTitle.textContent = t('sections.s05c.limitsTitle');

  const godelTag = document.getElementById('godel-tag');
  if (godelTag) godelTag.textContent = t('sections.s05c.godelTag');
  const godelTitle = document.getElementById('godel-title');
  if (godelTitle) godelTitle.textContent = t('sections.s05c.godelTitle');
  const godelDesc = document.getElementById('godel-desc');
  if (godelDesc) godelDesc.textContent = t('sections.s05c.godelDesc');

  const turingTag = document.getElementById('turing-tag');
  if (turingTag) turingTag.textContent = t('sections.s05c.turingTag');
  const turingTitle = document.getElementById('turing-title');
  if (turingTitle) turingTitle.textContent = t('sections.s05c.turingTitle');
  const turingDesc = document.getElementById('turing-desc');
  if (turingDesc) turingDesc.textContent = t('sections.s05c.turingDesc');

  const quantumTag = document.getElementById('quantum-tag');
  if (quantumTag) quantumTag.textContent = t('sections.s05c.quantumTag');
  const quantumTitle = document.getElementById('quantum-title');
  if (quantumTitle) quantumTitle.textContent = t('sections.s05c.quantumTitle');
  const quantumDesc = document.getElementById('quantum-desc');
  if (quantumDesc) quantumDesc.textContent = t('sections.s05c.quantumDesc');

  const chaosTag = document.getElementById('chaos-tag');
  if (chaosTag) chaosTag.textContent = t('sections.s05c.chaosTag');
  const chaosTitle = document.getElementById('chaos-title');
  if (chaosTitle) chaosTitle.textContent = t('sections.s05c.chaosTitle');
  const chaosDesc = document.getElementById('chaos-desc');
  if (chaosDesc) chaosDesc.textContent = t('sections.s05c.chaosDesc');

  const thermoTag = document.getElementById('thermo-tag');
  if (thermoTag) thermoTag.textContent = t('sections.s05c.thermoTag');
  const thermoTitle = document.getElementById('thermo-title');
  if (thermoTitle) thermoTitle.textContent = t('sections.s05c.thermoTitle');
  const thermoDesc = document.getElementById('thermo-desc');
  if (thermoDesc) thermoDesc.textContent = t('sections.s05c.thermoDesc');

  // Section §04
  const s04Label = document.getElementById('s04-label');
  if (s04Label) s04Label.textContent = t('sections.s04.label');
  const s04Heading = document.getElementById('s04-heading');
  if (s04Heading) s04Heading.innerHTML = t('sections.s04.heading');
  const s04p1 = document.getElementById('s04-p1');
  if (s04p1) s04p1.innerHTML = t('sections.s04.p1');
  const s04p2 = document.getElementById('s04-p2');
  if (s04p2) s04p2.innerHTML = t('sections.s04.p2');

  const s04wTTitle = document.getElementById('s04-wT-title');
  if (s04wTTitle) s04wTTitle.textContent = t('sections.s04.wTTitle');
  const s04wTDesc = document.getElementById('s04-wT-desc');
  if (s04wTDesc) s04wTDesc.textContent = t('sections.s04.wTDesc');

  const s04wOTitle = document.getElementById('s04-wO-title');
  if (s04wOTitle) s04wOTitle.textContent = t('sections.s04.wOTitle');
  const s04wODesc = document.getElementById('s04-wO-desc');
  if (s04wODesc) s04wODesc.textContent = t('sections.s04.wODesc');

  const s04wETitle = document.getElementById('s04-wE-title');
  if (s04wETitle) s04wETitle.textContent = t('sections.s04.wETitle');
  const s04wEDesc = document.getElementById('s04-wE-desc');
  if (s04wEDesc) s04wEDesc.textContent = t('sections.s04.wEDesc');

  const s04wFTitle = document.getElementById('s04-wF-title');
  if (s04wFTitle) s04wFTitle.textContent = t('sections.s04.wFTitle');
  const s04wFDesc = document.getElementById('s04-wF-desc');
  if (s04wFDesc) s04wFDesc.textContent = t('sections.s04.wFDesc');

  const s04wNTitle = document.getElementById('s04-wN-title');
  if (s04wNTitle) s04wNTitle.textContent = t('sections.s04.wNTitle');
  const s04wNDesc = document.getElementById('s04-wN-desc');
  if (s04wNDesc) s04wNDesc.textContent = t('sections.s04.wNDesc');

  // Section §05
  const s05Label = document.getElementById('s05-label');
  if (s05Label) s05Label.textContent = t('sections.s05.label');
  const s05Heading = document.getElementById('s05-heading');
  if (s05Heading) s05Heading.innerHTML = t('sections.s05.heading');
  const s05p1 = document.getElementById('s05-p1');
  if (s05p1) s05p1.innerHTML = t('sections.s05.p1');
  const s05p2 = document.getElementById('s05-p2');
  if (s05p2) s05p2.innerHTML = t('sections.s05.p2');
  const s05p3 = document.getElementById('s05-p3');
  if (s05p3) s05p3.innerHTML = t('sections.s05.p3');
  const s05p4 = document.getElementById('s05-p4');
  if (s05p4) s05p4.innerHTML = t('sections.s05.p4');

  const s05DemoTitle = document.getElementById('s05-demo-title');
  if (s05DemoTitle) s05DemoTitle.textContent = t('sections.s05.demoTitle');
  const s05DemoCaption = document.getElementById('s05-demo-caption');
  if (s05DemoCaption) s05DemoCaption.textContent = t('sections.s05.demoCaption');

  // Translate regen nodes dynamically
  const isEn = getLang() === 'en';
  const rn = document.getElementById('regen-nodes');
  if (rn) {
    const nodes = rn.querySelectorAll('.regen-node');
    if (nodes.length >= 2) {
      nodes[0].textContent = isEn ? 'DNA Structure' : 'Estructura del ADN';
      nodes[1].textContent = isEn ? 'Epigenome' : 'Epigenoma';
    }
  }
  const rn2 = document.getElementById('regen-nodes-2');
  if (rn2) {
    const nodes = rn2.querySelectorAll('.regen-node');
    if (nodes.length >= 5) {
      nodes[0].textContent = isEn ? 'DNA Structure ✓' : 'Estructura del ADN ✓';
      nodes[1].textContent = isEn ? 'Epigenome ✓' : 'Epigenoma ✓';
      nodes[2].textContent = isEn ? 'Social epigenetics' : 'Epigenética social';
      nodes[3].textContent = isEn ? 'Non-Mendelian inheritance' : 'Herencia no-mendeliana';
      nodes[4].textContent = isEn ? '??? (new frontier)' : '??? (nueva frontera)';
    }
  }
  const regenBtn = document.getElementById('regen-btn');
  if (regenBtn) {
    const nodes2 = document.getElementById('regen-nodes-2');
    const isTriggered = nodes2 && !nodes2.classList.contains('hidden') && nodes2.style.display !== 'none';
    regenBtn.textContent = isTriggered
      ? (isEn ? 'Reset ↺' : 'Reiniciar ↺')
      : (isEn ? 'Reveal →' : 'Revelar →');
  }

  // Section §05b
  const s05bLabel = document.getElementById('s05b-label');
  if (s05bLabel) s05bLabel.textContent = t('sections.s05b.label');
  const s05bHeading = document.getElementById('s05b-heading');
  if (s05bHeading) s05bHeading.innerHTML = t('sections.s05b.heading');
  const s05bp1 = document.getElementById('s05b-p1');
  if (s05bp1) s05bp1.innerHTML = t('sections.s05b.p1');
  const s05bp2 = document.getElementById('s05b-p2');
  if (s05bp2) s05bp2.innerHTML = t('sections.s05b.p2');
  const s05bp3 = document.getElementById('s05b-p3');
  if (s05bp3) s05bp3.innerHTML = t('sections.s05b.p3');



  // Section §05d
  const s05dLabel = document.getElementById('s05d-label');
  if (s05dLabel) s05dLabel.textContent = t('sections.s05d.label');
  const s05dHeading = document.getElementById('s05d-heading');
  if (s05dHeading) s05dHeading.innerHTML = t('sections.s05d.heading');
  const s05dp1 = document.getElementById('s05d-p1');
  if (s05dp1) s05dp1.innerHTML = t('sections.s05d.p1');
  const s05dp2 = document.getElementById('s05d-p2');
  if (s05dp2) s05dp2.innerHTML = t('sections.s05d.p2');
  const s05dp3 = document.getElementById('s05d-p3');
  if (s05dp3) s05dp3.innerHTML = t('sections.s05d.p3');

  // Section §06
  const s06Label = document.getElementById('s06-label');
  if (s06Label) s06Label.textContent = t('sections.s06.label');
  const s06Heading = document.getElementById('s06-heading');
  if (s06Heading) s06Heading.innerHTML = t('sections.s06.heading');
  const s06p1 = document.getElementById('s06-p1');
  if (s06p1) s06p1.innerHTML = t('sections.s06.p1');
  const s06p2 = document.getElementById('s06-p2');
  if (s06p2) s06p2.innerHTML = t('sections.s06.p2');
  const s06p3 = document.getElementById('s06-p3');
  if (s06p3) s06p3.innerHTML = t('sections.s06.p3');
  const s06p4 = document.getElementById('s06-p4');
  if (s06p4) s06p4.innerHTML = t('sections.s06.p4');
  const s06Formula = document.getElementById('s06-formula');
  if (s06Formula) s06Formula.innerHTML = t('sections.s06.formula');

  // Section §07
  const s07Label = document.getElementById('s07-label');
  if (s07Label) s07Label.textContent = t('sections.s07.label');
  const s07Heading = document.getElementById('s07-heading');
  if (s07Heading) s07Heading.innerHTML = t('sections.s07.heading');
  const s07p1 = document.getElementById('s07-p1');
  if (s07p1) s07p1.innerHTML = t('sections.s07.p1');
  const s07Quote = document.getElementById('s07-quote');
  if (s07Quote) s07Quote.textContent = t('sections.s07.quote');
  const s07p2 = document.getElementById('s07-p2');
  if (s07p2) s07p2.innerHTML = t('sections.s07.p2');
  const s07p3 = document.getElementById('s07-p3');
  if (s07p3) s07p3.innerHTML = t('sections.s07.p3');

  // Inline tooltips
  const tipKripke = document.getElementById('tip-kripke');
  if (tipKripke) tipKripke.setAttribute('data-tip', t('tips.kripke'));
  const tipGodel = document.getElementById('tip-godel');
  if (tipGodel) tipGodel.setAttribute('data-tip', t('tips.godel'));
  const tipChaitin = document.getElementById('tip-chaitin');
  if (tipChaitin) tipChaitin.setAttribute('data-tip', t('tips.chaitin'));
  const tipSingularity = document.getElementById('tip-singularity');
  if (tipSingularity) tipSingularity.setAttribute('data-tip', t('tips.singularity'));

  // Playground Static Text
  const playLabelSec = document.getElementById('playground-label-section');
  if (playLabelSec) playLabelSec.textContent = t('playground.title');

  const playHeading = document.getElementById('s03-heading');
  if (playHeading) playHeading.innerHTML = t('playground.subtitle');

  const playIntro = document.getElementById('playground-intro-text');
  if (playIntro) playIntro.textContent = t('playground.intro');

  const playC_label = document.getElementById('play-toggle-c-label');
  if (playC_label) playC_label.textContent = t('playground.toggleC');

  const playC_desc = document.getElementById('play-toggle-c-desc');
  if (playC_desc) playC_desc.textContent = t('playground.toggleCDesc');

  const playK_label = document.getElementById('play-toggle-k-label');
  if (playK_label) playK_label.textContent = t('playground.toggleK');

  const playK_desc = document.getElementById('play-toggle-k-desc');
  if (playK_desc) playK_desc.textContent = t('playground.toggleKDesc');

  const playAcc_label = document.getElementById('play-toggle-access-label');
  if (playAcc_label) playAcc_label.textContent = t('playground.toggleAccess');

  const playAcc_desc = document.getElementById('play-toggle-access-desc');
  if (playAcc_desc) playAcc_desc.textContent = t('playground.toggleAccessDesc');

  const playStatusHeader = document.getElementById('play-status-header');
  if (playStatusHeader) playStatusHeader.textContent = t('playground.statusLabel');

  // TRADUCCIONES PARTE B (VISUAL PLAYGROUND)
  const visualPlaygroundTitle = document.getElementById('visual-playground-title');
  if (visualPlaygroundTitle) {
    visualPlaygroundTitle.textContent = getLang() === 'es'
      ? 'Traducción Visual de la Accesibilidad'
      : 'Visual Translation of Accessibility';
  }

  const visualPlaygroundIntro = document.getElementById('visual-playground-intro');
  if (visualPlaygroundIntro) {
    visualPlaygroundIntro.textContent = getLang() === 'es'
      ? 'Para leer el gran mapa epistémico más abajo, es vital familiarizar tus ojos con cómo se dibuja la relación entre mundos posibles. Observa la conexión en el grafo interactivo mientras cambias las variables:'
      : 'To read the main epistemic map below, it is vital to familiarize your eyes with how relationships between possible worlds are drawn. Observe the connection in the interactive graph as you toggle variables:';
  }

  const playVToggleCLabel = document.getElementById('play-v-toggle-c-label');
  if (playVToggleCLabel) playVToggleCLabel.textContent = getLang() === 'es' ? 'Hecho (C)' : 'Fact (C)';
  
  const playVToggleKLabel = document.getElementById('play-v-toggle-k-label');
  if (playVToggleKLabel) playVToggleKLabel.textContent = getLang() === 'es' ? 'Sabe (Kₐ)' : 'Knows (Kₐ)';
  
  const playVToggleAccessLabel = document.getElementById('play-v-toggle-access-label');
  if (playVToggleAccessLabel) playVToggleAccessLabel.textContent = getLang() === 'es' ? 'Acceso (◇)' : 'Access (◇)';

  const microPlaygroundTitle = document.getElementById('micro-playground-title');
  if (microPlaygroundTitle) {
    microPlaygroundTitle.textContent = getLang() === 'es'
      ? 'Relación Dinámica de Accesibilidad (w₀ → w₁)'
      : 'Dynamic Accessibility Relation (w₀ → w₁)';
  }

  const microDistinctionTitle = document.getElementById('micro-distinction-title');
  if (microDistinctionTitle) microDistinctionTitle.textContent = t('micro.distinctionTitle');

  const microTopologyTitle = document.getElementById('micro-topology-title');
  if (microTopologyTitle) microTopologyTitle.textContent = t('micro.topologyTitle');

  const microTemporalTitle = document.getElementById('micro-temporal-title');
  if (microTemporalTitle) microTemporalTitle.textContent = t('micro.temporalTitle');

  const legendRowDirect = document.querySelector('#legend-row-direct .legend-text');
  if (legendRowDirect) {
    legendRowDirect.innerHTML = getLang() === 'es'
      ? '<strong>Línea continua dorada:</strong> Conocimiento completo. La información fluye libremente entre mundos.'
      : '<strong>Solid gold line:</strong> Complete knowledge. Information flows freely between worlds.';
  }

  const legendRowDotted = document.querySelector('#legend-row-dotted .legend-text');
  if (legendRowDotted) {
    legendRowDotted.innerHTML = getLang() === 'es'
      ? '<strong>Línea punteada dorada:</strong> Secreto descifrable. El puente modal (◇) está abierto: es posible conocer en w₁.'
      : '<strong>Dotted gold line:</strong> Decipherable secret. Modal bridge (◇) is open: it is possible to know in w₁.';
  }

  const legendRowBarred = document.querySelector('#legend-row-barred .legend-text');
  if (legendRowBarred) {
    legendRowBarred.innerHTML = getLang() === 'es'
      ? '<strong>Arista violeta con barra:</strong> Misterio inalcanzable. El acceso modal está bloqueado por una barrera de necesidad (□).'
      : '<strong>Violet barred edge:</strong> Unreachable mystery. Modal access is blocked by a necessity barrier (□).';
  }

  const legendRowRedBarred = document.querySelector('#legend-row-red-barred .legend-text');
  if (legendRowRedBarred) {
    legendRowRedBarred.innerHTML = getLang() === 'es'
      ? '<strong>Arista roja con barra:</strong> Inconsistencia o absurdo. El hecho básico (C) es falso, haciendo colapsar la lógica.'
      : '<strong>Red barred edge:</strong> Inconsistency or absurdity. The basic fact (C) is false, causing the logic to collapse.';
  }

  if (window.updatePlaygroundUI) {
    window.updatePlaygroundUI();
  }

  if (window.updateTourLanguageUI) {
    window.updateTourLanguageUI();
  }

  // Tours UI translations
  const tourSelectorLabel = document.getElementById('tour-selector-label');
  if (tourSelectorLabel) tourSelectorLabel.textContent = t('tours.title');

  const btnTourReveal = document.getElementById('btn-tour-reveal');
  if (btnTourReveal) btnTourReveal.textContent = t('tours.btnReveal');

  const btnTourMystery = document.getElementById('btn-tour-mystery');
  if (btnTourMystery) btnTourMystery.textContent = t('tours.btnMystery');

  const btnTourComputability = document.getElementById('btn-tour-computability');
  if (btnTourComputability) btnTourComputability.textContent = t('tours.btnComputability');

  const btnTourPrev = document.getElementById('btn-tour-prev');
  if (btnTourPrev) btnTourPrev.textContent = t('tours.prev');

  const btnTourNext = document.getElementById('btn-tour-next');
  if (btnTourNext) btnTourNext.textContent = t('tours.next');

  const btnTourExit = document.getElementById('btn-tour-exit');
  if (btnTourExit) btnTourExit.textContent = t('tours.exit');

  // Version Selector translations
  const versionSelectorLabel = document.getElementById('version-selector-label');
  if (versionSelectorLabel) versionSelectorLabel.textContent = t('version.title');

  const btnVersionFull = document.getElementById('btn-version-full');
  if (btnVersionFull) btnVersionFull.textContent = t('version.full');

  const btnVersionLite = document.getElementById('btn-version-lite');
  if (btnVersionLite) btnVersionLite.textContent = t('version.lite');

  const optVersionFull = document.getElementById('opt-version-full');
  if (optVersionFull) optVersionFull.textContent = t('version.full');

  const optVersionLite = document.getElementById('opt-version-lite');
  if (optVersionLite) optVersionLite.textContent = t('version.lite');

  // Fullscreen Button
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    const isCurrentlyFullscreen = document.querySelector('.graph-section')?.classList.contains('is-fullscreen');
    if (isCurrentlyFullscreen) {
      fullscreenBtn.textContent = getLang() === 'es' ? '✕ Salir' : '✕ Exit';
    } else {
      fullscreenBtn.textContent = getLang() === 'es' ? '⛶ Pantalla Completa' : '⛶ Fullscreen';
    }
  }

  const resetZoomBtn = document.getElementById('reset-zoom-btn');
  if (resetZoomBtn) {
    resetZoomBtn.innerHTML = t('graph.resetZoom');
    resetZoomBtn.setAttribute('aria-label', t('graph.resetZoomAria'));
  }

  updateGraphLabels();
  _applyMuseumGrid();
}

function _applyMuseumGrid() {
  const grid = document.querySelector('.museum-grid');
  if (!grid) return;
  const rows = [
    ['footer.year',    'footer.yearVal'],
    ['footer.current', 'footer.currentVal'],
    ['footer.refs',    'footer.refsVal'],
    ['footer.cite',    'footer.citeVal'],
    ['footer.info',    'footer.infoVal'],
  ];
  grid.innerHTML = rows.map(([k, v]) => `
    <div class="museum-key">${t(k)}</div>
    <div class="museum-val">${t(v)}</div>
  `).join('');

  const ccEl = document.querySelector('.cc');
  if (ccEl) {
    const licenseText = t('footer.license');
    ccEl.innerHTML = `
      <a href="https://creativecommons.org/licenses/by-sa/4.0/"
         target="_blank" rel="noopener noreferrer"
         style="color:inherit; text-decoration:underline dotted;">
        ${licenseText}
      </a>
    `;
  }
}

// ─── READING MODE TOGGLE ──────────────────────────────────────────────────────

window.toggleReadingMode = function() {
  const isReading = document.body.classList.toggle('reading-mode');
  localStorage.setItem(READING_STORAGE_KEY, isReading ? 'true' : 'false');
  const readingBtn = document.getElementById('reading-mode-btn');
  if (readingBtn) {
    readingBtn.textContent = isReading ? t('nav.standardMode') : t('nav.readingMode');
  }
};

// ─── LANGUAGE TOGGLE ──────────────────────────────────────────────────────────

window.toggleLang = async function() {
  const next = getLang() === 'es' ? 'en' : 'es';
  localStorage.setItem(STORAGE_KEY, next);
  await setLang(next);
  _applyStrings();
};

// ─── DOMAIN / EDGE FILTER WIRING ─────────────────────────────────────────────

window.changeDomainUI = function(domain, btn) {
  // Sync desktop buttons active class
  document.querySelectorAll('#domain-filters .ctrl-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.domain === domain);
  });
  // Sync mobile select value
  const select = document.getElementById('mobile-domain-select');
  if (select) select.value = domain;
  
  changeDomain(domain);
};

window.filterEdgeUI = function(type, btn) {
  // Sync desktop buttons active class (if any exists)
  document.querySelectorAll('#edge-filters .ctrl-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === type);
  });
  // Sync mobile select value
  const select = document.getElementById('mobile-edge-filter');
  if (select) select.value = type;
  
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
  const nodes1 = document.getElementById('regen-nodes');
  const nodes2 = document.getElementById('regen-nodes-2');
  if (!btn || !nodes1 || !nodes2) return;

  btn.addEventListener('click', () => {
    triggered = !triggered;
    if (triggered) {
      nodes1.classList.add('hidden');
      nodes1.style.display = 'none';
      nodes2.classList.remove('hidden');
      nodes2.style.display = 'flex';
    } else {
      nodes1.classList.remove('hidden');
      nodes1.style.display = 'flex';
      nodes2.classList.add('hidden');
      nodes2.style.display = 'none';
    }
    btn.setAttribute('aria-pressed', triggered ? 'true' : 'false');
    const isEn = getLang() === 'en';
    btn.textContent = triggered 
      ? (isEn ? 'Reset ↺' : 'Reiniciar ↺') 
      : (isEn ? 'Reveal →' : 'Revelar →');
  });
}

// ─── PLAYGROUND SIMULATOR ─────────────────────────────────────────────────────

function _initPlayground() {
  const playC = document.getElementById('play-c');
  const playK = document.getElementById('play-k');
  const playAccess = document.getElementById('play-access');
  const playVC = document.getElementById('play-v-c');
  const playVK = document.getElementById('play-v-k');
  const playVAccess = document.getElementById('play-v-access');

  if (!playC || !playK || !playAccess) return;

  const setControls = (cVal, kVal, aVal) => {
    playC.checked = cVal;
    playK.checked = kVal;
    playAccess.checked = aVal;
    if (playVC) playVC.checked = cVal;
    if (playVK) playVK.checked = kVal;
    if (playVAccess) playVAccess.checked = aVal;
    update();
  };

  const btnCh1 = document.getElementById('btn-challenge-1');
  const btnCh2 = document.getElementById('btn-challenge-2');
  const btnCh3 = document.getElementById('btn-challenge-3');

  if (btnCh1) btnCh1.addEventListener('click', () => setControls(true, false, true));
  if (btnCh2) btnCh2.addEventListener('click', () => setControls(true, false, false));
  if (btnCh3) btnCh3.addEventListener('click', () => setControls(false, false, true));

  const update = () => {
    const C = playC.checked;
    const K = playK.checked;
    const Access = playAccess.checked;

    let stateKey = '';

    if (!C) {
      stateKey = 'stateAbsurd';
    } else if (K) {
      stateKey = 'stateKnow';
    } else if (Access) {
      stateKey = 'stateRevealable';
    } else {
      stateKey = 'stateMystery';
    }

    const badge = document.getElementById('play-status-badge');
    const explanation = document.getElementById('play-status-explanation');

    if (badge) {
      badge.textContent = t(`playground.${stateKey}`);
      badge.className = 'status-badge ' + stateKey;
    }
    if (explanation) {
      explanation.innerHTML = t(`playground.${stateKey}Desc`);
    }

    const symSecret = document.getElementById('sym-secret');
    const symEquiv = document.getElementById('sym-equiv');
    const symC = document.getElementById('sym-c');
    const symAnd = document.getElementById('sym-and');
    const symNot = document.getElementById('sym-not');
    const symKnow = document.getElementById('sym-know');

    const symVSecret = document.getElementById('sym-v-secret');
    const symVEquiv = document.getElementById('sym-v-equiv');
    const symVC = document.getElementById('sym-v-c');
    const symVAnd = document.getElementById('sym-v-and');
    const symVNot = document.getElementById('sym-v-not');
    const symVKnow = document.getElementById('sym-v-know');

    const hasSecretRelation = C && !K;

    if (symSecret) {
      symSecret.classList.toggle('active', hasSecretRelation);
      symSecret.classList.toggle('disabled', !hasSecretRelation);
    }
    if (symEquiv) {
      symEquiv.classList.toggle('active', C);
      symEquiv.classList.toggle('disabled', !C);
    }
    if (symC) {
      symC.classList.toggle('active', C);
      symC.classList.toggle('disabled', !C);
    }
    if (symAnd) {
      symAnd.classList.toggle('active', C);
      symAnd.classList.toggle('disabled', !C);
    }
    if (symNot) {
      symNot.classList.toggle('active', !K);
      symNot.classList.toggle('disabled', K);
    }
    if (symKnow) {
      symKnow.classList.toggle('active', K);
      symKnow.classList.toggle('disabled', !K);
    }

    if (symVSecret) {
      symVSecret.classList.toggle('active', hasSecretRelation);
      symVSecret.classList.toggle('disabled', !hasSecretRelation);
    }
    if (symVEquiv) {
      symVEquiv.classList.toggle('active', C);
      symVEquiv.classList.toggle('disabled', !C);
    }
    if (symVC) {
      symVC.classList.toggle('active', C);
      symVC.classList.toggle('disabled', !C);
    }
    if (symVAnd) {
      symVAnd.classList.toggle('active', C);
      symVAnd.classList.toggle('disabled', !C);
    }
    if (symVNot) {
      symVNot.classList.toggle('active', !K);
      symVNot.classList.toggle('disabled', K);
    }
    if (symVKnow) {
      symVKnow.classList.toggle('active', K);
      symVKnow.classList.toggle('disabled', !K);
    }

    const formulaBox = document.getElementById('play-formula-box');
    if (formulaBox) {
      if (hasSecretRelation) {
        formulaBox.classList.add('secret-active');
        if (stateKey === 'stateMystery') {
          formulaBox.classList.add('mystery-active');
        } else {
          formulaBox.classList.remove('mystery-active');
        }
      } else {
        formulaBox.classList.remove('secret-active', 'mystery-active');
      }
    }

    const vFormulaBox = document.getElementById('play-v-formula-box');
    if (vFormulaBox) {
      if (hasSecretRelation) {
        vFormulaBox.classList.add('secret-active');
        if (stateKey === 'stateMystery') {
          vFormulaBox.classList.add('mystery-active');
        } else {
          vFormulaBox.classList.remove('mystery-active');
        }
      } else {
        vFormulaBox.classList.remove('secret-active', 'mystery-active');
      }
    }

    // Sync Switch Dimming & Text overrides
    const accessGroup = playAccess.closest('.control-switch-group');
    const vAccessGroup = playVAccess ? playVAccess.closest('.control-switch-group') : null;
    const isDisabled = !C || K;

    if (accessGroup) {
      accessGroup.classList.toggle('disabled', isDisabled);
      playAccess.disabled = isDisabled;

      const accessDesc = document.getElementById('play-toggle-access-desc');
      if (accessDesc) {
        if (!C) {
          accessDesc.textContent = getLang() === 'es' 
            ? '🔒 Bloqueado: Inútil si el hecho es falso.' 
            : '🔒 Locked: Irrelevant if the fact is false.';
        } else if (K) {
          accessDesc.textContent = getLang() === 'es' 
            ? '🔒 Bloqueado: Inútil si ya se conoce.' 
            : '🔒 Locked: Irrelevant if already known.';
        } else {
          accessDesc.textContent = t('playground.toggleAccessDesc');
        }
      }
    }

    if (vAccessGroup && playVAccess) {
      vAccessGroup.classList.toggle('disabled', isDisabled);
      playVAccess.disabled = isDisabled;
    }

    // Call dynamic micro-graph update
    updatePlaygroundGraph(C, K, Access);
  };

  playC.addEventListener('change', () => {
    if (playVC) playVC.checked = playC.checked;
    update();
  });
  if (playVC) {
    playVC.addEventListener('change', () => {
      playC.checked = playVC.checked;
      update();
    });
  }

  playK.addEventListener('change', () => {
    if (playVK) playVK.checked = playK.checked;
    update();
  });
  if (playVK) {
    playVK.addEventListener('change', () => {
      playK.checked = playVK.checked;
      update();
    });
  }

  playAccess.addEventListener('change', () => {
    if (playVAccess) playVAccess.checked = playAccess.checked;
    update();
  });
  if (playVAccess) {
    playVAccess.addEventListener('change', () => {
      playAccess.checked = playVAccess.checked;
      update();
    });
  }

  window.updatePlaygroundUI = update;
  update();
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function _getI18nEdgeKey(filterKey) {
  const map = {
    'all': 'All',
    'revelacion': 'Revelacion',
    'restriccion': 'Restriccion',
    'bifurcacion': 'Bifurcacion'
  };
  return map[filterKey] || filterKey;
}

function _initLegendOverlay() {
  const mobileEdgeFilter = document.getElementById('mobile-edge-filter');
  if (mobileEdgeFilter) {
    mobileEdgeFilter.addEventListener('change', () => {
      window.filterEdgeUI(mobileEdgeFilter.value, null);
    });
  }

  const toggleLegendBtn = document.getElementById('toggle-legend-btn');
  const overlayCard = document.getElementById('overlay-legend-card');

  if (toggleLegendBtn) {
    toggleLegendBtn.addEventListener('click', (e) => {
      window.toggleLegendOverlay(e);
    });
  }

  // Click outside overlay close
  document.addEventListener('click', (e) => {
    if (!overlayCard || !toggleLegendBtn) return;
    if (overlayCard.classList.contains('visible')) {
      if (!overlayCard.contains(e.target) && !toggleLegendBtn.contains(e.target)) {
        overlayCard.classList.remove('visible');
        toggleLegendBtn.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

window.toggleLegendOverlay = function(event) {
  if (event) event.stopPropagation();
  const toggleLegendBtn = document.getElementById('toggle-legend-btn');
  const overlayCard = document.getElementById('overlay-legend-card');
  if (!overlayCard) return;

  const isVisible = overlayCard.classList.contains('visible');
  if (isVisible) {
    overlayCard.classList.remove('visible');
    toggleLegendBtn?.setAttribute('aria-expanded', 'false');
  } else {
    overlayCard.classList.add('visible');
    toggleLegendBtn?.setAttribute('aria-expanded', 'true');
  }
};

window.toggleOptionsHeader = function(event) {
  if (event) event.stopPropagation();
  const header = document.querySelector('.graph-overlay-header');
  if (header) {
    header.classList.toggle('collapsed');
  }
};

// ─── VERSION SELECTOR ──────────────────────────────────────────────────────────

function _initVersionSelector() {
  const select = document.getElementById('mobile-version-select');
  const buttons = document.querySelectorAll('#version-selector .ctrl-btn');

  const updateUI = (version) => {
    // Call graph.js changeVersion
    changeVersion(version);

    // Sync buttons
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.version === version);
    });

    // Sync mobile select
    if (select) select.value = version;
  };

  // Listen to desktop buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      updateUI(btn.dataset.version);
    });
  });

  // Listen to mobile select
  if (select) {
    select.addEventListener('change', () => {
      updateUI(select.value);
    });
  }

  // Auto-switch to lite on mobile at load
  const initialVersion = window.innerWidth < 600 ? 'lite' : 'full';
  updateUI(initialVersion);
}

// ─── FULLSCREEN MODE ──────────────────────────────────────────────────────────

function _initFullscreen() {
  const btn = document.getElementById('fullscreen-btn');
  const section = document.querySelector('.graph-section');
  if (!btn || !section) return;

  const toggleFullscreen = () => {
    const isCurrentlyFullscreen = section.classList.contains('is-fullscreen');

    if (!isCurrentlyFullscreen) {
      // Enter fullscreen
      section.classList.add('is-fullscreen');
      btn.textContent = getLang() === 'es' ? '✕ Salir' : '✕ Exit';

      // Try native fullscreen if available
      if (section.requestFullscreen) {
        section.requestFullscreen().catch(err => {
          console.warn('Native fullscreen request rejected, using fallback:', err);
        });
      } else if (section.webkitRequestFullscreen) { /* Safari */
        section.webkitRequestFullscreen();
      } else if (section.msRequestFullscreen) { /* IE11 */
        section.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      section.classList.remove('is-fullscreen');
      btn.textContent = getLang() === 'es' ? '⛶ Pantalla Completa' : '⛶ Fullscreen';

      // Exit native fullscreen if active
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  btn.addEventListener('click', toggleFullscreen);

  // Listen for native escape/exit to sync classes
  const onFullscreenChange = () => {
    const nativeEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!nativeEl) {
      // Native exited, ensure class is removed
      section.classList.remove('is-fullscreen');
      btn.textContent = getLang() === 'es' ? '⛶ Pantalla Completa' : '⛶ Fullscreen';
    }
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('msfullscreenchange', onFullscreenChange);
}

// ─── HUD HOVER HIGHLIGHTS (HUD ⇄ GRAFO) ───────────────────────────────────────

function _initHUDHoverHighlights() {
  // Domain Filters Hover
  document.querySelectorAll('#domain-filters .ctrl-btn').forEach(btn => {
    const domain = btn.dataset.domain;
    if (domain) {
      btn.addEventListener('mouseenter', () => {
        if (window.highlightDomainInGraph) window.highlightDomainInGraph(domain);
      });
      btn.addEventListener('mouseleave', () => {
        if (window.clearHighlightInGraph) window.clearHighlightInGraph();
      });
    }
  });

  // Layer Panel Hover
  document.querySelectorAll('.layer-btn').forEach(btn => {
    const layer = btn.dataset.layer;
    if (layer) {
      btn.addEventListener('mouseenter', () => {
        if (window.highlightLayerInGraph) window.highlightLayerInGraph(layer);
      });
      btn.addEventListener('mouseleave', () => {
        if (window.clearHighlightInGraph) window.clearHighlightInGraph();
      });
    }
  });

  // Tour Selector Hover
  document.querySelectorAll('#tour-selector .ctrl-btn').forEach(btn => {
    const tour = btn.dataset.tour;
    if (tour) {
      btn.addEventListener('mouseenter', () => {
        if (window.highlightTourInGraph) window.highlightTourInGraph(tour);
      });
      btn.addEventListener('mouseleave', () => {
        if (window.clearHighlightInGraph) window.clearHighlightInGraph();
      });
    }
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', bootstrap);
