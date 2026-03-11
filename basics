/**
 * PARTICLE WORLD v2.0 — elements/basics.js
 * The fundamental elements: sand, water, stone, dirt, wall, wood, glass, gravel, salt, mud
 * Each element calls ElementRegistry.register({ ... })
 */

// ── SAND ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'sand',
  name:     'Sand',
  category: 'powders',
  color:    '#c8a84b',
  density:  1.5,
  state:    'solid',
  desc:     'Granular sediment that piles and slides.',
  tags:     ['powder', 'granular', 'natural'],
  flavor:   'The building block of deserts and hourglasses.',
  meltAt:   1600, meltsInto: 'molten_glass',
  heatConductivity: 0.05,

  tick(x, y, grid, h) {
    // Try to fall
    if (h.fallBelow(x, y)) return;

    // Wet sand behavior — absorbs water
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'water' && h.chance(0.02)) {
        grid.setCell(x, y, 'mud');
        grid.clearCell(nx, ny);
        return;
      }
    }
  },
});

// ── WATER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'water',
  name:     'Water',
  category: 'liquids',
  color:    '#1a6fa8',
  density:  1.0,
  state:    'liquid',
  desc:     'Flows and spreads. Freezes cold, boils hot.',
  tags:     ['liquid', 'natural', 'common'],
  flavor:   'The essence of life.',
  meltAt:   100,  meltsInto: 'steam',
  freezeAt: 0,    freezesInto: 'ice',
  heatConductivity: 0.18,

  tick(x, y, grid, h) {
    // Fall first
    if (h.fallBelow(x, y)) return;
    // Density swap with lighter liquids
    if (h.densitySwap(x, y)) return;
    // Flow sideways
    h.flowSideways(x, y, 4);
  },
});

// ── STONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'stone',
  name:     'Stone',
  category: 'solids',
  color:    '#6b6b6b',
  density:  3.0,
  state:    'solid',
  desc:     'Solid rock. Immovable unless acted upon.',
  tags:     ['solid', 'natural', 'heavy'],
  flavor:   'Has endured for millennia.',
  meltAt:   1400, meltsInto: 'lava',
  heatConductivity: 0.08,

  tick(x, y, grid, h) {
    // Stone is static — only physics is falling if unsupported
    if (!grid.inBounds(x, y + 1)) return;
    if (grid.isEmpty(x, y + 1)) {
      grid.swapCells(x, y, x, y + 1);
    }
  },
});

// ── DIRT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'dirt',
  name:     'Dirt',
  category: 'powders',
  color:    '#6b4226',
  density:  1.4,
  state:    'solid',
  desc:     'Loose soil. Can support plant growth.',
  tags:     ['powder', 'natural', 'organic'],
  flavor:   'Life emerges from it.',
  heatConductivity: 0.04,
  burnAt:   400,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    // Grow plant on top if water nearby
    const above = grid.getType(x, y - 1);
    if (above === 'empty' && h.chance(0.0003)) {
      let hasWater = false;
      for (const [nx, ny] of h.neighbors4(x, y)) {
        if (grid.getType(nx, ny) === 'water') { hasWater = true; break; }
      }
      if (hasWater) grid.setCell(x, y - 1, 'plant');
    }
  },
});

// ── WALL ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'wall',
  name:     'Wall',
  category: 'solids',
  color:    '#2a2a2a',
  density:  999,
  state:    'solid',
  desc:     'Indestructible barrier. Nothing passes through.',
  tags:     ['solid', 'immovable', 'structure'],
  flavor:   'Permanent.',
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    // Immovable — no tick needed
  },
});

// ── WOOD ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'wood',
  name:     'Wood',
  category: 'solids',
  color:    '#6b4422',
  density:  0.8,
  state:    'solid',
  desc:     'Burns slowly. Structural material.',
  tags:     ['solid', 'organic', 'flammable'],
  flavor:   'The original building material.',
  burnAt:   300,
  heatConductivity: 0.06,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const heat = cell?.heat ?? 0;

    // On fire
    if (heat >= 300 && h.chance(0.02)) {
      grid.setCell(x, y, 'fire');
      return;
    }

    // Spread heat/fire to neighbors
    if (heat > 200) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        const ntype = grid.getType(nx, ny);
        if (ntype === 'wood' && h.chance(0.005)) {
          h.addHeat(nx, ny, 50);
        }
      }
    }
  },
});

// ── GLASS ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'glass',
  name:     'Glass',
  category: 'solids',
  color:    '#a8d8ea',
  density:  2.5,
  state:    'solid',
  desc:     'Transparent solid made from sand.',
  tags:     ['solid', 'transparent', 'fragile'],
  flavor:   'Light passes through it.',
  meltAt:   800, meltsInto: 'molten_glass',
  heatConductivity: 0.07,

  tick(x, y, grid, h) {
    // Static
  },
});

// ── GRAVEL ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'gravel',
  name:     'Gravel',
  category: 'powders',
  color:    '#5a5a5a',
  density:  1.8,
  state:    'solid',
  desc:     'Coarse rock fragments. Falls faster than sand.',
  tags:     ['powder', 'natural', 'heavy'],
  flavor:   'Annoying to walk on.',
  meltAt:   1500, meltsInto: 'lava',
  heatConductivity: 0.06,

  tick(x, y, grid, h) {
    // Gravel falls straight down more often, slides less than sand
    if (grid.isEmpty(x, y + 1)) { grid.swapCells(x, y, x, y + 1); return; }
    if (h.chance(0.5)) {
      const d = h.chance(0.5) ? 1 : -1;
      if (grid.isEmpty(x + d, y + 1)) grid.swapCells(x, y, x + d, y + 1);
    }
  },
});

// ── SALT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'salt',
  name:     'Salt',
  category: 'powders',
  color:    '#e8e8e8',
  density:  1.6,
  state:    'solid',
  desc:     'Dissolves in water. Melts ice.',
  tags:     ['powder', 'mineral', 'soluble'],
  flavor:   'NaCl.',
  heatConductivity: 0.03,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;

    // Dissolve in water
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      if (ntype === 'water' && h.chance(0.02)) {
        grid.setCell(x, y, 'saltwater');
        grid.clearCell(nx, ny);
        return;
      }
      // Melt ice
      if (ntype === 'ice' && h.chance(0.01)) {
        grid.setCell(nx, ny, 'water');
        grid.clearCell(x, y);
        return;
      }
    }
  },
});

// ── MUD ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'mud',
  name:     'Mud',
  category: 'powders',
  color:    '#4a3220',
  density:  1.6,
  state:    'solid',
  desc:     'Wet dirt. Slow and sticky.',
  tags:     ['powder', 'natural', 'wet'],
  flavor:   'Sticks to everything.',
  heatConductivity: 0.07,

  tick(x, y, grid, h) {
    // Mud is slow — only moves occasionally
    if (!h.chance(0.3)) return;
    if (h.fallBelow(x, y)) return;

    // Dry out over time in heat
    const heat = h.getHeat(x, y);
    if (heat > 50 && h.chance(0.001)) {
      grid.setCell(x, y, 'dirt');
    }
  },
});

// ── ICE ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'ice',
  name:     'Ice',
  category: 'solids',
  color:    '#a8d4f5',
  density:  0.9,
  state:    'solid',
  desc:     'Frozen water. Melts when heated.',
  tags:     ['solid', 'cold', 'natural'],
  flavor:   'Cold to the touch.',
  meltAt:   1, meltsInto: 'water',
  heatConductivity: 0.15,

  tick(x, y, grid, h) {
    // Chill neighbors
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const nc = grid.getCell(nx, ny);
      if (nc && nc.heat > 0) {
        nc.heat = Math.max(0, nc.heat - 0.5);
      }
    }
  },
});

// ── COAL ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:       'coal',
  name:     'Coal',
  category: 'powders',
  color:    '#1a1a1a',
  density:  1.4,
  state:    'solid',
  desc:     'Burns long and hot. Classic fuel.',
  tags:     ['powder', 'fuel', 'flammable'],
  flavor:   'Black gold.',
  burnAt:   250,
  heatConductivity: 0.12,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    const heat = h.getHeat(x, y);
    if (heat >= 250) {
      // Burn — produce smoke and fire
      if (h.chance(0.03)) {
        grid.setCell(x, y, 'fire');
        if (grid.isEmpty(x, y - 1)) grid.setCell(x, y - 1, 'smoke');
      }
      // Spread heat
      for (const [nx, ny] of h.neighbors4(x, y)) {
        h.addHeat(nx, ny, 2);
      }
    }
  },
});

window.PW_setLoadProgress?.(5, 'Basics loaded...');
