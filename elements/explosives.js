/**
 * PARTICLE WORLD v2.0 — elements/explosives.js
 * TNT, C4, gunpowder, nitroglycerin, nuke, thermite, landmine, etc.
 */

// ── GUNPOWDER ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gunpowder', name: 'Gunpowder', category: 'explosives',
  color: '#686650', density: 1.4, state: 'solid',
  desc: 'Explodes when ignited. Spreads quickly.',
  tags: ['powder', 'explosive', 'flammable'],
  flavor: 'Handle with care.',
  burnAt: 180, heatConductivity: 0.08,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    if (h.getHeat(x, y) >= 180 && h.chance(0.3)) {
      setTimeout(() => {
        if (grid.inBounds(x, y)) h.explode(x, y, 5, 1.0);
      }, h.randInt(5, 40));
      grid.setCell(x, y, 'fire', { energy: 30 });
    }
  },
});

// ── TNT ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'tnt', name: 'TNT', category: 'explosives',
  color: '#cc2200', density: 1.6, state: 'solid',
  desc: 'Large explosion on ignition.',
  tags: ['solid', 'explosive', 'classic'],
  flavor: 'Boom.',
  burnAt: 250, heatConductivity: 0.05,

  tick(x, y, grid, h) {
    if (h.getHeat(x, y) >= 250 && h.chance(0.1)) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 14, 1.2), h.randInt(10, 60));
    }
  },
});

// ── C4 ────────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'c4', name: 'C4', category: 'explosives',
  color: '#ddddcc', density: 1.7, state: 'solid',
  desc: 'Plastic explosive. Stable until detonated.',
  tags: ['solid', 'explosive', 'military'],
  flavor: 'Needs a detonator.',
  heatConductivity: 0.02,

  tick(x, y, grid, h) {
    const heat = h.getHeat(x, y);
    // C4 needs very high heat — stable otherwise
    if (heat >= 400 && h.chance(0.2)) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 20, 1.5), h.randInt(20, 80));
    }
  },
});

// ── NITROGLYCERIN ─────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nitroglycerin', name: 'Nitroglycerin', category: 'explosives',
  color: '#ffeeaa', density: 1.6, state: 'liquid',
  desc: 'Extremely sensitive liquid explosive. Any impact detonates it.',
  tags: ['liquid', 'explosive', 'sensitive'],
  flavor: 'Do not shake.',
  burnAt: 50, heatConductivity: 0.05,

  tick(x, y, grid, h) {
    // Detonate on ANY movement or heat
    if (h.fallBelow(x, y)) {
      // Collision with ground — detonate
      if (h.chance(0.4)) {
        grid.clearCell(x, y);
        setTimeout(() => h.explode(x, y, 12, 1.3), 10);
        return;
      }
    }
    h.flowSideways(x, y, 1);
    if (h.getHeat(x, y) >= 50 && h.chance(0.5)) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 12, 1.3), 10);
    }
  },
});

// ── THERMITE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'thermite', name: 'Thermite', category: 'explosives',
  color: '#cc4400', density: 2.0, state: 'solid',
  desc: 'Burns at extreme temperature. Melts through metal.',
  tags: ['powder', 'incendiary', 'hot'],
  burnAt: 400, heatConductivity: 0.3,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    const heat = h.getHeat(x, y);
    if (heat >= 400) {
      // Burns extremely hot
      for (const [nx, ny] of h.neighbors4(x, y)) {
        h.addHeat(nx, ny, 100);
        // Melts metal
        const ntype = grid.getType(nx, ny);
        if (ntype === 'metal' || ntype === 'steel' || ntype === 'iron') {
          grid.setCell(nx, ny, 'molten_iron');
        }
      }
      if (h.chance(0.01)) grid.setCell(x, y, 'ash2');
    }
  },
});

// ── NUKE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nuke', name: 'Nuke', category: 'explosives',
  color: '#00ff44', density: 5.0, state: 'solid',
  desc: 'Nuclear warhead. Massive explosion with radiation.',
  tags: ['solid', 'nuclear', 'extreme'],
  flavor: 'The last resort.',
  burnAt: 600, heatConductivity: 0.1,

  tick(x, y, grid, h) {
    if (h.getHeat(x, y) >= 600 && h.chance(0.2)) {
      grid.clearCell(x, y);
      // Staggered massive explosion
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          h.explode(x, y, 30 + i * 8, 1.5);
          // Scatter radiation
          for (let j = 0; j < 20; j++) {
            const rx = x + h.randInt(-20, 20);
            const ry = y + h.randInt(-20, 20);
            if (grid.inBounds(rx, ry) && grid.isEmpty(rx, ry)) {
              grid.setCell(rx, ry, 'radiation');
            }
          }
        }, i * 100);
      }
    }
  },
});

// ── LANDMINE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'landmine', name: 'Landmine', category: 'explosives',
  color: '#448844', density: 999, state: 'solid',
  desc: 'Buried mine. Explodes when something lands on top.',
  tags: ['solid', 'explosive', 'trap'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    // Check if something landed on top
    const above = grid.getType(x, y - 1);
    if (above && above !== 'empty' && above !== 'landmine' && h.chance(0.3)) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 10, 1.1), 20);
    }
  },
});

// ── SULFUR ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'sulfur', name: 'Sulfur', category: 'explosives',
  color: '#ddcc00', density: 1.5, state: 'solid',
  desc: 'Yellow powder. Burns with blue flame.',
  tags: ['powder', 'flammable', 'chemical'],
  burnAt: 160, heatConductivity: 0.1,

  tick(x, y, grid, h) {
    if (h.fallBelow(x, y)) return;
    if (h.getHeat(x, y) >= 160 && h.chance(0.05)) {
      grid.setCell(x, y, 'fire', { energy: 40 });
      // Produce SO2 gas
      if (grid.isEmpty(x, y - 1)) grid.setCell(x, y - 1, 'smoke');
    }
  },
});

// ── NAPALM ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'napalm', name: 'Napalm', category: 'explosives',
  color: '#ff6600', density: 0.85, state: 'liquid',
  desc: 'Sticky incendiary gel. Burns long and spreads.',
  tags: ['liquid', 'fire', 'sticky', 'weapon'],
  burnAt: 60, heatConductivity: 0.1,

  tick(x, y, grid, h) {
    if (!h.chance(0.2)) return; // sticky, slow
    if (h.fallBelow(x, y)) return;
    h.flowSideways(x, y, 1);

    if (h.getHeat(x, y) >= 60 && h.chance(0.08)) {
      grid.setCell(x, y, 'wildfire', { energy: 100 });
    }
  },
});

// ── MINE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mine', name: 'Mine', category: 'explosives',
  color: '#666644', density: 999, state: 'solid',
  desc: 'Naval mine. Explodes on contact with liquids.',
  tags: ['solid', 'explosive', 'water'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const ntype = grid.getType(nx, ny);
      const ndef = ElementRegistry.get(ntype);
      if (ndef?.state === 'liquid' && h.chance(0.05)) {
        grid.clearCell(x, y);
        setTimeout(() => h.explode(x, y, 12, 1.2), 20);
        return;
      }
    }
  },
});

// ── SHRAPNEL ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'shrapnel', name: 'Shrapnel', category: 'explosives',
  color: '#888866', density: 3.0, state: 'solid',
  desc: 'Metal fragment that flies fast and damages things.',
  tags: ['solid', 'metal', 'projectile'],
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const dir  = cell.dir || h.randInt(-2, 2);
    cell.dir   = dir;

    // Fly in direction
    const nx = x + (dir > 0 ? 1 : -1);
    const ny = y + 1;
    if (grid.isEmpty(nx, ny)) {
      grid.swapCells(x, y, nx, ny);
    } else {
      // Hit something
      const hit = grid.getType(nx, ny);
      if (hit && hit !== 'wall') {
        grid.clearCell(nx, ny);
      }
      grid.clearCell(x, y);
    }
  },
});

window.PW_setLoadProgress?.(36, 'Explosives loaded...');
