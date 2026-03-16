/**
 * PARTICLE WORLD v2.0 — elements/gases.js
 * All gas elements upgraded to use Physics.GAS with energy-based dissipation.
 */

// ── GAS (generic flammable) ───────────────────────────────────────
ElementRegistry.register({
  id: 'gas', name: 'Gas', category: 'gases',
  color: '#cccccc', density: 0.001, state: 'gas',
  desc: 'Flammable gas. Explodes when ignited.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    // Explode near fire
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava' || t === 'plasma') && h.chance(0.18)) {
        grid.clearCell(x, y);
        h.explode(x, y, 7, { strength: 0.8 });
        return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 100);
    h.GAS(x, y);
  },
});

// ── METHANE ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'methane', name: 'Methane', category: 'gases',
  color: '#bbbbcc', density: 0.001, state: 'gas',
  desc: 'Potent flammable gas. Bigger explosions than regular gas.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava') && h.chance(0.16)) {
        grid.clearCell(x, y);
        h.explode(x, y, 9, { strength: 1.1, fire: 'fire' });
        return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 120);
    h.GAS(x, y);
  },
});

// ── HYDROGEN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'hydrogen', name: 'Hydrogen', category: 'gases',
  color: '#aaaaff', density: 0.001, state: 'gas',
  desc: 'Lightest gas. Explosive when mixed with air near fire.',
  heatConductivity: 0.18,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'plasma') && h.chance(0.2)) {
        grid.clearCell(x, y);
        h.explode(x, y, 12, { strength: 1.3, fire: ['fire', 'plasma'] });
        return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 110);
    h.GAS(x, y);
  },
});

// ── PROPANE ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'propane', name: 'Propane', category: 'gases',
  color: '#dddddd', density: 0.001, state: 'gas',
  desc: 'Heavier flammable gas. Pools low before igniting.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    // Propane is heavier — sinks slightly
    if (grid.isEmpty(x, y+1) && h.chance(0.6)) { grid.swapCells(x, y, x, y+1); return; }
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava') && h.chance(0.12)) {
        grid.clearCell(x, y);
        h.explode(x, y, 8, { strength: 0.9 });
        return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 100);
    h.GAS(x, y);
  },
});

// ── OXYGEN ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'oxygen', name: 'Oxygen', category: 'gases',
  color: '#cceeFF', density: 0.001, state: 'gas',
  desc: 'Accelerates burning. Makes fire hotter.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    // Amplify nearby fire
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (t === 'fire' && h.chance(0.1)) {
        // Boost fire energy
        const fc = grid.getCell(nx, ny);
        if (fc) fc.energy = Math.min(200, (fc.energy ?? 60) + 20);
        grid.clearCell(x, y);
        return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 90);
    h.GAS(x, y);
  },
});

// ── NITROGEN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nitrogen', name: 'Nitrogen', category: 'gases',
  color: '#ccddee', density: 0.001, state: 'gas',
  desc: 'Inert gas. Smothers fire.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    // Smother nearby fire
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'fire' && h.chance(0.06)) {
        grid.setCell(nx, ny, 'smoke');
        const sc = grid.getCell(nx, ny);
        if (sc) sc.energy = 20;
        grid.clearCell(x, y);
        return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 90);
    h.GAS(x, y);
  },
});

// ── CO2 ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'co2', name: 'CO2', category: 'gases',
  color: '#2a2a2a', density: 0.002, state: 'gas',
  desc: 'Carbon dioxide. Heavier than air, smothers fire.',
  heatConductivity: 0.005,
  tick(x, y, grid, h) {
    // CO2 sinks slightly — displaces regular gas
    if (grid.isEmpty(x, y+1) && h.chance(0.4)) { grid.swapCells(x, y, x, y+1); return; }
    // Smother fire
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'fire' && h.chance(0.08)) {
        grid.setCell(nx, ny, 'smoke'); grid.clearCell(x, y); return;
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 70);
    h.GAS(x, y);
  },
});

// ── ACID GAS ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'acid_gas', name: 'Acid Gas', category: 'gases',
  color: '#88ff44', density: 0.001, state: 'gas',
  desc: 'Gaseous acid. Slowly eats through materials.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'acid_gas' || t === 'acid' || t === 'wall' || t === 'glass') continue;
      if (h.chance(0.005)) {
        grid.clearCell(nx, ny);
        if (h.chance(0.1)) { grid.clearCell(x, y); return; }
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 80);
    h.GAS(x, y);
  },
});

// ── POISON GAS ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'poison_gas', name: 'Poison Gas', category: 'gases',
  color: '#558855', density: 0.001, state: 'gas',
  desc: 'Toxic cloud. Kills living things.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    // Kill creatures/people in contact
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'person' || t === 'citizen' || t === 'zombie') && h.chance(0.02)) {
        grid.setCell(nx, ny, 'ash');
      }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 120);
    h.GAS(x, y);
  },
});

// ── CHLORINE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'chlorine', name: 'Chlorine', category: 'gases',
  color: '#aacc44', density: 0.001, state: 'gas',
  desc: 'Toxic yellow-green gas.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (t === 'water' && h.chance(0.02)) { grid.setCell(nx, ny, 'saltwater'); grid.clearCell(x, y); return; }
      if ((t === 'person' || t === 'fish' || t === 'plant') && h.chance(0.015)) { grid.clearCell(nx, ny); }
    }
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 100);
    h.GAS(x, y);
  },
});

// ── BUBBLE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bubble', name: 'Bubble', category: 'gases',
  color: '#aaccee', density: 0.001, state: 'gas',
  desc: 'A small pocket of air. Rises through liquid.',
  heatConductivity: 0.005,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 30) - h.rnd() * 1.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Rise through water
    if (grid.isEmpty(x, y-1) || grid.getType(x, y-1) === 'water') {
      grid.swapCells(x, y, x, y-1); return;
    }
    const d = h.rnd() < 0.5 ? 1 : -1;
    if (grid.isEmpty(x+d, y-1) || grid.getType(x+d, y-1) === 'water') {
      grid.swapCells(x, y, x+d, y-1);
    }
  },
});
