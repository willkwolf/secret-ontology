/**
 * layers.js — LayerSystem module
 * Manages the five-layer architecture for the epistemic graph.
 * Emits 'layerchange' custom events on document when layers are toggled.
 */

const LAYER_NAMES = ['topology', 'epistemic', 'temporal', 'metalogic', 'narrative'];

class LayerSystem {
  constructor() {
    // All layers active by default to preserve existing behavior
    this._state = new Map(LAYER_NAMES.map(name => [name, true]));
    // Track original node/edge data counts for preservation invariant
    this._originalNodeCount = 0;
    this._originalEdgeCount = 0;
  }

  /**
   * Set the visibility of a named layer.
   * If all layers would be deactivated, re-activates 'narrative' as fallback.
   * @param {string} name - Layer name
   * @param {boolean} visible - Whether the layer should be visible
   */
  setLayer(name, visible) {
    if (!LAYER_NAMES.includes(name)) return;
    this._state.set(name, visible);

    // Enforce always-visible invariant: narrative is fallback
    const anyActive = [...this._state.values()].some(v => v);
    if (!anyActive) {
      this._state.set('narrative', true);
    }

    const activeLayers = this.getActiveLayers();
    document.dispatchEvent(new CustomEvent('layerchange', {
      detail: { name, visible, activeLayers }
    }));
  }

  /**
   * Get array of currently active layer names.
   * @returns {string[]}
   */
  getActiveLayers() {
    return LAYER_NAMES.filter(name => this._state.get(name));
  }

  /**
   * Check if a node should be visible given current active layers.
   * Nodes with no 'layers' field are always visible (backward compatibility).
   * @param {object} node - Node data object
   * @returns {boolean}
   */
  isNodeVisible(node) {
    if (!node.layers || node.layers.length === 0) return true;
    const active = this.getActiveLayers();
    return node.layers.some(l => active.includes(l));
  }

  /**
   * Check if an edge should be visible given current active layers.
   * Edges with no 'layers' field are always visible (backward compatibility).
   * @param {object} edge - Edge data object
   * @returns {boolean}
   */
  isEdgeVisible(edge) {
    if (!edge.layers || edge.layers.length === 0) return true;
    const active = this.getActiveLayers();
    return edge.layers.some(l => active.includes(l));
  }

  /**
   * Store original data counts for preservation invariant testing.
   * Called by graph.js after loading data.
   * @param {number} nodeCount
   * @param {number} edgeCount
   */
  setOriginalCounts(nodeCount, edgeCount) {
    this._originalNodeCount = nodeCount;
    this._originalEdgeCount = edgeCount;
  }

  get originalNodeCount() { return this._originalNodeCount; }
  get originalEdgeCount() { return this._originalEdgeCount; }
}

// Export singleton instance
const layerSystem = new LayerSystem();
export default layerSystem;
export { LAYER_NAMES };
