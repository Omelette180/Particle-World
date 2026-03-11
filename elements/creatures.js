/**
 * PARTICLE WORLD v2.0 — elements/creatures.js
 * Person, zombie, ant, fish, bird, worm, rat, snake, spider, bat, frog, wolf, bear, etc.
 */

// ── PERSON ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'person', name: 'Person', category: 'creatures',
  color: '#f5c5a0', density: 1.0, state: 'solid',
  desc: 'Walks around. Avoids danger.',
  tags: ['creature', 'human', 'alive'],
  burnAt: 300, heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100);

    // Gravity
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }

    // Walk
    if (h.chance(0.3)) {
      const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
      cell.dir = dir;
      if (grid.isEmpty(x + dir, y) && !grid.isEmpty(x + dir, y + 1)) {
        grid.swapCells(x, y, x + dir, y);
      } else if (grid.isEmpty(x + dir, y - 1) && grid.isEmpty(x + dir, y)) {
        grid.swapCells(x, y, x + dir, y - 1); // step up
      } else {
        cell.dir = -dir; // turn around
      }
    }

    // Die in fire/acid/lava
    const LETHAL = new Set(['fire','lava','acid','plasma','wildfire']);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (LETHAL.has(grid.getType(nx, ny)) && h.chance(0.1)) {
        grid.setCell(x, y, 'blood');
        return;
      }
    }

    // Turn into zombie if touching zombie
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'zombie' && h.chance(0.02)) {
        grid.setCell(x, y, 'zombie');
        return;
      }
    }
  },
});

// ── ZOMBIE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'zombie', name: 'Zombie', category: 'creatures',
  color: '#336633', density: 1.0, state: 'solid',
  desc: 'Chases and infects people.',
  tags: ['creature', 'undead', 'dangerous'],
  burnAt: 300, heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }

    // Hunt for person
    let targetX = -1, targetY = -1, minDist = 999;
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        if (grid.getType(x+dx, y+dy) === 'person') {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < minDist) { minDist = d; targetX = x+dx; targetY = y+dy; }
        }
      }
    }

    if (h.chance(0.3)) {
      if (targetX >= 0) {
        const dx = Math.sign(targetX - x);
        if (grid.isEmpty(x + dx, y)) grid.swapCells(x, y, x + dx, y);
        else if (grid.isEmpty(x + dx, y - 1)) grid.swapCells(x, y, x + dx, y - 1);
      } else {
        const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
        cell.dir = dir;
        if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
        else cell.dir = -dir;
      }
    }
  },
});

// ── ANT ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ant', name: 'Ant', category: 'creatures',
  color: '#221100', density: 0.8, state: 'solid',
  desc: 'Digs through sand and dirt. Works in groups.',
  tags: ['creature', 'insect', 'digger'],
  burnAt: 200, heatConductivity: 0.05,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.5)) return;

    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    const DIG = new Set(['sand','dirt','gravel','mud','coal']);

    // Dig or walk
    if (grid.isEmpty(x + dir, y)) {
      grid.swapCells(x, y, x + dir, y);
    } else if (DIG.has(grid.getType(x + dir, y))) {
      grid.clearCell(x + dir, y);
      grid.swapCells(x, y, x + dir, y);
    } else {
      cell.dir = -dir;
      if (grid.isEmpty(x, y - 1)) grid.swapCells(x, y, x, y - 1);
    }
  },
});

// ── FISH ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fish', name: 'Fish', category: 'creatures',
  color: '#4488cc', density: 1.0, state: 'solid',
  desc: 'Swims in water. Dies out of water.',
  tags: ['creature', 'aquatic', 'alive'],

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const WATER = new Set(['water','seawater','saltwater']);

    // Check if in water
    let inWater = false;
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (WATER.has(grid.getType(nx, ny))) { inWater = true; break; }
    }

    if (!inWater) {
      // Suffocate
      cell.energy = (cell.energy ?? 60) - 1;
      if (cell.energy <= 0) { grid.setCell(x, y, 'blood'); return; }
      // Fall
      if (h.fallBelow(x, y)) return;
      return;
    }

    // Swim
    if (h.chance(0.4)) {
      const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
      cell.dir = dir;
      const dy = h.chance(0.5) ? (h.chance(0.5) ? -1 : 1) : 0;
      const nx = x + dir, ny2 = y + dy;
      if (WATER.has(grid.getType(nx, ny2))) {
        grid.swapCells(x, y, nx, ny2);
      } else if (WATER.has(grid.getType(nx, y))) {
        grid.swapCells(x, y, nx, y);
      } else {
        cell.dir = -dir;
      }
    }
  },
});

// ── BIRD ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bird', name: 'Bird', category: 'creatures',
  color: '#dd9933', density: 0.3, state: 'solid',
  desc: 'Flies around. Avoids obstacles.',
  tags: ['creature', 'flying', 'alive'],

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!h.chance(0.5)) return;

    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.3) ? (h.chance(0.5) ? -1 : 1) : 0;
    const nx = x + dir, ny2 = y + dy;

    if (grid.isEmpty(nx, ny2)) {
      grid.swapCells(x, y, nx, ny2);
    } else if (grid.isEmpty(nx, y)) {
      grid.swapCells(x, y, nx, y);
    } else {
      cell.dir = -dir;
      if (grid.isEmpty(x, y - 1)) grid.swapCells(x, y, x, y - 1);
    }
  },
});

// ── WORM ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'worm', name: 'Worm', category: 'creatures',
  color: '#cc7755', density: 1.0, state: 'solid',
  desc: 'Burrows through soil. Turns dirt into fertile ground.',
  tags: ['creature', 'burrower', 'alive'],
  burnAt: 200,

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    const BURROW = new Set(['dirt','sand','mud','soil']);
    const DIRS = [[dir,0],[0,1],[0,-1],[-dir,0]];

    for (const [dx, dy] of DIRS) {
      const nx = x+dx, ny = y+dy;
      if (grid.isEmpty(nx, ny) || BURROW.has(grid.getType(nx, ny))) {
        if (BURROW.has(grid.getType(nx, ny))) {
          // Leave nutrient behind
          grid.setCell(nx, ny, 'empty');
        }
        grid.swapCells(x, y, nx, ny);
        return;
      }
    }
    cell.dir = -dir;
  },
});

// ── RAT ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'rat', name: 'Rat', category: 'creatures',
  color: '#887766', density: 0.9, state: 'solid',
  desc: 'Scurries around. Very fast.',
  tags: ['creature', 'mammal', 'alive'],
  burnAt: 250,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.7)) return;

    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    if (grid.isEmpty(x + dir, y)) {
      grid.swapCells(x, y, x + dir, y);
    } else if (grid.isEmpty(x + dir, y - 1)) {
      grid.swapCells(x, y, x + dir, y - 1);
    } else {
      cell.dir = -dir;
    }
  },
});

// ── SNAKE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'snake', name: 'Snake', category: 'creatures',
  color: '#446622', density: 1.0, state: 'solid',
  desc: 'Slithers along the ground. Eats small creatures.',
  tags: ['creature', 'reptile', 'alive'],
  burnAt: 250,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.25)) return;

    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    // Eat small creatures
    const PREY = new Set(['ant','worm','rat','fish']);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (PREY.has(grid.getType(nx, ny)) && h.chance(0.1)) {
        grid.clearCell(nx, ny);
        return;
      }
    }

    if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
    else cell.dir = -dir;
  },
});

// ── SPIDER ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'spider', name: 'Spider', category: 'creatures',
  color: '#111111', density: 0.5, state: 'solid',
  desc: 'Climbs on any surface. Weaves webs.',
  tags: ['creature', 'insect', 'alive', 'climber'],
  burnAt: 200,

  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);

    // Can move in any direction (climbs)
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,-1]];
    h.shuffle(dirs);
    for (const [dx, dy] of dirs) {
      if (grid.isEmpty(x+dx, y+dy)) {
        grid.swapCells(x, y, x+dx, y+dy);
        break;
      }
    }

    // Weave web
    if (h.chance(0.005) && grid.isEmpty(x, y + 1)) {
      grid.setCell(x, y + 1, 'spiderweb');
    }
  },
});

// ── BAT ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bat', name: 'Bat', category: 'creatures',
  color: '#332244', density: 0.2, state: 'solid',
  desc: 'Flies in darkness. Hangs from ceilings.',
  tags: ['creature', 'flying', 'nocturnal'],
  burnAt: 200,

  tick(x, y, grid, h) {
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    const dy = h.chance(0.5) ? -1 : (h.chance(0.5) ? 0 : 1);
    if (grid.isEmpty(x + dir, y + dy)) grid.swapCells(x, y, x + dir, y + dy);
    else if (grid.isEmpty(x - dir, y + dy)) { cell.dir = -dir; grid.swapCells(x, y, x - dir, y + dy); }
  },
});

// ── FROG ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'frog', name: 'Frog', category: 'creatures',
  color: '#44aa44', density: 0.9, state: 'solid',
  desc: 'Jumps around. Lives near water.',
  tags: ['creature', 'amphibian', 'alive'],
  burnAt: 250,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.1)) return;

    // Jump
    const jx = x + h.randInt(-3, 3);
    const jy = y - h.randInt(1, 3);
    if (grid.inBounds(jx, jy) && grid.isEmpty(jx, jy)) {
      grid.swapCells(x, y, jx, jy);
    }
  },
});

// ── WOLF ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wolf', name: 'Wolf', category: 'creatures',
  color: '#888888', density: 1.0, state: 'solid',
  desc: 'Hunts people and smaller creatures.',
  tags: ['creature', 'mammal', 'predator'],
  burnAt: 300,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.4)) return;

    const cell = grid.getCell(x, y);
    const PREY = new Set(['person','rat','frog','bird','snake']);

    // Hunt
    let tx = -1, ty = -1, best = 999;
    for (let dy = -10; dy <= 10; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        if (PREY.has(grid.getType(x+dx, y+dy))) {
          const d = Math.abs(dx)+Math.abs(dy);
          if (d < best) { best = d; tx = x+dx; ty = y+dy; }
        }
      }
    }

    const dir = tx >= 0 ? Math.sign(tx - x) : (cell.dir || (h.chance(0.5) ? 1 : -1));
    cell.dir = dir || 1;

    if (grid.isEmpty(x + cell.dir, y)) grid.swapCells(x, y, x + cell.dir, y);
    else if (grid.isEmpty(x + cell.dir, y - 1)) grid.swapCells(x, y, x + cell.dir, y - 1);
    else cell.dir = -cell.dir;
  },
});

// ── BEAR ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bear', name: 'Bear', category: 'creatures',
  color: '#886644', density: 2.0, state: 'solid',
  desc: 'Large and slow. Very destructive.',
  tags: ['creature', 'mammal', 'large'],
  burnAt: 350,

  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (!h.chance(0.15)) return;

    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;

    // Smash through weak materials
    const SMASH = new Set(['sand','dirt','plant','wood','brick','glass']);
    if (SMASH.has(grid.getType(x + dir, y))) {
      grid.clearCell(x + dir, y);
    }
    if (grid.isEmpty(x + dir, y)) grid.swapCells(x, y, x + dir, y);
    else cell.dir = -dir;
  },
});

// ── SPIDERWEB ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'spiderweb', name: 'Spider Web', category: 'creatures',
  color: '#ddddcc', density: 0.1, state: 'solid',
  desc: 'Traps creatures that walk into it.',
  tags: ['organic', 'trap', 'sticky'],
  burnAt: 150,

  tick(x, y, grid, h) {
    // Trap creatures
    const CREATURES = new Set(['person','ant','rat','frog','bird','worm','snake']);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (CREATURES.has(grid.getType(nx, ny)) && h.chance(0.05)) {
        // Slow them down by marking updated
        grid.markUpdated(nx, ny);
      }
    }
  },
});

window.PW_setLoadProgress?.(60, 'Creatures loaded...');
