/**
 * PARTICLE WORLD v2.0 — elements/nature.js
 * Plant, seed, fungus, algae, coral, kelp, vine, cactus, tree, moss, flower, etc.
 */

// ── PLANT ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plant', name: 'Plant', category: 'nature',
  color: '#228822', density: 0.5, state: 'solid',
  desc: 'Grows upward near water. Burns easily.',
  tags: ['organic', 'nature', 'grows', 'flammable'],
  burnAt: 200, heatConductivity: 0.04,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100);

    // Grow upward
    if (h.chance(0.002) && grid.isEmpty(x, y - 1)) {
      // Only grow if near water or dirt
      let canGrow = false;
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const t = grid.getType(nx, ny);
        if (t === 'water' || t === 'dirt' || t === 'mud') { canGrow = true; break; }
      }
      if (canGrow) grid.setCell(x, y - 1, 'plant');
    }

    // Spread seeds
    if (h.chance(0.0005) && grid.isEmpty(x + h.randInt(-3,3), y + 1)) {
      const sx = x + h.randInt(-2, 2);
      if (grid.isEmpty(sx, y + 1)) grid.setCell(sx, y + 1, 'seed');
    }
  },
});

// ── SEED ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'seed', name: 'Seed', category: 'nature',
  color: '#8b6914', density: 1.0, state: 'solid',
  desc: 'Falls to ground, germinates near water.',
  tags: ['organic', 'nature', 'grows'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    const cell = grid.getCell(x, y);
    // Germinate near water
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'water' && h.chance(0.005)) {
        grid.setCell(x, y, 'plant');
        return;
      }
    }
  },
});

// ── FUNGUS ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fungus', name: 'Fungus', category: 'nature',
  color: '#886633', density: 0.4, state: 'solid',
  desc: 'Spreads in dark, moist areas. Produces spores.',
  tags: ['organic', 'nature', 'spreads'],
  burnAt: 150, heatConductivity: 0.02,

  tick(x, y, grid, h) {
    // Spread slowly
    if (h.chance(0.001)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        const ntype = grid.getType(nx, ny);
        if (ntype === 'dirt' || ntype === 'wood' || ntype === 'empty') {
          if (ntype === 'empty' && h.chance(0.3)) continue;
          grid.setCell(nx, ny, 'fungus');
          return;
        }
      }
    }
    // Produce spores
    if (h.chance(0.0005) && grid.isEmpty(x, y - 1)) {
      grid.setCell(x, y - 1, 'spore');
    }
  },
});

// ── SPORE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'spore', name: 'Spore', category: 'nature',
  color: '#aa8855', density: 0.02, state: 'gas',
  desc: 'Drifts in air. Grows into fungus on landing.',
  tags: ['organic', 'gas', 'nature'],
  heatConductivity: 0.01,

  tick(x, y, grid, h) {
    h.riseUp(x, y);
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 40) - 0.2;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    // Land on surfaces
    if (!grid.isEmpty(x, y + 1) && h.chance(0.05)) {
      grid.setCell(x, y, 'fungus');
    }
  },
});

// ── ALGAE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'algae', name: 'Algae', category: 'nature',
  color: '#225522', density: 0.9, state: 'solid',
  desc: 'Grows in water. Spreads fast.',
  tags: ['organic', 'aquatic', 'grows'],
  burnAt: 200, heatConductivity: 0.03,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.01;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }

    let inWater = false;
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (ntype === 'water' || ntype === 'seawater') inWater = true;
    }
    if (!inWater) { cell.energy -= 2; return; }

    // Spread
    if (h.chance(0.002)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        if ((grid.getType(nx,ny) === 'water' || grid.getType(nx,ny) === 'seawater') && h.chance(0.2)) {
          grid.setCell(nx, ny, 'algae');
          return;
        }
      }
    }
  },
});

// ── CORAL ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'coral', name: 'Coral', category: 'nature',
  color: (cell, x, y) => {
    const cols = ['#ff6688','#ff4466','#ff8866','#ffaa44','#ee5577'];
    return cols[(x * 3 + y * 5) % cols.length];
  },
  density: 1.5, state: 'solid',
  desc: 'Builds reefs in salt water. Colorful.',
  tags: ['organic', 'aquatic', 'structure'],
  heatConductivity: 0.05,

  tick(x, y, grid, h) {
    // Grow near seawater
    if (h.chance(0.0005)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        const ntype = grid.getType(nx, ny);
        if (ntype === 'seawater' || ntype === 'water') {
          grid.setCell(nx, ny, 'coral');
          return;
        }
      }
    }
  },
});

// ── KELP ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'kelp', name: 'Kelp', category: 'nature',
  color: '#1a6622', density: 0.95, state: 'solid',
  desc: 'Underwater plant. Grows tall.',
  tags: ['organic', 'aquatic', 'grows'],
  burnAt: 200, heatConductivity: 0.03,

  tick(x, y, grid, h) {
    if (h.chance(0.001) && (grid.getType(x, y - 1) === 'water' || grid.getType(x, y - 1) === 'seawater')) {
      grid.setCell(x, y - 1, 'kelp');
    }
  },
});

// ── VINE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'vine', name: 'Vine', category: 'nature',
  color: '#336622', density: 0.4, state: 'solid',
  desc: 'Grows downward and sideways. Clings to surfaces.',
  tags: ['organic', 'nature', 'climber'],
  burnAt: 200, heatConductivity: 0.03,

  tick(x, y, grid, h) {
    if (h.chance(0.001)) {
      const dirs = [[0,1],[1,0],[-1,0]]; // down and sideways
      for (const [dx, dy] of h.shuffle(dirs)) {
        if (grid.isEmpty(x+dx, y+dy)) {
          grid.setCell(x+dx, y+dy, 'vine');
          return;
        }
      }
    }
  },
});

// ── CACTUS ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'cactus', name: 'Cactus', category: 'nature',
  color: '#336633', density: 0.6, state: 'solid',
  desc: 'Desert plant. Spiny. Stores water.',
  tags: ['organic', 'nature', 'desert'],
  burnAt: 300, heatConductivity: 0.03,

  tick(x, y, grid, h) {
    // Grow upward in sand/dirt
    if (h.chance(0.0003) && grid.isEmpty(x, y - 1)) {
      const below = grid.getType(x, y + 1);
      if (below === 'sand' || below === 'dirt') {
        grid.setCell(x, y - 1, 'cactus');
      }
    }
  },
});

// ── MUSHROOM ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mushroom', name: 'Mushroom', category: 'nature',
  color: '#ddaa88', density: 0.3, state: 'solid',
  desc: 'Grows on wood and dirt. Edible.',
  tags: ['organic', 'nature', 'fungi'],
  burnAt: 200, heatConductivity: 0.02,

  tick(x, y, grid, h) {
    if (h.chance(0.0004)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        const ntype = grid.getType(nx, ny);
        if (ntype === 'dirt' || ntype === 'wood') {
          grid.setCell(nx, ny, 'mushroom');
          return;
        }
      }
    }
  },
});

// ── MOSS ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'moss', name: 'Moss', category: 'nature',
  color: '#3a6622', density: 0.2, state: 'solid',
  desc: 'Covers stone and wood in moist conditions.',
  tags: ['organic', 'nature', 'spreads'],
  burnAt: 180, heatConductivity: 0.03,

  tick(x, y, grid, h) {
    if (h.chance(0.0005)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        const ntype = grid.getType(nx, ny);
        if ((ntype === 'stone' || ntype === 'wood' || ntype === 'brick') && h.chance(0.3)) {
          // Check if there's moisture nearby
          let wet = false;
          for (const [nx2, ny2] of h.neighbors4(nx, ny)) {
            if (grid.getType(nx2,ny2) === 'water') { wet = true; break; }
          }
          if (wet) { grid.setCell(nx, ny, 'moss'); return; }
        }
      }
    }
  },
});

// ── FLOWER ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'flower', name: 'Flower', category: 'nature',
  color: (cell, x, y) => {
    const cols = ['#ff88aa','#ffaacc','#ffcc44','#ff6699','#ff44aa','#ffbb22'];
    return cols[(x * 7 + y * 3) % cols.length];
  },
  density: 0.2, state: 'solid',
  desc: 'Blooms in dirt near water. Attracts bees.',
  tags: ['organic', 'nature', 'beautiful'],
  burnAt: 150, heatConductivity: 0.02,

  tick(x, y, grid, h) {
    // Wilt without water
    const cell = grid.getCell(x, y);
    let hasWater = false;
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'water') { hasWater = true; break; }
    }
    cell.energy = (cell.energy ?? 100) + (hasWater ? 0.1 : -0.05);
    if (cell.energy <= 0) grid.setCell(x, y, 'dirt');
  },
});

// ── TREE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'tree', name: 'Tree', category: 'nature',
  color: '#5a3010', density: 0.8, state: 'solid',
  desc: 'Large wooden structure. Burns slowly.',
  tags: ['organic', 'nature', 'large', 'flammable'],
  burnAt: 250, heatConductivity: 0.05,

  tick(x, y, grid, h) {
    // Occasionally drop leaves (plant)
    if (h.chance(0.0002) && grid.isEmpty(x + h.randInt(-2,2), y + 1)) {
      const lx = x + h.randInt(-2, 2);
      if (grid.isEmpty(lx, y + 1)) grid.setCell(lx, y + 1, 'plant');
    }
  },
});

// ── BACTERIA ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bacteria', name: 'Bacteria', category: 'nature',
  color: '#88cc44', density: 1.0, state: 'solid',
  desc: 'Microscopic life. Multiplies fast, consumes organics.',
  tags: ['organic', 'microscopic', 'spreads'],
  burnAt: 120, heatConductivity: 0.02,

  tick(x, y, grid, h) {
    const ORGANIC = new Set(['plant','wood','flesh','bone','blood','dirt','food']);
    // Consume neighbors and spread
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (ORGANIC.has(ntype) && h.chance(0.005)) {
        grid.setCell(nx, ny, 'bacteria');
        return;
      }
      if (grid.isEmpty(nx, ny) && h.chance(0.002)) {
        grid.setCell(nx, ny, 'bacteria');
        return;
      }
    }
    // Die off after a while
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 0.05;
    if (cell.energy <= 0) grid.clearCell(x, y);
  },
});

// ── VIRUS ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'virus', name: 'Virus', category: 'nature',
  color: '#cc33cc', density: 1.0, state: 'solid',
  desc: 'Converts everything it touches into virus.',
  tags: ['organic', 'dangerous', 'spreads'],
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    const IMMUNE = new Set(['wall', 'virus', 'empty', 'glass', 'rubber']);
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (!ntype || IMMUNE.has(ntype)) continue;
      if (h.chance(0.02)) {
        grid.setCell(nx, ny, 'virus');
        return;
      }
    }
    // Slow decay
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 60) - 0.02;
    if (cell.energy <= 0) grid.clearCell(x, y);
  },
});

// ── FLESH ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'flesh', name: 'Flesh', category: 'nature',
  color: '#dd8877', density: 1.0, state: 'solid',
  desc: 'Biological tissue. Rots over time.',
  tags: ['organic', 'biological', 'rots'],
  burnAt: 200, heatConductivity: 0.08,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 100) - 0.02;
    if (cell.energy <= 0) grid.setCell(x, y, 'dirt');
  },
});

// ── BONE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'bone', name: 'Bone', category: 'nature',
  color: '#f0e8cc', density: 1.8, state: 'solid',
  desc: 'Structural biological material.',
  tags: ['organic', 'biological', 'hard'],
  burnAt: 500, heatConductivity: 0.06,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

window.PW_setLoadProgress?.(52, 'Nature loaded...');
