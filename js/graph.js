/**
 * graph.js — D3.js v7 Dynamic Modal Epistemic Graph
 *
 * Implements the edge semantics from kaizen1.md and kaizen2.md:
 * - Ten typed directed edges: revelación, ocultamiento, emergencia,
 *   compresión, bifurcación, degrada, imposibilita, restringe_termo,
 *   fusiona, colapsa
 * - SVG <marker> arrowheads per type + special markers/filters
 * - Curved paths (quadratic Bézier) for directed edges
 * - Rich edge tooltip: label, type, cost, narrative
 * - Node panel with horizon rings, layers, meta-logic rules, minimap
 * - Domain filtering + edge-type filtering
 * - Touch + mouse drag, zoom/pan
 * - Five-layer architecture with LayerSystem integration
 * - Cluster force, extreme-node forces, pinning, viewport clamping
 * - Halo animations, bridge nodes, inaccessible regions, collapse zones
 */

import { t } from './i18n.js';
import layerSystem from './layers.js';

// ─── META-LOGIC RULES MAP ─────────────────────────────────────────────────────

const METALOGIC_RULES = {
  matematico:  'metalogic.matematico',
  cuantico:    'metalogic.cuantico',
  cientifico:  'metalogic.cientifico',
  politico:    'metalogic.politico',
  ontologico:  'metalogic.ontologico',
  existencial: 'metalogic.existencial',
  meta:        'metalogic.meta',
};

// ─── VISUAL CONFIG ────────────────────────────────────────────────────────────

const EDGE_STYLE = {
  revelación:      { stroke: '#C5A86B', strokeWidth: 2.5, dashArray: '5,3',  opacity: 0.9 },
  ocultamiento:    { stroke: '#7F8C8D', strokeWidth: 2.0, dashArray: '2,4',  opacity: 0.55 },
  emergencia:      { stroke: '#5DADE2', strokeWidth: 2.2, dashArray: '8,4',  opacity: 0.8 },
  compresión:      { stroke: '#1ABC9C', strokeWidth: 3.0, dashArray: '',     opacity: 0.9 },
  bifurcación:     { stroke: '#8E44AD', strokeWidth: 2.0, dashArray: '10,5', opacity: 0.7 },
  mystery:         { stroke: '#9060C0', strokeWidth: 1.5, dashArray: '3,3',  opacity: 0.5 },
  degrada:         { stroke: '#9B59B6', strokeWidth: 1.8, dashArray: '4,2',  opacity: 0.7,  filter: 'url(#turbulence-filter)' },
  imposibilita:    { stroke: '#E74C3C', strokeWidth: 2.5, dashArray: '',     opacity: 0.9,  markerEnd: 'arrow-bar' },
  restringe_termo: { stroke: '#E67E22', strokeWidth: 2.2, dashArray: '6,3',  opacity: 0.85, markerEnd: 'arrow-stop' },
  fusiona:         { stroke: '#1ABC9C', strokeWidth: 2.0, dashArray: '',     opacity: 0.8 },
  colapsa:         { stroke: '#C0392B', strokeWidth: 2.0, dashArray: '8,3',  opacity: 0.75, markerStart: 'arrow-x-source' },
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
let _allGraphData = null; // full unfiltered data (same as _graphData after load)
let _svg, _g, _linkGroup, _nodeGroup, _defs, _particleGroup;
let _simulation, _zoom;
let _activeTour = null;
let _activeTourStep = 0;
let _currentDomain = 'all';
let _currentEdgeFilter = 'all';
let _edgePanelEl, _nodePanelEl;
let _bridgeNodeIds = new Set();
let _inaccessibleRegion = null;
let _collapseZone = null;
let _currentPanelNode = null;

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Load graph-data.json and initialise the SVG.
 */
export async function initGraph() {
  const res = await fetch('data/graph-data.json');
  _graphData = await res.json();
  _allGraphData = _graphData;

  // Store original counts for LayerSystem preservation invariant
  layerSystem.setOriginalCounts(_graphData.nodes.length, _graphData.edges.length);

  _edgePanelEl = document.getElementById('edge-panel');
  _nodePanelEl = document.getElementById('node-panel');

  // Compute bridge nodes from full data
  _bridgeNodeIds = _computeBridgeNodes(_graphData.nodes, _graphData.edges);

  _buildSVG();
  _updateGraph();
  _initTourEvents();
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

  _zoom = d3.zoom()
    .scaleExtent([0.25, 4])
    .on('zoom', e => _g.attr('transform', e.transform));

  _svg = d3.select('#graph-svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', 'Grafo Epistémico Modal Dinámico')
    .call(_zoom);

  _defs = _svg.append('defs');
  _buildMarkers();

  _g = _svg.append('g');

  // Append background shapes BEFORE link and node groups so they render behind
  _inaccessibleRegion = _g.append('ellipse')
    .attr('class', 'inaccessible-region')
    .attr('fill', 'none')
    .attr('stroke', 'var(--text-dimmer, #555)')
    .attr('stroke-dasharray', '6,4')
    .attr('opacity', 0.3)
    .attr('rx', 60).attr('ry', 40);

  _collapseZone = _g.append('circle')
    .attr('class', 'collapse-zone')
    .attr('fill', 'rgba(144,96,192,0.08)')
    .attr('stroke', 'none')
    .attr('r', 50);

  _linkGroup = _g.append('g').attr('class', 'links');
  _particleGroup = _g.append('g').attr('class', 'particles');
  _nodeGroup = _g.append('g').attr('class', 'nodes');

  // Close panels on background click
  _svg.on('click', () => {
    _hideNodePanel();
    _hideEdgePanel();
  });

  // Listen for layer changes
  document.addEventListener('layerchange', () => _applyLayerVisibility());

  // Resize handler
  window.addEventListener('resize', _onResize);
}

function _buildMarkers() {
  _defs.selectAll('marker').remove();
  _defs.selectAll('filter').remove();

  // Standard arrow markers for all 10 edge types
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

  // ── Turbulence filter for `degrada` ──
  const turbFilter = _defs.append('filter')
    .attr('id', 'turbulence-filter')
    .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
  turbFilter.append('feTurbulence')
    .attr('type', 'turbulence')
    .attr('baseFrequency', '0.02')
    .attr('numOctaves', '2')
    .attr('result', 'turbulence');
  turbFilter.append('feDisplacementMap')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'turbulence')
    .attr('scale', '3')
    .attr('xChannelSelector', 'R')
    .attr('yChannelSelector', 'G');

  // ── Bar termination marker for `imposibilita` ──
  const barMarker = _defs.append('marker')
    .attr('id', 'arrow-bar')
    .attr('viewBox', '-2 -6 4 12')
    .attr('refX', 22).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 10)
    .attr('orient', 'auto');
  barMarker.append('line')
    .attr('x1', 0).attr('y1', -6).attr('x2', 0).attr('y2', 6)
    .attr('stroke', '#E74C3C').attr('stroke-width', 2.5);

  // ── Stop-sign marker for `restringe_termo` ──
  const stopMarker = _defs.append('marker')
    .attr('id', 'arrow-stop')
    .attr('viewBox', '-8 -8 16 16')
    .attr('refX', 22).attr('refY', 0)
    .attr('markerWidth', 8).attr('markerHeight', 8)
    .attr('orient', 'auto');
  stopMarker.append('circle')
    .attr('cx', 0).attr('cy', 0).attr('r', 6)
    .attr('fill', 'none').attr('stroke', '#E67E22').attr('stroke-width', 2);
  stopMarker.append('line')
    .attr('x1', -4).attr('y1', -4).attr('x2', 4).attr('y2', 4)
    .attr('stroke', '#E67E22').attr('stroke-width', 1.5);

  // ── X-shaped source marker for `colapsa` ──
  const xMarker = _defs.append('marker')
    .attr('id', 'arrow-x-source')
    .attr('viewBox', '-6 -6 12 12')
    .attr('refX', -18).attr('refY', 0)
    .attr('markerWidth', 8).attr('markerHeight', 8)
    .attr('orient', 'auto');
  xMarker.append('line')
    .attr('x1', -4).attr('y1', -4).attr('x2', 4).attr('y2', 4)
    .attr('stroke', '#C0392B').attr('stroke-width', 2);
  xMarker.append('line')
    .attr('x1', 4).attr('y1', -4).attr('x2', -4).attr('y2', 4)
    .attr('stroke', '#C0392B').attr('stroke-width', 2);
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

  // ── Pin Extreme_Nodes to fixed viewport positions ──
  const EXTREME_PINS = {
    w_T: [W/2, 40],
    w_O: [W/2, H-40],
    w_N: [40, H/2],
    w_E: [W-40, H/2],
    w_F: [W/2, H/2],
  };
  nodes.forEach(n => {
    if (EXTREME_PINS[n.id]) {
      n.fx = EXTREME_PINS[n.id][0];
      n.fy = EXTREME_PINS[n.id][1];
      // Set initial position to pin location
      if (n.x === undefined) n.x = n.fx;
      if (n.y === undefined) n.y = n.fy;
    } else {
      // Use initialX/initialY as starting positions
      if (n.x === undefined && n.initialX !== undefined) n.x = n.initialX;
      if (n.y === undefined && n.initialY !== undefined) n.y = n.initialY;
    }
  });

  _simulation = d3.forceSimulation(nodes)
    .force('link',      d3.forceLink(edges).id(d => d.id).distance(130).strength(0.45))
    .force('charge',    d3.forceManyBody().strength(-320))
    .force('center',    d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(40))
    .force('cluster',   _buildClusterForce(nodes))
    .force('extreme',   _buildExtremeForce(nodes));

  const PADDING = 40;
  const EXTREME_IDS_SET = new Set(['w_T', 'w_O', 'w_N', 'w_E', 'w_F']);

  // Clamp on simulation end
  _simulation.on('end', () => {
    nodes.forEach(n => {
      if (!EXTREME_IDS_SET.has(n.id)) {
        n.x = Math.max(PADDING, Math.min(W - PADDING, n.x));
        n.y = Math.max(PADDING, Math.min(H - PADDING, n.y));
      }
    });
    _nodeGroup.selectAll('g.node').attr('transform', d => `translate(${d.x},${d.y})`);
  });

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
      const markerEndId = style.markerEnd || `arrow-${type}`;
      const markerStartId = style.markerStart || null;
      d3.select(this)
        .attr('stroke',           style.stroke)
        .attr('stroke-width',     Math.max(1, Math.min(5, style.strokeWidth * (d.weight || 0.7))))
        .attr('stroke-dasharray', style.dashArray || null)
        .attr('stroke-opacity',   style.opacity)
        .attr('filter',           style.filter || null)
        .attr('marker-end',       `url(#${markerEndId})`)
        .attr('marker-start',     markerStartId ? `url(#${markerStartId})` : null);
    });

  // ── Fusiona offset paths (second parallel line) ──
  // Remove stale fusiona-2 paths first
  _linkGroup.selectAll('path.link-fusiona-2').remove();

  linkEnter.filter(d => (EDGE_ALIAS[d.type] || d.type) === 'fusiona')
    .each(function(d) {
      d3.select(this.parentNode).append('path')
        .datum(d)
        .attr('class', 'link link-fusiona-2')
        .attr('fill', 'none')
        .attr('stroke', '#1ABC9C')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('pointer-events', 'none');
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

  // ── Halo for Extreme_Nodes (appended BEFORE circle so it renders behind) ──
  nodeEnter.filter(d => d.type === 'extremo')
    .append('circle')
    .attr('class', 'halo')
    .attr('r', d => _nodeRadius(d) + 12)
    .attr('fill', 'none')
    .attr('stroke', d => NODE_STROKE[d.type] || '#4A7BC8')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.3)
    .attr('pointer-events', 'none');

  // ── Main circle ──
  nodeEnter.append('circle')
    .attr('r', d => {
      if (_bridgeNodeIds.has(d.id)) return _nodeRadius(d) * 1.3;
      return _nodeRadius(d);
    })
    .attr('fill',         d => NODE_FILL[d.type]   || '#1A3050')
    .attr('stroke',       d => {
      if (d.type === 'structural_limit') return '#FF6B35';
      if (_bridgeNodeIds.has(d.id)) return '#C5A86B';
      return NODE_STROKE[d.type] || '#4A7BC8';
    })
    .attr('stroke-width', d => {
      if (d.type === 'structural_limit') return 2.5;
      if (_bridgeNodeIds.has(d.id)) return 2.5;
      return 1.5;
    })
    // Collapse indicator: reduced opacity + dashed border for high incognoscible nodes
    .attr('stroke-dasharray', d => (d.horizon && d.horizon.incognoscible > 0.8) ? '4,3' : null)
    .attr('opacity',           d => (d.horizon && d.horizon.incognoscible > 0.8) ? 0.6 : 1);

  // ── Hexagonal clip for structural_limit nodes ──
  nodeEnter.filter(d => d.type === 'structural_limit')
    .each(function(d) {
      const r = _nodeRadius(d);
      const hexPoints = Array.from({length: 6}, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
      }).join(' ');
      const clipId = `hex-clip-${d.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      _defs.append('clipPath').attr('id', clipId)
        .append('polygon').attr('points', hexPoints);
      d3.select(this).select('circle')
        .attr('clip-path', `url(#${clipId})`)
        .attr('r', r);
    });

  // ── Halo hover/focus handlers ──
  nodeEnter
    .on('mouseenter.halo', function(e, d) {
      if (d.type === 'extremo') {
        d3.select(this).select('.halo')
          .attr('r', _nodeRadius(d) + 20);
      }
    })
    .on('mouseleave.halo', function(e, d) {
      if (d.type === 'extremo') {
        d3.select(this).select('.halo')
          .attr('r', _nodeRadius(d) + 12);
      }
    });

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
    // Clamp non-pinned nodes to viewport bounds
    nodes.forEach(n => {
      if (!EXTREME_IDS_SET.has(n.id)) {
        n.x = Math.max(PADDING, Math.min(W - PADDING, n.x));
        n.y = Math.max(PADDING, Math.min(H - PADDING, n.y));
      }
    });

    _linkGroup.selectAll('path.link:not(.link-fusiona-2)').attr('d', _edgePath);
    _linkGroup.selectAll('path.link-fusiona-2').attr('d', d => _edgePathOffset(d, 4));
    _nodeGroup.selectAll('g.node').attr('transform', d => `translate(${d.x},${d.y})`);

    // Update inaccessible region between w_O and w_N
    const wO = nodes.find(n => n.id === 'w_O');
    const wN = nodes.find(n => n.id === 'w_N');
    if (wO && wN && _inaccessibleRegion) {
      _inaccessibleRegion
        .attr('cx', (wO.x + wN.x) / 2)
        .attr('cy', (wO.y + wN.y) / 2);
    }

    // Update collapse zone centroid
    const collapseNodes = nodes.filter(n => n.horizon && n.horizon.incognoscible > 0.5);
    if (collapseNodes.length > 0 && _collapseZone) {
      const cx = collapseNodes.reduce((s, n) => s + n.x, 0) / collapseNodes.length;
      const cy = collapseNodes.reduce((s, n) => s + n.y, 0) / collapseNodes.length;
      _collapseZone.attr('cx', cx).attr('cy', cy);
    }
  });

  // Apply initial layer visibility
  _applyLayerVisibility();
}

// ─── EDGE PATH (quadratic Bézier for curved directed edges) ───────────────────

function _edgePath(d) {
  const sx = d.source.x, sy = d.source.y;
  const tx = d.target.x, ty = d.target.y;
  // Slight curve offset so bidirectional edges don't overlap
  const dx = tx - sx, dy = ty - sy;
  const cx = (sx + tx) / 2 - dy * 0.15;
  const cy = (sy + ty) / 2 + dx * 0.15;
  return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
}

// ─── EDGE PATH OFFSET (for fusiona second line) ───────────────────────────────

function _edgePathOffset(d, offset) {
  const sx = d.source.x, sy = d.source.y;
  const tx = d.target.x, ty = d.target.y;
  const dx = tx - sx, dy = ty - sy;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const nx = -dy/len * offset, ny = dx/len * offset;
  const cx = (sx+tx)/2 - dy*0.15 + nx;
  const cy = (sy+ty)/2 + dx*0.15 + ny;
  return `M${sx+nx},${sy+ny} Q${cx},${cy} ${tx},${ty}`;
}

// ─── CLUSTER FORCE ────────────────────────────────────────────────────────────

function _buildClusterForce(nodes) {
  // Compute centroids per domain from initialX/initialY values
  const centroids = {};
  nodes.forEach(n => {
    if (!n.domain) return;
    if (!centroids[n.domain]) centroids[n.domain] = { x: 0, y: 0, count: 0 };
    centroids[n.domain].x += (n.initialX || n.x || 350);
    centroids[n.domain].y += (n.initialY || n.y || 260);
    centroids[n.domain].count++;
  });
  Object.values(centroids).forEach(c => { c.x /= c.count; c.y /= c.count; });

  return function(alpha) {
    nodes.forEach(n => {
      if (!n.domain || !centroids[n.domain]) return;
      const c = centroids[n.domain];
      n.vx += (c.x - n.x) * 0.08 * alpha;
      n.vy += (c.y - n.y) * 0.08 * alpha;
    });
  };
}

// ─── EXTREME-NODE ATTRACTION/REPULSION FORCE ──────────────────────────────────

function _buildExtremeForce(nodes) {
  const EXTREME_IDS = new Set(['w_T', 'w_O', 'w_N', 'w_E', 'w_F']);
  const extremeMap = {};
  nodes.forEach(n => { if (EXTREME_IDS.has(n.id)) extremeMap[n.id] = n; });

  return function(alpha) {
    nodes.forEach(n => {
      if (EXTREME_IDS.has(n.id)) return;
      const hz = n.horizon || {};
      const known   = hz.conocido       || 0;
      const unknown = hz.desconocido    || 0;
      const incog   = hz.incognoscible  || 0;

      // w_T: attract high conocido
      if (extremeMap.w_T && known > 0.5) {
        n.vx += (extremeMap.w_T.x - n.x) * known * 0.02 * alpha;
        n.vy += (extremeMap.w_T.y - n.y) * known * 0.02 * alpha;
      }
      // w_O: attract high incognoscible
      if (extremeMap.w_O && incog > 0.3) {
        n.vx += (extremeMap.w_O.x - n.x) * incog * 0.02 * alpha;
        n.vy += (extremeMap.w_O.y - n.y) * incog * 0.02 * alpha;
      }
      // w_N: attract low combined
      if (extremeMap.w_N && (known + unknown) < 0.3) {
        n.vx += (extremeMap.w_N.x - n.x) * 0.015 * alpha;
        n.vy += (extremeMap.w_N.y - n.y) * 0.015 * alpha;
      }
      // w_E: attract conocido === 1.0
      if (extremeMap.w_E && known >= 0.95) {
        n.vx += (extremeMap.w_E.x - n.x) * 0.03 * alpha;
        n.vy += (extremeMap.w_E.y - n.y) * 0.03 * alpha;
      }
      // w_F: weak central attractor for all
      if (extremeMap.w_F) {
        n.vx += (extremeMap.w_F.x - n.x) * 0.005 * alpha;
        n.vy += (extremeMap.w_F.y - n.y) * 0.005 * alpha;
      }
    });
  };
}

// ─── BRIDGE NODE DETECTION ────────────────────────────────────────────────────

function _computeBridgeNodes(nodes, edges) {
  const nodeDomain = {};
  nodes.forEach(n => { nodeDomain[n.id] = n.domain; });
  const bridgeIds = new Set();
  edges.forEach(e => {
    const sid = e.source?.id || e.source;
    const tid = e.target?.id || e.target;
    if (nodeDomain[sid] && nodeDomain[tid] && nodeDomain[sid] !== nodeDomain[tid]) {
      bridgeIds.add(sid);
      bridgeIds.add(tid);
    }
  });
  return bridgeIds;
}

// ─── TEMPORAL LAYER ANIMATION ─────────────────────────────────────────────────

let _temporalAnimFrame = null;
let _temporalBaseRadii = new Map(); // nodeId → base radius

function _startTemporalAnimation() {
  if (_temporalAnimFrame) return; // already running
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // static representation only

  const period = 3000; // 3s period
  const start = performance.now();

  function tick(now) {
    const t = ((now - start) % period) / period; // 0..1
    const phase = Math.sin(t * 2 * Math.PI);     // -1..1

    _nodeGroup && _nodeGroup.selectAll('g.node').each(function(d) {
      if (!d || !d.horizon) return;
      // Skip nodes being dragged
      if (d.fx !== null && d.fx !== undefined && !['w_T','w_O','w_N','w_E','w_F'].includes(d.id)) return;

      const hz = d.horizon;
      const circle = d3.select(this).select('circle');
      if (circle.empty()) return;

      const baseR = _nodeRadius(d) * (_bridgeNodeIds.has(d.id) ? 1.3 : 1);
      let dr = 0;
      if (hz.desconocido > 0.5) {
        dr = phase * 4 * hz.desconocido; // pulse outward
      } else if (hz.conocido > 0.5) {
        dr = phase * -2 * hz.conocido;   // pulse inward
      }
      circle.attr('r', Math.max(8, baseR + dr));
    });

    _temporalAnimFrame = requestAnimationFrame(tick);
  }

  _temporalAnimFrame = requestAnimationFrame(tick);
}

function _stopTemporalAnimation() {
  if (_temporalAnimFrame) {
    cancelAnimationFrame(_temporalAnimFrame);
    _temporalAnimFrame = null;
  }
  // Restore base radii
  _nodeGroup && _nodeGroup.selectAll('g.node')
    .transition().duration(500)
    .select('circle')
    .attr('r', d => {
      if (!d) return 16;
      const base = _nodeRadius(d);
      return _bridgeNodeIds.has(d.id) ? base * 1.3 : base;
    });
}

// ─── TEMPORAL PARTICLE ANIMATION ENGINE ───────────────────────────────────────

let _particleAnimFrame = null;
let _particles = [];

function _startParticleFlow() {
  if (_particleAnimFrame) return; // already running
  if (!_particleGroup) {
    _particleGroup = _g.select('.particles');
    if (_particleGroup.empty()) {
      _particleGroup = _g.append('g').attr('class', 'particles');
    }
  }

  let lastSpawn = 0;
  const spawnInterval = 350; // Spawn a particle every 350ms

  function animate(now) {
    if (now - lastSpawn > spawnInterval) {
      lastSpawn = now;
      _spawnParticles();
    }

    const nextParticles = [];
    _particles.forEach(p => {
      const elapsed = now - p.startTime;
      const progress = Math.min(1, elapsed / p.duration);

      const isMysteryEdge = p.isMystery || p.type === 'ocultamiento' || p.type === 'imposibilita' || p.type === 'colapsa';
      const limit = isMysteryEdge ? 0.5 : 1.0;

      if (progress >= limit) {
        p.el.remove();
      } else {
        try {
          const point = p.pathNode.getPointAtLength(progress * p.length);
          p.el
            .attr('cx', point.x)
            .attr('cy', point.y);
          
          if (isMysteryEdge) {
            // Fade out as it hits mystery barrier (limit = 0.5)
            const opacity = (1.0 - (progress / 0.5)) * 0.95;
            p.el.attr('opacity', opacity);
          }
          nextParticles.push(p);
        } catch(e) {
          p.el.remove();
        }
      }
    });
    _particles = nextParticles;

    _particleAnimFrame = requestAnimationFrame(animate);
  }

  _particleAnimFrame = requestAnimationFrame(animate);
}

function _stopParticleFlow() {
  if (_particleAnimFrame) {
    cancelAnimationFrame(_particleAnimFrame);
    _particleAnimFrame = null;
  }
  if (_particleGroup) {
    _particleGroup.selectAll('*').remove();
  }
  _particles = [];
}

function _spawnParticles() {
  if (!_linkGroup) return;
  const visibleLinks = _linkGroup.selectAll('path.link:not(.link-fusiona-2)')
    .filter(function() {
      const op = d3.select(this).attr('opacity');
      return op && parseFloat(op) > 0.1;
    });

  if (visibleLinks.empty()) return;

  const nodes = visibleLinks.nodes();
  const count = Math.min(3, nodes.length);
  const shuffled = nodes.sort(() => 0.5 - Math.random());

  for (let i = 0; i < count; i++) {
    const pathNode = shuffled[i];
    const d3Path = d3.select(pathNode);
    const d = d3Path.datum();
    if (!d) continue;

    const type = EDGE_ALIAS[d.type] || d.type;
    const isMystery = type === 'mystery' || type === 'ocultamiento' || type === 'imposibilita' || type === 'colapsa';
    
    try {
      const length = pathNode.getTotalLength();
      if (length <= 0) continue;

      const circle = _particleGroup.append('circle')
        .attr('class', 'epistemic-particle' + (isMystery ? ' mystery' : ''))
        .attr('r', isMystery ? 2.5 : 3.0)
        .attr('opacity', 0.95);

      _particles.push({
        pathNode,
        length,
        duration: length * (isMystery ? 10 : 16),
        startTime: performance.now(),
        el: circle,
        type,
        isMystery
      });
    } catch(e) {
      // ignore geometry errors
    }
  }
}


// ─── LAYER VISIBILITY ─────────────────────────────────────────────────────────

function _applyLayerVisibility() {
  if (!_nodeGroup || !_linkGroup) return;

  // Handle temporal layer animation
  const activeLayers = layerSystem.getActiveLayers();
  if (activeLayers.includes('temporal')) {
    _startTemporalAnimation();
    _startParticleFlow();
  } else {
    _stopTemporalAnimation();
    _stopParticleFlow();
  }

  _nodeGroup.selectAll('g.node')
    .transition().duration(300)
    .attr('opacity', d => layerSystem.isNodeVisible(d) ? 1 : 0)
    .attr('pointer-events', d => layerSystem.isNodeVisible(d) ? 'all' : 'none');

  _linkGroup.selectAll('path.link:not(.link-fusiona-2)')
    .transition().duration(300)
    .attr('opacity', d => {
      if (!layerSystem.isEdgeVisible(d)) return 0;
      const type = EDGE_ALIAS[d.type] || d.type;
      return (EDGE_STYLE[type]?.opacity || 0.7);
    })
    .attr('pointer-events', d => layerSystem.isEdgeVisible(d) ? 'stroke' : 'none');

  _linkGroup.selectAll('path.link-fusiona-2')
    .transition().duration(300)
    .attr('opacity', d => layerSystem.isEdgeVisible(d) ? 0.6 : 0);

  // Update node panel layers section if open
  if (_nodePanelEl && _nodePanelEl.classList.contains('visible') && _currentPanelNode) {
    _updatePanelLayersSection(_currentPanelNode);
  }
}

function _updatePanelLayersSection(node) {
  const layersEl = _nodePanelEl && _nodePanelEl.querySelector('#panel-layers');
  if (!layersEl) return;
  const activeLayers = layerSystem.getActiveLayers();
  const nodeLayers = node.layers || ['narrative'];
  layersEl.innerHTML = nodeLayers.map(l => {
    const isActive = activeLayers.includes(l);
    return `<span class="layer-tag${isActive ? ' active' : ''}">${l}</span>`;
  }).join(' ');
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
  const EXTREME_IDS = new Set(['w_T', 'w_O', 'w_N', 'w_E', 'w_F']);
  if (!EXTREME_IDS.has(d.id)) {
    d.fx = null; d.fy = null;
  }
}

// ─── NODE PANEL ───────────────────────────────────────────────────────────────

function _showNodePanel(e, d) {
  const panel = _nodePanelEl;
  if (!panel) return;

  _currentPanelNode = d;

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

  // Layers section
  const layersContainer = panel.querySelector('#panel-layers');
  if (layersContainer) {
    _updatePanelLayersSection(d);
  }

  // Meta-logic rules section
  const metalogicEl = panel.querySelector('#panel-metalogic');
  if (metalogicEl) {
    const ruleKey = METALOGIC_RULES[d.domain];
    metalogicEl.textContent = ruleKey ? t(ruleKey) : '—';
  }

  // Structural limit note
  const structLimitEl = panel.querySelector('#panel-structural-limit');
  if (structLimitEl) {
    const section = panel.querySelector('#panel-structural-limit-section');
    if (section) {
      section.style.display = d.type === 'structural_limit' ? 'block' : 'none';
    }
    structLimitEl.style.display = d.type === 'structural_limit' ? 'block' : 'none';
  }

  // Minimap SVG inset
  const minimapEl = panel.querySelector('#panel-minimap');
  if (minimapEl && _graphData) {
    _renderMinimap(minimapEl, d);
  }

  panel.classList.add('visible');
  _positionPanel(panel, e);
}

function _hideNodePanel() {
  _nodePanelEl && _nodePanelEl.classList.remove('visible');
  _currentPanelNode = null;
}

// ─── MINIMAP ──────────────────────────────────────────────────────────────────

function _renderMinimap(svgEl, selectedNode) {
  const W = 120, H = 80;
  const extremeNodes = _graphData.nodes.filter(n => n.type === 'extremo');

  // Scale: map initialX/initialY to minimap dimensions
  const allX = extremeNodes.map(n => n.initialX || 350);
  const allY = extremeNodes.map(n => n.initialY || 260);
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const scaleX = (x) => ((x - minX) / (maxX - minX + 1)) * (W - 20) + 10;
  const scaleY = (y) => ((y - minY) / (maxY - minY + 1)) * (H - 20) + 10;

  // Clear and rebuild
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  // ARIA attributes
  svg.attr('role', 'img').attr('aria-label', t('panel.minimap') || 'Posición en la topología');

  // Draw extreme nodes as small circles
  extremeNodes.forEach(n => {
    svg.append('circle')
      .attr('cx', scaleX(n.initialX || 350))
      .attr('cy', scaleY(n.initialY || 260))
      .attr('r', 4)
      .attr('fill', '#4A7BC8')
      .attr('opacity', 0.7);
    svg.append('text')
      .attr('x', scaleX(n.initialX || 350))
      .attr('y', scaleY(n.initialY || 260) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '6px')
      .attr('fill', '#6A8AB8')
      .text(n.id);
  });

  // Draw selected node
  const sx = selectedNode.initialX || selectedNode.x || 350;
  const sy = selectedNode.initialY || selectedNode.y || 260;
  svg.append('circle')
    .attr('cx', scaleX(sx))
    .attr('cy', scaleY(sy))
    .attr('r', 5)
    .attr('fill', '#C5A86B')
    .attr('stroke', '#FFD700')
    .attr('stroke-width', 1.5);
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
    .attr('stroke-width', Math.max(1, Math.min(5, style.strokeWidth * 1.6)));
  _showEdgePanel(e, d);
}
function _onEdgeLeave(e, d) {
  const type = EDGE_ALIAS[d.type] || d.type;
  const style = EDGE_STYLE[type] || EDGE_STYLE['revelación'];
  d3.select(this)
    .attr('stroke-opacity', style.opacity)
    .attr('stroke-width',   Math.max(1, Math.min(5, style.strokeWidth * (d.weight || 0.7))));
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


// ─── GUIDED TOURS SEMANTICS ───────────────────────────────────────────────────

const TOURS_DATA = {
  reveal: [
    { nodeId: 'w_E', i18nKey: 'tours.reveal.step1' },
    { nodeId: 'w_N', i18nKey: 'tours.reveal.step2' },
    { nodeId: 'w_T', i18nKey: 'tours.reveal.step3' }
  ],
  mystery: [
    { nodeId: 'w_O', i18nKey: 'tours.mystery.step1' },
    { nodeId: 'mejor_secreto', i18nKey: 'tours.mystery.step2' }
  ],
  computability: [
    { nodeId: 'w_F', i18nKey: 'tours.computability.step1' },
    { nodeId: 'incompletitud', i18nKey: 'tours.computability.step2' },
    { nodeId: 'indecidibilidad', i18nKey: 'tours.computability.step3' }
  ]
};

window.startGuidedTour = function(tourId) {
  if (!TOURS_DATA[tourId]) return;
  _activeTour = tourId;
  _activeTourStep = 0;
  
  // Close standard node panel if visible
  _hideNodePanel();
  
  // Sync desktop buttons active class
  document.querySelectorAll('#tour-selector .ctrl-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tour === tourId);
  });
  // Sync mobile select value
  const select = document.getElementById('mobile-tour-select');
  if (select) select.value = tourId;
  
  // Render first step
  _renderTourStep();
};

window.nextTourStep = function() {
  if (!_activeTour) return;
  if (_activeTourStep < TOURS_DATA[_activeTour].length - 1) {
    _activeTourStep++;
    _renderTourStep();
  }
};

window.prevTourStep = function() {
  if (!_activeTour) return;
  if (_activeTourStep > 0) {
    _activeTourStep--;
    _renderTourStep();
  }
};

window.exitGuidedTour = function() {
  _activeTour = null;
  _activeTourStep = 0;
  
  // Sync desktop buttons (remove all active classes)
  document.querySelectorAll('#tour-selector .ctrl-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  // Sync mobile select value
  const select = document.getElementById('mobile-tour-select');
  if (select) select.value = '';
  
  // Hide panel
  const panel = document.getElementById('tour-narrative-panel');
  if (panel) panel.style.display = 'none';
  
  // Restore all nodes and links using standard visibility
  _applyLayerVisibility();
  
  // Reset tour highlight classes
  _nodeGroup.selectAll('g.node circle').classed('tour-highlight', false);
  
  // Restore zoom transform back to center
  if (_svg && _zoom) {
    _svg.transition().duration(800).call(
      _zoom.transform,
      d3.zoomIdentity
    );
  }
};

window.updateTourLanguageUI = function() {
  if (!_activeTour) return;
  const steps = TOURS_DATA[_activeTour];
  const step = steps[_activeTourStep];
  const lang = t('lang') || 'es';
  
  const indicatorText = lang === 'es'
    ? `Paso ${_activeTourStep + 1} de ${steps.length}`
    : `Step ${_activeTourStep + 1} of ${steps.length}`;
  
  const badgeText = _activeTour === 'reveal' ? t('tours.btnReveal')
                  : _activeTour === 'mystery' ? t('tours.btnMystery')
                  : t('tours.btnComputability');
                  
  const badgeEl = document.getElementById('tour-badge-text');
  if (badgeEl) badgeEl.textContent = badgeText;
  
  const indicatorEl = document.getElementById('tour-step-indicator');
  if (indicatorEl) indicatorEl.textContent = indicatorText;
  
  const descEl = document.getElementById('tour-step-description');
  if (descEl) descEl.innerHTML = t(step.i18nKey);
  
  const prevEl = document.getElementById('btn-tour-prev');
  if (prevEl) prevEl.textContent = t('tours.prev');
  
  const nextEl = document.getElementById('btn-tour-next');
  if (nextEl) nextEl.textContent = t('tours.next');
  
  const exitEl = document.getElementById('btn-tour-exit');
  if (exitEl) exitEl.textContent = t('tours.exit');
};

function _renderTourStep() {
  if (!_activeTour) return;
  const steps = TOURS_DATA[_activeTour];
  const step = steps[_activeTourStep];
  
  // Find node in graph data
  const node = _graphData.nodes.find(n => n.id === step.nodeId);
  if (!node) return;
  
  // 1. Remove highlight class from all nodes
  _nodeGroup.selectAll('g.node circle').classed('tour-highlight', false);
  
  // 2. Dim non-active nodes and highlight focused node
  _nodeGroup.selectAll('g.node')
    .transition().duration(400)
    .attr('opacity', d => d.id === node.id ? 1.0 : 0.15)
    .attr('pointer-events', d => d.id === node.id ? 'all' : 'none');
    
  // Add class to active circle
  _nodeGroup.selectAll('g.node')
    .filter(d => d.id === node.id)
    .select('circle')
    .classed('tour-highlight', true);
    
  // 3. Dim non-active links, keep connected links visible
  _linkGroup.selectAll('path.link')
    .transition().duration(400)
    .attr('opacity', d => (d.source.id === node.id || d.target.id === node.id) ? 0.7 : 0.05)
    .attr('pointer-events', d => (d.source.id === node.id || d.target.id === node.id) ? 'stroke' : 'none');
    
  // Dim fusion links
  _linkGroup.selectAll('path.link-fusiona-2')
    .transition().duration(400)
    .attr('opacity', d => (d.source.id === node.id || d.target.id === node.id) ? 0.6 : 0.05);

  // 4. Center camera on the focused node
  if (_svg && _zoom) {
    const vb = _svg.attr('viewBox').split(' ');
    const W = +vb[2] || 700;
    const H = +vb[3] || 520;
    
    _svg.transition().duration(800).call(
      _zoom.transform,
      d3.zoomIdentity.translate(W / 2, H / 2).scale(1.4).translate(-node.x, -node.y)
    );
  }
  
  // 5. Show narrative panel
  const panel = document.getElementById('tour-narrative-panel');
  if (panel) {
    panel.style.display = 'block';
  }
  
  // Update narrative strings
  window.updateTourLanguageUI();
}

function _initTourEvents() {
  const btnReveal = document.getElementById('btn-tour-reveal');
  const btnMystery = document.getElementById('btn-tour-mystery');
  const btnComputability = document.getElementById('btn-tour-computability');
  const btnPrev = document.getElementById('btn-tour-prev');
  const btnNext = document.getElementById('btn-tour-next');
  const btnExit = document.getElementById('btn-tour-exit');
  
  if (btnReveal) btnReveal.addEventListener('click', () => window.startGuidedTour('reveal'));
  if (btnMystery) btnMystery.addEventListener('click', () => window.startGuidedTour('mystery'));
  if (btnComputability) btnComputability.addEventListener('click', () => window.startGuidedTour('computability'));
  if (btnPrev) btnPrev.addEventListener('click', () => window.prevTourStep());
  if (btnNext) btnNext.addEventListener('click', () => window.nextTourStep());
  if (btnExit) btnExit.addEventListener('click', () => window.exitGuidedTour());

  const mobileTourSelect = document.getElementById('mobile-tour-select');
  if (mobileTourSelect) {
    mobileTourSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        window.startGuidedTour(val);
      } else {
        window.exitGuidedTour();
      }
    });
  }
}
