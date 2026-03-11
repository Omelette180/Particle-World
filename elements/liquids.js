/**
 * PARTICLE WORLD v2.0 — elements/liquids.js
 * Water variants, oil, acid, honey, mercury, blood, poison, etc.
 */

// ── OIL ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'oil', name: 'Oil', category: 'liquids',
  color: '#1e1006', density: 0.8, state: 'liquid',
  desc: 'Flammable liquid that floats on water.',
  tags: ['liquid', 'flammable', 'organic'],
  flavor: 'Black gold.',
  burnAt: 180, heatConductivity: 0.05,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    if (h.densitySwap(x, y)) return;
    h.flowSideways(x, y, 4);
    if (h.getHeat(x, y) >= 180 && h.chance(0.02)) {
      grid.setCell(x, y, 'fire', { energy: 80 });
    }
  },
});

// ── ACID ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'acid', name: 'Acid', category: 'liquids',
  color: (cell, x, y, frame) => {
    const cols = ['#77ff00','#99ff22','#55ee00','#aaff44','#66dd00'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 1.2, state: 'liquid',
  desc: 'Dissolves most materials on contact.',
  tags: ['liquid', 'corrosive', 'chemical'],
  flavor: 'Do not touch.',
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 3);

    // Corrode neighbors
    const IMMUNE = new Set(['wall', 'glass', 'acid', 'empty', 'rubber']);
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || IMMUNE.has(ntype)) continue;
      if (h.chance(0.02)) {
        grid.clearCell(nx, ny);
        if (h.chance(0.4)) grid.clearCell(x, y); // acid is consumed
        return;
      }
    }
  },
});

// ── HONEY ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'honey', name: 'Honey', category: 'liquids',
  color: '#ffaa00', density: 1.4, state: 'liquid',
  desc: 'Very thick liquid. Flows extremely slowly.',
  tags: ['liquid', 'viscous', 'food'],
  flavor: 'Sweet and sticky.',
  heatConductivity: 0.04,

  tick(x, y, grid, h) {
    if (!h.chance(0.15)) return; // very slow
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);
  },
});

// ── MERCURY ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mercury', name: 'Mercury', category: 'liquids',
  color: '#9ab0c8', density: 4.0, state: 'liquid',
  desc: 'Extremely dense liquid metal. Very fast flow.',
  tags: ['liquid', 'metal', 'heavy', 'toxic'],
  flavor: 'Liquid metal. Toxic.',
  heatConductivity: 0.4,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    if (h.densitySwap(x, y)) return;
    h.flowSideways(x, y, 6);
  },
});

// ── BLOOD ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'blood', name: 'Blood', category: 'liquids',
  color: '#880010', density: 1.05, state: 'liquid',
  desc: 'Biological fluid. Dries over time.',
  tags: ['liquid', 'organic', 'biological'],
  flavor: 'Life itself.',
  heatConductivity: 0.12,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 2);
    // Dry out slowly
    cell.energy = (cell.energy ?? 200) - 0.1;
    if (cell.energy <= 0 && h.chance(0.005)) {
      grid.setCell(x, y, 'dirt'); // dried blood becomes dark residue
    }
  },
});

// ── SALTWATER ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'saltwater', name: 'Salt Water', category: 'liquids',
  color: '#1a77aa', density: 1.03, state: 'liquid',
  desc: 'Water with dissolved salt. Slightly denser.',
  tags: ['liquid', 'water', 'salty'],
  meltAt: 110, meltsInto: 'steam',
  freezeAt: -2, freezesInto: 'ice',
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.densitySwap(x, y);
    h.flowSideways(x, y, 4);
  },
});

// ── SEAWATER ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'seawater', name: 'Sea Water', category: 'liquids',
  color: '#0a4a7a', density: 1.025, state: 'liquid',
  desc: 'Ocean water. Supports aquatic life.',
  tags: ['liquid', 'water', 'ocean'],
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 5);
  },
});

// ── POISON ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'poison', name: 'Poison', category: 'liquids',
  color: '#8822bb', density: 1.1, state: 'liquid',
  desc: 'Toxic liquid that kills creatures on contact.',
  tags: ['liquid', 'toxic', 'chemical'],
  flavor: 'Do not drink.',
  heatConductivity: 0.08,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 3);
    // Kill creatures
    const CREATURES = new Set(['person','zombie','ant','fish','bird','worm','rat','snake','spider','bat','frog','wolf','bear']);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (CREATURES.has(grid.getType(nx, ny)) && h.chance(0.05)) {
        grid.setCell(nx, ny, 'blood');
      }
    }
  },
});

// ── MUD WATER ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mud_water', name: 'Muddy Water', category: 'liquids',
  color: '#3a2010', density: 1.15, state: 'liquid',
  desc: 'Murky water mixed with sediment.',
  tags: ['liquid', 'water', 'dirty'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    if (!h.chance(0.5)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 2);
    // Settle into mud + water
    if (h.chance(0.001)) grid.setCell(x, y, 'mud');
  },
});

// ── QUICKSAND ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'quicksand', name: 'Quicksand', category: 'liquids',
  color: '#c8a030', density: 1.6, state: 'liquid',
  desc: 'Behaves like liquid. Traps anything that enters.',
  tags: ['liquid', 'sand', 'trap'],
  flavor: 'The more you struggle, the deeper you sink.',
  heatConductivity: 0.05,

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    if (h.fallBelow(x, y)) return;
    h.densitySwap(x, y);
    h.flowSideways(x, y, 1);
  },
});

// ── TAR ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'tar', name: 'Tar', category: 'liquids',
  color: '#0a0806', density: 1.3, state: 'liquid',
  desc: 'Very thick, sticky black liquid. Burns slowly.',
  tags: ['liquid', 'viscous', 'flammable'],
  burnAt: 250, heatConductivity: 0.03,

  tick(x, y, grid, h) {
    if (!h.chance(0.08)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);
    if (h.getHeat(x, y) >= 250 && h.chance(0.01)) {
      grid.setCell(x, y, 'fire', { energy: 150 });
    }
  },
});

// ── ETHANOL ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ethanol', name: 'Ethanol', category: 'liquids',
  color: '#aaddff', density: 0.79, state: 'liquid',
  desc: 'Highly flammable alcohol. Floats on water.',
  tags: ['liquid', 'flammable', 'chemical'],
  burnAt: 80, heatConductivity: 0.08,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    if (h.densitySwap(x, y)) return;
    h.flowSideways(x, y, 5);
    if (h.getHeat(x, y) >= 80 && h.chance(0.04)) {
      grid.setCell(x, y, 'fire', { energy: 60 });
    }
  },
});

// ── LIQUID NITROGEN ───────────────────────────────────────────────
ElementRegistry.register({
  id: 'liquid_nitrogen', name: 'Liquid N₂', category: 'liquids',
  color: '#c8eeff', density: 0.8, state: 'liquid',
  desc: 'Extremely cold. Freezes everything on contact.',
  tags: ['liquid', 'cold', 'cryogenic'],
  flavor: '-196°C.',
  heat: -200, heatConductivity: 0.3,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 4);

    // Freeze neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, -30);
      const nc = grid.getCell(nx, ny);
      if (nc && nc.heat < 0) {
        const ndef = ElementRegistry.get(nc.type);
        if (ndef?.freezeAt !== undefined && nc.heat <= ndef.freezeAt && ndef.freezesInto) {
          grid.setCell(nx, ny, ndef.freezesInto);
        }
      }
      // Evaporate
      if (h.chance(0.02)) grid.setCell(x, y, 'nitrogen');
    }
  },
});

// ── NITRIC ACID ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nitric_acid', name: 'Nitric Acid', category: 'liquids',
  color: '#aaff44', density: 1.5, state: 'liquid',
  desc: 'Stronger than regular acid. Corrodes metals.',
  tags: ['liquid', 'corrosive', 'chemical'],
  heatConductivity: 0.12,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 3);
    const IMMUNE = new Set(['wall', 'nitric_acid', 'empty', 'glass']);
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || IMMUNE.has(ntype)) continue;
      if (h.chance(0.05)) {
        grid.clearCell(nx, ny);
        if (h.chance(0.3)) grid.clearCell(x, y);
        return;
      }
    }
  },
});

// ── SOAP ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'soap', name: 'Soap', category: 'liquids',
  color: '#eeddff', density: 0.9, state: 'liquid',
  desc: 'Produces bubbles when mixed with water.',
  tags: ['liquid', 'chemical', 'bubbly'],
  heatConductivity: 0.06,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 3);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'water' && h.chance(0.02)) {
        grid.setCell(nx, ny, 'bubble');
      }
    }
  },
});

// ── SUPERFLUID ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'superfluid', name: 'Superfluid', category: 'liquids',
  color: '#88ffee', density: 0.7, state: 'liquid',
  desc: 'Zero viscosity — flows instantly, climbs walls.',
  tags: ['liquid', 'exotic', 'quantum'],
  flavor: 'Defies gravity.',
  heatConductivity: 0.9,

  tick(x, y, grid, h) {
    // Flows instantly in all directions including upward
    const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]];
    h.shuffle(dirs);
    for (const [dx, dy] of dirs) {
      if (grid.isEmpty(x+dx, y+dy)) {
        grid.swapCells(x, y, x+dx, y+dy);
        return;
      }
    }
  },
});

// ── BRINE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'brine', name: 'Brine', category: 'liquids',
  color: '#5599aa', density: 1.2, state: 'liquid',
  desc: 'Heavily salted water. Very low freezing point.',
  tags: ['liquid', 'water', 'salty'],
  freezeAt: -20, freezesInto: 'ice',
  heatConductivity: 0.22,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 4);
  },
});

window.PW_setLoadProgress?.(20, 'Liquids loaded...');
