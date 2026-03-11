/**
 * PARTICLE WORLD v2.0 — elements/vehicles.js
 * Car, boat, plane, helicopter, tank, UFO, etc.
 */

// ── CAR ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'car', name: 'Car', category: 'vehicles',
  color: '#cc3322', density: 2.0, state: 'solid',
  desc: 'Drives along flat surfaces. Explodes on crash.',
  tags: ['vehicle', 'land', 'fast'],
  burnAt: 400,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.6)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    if (grid.isEmpty(x + dir, y) && !grid.isEmpty(x + dir, y + 1)) {
      grid.swapCells(x, y, x + dir, y);
    } else if (grid.isEmpty(x + dir, y - 1) && grid.isEmpty(x + dir, y)) {
      grid.swapCells(x, y, x + dir, y - 1);
    } else {
      // Crash
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 6, 1.0), 20);
    }
  },
});

// ── BOAT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'boat', name: 'Boat', category: 'vehicles',
  color: '#885522', density: 0.8, state: 'solid',
  desc: 'Floats and moves on water.',
  tags: ['vehicle', 'water', 'floats'],
  burnAt: 300,

  tick(x, y, grid, h) {
    const WATER = new Set(['water','seawater','saltwater']);
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    // Float on water
    if (WATER.has(grid.getType(x, y + 1))) {
      // Move sideways
      if (WATER.has(grid.getType(x + dir, y)) || grid.isEmpty(x + dir, y)) {
        grid.swapCells(x, y, x + dir, y);
      } else {
        cell.dir = -dir;
      }
    } else if (grid.isEmpty(x, y + 1)) {
      grid.swapCells(x, y, x, y + 1);
    }
  },
});

// ── PLANE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plane', name: 'Plane', category: 'vehicles',
  color: '#dddddd', density: 0.3, state: 'solid',
  desc: 'Flies fast. Leaves an exhaust trail.',
  tags: ['vehicle', 'flying', 'fast'],
  burnAt: 500,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100) - 0.1;
    if (cell.energy <= 0) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 8, 1.2), 10);
      return;
    }

    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.2) ? (h.chance(0.5) ? -1 : 1) : 0;

    if (grid.isEmpty(x + dir * 2, y + dy)) {
      // Fast — move 2 cells
      grid.swapCells(x, y, x + dir, y + dy);
      // Exhaust
      if (grid.isEmpty(x - dir, y)) grid.setCell(x - dir, y, 'smoke');
    } else {
      // Crash
      const hit = grid.getType(x + dir, y);
      if (hit && hit !== 'cloud' && hit !== 'smoke') {
        grid.clearCell(x, y);
        setTimeout(() => h.explode(x, y, 8, 1.2), 10);
      } else {
        cell.dir = -dir;
      }
    }
  },
});

// ── HELICOPTER ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'helicopter', name: 'Helicopter', category: 'vehicles',
  color: '#888866', density: 0.5, state: 'solid',
  desc: 'Hovers. Can move in any direction.',
  tags: ['vehicle', 'flying', 'hover'],
  burnAt: 400,

  tick(x, y, grid, h) {
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.3) ? (h.chance(0.5) ? -1 : 1) : 0;

    if (grid.isEmpty(x + dir, y + dy)) {
      grid.swapCells(x, y, x + dir, y + dy);
    } else {
      cell.dir = -dir;
    }
    // Downwash
    if (h.chance(0.2) && !grid.isEmpty(x, y + 2)) {
      const below = grid.getType(x, y + 1);
      if (below === 'smoke' || below === 'steam' || below === 'empty') {
        // Push things below away
      }
    }
  },
});

// ── TANK ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'tank', name: 'Tank', category: 'vehicles',
  color: '#446633', density: 5.0, state: 'solid',
  desc: 'Heavy. Crushes through most materials.',
  tags: ['vehicle', 'land', 'heavy', 'destructive'],
  burnAt: 700,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    const CRUSH = new Set(['sand','dirt','plant','person','zombie','ant','brick','glass','wood','concrete']);
    const ahead = grid.getType(x + dir, y);
    if (ahead && CRUSH.has(ahead)) {
      grid.clearCell(x + dir, y);
    }
    if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
    else cell.dir = -dir;
  },
});

// ── UFO ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ufo', name: 'UFO', category: 'vehicles',
  color: (cell, x, y, frame) => {
    const cols = ['#88ffaa','#aaffcc','#66ee88','#ccffaa'];
    return cols[(frame + x) % cols.length];
  },
  density: 0.2, state: 'solid',
  desc: 'Alien craft. Beams up particles.',
  tags: ['vehicle', 'flying', 'alien'],

  tick(x, y, grid, h, frame) {
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.3) ? (h.chance(0.5) ? -1 : 1) : 0;

    if (grid.isEmpty(x + dir, y + dy)) grid.swapCells(x, y, x + dir, y + dy);
    else cell.dir = -dir;

    // Beam up particles below
    if (frame % 60 === 0 && h.chance(0.3)) {
      for (let i = 1; i <= 5; i++) {
        const btype = grid.getType(x, y + i);
        if (btype && btype !== 'empty') {
          // Teleport up to UFO
          grid.clearCell(x, y + i);
          break;
        }
      }
    }
  },
});

window.PW_setLoadProgress?.(84, 'Vehicles loaded...');
