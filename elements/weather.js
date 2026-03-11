/**
 * PARTICLE WORLD v2.0 — elements/weather.js
 * Rain, snow, cloud, lightning, tornado, hurricane, blizzard, fog, etc.
 */

// ── RAIN ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'rain', name: 'Rain', category: 'weather',
  color: '#4488bb', density: 0.9, state: 'liquid',
  desc: 'Falls from the sky. Becomes water on landing.',
  tags: ['weather', 'water', 'falling'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    // Fall fast
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (grid.isEmpty(x + (h.chance(0.5)?1:-1), y + 1)) {
      grid.swapCells(x, y, x + (h.chance(0.5)?1:-1), y + 1); return;
    }
    // Hit ground — become water
    grid.setCell(x, y, 'water');
  },
});

// ── SNOW ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'snow', name: 'Snow', category: 'weather',
  color: '#daeeff', density: 0.4, state: 'solid',
  desc: 'Soft and cold. Melts into water.',
  tags: ['weather', 'cold', 'powder'],
  meltAt: 2, meltsInto: 'water',
  heat: -5, heatConductivity: 0.08,

  tick(x, y, grid, h) {
    if (!h.chance(0.5)) return;
    if (h.fallBelow(x, y)) return;
    // Chill neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      h.addHeat(nx, ny, -0.5);
    }
  },
});

// ── CLOUD ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'cloud', name: 'Cloud', category: 'weather',
  color: '#ccddee', density: 0.01, state: 'gas',
  desc: 'Drifts at the top. Rains when full.',
  tags: ['weather', 'gas', 'sky'],
  heatConductivity: 0.01,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);

    // Drift sideways
    if (h.chance(0.3)) {
      const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
      cell.dir = dir;
      if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
      else cell.dir = -dir;
    }

    // Collect water from steam below
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'steam' && h.chance(0.05)) {
        grid.clearCell(nx, ny);
        cell.energy = (cell.energy ?? 0) + 1;
      }
    }

    // Rain when full
    if ((cell.energy ?? 0) >= 5 && h.chance(0.02)) {
      if (grid.isEmpty(x, y + 1)) {
        grid.setCell(x, y + 1, 'rain');
        cell.energy -= 1;
      }
    }
  },
});

// ── LIGHTNING ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'lightning', name: 'Lightning', category: 'weather',
  color: '#ffff88', density: 0.0, state: 'energy',
  desc: 'Strikes downward instantly. Ignites and destroys.',
  tags: ['weather', 'electric', 'energy'],
  heat: 2000, heatConductivity: 0.0,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 8) - 1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Strike downward
    if (grid.isEmpty(x, y + 1)) {
      grid.swapCells(x, y, x, y + 1);
    } else {
      // Hit something — explode
      const hit = grid.getType(x, y + 1);
      if (hit && hit !== 'wall') {
        h.addHeat(x, y + 1, 500);
        if (h.chance(0.5)) grid.setCell(x, y + 1, 'fire', { energy: 40 });
      }
      grid.clearCell(x, y);
    }
  },
});

// ── TORNADO ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'tornado', name: 'Tornado', category: 'weather',
  color: '#aaaaaa', density: 0.0, state: 'energy',
  desc: 'Sucks up and flings everything in its path.',
  tags: ['weather', 'destructive', 'wind'],
  heatConductivity: 0.0,

  tick(x, y, grid, h, frame) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 200) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Move slowly
    if (h.chance(0.1)) {
      const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
      cell.dir = dir;
      if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
      else cell.dir = -dir;
    }

    // Suck up nearby particles
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (!dx && !dy) continue;
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        const ntype = grid.getType(nx, ny);
        if (!ntype || ntype === 'empty' || ntype === 'tornado' || ntype === 'wall') continue;
        if (h.chance(0.05)) {
          // Fling upward
          const tx = x + h.randInt(-6, 6);
          const ty = y - h.randInt(2, 8);
          if (grid.inBounds(tx, ty) && grid.isEmpty(tx, ty)) {
            grid.swapCells(nx, ny, tx, ty);
          } else {
            grid.clearCell(nx, ny);
          }
        }
      }
    }
  },
});

// ── HURRICANE ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'hurricane', name: 'Hurricane', category: 'weather',
  color: '#99aacc', density: 0.0, state: 'energy',
  desc: 'Massive spinning storm. Destroys everything.',
  tags: ['weather', 'destructive', 'large'],

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 300) - 0.3;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    if (h.chance(0.05)) {
      const dir = cell.dir || 1;
      cell.dir = dir;
      if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
      else cell.dir = -dir;
    }

    // Large radius destruction
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        if (dx*dx + dy*dy > 64) continue;
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        const ntype = grid.getType(nx, ny);
        if (!ntype || ntype === 'empty' || ntype === 'wall' || ntype === 'hurricane') continue;
        if (h.chance(0.02)) {
          const tx = x + h.randInt(-10, 10);
          const ty = y + h.randInt(-10, 10);
          if (grid.inBounds(tx, ty) && grid.isEmpty(tx, ty)) grid.swapCells(nx, ny, tx, ty);
          else grid.clearCell(nx, ny);
        }
      }
    }
  },
});

// ── BLIZZARD ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'blizzard', name: 'Blizzard', category: 'weather',
  color: '#cceeff', density: 0.0, state: 'energy',
  desc: 'Spreads snow and freezes everything.',
  tags: ['weather', 'cold', 'spreads'],

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 150) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    if (h.chance(0.3)) {
      const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
      cell.dir = dir;
      if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
      else cell.dir = -dir;
    }

    // Freeze and snow
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        h.addHeat(nx, ny, -5);
        if (grid.isEmpty(nx, ny) && h.chance(0.005)) grid.setCell(nx, ny, 'snow');
        if (grid.getType(nx, ny) === 'water' && h.getHeat(nx, ny) < 0 && h.chance(0.02)) {
          grid.setCell(nx, ny, 'ice');
        }
      }
    }
  },
});

// ── HAILSTORM ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'hailstorm', name: 'Hailstorm', category: 'weather',
  color: '#99bbdd', density: 0.0, state: 'energy',
  desc: 'Rains chunks of ice that smash on impact.',
  tags: ['weather', 'cold', 'destructive'],

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100) - 0.3;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Drop hail
    if (h.chance(0.1)) {
      const hx = x + h.randInt(-5, 5);
      if (grid.isEmpty(hx, y + 1)) {
        grid.setCell(hx, y + 1, 'ice');
      }
    }

    if (h.chance(0.1)) {
      const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
      cell.dir = dir;
      if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
      else cell.dir = -dir;
    }
  },
});

// ── FOG ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fog', name: 'Fog', category: 'weather',
  color: '#cccccc', density: 0.02, state: 'gas',
  desc: 'Thick mist. Reduces visibility.',
  tags: ['weather', 'gas', 'water'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100) - 0.1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    if (h.chance(0.2)) {
      const dx = h.randInt(-1, 1);
      const dy = h.randInt(-1, 1);
      if (grid.isEmpty(x+dx, y+dy)) grid.swapCells(x, y, x+dx, y+dy);
    }
  },
});

// ── DUST DEVIL ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'dust_devil', name: 'Dust Devil', category: 'weather',
  color: '#cc9966', density: 0.0, state: 'energy',
  desc: 'Small spinning vortex. Picks up sand and dust.',
  tags: ['weather', 'wind', 'small'],

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (h.chance(0.3)) {
      if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
      else cell.dir = -dir;
    }

    // Pick up sand/dust
    const PICKUP = new Set(['sand','dust','gravel','ash2','coal']);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x+dx, ny = y+dy;
        if (!grid.inBounds(nx, ny)) continue;
        if (PICKUP.has(grid.getType(nx, ny)) && h.chance(0.03)) {
          const tx = x + h.randInt(-4, 4);
          const ty = y - h.randInt(1, 4);
          if (grid.inBounds(tx, ty) && grid.isEmpty(tx, ty)) {
            grid.swapCells(nx, ny, tx, ty);
          }
        }
      }
    }
  },
});

// ── ACID RAIN ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'acid_rain', name: 'Acid Rain', category: 'weather',
  color: '#99cc44', density: 0.9, state: 'liquid',
  desc: 'Corrosive rain. Damages everything it touches.',
  tags: ['weather', 'corrosive', 'falling'],

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    // Land and become acid
    grid.setCell(x, y, 'acid');
  },
});

window.PW_setLoadProgress?.(66, 'Weather loaded...');
