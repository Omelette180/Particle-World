/**
 * PARTICLE WORLD v2.0 — elements/fire.js
 * Fire, plasma, ember, torch, lightning — upgraded with Sandboxels behaviors.
 */

// ── FIRE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fire', name: 'Fire', category: 'energy',
  color: '#ff8800', density: 0.001, state: 'gas',
  desc: 'Burns and rises. Ignites flammable materials.',
  heatConductivity: 0.2,
  tick(x, y, grid, h) { h.FIRE(x, y); },
});

// ── EMBER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ember', name: 'Ember', category: 'energy',
  color: '#ff6600', density: 0.1, state: 'gas',
  desc: 'Glowing coal fragment. Floats upward, ignites on contact.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 40) - h.rnd() * 0.8;
    if (cell.energy <= 0) { grid.setCell(x, y, 'ash'); return; }
    // Heat neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const nc = grid.getCell(nx, ny);
      if (nc) nc.heat = (nc.heat ?? 0) + 2;
      const nd = ElementRegistry.get(grid.getType(nx, ny));
      if (nd?.burnAt && (nc?.heat ?? 0) > nd.burnAt && h.chance(0.03)) {
        grid.setCell(nx, ny, 'fire');
      }
    }
    // Float upward
    if (grid.isEmpty(x, y-1) && h.chance(0.7)) { grid.swapCells(x, y, x, y-1); return; }
    const d = h.rnd() < 0.5 ? 1 : -1;
    if (grid.isEmpty(x+d, y-1) && h.chance(0.5)) { grid.swapCells(x, y, x+d, y-1); return; }
    if (grid.isEmpty(x+d, y)) { grid.swapCells(x, y, x+d, y); }
  },
});

// ── PLASMA ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plasma', name: 'Plasma', category: 'energy',
  color: '#cc00ff', density: 0.001, state: 'gas',
  desc: 'Superheated ionized gas. Extremely hot.',
  heatConductivity: 0.5,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 90) - h.rnd() * 1.5;
    if (cell.energy <= 0) { grid.setCell(x, y, 'fire'); return; }
    // Very intense heat to neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const nc = grid.getCell(nx, ny);
      if (nc) nc.heat = (nc.heat ?? 0) + 15;
      const t = grid.getType(nx, ny);
      const nd = ElementRegistry.get(t);
      if (nd?.burnAt && (nc?.heat ?? 0) > nd.burnAt && h.chance(0.08)) {
        grid.setCell(nx, ny, 'fire');
        const fc = grid.getCell(nx, ny);
        if (fc) fc.energy = 80;
      }
      // Plasma melts stone and metal
      if ((t === 'stone' || t === 'metal' || t === 'steel') && h.chance(0.01)) {
        grid.setCell(nx, ny, 'lava');
      }
    }
    // Color flicker
    const colors = ['#cc00ff','#ee00ff','#aa00dd','#ff44ff','#dd00ee'];
    cell.color = colors[0 | (h.rnd() * colors.length)];
    h.GAS(x, y);
  },
});

// ── NAPALM ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'napalm', name: 'Napalm', category: 'liquids',
  color: '#cc4400', density: 0.9, state: 'liquid',
  desc: 'Sticky incendiary gel. Burns long and hot.',
  burnAt: 150, burnInto: 'fire', burnTime: 400,
  heatConductivity: 0.05,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    // Spread fire to neighbors while burning
    const cell = grid.getCell(x, y);
    if (cell?.burning) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nd = ElementRegistry.get(grid.getType(nx, ny));
        if (nd?.burnAt && h.chance(0.06)) {
          const nc = grid.getCell(nx, ny);
          if (nc) nc.burning = true;
        }
      }
    }
    h.LIQUID(x, y, 0.4); // sticky, slow
  },
});

// ── TORCH ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'torch', name: 'Torch', category: 'energy',
  color: '#a05020', density: 99, state: 'solid',
  desc: 'Permanently emits fire above.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y-1) && h.chance(0.3)) {
      grid.setCell(x, y-1, 'fire');
      const fc = grid.getCell(x, y-1);
      if (fc) fc.energy = 30 + h.rnd() * 20;
    }
    // Also occasionally emit to sides
    const d = h.rnd() < 0.5 ? 1 : -1;
    if (grid.isEmpty(x+d, y-1) && h.chance(0.1)) {
      grid.setCell(x+d, y-1, 'fire');
      const fc = grid.getCell(x+d, y-1);
      if (fc) fc.energy = 20;
    }
  },
});

// ── LIGHTNING ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'lightning', name: 'Lightning', category: 'energy',
  color: '#ffffaa', density: 0.001, state: 'gas',
  desc: 'Instant bolt of electricity. Causes explosions.',
  heatConductivity: 1.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 8) - 1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Strike downward
    if (!grid.isEmpty(x, y+1)) {
      const t = grid.getType(x, y+1);
      const nc = grid.getCell(x, y+1);
      if (nc) nc.heat = (nc.heat ?? 0) + 500;
      const nd = ElementRegistry.get(t);
      if (nd?.burnAt) grid.setCell(x, y+1, 'fire');
      if (t === 'gunpowder' || t === 'tnt') {
        h.explode(x, y+1, t === 'tnt' ? 14 : 8);
      }
      grid.clearCell(x, y);
      return;
    }
    // Move downward
    grid.swapCells(x, y, x, y+1);
  },
});

// ── FIREBALL ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fireball', name: 'Fireball', category: 'energy',
  color: '#ff4400', density: 0.5, state: 'gas',
  desc: 'A dense ball of fire that explodes on impact.',
  heatConductivity: 0.3,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 60) - h.rnd() * 2;
    if (cell.energy <= 0) {
      grid.clearCell(x, y);
      h.explode(x, y, 8, { strength: 0.9 });
      return;
    }
    cell.color = ['#ff4400','#ff6600','#ff2200','#ff8800'][0|h.rnd()*4];
    // Check collision
    const below = grid.getType(x, y+1);
    if (below && below !== 'empty' && below !== 'fireball' && below !== 'fire') {
      grid.clearCell(x, y);
      h.explode(x, y+1, 8, { strength: 1.0 });
      return;
    }
    h.GAS(x, y);
  },
});
