/**
 * PARTICLE WORLD v2.0 — elements/tech.js
 * Wire, battery, laser, pump, fan, solar panel, nuclear core, drone, rocket, logic gates.
 * Upgraded: explode() calls use new opts format, reactions use Reactions system.
 */

// ── WIRE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wire', name: 'Wire', category: 'tech',
  color: (cell) => cell.energy > 0 ? '#ffff00' : '#884400',
  density: 2.0, state: 'solid',
  desc: 'Conducts electricity. Glows yellow when powered.',
  heatConductivity: 0.4,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    if (cell.energy > 0) {
      cell.energy--;
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire' && nc.energy <= 0) nc.energy = cell.energy;
        if (nc?.type === 'circuit' && nc.energy <= 0) nc.energy = cell.energy;
      }
    }
  },
});

// ── BATTERY ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'battery', name: 'Battery', category: 'tech',
  color: '#226622', density: 2.5, state: 'solid',
  desc: 'Powers wires. Runs out over time.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = cell.energy ?? 500;
    if (cell.energy <= 0) { grid.setCell(x, y, 'metal'); return; }
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const nc = grid.getCell(nx, ny);
      if ((nc?.type === 'wire' || nc?.type === 'circuit') && nc.energy <= 0 && h.chance(0.1)) {
        nc.energy = 8;
        cell.energy--;
      }
    }
  },
});

// ── CIRCUIT ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'circuit', name: 'Circuit', category: 'tech',
  color: '#004400', density: 2.0, state: 'solid',
  desc: 'Amplifies electrical signals.',
  heatConductivity: 0.2, burnAt: 400,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    h.doBurning(x, y);
    if (cell.energy > 0) {
      cell.energy--;
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire') nc.energy = 14;
      }
    }
  },
});

// ── SOLAR PANEL ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'solar_panel', name: 'Solar Panel', category: 'tech',
  color: '#003366', density: 999, state: 'solid',
  desc: 'Generates electricity from heat/light.',
  heatConductivity: 0.2,
  tick(x, y, grid, h) {
    if ((h.getHeat(x, y) > 20 || h.chance(0.05)) && h.chance(0.1)) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire' && nc.energy <= 0) nc.energy = 8;
      }
    }
  },
});

// ── WIND TURBINE ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wind_turbine', name: 'Wind Turbine', category: 'tech',
  color: '#ffffff', density: 999, state: 'solid',
  desc: 'Generates electricity from gas movement.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const GASES = new Set(['smoke','steam','gas','co2','hydrogen','methane','nitrogen','oxygen','chlorine']);
    let powered = false;
    for (const [nx, ny] of h.neighbors4(x, y)) if (GASES.has(grid.getType(nx, ny))) { powered = true; break; }
    if (powered && h.chance(0.12)) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire' && nc.energy <= 0) nc.energy = 8;
      }
    }
  },
});

// ── NUCLEAR CORE ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nuclear_core', name: 'Nuclear Core', category: 'tech',
  color: '#22ff44', density: 5.0, state: 'solid',
  desc: 'Generates extreme heat. Meltdown risk.',
  heat: 1000, heatConductivity: 0.8,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.heat = (cell.heat ?? 1000) + 1.5;
    h.doHeat(x, y);
    if (cell.heat > 3000 && h.chance(0.01)) {
      grid.setCell(x, y, 'lava', { heat: 3000 });
      setTimeout(() => h.explode(x, y, 20, { strength: 1.8, fire: ['radiation','fire','plasma'] }), 100);
      return;
    }
    if (h.chance(0.04)) {
      const rx = x + h.randInt(-5, 5), ry = y + h.randInt(-5, 5);
      if (grid.inBounds(rx, ry) && grid.isEmpty(rx, ry)) grid.setCell(rx, ry, 'radiation');
    }
  },
});

// ── LASER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'laser', name: 'Laser', category: 'tech',
  color: '#ff0000', density: 999, state: 'special',
  desc: 'Emits a beam that burns and cuts.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || 1;
    for (let i = 1; i <= 24; i++) {
      const bx = x + dir * i;
      if (!grid.inBounds(bx, y)) break;
      const bt = grid.getType(bx, y);
      if (!bt || bt === 'empty') continue;
      if (bt === 'mirror') { break; }
      h.addHeat(bx, y, 35);
      const bd = ElementRegistry.get(bt);
      if (bd?.burnAt && h.getHeat(bx, y) >= bd.burnAt && h.chance(0.1)) {
        grid.setCell(bx, y, 'fire');
        const fc = grid.getCell(bx, y); if (fc) fc.energy = 50;
      }
      if (bt !== 'wall' && bt !== 'glass' && bt !== 'diamond') break;
    }
  },
});

// ── PUMP ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'pump', name: 'Pump', category: 'tech',
  color: '#445566', density: 999, state: 'solid',
  desc: 'Moves liquids in one direction.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || 1;
    const src = grid.getCell(x - dir, y);
    const dst = grid.getCell(x + dir, y);
    if (src && ElementRegistry.get(src.type)?.state === 'liquid' && (!dst || dst.type === 'empty')) {
      grid.swapCells(x - dir, y, x + dir, y);
    }
  },
});

// ── FAN ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'fan', name: 'Fan', category: 'tech',
  color: '#aaaaaa', density: 999, state: 'solid',
  desc: 'Blows gases and light particles in one direction.',
  heatConductivity: 0.2,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || 1;
    const BLOW = new Set(['smoke','steam','gas','co2','fire','ember','hydrogen','methane','nitrogen','oxygen','ash','snow']);
    for (let i = 1; i <= 8; i++) {
      const bx = x + dir * i;
      if (!grid.inBounds(bx, y)) break;
      if (BLOW.has(grid.getType(bx, y)) && h.chance(0.35)) {
        if (grid.isEmpty(bx + dir, y)) grid.swapCells(bx, y, bx + dir, y);
      }
    }
  },
});

// ── DRONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'drone', name: 'Drone', category: 'tech',
  color: '#888888', density: 0.5, state: 'solid',
  desc: 'Flies autonomously.',
  burnAt: 400,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.4) ? (h.chance(0.5) ? -1 : 1) : 0;
    if (grid.isEmpty(x + dir, y + dy)) grid.swapCells(x, y, x + dir, y + dy);
    else cell.dir = -dir;
  },
});

// ── ROCKET ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'rocket', name: 'Rocket', category: 'tech',
  color: '#cccccc', density: 1.5, state: 'solid',
  desc: 'Flies upward, explodes on impact.',
  burnAt: 600,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 80) - 1;
    if (cell.energy <= 0) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 12, { strength: 1.2 }), 10);
      return;
    }
    if (grid.isEmpty(x, y - 1)) {
      grid.swapCells(x, y, x, y - 1);
      if (grid.isEmpty(x, y + 1)) { grid.setCell(x, y + 1, 'fire'); const fc = grid.getCell(x, y+1); if(fc) fc.energy = 18; }
    } else {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 12, { strength: 1.2 }), 10);
    }
  },
});

// ── MAGNET ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'magnet', name: 'Magnet', category: 'tech',
  color: '#cc2222', density: 999, state: 'solid',
  desc: 'Attracts metal particles.',
  heatConductivity: 0.3,
  tick(x, y, grid, h) {
    const METALS = new Set(['metal','steel','iron','copper','gold','lead','wire','battery']);
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      if (!dx && !dy) continue;
      const nx = x+dx, ny = y+dy;
      if (!grid.inBounds(nx, ny)) continue;
      if (!METALS.has(grid.getType(nx, ny))) continue;
      if (!h.chance(0.08)) continue;
      const mx = nx + (dx < 0 ? 1 : dx > 0 ? -1 : 0);
      const my = ny + (dy < 0 ? 1 : dy > 0 ? -1 : 0);
      if (grid.inBounds(mx, my) && grid.isEmpty(mx, my)) grid.swapCells(nx, ny, mx, my);
    }
  },
});

// ── CONVEYOR ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'conveyor', name: 'Conveyor', category: 'tech',
  color: '#444444', density: 999, state: 'solid',
  desc: 'Moves things sitting on top in one direction.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    const dir = cell.dir || 1;
    const above = grid.getType(x, y - 1);
    if (above && above !== 'empty' && above !== 'conveyor') {
      const def = ElementRegistry.get(above);
      if (def?.state !== 'special' && grid.isEmpty(x + dir, y - 1)) {
        grid.swapCells(x, y - 1, x + dir, y - 1);
      }
    }
  },
});

// ── LOGIC GATES ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gate_and', name: 'AND Gate', category: 'tech',
  color: '#224422', density: 999, state: 'solid',
  desc: 'Outputs signal only if both inputs powered.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const inputs = [[x-1,y],[x+1,y],[x,y-1]];
    if (inputs.filter(([nx,ny]) => (grid.getCell(nx,ny)?.energy ?? 0) > 0).length >= 2) {
      const out = grid.getCell(x, y+1);
      if (out?.type === 'wire') out.energy = 8;
    }
  },
});

ElementRegistry.register({
  id: 'gate_or', name: 'OR Gate', category: 'tech',
  color: '#334422', density: 999, state: 'solid',
  desc: 'Outputs signal if any input powered.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    if ([[x-1,y],[x+1,y],[x,y-1]].some(([nx,ny]) => (grid.getCell(nx,ny)?.energy ?? 0) > 0)) {
      const out = grid.getCell(x, y+1);
      if (out?.type === 'wire') out.energy = 8;
    }
  },
});

ElementRegistry.register({
  id: 'gate_not', name: 'NOT Gate', category: 'tech',
  color: '#442222', density: 999, state: 'solid',
  desc: 'Inverts signal.',
  heatConductivity: 0.1,
  tick(x, y, grid, h) {
    const inp = grid.getCell(x, y-1);
    const out = grid.getCell(x, y+1);
    if (out?.type === 'wire') out.energy = (inp?.energy ?? 0) > 0 ? 0 : 8;
  },
});

// ── TIMER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'timer', name: 'Timer', category: 'tech',
  color: '#553300', density: 999, state: 'solid',
  desc: 'Pulses electricity every ~30 ticks.',
  heatConductivity: 0.1,
  tick(x, y, grid, h, frame) {
    if (frame % 30 === 0) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire') nc.energy = 8;
      }
    }
  },
});

// ── EMP ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'emp', name: 'EMP', category: 'tech',
  color: '#aaaaff', density: 0.001, state: 'energy',
  desc: 'Electromagnetic pulse. Disables tech. Dissipates quickly.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 30) - 1;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Drain all tech nearby
    const TECH = new Set(['battery','wire','circuit','solar_panel','laser','drone','rocket','nuclear_core']);
    for (const [nx, ny] of h.neighbors8(x, y)) {
      const nc = grid.getCell(nx, ny);
      if (nc && TECH.has(nc.type)) nc.energy = 0;
    }
    h.GAS(x, y);
  },
});

window.PW_setLoadProgress?.(80, 'Tech loaded...');
