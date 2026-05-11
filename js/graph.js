/**
 * graph.js — D3.js v7 Dynamic Modal Epistemic Graph
 *
 * Implements the edge semantics from kaizen1.md:
 * - Five typed directed edges: revelación, ocultamiento, emergencia,
 *   compresión, bifurcación
 * - SVG <marker> arrowheads per type
 * - Curved paths (quadratic Bézier) for directed edges
 * - Rich edge tooltip: label, type, cost, narrative
 * - Node panel with horizon rings
 * - Domain filtering + edge-type filtering
 * - Touch + mouse drag, zoom/pan
 */

import { t } from './i18n.js';

// ─── VISUAL CONFIG ────────────────────────────────────────────────────────────

const EDGE_STYLE = {
  revelación:   { stroke: '#C5A86B', strokeWidth: 2.5, dashArray: '5,3',  opacity: 0.9 },
  ocultamiento: { stroke: '#7F8C8D', strokeWidth: 2.0, dashArray: '2,4',  opacity: 0.55 },
  emergencia:   { stroke: '#5DADE2', strokeWidth: 2.2, dashArray: '8,4',  opacity: 0.8 },
  compresión:   { stroke: '#1ABC9C', strokeWidth: 3.0, dashArray: '',     opacity: 0.9 },
  bifurcación:  { stroke: '#8E44AD', strokeWidth: 2.0, dashArray: '10,5', opacity: 0.7 },
  mystery:      { stroke: '#9060C0', strokeWidth: 1.5, dashArray: '3,3',  opacity: 0.5 },
};

// Fallback for legacy 'revelation'/'concealment' keys from inline data
const EDGE_ALIAS = {
  revelation:  'revelación',
  concealment: 'ocultamiento',
  emergence:   'emergencia',
  compression: 'compresión',
  bifurcation: 'bifurcación',
};

const NODE_FILL = {
  extremo:            '#1A3A6A',
  central:            '#2A4B7C',
  contextual:         '#1A3050',
  meta:               '#16403A',
  'domain-science':   '#1A4A3A',
  'domain-political': '#4A3A1A',
  'domain-existential':'#3A1A4A',
  'domain-math':      '#1A1A4A',
  emergent:           '#3A2A1A',
};
const NODE_STROKE = {
  extremo:            '#4A7BC8',
  central:            '#C5A86B',
  contextual:         '#4A7BC8',
  meta:               '#1ABC9C',
  'domain-science':   '#4AC890',
  'domain-political': '#C8A040',
  'domain-existential':'#A060C0',
  'domain-math':      '#6080C8',
  emergent:           '#C07040',
};

// Domain → node id sets (for filtering)
const DOMAIN_MAP = {
  all:        null,
  science:    new Set(['w_F','pre_adn','post_adn','emerg_epigen','incertidumbre_cosmologica','relatividad_general','misterio_cuantico','copenhague','muchos_mundos','bohm','incompletitud','indecidibilidad','w_T','w_O']),
  political:  new Set(['secreto_estado','filtracion','secreto_reforzado','w_F','w_T']),
  existential:new Set(['conciencia','w_F','w_N','w_O','mejor_secreto']),
  math:       new Set(['incompletitud','indecidibilidad','w_F','w_T','w_O']),
};

// ─── MODULE STATE ─────────────────────────────────────────────────────────────

let _graphData = null;   // raw JSON from data/graph-data.json
let _svg, _g, _linkGroup, _nodeGroup, _defs;
let _simulation;
let _currentDomain = 'all';
let _currentEdgeFilter = 'all';
let _edgePanelEl, _nodePanelEl;

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Load graph-data.json and initialise the SVG.
 */
export async function initGraph() {
  const res = await fetch('data/graph-data.json');
  _graphData = await res.json();

  _edgePanelEl = document.getElementById('edge-panel');
  _nodePanelEl = document.getElementById('node-panel');

  _buildSVG();
  _updateGraph();
}

export function changeDomain(domain) {
  _currentDomain = domain;
  _updateGraph();
}

export function filterEdge(type) {
  _currentEdgeFilter = type;
  _updateGraph();
}

// ─── SVG SETUP ────────────────────────────────────────────────────────────────

function _buildSVG() {
  const container = document.getElementById('graph-svg');
  const W = container.clientWidth || 700;
  const H = parseInt(container.getAttribute('height')) || 520;

  _svg = d3.select('#graph-svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', 'Grafo Epistémico Modal Dinámico')
    .call(
      d3.zoom()
        .scaleExtent([0.25, 4])
        .on('zoom', e => _g.attr('transform', e.transform))
    );

  _defs = _svg.append('defs');
  _buildMarkers();

  _g = _svg.append('g');
  _linkGroup = _g.append('g').attr('class', 'links');
  _nodeGroup = _g.append('g').attr('class', 'nodes');

  // Close panels on background click
  _svg.on('click', () => {
    _hideNodePanel();
    _hideEdgePanel();
  });

  // Resize handler
  window.addEventListener('resize', _onResize);
}

function _buildMarkers() {
  _defs.selectAll('marker').remove();
  const types = Object.keys(EDGE_STYLE);
  types.forEach(type => {
    const style = EDGE_STYLE[type];
    _defs.append('marker')
      .attr('id', `arrow-${type}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', style.stroke)
        .attr('opacity', 0.8);
  });
}

function _onResize() {
  const W = document.getElementById('graph-svg').clientWidth;
  const vb = _svg.attr('viewBox').split(' ');
  _svg.attr('viewBox', `0 0 ${W} ${vb[3]}`);
  if (_simulation) _simulation.alpha(0.4).restart();
}

// ─── DATA FILTERING ───────────────────────────────────────────────────────────

function _getFilteredData() {
  if (!_graphData) return { nodes: [], edges: [] };

  let nodes = _graphData.nodes.slice();
  let edges = _graphData.edges.slice();

  // Domain filter
  if (_currentDomain !== 'all') {
    const allowed = DOMAIN_MAP[_currentDomain];
    if (allowed) {
      nodes = nodes.filter(n => allowed.has(n.id));
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }
  }

  // Edge type filter
  if (_currentEdgeFilter !== 'all') {
    const canonical = EDGE_ALIAS[_currentEdgeFilter] || _currentEdgeFilter;
    edges = edges.filter(e => {
      const et = EDGE_ALIAS[e.type] || e.type;
      return et === canonical;
    });
  }

  // Deep-copy to avoid D3 mutating original objects
  return {
    nodes: nodes.map(n => ({ ...n })),
    edges: edges.map(e => ({ ...e })),
  };
}

// ─── GRAPH RENDER ─────────────────────────────────────────────────────────────

function _updateGraph() {
  const { nodes, edges } = _getFilteredData();

  const vb = (_svg.attr('viewBox') || '0 0 700 520').split(' ');
  const W = +vb[2];
  const H = +vb[3];

  if (_simulation) _simulation.stop();

  _simulation = d3.forceSimulation(nodes)
    .force('link',      d3.forceLink(edges).id(d => d.id).distance(130).strength(0.45))
    .force('charge',    d3.forceManyBody().strength(-320))
    .force('center',    d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(40));

  // ── EDGES ──
  const linkSel = _linkGroup.selectAll('path.link')
    .data(edges, d => `${d.source?.id || d.source}→${d.target?.id || d.target}:${d.type}`);

  linkSel.exit().remove();

  const linkEnter = linkSel.enter().append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', d => `${d.type}: ${d.label || ''}`)
    .on('mouseenter', _onEdgeEnter)
    .on('mouseleave', _onEdgeLeave)
    .on('focus',      _onEdgeEnter)
    .on('blur',       _onEdgeLeave)
    .on('click',      (e, d) => { e.stopPropagation(); _showEdgePanel(e, d); });

  const linkMerged = linkSel.merge(linkEnter);
  linkMerged
    .each(function(d) {
      const type = EDGE_ALIAS[d.type] || d.type;
      const style = EDGE_STYLE[type] || EDGE_STYLE['revelación'];
      d3.select(this)
        .attr('stroke',           style.stroke)
        .attr('stroke-width',     style.strokeWidth * (d.weight || 0.7))
        .attr('stroke-dasharray', style.dashArray || null)
        .attr('stroke-opacity',   style.opacity)
        .attr('marker-end',       `url(#arrow-${type})`);
    });

  // ── NODES ──
  const nodeSel = _nodeGroup.selectAll('g.node')
    .data(nodes, d => d.id);

  nodeSel.exit().remove();

  const nodeEnter = nodeSel.enter().append('g')
    .attr('class', 'node')
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', d => d.label || d.id)
    .style('cursor', 'pointer')
    .call(
      d3.drag()
        .on('start', _dragStart)
        .on('drag',  _dragged)
        .on('end',   _dragEnd)
    )
    .on('click',   (e, d) => { e.stopPropagation(); _showNodePanel(e, d); })
    .on('keydown', (e, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _showNodePanel(e, d); } });

  // Circle
  nodeEnter.append('circle')
    .attr('r', d => _nodeRadius(d))
    .attr('fill',         d => NODE_FILL[d.type]   || '#1A3050')
    .attr('stroke',       d => NODE_STROKE[d.type] || '#4A7BC8')
    .attr('stroke-width', 1.5);

  // Symbol label inside
  nodeEnter.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('font-family', "'JetBrains Mono', monospace")
    .attr('font-size', '8px')
    .attr('fill', '#B8C4D4')
    .attr('pointer-events', 'none')
    .text(d => d.id);

  // Name label below
  nodeEnter.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', d => _nodeRadius(d) + 14)
    .attr('font-family', "'DM Sans', sans-serif")
    .attr('font-size', '8px')
    .attr('fill', '#6A6864')
    .attr('pointer-events', 'none')
    .text(d => {
      const name = d.label || d.id;
      return name.length > 22 ? name.slice(0, 20) + '…' : name;
    });

  _nodeGroup.selectAll('g.node').merge(nodeEnter);

  // ── TICK ──
  _simulation.on('tick', () => {
    _linkGroup.selectAll('path.link').attr('d', _edgePath);
    _nodeGroup.selectAll('g.node').attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

// ─── EDGE PATH (quadratic Bézier for curved directed edges) ───────────────────

function _edgePath(d) {
  const sx = d.source.x, sy = d.source.y;
  const tx = d.target.x, ty = d.target.y;
  // Slight curve offset so bidirectional edges don't overlap
  const dx = tx - sx, dy = ty - sy;
  const dr = Math.sqrt(dx * dx + dy * dy);
  const cx = (sx + tx) / 2 - dy * 0.15;
  const cy = (sy + ty) / 2 + dx * 0.15;
  return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
}

// ─── NODE RADIUS ──────────────────────────────────────────────────────────────

function _nodeRadius(d) {
  if (d.style && d.style.size) return Math.max(14, d.style.size * 0.9);
  if (d.type === 'extremo') return 20;
  if (d.type === 'meta')    return 22;
  return 16;
}

// ─── DRAG ─────────────────────────────────────────────────────────────────────

function _dragStart(e, d) {
  if (!e.active) _simulation.alphaTarget(0.3).restart();
  d.fx = d.x; d.fy = d.y;
}
function _dragged(e, d) { d.fx = e.x; d.fy = e.y; }
function _dragEnd(e, d) {
  if (!e.active) _simulation.alphaTarget(0);
  d.fx = null; d.fy = null;
}

// ─── NODE PANEL ───────────────────────────────────────────────────────────────

function _showNodePanel(e, d) {
  const panel = _nodePanelEl;
  if (!panel) return;

  panel.querySelector('#panel-name').textContent = d.label || d.id;
  panel.querySelector('#panel-id').textContent   = d.id;

  const agents   = Array.isArray(d.agents)   ? d.agents.join(', ')   : (d.agents   || '—');
  const contents = Array.isArray(d.contents) ? d.contents.join(', ') : (d.contents || '—');
  const refs     = Array.isArray(d.references) ? d.references.join(' · ') : (d.references || d.refs || '—');

  panel.querySelector('#panel-agents').textContent   = agents;
  panel.querySelector('#panel-contents').textContent = contents;
  panel.querySelector('#panel-refs').textContent     = refs;

  const hz = d.horizon
    ? [
        Math.round((d.horizon.conocido   || 0) * 100),
        Math.round((d.horizon.desconocido || 0) * 100),
        Math.round((d.horizon.incognoscible || 0) * 100),
      ]
    : [33, 33, 34];

  panel.querySelector('#panel-horizon').innerHTML = `
    <div class="ring known">
      <div class="ring-dot"></div>
      <span>${hz[0]}% ${t('panel.known')}</span>
    </div>
    <div class="ring unknown">
      <div class="ring-dot"></div>
      <span>${hz[1]}% ${t('panel.unknown')}</span>
    </div>
    <div class="ring incog">
      <div class="ring-dot"></div>
      <span>${hz[2]}% ${t('panel.incognoscible')}</span>
    </div>
  `;

  panel.classList.add('visible');
  _positionPanel(panel, e);
}

function _hideNodePanel() {
  _nodePanelEl && _nodePanelEl.classList.remove('visible');
}

// ─── EDGE PANEL ───────────────────────────────────────────────────────────────

function _showEdgePanel(e, d) {
  const panel = _edgePanelEl;
  if (!panel) return;

  const type = EDGE_ALIAS[d.type] || d.type;
  panel.innerHTML = `
    <strong>${d.label || type}</strong>
    <div class="ep-type">${t('panel.edgeType')}: ${type}</div>
    ${d.cost     ? `<div class="ep-cost">${t('panel.edgeCost')}: ${d.cost}</div>` : ''}
    ${d.narrative ? `<div class="ep-narrative">${d.narrative}</div>` : ''}
  `;
  panel.classList.add('visible');
  panel.style.left = (e.pageX + 14) + 'px';
  panel.style.top  = (e.pageY + 14) + 'px';
}

function _hideEdgePanel() {
  _edgePanelEl && _edgePanelEl.classList.remove('visible');
}

function _onEdgeEnter(e, d) {
  const type = EDGE_ALIAS[d.type] || d.type;
  const style = EDGE_STYLE[type] || EDGE_STYLE['revelación'];
  d3.select(this)
    .attr('stroke-opacity', 1)
    .attr('stroke-width', style.strokeWidth * 1.6);
  _showEdgePanel(e, d);
}
function _onEdgeLeave(e, d) {
  const type = EDGE_ALIAS[d.type] || d.type;
  const style = EDGE_STYLE[type] || EDGE_STYLE['revelación'];
  d3.select(this)
    .attr('stroke-opacity', style.opacity)
    .attr('stroke-width',   style.strokeWidth * (d.weight || 0.7));
  _hideEdgePanel();
}

// ─── PANEL POSITIONING ────────────────────────────────────────────────────────

function _positionPanel(panel, e) {
  const svgRect = document.getElementById('graph-svg').getBoundingClientRect();
  let px = e.clientX - svgRect.left + 16;
  let py = e.clientY - svgRect.top  + 16;
  const pw = 280, ph = 320;
  if (px + pw > svgRect.width)  px = e.clientX - svgRect.left - pw - 8;
  if (py + ph > svgRect.height) py = Math.max(0, e.clientY - svgRect.top - ph);
  panel.style.left = px + 'px';
  panel.style.top  = py + 'px';
}
