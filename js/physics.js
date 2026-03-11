/**
 * PARTICLE WORLD v2.0 — js/physics.js
 * Extra physics helpers loaded after core.js
 * These augment the Helpers object defined in core.js
 */

// ── HEAT MAP RENDERER ─────────────────────────────────────────────
// Called every 10 frames when heat mode is on
function renderHeatMap() {
  const canvas = document.getElementById('hmc');
  if (!canvas || canvas.style.opacity === '0') return;
  const ctx  = canvas.getContext('2d');
  const cols = PW.Grid.cols;
  const rows = PW.Grid.rows;
  const cs   = Math.floor(canvas.width / cols);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = PW.Grid.getCell(x, y);
      if (!cell || !cell.heat) continue;
      const heat = cell.heat;
      const t = Math.min(1, Math.max(0, heat / 1000));
      // Cold = blue, hot = red
      const r = Math.floor(t * 255);
      const b = Math.floor((1 - t) * 180);
      ctx.fillStyle = `rgba(${r},0,${b},0.5)`;
      ctx.fillRect(x * cs, y * cs, cs, cs);
    }
  }
}

// Run heat map render periodically
setInterval(() => {
  if (window.PW) renderHeatMap();
}, 100);

// ── GRID OVERLAY ──────────────────────────────────────────────────
// Draws grid lines on the VFX canvas when _showGrid is true
const _bhCanvas = document.getElementById('bhc');
const _bhCtx    = _bhCanvas?.getContext('2d');

function renderGridOverlay() {
  if (!_bhCtx || !window._showGrid || !window.PW) return;
  const { cols, rows } = PW.Grid;
  const cw = _bhCanvas.width, ch = _bhCanvas.height;
  const cs = cw / cols;

  _bhCtx.clearRect(0, 0, cw, ch);
  _bhCtx.strokeStyle = 'rgba(255,255,255,0.04)';
  _bhCtx.lineWidth   = 0.5;
  _bhCtx.beginPath();
  for (let x = 0; x <= cols; x++) {
    _bhCtx.moveTo(x * cs, 0);
    _bhCtx.lineTo(x * cs, ch);
  }
  for (let y = 0; y <= rows; y++) {
    _bhCtx.moveTo(0, y * cs);
    _bhCtx.lineTo(cw, y * cs);
  }
  _bhCtx.stroke();
}

setInterval(() => {
  if (window._showGrid) renderGridOverlay();
  else if (_bhCtx) _bhCtx.clearRect(0, 0, _bhCanvas?.width, _bhCanvas?.height);
}, 200);

// ── EXTRA HELPERS ─────────────────────────────────────────────────
// These get merged into PW.Helpers once PW is ready
const _extraHelpers = {

  // Scatter particles in a radius
  scatter(x, y, type, count, radius) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * radius;
      const nx    = Math.round(x + Math.cos(angle) * dist);
      const ny    = Math.round(y + Math.sin(angle) * dist);
      if (PW.Grid.inBounds(nx, ny) && PW.Grid.isEmpty(nx, ny)) {
        PW.Grid.setCell(nx, ny, type);
      }
    }
  },

  // Liquid displacement — push liquid sideways when falling into it
  liquidDisplace(x, y) {
    const below = PW.Grid.getType(x, y + 1);
    const belowDef = PW.ElementRegistry.get(below);
    if (!belowDef || belowDef.state !== 'liquid') return false;
    // Swap
    PW.Grid.swapCells(x, y, x, y + 1);
    return true;
  },

  // Check if any neighbor is of a given type
  hasNeighbor(x, y, type, range = 1) {
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (!dx && !dy) continue;
        if (PW.Grid.getType(x+dx, y+dy) === type) return true;
      }
    }
    return false;
  },

  // Average heat of 4 neighbors
  avgHeat(x, y) {
    let total = 0, count = 0;
    for (const [nx, ny] of [[x,y-1],[x+1,y],[x,y+1],[x-1,y]]) {
      const c = PW.Grid.getCell(nx, ny);
      if (c) { total += c.heat ?? 0; count++; }
    }
    return count ? total / count : 0;
  },
};

// Merge into PW.Helpers once ready
const _mergeWait = setInterval(() => {
  if (!window.PW?.Helpers) return;
  clearInterval(_mergeWait);
  Object.assign(PW.Helpers, _extraHelpers);
}, 50);
