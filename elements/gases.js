/**
 * PARTICLE WORLD v2.0 — elements/gases.js
 * Smoke, steam, gas, CO2, hydrogen, oxygen, nitrogen, methane, etc.
 */

// ── SMOKE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'smoke', name: 'Smoke', category: 'gases',
  color: (cell, x, y, frame) => {
    const cols = ['#3a4448','#445055','#2e3840','#505a60','#343e44'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 0.05, state: 'gas',
  desc: 'Rises and dissipates. Produced by fire.',
  tags: ['gas', 'combustion', 'natural'],
  heatConductivity: 0.01,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.riseUp(x, y);
  },
});

// ── STEAM ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'steam', name: 'Steam', category: 'gases',
  color: '#b0d8f0', density: 0.02, state: 'gas',
  desc: 'Water vapor. Condenses back to water when cooled.',
  tags: ['gas', 'water', 'hot'],
  heat: 110, heatConductivity: 0.05,
  freezeAt: 80, freezesInto: 'water',

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.3;
    if (cell.energy <= 0) {
      grid.setCell(x, y, 'water');
      return;
    }
    h.riseUp(x, y);
  },
});

// ── GAS ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gas', name: 'Gas', category: 'gases',
  color: '#88cc88', density: 0.03, state: 'gas',
  desc: 'Flammable generic gas. Explodes near fire.',
  tags: ['gas', 'flammable', 'explosive'],
  burnAt: 200, heatConductivity: 0.02,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    if (h.getHeat(x, y) >= 200 && h.chance(0.08)) {
      h.explode(x, y, 4, 0.8);
      grid.setCell(x, y, 'fire', { energy: 30 });
    }
  },
});

// ── CO2 ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'co2', name: 'CO₂', category: 'gases',
  color: '#aabbaa', density: 0.07, state: 'gas',
  desc: 'Carbon dioxide. Heavier than most gases, smothers fire.',
  tags: ['gas', 'chemical', 'inert'],
  heatConductivity: 0.01,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // CO2 sinks (heavier than air)
    if (!grid.isEmpty(x, y + 1)) {
      h.riseUp(x, y);
    } else {
      grid.swapCells(x, y, x, y + 1);
    }

    // Smother fire
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'fire' && h.chance(0.1)) {
        grid.clearCell(nx, ny);
        grid.clearCell(x, y);
        return;
      }
    }
  },
});

// ── HYDROGEN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'hydrogen', name: 'Hydrogen', category: 'gases',
  color: '#ddeeff', density: 0.01, state: 'gas',
  desc: 'Lightest element. Extremely flammable. Burns with invisible flame.',
  tags: ['gas', 'flammable', 'explosive', 'element'],
  burnAt: 80, heatConductivity: 0.18,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    if (h.getHeat(x, y) >= 80 && h.chance(0.15)) {
      // Hydrogen detonation
      setTimeout(() => h.explode(x, y, 8, 1.2), 50);
      grid.setCell(x, y, 'fire', { energy: 40 });
    }
  },
});

// ── OXYGEN ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'oxygen', name: 'Oxygen', category: 'gases',
  color: '#cceeff', density: 0.04, state: 'gas',
  desc: 'Makes fires burn much hotter and faster.',
  tags: ['gas', 'element', 'oxidizer'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Supercharge adjacent fire
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'fire') {
        h.addHeat(nx, ny, 20);
        const fc = grid.getCell(nx, ny);
        if (fc) fc.energy = Math.min(200, (fc.energy ?? 60) + 10);
      }
    }
  },
});

// ── NITROGEN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nitrogen', name: 'Nitrogen', category: 'gases',
  color: '#e8f0ff', density: 0.04, state: 'gas',
  desc: 'Inert gas. Smothers fire without reacting.',
  tags: ['gas', 'element', 'inert'],
  heatConductivity: 0.01,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Smother fire like CO2
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'fire' && h.chance(0.05)) {
        grid.clearCell(nx, ny);
      }
    }
  },
});

// ── METHANE ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'methane', name: 'Methane', category: 'gases',
  color: '#ccffcc', density: 0.03, state: 'gas',
  desc: 'Flammable gas. Burns blue.',
  tags: ['gas', 'flammable', 'organic'],
  burnAt: 120, heatConductivity: 0.02,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    if (h.getHeat(x, y) >= 120 && h.chance(0.06)) {
      grid.setCell(x, y, 'fire', { energy: 50 });
    }
  },
});

// ── CHLORINE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'chlorine', name: 'Chlorine', category: 'gases',
  color: '#aaff66', density: 0.09, state: 'gas',
  desc: 'Toxic yellow-green gas. Corrodes organic material.',
  tags: ['gas', 'toxic', 'chemical', 'element'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    // Sinks slightly (denser than air)
    if (grid.isEmpty(x, y + 1) && h.chance(0.3)) {
      grid.swapCells(x, y, x, y + 1);
      return;
    }
    h.riseUp(x, y);
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.3;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Corrode organic neighbors
    const ORGANIC = new Set(['plant','wood','person','zombie','ant','worm','flesh','bone']);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (ORGANIC.has(grid.getType(nx, ny)) && h.chance(0.02)) {
        grid.setCell(nx, ny, 'ash2');
      }
    }
  },
});

// ── HELIUM ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'helium', name: 'Helium', category: 'gases',
  color: '#ffffcc', density: 0.005, state: 'gas',
  desc: 'Lightest noble gas. Rises faster than anything.',
  tags: ['gas', 'element', 'inert', 'light'],
  heatConductivity: 0.15,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.15;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Always rises, very fast
    if (grid.isEmpty(x, y - 1)) { grid.swapCells(x, y, x, y - 1); return; }
    const d = h.chance(0.5) ? 1 : -1;
    if (grid.isEmpty(x+d, y-1)) grid.swapCells(x, y, x+d, y-1);
    else if (grid.isEmpty(x-d, y-1)) grid.swapCells(x, y, x-d, y-1);
  },
});

// ── ARGON ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'argon', name: 'Argon', category: 'gases',
  color: '#ddaaff', density: 0.06, state: 'gas',
  desc: 'Inert noble gas. Glows purple in electric fields.',
  tags: ['gas', 'element', 'inert'],
  heatConductivity: 0.01,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
  },
});

// ── OZONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ozone', name: 'Ozone', category: 'gases',
  color: '#aaffdd', density: 0.05, state: 'gas',
  desc: 'O₃. Reacts strongly with many chemicals.',
  tags: ['gas', 'chemical', 'reactive'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 50) - 0.4;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // React with fire, explosions
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'fire') {
        grid.clearCell(nx, ny); // ozone smothers fire
        grid.clearCell(x, y);
        return;
      }
    }
  },
});

// ── BUBBLE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bubble', name: 'Bubble', category: 'gases',
  color: '#aaddff', density: 0.01, state: 'gas',
  desc: 'Soap bubble. Pops on contact with most solids.',
  tags: ['gas', 'fragile', 'bubbly'],
  heatConductivity: 0.01,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 30) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Rise
    if (grid.isEmpty(x, y - 1)) { grid.swapCells(x, y, x, y - 1); return; }

    // Pop on solid contact
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      const ndef = ElementRegistry.get(ntype);
      if (ndef && ndef.state === 'solid' && h.chance(0.2)) {
        grid.clearCell(x, y);
        return;
      }
    }
  },
});

// ── ACID RAIN ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'acid_rain', name: 'Acid Rain', category: 'gases',
  color: '#88cc44', density: 0.03, state: 'gas',
  desc: 'Falls like rain but corrodes on landing.',
  tags: ['gas', 'corrosive', 'weather'],
  heatConductivity: 0.03,

  tick(x, y, grid, h) {
    // Falls down like rain
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }

    // On landing, become acid
    const below = grid.getType(x, y + 1);
    if (below && below !== 'empty') {
      grid.setCell(x, y, 'acid');
    }
  },
});

window.PW_setLoadProgress?.(28, 'Gases loaded...');
