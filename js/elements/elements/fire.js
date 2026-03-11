/**
 * PARTICLE WORLD v2.0 — elements/fire.js
 * Fire, lava, ember, charcoal, plasma, greek fire, wildfire, magma
 */

const FIRE_COLORS = ['#ff6020','#ff8030','#ffa010','#ffcc00','#ff3800','#ff7000','#ffb400','#ff5010'];
const LAVA_COLORS = ['#ff5500','#ff7700','#ff3300','#ff8800','#ff6600','#ff4400','#ff9900'];

// ── FIRE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fire', name: 'Fire', category: 'fire',
  color: (cell, x, y, frame) => FIRE_COLORS[(frame + x + y) % FIRE_COLORS.length],
  density: 0.1, state: 'energy',
  desc: 'Burns and spreads. Consumes fuel, produces smoke.',
  tags: ['fire', 'hot', 'energy'],
  flavor: 'Dangerous in the wrong hands.',
  heat: 600, heatConductivity: 0.3,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 1;

    // Die out
    if (cell.energy <= 0) {
      grid.setCell(x, y, h.chance(0.4) ? 'smoke' : 'empty');
      return;
    }

    // Rise upward
    h.riseUp(x, y);

    // Spread heat to neighbors & ignite flammables
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, 15);
      const ntype = grid.getType(nx, ny);
      const ndef  = ElementRegistry.get(ntype);
      if (!ndef) continue;
      if (ndef.burnAt && h.getHeat(nx, ny) >= ndef.burnAt && h.chance(0.05)) {
        grid.setCell(nx, ny, 'fire', { energy: 60 });
      }
    }

    // Spawn ember occasionally
    if (h.chance(0.02) && grid.isEmpty(x, y - 1)) {
      grid.setCell(x, y - 1, 'ember');
    }
    // Produce smoke
    if (h.chance(0.08) && grid.isEmpty(x, y - 1)) {
      grid.setCell(x, y - 1, 'smoke');
    }
  },
});

// ── LAVA ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'lava', name: 'Lava', category: 'fire',
  color: (cell, x, y, frame) => LAVA_COLORS[(frame + x * 2 + y) % LAVA_COLORS.length],
  density: 2.2, state: 'liquid',
  desc: 'Molten rock. Solidifies when cooled by water.',
  tags: ['liquid', 'hot', 'molten'],
  flavor: 'The earth bleeds orange.',
  heat: 1200, heatConductivity: 0.2,
  freezeAt: 200, freezesInto: 'obsidian',

  tick(x, y, grid, h, frame) {
    // Flow like a slow liquid
    if (!h.chance(0.4)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 2);

    // Ignite neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, 30);
      const ntype = grid.getType(nx, ny);
      if (ntype === 'water' || ntype === 'ice') {
        grid.setCell(nx, ny, 'steam');
        if (h.chance(0.3)) grid.setCell(x, y, 'obsidian');
        return;
      }
      const ndef = ElementRegistry.get(ntype);
      if (ndef?.burnAt && h.chance(0.02)) grid.setCell(nx, ny, 'fire', { energy: 80 });
    }
  },
});

// ── EMBER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ember', name: 'Ember', category: 'fire',
  color: (cell, x, y, frame) => {
    const cols = ['#ff8800','#ffaa00','#ff6600','#ffcc44','#ff4400'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 0.05, state: 'energy',
  desc: 'Hot spark that floats upward and can ignite things.',
  tags: ['fire', 'spark', 'hot'],
  heat: 400, heatConductivity: 0.1,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 30) - 1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Drift upward with slight wobble
    const dx = h.chance(0.5) ? (h.chance(0.5) ? 1 : -1) : 0;
    if (grid.isEmpty(x + dx, y - 1)) grid.swapCells(x, y, x + dx, y - 1);
    else if (grid.isEmpty(x, y - 1)) grid.swapCells(x, y, x, y - 1);

    // Ignite on contact
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ndef = ElementRegistry.get(grid.getType(nx, ny));
      if (ndef?.burnAt && h.getHeat(nx, ny) >= ndef.burnAt && h.chance(0.03)) {
        grid.setCell(nx, ny, 'fire', { energy: 60 });
      }
    }
  },
});

// ── CHARCOAL ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'charcoal', name: 'Charcoal', category: 'fire',
  color: '#222', density: 1.3, state: 'solid',
  desc: 'Slowly burning carbon. Burns longer than wood.',
  tags: ['solid', 'fuel', 'flammable'],
  flavor: 'The remains of wood, still useful.',
  burnAt: 280, heatConductivity: 0.14,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    const heat = h.getHeat(x, y);
    if (heat >= 280 && h.chance(0.008)) {
      grid.setCell(x, y, 'fire', { energy: 120 }); // burns long
    }
    if (heat > 200) {
      for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 3);
    }
  },
});

// ── MAGMA ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'magma', name: 'Magma', category: 'fire',
  color: (cell, x, y, frame) => {
    const cols = ['#cc3300','#ee4400','#bb2200','#dd3300','#ff5500'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 2.5, state: 'liquid',
  desc: 'Underground molten rock. Hotter than lava.',
  tags: ['liquid', 'hot', 'volcanic'],
  heat: 1500, heatConductivity: 0.25,
  freezeAt: 300, freezesInto: 'basalt',

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, 40);
      if (grid.getType(nx, ny) === 'water') {
        grid.setCell(nx, ny, 'steam');
      }
    }
  },
});

// ── PLASMA ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plasma', name: 'Plasma', category: 'fire',
  color: (cell, x, y, frame) => {
    const cols = ['#cc44ff','#aa22dd','#ee66ff','#dd00ff','#ff44cc'];
    return cols[(frame * 2 + x + y) % cols.length];
  },
  density: 0.05, state: 'energy',
  desc: 'Superheated ionized gas. Extremely hot.',
  tags: ['energy', 'electric', 'hot'],
  heat: 3000, heatConductivity: 0.5,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 40) - 1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.riseUp(x, y);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, 60);
      const ntype = grid.getType(nx, ny);
      if (ntype !== 'empty' && ntype !== 'plasma' && ntype !== 'wall' && h.chance(0.1)) {
        grid.setCell(nx, ny, 'fire', { energy: 40 });
      }
    }
  },
});

// ── GREEK FIRE ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'greek_fire', name: 'Greek Fire', category: 'fire',
  color: '#ff9900', density: 0.8, state: 'liquid',
  desc: 'Ancient incendiary — burns on water.',
  tags: ['liquid', 'fire', 'weapon'],
  burnAt: 50, heatConductivity: 0.2,

  tick(x, y, grid, h) {
    const heat = h.getHeat(x, y);
    if (heat >= 50 && h.chance(0.05)) {
      grid.setCell(x, y, 'fire', { energy: 100 });
      return;
    }
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 3);
    // Ignite water surface
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'water' && h.chance(0.02)) {
        grid.setCell(nx, ny, 'fire', { energy: 60 });
      }
    }
  },
});

// ── WILDFIRE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wildfire', name: 'Wildfire', category: 'fire',
  color: (cell, x, y, frame) => {
    const cols = ['#ff3300','#ff5500','#ff7700','#ff9900','#ffbb00'];
    return cols[(frame * 3 + x * 2 + y) % cols.length];
  },
  density: 0.08, state: 'energy',
  desc: 'Spreads aggressively to any flammable material.',
  tags: ['fire', 'spreads', 'dangerous'],
  heat: 800, heatConductivity: 0.4,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.riseUp(x, y);

    // Very aggressive spread
    for (const [nx, ny] of h.neighbors8(x, y)) {
      h.addHeat(nx, ny, 20);
      const ndef = ElementRegistry.get(grid.getType(nx, ny));
      if (ndef?.burnAt && h.chance(0.15)) {
        grid.setCell(nx, ny, 'wildfire', { energy: 80 });
      }
    }
  },
});

// ── MAGMA POOL ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'magma_pool', name: 'Magma Pool', category: 'fire',
  color: '#cc2200', density: 3.0, state: 'liquid',
  desc: 'A deep pool of magma. Nearly permanent.',
  tags: ['liquid', 'hot', 'volcanic'],
  heat: 2000, heatConductivity: 0.3,

  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, 50);
    }
    if (h.chance(0.001)) grid.setCell(x, y, 'lava');
  },
});

// ── WAX ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wax', name: 'Wax', category: 'fire',
  color: '#f5e6c8', density: 0.9, state: 'solid',
  desc: 'Melts slowly. Burns with a gentle flame.',
  tags: ['solid', 'flammable', 'meltable'],
  meltAt: 60, meltsInto: 'oil',
  burnAt: 200, heatConductivity: 0.04,

  tick(x, y, grid, h) {
    // Static until heated
  },
});

// ── TORCH ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'torch', name: 'Torch', category: 'fire',
  color: '#aa4400', density: 999, state: 'solid',
  desc: 'Permanently produces fire upward.',
  tags: ['solid', 'fire', 'permanent'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    if (h.chance(0.3) && grid.isEmpty(x, y - 1)) {
      grid.setCell(x, y - 1, 'fire', { energy: 20 });
    }
  },
});

window.PW_setLoadProgress?.(12, 'Fire elements loaded...');
