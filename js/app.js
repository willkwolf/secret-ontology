/**
 * app.js — Bootstrap, scroll animations, UI wiring
 * Imports graph.js and i18n.js as ES modules.
 */

import { loadStrings, t, getLang, setLang } from './i18n.js';
import { initGraph, changeDomain, filterEdge, changeVersion } from './graph.js';
import layerSystem from './layers.js';
import { initMicroGraphs, updatePlaygroundGraph } from './micro-graphs.js';

// ─── LANGUAGE ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gemd-lang';

async function bootstrap() {
  const savedLang = localStorage.getItem(STORAGE_KEY) || 'es';
  await loadStrings(savedLang);
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
  if (!btn) return;

  btn.addEventListener('click', () => {
    triggered = !triggered;
    document.getElementById('regen-nodes').style.display   = triggered ? 'none' : 'flex';
    document.getElementById('regen-nodes-2').style.display = triggered ? 'flex' : 'none';
    btn.textContent = triggered ? 'Reiniciar ↺' : 'Revelar →';
  });
}

// ─── PLAYGROUND SIMULATOR ─────────────────────────────────────────────────────

function _initPlayground() {
  const playC = document.getElementById('play-c');
  const playK = document.getElementById('play-k');
  const playAccess = document.getElementById('play-access');

  if (!playC || !playK || !playAccess) return;

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

    // Sync Switch Dimming & Text overrides
    const accessGroup = playAccess.closest('.control-switch-group');
    if (accessGroup) {
      const isDisabled = !C || K;
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

    // Call dynamic micro-graph update
    updatePlaygroundGraph(C, K, Access);
  };

  playC.addEventListener('change', update);
  playK.addEventListener('change', update);
  playAccess.addEventListener('change', update);

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
    'revelación': 'Revelation',
    'ocultamiento': 'Concealment',
    'emergencia': 'Emergence',
    'compresión': 'Compression',
    'bifurcación': 'Bifurcation',
    'degrada': 'Degrada',
    'imposibilita': 'Imposibilita',
    'restringe_termo': 'Restringe_termo',
    'fusiona': 'Fusiona',
    'colapsa': 'Colapsa'
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

// ─── BOOT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', bootstrap);
