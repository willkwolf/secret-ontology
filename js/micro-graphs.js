/**
 * micro-graphs.js — Progressive lightweight D3.js micro-graphs
 * Section § 02: Distinction (Secret vs Mystery)
 * Section § 03: Modal Interactivo (Dynamic Kripke Frame)
 */

import { t } from './i18n.js';

let _playgroundSvg = null;
let _playgroundLink = null;
let _playgroundNodeW0 = null;
let _playgroundNodeW1 = null;

/**
 * Initialize progressive micro-graphs
 */
export function initMicroGraphs() {
  _initDistinctionGraph();
  _initPlaygroundGraph();
  _initTopologyGraph();
  _initTemporalGraph();
}

/**
 * Section § 02: Distinction Micro-Graph
 */
function _initDistinctionGraph() {
  const container = document.getElementById('micro-graph-distinction');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  const width = 320;
  const height = 240;

  const svg = d3.select('#micro-graph-distinction')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

  // Define Arrowheads and blocked markers
  const defs = svg.append('defs');

  // Gold arrow marker for Secret (w1)
  defs.append('marker')
    .attr('id', 'dist-arrow-gold')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'var(--gold)');

  // Violet bar marker for Mystery (w2)
  defs.append('marker')
    .attr('id', 'dist-bar-violet')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4 L2,-4 L2,4 L0,4 Z')
    .attr('fill', 'var(--mystery)');

  // Nodes Data
  const nodes = [
    { id: 'w0', label: 'w₀', x: 70, y: 120, type: 'current' },
    { id: 'w1', label: 'w₁', x: 230, y: 60, type: 'secret' },
    { id: 'w2', label: 'w₂', x: 230, y: 180, type: 'mystery' }
  ];

  // Links Data
  const links = [
    { source: 'w0', target: 'w1', type: 'secret', class: 'dashed-gold', marker: 'url(#dist-arrow-gold)' },
    { source: 'w0', target: 'w2', type: 'mystery', class: 'mystery-violet', marker: 'url(#dist-bar-violet)' }
  ];

  // Draw Edges
  svg.selectAll('.micro-edge')
    .data(links)
    .enter()
    .append('path')
    .attr('class', d => `micro-edge ${d.class}`)
    .attr('d', d => {
      const s = nodes.find(n => n.id === d.source);
      const t = nodes.find(n => n.id === d.target);
      return `M${s.x},${s.y} L${t.x},${t.y}`;
    })
    .attr('marker-end', d => d.marker);

  // Draw Nodes
  const nodeElems = svg.selectAll('.micro-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'micro-node')
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => {
      // Toggle active states
      nodeElems.classed('active', false);
      d3.select(event.currentTarget).classed('active', true);

      // Update Explanation Panel
      const descPanel = document.getElementById('micro-graph-distinction-desc');
      if (descPanel) {
        let textKey = '';
        if (d.id === 'w0') textKey = 'micro.w0Desc';
        else if (d.id === 'w1') textKey = 'micro.w1Desc';
        else if (d.id === 'w2') textKey = 'micro.w2Desc';

        descPanel.innerHTML = `<p>${t(textKey)}</p>`;
      }
    });

  nodeElems.append('circle')
    .attr('r', 16);

  nodeElems.append('text')
    .text(d => d.label);
}

/**
 * Section § 03: Playground Micro-Graph
 */
function _initPlaygroundGraph() {
  const container = document.getElementById('micro-graph-playground');
  if (!container) return;

  container.innerHTML = '';

  const width = 360;
  const height = 240;

  _playgroundSvg = d3.select('#micro-graph-playground')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const defs = _playgroundSvg.append('defs');

  // Gold arrow marker
  defs.append('marker')
    .attr('id', 'play-arrow-gold')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'var(--gold)');

  // Thick Gold arrow marker (Knowledge)
  defs.append('marker')
    .attr('id', 'play-arrow-thick-gold')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4')
    .attr('fill', 'var(--gold)');

  // Violet bar marker
  defs.append('marker')
    .attr('id', 'play-bar-violet')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4 L2,-4 L2,4 L0,4 Z')
    .attr('fill', 'var(--mystery)');

  // Red barrier marker
  defs.append('marker')
    .attr('id', 'play-bar-red')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-3 L2,-3 L2,3 L0,3 Z')
    .attr('fill', 'var(--danger)');

  const nodes = [
    { id: 'w0', label: 'w₀', x: 100, y: 120 },
    { id: 'w1', label: 'w₁', x: 260, y: 120 }
  ];

  // Draw dynamic link
  _playgroundLink = _playgroundSvg.append('path')
    .attr('class', 'micro-edge')
    .attr('d', `M${nodes[0].x},${nodes[0].y} L${nodes[1].x},${nodes[1].y}`);

  // Draw Nodes
  const nodeElems = _playgroundSvg.selectAll('.micro-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'micro-node active')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  nodeElems.append('circle')
    .attr('r', 16);

  nodeElems.append('text')
    .text(d => d.label);

  _playgroundNodeW0 = nodeElems.filter(d => d.id === 'w0');
  _playgroundNodeW1 = nodeElems.filter(d => d.id === 'w1');
}

/**
 * Update playground micro-graph dynamically based on toggle configuration
 * @param {boolean} C - Fact is True
 * @param {boolean} K - Agent Knows
 * @param {boolean} Access - Modal Access
 */
export function updatePlaygroundGraph(C, K, Access) {
  if (!_playgroundSvg || !_playgroundLink) return;

  if (!C) {
    // Absurd: broken red edge, dimmed target node
    _playgroundLink
      .attr('class', 'micro-edge broken-red')
      .attr('marker-end', 'url(#play-bar-red)');

    _playgroundNodeW0.select('circle')
      .style('stroke', 'var(--danger)')
      .style('filter', 'drop-shadow(0 0 4px rgba(192, 96, 96, 0.4))');

    _playgroundNodeW1.select('circle')
      .style('stroke', 'var(--text-dimmer)')
      .style('filter', 'none');

  } else if (K) {
    // Full Knowledge: thick gold relation, glowing nodes
    _playgroundLink
      .attr('class', 'micro-edge thick-gold')
      .attr('marker-end', 'url(#play-arrow-thick-gold)');

    _playgroundNodeW0.select('circle')
      .style('stroke', 'var(--gold)')
      .style('filter', 'drop-shadow(0 0 6px rgba(197, 168, 107, 0.6))');

    _playgroundNodeW1.select('circle')
      .style('stroke', 'var(--gold)')
      .style('filter', 'drop-shadow(0 0 6px rgba(197, 168, 107, 0.6))');

  } else if (Access) {
    // Secret Active: dashed gold relation, accessible target
    _playgroundLink
      .attr('class', 'micro-edge dashed-gold')
      .attr('marker-end', 'url(#play-arrow-gold)');

    _playgroundNodeW0.select('circle')
      .style('stroke', 'var(--gold)')
      .style('filter', 'drop-shadow(0 0 4px rgba(197, 168, 107, 0.4))');

    _playgroundNodeW1.select('circle')
      .style('stroke', 'var(--silver)')
      .style('filter', 'none');

  } else {
    // Mystery Estructural: blocked violet relation, locked target
    _playgroundLink
      .attr('class', 'micro-edge mystery-violet')
      .attr('marker-end', 'url(#play-bar-violet)');

    _playgroundNodeW0.select('circle')
      .style('stroke', 'var(--gold)')
      .style('filter', 'drop-shadow(0 0 4px rgba(197, 168, 107, 0.4))');

    _playgroundNodeW1.select('circle')
      .style('stroke', 'var(--mystery)')
      .style('filter', 'drop-shadow(0 0 4px rgba(144, 96, 192, 0.4))');
  }
}

/**
 * Section § 05b: Topology (Pentagonal Poles) Micro-Graph
 */
function _initTopologyGraph() {
  const container = document.getElementById('micro-graph-topology');
  if (!container) return;

  container.innerHTML = '';

  const width = 320;
  const height = 240;

  const svg = d3.select('#micro-graph-topology')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const defs = svg.append('defs');

  // Gold arrow marker
  defs.append('marker')
    .attr('id', 'topo-arrow-gold')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'var(--gold)');

  // Violet bar marker
  defs.append('marker')
    .attr('id', 'topo-bar-violet')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4 L2,-4 L2,4 L0,4 Z')
    .attr('fill', 'var(--mystery)');

  // 5 Nodes in a neat pentagon
  const nodes = [
    { id: 'wT', base: 'w', sub: 'T', x: 160, y: 45, key: 'micro.wTDesc' },
    { id: 'wE', base: 'w', sub: 'E', x: 222, y: 90, key: 'micro.wEDesc' },
    { id: 'wF', base: 'w', sub: 'F', x: 198, y: 163, key: 'micro.wFDesc' },
    { id: 'wN', base: 'w', sub: 'N', x: 122, y: 163, key: 'micro.wNDesc' },
    { id: 'wO', base: 'w', sub: 'O', x: 98, y: 90, key: 'micro.wODesc' }
  ];

  // Kripke transitions
  const links = [
    { source: 'wT', target: 'wE', class: 'dashed-gold', marker: 'url(#topo-arrow-gold)' },
    { source: 'wT', target: 'wN', class: 'dashed-gold', marker: 'url(#topo-arrow-gold)' },
    { source: 'wF', target: 'wT', class: 'dashed-gold', marker: 'url(#topo-arrow-gold)' },
    { source: 'wF', target: 'wE', class: 'dashed-gold', marker: 'url(#topo-arrow-gold)' },
    { source: 'wE', target: 'wF', class: 'dashed-gold', marker: 'url(#topo-arrow-gold)' },
    { source: 'wN', target: 'wF', class: 'dashed-gold', marker: 'url(#topo-arrow-gold)' },
    { source: 'wO', target: 'wT', class: 'mystery-violet', marker: 'url(#topo-bar-violet)' },
    { source: 'wO', target: 'wN', class: 'mystery-violet', marker: 'url(#topo-bar-violet)' }
  ];

  // Draw Edges
  svg.selectAll('.micro-edge')
    .data(links)
    .enter()
    .append('path')
    .attr('class', d => `micro-edge ${d.class}`)
    .attr('d', d => {
      const s = nodes.find(n => n.id === d.source);
      const t = nodes.find(n => n.id === d.target);
      return `M${s.x},${s.y} L${t.x},${t.y}`;
    })
    .attr('marker-end', d => d.marker);

  // Draw Nodes
  const nodeElems = svg.selectAll('.micro-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'micro-node')
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => {
      nodeElems.classed('active', false);
      d3.select(event.currentTarget).classed('active', true);

      const descPanel = document.getElementById('micro-graph-topology-desc');
      if (descPanel) {
        descPanel.innerHTML = `<p>${t(d.key)}</p>`;
      }
    });

  nodeElems.append('circle')
    .attr('r', 16);

  const textNode = nodeElems.append('text');
  textNode.append('tspan').text(d => d.base);
  textNode.append('tspan')
    .attr('dy', '4')
    .attr('font-size', '8px')
    .text(d => d.sub);

  // Initial prompt
  const descPanel = document.getElementById('micro-graph-topology-desc');
  if (descPanel) {
    descPanel.innerHTML = `<p class="click-prompt">${t('micro.topologyPrompt')}</p>`;
  }
}

/**
 * Section § 05d: Temporal Dynamics (Pulsating Shifting Boundaries) Micro-Graph
 */
let _temporalInterval = null;
function _initTemporalGraph() {
  const container = document.getElementById('micro-graph-temporal');
  if (!container) return;

  container.innerHTML = '';
  if (_temporalInterval) {
    _temporalInterval.stop();
  }

  const width = 360;
  const height = 240;

  const svg = d3.select('#micro-graph-temporal')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const nodes = [
    { id: 'wF', base: 'w', sub: 'F', x: 110, y: 120, label: 'Frontera Cognitiva', color: 'var(--gold)' },
    { id: 'secreto_estado', base: 'S', sub: 'E', x: 250, y: 120, label: 'Secreto de Estado', color: 'var(--blue-light)' }
  ];

  // Draw central connecting flow
  svg.append('path')
    .attr('class', 'micro-edge dashed-gold')
    .attr('d', `M${nodes[0].x},${nodes[0].y} L${nodes[1].x},${nodes[1].y}`)
    .style('stroke', 'var(--text-dimmer)')
    .style('stroke-width', '1.5px');

  // Draw Nodes
  const nodeElems = svg.selectAll('.micro-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'micro-node active')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  const circles = nodeElems.append('circle')
    .attr('r', 16)
    .style('stroke', d => d.color);

  const textNode = nodeElems.append('text');
  textNode.append('tspan').text(d => d.base);
  textNode.append('tspan')
    .attr('dy', '4')
    .attr('font-size', '8px')
    .text(d => d.sub);

  // Breathing animation
  function breathe() {
    circles.transition()
      .duration(1800)
      .ease(d3.easeSinInOut)
      .attr('r', 21)
      .transition()
      .duration(1800)
      .ease(d3.easeSinInOut)
      .attr('r', 15)
      .on('end', breathe);
  }
  breathe();

  // Ripple propagation
  function triggerRipple(x, y, color) {
    svg.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 18)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.8)
      .lower() // Send ripples behind the solid node circles
      .transition()
      .duration(3200)
      .ease(d3.easeQuadOut)
      .attr('r', 90)
      .attr('opacity', 0)
      .remove();
  }

  // Set interval for ripples
  _temporalInterval = d3.interval(() => {
    triggerRipple(nodes[0].x, nodes[0].y, nodes[0].color);
    triggerRipple(nodes[1].x, nodes[1].y, nodes[1].color);
  }, 1600);

  // Initial Prompt / Text
  const descPanel = document.getElementById('micro-graph-temporal-desc');
  if (descPanel) {
    descPanel.innerHTML = `<p>${t('micro.temporalPrompt')}</p>`;
  }
}

