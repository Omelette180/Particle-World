/**
 * PARTICLE WORLD v2.0 — elements/vehicles.js
 * Car, boat, plane, helicopter, tank, UFO — explode() updated to new opts format.
 */

// ── CAR ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'car', name: 'Car', category: 'vehicles',
  color: '#cc3322', density: 2.0, state: 'solid',
  desc: 'Drives along flat surfaces. Explodes on crash.',
  burnAt: 400, burnInto: 'fire', burnTime: 80,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (!h.chance(0.6)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (grid.isEmpty(x+dir, y) && !grid.isEmpty(x+dir, y+1)) {
      grid.swapCells(x, y, x+dir, y);
    } else if (grid.isEmpty(x+dir, y-1) && grid.isEmpty(x+dir, y)) {
      grid.swapCells(x, y, x+dir, y-1);
    } else {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 6, { strength: 1.0 }), 20);
    }
  },
});

// ── BOAT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'boat', name: 'Boat', category: 'vehicles',
  color: '#885522', density: 0.8, state: 'solid',
  desc: 'Floats and moves on water.',
  burnAt: 300, burnInto: ['fire','ash'], burnTime: 150,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    const WATER = new Set(['water','seawater','saltwater','brine','mud_water']);
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (WATER.has(grid.getType(x, y+1)) || grid.isEmpty(x, y+1)) {
      if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
      if (WATER.has(grid.getType(x+dir, y)) || grid.isEmpty(x+dir, y)) {
        grid.swapCells(x, y, x+dir, y);
      } else { cell.dir = -dir; }
    }
  },
});

// ── PLANE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'plane', name: 'Plane', category: 'vehicles',
  color: '#dddddd', density: 0.3, state: 'solid',
  desc: 'Flies fast. Leaves exhaust. Crashes on impact.',
  burnAt: 500, burnInto: 'fire',
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 100) - 0.1;
    if (cell.energy <= 0) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 8, { strength: 1.2 }), 10);
      return;
    }
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.2) ? (h.chance(0.5) ? -1 : 1) : 0;
    if (grid.isEmpty(x+dir, y+dy)) {
      grid.swapCells(x, y, x+dir, y+dy);
      if (grid.isEmpty(x-dir, y)) { grid.setCell(x-dir, y, 'smoke'); const sc = grid.getCell(x-dir,y); if(sc) sc.energy=15; }
    } else {
      const hit = grid.getType(x+dir, y);
      if (hit && hit !== 'cloud' && hit !== 'smoke' && hit !== 'steam') {
        grid.clearCell(x, y);
        setTimeout(() => h.explode(x, y, 8, { strength: 1.2 }), 10);
      } else cell.dir = -dir;
    }
  },
});

// ── HELICOPTER ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'helicopter', name: 'Helicopter', category: 'vehicles',
  color: '#888866', density: 0.5, state: 'solid',
  desc: 'Hovers. Moves in any direction.',
  burnAt: 400,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.3) ? (h.chance(0.5) ? -1 : 1) : 0;
    if (grid.isEmpty(x+dir, y+dy)) grid.swapCells(x, y, x+dir, y+dy);
    else cell.dir = -dir;
    // Downwash — push gas/powder below away
    if (h.chance(0.15)) {
      const below = grid.getType(x, y+2);
      const belowDef = ElementRegistry.get(below);
      if (belowDef && (belowDef.state === 'gas' || belowDef.density < 0.5)) {
        const d2 = h.rnd() < 0.5 ? 1 : -1;
        if (grid.isEmpty(x+d2, y+2)) grid.swapCells(x, y+2, x+d2, y+2);
      }
    }
  },
});

// ── TANK ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'tank', name: 'Tank', category: 'vehicles',
  color: '#446633', density: 5.0, state: 'solid',
  desc: 'Heavy. Crushes through most materials.',
  burnAt: 700,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const CRUSH = new Set(['sand','dirt','plant','person','zombie','ant','citizen','brick','glass','wood','concrete','gravel','snow','ash','smoke']);
    const ahead = grid.getType(x+dir, y);
    if (ahead && CRUSH.has(ahead)) grid.clearCell(x+dir, y);
    if (grid.isEmpty(x+dir, y)) grid.swapCells(x, y, x+dir, y);
    else cell.dir = -dir;
    // Fire cannon occasionally
    if (h.chance(0.005) && grid.isEmpty(x+dir*2, y)) {
      grid.setCell(x+dir*2, y, 'fireball');
      const fb = grid.getCell(x+dir*2, y);
      if (fb) { fb.dir = dir; fb.energy = 40; }
    }
  },
});

// ── UFO ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ufo', name: 'UFO', category: 'vehicles',
  color: (cell, x, y, frame) => ['#88ffaa','#aaffcc','#66ee88','#ccffaa'][(frame + x) % 4],
  density: 0.2, state: 'solid',
  desc: 'Alien craft. Beams up particles.',
  tick(x, y, grid, h, frame) {
    if (!h.chance(0.3)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.3) ? (h.chance(0.5) ? -1 : 1) : 0;
    if (grid.isEmpty(x+dir, y+dy)) grid.swapCells(x, y, x+dir, y+dy);
    else cell.dir = -dir;
    // Beam up particles below (every ~120 frames)
    if (frame % 120 === 0 && h.chance(0.4)) {
      for (let i = 1; i <= 6; i++) {
        const bt = grid.getType(x, y+i);
        if (bt && bt !== 'empty') { grid.clearCell(x, y+i); break; }
      }
    }
    // Emit alien goo occasionally
    if (h.chance(0.002) && grid.isEmpty(x, y+1)) grid.setCell(x, y+1, 'slime');
  },
});

// ── FIRETRUCK ─────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'firetruck', name: 'Fire Truck', category: 'vehicles',
  color: '#dd2211', density: 3.0, state: 'solid',
  desc: 'Sprays water. Puts out fires.',
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (!h.chance(0.5)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    if (grid.isEmpty(x+dir, y)) grid.swapCells(x, y, x+dir, y);
    else cell.dir = -dir;
    // Spray water ahead
    if (h.chance(0.15)) {
      for (let i = 1; i <= 5; i++) {
        const wx = x + dir * i;
        if (!grid.inBounds(wx, y)) break;
        if (grid.getType(wx, y) === 'fire') { grid.setCell(wx, y, 'steam'); const sc=grid.getCell(wx,y); if(sc) sc.energy=20; }
        else if (grid.isEmpty(wx, y)) { grid.setCell(wx, y, 'water'); break; }
        else break;
      }
    }
  },
});

// ── METEOR ────────────────────────────────────────────────────────
// (moved here from space.js since it has vehicle-like movement)
ElementRegistry.register({
  id: 'meteor', name: 'Meteor', category: 'space',
  color: '#aa7744', density: 5.0, state: 'solid',
  desc: 'Falls fast from the sky. Explodes on impact.',
  heat: 800, heatConductivity: 0.2,
  tick(x, y, grid, h) {
    // Fast fall
    let cy = y;
    for (let i = 0; i < 3; i++) {
      if (grid.isEmpty(x, cy+1)) {
        grid.swapCells(x, cy, x, cy+1);
        cy++;
      } else {
        grid.clearCell(x, cy);
        setTimeout(() => h.explode(x, cy, 10, { strength: 1.3 }), 10);
        return;
      }
    }
    // Heat trail
    if (h.chance(0.35) && grid.isEmpty(x, cy-1)) { grid.setCell(x, cy-1, 'fire'); const fc=grid.getCell(x,cy-1); if(fc) fc.energy=18; }
    for (const [nx, ny] of h.neighbors4(x, cy)) h.addHeat(nx, ny, 30);
  },
});

window.PW_setLoadProgress?.(84, 'Vehicles loaded...');
