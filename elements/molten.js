/**
 * PARTICLE WORLD v2.0 — elements/molten.js
 * Molten glass, molten iron, molten gold, ash, obsidian byproducts, etc.
 */

// ── MOLTEN GLASS ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'molten_glass', name: 'Molten Glass', category: 'molten',
  color: (cell, x, y, frame) => {
    const cols = ['#ffcc44','#ffaa22','#ffdd66','#ff9900'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 2.0, state: 'liquid',
  desc: 'Liquid glass. Cools into glass.',
  tags: ['liquid', 'molten', 'hot'],
  heat: 900, heatConductivity: 0.2,
  freezeAt: 600, freezesInto: 'glass',

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 20);
  },
});

// ── MOLTEN IRON ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'molten_iron', name: 'Molten Iron', category: 'molten',
  color: (cell, x, y, frame) => {
    const cols = ['#ff6600','#ff8800','#ff4400','#ff7700'];
    return cols[(frame + x * 2 + y) % cols.length];
  },
  density: 3.5, state: 'liquid',
  desc: 'Liquid metal. Cools into steel.',
  tags: ['liquid', 'molten', 'metal', 'hot'],
  heat: 1500, heatConductivity: 0.5,
  freezeAt: 1000, freezesInto: 'metal',

  tick(x, y, grid, h) {
    if (!h.chance(0.4)) return;
    if (h.fallBelow(x, y)) return;
    h.densitySwap(x, y);
    h.flowSideways(x, y, 2);
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 40);
  },
});

// ── MOLTEN GOLD ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'molten_gold', name: 'Molten Gold', category: 'molten',
  color: (cell, x, y, frame) => {
    const cols = ['#ffdd00','#ffcc00','#ffee22','#ffbb00'];
    return cols[(frame + x + y * 2) % cols.length];
  },
  density: 4.5, state: 'liquid',
  desc: 'Liquid gold. Extremely dense and beautiful.',
  tags: ['liquid', 'molten', 'precious', 'hot'],
  heat: 1100, heatConductivity: 0.45,
  freezeAt: 800, freezesInto: 'gold_elem',

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    if (h.fallBelow(x, y)) return;
    h.densitySwap(x, y);
    h.flowSideways(x, y, 1);
  },
});

// ── ASH ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ash2', name: 'Ash', category: 'molten',
  color: '#888880', density: 0.3, state: 'solid',
  desc: 'Remains after burning. Very light.',
  tags: ['powder', 'combustion', 'light'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    if (!h.chance(0.4)) return;
    if (h.fallBelow(x, y)) return;
    // Ash drifts in wind
    if (h.chance(0.05)) {
      const dx = h.chance(0.5) ? 1 : -1;
      if (grid.isEmpty(x + dx, y)) grid.swapCells(x, y, x + dx, y);
    }
  },
});

// ── GOLD ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gold_elem', name: 'Gold', category: 'molten',
  color: '#ffcc00', density: 4.5, state: 'solid',
  desc: 'Precious metal. Conducts electricity well.',
  tags: ['solid', 'precious', 'metal', 'conductive'],
  meltAt: 1064, meltsInto: 'molten_gold',
  heatConductivity: 0.35,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── PHILOSOPHER'S STONE ───────────────────────────────────────────
ElementRegistry.register({
  id: 'philosophers_stone', name: "Philosopher's Stone", category: 'molten',
  color: (cell, x, y, frame) => {
    const cols = ['#ffaa00','#ff8800','#ffcc22','#ff9900','#ffbb44'];
    return cols[(frame * 2 + x + y) % cols.length];
  },
  density: 3.0, state: 'solid',
  desc: 'Turns nearby elements into gold.',
  tags: ['special', 'alchemical', 'rare'],
  flavor: 'The dream of alchemists.',
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    if (h.chance(0.01)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        const ntype = grid.getType(nx, ny);
        const ndef  = ElementRegistry.get(ntype);
        if (ndef?.state === 'solid' && ntype !== 'gold_elem' && ntype !== 'wall' && ntype !== 'philosophers_stone') {
          grid.setCell(nx, ny, 'gold_elem');
          return;
        }
      }
    }
  },
});

// ── STARDUST ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'stardust', name: 'Stardust', category: 'molten',
  color: (cell, x, y, frame) => {
    const cols = ['#ffeeaa','#ffffcc','#aaaaff','#ffccff','#ccffff'];
    return cols[(frame * 2 + x * 3 + y * 5) % cols.length];
  },
  density: 0.1, state: 'solid',
  desc: 'Cosmic material. Glows and drifts.',
  tags: ['space', 'powder', 'glowing'],
  heatConductivity: 0.05,

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    // Gentle drift
    const dx = h.randInt(-1, 1);
    const dy2 = h.randInt(-1, 1);
    if (grid.isEmpty(x+dx, y+dy2)) grid.swapCells(x, y, x+dx, y+dy2);
  },
});

// ── RESIN ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'resin', name: 'Resin', category: 'molten',
  color: '#aa7722', density: 1.1, state: 'liquid',
  desc: 'Hardens over time into a solid.',
  tags: ['liquid', 'organic', 'hardens'],
  burnAt: 200, heatConductivity: 0.04,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100) - 0.05;
    if (cell.energy <= 0) {
      // Hardened into obsidian-like solid
      grid.setCell(x, y, 'obsidian');
      return;
    }
    if (!h.chance(0.1)) return;
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);
  },
});

// ── POLYMER ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'polymer', name: 'Polymer', category: 'molten',
  color: '#ddccaa', density: 1.0, state: 'solid',
  desc: 'Synthetic plastic material.',
  tags: ['solid', 'synthetic', 'plastic'],
  burnAt: 250, heatConductivity: 0.02,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── MAGMA ROCK ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'magma_rock', name: 'Magma Rock', category: 'molten',
  color: '#882200', density: 2.8, state: 'solid',
  desc: 'Cooled magma with still-hot interior.',
  tags: ['solid', 'volcanic', 'hot'],
  heat: 500, heatConductivity: 0.15,
  meltAt: 900, meltsInto: 'magma',

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
    // Radiate heat slowly
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 5);
  },
});

window.PW_setLoadProgress?.(92, 'Molten elements loaded...');
