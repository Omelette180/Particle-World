/**
 * PARTICLE WORLD v2.0 — elements/special.js
 * Clone, portal, gravity zone, time crystal, source, drain, shield, etc.
 */

// ── CLONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'clone', name: 'Clone', category: 'special',
  color: '#884488', density: 999, state: 'special',
  desc: 'Copies whatever touches it and outputs infinite amounts.',
  tags: ['special', 'utility', 'infinite'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const stored = cell.flags; // stored element type id

    // Learn from a neighbor
    if (!stored) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const ntype = grid.getType(nx, ny);
        if (ntype && ntype !== 'empty' && ntype !== 'clone' && ntype !== 'wall') {
          cell.flags = ntype; // store type string
          break;
        }
      }
      return;
    }

    // Emit stored element
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      if (grid.isEmpty(nx, ny) && h.chance(0.1)) {
        grid.setCell(nx, ny, stored);
        break;
      }
    }
  },
});

// ── PORTAL A & B ──────────────────────────────────────────────────
// Portals teleport particles between A and B
let _portalBPos = null;
let _portalAPos = null;

ElementRegistry.register({
  id: 'portal_a', name: 'Portal A', category: 'special',
  color: '#2244ff', density: 999, state: 'special',
  desc: 'Teleports particles to Portal B.',
  tags: ['special', 'teleport'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    _portalAPos = [x, y];
    if (!_portalBPos) return;
    const [bx, by] = _portalBPos;

    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || ntype === 'empty' || ntype === 'portal_a' || ntype === 'portal_b') continue;
      if (h.chance(0.2)) {
        const tx = bx + (nx - x);
        const ty = by + (ny - y);
        if (grid.inBounds(tx, ty) && grid.isEmpty(tx, ty)) {
          const saved = grid.getCell(nx, ny);
          grid.clearCell(nx, ny);
          grid.setCell(tx, ty, saved.type, saved);
        }
        break;
      }
    }
  },
});

ElementRegistry.register({
  id: 'portal_b', name: 'Portal B', category: 'special',
  color: '#ff4422', density: 999, state: 'special',
  desc: 'Receives particles from Portal A.',
  tags: ['special', 'teleport'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) { _portalBPos = [x, y]; },
});

// ── GRAVITY ZONE ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gravity_zone', name: 'Gravity Zone', category: 'special',
  color: '#222244', density: 999, state: 'special',
  desc: 'Reverses gravity for particles inside it.',
  tags: ['special', 'gravity', 'exotic'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        const ntype = grid.getType(nx, ny);
        if (!ntype || ntype === 'empty' || ntype === 'gravity_zone' || ntype === 'wall') continue;
        const ndef = ElementRegistry.get(ntype);
        // Push upward
        if (ndef?.state !== 'solid' && grid.isEmpty(nx, ny - 1) && h.chance(0.05)) {
          grid.swapCells(nx, ny, nx, ny - 1);
        }
      }
    }
  },
});

// ── TIME CRYSTAL ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'time_crystal', name: 'Time Crystal', category: 'special',
  color: (cell, x, y, frame) => {
    const cols = ['#aaffff','#88ddff','#ccffee','#aaeeff','#88ffdd'];
    return cols[(frame + x * 5 + y * 3) % cols.length];
  },
  density: 2.5, state: 'solid',
  desc: 'Freezes time for nearby particles.',
  tags: ['special', 'time', 'exotic', 'rare'],
  heatConductivity: 0.0,

  tick(x, y, grid, h, frame) {
    // Mark neighbors as updated so they skip their tick
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (!dx && !dy) continue;
        grid.markUpdated(x+dx, y+dy);
      }
    }
  },
});

// ── SOURCE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'source', name: 'Source', category: 'special',
  color: '#004444', density: 999, state: 'special',
  desc: 'Infinitely produces water.',
  tags: ['special', 'utility', 'infinite'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    if (h.chance(0.2)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        if (grid.isEmpty(nx, ny)) { grid.setCell(nx, ny, 'water'); break; }
      }
    }
  },
});

// ── DRAIN ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'drain', name: 'Drain', category: 'special',
  color: '#111111', density: 999, state: 'special',
  desc: 'Absorbs and deletes anything that falls in.',
  tags: ['special', 'utility', 'delete'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (ntype && ntype !== 'empty' && ntype !== 'drain' && ntype !== 'wall') {
        if (h.chance(0.4)) grid.clearCell(nx, ny);
      }
    }
  },
});

// ── BEACON ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'beacon', name: 'Beacon', category: 'special',
  color: (cell, x, y, frame) => {
    const cols = ['#ffff00','#ffee00','#ffcc00','#ffdd00'];
    return cols[frame % cols.length];
  },
  density: 999, state: 'special',
  desc: 'Glows. Attracts creatures.',
  tags: ['special', 'light', 'utility'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    // Light up area (visual only — heat effect)
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (dx*dx+dy*dy > 25) continue;
        h.addHeat(x+dx, y+dy, 0.5);
      }
    }
  },
});

// ── FORCE FIELD ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'force_field', name: 'Force Field', category: 'special',
  color: '#4444ff', density: 999, state: 'special',
  desc: 'Invisible barrier. Repels everything.',
  tags: ['special', 'barrier', 'energy'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || ntype === 'empty' || ntype === 'force_field' || ntype === 'wall') continue;
      // Push away
      const dx = nx - x, dy2 = ny - y;
      const px = nx + dx, py = ny + dy2;
      if (grid.inBounds(px, py) && grid.isEmpty(px, py)) {
        grid.swapCells(nx, ny, px, py);
      }
    }
  },
});

// ── MUTANT ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mutant', name: 'Mutant', category: 'special',
  color: (cell, x, y, frame) => {
    const cols = ['#44ff22','#22ee44','#88ff44','#33cc22'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 1.0, state: 'solid',
  desc: 'Radiation-altered creature. Spreads mutation.',
  tags: ['creature', 'mutant', 'dangerous'],
  burnAt: 300,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.3)) return;

    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (grid.isEmpty(x+dir, y)) grid.swapCells(x, y, x+dir, y);
    else cell.dir = -dir;

    // Mutate neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (ntype === 'person' || ntype === 'zombie' || ntype === 'ant') {
        if (h.chance(0.02)) grid.setCell(nx, ny, 'mutant');
      }
    }
    // Emit radiation
    if (h.chance(0.01) && grid.isEmpty(x, y-1)) grid.setCell(x, y-1, 'radiation');
  },
});

// ── WASTE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'waste', name: 'Waste', category: 'special',
  color: '#665500', density: 1.3, state: 'liquid',
  desc: 'Toxic sludge. Slowly spreads and pollutes.',
  tags: ['liquid', 'toxic', 'pollution'],
  heatConductivity: 0.05,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    if (!h.chance(0.2)) return;
    h.flowSideways(x, y, 2);

    // Slowly pollute neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if ((ntype === 'water' || ntype === 'dirt') && h.chance(0.001)) {
        grid.setCell(nx, ny, 'waste');
      }
    }
  },
});

// ── GLITTER ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'glitter', name: 'Glitter', category: 'special',
  color: (cell, x, y, frame) => {
    const cols = ['#ffff88','#ffaaff','#88ffff','#ffcc44','#ff88ff','#88ffaa'];
    return cols[(frame * 3 + x * 7 + y * 11) % cols.length];
  },
  density: 1.5, state: 'solid',
  desc: 'Sparkles in every color.',
  tags: ['powder', 'decorative', 'shiny'],
  heatConductivity: 0.05,

  tick(x, y, grid, h) { h.fallBelow(x, y); },
});

// ── SLIME ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'slime', name: 'Slime', category: 'special',
  color: '#44cc22', density: 1.2, state: 'liquid',
  desc: 'Bounces. Very viscous. Slow.',
  tags: ['liquid', 'sticky', 'bouncy'],
  heatConductivity: 0.04,

  tick(x, y, grid, h) {
    if (!h.chance(0.1)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);
  },
});

window.PW_setLoadProgress?.(88, 'Special elements loaded...');
