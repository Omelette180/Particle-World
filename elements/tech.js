/**
 * PARTICLE WORLD v2.0 — elements/tech.js
 * Wire, battery, laser, pump, fan, solar panel, circuit, drone, etc.
 */

// ── WIRE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wire', name: 'Wire', category: 'tech',
  color: (cell, x, y, frame) => cell.energy > 0 ? '#ffff00' : '#884400',
  density: 2.0, state: 'solid',
  desc: 'Conducts electricity. Glows when powered.',
  tags: ['tech', 'electric', 'conductor'],
  heatConductivity: 0.4,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (cell.energy > 0) {
      cell.energy -= 1;
      // Propagate signal
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc && nc.type === 'wire' && nc.energy <= 0) {
          nc.energy = cell.energy;
        }
      }
    }
  },
});

// ── BATTERY ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'battery', name: 'Battery', category: 'tech',
  color: '#226622', density: 2.5, state: 'solid',
  desc: 'Powers wires and tech. Runs out over time.',
  tags: ['tech', 'electric', 'power'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = cell.energy ?? 500;
    if (cell.energy <= 0) { grid.setCell(x, y, 'metal'); return; }

    // Send signal to adjacent wires
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const nc = grid.getCell(nx, ny);
      if (nc?.type === 'wire' && nc.energy <= 0 && h.chance(0.1)) {
        nc.energy = 8;
        cell.energy -= 1;
      }
    }
  },
});

// ── LASER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'laser', name: 'Laser', category: 'tech',
  color: '#ff0000', density: 999, state: 'special',
  desc: 'Emits a beam that burns and cuts.',
  tags: ['tech', 'light', 'weapon'],
  heatConductivity: 0.0,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    // Fire beam rightward (or direction stored in dir)
    const dir = cell.dir || 1;
    for (let i = 1; i <= 20; i++) {
      const bx = x + dir * i;
      if (!grid.inBounds(bx, y)) break;
      const btype = grid.getType(bx, y);
      if (!btype || btype === 'empty') {
        // Mark beam path (visual handled by renderer separately)
        continue;
      }
      if (btype === 'mirror') {
        // Reflect — store new direction in mirror cell
        break;
      }
      // Heat and burn
      h.addHeat(bx, y, 30);
      const bdef = ElementRegistry.get(btype);
      if (bdef?.burnAt && h.getHeat(bx, y) >= bdef.burnAt && h.chance(0.1)) {
        grid.setCell(bx, y, 'fire', { energy: 40 });
      }
      if (btype !== 'wall' && btype !== 'glass' && btype !== 'diamond') break;
    }
  },
});

// ── PUMP ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'pump', name: 'Pump', category: 'tech',
  color: '#445566', density: 999, state: 'solid',
  desc: 'Moves liquids in one direction.',
  tags: ['tech', 'utility', 'liquid'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const dir = cell.dir || 1;
    // Pull liquid from left, push right (or vice versa)
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
  tags: ['tech', 'utility', 'wind'],
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const dir = cell.dir || 1;
    const BLOW = ['smoke','steam','gas','co2','fire','ember','hydrogen','methane','fog'];

    for (let i = 1; i <= 6; i++) {
      const bx = x + dir * i;
      if (!grid.inBounds(bx, y)) break;
      const btype = grid.getType(bx, y);
      if (BLOW.includes(btype) && h.chance(0.3)) {
        if (grid.isEmpty(bx + dir, y)) grid.swapCells(bx, y, bx + dir, y);
      }
    }
  },
});

// ── SOLAR PANEL ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'solar_panel', name: 'Solar Panel', category: 'tech',
  color: '#003366', density: 999, state: 'solid',
  desc: 'Generates electricity from heat and light.',
  tags: ['tech', 'electric', 'green'],
  heatConductivity: 0.2,

  tick(x, y, grid, h) {
    const heat = h.getHeat(x, y);
    // Charge if warm
    if (heat > 20 && h.chance(0.1)) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire' && nc.energy <= 0) nc.energy = 8;
      }
    }
  },
});

// ── CIRCUIT ───────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'circuit', name: 'Circuit', category: 'tech',
  color: '#004400', density: 2.0, state: 'solid',
  desc: 'Processes electrical signals.',
  tags: ['tech', 'electric', 'logic'],
  heatConductivity: 0.2,
  burnAt: 400,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    // Amplify signal
    if (cell.energy > 0) {
      cell.energy -= 1;
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire') nc.energy = 12;
      }
    }
  },
});

// ── DRONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'drone', name: 'Drone', category: 'tech',
  color: '#888888', density: 0.5, state: 'solid',
  desc: 'Flies around autonomously.',
  tags: ['tech', 'flying', 'machine'],
  burnAt: 400,

  tick(x, y, grid, h) {
    if (!h.chance(0.4)) return;
    const cell = grid.getCell(x, y);
    const dir = cell.dir || (h.chance(0.5) ? 1 : -1);
    cell.dir = dir;
    const dy = h.chance(0.4) ? (h.chance(0.5) ? -1 : 1) : 0;

    if (grid.isEmpty(x + dir, y + dy)) {
      grid.swapCells(x, y, x + dir, y + dy);
    } else {
      cell.dir = -dir;
    }
  },
});

// ── ROCKET ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'rocket', name: 'Rocket', category: 'tech',
  color: '#cccccc', density: 1.5, state: 'solid',
  desc: 'Flies upward, explodes on impact.',
  tags: ['tech', 'explosive', 'vehicle'],
  burnAt: 600,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    cell.energy = (cell.energy ?? 80) - 1;
    if (cell.energy <= 0) {
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 12, 1.2), 10);
      return;
    }

    // Move upward
    if (grid.isEmpty(x, y - 1)) {
      grid.swapCells(x, y, x, y - 1);
      if (grid.isEmpty(x, y + 1)) grid.setCell(x, y + 1, 'fire', { energy: 15 });
    } else {
      // Hit something
      grid.clearCell(x, y);
      setTimeout(() => h.explode(x, y, 12, 1.2), 10);
    }
  },
});

// ── NUCLEAR CORE ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'nuclear_core', name: 'Nuclear Core', category: 'tech',
  color: '#22ff44', density: 5.0, state: 'solid',
  desc: 'Generates extreme heat. Meltdown risk.',
  tags: ['tech', 'nuclear', 'heat'],
  heat: 1000, heatConductivity: 0.8,

  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    const heat = cell.heat ?? 1000;
    // Generate heat
    cell.heat = heat + 1;
    for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 30);

    // Meltdown if overheated
    if (heat > 3000 && h.chance(0.01)) {
      grid.setCell(x, y, 'lava', { heat: 3000 });
      setTimeout(() => h.explode(x, y, 20, 1.8), 100);
    }
    // Emit radiation
    if (h.chance(0.05)) {
      const rx = x + h.randInt(-5, 5);
      const ry = y + h.randInt(-5, 5);
      if (grid.inBounds(rx, ry) && grid.isEmpty(rx, ry)) grid.setCell(rx, ry, 'radiation');
    }
  },
});

// ── WIND TURBINE ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wind_turbine', name: 'Wind Turbine', category: 'tech',
  color: '#ffffff', density: 999, state: 'solid',
  desc: 'Generates electricity from gas movement.',
  tags: ['tech', 'electric', 'green'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const GAS = new Set(['smoke','steam','gas','co2','hydrogen','methane','fog','wind']);
    let powered = false;
    for (const [nx, ny] of h.neighbors4(x, y)) {
      if (GAS.has(grid.getType(nx, ny))) { powered = true; break; }
    }
    if (powered && h.chance(0.1)) {
      for (const [nx, ny] of h.neighbors4(x, y)) {
        const nc = grid.getCell(nx, ny);
        if (nc?.type === 'wire' && nc.energy <= 0) nc.energy = 8;
      }
    }
  },
});

// ── LOGIC GATES ───────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gate_and', name: 'AND Gate', category: 'tech',
  color: '#224422', density: 999, state: 'solid',
  desc: 'Outputs signal only if both inputs are powered.',
  tags: ['tech', 'logic', 'electric'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const n = [[x-1,y],[x+1,y],[x,y-1]];
    const powered = n.filter(([nx,ny]) => (grid.getCell(nx,ny)?.energy ?? 0) > 0).length;
    if (powered >= 2) {
      const out = grid.getCell(x, y + 1);
      if (out?.type === 'wire') out.energy = 8;
    }
  },
});

ElementRegistry.register({
  id: 'gate_or', name: 'OR Gate', category: 'tech',
  color: '#334422', density: 999, state: 'solid',
  desc: 'Outputs signal if any input is powered.',
  tags: ['tech', 'logic', 'electric'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const n = [[x-1,y],[x+1,y],[x,y-1]];
    const powered = n.some(([nx,ny]) => (grid.getCell(nx,ny)?.energy ?? 0) > 0);
    if (powered) {
      const out = grid.getCell(x, y + 1);
      if (out?.type === 'wire') out.energy = 8;
    }
  },
});

ElementRegistry.register({
  id: 'gate_not', name: 'NOT Gate', category: 'tech',
  color: '#442222', density: 999, state: 'solid',
  desc: 'Inverts signal.',
  tags: ['tech', 'logic', 'electric'],
  heatConductivity: 0.1,

  tick(x, y, grid, h) {
    const inp = grid.getCell(x, y - 1);
    const out = grid.getCell(x, y + 1);
    if (out?.type === 'wire') {
      out.energy = (inp?.energy ?? 0) > 0 ? 0 : 8;
    }
  },
});

// ── TIMER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'timer', name: 'Timer', category: 'tech',
  color: '#553300', density: 999, state: 'solid',
  desc: 'Pulses electricity at regular intervals.',
  tags: ['tech', 'logic', 'electric'],
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

window.PW_setLoadProgress?.(80, 'Tech loaded...');
