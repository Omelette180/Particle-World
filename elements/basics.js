/**
 * PARTICLE WORLD v2.0 — elements/basics.js
 * Core elements using upgraded Sandboxels-style physics behaviors.
 */

// ── SAND ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'sand', name: 'Sand', category: 'powders',
  color: '#c8a84b', density: 1.5, state: 'solid',
  desc: 'Granular sediment. Piles and slides.',
  meltAt: 1600, meltsInto: 'molten_glass',
  heatConductivity: 0.05,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── WET SAND ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wet_sand', name: 'Wet Sand', category: 'powders',
  color: '#8a7030', density: 1.7, state: 'solid',
  desc: 'Sand soaked with water. Sticks together more.',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    // Wet sand is sturdier — only falls straight down
    if (grid.isEmpty(x, y+1)) grid.swapCells(x, y, x, y+1);
  },
});

// ── WATER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'water', name: 'Water', category: 'liquids',
  color: '#1a6fa8', density: 1.0, state: 'liquid',
  desc: 'Flows and spreads. Freezes cold, boils hot.',
  meltAt: 100, meltsInto: 'steam',
  freezeAt: 0, freezesInto: 'ice',
  heatConductivity: 0.18,
  tick(x, y, grid, h) { h.LIQUID(x, y); },
});

// ── SALT WATER ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'saltwater', name: 'Salt Water', category: 'liquids',
  color: '#2277aa', density: 1.02, state: 'liquid',
  desc: 'Denser than fresh water. Slightly lower freeze point.',
  meltAt: 102, meltsInto: 'steam',
  freezeAt: -2, freezesInto: 'ice',
  heatConductivity: 0.17,
  tick(x, y, grid, h) { h.LIQUID(x, y); },
});

// ── STONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'stone', name: 'Stone', category: 'solids',
  color: '#6b6b6b', density: 3.0, state: 'solid',
  desc: 'Solid rock. Falls when unsupported.',
  meltAt: 1400, meltsInto: 'lava',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y+1)) grid.swapCells(x, y, x, y+1);
  },
});

// ── DIRT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'dirt', name: 'Dirt', category: 'powders',
  color: '#6b4226', density: 1.3, state: 'solid',
  desc: 'Loose earth. Turns to mud when wet.',
  heatConductivity: 0.05,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── MUD ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mud', name: 'Mud', category: 'powders',
  color: '#3b2010', density: 1.6, state: 'solid',
  desc: 'Wet dirt. Sticky and slow.',
  meltAt: 100, meltsInto: 'water',
  heatConductivity: 0.09,
  tick(x, y, grid, h) {
    // Mud is sturdier — falls but doesn't spread diagonally as easily
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (h.chance(0.3)) {
      const d = h.rnd() < 0.5 ? 1 : -1;
      if (grid.isEmpty(x+d, y+1)) grid.swapCells(x, y, x+d, y+1);
    }
  },
});

// ── GRAVEL ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gravel', name: 'Gravel', category: 'powders',
  color: '#777060', density: 2.0, state: 'solid',
  desc: 'Heavy rock fragments.',
  meltAt: 1100, meltsInto: 'lava',
  heatConductivity: 0.06,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── SALT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'salt', name: 'Salt', category: 'powders',
  color: '#e8e8e8', density: 1.2, state: 'solid',
  desc: 'Dissolves in water to make salt water.',
  heatConductivity: 0.05,
  tick(x, y, grid, h) {
    // Check for water neighbors → dissolve into saltwater
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'water' || t === 'saltwater') && h.chance(0.05)) {
        grid.setCell(x, y, 'saltwater');
        grid.clearCell(nx, ny);
        return;
      }
    }
    h.POWDER(x, y);
  },
});

// ── WALL ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wall', name: 'Wall', category: 'solids',
  color: '#555555', density: 99, state: 'solid',
  desc: 'Immovable solid. Cannot be destroyed.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) { /* static */ },
});

// ── CONCRETE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'concrete', name: 'Concrete', category: 'solids',
  color: '#aaaaaa', density: 5.0, state: 'solid',
  desc: 'Heavy solid. Resists most forces.',
  heatConductivity: 0.04,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y+1)) grid.swapCells(x, y, x, y+1);
  },
});

// ── GLASS ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'glass', name: 'Glass', category: 'solids',
  color: '#88ccdd', density: 2.5, state: 'solid',
  desc: 'Brittle transparent solid.',
  meltAt: 1500, meltsInto: 'molten_glass',
  heatConductivity: 0.02,
  tick(x, y, grid, h) { /* static */ },
});

// ── MOLTEN GLASS ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'molten_glass', name: 'Molten Glass', category: 'liquids',
  color: '#ff8800', density: 2.2, state: 'liquid',
  desc: 'Super-heated glass that flows slowly.',
  freezeAt: 1400, freezesInto: 'glass',
  heatConductivity: 0.04,
  tick(x, y, grid, h) { h.MOLTEN(x, y); },
});

// ── WOOD ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wood', name: 'Wood', category: 'solids',
  color: '#8B4513', density: 0.6, state: 'solid',
  desc: 'Burns readily. Floats on water.',
  burnAt: 300, burnInto: ['fire', 'fire', 'charcoal'],
  burnTime: 200,
  heatConductivity: 0.04,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    h.doHeat(x, y);
  },
});

// ── CHARCOAL ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'charcoal', name: 'Charcoal', category: 'powders',
  color: '#2b2b2b', density: 0.8, state: 'solid',
  desc: 'Ash-black carbon. Burns long and hot.',
  burnAt: 400, burnInto: ['smoke', 'ash'], burnTime: 400,
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    h.POWDER(x, y);
  },
});

// ── ASH ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ash', name: 'Ash', category: 'powders',
  color: '#888888', density: 0.3, state: 'solid',
  desc: 'Light remains of burned material.',
  heatConductivity: 0.02,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── ICE ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ice', name: 'Ice', category: 'solids',
  color: '#a0d8ef', density: 0.9, state: 'solid',
  desc: 'Frozen water. Melts in heat.',
  meltAt: 0, meltsInto: 'water',
  heatConductivity: 0.2,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    // Check neighbors for fire/lava — speed up melting
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava') && h.chance(0.05)) {
        grid.setCell(x, y, 'water');
        return;
      }
    }
  },
});

// ── SNOW ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'snow', name: 'Snow', category: 'powders',
  color: '#e8f4f8', density: 0.15, state: 'solid',
  desc: 'Light frozen crystals. Falls slowly.',
  meltAt: 5, meltsInto: 'water',
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava') && h.chance(0.08)) {
        grid.setCell(x, y, 'water'); return;
      }
    }
    // Slow fall
    if (h.chance(0.7)) h.POWDER(x, y);
  },
});

// ── STEAM ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'steam', name: 'Steam', category: 'gases',
  color: '#c0d8e8', density: 0.001, state: 'gas',
  desc: 'Hot water vapor. Rises and dissipates.',
  freezeAt: 95, freezesInto: 'water',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 80) - h.rnd() * 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.GAS(x, y);
  },
});

// ── SMOKE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'smoke', name: 'Smoke', category: 'gases',
  color: '#3a4448', density: 0.001, state: 'gas',
  desc: 'Rises and slowly disperses.',
  heatConductivity: 0.005,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 50) - h.rnd() * 0.4;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Vary color for billowy effect
    const shades = ['#3a4448','#444e52','#2e383e','#4e585e'];
    cell.color = shades[0 | (h.rnd() * shades.length)];
    h.GAS(x, y);
  },
});

// ── OIL ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'oil', name: 'Oil', category: 'liquids',
  color: '#3a2a0a', density: 0.85, state: 'liquid',
  desc: 'Flammable liquid. Floats on water.',
  burnAt: 200, burnInto: ['fire', 'smoke'], burnTime: 250,
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    h.LIQUID(x, y, 0.9);
  },
});

// ── ACID ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'acid', name: 'Acid', category: 'liquids',
  color: '#7aff3a', density: 1.2, state: 'liquid',
  desc: 'Eats through most materials.',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    // Dissolve neighbors
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'acid' || t === 'wall' ||
          t === 'glass' || t === 'metal' || t === 'steel' || t === 'obsidian') continue;
      if (h.chance(0.01)) {
        grid.clearCell(nx, ny);
        if (h.chance(0.15)) grid.clearCell(x, y); // acid used up
        return;
      }
    }
    h.LIQUID(x, y);
  },
});

// ── SALT WATER ─ already done above ─ LAVA ────────────────────────
ElementRegistry.register({
  id: 'lava', name: 'Lava', category: 'liquids',
  color: '#ff4400', density: 2.8, state: 'liquid',
  desc: 'Molten rock. Extremely hot. Burns everything.',
  freezeAt: 700, freezesInto: 'stone',
  heatConductivity: 0.12,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    // Color flicker
    const cell = grid.getCell(x, y);
    if (cell) {
      const shades = ['#ff4400','#ff5500','#ff3300','#ff6600','#ee3300'];
      cell.color = shades[0 | (h.rnd() * shades.length)];
    }
    h.MOLTEN(x, y);
  },
});

// ── OBSIDIAN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'obsidian', name: 'Obsidian', category: 'solids',
  color: '#1a0a1a', density: 3.0, state: 'solid',
  desc: 'Volcanic glass. Very hard.',
  heatConductivity: 0.03,
  tick(x, y, grid, h) { /* static */ },
});
