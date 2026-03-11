/**
 * PARTICLE WORLD v2.0 — elements/space.js
 * Blackhole, antimatter, neutron star, void, plasma, cosmic elements
 */

// ── BLACKHOLE ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'blackhole', name: 'Black Hole', category: 'space',
  color: (cell, x, y, frame) => {
    const cols = ['#000000','#110022','#220033','#000011'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 999, state: 'special',
  desc: 'Pulls everything in. Nothing escapes.',
  tags: ['space', 'gravity', 'extreme', 'rare'],
  flavor: 'Singularity.',
  heatConductivity: 0.0,

  tick(x, y, grid, h, frame) {
    const RADIUS = 12;
    const PULL_STRENGTH = 0.15;

    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        if (!dx && !dy) continue;
        const dist2 = dx*dx + dy*dy;
        if (dist2 > RADIUS*RADIUS) continue;
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        const ntype = grid.getType(nx, ny);
        if (!ntype || ntype === 'empty' || ntype === 'blackhole' || ntype === 'wall') continue;

        const dist = Math.sqrt(dist2);
        const prob = PULL_STRENGTH / dist;

        if (h.chance(prob)) {
          if (dist < 2) {
            // Consume
            grid.clearCell(nx, ny);
          } else {
            // Pull one step closer
            const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
            const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
            if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) {
              grid.swapCells(nx, ny, mx, my);
            } else {
              grid.clearCell(nx, ny);
            }
          }
        }
      }
    }
  },
});

// ── ANTIMATTER ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'antimatter', name: 'Antimatter', category: 'space',
  color: (cell, x, y, frame) => {
    const cols = ['#ff00ff','#dd00dd','#ff44ff','#aa00cc','#ff22ee'];
    return cols[(frame * 2 + x + y) % cols.length];
  },
  density: 0.5, state: 'energy',
  desc: 'Annihilates everything it touches.',
  tags: ['space', 'destructive', 'exotic', 'rare'],
  flavor: 'Matter meets its end.',
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 50) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    h.riseUp(x, y);

    // Annihilate neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || ntype === 'empty' || ntype === 'antimatter' || ntype === 'wall') continue;
      if (h.chance(0.3)) {
        grid.clearCell(nx, ny);
        h.addHeat(x, y, 100);
        if (h.chance(0.2)) h.explode(x, y, 3, 0.5);
      }
    }
  },
});

// ── NEUTRON STAR ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'neutronstar', name: 'Neutron Star', category: 'space',
  color: '#ffffff', density: 999, state: 'special',
  desc: 'Incredible gravity and heat. Compresses matter.',
  tags: ['space', 'extreme', 'gravity', 'rare'],
  heat: 5000, heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const RADIUS = 8;
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        if (!dx && !dy) continue;
        if (dx*dx+dy*dy > RADIUS*RADIUS) continue;
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        // Extreme heat
        h.addHeat(nx, ny, 200 / (Math.sqrt(dx*dx+dy*dy) + 1));
        // Compress matter
        const ntype = grid.getType(nx, ny);
        if (ntype && ntype !== 'empty' && ntype !== 'wall' && ntype !== 'neutronstar' && h.chance(0.01)) {
          const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
          const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
          if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) grid.swapCells(nx, ny, mx, my);
        }
      }
    }
  },
});

// ── VOID ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'void_', name: 'Void', category: 'space',
  color: '#000000', density: 999, state: 'special',
  desc: 'Deletes anything that enters it.',
  tags: ['space', 'delete', 'utility'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (ntype && ntype !== 'empty' && ntype !== 'wall' && ntype !== 'void_') {
        if (h.chance(0.3)) grid.clearCell(nx, ny);
      }
    }
  },
});

// ── METEOR ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'meteor', name: 'Meteor', category: 'space',
  color: '#aa7744', density: 5.0, state: 'solid',
  desc: 'Falls fast from the sky. Explodes on impact.',
  tags: ['space', 'falling', 'explosive'],
  heat: 800, heatConductivity: 0.2,

  tick(x, y, grid, h) {
    // Fall very fast
    for (let i = 0; i < 3; i++) {
      if (grid.isEmpty(x, y + 1)) {
        grid.swapCells(x, y, x, y + 1);
        y++;
      } else {
        // Impact
        grid.clearCell(x, y);
        setTimeout(() => h.explode(x, y, 10, 1.3), 10);
        return;
      }
    }
    // Heat trail
    if (h.chance(0.3) && grid.isEmpty(x, y - 1)) grid.setCell(x, y - 1, 'fire', { energy: 20 });
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 30);
  },
});

// ── RADIATION ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'radiation', name: 'Radiation', category: 'space',
  color: '#44ff22', density: 0.0, state: 'energy',
  desc: 'Invisible danger. Mutates and kills life.',
  tags: ['space', 'nuclear', 'dangerous'],
  heat: 50, heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 40) - 0.3;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    h.riseUp(x, y);

    const CREATURES = new Set(['person','zombie','ant','fish','bird','worm','rat','snake','spider','bat','frog','wolf','bear']);
    const MUTATE    = new Set(['water','dirt','plant','sand']);

    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (CREATURES.has(ntype) && h.chance(0.01)) {
        grid.setCell(nx, ny, 'mutant');
      }
      if (MUTATE.has(ntype) && h.chance(0.002)) {
        grid.setCell(nx, ny, 'waste');
      }
    }
  },
});

// ── URANIUM ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'uranium', name: 'Uranium', category: 'space',
  color: '#44ff44', density: 5.0, state: 'solid',
  desc: 'Radioactive element. Emits radiation continuously.',
  tags: ['space', 'nuclear', 'radioactive', 'heavy'],
  heatConductivity: 0.4,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    // Emit radiation
    if (h.chance(0.02)) {
      const rx = x + h.randInt(-3, 3);
      const ry = y + h.randInt(-3, 3);
      if (grid.inBounds(rx, ry) && grid.isEmpty(rx, ry)) {
        grid.setCell(rx, ry, 'radiation');
      }
    }
  },
});

// ── PLASMA BALL ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plasma_ball', name: 'Plasma Ball', category: 'space',
  color: (cell, x, y, frame) => {
    const cols = ['#ff44ff','#ff00cc','#cc00ff','#ff66ff','#dd22ff'];
    return cols[(frame * 3 + x * 2 + y) % cols.length];
  },
  density: 0.0, state: 'energy',
  desc: 'Ball of plasma that bounces around.',
  tags: ['space', 'energy', 'electric'],
  heat: 1000, heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    let dx = cell.dir || 1;
    let dy = (cell.flags || 1);

    const nx = x+dx, ny2 = y+dy;
    if (!grid.isEmpty(nx, y)) { dx = -dx; }
    if (!grid.isEmpty(x, ny2)) { dy = -dy; }
    cell.dir   = dx;
    cell.flags = dy;

    if (grid.isEmpty(x+dx, y+dy)) {
      grid.swapCells(x, y, x+dx, y+dy);
    }
    for (const [nnx, nny] of h.neighbors4(x, y)) h.addHeat(nnx, nny, 20);
  },
});

// ── COMET ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'comet', name: 'Comet', category: 'space',
  color: '#aaddff', density: 3.0, state: 'solid',
  desc: 'Icy space rock. Leaves water trail.',
  tags: ['space', 'falling', 'ice'],
  heat: -50, heatConductivity: 0.15,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const dir  = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir   = dir;

    // Move diagonally
    if (grid.isEmpty(x + dir, y + 1)) {
      grid.swapCells(x, y, x + dir, y + 1);
    } else {
      grid.clearCell(x, y);
      h.explode(x, y, 5, 0.6);
      // Leave water
      for (let i = 0; i < 5; i++) {
        const wx = x + h.randInt(-3, 3);
        const wy = y + h.randInt(-3, 3);
        if (grid.inBounds(wx, wy) && grid.isEmpty(wx, wy)) grid.setCell(wx, wy, 'water');
      }
    }
    // Trail
    if (grid.isEmpty(x, y - 1) && h.chance(0.4)) grid.setCell(x, y - 1, 'steam');
  },
});

// ── WORMHOLE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wormhole', name: 'Wormhole', category: 'space',
  color: (cell, x, y, frame) => {
    const cols = ['#8800ff','#aa00ff','#6600cc','#cc44ff','#9900ee'];
    return cols[(frame + x + y) % cols.length];
  },
  density: 999, state: 'special',
  desc: 'Teleports particles to a random location.',
  tags: ['space', 'teleport', 'exotic'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || ntype === 'empty' || ntype === 'wormhole' || ntype === 'wall') continue;
      if (h.chance(0.1)) {
        // Teleport
        const tx = h.randInt(0, grid.cols - 1);
        const ty = h.randInt(0, grid.rows - 1);
        if (grid.isEmpty(tx, ty)) {
          grid.swapCells(nx, ny, tx, ty);
        }
      }
    }
  },
});

// ── DARK MATTER ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'dark_matter', name: 'Dark Matter', category: 'space',
  color: '#111133', density: 0.0, state: 'special',
  desc: 'Invisible to physics. Passes through everything.',
  tags: ['space', 'exotic', 'rare'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Just drifts randomly
    const dx = h.randInt(-1, 1);
    const dy = h.randInt(-1, 1);
    if (grid.isEmpty(x+dx, y+dy)) grid.swapCells(x, y, x+dx, y+dy);
  },
});

// ── SINGULARITY ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'singularity', name: 'Singularity', category: 'space',
  color: '#000000', density: 999, state: 'special',
  desc: 'The most powerful force. Deletes the entire grid.',
  tags: ['space', 'extreme', 'rare', 'destructive'],
  heatConductivity: 0.0,

  tick(x, y, grid, h, frame) {
    // Grows rapidly
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        const ntype = grid.getType(nx, ny);
        if (ntype && ntype !== 'empty' && ntype !== 'wall' && h.chance(0.3)) {
          grid.clearCell(nx, ny);
        }
      }
    }
  },
});

window.PW_setLoadProgress?.(74, 'Space loaded...');
