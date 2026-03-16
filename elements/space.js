/**
 * PARTICLE WORLD v2.0 — elements/space.js
 * Black hole, antimatter, neutron star, void, radiation, uranium,
 * plasma ball, comet, wormhole, dark matter, singularity.
 * Upgraded: explode() uses new opts format. Meteor moved to vehicles.js.
 */

// ── BLACKHOLE ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'blackhole', name: 'Black Hole', category: 'space',
  color: (cell, x, y, frame) => ['#000000','#110022','#220033','#000011'][(frame + x + y) % 4],
  density: 999, state: 'special',
  desc: 'Pulls everything in. Nothing escapes.',
  heatConductivity: 0.0,
  tick(x, y, grid, h, frame) {
    const R = 14, PULL = 0.14;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (!dx && !dy) continue;
      const d2 = dx*dx+dy*dy;
      if (d2 > R*R) continue;
      const nx = x+dx, ny = y+dy;
      if (!grid.inBounds(nx, ny)) continue;
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'blackhole' || t === 'wall' || t === 'neutronstar') continue;
      const dist = Math.sqrt(d2);
      if (!h.chance(PULL / dist)) continue;
      if (dist < 2) {
        grid.clearCell(nx, ny);
      } else {
        const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
        const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
        if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) grid.swapCells(nx, ny, mx, my);
        else grid.clearCell(nx, ny);
      }
    }
  },
});

// ── NEUTRON STAR ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'neutronstar', name: 'Neutron Star', category: 'space',
  color: '#ffffff', density: 999, state: 'special',
  desc: 'Incredible gravity and heat. Compresses matter.',
  heat: 5000, heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const R = 8;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (!dx && !dy) continue;
      if (dx*dx+dy*dy > R*R) continue;
      const nx = x+dx, ny = y+dy;
      if (!grid.inBounds(nx, ny)) continue;
      h.addHeat(nx, ny, 200 / (Math.sqrt(dx*dx+dy*dy) + 1));
      const t = grid.getType(nx, ny);
      if (t && t !== 'empty' && t !== 'wall' && t !== 'neutronstar' && h.chance(0.01)) {
        const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
        const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
        if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) grid.swapCells(nx, ny, mx, my);
      }
    }
  },
});

// ── ANTIMATTER ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'antimatter', name: 'Antimatter', category: 'space',
  color: (cell, x, y, frame) => ['#ff00ff','#dd00dd','#ff44ff','#aa00cc','#ff22ee'][(frame*2 + x + y) % 5],
  density: 0.5, state: 'energy',
  desc: 'Annihilates everything it touches. Rises.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 60) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.GAS(x, y);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'antimatter' || t === 'wall') continue;
      if (h.chance(0.3)) {
        grid.clearCell(nx, ny);
        h.addHeat(x, y, 100);
        if (h.chance(0.15)) h.explode(x, y, 3, { strength: 0.5 });
      }
    }
  },
});

// ── VOID ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'void_', name: 'Void', category: 'space',
  color: '#000000', density: 999, state: 'special',
  desc: 'Silently deletes anything that enters it.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (t && t !== 'empty' && t !== 'wall' && t !== 'void_' && h.chance(0.3)) grid.clearCell(nx, ny);
    }
  },
});

// ── RADIATION ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'radiation', name: 'Radiation', category: 'space',
  color: '#44ff22', density: 0.0, state: 'energy',
  desc: 'Invisible danger. Mutates and kills life.',
  heat: 50, heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 50) - 0.3;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.GAS(x, y);
    const CREATURES = new Set(['person','zombie','ant','fish','bird','worm','rat','snake','spider','bat','frog','citizen']);
    const MUTATE    = new Set(['water','dirt','plant','sand']);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (CREATURES.has(t) && h.chance(0.01)) grid.setCell(nx, ny, 'mutant');
      if (MUTATE.has(t)    && h.chance(0.002)) grid.setCell(nx, ny, 'waste');
    }
  },
});

// ── URANIUM ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'uranium', name: 'Uranium', category: 'space',
  color: '#44ff44', density: 5.0, state: 'solid',
  desc: 'Radioactive. Constantly emits radiation.',
  heatConductivity: 0.4,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (h.chance(0.02)) {
      const rx = x + h.randInt(-3, 3), ry = y + h.randInt(-3, 3);
      if (grid.inBounds(rx, ry) && grid.isEmpty(rx, ry)) grid.setCell(rx, ry, 'radiation');
    }
    // Nearby uranium can reach critical mass
    let cnt = 0;
    for (const [nx, ny] of h.neighbors8(x, y)) { if (grid.getType(nx, ny) === 'uranium') cnt++; }
    if (cnt >= 6 && h.chance(0.002)) {
      setTimeout(() => h.explode(x, y, 40, { strength: 2.5, fire: ['radiation','fire','plasma'] }), 200);
    }
  },
});

// ── PLUTONIUM ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plutonium', name: 'Plutonium', category: 'space',
  color: '#22ffcc', density: 6.0, state: 'solid',
  desc: 'More radioactive than uranium. Faster critical mass.',
  heatConductivity: 0.35,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (h.chance(0.04)) {
      const rx = x + h.randInt(-4, 4), ry = y + h.randInt(-4, 4);
      if (grid.inBounds(rx, ry) && grid.isEmpty(rx, ry)) grid.setCell(rx, ry, 'radiation');
    }
    let cnt = 0;
    for (const [nx, ny] of h.neighbors8(x, y)) { if (grid.getType(nx, ny) === 'plutonium' || grid.getType(nx, ny) === 'uranium') cnt++; }
    if (cnt >= 5 && h.chance(0.005)) {
      setTimeout(() => h.explode(x, y, 50, { strength: 3, fire: ['radiation','fire','plasma'] }), 200);
    }
  },
});

// ── PLASMA BALL ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plasma_ball', name: 'Plasma Ball', category: 'space',
  color: (cell, x, y, frame) => ['#ff44ff','#ff00cc','#cc00ff','#ff66ff','#dd22ff'][(frame*3 + x*2 + y) % 5],
  density: 0.0, state: 'energy',
  desc: 'Dense ball of plasma that bounces around.',
  heat: 1000, heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 60) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    let dx = cell.dir   || 1;
    let dy = cell.flags || 1;
    if (!grid.isEmpty(x+dx, y)) dx = -dx;
    if (!grid.isEmpty(x, y+dy)) dy = -dy;
    cell.dir   = dx;
    cell.flags = dy;
    if (grid.isEmpty(x+dx, y+dy)) grid.swapCells(x, y, x+dx, y+dy);
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 20);
  },
});

// ── COMET ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'comet', name: 'Comet', category: 'space',
  color: '#aaddff', density: 3.0, state: 'solid',
  desc: 'Icy space rock. Falls diagonally. Leaves water trail.',
  heat: -50, heatConductivity: 0.15,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (grid.isEmpty(x+dir, y+1)) {
      grid.swapCells(x, y, x+dir, y+1);
    } else {
      grid.clearCell(x, y);
      h.explode(x, y, 5, { strength: 0.6 });
      for (let i = 0; i < 6; i++) {
        const wx = x + h.randInt(-4, 4), wy = y + h.randInt(-4, 4);
        if (grid.inBounds(wx, wy) && grid.isEmpty(wx, wy)) grid.setCell(wx, wy, 'water');
      }
    }
    if (grid.isEmpty(x, y-1) && h.chance(0.4)) { grid.setCell(x, y-1, 'steam'); const sc=grid.getCell(x,y-1); if(sc) sc.energy=20; }
  },
});

// ── SOLAR FLARE ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'solar_flare', name: 'Solar Flare', category: 'space',
  color: (cell, x, y, frame) => ['#ff8800','#ffaa00','#ff6600','#ffcc00'][(frame*2 + x + y) % 4],
  density: 0.001, state: 'energy',
  desc: 'Intense radiation burst from a star.',
  heatConductivity: 0.5,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 40) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 25);
    h.GAS(x, y);
  },
});

// ── WORMHOLE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wormhole', name: 'Wormhole', category: 'space',
  color: (cell, x, y, frame) => ['#8800ff','#aa00ff','#6600cc','#cc44ff','#9900ee'][(frame + x + y) % 5],
  density: 999, state: 'special',
  desc: 'Teleports particles to a random location.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'wormhole' || t === 'wall') continue;
      if (h.chance(0.1)) {
        const tx = h.randInt(0, grid.cols-1), ty = h.randInt(0, grid.rows-1);
        if (grid.isEmpty(tx, ty)) grid.swapCells(nx, ny, tx, ty);
      }
    }
  },
});

// ── DARK MATTER ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'dark_matter', name: 'Dark Matter', category: 'space',
  color: '#111133', density: 0.0, state: 'special',
  desc: 'Passes through everything. Invisible to physics.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 80) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    const dx = h.randInt(-1, 1), dy = h.randInt(-1, 1);
    // Dark matter passes THROUGH other elements (swap into occupied cells)
    if (grid.inBounds(x+dx, y+dy)) grid.swapCells(x, y, x+dx, y+dy);
  },
});

// ── SINGULARITY ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'singularity', name: 'Singularity', category: 'space',
  color: '#000000', density: 999, state: 'special',
  desc: 'The most powerful force. Rapidly consumes everything.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    // Grows — radius expands each tick via energy
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const r = Math.min(6, 1 + Math.floor((cell.energy ?? 0) / 50));
    cell.energy = (cell.energy ?? 0) + 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx*dx+dy*dy > r*r) continue;
      const nx = x+dx, ny = y+dy;
      if (!grid.inBounds(nx, ny)) continue;
      const t = grid.getType(nx, ny);
      if (t && t !== 'empty' && t !== 'wall' && t !== 'singularity' && h.chance(0.3)) grid.clearCell(nx, ny);
    }
  },
});

// ── STARDUST ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'stardust', name: 'Stardust', category: 'space',
  color: (cell, x, y, frame) => ['#ffeeaa','#ffddcc','#ffccff','#ccffee','#aaccff'][(frame*2 + x*3 + y*5) % 5],
  density: 0.1, state: 'solid',
  desc: 'Ancient cosmic dust. Falls slowly.',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    // Very slow fall, drifts sideways
    if (h.chance(0.3)) h.POWDER(x, y);
    else if (h.chance(0.2)) {
      const d = h.rnd() < 0.5 ? 1 : -1;
      if (grid.isEmpty(x+d, y)) grid.swapCells(x, y, x+d, y);
    }
  },
});

window.PW_setLoadProgress?.(74, 'Space loaded...');
