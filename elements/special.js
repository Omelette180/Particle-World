/**
 * PARTICLE WORLD v2.0 — elements/special.js
 * Clone, portals, gravity zone, time crystal, source, drain, force field, beacon,
 * mutant, waste, glitter — upgraded with new helpers and explode() opts format.
 */

// ── CLONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'clone', name: 'Clone', category: 'special',
  color: '#884488', density: 999, state: 'special',
  desc: 'Copies the first element it touches and emits it endlessly.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    // Learn
    if (!cell.flags) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const t = grid.getType(nx, ny);
        if (t && t !== 'empty' && t !== 'clone' && t !== 'wall') { cell.flags = t; break; }
      }
      return;
    }
    // Emit
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      if (grid.isEmpty(nx, ny) && h.chance(0.12)) { grid.setCell(nx, ny, cell.flags); break; }
    }
  },
});

// ── PORTALS ───────────────────────────────────────────────────────
let _portalAPos = null, _portalBPos = null;

ElementRegistry.register({
  id: 'portal_a', name: 'Portal A', category: 'special',
  color: '#2244ff', density: 999, state: 'special',
  desc: 'Teleports particles to Portal B.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    _portalAPos = [x, y];
    if (!_portalBPos) return;
    const [bx, by] = _portalBPos;
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'portal_a' || t === 'portal_b') continue;
      if (!h.chance(0.2)) continue;
      const tx = bx + (nx - x), ty = by + (ny - y);
      if (grid.inBounds(tx, ty) && grid.isEmpty(tx, ty)) {
        const saved = { ...grid.getCell(nx, ny) };
        grid.clearCell(nx, ny);
        grid.setCell(tx, ty, saved.type, saved);
      }
      break;
    }
  },
});

ElementRegistry.register({
  id: 'portal_b', name: 'Portal B', category: 'special',
  color: '#ff4422', density: 999, state: 'special',
  desc: 'Receives particles from Portal A.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) { _portalBPos = [x, y]; },
});

// ── GRAVITY ZONE ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gravity_zone', name: 'Gravity Zone', category: 'special',
  color: '#222244', density: 999, state: 'special',
  desc: 'Reverses gravity for particles inside it.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const nx = x+dx, ny = y+dy;
      if (!grid.inBounds(nx, ny)) continue;
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'gravity_zone' || t === 'wall') continue;
      const def = ElementRegistry.get(t);
      if (def?.state !== 'special' && grid.isEmpty(nx, ny-1) && h.chance(0.06)) {
        grid.swapCells(nx, ny, nx, ny-1);
      }
    }
  },
});

// ── GRAVITY WELL ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gravity_well', name: 'Gravity Well', category: 'special',
  color: '#221144', density: 999, state: 'special',
  desc: 'Pulls nearby particles inward.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const R = 10;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (!dx && !dy) continue;
      if (dx*dx+dy*dy > R*R) continue;
      const nx = x+dx, ny = y+dy;
      if (!grid.inBounds(nx, ny)) continue;
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'gravity_well' || t === 'wall') continue;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if (!h.chance(0.12 / dist)) continue;
      const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
      const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
      if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) grid.swapCells(nx, ny, mx, my);
      else if (dist < 2) grid.clearCell(nx, ny);
    }
  },
});

// ── TIME CRYSTAL ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'time_crystal', name: 'Time Crystal', category: 'special',
  color: (cell, x, y, frame) => ['#aaffff','#88ddff','#ccffee','#aaeeff','#88ffdd'][(frame + x*5 + y*3) % 5],
  density: 2.5, state: 'solid',
  desc: 'Freezes time for nearby particles.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      if (!dx && !dy) continue;
      grid.markUpdated(x+dx, y+dy);
    }
  },
});

// ── SOURCE & DRAIN ────────────────────────────────────────────────
ElementRegistry.register({
  id: 'source', name: 'Source', category: 'special',
  color: '#004444', density: 999, state: 'special',
  desc: 'Infinitely produces water.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    if (h.chance(0.2)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        if (grid.isEmpty(nx, ny)) { grid.setCell(nx, ny, 'water'); break; }
      }
    }
  },
});

ElementRegistry.register({
  id: 'drain', name: 'Drain', category: 'special',
  color: '#111111', density: 999, state: 'special',
  desc: 'Deletes anything that falls in.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (t && t !== 'empty' && t !== 'drain' && t !== 'wall' && h.chance(0.4)) grid.clearCell(nx, ny);
    }
  },
});

// ── FORCE FIELD ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'force_field', name: 'Force Field', category: 'special',
  color: '#4444ff', density: 999, state: 'special',
  desc: 'Repels everything away from it.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'force_field' || t === 'wall') continue;
      const dx = nx-x, dy2 = ny-y;
      const px = nx+dx, py = ny+dy2;
      if (grid.inBounds(px, py) && grid.isEmpty(px, py)) grid.swapCells(nx, ny, px, py);
    }
  },
});

// ── BEACON ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'beacon', name: 'Beacon', category: 'special',
  color: (cell, x, y, frame) => ['#ffff00','#ffee00','#ffcc00','#ffdd00'][frame % 4],
  density: 999, state: 'special',
  desc: 'Glows and warms a large area.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      if (dx*dx+dy*dy > 36) continue;
      h.addHeat(x+dx, y+dy, 0.6);
    }
  },
});

// ── PRISM ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'prism', name: 'Prism', category: 'special',
  color: (cell, x, y, frame) => ['#ff4444','#ff8800','#ffff44','#44ff44','#4488ff','#8844ff'][(frame + x*3) % 6],
  density: 2.5, state: 'solid',
  desc: 'Splits light into rainbow colors.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) { /* visual only */ },
});

// ── MUTANT ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mutant', name: 'Mutant', category: 'special',
  color: (cell, x, y, frame) => ['#44ff22','#22ee44','#88ff44','#33cc22'][(frame + x + y) % 4],
  density: 1.0, state: 'solid',
  desc: 'Radiation-altered creature. Spreads mutation.',
  burnAt: 300,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (grid.isEmpty(x+dir, y)) grid.swapCells(x, y, x+dir, y);
    else cell.dir = -dir;
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'person' || t === 'zombie' || t === 'citizen' || t === 'ant') && h.chance(0.015)) {
        grid.setCell(nx, ny, 'mutant');
      }
    }
    if (h.chance(0.008) && grid.isEmpty(x, y-1)) grid.setCell(x, y-1, 'radiation');
  },
});

// ── WASTE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'waste', name: 'Waste', category: 'special',
  color: '#665500', density: 1.3, state: 'liquid',
  desc: 'Toxic sludge. Slowly spreads and pollutes.',
  heatConductivity: 0.05,
  tick(x, y, grid, h) {
    h.LIQUID(x, y, 0.3);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'water' || t === 'dirt') && h.chance(0.001)) grid.setCell(nx, ny, 'waste');
    }
  },
});

// ── GLITTER ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'glitter', name: 'Glitter', category: 'special',
  color: (cell, x, y, frame) => ['#ffff88','#ffaaff','#88ffff','#ffcc44','#ff88ff','#88ffaa'][(frame*3 + x*7 + y*11) % 6],
  density: 1.5, state: 'solid',
  desc: 'Sparkles in every color.',
  heatConductivity: 0.05,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── SPIDERWEB ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'spiderweb', name: 'Spiderweb', category: 'special',
  color: '#ddddcc', density: 0.1, state: 'solid',
  desc: 'Traps creatures and slows things down.',
  burnAt: 60, burnInto: 'ash', burnTime: 20,
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    // Trap creatures
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      const def = ElementRegistry.get(t);
      if (def?.state === 'solid' && def.density > 0.5 && def.density < 3) {
        // Slow the creature — mark it updated so it skips a tick occasionally
        if (h.chance(0.3)) grid.markUpdated(nx, ny);
      }
    }
  },
});

// ── NUTRIENT ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nutrient', name: 'Nutrient', category: 'special',
  color: '#886633', density: 1.1, state: 'liquid',
  desc: 'Rich organic liquid. Makes plants grow fast.',
  heatConductivity: 0.06,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'plant' || t === 'seed' || t === 'grass' || t === 'algae') && h.chance(0.005)) {
        grid.clearCell(x, y);
        // Spawn extra plant
        if (grid.isEmpty(nx, ny-1)) grid.setCell(nx, ny-1, 'plant');
        return;
      }
    }
    h.LIQUID(x, y, 0.7);
  },
});

window.PW_setLoadProgress?.(88, 'Special elements loaded...');
