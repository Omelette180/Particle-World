/**
 * PARTICLE WORLD v2.0 — elements/solids.js
 * Metal, concrete, brick, rubber, crystal, steel, obsidian, etc.
 */

// ── METAL ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'metal', name: 'Metal', category: 'solids',
  color: '#8899aa', density: 3.0, state: 'solid',
  desc: 'Conducts heat and electricity. Very strong.',
  tags: ['solid', 'metal', 'conductive'],
  meltAt: 1300, meltsInto: 'molten_iron',
  heatConductivity: 0.45,
  tick(x, y, grid, h) {
    if (!grid.isEmpty(x, y + 1)) return;
    grid.swapCells(x, y, x, y + 1);
  },
});

// ── STEEL ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'steel', name: 'Steel', category: 'solids',
  color: '#aabbcc', density: 4.0, state: 'solid',
  desc: 'Stronger than metal. Resists high temperatures.',
  tags: ['solid', 'metal', 'strong'],
  meltAt: 1500, meltsInto: 'molten_iron',
  heatConductivity: 0.5,
  tick(x, y, grid, h) {},
});

// ── CONCRETE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'concrete', name: 'Concrete', category: 'solids',
  color: '#888880', density: 2.5, state: 'solid',
  desc: 'Hard building material. Blast resistant.',
  tags: ['solid', 'structure', 'heavy'],
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── BRICK ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'brick', name: 'Brick', category: 'solids',
  color: '#aa4422', density: 2.0, state: 'solid',
  desc: 'Classic construction material.',
  tags: ['solid', 'structure', 'natural'],
  meltAt: 1200, meltsInto: 'lava',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── RUBBER ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'rubber', name: 'Rubber', category: 'solids',
  color: '#222222', density: 1.1, state: 'solid',
  desc: 'Insulates electricity. Bounces.',
  tags: ['solid', 'insulator', 'elastic'],
  burnAt: 300, heatConductivity: 0.01,
  tick(x, y, grid, h) {},
});

// ── CRYSTAL ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'crystal', name: 'Crystal', category: 'solids',
  color: (cell, x, y, frame) => {
    const cols = ['#88eeff','#aaffee','#66ddff','#bbffee','#44ccff'];
    return cols[(x * 3 + y * 2) % cols.length];
  },
  density: 2.5, state: 'solid',
  desc: 'Grows slowly. Refracts light beautifully.',
  tags: ['solid', 'mineral', 'grows'],
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    // Slowly grows to adjacent empty cells
    if (h.chance(0.0002)) {
      for (const [nx, ny] of h.neighbors4r(x, y)) {
        if (grid.isEmpty(nx, ny)) {
          grid.setCell(nx, ny, 'crystal');
          return;
        }
      }
    }
  },
});

// ── OBSIDIAN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'obsidian', name: 'Obsidian', category: 'solids',
  color: '#110011', density: 2.8, state: 'solid',
  desc: 'Volcanic glass. Very hard, very dark.',
  tags: ['solid', 'volcanic', 'hard'],
  meltAt: 1100, meltsInto: 'lava',
  heatConductivity: 0.05,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── SPONGE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'sponge', name: 'Sponge', category: 'solids',
  color: '#ddcc44', density: 0.3, state: 'solid',
  desc: 'Absorbs liquids. Squeeze to release.',
  tags: ['solid', 'absorbent', 'organic'],
  heatConductivity: 0.03,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    // Absorb nearby liquids
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const ntype = grid.getType(nx, ny);
      const ndef  = ElementRegistry.get(ntype);
      if (ndef?.state === 'liquid' && (cell.energy ?? 0) < 5) {
        grid.clearCell(nx, ny);
        cell.energy = (cell.energy ?? 0) + 1;
        return;
      }
    }
    // Release when full
    if ((cell.energy ?? 0) >= 5 && h.chance(0.001)) {
      grid.setCell(x, y, 'water');
    }
  },
});

// ── BASALT ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'basalt', name: 'Basalt', category: 'solids',
  color: '#2a2a2a', density: 2.9, state: 'solid',
  desc: 'Dense volcanic rock.',
  tags: ['solid', 'volcanic', 'heavy'],
  meltAt: 1200, meltsInto: 'magma',
  heatConductivity: 0.07,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── QUARTZ ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'quartz', name: 'Quartz', category: 'solids',
  color: '#f5f0ee', density: 2.6, state: 'solid',
  desc: 'Piezoelectric crystal. Generates electricity under pressure.',
  tags: ['solid', 'mineral', 'crystal'],
  heatConductivity: 0.12,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── DIAMOND ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'diamond', name: 'Diamond', category: 'solids',
  color: (cell, x, y, frame) => {
    const cols = ['#ffffff','#eeffff','#ccffff','#ddeeff','#eeeeff'];
    return cols[(frame + x * 7 + y * 3) % cols.length];
  },
  density: 3.5, state: 'solid',
  desc: 'Hardest natural material. Almost indestructible.',
  tags: ['solid', 'mineral', 'rare', 'hard'],
  flavor: 'A girl\'s best friend.',
  heatConductivity: 20.0, // diamond is an insane heat conductor
  tick(x, y, grid, h) {},
});

// ── MAGNET ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'magnet', name: 'Magnet', category: 'solids',
  color: '#cc2222', density: 3.5, state: 'solid',
  desc: 'Attracts metal particles.',
  tags: ['solid', 'magnetic', 'tech'],
  heatConductivity: 0.3,

  tick(x, y, grid, h) {
    const METALS = new Set(['metal','steel','iron','shrapnel','mercury']);
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (!grid.inBounds(nx, ny)) continue;
        if (METALS.has(grid.getType(nx, ny)) && h.chance(0.02)) {
          // Pull metal one step closer
          const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
          const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
          if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) {
            grid.swapCells(nx, ny, mx, my);
          }
        }
      }
    }
  },
});

// ── MIRROR ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mirror', name: 'Mirror', category: 'solids',
  color: '#ddeeff', density: 2.5, state: 'solid',
  desc: 'Reflects lasers and energy.',
  tags: ['solid', 'reflective', 'tech'],
  heatConductivity: 0.15,
  tick(x, y, grid, h) {},
});

// ── CERAMIC ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ceramic', name: 'Ceramic', category: 'solids',
  color: '#e8d8b0', density: 2.0, state: 'solid',
  desc: 'Fired clay. Heat resistant and brittle.',
  tags: ['solid', 'heat-resistant', 'brittle'],
  heatConductivity: 0.02,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── CLAY ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'clay', name: 'Clay', category: 'solids',
  color: '#bb8855', density: 1.8, state: 'solid',
  desc: 'Soft mineral. Hardens when fired.',
  tags: ['solid', 'natural', 'moldable'],
  meltAt: 800, meltsInto: 'ceramic',
  heatConductivity: 0.06,
  tick(x, y, grid, h) {
    if (!h.chance(0.3)) return;
    if (h.fallBelow(x, y)) return;
  },
});

// ── CHALK ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'chalk', name: 'Chalk', category: 'solids',
  color: '#f0f0e8', density: 1.2, state: 'solid',
  desc: 'Soft white powder. Dissolves in water.',
  tags: ['powder', 'soft', 'soluble'],
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (grid.getType(nx, ny) === 'water' && h.chance(0.01)) {
        grid.clearCell(x, y);
        return;
      }
    }
  },
});

// ── PUMICE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'pumice', name: 'Pumice', category: 'solids',
  color: '#ccbbaa', density: 0.6, state: 'solid',
  desc: 'Porous volcanic rock. So light it floats on water.',
  tags: ['solid', 'volcanic', 'light', 'porous'],
  heatConductivity: 0.02,
  tick(x, y, grid, h) {
    // Float on water
    if (grid.getType(x, y + 1) === 'water') {
      // Stay on top — don't sink
      return;
    }
    if (h.fallBelow(x, y)) return;
  },
});

// ── SANDSTONE ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'sandstone', name: 'Sandstone', category: 'solids',
  color: '#d4a868', density: 2.0, state: 'solid',
  desc: 'Compressed sand. Soft but stable.',
  tags: ['solid', 'natural', 'sedimentary'],
  meltAt: 1400, meltsInto: 'molten_glass',
  heatConductivity: 0.06,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

// ── FLINT ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'flint', name: 'Flint', category: 'solids',
  color: '#555544', density: 2.6, state: 'solid',
  desc: 'Strikes sparks when hit. Can start fires.',
  tags: ['solid', 'mineral', 'fire-starter'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    // Spark when another solid hits it
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      const ndef  = ElementRegistry.get(ntype);
      if (ndef?.state === 'solid' && ntype !== 'flint' && h.chance(0.002)) {
        // Spawn spark
        if (grid.isEmpty(x, y - 1)) grid.setCell(x, y - 1, 'ember');
      }
    }
  },
});

// ── LEAD ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'lead_pb', name: 'Lead', category: 'solids',
  color: '#666677', density: 5.0, state: 'solid',
  desc: 'Very dense soft metal. Radiation shielding.',
  tags: ['solid', 'metal', 'heavy', 'shielding'],
  meltAt: 327, meltsInto: 'molten_iron',
  heatConductivity: 0.35,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y + 1)) grid.swapCells(x, y, x, y + 1);
  },
});

window.PW_setLoadProgress?.(44, 'Solids loaded...');
