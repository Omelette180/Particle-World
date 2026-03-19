/**
 * PARTICLE WORLD v2.0 — elements/basics.js
 * Core elements using upgraded Sandboxels-style physics behaviors.
 */

// ── SAND ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'sand', name: 'Sand', category: 'powders',
  color: '#c8a84b', density: 1.5, state: 'solid',
  desc: 'Granular sediment. Piles and slides.',
  meltAt: 1600, meltsInto: 'molten_glass',
  heatConductivity: 0.05,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── WET SAND ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wet_sand', name: 'Wet Sand', category: 'powders',
  color: '#8a7030', density: 1.7, state: 'solid',
  desc: 'Sand soaked with water. Sticks together more.',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    // Wet sand is sturdier — only falls straight down
    if (grid.isEmpty(x, y+1)) grid.swapCells(x, y, x, y+1);
  },
});

// ── WATER ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'water', name: 'Water', category: 'liquids',
  color: '#1a6fa8', density: 1.0, state: 'liquid',
  desc: 'Flows and spreads. Freezes cold, boils hot.',
  meltAt: 100, meltsInto: 'steam',
  freezeAt: 0, freezesInto: 'ice',
  heatConductivity: 0.18,
  tick(x, y, grid, h) { h.LIQUID(x, y); },
});

// ── SALT WATER ────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'saltwater', name: 'Salt Water', category: 'liquids',
  color: '#2277aa', density: 1.02, state: 'liquid',
  desc: 'Denser than fresh water. Slightly lower freeze point.',
  meltAt: 102, meltsInto: 'steam',
  freezeAt: -2, freezesInto: 'ice',
  heatConductivity: 0.17,
  tick(x, y, grid, h) { h.LIQUID(x, y); },
});

// ── STONE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'stone', name: 'Stone', category: 'solids',
  color: '#6b6b6b', density: 3.0, state: 'solid',
  desc: 'Solid rock. Falls when unsupported.',
  meltAt: 1400, meltsInto: 'lava',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y+1)) grid.swapCells(x, y, x, y+1);
  },
});

// ── DIRT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'dirt', name: 'Dirt', category: 'powders',
  color: '#6b4226', density: 1.3, state: 'solid',
  desc: 'Loose earth. Turns to mud when wet.',
  heatConductivity: 0.05,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── MUD ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'mud', name: 'Mud', category: 'powders',
  color: '#3b2010', density: 1.6, state: 'solid',
  desc: 'Wet dirt. Sticky and slow.',
  meltAt: 100, meltsInto: 'water',
  heatConductivity: 0.09,
  tick(x, y, grid, h) {
    // Mud is sturdier — falls but doesn't spread diagonally as easily
    if (grid.isEmpty(x, y+1)) { grid.swapCells(x, y, x, y+1); return; }
    if (h.chance(0.3)) {
      const d = h.rnd() < 0.5 ? 1 : -1;
      if (grid.isEmpty(x+d, y+1)) grid.swapCells(x, y, x+d, y+1);
    }
  },
});

// ── GRAVEL ────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'gravel', name: 'Gravel', category: 'powders',
  color: '#777060', density: 2.0, state: 'solid',
  desc: 'Heavy rock fragments.',
  meltAt: 1100, meltsInto: 'lava',
  heatConductivity: 0.06,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── SALT ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'salt', name: 'Salt', category: 'powders',
  color: '#e8e8e8', density: 1.2, state: 'solid',
  desc: 'Dissolves in water to make salt water.',
  heatConductivity: 0.05,
  tick(x, y, grid, h) {
    // Check for water neighbors → dissolve into saltwater
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'water' || t === 'saltwater') && h.chance(0.05)) {
        grid.setCell(x, y, 'saltwater');
        grid.clearCell(nx, ny);
        return;
      }
    }
    h.POWDER(x, y);
  },
});

// ── WALL ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wall', name: 'Wall', category: 'solids',
  color: '#555555', density: 99, state: 'solid',
  desc: 'Immovable solid. Cannot be destroyed.',
  heatConductivity: 0.0,
  tick(x, y, grid, h) { /* static */ },
});

// ── CONCRETE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'concrete', name: 'Concrete', category: 'solids',
  color: '#aaaaaa', density: 5.0, state: 'solid',
  desc: 'Heavy solid. Resists most forces.',
  heatConductivity: 0.04,
  tick(x, y, grid, h) {
    if (grid.isEmpty(x, y+1)) grid.swapCells(x, y, x, y+1);
  },
});

// ── GLASS ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'glass', name: 'Glass', category: 'solids',
  color: '#88ccdd', density: 2.5, state: 'solid',
  desc: 'Brittle transparent solid.',
  meltAt: 1500, meltsInto: 'molten_glass',
  heatConductivity: 0.02,
  tick(x, y, grid, h) { /* static */ },
});

// ── MOLTEN GLASS ──────────────────────────────────────────────────
ElementRegistry.register({
  id: 'molten_glass', name: 'Molten Glass', category: 'liquids',
  color: '#ff8800', density: 2.2, state: 'liquid',
  desc: 'Super-heated glass that flows slowly.',
  freezeAt: 1400, freezesInto: 'glass',
  heatConductivity: 0.04,
  tick(x, y, grid, h) { h.MOLTEN(x, y); },
});

// ── WOOD ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'wood', name: 'Wood', category: 'solids',
  color: '#8B4513', density: 0.6, state: 'solid',
  desc: 'Burns readily. Floats on water.',
  burnAt: 300, burnInto: ['fire', 'fire', 'charcoal'],
  burnTime: 200,
  heatConductivity: 0.04,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    h.doHeat(x, y);
  },
});

// ── CHARCOAL ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'charcoal', name: 'Charcoal', category: 'powders',
  color: '#2b2b2b', density: 0.8, state: 'solid',
  desc: 'Ash-black carbon. Burns long and hot.',
  burnAt: 400, burnInto: ['smoke', 'ash'], burnTime: 400,
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    h.POWDER(x, y);
  },
});

// ── ASH ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ash', name: 'Ash', category: 'powders',
  color: '#888888', density: 0.3, state: 'solid',
  desc: 'Light remains of burned material.',
  heatConductivity: 0.02,
  tick(x, y, grid, h) { h.POWDER(x, y); },
});

// ── ICE ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'ice', name: 'Ice', category: 'solids',
  color: '#a0d8ef', density: 0.9, state: 'solid',
  desc: 'Frozen water. Melts in heat.',
  meltAt: 0, meltsInto: 'water',
  heatConductivity: 0.2,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    // Check neighbors for fire/lava — speed up melting
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava') && h.chance(0.05)) {
        grid.setCell(x, y, 'water');
        return;
      }
    }
  },
});

// ── SNOW ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'snow', name: 'Snow', category: 'powders',
  color: '#e8f4f8', density: 0.15, state: 'solid',
  desc: 'Light frozen crystals. Falls slowly.',
  meltAt: 5, meltsInto: 'water',
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    for (const [nx, ny] of h.neighbors4(x, y)) {
      const t = grid.getType(nx, ny);
      if ((t === 'fire' || t === 'lava') && h.chance(0.08)) {
        grid.setCell(x, y, 'water'); return;
      }
    }
    // Slow fall
    if (h.chance(0.7)) h.POWDER(x, y);
  },
});

// ── STEAM ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'steam', name: 'Steam', category: 'gases',
  color: '#c0d8e8', density: 0.001, state: 'gas',
  desc: 'Hot water vapor. Rises and dissipates.',
  freezeAt: 95, freezesInto: 'water',
  heatConductivity: 0.01,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 80) - h.rnd() * 0.5;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    h.GAS(x, y);
  },
});

// ── SMOKE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'smoke', name: 'Smoke', category: 'gases',
  color: '#3a4448', density: 0.001, state: 'gas',
  desc: 'Rises and slowly disperses.',
  heatConductivity: 0.005,
  tick(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 50) - h.rnd() * 0.4;
    if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    // Vary color for billowy effect
    const shades = ['#3a4448','#444e52','#2e383e','#4e585e'];
    cell.color = shades[0 | (h.rnd() * shades.length)];
    h.GAS(x, y);
  },
});

// ── OIL ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'oil', name: 'Oil', category: 'liquids',
  color: '#3a2a0a', density: 0.85, state: 'liquid',
  desc: 'Flammable liquid. Floats on water.',
  burnAt: 200, burnInto: ['fire', 'smoke'], burnTime: 250,
  heatConductivity: 0.03,
  tick(x, y, grid, h) {
    h.doBurning(x, y);
    h.LIQUID(x, y, 0.9);
  },
});

// ── ACID ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'acid', name: 'Acid', category: 'liquids',
  color: '#7aff3a', density: 1.2, state: 'liquid',
  desc: 'Eats through most materials.',
  heatConductivity: 0.08,
  tick(x, y, grid, h) {
    // Dissolve neighbors
    for (const [nx, ny] of h.neighbors4r(x, y)) {
      const t = grid.getType(nx, ny);
      if (!t || t === 'empty' || t === 'acid' || t === 'wall' ||
          t === 'glass' || t === 'metal' || t === 'steel' || t === 'obsidian') continue;
      if (h.chance(0.01)) {
        grid.clearCell(nx, ny);
        if (h.chance(0.15)) grid.clearCell(x, y); // acid used up
        return;
      }
    }
    h.LIQUID(x, y);
  },
});

// ── SALT WATER ─ already done above ─ LAVA ────────────────────────
ElementRegistry.register({
  id: 'lava', name: 'Lava', category: 'liquids',
  color: '#ff4400', density: 2.8, state: 'liquid',
  desc: 'Molten rock. Extremely hot. Burns everything.',
  freezeAt: 700, freezesInto: 'stone',
  heatConductivity: 0.12,
  tick(x, y, grid, h) {
    h.doHeat(x, y);
    // Color flicker
    const cell = grid.getCell(x, y);
    if (cell) {
      const shades = ['#ff4400','#ff5500','#ff3300','#ff6600','#ee3300'];
      cell.color = shades[0 | (h.rnd() * shades.length)];
    }
    h.MOLTEN(x, y);
  },
});

// ── OBSIDIAN ──────────────────────────────────────────────────────
ElementRegistry.register({
  id: 'obsidian', name: 'Obsidian', category: 'solids',
  color: '#1a0a1a', density: 3.0, state: 'solid',
  desc: 'Volcanic glass. Very hard.',
  heatConductivity: 0.03,
  tick(x, y, grid, h) { /* static */ },
});

// ── POISON ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'poison',name:'Poison',category:'liquids',color:'#8822aa',density:1.05,state:'liquid',
  desc:'Kills living things on contact. Spreads in water.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='ant'||t==='worm'||t==='citizen')&&h.chance(0.022))g.clearCell(nx,ny);
      if(t==='water'&&h.chance(0.003))g.setCell(nx,ny,'poison');
    }
    h.LIQUID(x,y,0.8);
  }
});

// ── COAL ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'coal',name:'Coal',category:'powders',color:'#1e2530',density:1.8,state:'solid',
  desc:'Burns slow and hot.',burnAt:350,burnInto:['smoke','ash'],burnTime:500,heatConductivity:0.12,
  tick(x,y,g,h){h.doBurning(x,y);h.POWDER(x,y);}
});

// ── SEAWATER ──────────────────────────────────────────────────────
ElementRegistry.register({
  id:'seawater',name:'Seawater',category:'liquids',color:'#0a4a7a',density:1.025,state:'liquid',
  desc:'Ocean water. Coral and kelp grow in it.',meltAt:102,meltsInto:'steam',freezeAt:-2,freezesInto:'ice',heatConductivity:0.17,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='sand'&&h.chance(0.0003))g.setCell(nx,ny,'coral');
      if(t==='algae'&&h.chance(0.0005))g.setCell(nx,ny,'kelp');
    }
    if(g.getType(x,y-1)==='bubble')g.swapCells(x,y,x,y-1);
    h.LIQUID(x,y,0.94);
  }
});

// ── ACID RAIN ─────────────────────────────────────────────────────
ElementRegistry.register({
  id:'acid_rain',name:'Acid Rain',category:'weather',color:'#99ee44',density:0.9,state:'liquid',
  desc:'Corrosive precipitation. Eats through things on landing.',heatConductivity:0.1,
  tick(x,y,g,h){
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    const t=g.getType(x,y+1);
    if(t&&t!=='acid_rain'&&t!=='wall'){
      if(h.chance(0.2))g.clearCell(x,y+1);
      g.setCell(x,y,'acid');
    }
  }
});

// ── THERMITE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id:'thermite',name:'Thermite',category:'explosives',color:'#cc8822',density:2.5,state:'solid',
  desc:'Ignites violently from fire. Burns incredibly hot.',burnAt:600,burnInto:'molten_iron',burnTime:80,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='fire'||t==='lava')&&h.chance(0.08)){
        h.explode(x,y,12,{strength:1.2});
        g.setCell(x,y,'fire');return;
      }
    }
    h.POWDER(x,y);
  }
});

// ── SULFUR ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'sulfur',name:'Sulfur',category:'explosives',color:'#ddcc00',density:2.0,state:'solid',
  desc:'Flammable mineral. Explodes in lava.',burnAt:160,burnInto:'smoke',burnTime:60,heatConductivity:0.06,
  tick(x,y,g,h){
    h.doBurning(x,y);
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='fire'||t==='lava')&&h.chance(0.15)){
        setTimeout(()=>h.explode(x,y,6,{strength:0.8}),10+Math.random()*25);
        g.clearCell(x,y);return;
      }
    }
    h.POWDER(x,y);
  }
});

// ── PHOSPHORUS ────────────────────────────────────────────────────
ElementRegistry.register({
  id:'phosphorus',name:'Phosphorus',category:'explosives',color:'#ffaa44',density:1.82,state:'solid',
  desc:'Ignites on contact with air. Extremely flammable.',burnAt:30,burnInto:'smoke',burnTime:40,heatConductivity:0.08,
  tick(x,y,g,h){
    h.doBurning(x,y);
    // Ignites spontaneously near air
    if(h.chance(0.005))g.setCell(x,y,'fire');
    for(const[nx,ny]of h.neighbors4(x,y)){
      if((g.getType(nx,ny)==='fire'||g.getType(nx,ny)==='lava')&&h.chance(0.1)){
        g.setCell(x,y,'fire');return;
      }
    }
    h.POWDER(x,y);
  }
});

// ── NAPALM (v2 style — napalm2 in v1) ─────────────────────────────
ElementRegistry.register({
  id:'napalm2',name:'Napalm+',category:'explosives',color:'#ff4400',density:0.92,state:'liquid',
  desc:'Sticky incendiary. Burns on water. Very destructive.',burnAt:100,burnInto:'fire',burnTime:600,heatConductivity:0.06,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const cell=g.getCell(x,y);
    if(cell?.burning){
      for(const[nx,ny]of h.neighbors4(x,y)){
        const nd=ElementRegistry.get(g.getType(nx,ny));
        if(nd?.burnAt&&h.chance(0.08)){const nc=g.getCell(nx,ny);if(nc)nc.burning=true;}
      }
    }
    // Burns on water
    for(const[nx,ny]of h.neighbors4(x,y)){
      if(g.getType(nx,ny)==='water'&&h.chance(0.02)){const c=g.getCell(x,y);if(c)c.burning=true;}
    }
    h.LIQUID(x,y,0.3);
  }
});

// ── WAX ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'wax',name:'Wax',category:'solids',color:'#ffeecc',density:0.9,state:'solid',
  desc:'Melts from heat. Burns slowly.',meltAt:50,meltsInto:'oil',burnAt:200,burnInto:'smoke',burnTime:300,heatConductivity:0.06,
  tick(x,y,g,h){h.doBurning(x,y);h.doHeat(x,y);}
});

// ── CLAY ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'clay',name:'Clay',category:'powders',color:'#aa7755',density:1.8,state:'solid',
  desc:'Wet earth. Hardens when heated.',meltAt:800,meltsInto:'ceramic',heatConductivity:0.06,
  tick(x,y,g,h){h.POWDER(x,y);}
});

// ── BONE ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'bone',name:'Bone',category:'solids',color:'#eeddcc',density:1.9,state:'solid',
  desc:'Remains of living things. Very hard.',heatConductivity:0.04,
  tick(x,y,g,h){
    if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);
    for(const[nx,ny]of h.neighbors4(x,y)){
      if(g.getType(nx,ny)==='acid'&&h.chance(0.02))g.clearCell(x,y);
    }
  }
});

// ── GLASS2 ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'glass2',name:'Glass+',category:'solids',color:'#b8d0e8',density:2.5,state:'solid',
  desc:'Reinforced glass. Harder to melt.',meltAt:1600,meltsInto:'molten_glass',heatConductivity:0.02,
  tick(x,y,g,h){}
});

// ── STEEL BEAM ────────────────────────────────────────────────────
ElementRegistry.register({
  id:'steel_beam',name:'Steel Beam',category:'solids',color:'#6a7a8a',density:7.9,state:'solid',
  desc:'Structural steel. Holds weight.',meltAt:1510,meltsInto:'molten_steel',heatConductivity:0.45,
  tick(x,y,g,h){h.doHeat(x,y);}
});

// ── WOOD PLANK ────────────────────────────────────────────────────
ElementRegistry.register({
  id:'wood_plank',name:'Wood Plank',category:'solids',color:'#8a6030',density:0.6,state:'solid',
  desc:'Flat piece of wood. Burns.',burnAt:300,burnInto:['fire','charcoal'],burnTime:250,heatConductivity:0.04,
  tick(x,y,g,h){h.doBurning(x,y);}
});

// ── CARPET ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'carpet',name:'Carpet',category:'solids',color:'#8844aa',density:0.3,state:'solid',
  desc:'Soft floor covering. Burns easily.',burnAt:80,burnInto:'ash',burnTime:120,heatConductivity:0.03,
  tick(x,y,g,h){h.doBurning(x,y);}
});

// ── SOAP ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'soap',name:'Soap',category:'liquids',color:'#eeeeff',density:1.0,state:'liquid',
  desc:'Creates bubbles with water.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      if(g.getType(nx,ny)==='water'&&h.chance(0.01)&&g.isEmpty(nx,ny-1))
        g.setCell(nx,ny-1,'bubble');
    }
    h.LIQUID(x,y);
  }
});

// ── BLEACH ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'bleach',name:'Bleach',category:'liquids',color:'#eeffee',density:1.07,state:'liquid',
  desc:'Disinfects. Purifies water.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='water'&&h.chance(0.05))g.clearCell(x,y);
      if(t==='virus'&&h.chance(0.15))g.clearCell(nx,ny);
      if(t==='bacteria'&&h.chance(0.1))g.clearCell(nx,ny);
    }
    h.LIQUID(x,y);
  }
});

// ── YEAST ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'yeast',name:'Yeast',category:'special',color:'#ddcc88',density:1.1,state:'solid',
  desc:'Reacts with water to produce CO2 bubbles.',heatConductivity:0.05,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      if(g.getType(nx,ny)==='water'&&h.chance(0.003)&&g.isEmpty(nx,ny-1))
        g.setCell(nx,ny-1,'co2');
    }
    h.POWDER(x,y);
  }
});

// ── RESIN ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'resin',name:'Resin',category:'liquids',color:'#aa7722',density:1.2,state:'liquid',
  desc:'Very slow sticky liquid. Hardens over time.',heatConductivity:0.04,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??200)-0.01;
    if(cell.energy<=0){g.setCell(x,y,'ceramic');return;}
    h.LIQUID(x,y,0.03);
  }
});

// ── NITRIC ACID ───────────────────────────────────────────────────
ElementRegistry.register({
  id:'nitric_acid',name:'Nitric Acid',category:'liquids',color:'#aaff22',density:1.51,state:'liquid',
  desc:'Strong acid. Dissolves metals.',heatConductivity:0.12,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4r(x,y)){
      const t=g.getType(nx,ny);
      if(!t||t==='empty'||t==='nitric_acid'||t==='wall'||t==='glass'||t==='obsidian')continue;
      if(h.chance(0.015)){g.clearCell(nx,ny);if(h.chance(0.1)){g.clearCell(x,y);return;}}
      if(t==='water'&&h.chance(0.02)){g.setCell(x,y,'steam');g.clearCell(nx,ny);return;}
    }
    h.LIQUID(x,y);
  }
});

// ── WILDFIRE ──────────────────────────────────────────────────────
ElementRegistry.register({
  id:'wildfire',name:'Wildfire',category:'energy',color:'#ff6600',density:0.001,state:'gas',
  desc:'Spreads rapidly through organic matter.',heatConductivity:0.3,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??80)-0.15;
    if(cell.energy<=0){g.clearCell(x,y);return;}
    const organic=new Set(['wood','plant','seed','coal','wood_plank','tree','vine','cactus','grass','moss','kelp','algae']);
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(organic.has(t)&&h.chance(0.15))g.setCell(nx,ny,'wildfire');
      if(t==='fire'&&h.chance(0.05))g.setCell(nx,ny,'wildfire');
    }
    if(h.chance(0.04)&&g.isEmpty(x,y-1))g.setCell(x,y-1,'smoke');
    h.LIQUID(x,y,0.5);
  }
});

// ── GREEK FIRE ────────────────────────────────────────────────────
ElementRegistry.register({
  id:'greek_fire',name:'Greek Fire',category:'energy',color:'#00ff44',density:0.8,state:'liquid',
  desc:'Burns on water. Cannot be extinguished easily.',burnAt:50,burnInto:'smoke',burnTime:400,heatConductivity:0.15,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const cell=g.getCell(x,y);if(!cell)return;
    // Burns ON water — spreads to water surface
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='water'&&h.chance(0.05)){const nc=g.getCell(x,y);if(nc)nc.burning=true;}
    }
    h.LIQUID(x,y,0.4);
  }
});

// ── SUN ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'sun',name:'Sun',category:'space',
  color:(cell,x,y,frame)=>`hsl(${40+Math.sin((frame??0)*0.05)*10},100%,${55+Math.sin((frame??0)*0.07+x*0.1)*8}%)`,
  density:999,state:'special',desc:'Extreme heat. Ignites everything nearby.',heat:5000,heatConductivity:0,
  tick(x,y,g,h){
    const R=12;
    for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
      if(dx*dx+dy*dy>R*R)continue;
      const nx=x+dx,ny=y+dy;if(!g.inBounds(nx,ny))continue;
      const dist=Math.sqrt(dx*dx+dy*dy)+1;
      h.addHeat(nx,ny,300/dist);
      const t=g.getType(nx,ny);
      if(t&&t!=='empty'&&t!=='sun'&&t!=='wall'&&t!=='neutronstar'){
        const nc=g.getCell(nx,ny);
        if(nc&&(nc.heat??0)>800&&h.chance(0.02)){g.setCell(nx,ny,'fire');const fc=g.getCell(nx,ny);if(fc)fc.energy=80;}
      }
    }
  }
});

// ── ALIEN ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'alien',name:'Alien',category:'creatures',
  color:(cell,x,y,frame)=>`hsl(${140+(frame??0)*2%40},68%,${23+Math.sin((frame??0)*0.09)*7}%)`,
  density:1.0,state:'solid',desc:'Hostile extraterrestrial. Attacks on sight.',burnAt:400,heatConductivity:0.1,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='citizen'||t==='police')&&h.chance(0.07))g.clearCell(nx,ny);
    }
    cell.dir=d;
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.4)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else cell.dir=-d;
  }
});

// ── ALIEN GOO ─────────────────────────────────────────────────────
ElementRegistry.register({
  id:'alien_goo',name:'Alien Goo',category:'special',color:'#22ff88',density:1.1,state:'liquid',
  desc:'Corrosive alien substance. Mutates living things.',heatConductivity:0.05,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='citizen')&&h.chance(0.04))g.setCell(nx,ny,'mutant');
      if(t==='wall'||t==='metal'||t==='steel')continue;
      if(t&&t!=='empty'&&t!=='alien_goo'&&h.chance(0.005))g.clearCell(nx,ny);
    }
    h.LIQUID(x,y,0.15);
  }
});

// ── ALIEN BEAM ────────────────────────────────────────────────────
ElementRegistry.register({
  id:'alien_beam',name:'Alien Beam',category:'special',color:'#88ffaa',density:0.001,state:'energy',
  desc:'Tractor beam from a UFO. Moves things upward.',heatConductivity:0,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??15)-1;
    if(cell.energy<=0){g.clearCell(x,y);return;}
    if(!g.isEmpty(x,y+1)){
      const t=g.getType(x,y+1);
      if(t&&t!=='alien_beam'&&g.isEmpty(x,y-1)){g.swapCells(x,y+1,x,y-1);}
    }
    if(g.isEmpty(x,y-1))g.swapCells(x,y,x,y-1);
  }
});

// ── BEAKER ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'beaker',name:'Beaker',category:'special',color:'#334455',density:2.5,state:'solid',
  desc:'Lab container. Holds chemical reactions.',burnAt:1500,heatConductivity:0.02,
  tick(x,y,g,h){h.doHeat(x,y);}
});

// ── CHEM A/B/C ────────────────────────────────────────────────────
ElementRegistry.register({
  id:'chem_a',name:'Chem-A',category:'special',color:'#ff4488',density:1.1,state:'liquid',
  desc:'Reacts with B→fire, with C→acid.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='chem_b'&&h.chance(0.05)){g.setCell(x,y,'fire');g.setCell(nx,ny,'fire');return;}
      if(t==='chem_c'&&h.chance(0.05)){g.setCell(x,y,'acid');g.clearCell(nx,ny);return;}
    }
    h.LIQUID(x,y);
  }
});
ElementRegistry.register({
  id:'chem_b',name:'Chem-B',category:'special',color:'#4488ff',density:1.1,state:'liquid',
  desc:'Reacts with A→fire, with C→steam.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='chem_a'&&h.chance(0.05)){g.setCell(x,y,'fire');g.setCell(nx,ny,'fire');return;}
      if(t==='chem_c'&&h.chance(0.05)){g.setCell(x,y,'steam');g.setCell(nx,ny,'steam');return;}
    }
    h.LIQUID(x,y);
  }
});
ElementRegistry.register({
  id:'chem_c',name:'Chem-C',category:'special',color:'#44ff88',density:1.1,state:'liquid',
  desc:'Reacts with A→acid, with B→steam.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='chem_a'&&h.chance(0.05)){g.setCell(nx,ny,'acid');g.clearCell(x,y);return;}
      if(t==='chem_b'&&h.chance(0.05)){g.setCell(x,y,'steam');g.setCell(nx,ny,'steam');return;}
    }
    h.LIQUID(x,y);
  }
});
ElementRegistry.register({
  id:'catalyst',name:'Catalyst',category:'special',color:'#ffaa00',density:1.3,state:'solid',
  desc:'Accelerates all nearby reactions.',heatConductivity:0.15,
  tick(x,y,g,h){
    if(h.chance(0.1)){
      for(const[nx,ny]of h.neighbors8(x,y)){
        const nc=g.getCell(nx,ny);
        if(nc)nc.heat=(nc.heat??0)+8;
      }
    }
  }
});

// ── ROAD / HOUSE / SHOP / OFFICE / CITY ELEMENTS ─────────────────
ElementRegistry.register({id:'road',name:'Road',category:'special',color:'#333333',density:99,state:'solid',desc:'Flat surface for vehicles.',heatConductivity:0.05,tick(x,y,g,h){}});
ElementRegistry.register({id:'house',name:'House',category:'special',color:'#886644',density:99,state:'solid',desc:'Residential building.',burnAt:300,burnInto:'fire',burnTime:200,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'shop',name:'Shop',category:'special',color:'#4466aa',density:99,state:'solid',desc:'Commercial building.',burnAt:300,burnInto:'fire',burnTime:200,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'office',name:'Office',category:'special',color:'#445566',density:99,state:'solid',desc:'Office building.',burnAt:300,burnInto:'fire',burnTime:200,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'police_st',name:'Police Stn',category:'special',color:'#224488',density:99,state:'solid',desc:'Police station.',burnAt:400,burnInto:'fire',burnTime:250,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'fire_st',name:'Fire Station',category:'special',color:'#882222',density:99,state:'solid',desc:'Fire station.',burnAt:400,burnInto:'fire',burnTime:250,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);}});

// ── MISC ORGANIC / BIOLOGY ────────────────────────────────────────
ElementRegistry.register({
  id:'bacteria',name:'Bacteria',category:'special',color:'#66cc44',density:0.9,state:'solid',
  desc:'Multiplies rapidly in water and organic matter.',heatConductivity:0.02,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??100)-0.05;
    if(cell.energy<=0){g.clearCell(x,y);return;}
    if(h.chance(0.005)){
      for(const[nx,ny]of h.neighbors4r(x,y)){
        const t=g.getType(nx,ny);
        if(t==='water'||t==='nutrient'||g.isEmpty(nx,ny)){
          if(g.isEmpty(nx,ny))g.setCell(nx,ny,'bacteria');
          break;
        }
      }
    }
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='bleach'||t==='acid')&&h.chance(0.2)){g.clearCell(x,y);return;}
    }
  }
});

ElementRegistry.register({id:'mold',name:'Mold',category:'special',color:'#887755',density:0.6,state:'solid',desc:'Spreads on organic matter in damp conditions.',burnAt:100,burnInto:'ash',burnTime:60,heatConductivity:0.02,
  tick(x,y,g,h){
    h.doBurning(x,y);
    if(h.chance(0.002)){
      const organic=new Set(['wood','bread','meat','plant']);
      for(const[nx,ny]of h.neighbors4r(x,y)){
        if(organic.has(g.getType(nx,ny))&&h.chance(0.3)){g.setCell(nx,ny,'mold');break;}
      }
    }
  }
});

ElementRegistry.register({id:'fungus',name:'Fungus',category:'nature',color:'#997755',density:0.7,state:'solid',desc:'Spreads in damp dark places.',burnAt:80,burnInto:'smoke',burnTime:40,heatConductivity:0.02,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'spore',name:'Spore',category:'nature',color:'#bbaa88',density:0.05,state:'solid',desc:'Fungal spore. Drifts on air, grows into mushrooms.',heatConductivity:0.01,tick(x,y,g,h){h.POWDER(x,y);if(!g.isEmpty(x,y+1)&&h.chance(0.003)){const t=g.getType(x,y+1);if(t==='dirt'||t==='mud'||t==='stone')g.setCell(x,y,'mushroom');}}});
ElementRegistry.register({id:'egg',name:'Egg',category:'creatures',color:'#ffeedd',density:1.3,state:'solid',desc:'Hatches into a creature over time.',heatConductivity:0.1,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??300)-0.5;if(cell.energy<=0){const c=['worm','snake','spider','frog'];g.setCell(x,y,c[0|h.rnd()*c.length]);}if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'larva',name:'Larva',category:'creatures',color:'#ccbb88',density:1.0,state:'solid',desc:'Wriggling larva stage.',burnAt:100,burnInto:'ash',heatConductivity:0.05,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??200)-0.2;if(cell.energy<=0)g.setCell(x,y,'moth');if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'firefly',name:'Firefly',category:'creatures',color:(cell,x,y,f)=>((f??0)%30<15?'#ffff44':'#665522'),density:0.2,state:'solid',desc:'Glows at night. Floats around.',burnAt:80,burnInto:'ash',heatConductivity:0.02,tick(x,y,g,h){const d=g.getCell(x,y)?.dir||(h.rnd()<0.5?1:-1);const dy=h.rnd()<0.3?(h.rnd()<0.5?-1:1):0;if(g.isEmpty(x+d,y+dy))g.swapCells(x,y,x+d,y+dy);else{const c=g.getCell(x,y);if(c)c.dir=-d;}}});

// ── WEATHER EXTRAS ────────────────────────────────────────────────
ElementRegistry.register({id:'fog',name:'Fog',category:'weather',color:'#aabbcc',density:0.001,state:'gas',desc:'Dense moisture in the air.',heatConductivity:0.005,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??120);h.GAS(x,y);}});
ElementRegistry.register({id:'haze',name:'Haze',category:'weather',color:'#bbbbaa',density:0.001,state:'gas',desc:'Thin atmospheric haze.',heatConductivity:0.003,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??80)-0.1;if(cell.energy<=0){g.clearCell(x,y);return;}h.GAS(x,y);}});
ElementRegistry.register({id:'waterspout',name:'Waterspout',category:'weather',color:'#88aacc',density:0.001,state:'gas',desc:'Aquatic tornado over water.',heatConductivity:0.01,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??300)-0.3;if(cell.energy<=0){g.clearCell(x,y);return;}const R=4;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const dist=Math.sqrt(dx*dx+dy*dy);if(dist<1||dist>R)continue;const nx=x+dx,ny=y+dy,t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='wall'&&h.chance(0.04/dist)){if(g.isEmpty(nx,ny-1))g.swapCells(nx,ny,nx,ny-1);}}if(h.chance(0.03)){const d=h.rnd()<0.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}}});
ElementRegistry.register({id:'ball_lightning',name:'Ball Lightning',category:'weather',color:(cell,x,y,f)=>`hsl(${55+(f??0)*3%40},100%,${65+Math.sin((f??0)*0.1)*15}%)`,density:0.001,state:'energy',desc:'Rare electromagnetic ball.',heatConductivity:0.5,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??60)-0.4;if(cell.energy<=0){h.explode(x,y,5,{strength:0.8});g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors4(x,y))h.addHeat(nx,ny,30);const d=h.rnd()<0.5?1:-1;const dy=h.rnd()<0.3?(h.rnd()<0.5?-1:1):0;if(g.isEmpty(x+d,y+dy))g.swapCells(x,y,x+d,y+dy);}});

// ── SPACE EXTRAS ──────────────────────────────────────────────────
ElementRegistry.register({id:'nebula',name:'Nebula',category:'space',color:(cell,x,y,f)=>`hsl(${280+(f??0)%60},70%,${20+Math.sin((f??0)*0.02+x*0.05)*10}%)`,density:0.001,state:'gas',desc:'Interstellar cloud.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??150);h.GAS(x,y);}});
ElementRegistry.register({id:'black_dwarf',name:'Black Dwarf',category:'space',color:'#111111',density:999,state:'special',desc:'Dead stellar remnant. Very dense.',heat:0,heatConductivity:0,tick(x,y,g,h){for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='wall'&&t!=='neutronstar'&&h.chance(0.005))g.clearCell(nx,ny);}}});
ElementRegistry.register({id:'pulsar',name:'Pulsar',category:'space',color:(cell,x,y,f)=>((f??0)%20<10?'#ffffff':'#004488'),density:999,state:'special',desc:'Rapidly rotating neutron star emitting pulses.',heat:3000,heatConductivity:0,tick(x,y,g,h,frame){if((frame??0)%20===0){for(let i=1;i<=15;i++){if(g.inBounds(x+i,y)&&g.isEmpty(x+i,y))g.setCell(x+i,y,'radiation');if(g.inBounds(x-i,y)&&g.isEmpty(x-i,y))g.setCell(x-i,y,'radiation');}}}});
ElementRegistry.register({id:'magnetar',name:'Magnetar',category:'space',color:'#0044ff',density:999,state:'special',desc:'Neutron star with extreme magnetic field.',heat:4000,heatConductivity:0,tick(x,y,g,h){const METALS=new Set(['metal','steel','iron','copper','gold','lead','wire']);for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const nx=x+dx,ny=y+dy;if(!g.inBounds(nx,ny))continue;if(!METALS.has(g.getType(nx,ny)))continue;if(!h.chance(0.15))continue;const mx=nx+(dx<0?1:dx>0?-1:0),my=ny+(dy<0?1:dy>0?-1:0);if(g.inBounds(mx,my)&&g.isEmpty(mx,my))g.swapCells(nx,ny,mx,my);}}});
ElementRegistry.register({id:'quasar',name:'Quasar',category:'space',color:(cell,x,y,f)=>`hsl(${40+(f??0)*2%60},100%,${50+Math.sin((f??0)*0.05)*15}%)`,density:999,state:'special',desc:'Most luminous object in the universe.',heat:10000,heatConductivity:0,tick(x,y,g,h){const R=15;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R)continue;const nx=x+dx,ny=y+dy;if(!g.inBounds(nx,ny))continue;const dist=Math.sqrt(dx*dx+dy*dy)+1;h.addHeat(nx,ny,500/dist);if(g.getType(nx,ny)!=='empty'&&h.chance(0.005/dist))g.clearCell(nx,ny);}}});
ElementRegistry.register({id:'cosmic_ray',name:'Cosmic Ray',category:'space',color:'#ffffff',density:0.001,state:'energy',desc:'High-energy particle. Passes through everything.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??20)-1;if(cell.energy<=0){g.clearCell(x,y);return;}const d=cell.dir||1;g.swapCells(x,y,x+d,y);for(const[nx,ny]of h.neighbors4(x,y))h.addHeat(nx,ny,10);}});
ElementRegistry.register({id:'gamma_burst',name:'Gamma Burst',category:'space',color:'#44ff44',density:0.001,state:'energy',desc:'Intense gamma radiation burst.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??30)-0.8;if(cell.energy<=0){g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors8(x,y)){h.addHeat(nx,ny,50);const t=g.getType(nx,ny);if((t==='person'||t==='citizen')&&h.chance(0.1))g.setCell(nx,ny,'mutant');}h.GAS(x,y);}});
ElementRegistry.register({id:'space_dust',name:'Space Dust',category:'space',color:'#888888',density:0.05,state:'solid',desc:'Fine cosmic particles.',heatConductivity:0.01,tick(x,y,g,h){if(h.chance(0.1))h.POWDER(x,y);}});

// ── EXOTIC PHYSICS ────────────────────────────────────────────────
ElementRegistry.register({id:'strange_matter',name:'Strange Matter',category:'space',color:'#ff00aa',density:999,state:'special',desc:'Converts all matter it touches into more strange matter.',heatConductivity:0,tick(x,y,g,h){for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='wall'&&t!=='strange_matter'&&h.chance(0.02))g.setCell(nx,ny,'strange_matter');}}});
ElementRegistry.register({id:'exotic_matter',name:'Exotic Matter',category:'space',color:'#ff44ff',density:0.001,state:'special',desc:'Repels gravity. Falls upward.',heatConductivity:0,tick(x,y,g,h){if(g.isEmpty(x,y-1))g.swapCells(x,y,x,y-1);else{const d=h.rnd()<0.5?1:-1;if(g.isEmpty(x+d,y-1))g.swapCells(x,y,x+d,y-1);}}});
ElementRegistry.register({id:'tachyon',name:'Tachyon',category:'space',color:(cell,x,y,f)=>`hsl(${(f??0)*5%360},100%,70%)`,density:0.001,state:'energy',desc:'Faster-than-light particle. Moves unpredictably.',heatConductivity:0,tick(x,y,g,h){const dx=h.randInt(-3,3),dy=h.randInt(-3,3);if(g.inBounds(x+dx,y+dy)&&g.isEmpty(x+dx,y+dy))g.swapCells(x,y,x+dx,y+dy);}});
ElementRegistry.register({id:'phase_matter',name:'Phase Matter',category:'space',color:'#ff00ff',density:0.5,state:'special',desc:'Alternates between solid and gas states.',heatConductivity:0.05,tick(x,y,g,h,frame){if((frame??0)%60<30){if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}else{h.GAS(x,y);}}});
ElementRegistry.register({id:'aether',name:'Aether',category:'special',color:'#ccddff',density:0.001,state:'gas',desc:'Mystical substance. Drifts through everything.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??100);h.GAS(x,y);}});
ElementRegistry.register({id:'nether',name:'Nether',category:'space',color:'#440022',density:999,state:'special',desc:'Destroys everything it touches.',heatConductivity:0,tick(x,y,g,h){for(const[nx,ny]of h.neighbors8(x,y)){const t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='wall'&&t!=='nether'&&h.chance(0.05))g.clearCell(nx,ny);}}});
ElementRegistry.register({id:'god_particle',name:'God Particle',category:'space',color:(cell,x,y,f)=>['#ffffff','#ffaaff','#aaffff','#ffffaa'][(f??0)%4],density:999,state:'special',desc:'Creates matter from nothing.',heatConductivity:0,tick(x,y,g,h){if(h.chance(0.1)){const elems=PW.ElementRegistry.allArray().filter(e=>!['god_particle','singularity','void_','nether','strange_matter'].includes(e.id));const e=elems[0|h.rnd()*elems.length];for(const[nx,ny]of h.neighbors4r(x,y)){if(g.isEmpty(nx,ny)){g.setCell(nx,ny,e.id);break;}}}}});
ElementRegistry.register({id:'philosophers_stone',name:"Philo. Stone",category:'special',color:'#ff2200',density:999,state:'special',desc:'Transmutes elements. The alchemist dream.',heatConductivity:0,tick(x,y,g,h){if(h.chance(0.02)){for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if(t==='iron'||t==='lead_pb')g.setCell(nx,ny,'gold');if(t==='sand')g.setCell(nx,ny,'diamond');if(t==='stone')g.setCell(nx,ny,'gold');if(t==='coal')g.setCell(nx,ny,'diamond');}}}});
ElementRegistry.register({id:'timefreeze',name:'Time Freeze',category:'special',color:(cell,x,y,f)=>`hsl(${200+(f??0)%60},80%,${40+Math.sin((f??0)*0.1)*10}%)`,density:999,state:'special',desc:'Freezes all nearby particles in time.',heatConductivity:0,tick(x,y,g,h){for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){if(!dx&&!dy)continue;g.markUpdated(x+dx,y+dy);}}});
ElementRegistry.register({id:'gravity_dust',name:'Gravity Dust',category:'special',color:'#9944cc',density:0.5,state:'solid',desc:'Creates localized gravity field. Pulls nearby particles.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??100)-0.35;if(cell.energy<=0){g.clearCell(x,y);return;}const R=5;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const dist=Math.sqrt(dx*dx+dy*dy);if(dist<1||dist>R)continue;const nx=x+dx,ny=y+dy,t=g.getType(nx,ny);if(!t||t==='wall'||t==='gravity_dust')continue;if(h.chance(0.038/dist)){const tx=nx+(dx<0?1:dx>0?-1:0),ty=ny+(dy<0?1:dy>0?-1:0);if(g.inBounds(tx,ty)&&g.isEmpty(tx,ty))g.swapCells(nx,ny,tx,ty);}}if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'crystal_seed',name:'Crystal Seed',category:'special',color:'#88ccff',density:1.5,state:'solid',desc:'Grows into a crystal formation over time.',heatConductivity:0.2,tick(x,y,g,h){if(h.chance(0.005)){for(const[nx,ny]of h.neighbors4r(x,y)){if(g.isEmpty(nx,ny)){g.setCell(nx,ny,'crystal_seed');const nc=g.getCell(nx,ny);if(nc)nc.energy=(nc.energy??100)*0.9;break;}}}const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??100)-0.01;if(cell.energy<10)g.setCell(x,y,'diamond');}});

// ── FOOD ──────────────────────────────────────────────────────────
ElementRegistry.register({id:'cheese',name:'Cheese',category:'special',color:'#ffdd44',density:1.1,state:'solid',desc:'Dairy product. Burns. Attracts rats.',burnAt:200,burnInto:'smoke',burnTime:80,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'bread',name:'Bread',category:'special',color:'#cc9944',density:0.8,state:'solid',desc:'Baked goods. Burns.',burnAt:180,burnInto:'ash',burnTime:100,heatConductivity:0.06,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'meat',name:'Meat',category:'special',color:'#cc4444',density:1.1,state:'solid',desc:'Raw meat. Burns.',burnAt:150,burnInto:'ash',burnTime:80,heatConductivity:0.08,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'sugar_elem',name:'Sugar',category:'special',color:'#ffffff',density:1.6,state:'solid',desc:'Dissolves in water. Burns.',burnAt:160,burnInto:'smoke',burnTime:60,heatConductivity:0.05,tick(x,y,g,h){h.doBurning(x,y);h.POWDER(x,y);}});

// ── MINERALS / EARTH ──────────────────────────────────────────────
ElementRegistry.register({id:'basalt',name:'Basalt',category:'solids',color:'#2a2a2a',density:3.0,state:'solid',desc:'Dark volcanic rock.',meltAt:1200,meltsInto:'lava',heatConductivity:0.07,tick(x,y,g,h){h.doHeat(x,y);}});
ElementRegistry.register({id:'sandstone',name:'Sandstone',category:'solids',color:'#c8a464',density:2.6,state:'solid',desc:'Sedimentary rock.',meltAt:1200,meltsInto:'lava',heatConductivity:0.06,tick(x,y,g,h){if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'quartz',name:'Quartz',category:'solids',color:'#eef5ff',density:2.65,state:'solid',desc:'Hard transparent mineral.',meltAt:1700,meltsInto:'molten_glass',heatConductivity:0.03,tick(x,y,g,h){}});
ElementRegistry.register({id:'pumice',name:'Pumice',category:'solids',color:'#ccbbaa',density:0.6,state:'solid',desc:'Porous volcanic rock. Floats on water.',heatConductivity:0.04,tick(x,y,g,h){if(g.getType(x,y+1)!=='water'&&g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'stalactite',name:'Stalactite',category:'solids',color:'#aaaaaa',density:2.8,state:'solid',desc:'Cave formation. Falls when unsupported.',heatConductivity:0.06,tick(x,y,g,h){if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'ash2',name:'Ash+',category:'powders',color:'#777777',density:0.25,state:'solid',desc:'Fine volcanic ash.',heatConductivity:0.02,tick(x,y,g,h){if(h.chance(0.4))h.POWDER(x,y);}});
ElementRegistry.register({id:'gravel2',name:'Gravel+',category:'powders',color:'#888880',density:2.1,state:'solid',desc:'Mixed rock fragments.',meltAt:1100,meltsInto:'lava',heatConductivity:0.06,tick(x,y,g,h){h.POWDER(x,y);}});
ElementRegistry.register({id:'lead_pb',name:'Lead',category:'solids',color:'#707070',density:11.3,state:'solid',desc:'Dense heavy metal.',meltAt:327,meltsInto:'molten_lead',heatConductivity:0.3,tick(x,y,g,h){h.doHeat(x,y);}});
ElementRegistry.register({id:'gold_elem',name:'Gold',category:'solids',color:'#ffd700',density:19.3,state:'solid',desc:'Precious metal. Immune to corrosion.',meltAt:1064,meltsInto:'molten_gold',heatConductivity:0.81,tick(x,y,g,h){h.doHeat(x,y);}});
ElementRegistry.register({id:'mercury2',name:'Mercury+',category:'liquids',color:'#aaaaaa',density:13.6,state:'liquid',desc:'Very dense liquid metal. Toxic.',heatConductivity:0.08,tick(x,y,g,h){h.LIQUID(x,y,0.95);}});
ElementRegistry.register({id:'magnet2',name:'Magnet+',category:'tech',color:'#ff3333',density:999,state:'solid',desc:'Stronger magnet.',heatConductivity:0.3,tick(x,y,g,h){const METALS=new Set(['metal','steel','iron','copper','gold','lead','wire','battery']);for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const nx=x+dx,ny=y+dy;if(!g.inBounds(nx,ny))continue;if(!METALS.has(g.getType(nx,ny)))continue;if(!h.chance(0.12))continue;const mx=nx+(dx<0?1:dx>0?-1:0),my=ny+(dy<0?1:dy>0?-1:0);if(g.inBounds(mx,my)&&g.isEmpty(mx,my))g.swapCells(nx,ny,mx,my);}}});
ElementRegistry.register({id:'eraser2',name:'Eraser+',category:'special',color:'#ff8888',density:999,state:'special',desc:'Deletes everything around it continuously.',heatConductivity:0,tick(x,y,g,h){for(const[nx,ny]of h.neighbors8(x,y)){const t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='wall'&&t!=='eraser2'&&h.chance(0.2))g.clearCell(nx,ny);}}});
ElementRegistry.register({id:'mirror',name:'Mirror',category:'special',color:'#cceeee',density:2.5,state:'solid',desc:'Reflects laser beams.',burnAt:1500,heatConductivity:0.02,tick(x,y,g,h){}});
ElementRegistry.register({id:'shield',name:'Shield',category:'special',color:'#88ccff',density:999,state:'special',desc:'Energy barrier. Blocks most elements.',heatConductivity:0,tick(x,y,g,h){for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if(!t||t==='empty'||t==='shield'||t==='wall')continue;const def=ElementRegistry.get(t);if(def?.state!=='special'&&def?.state!=='solid'){g.clearCell(nx,ny);}}}});
ElementRegistry.register({id:'turret',name:'Turret',category:'tech',color:'#334422',density:999,state:'solid',desc:'Auto-fires at zombies and mutants.',heatConductivity:0.1,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??0);if(h.chance(0.04)){for(let k=1;k<16;k++){if(!g.inBounds(x,y-k))break;const t=g.getType(x,y-k);if(t==='zombie'||t==='mutant'||t==='alien'||t==='virus'){g.clearCell(x,y-k);break;}if(t&&t!=='person'&&t!=='citizen'&&t!=='police'&&t!=='ant'&&t!=='empty')break;}}}});
ElementRegistry.register({id:'ozone',name:'Ozone',category:'gases',color:'#88ccff',density:0.001,state:'gas',desc:'Blocks radiation. Depleted by acid.',heatConductivity:0.01,tick(x,y,g,h){for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if(t==='radiation'&&h.chance(0.3)){g.clearCell(nx,ny);g.clearCell(x,y);return;}if(t==='acid_gas'&&h.chance(0.1)){g.clearCell(x,y);return;}}const cell=g.getCell(x,y);if(cell)cell.energy=(cell.energy??100);h.GAS(x,y);}});
ElementRegistry.register({id:'helium',name:'Helium',category:'gases',color:'#ddeeFF',density:0.0001,state:'gas',desc:'Lightest noble gas. Rises very fast.',heatConductivity:0.02,tick(x,y,g,h){if(g.isEmpty(x,y-1)){g.swapCells(x,y,x,y-1);}else{const d=h.rnd()<0.5?1:-1;if(g.isEmpty(x+d,y-1))g.swapCells(x,y,x+d,y-1);else if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}const cell=g.getCell(x,y);if(cell)cell.energy=(cell.energy??80);}});
ElementRegistry.register({id:'argon',name:'Argon',category:'gases',color:'#ccddee',density:0.001,state:'gas',desc:'Inert noble gas. Does nothing.',heatConductivity:0.01,tick(x,y,g,h){const cell=g.getCell(x,y);if(cell)cell.energy=(cell.energy??90);h.GAS(x,y);}});
ElementRegistry.register({id:'wind',name:'Wind',category:'weather',color:'#aaccdd',density:0.001,state:'gas',desc:'Strong air current. Pushes light particles.',heatConductivity:0.01,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??60)-0.2;if(cell.energy<=0){g.clearCell(x,y);return;}const dir=cell.dir||1;const LIGHT=new Set(['smoke','steam','gas','co2','ash','snow','sand','fire','ember']);for(let i=1;i<=6;i++){const bx=x+dir*i;if(!g.inBounds(bx,y))break;if(LIGHT.has(g.getType(bx,y))&&h.chance(0.3)){if(g.isEmpty(bx+dir,y))g.swapCells(bx,y,bx+dir,y);break;}}if(g.isEmpty(x+dir,y))g.swapCells(x,y,x+dir,y);}});
ElementRegistry.register({id:'spark',name:'Spark',category:'energy',color:'#ffff88',density:0.001,state:'energy',desc:'Electrical spark. Briefly exists then vanishes.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??8)-1;if(cell.energy<=0){g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors4(x,y)){h.addHeat(nx,ny,15);if(g.getType(nx,ny)==='wire'){const nc=g.getCell(nx,ny);if(nc)nc.energy=50;}}h.GAS(x,y);}});
ElementRegistry.register({id:'electricity',name:'Electricity',category:'energy',color:(cell,x,y,f)=>`hsl(${50+(f??0)*10%40},100%,75%)`,density:0.001,state:'energy',desc:'Raw electrical discharge.',heatConductivity:1.0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??20)-1;if(cell.energy<=0){g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors4(x,y)){h.addHeat(nx,ny,40);const t=g.getType(nx,ny);if(t==='wire'){const nc=g.getCell(nx,ny);if(nc)nc.energy=50;}if(t==='water'&&h.chance(0.1)){g.setCell(nx,ny,'steam');g.clearCell(x,y);return;}if((t==='person'||t==='citizen'||t==='zombie')&&h.chance(0.3))g.clearCell(nx,ny);}h.GAS(x,y);}});
ElementRegistry.register({id:'flamethrower',name:'Flamethrower',category:'tech',color:'#ff4400',density:999,state:'solid',desc:'Emits a stream of fire.',heatConductivity:0.1,tick(x,y,g,h,frame){if((frame??0)%2===0){const cell=g.getCell(x,y);if(!cell)return;const dir=cell.dir||1;for(let i=1;i<=8;i++){const bx=x+dir*i;if(!g.inBounds(bx,y))break;if(g.isEmpty(bx,y)){g.setCell(bx,y,'fire');const fc=g.getCell(bx,y);if(fc)fc.energy=20;break;}else{const def=ElementRegistry.get(g.getType(bx,y));if(def?.burnAt){const nc=g.getCell(bx,y);if(nc)nc.burning=true;}break;}}}}});
ElementRegistry.register({id:'shrapnel',name:'Shrapnel',category:'explosives',color:'#888888',density:3.0,state:'solid',desc:'Metal fragments from explosions. Falls fast.',heatConductivity:0.3,tick(x,y,g,h){
  for(let i=0;i<3;i++){
    if(!g.isEmpty(x,y+1)){
      const t=g.getType(x,y+1);
      if(t&&t!=='wall'){const nc=g.getCell(x,y+1);if(nc)nc.heat=(nc.heat??0)+100;g.clearCell(x,y);}
      return;
    }
    g.swapCells(x,y,x,y+1);
  }
}});
ElementRegistry.register({id:'railgun',name:'Railgun',category:'tech',color:'#4444cc',density:999,state:'solid',desc:'Electromagnetic launcher. Fires metal at extreme speed.',heatConductivity:0.2,tick(x,y,g,h,frame){if(h.chance(0.01)){const cell=g.getCell(x,y);const dir=cell?.dir||1;const bx=x+dir;if(g.inBounds(bx,y)&&g.isEmpty(bx,y)){g.setCell(bx,y,'shrapnel');const sc=g.getCell(bx,y);if(sc)sc.dir=dir;}}}});
ElementRegistry.register({id:'plasma_cannon',name:'Plasma Cannon',category:'tech',color:'#cc00ff',density:999,state:'solid',desc:'Fires plasma bolts.',heatConductivity:0.1,tick(x,y,g,h){if(h.chance(0.02)){const cell=g.getCell(x,y);const dir=cell?.dir||1;const bx=x+dir;if(g.inBounds(bx,y)&&g.isEmpty(bx,y)){g.setCell(bx,y,'plasma');const pc=g.getCell(bx,y);if(pc){pc.energy=60;pc.dir=dir;}}}}});
ElementRegistry.register({id:'solar_wind',name:'Solar Wind',category:'space',color:'#ffcc44',density:0.001,state:'energy',desc:'Charged particle stream from the sun.',heatConductivity:0.1,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??50)-0.3;if(cell.energy<=0){g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors4(x,y))h.addHeat(nx,ny,8);h.GAS(x,y);}});
ElementRegistry.register({id:'superfluid',name:'Superfluid',category:'liquids',color:'#aaffee',density:0.8,state:'liquid',desc:'Zero-viscosity. Flows without resistance.',heatConductivity:0.3,tick(x,y,g,h){h.LIQUID(x,y,1.0);const d=h.rnd()<0.5?1:-1;if(g.isEmpty(x+d,y-1)&&!g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y-1);}});
ElementRegistry.register({id:'polymer',name:'Polymer',category:'solids',color:'#ddccbb',density:1.2,state:'solid',desc:'Synthetic material. Heat-resistant.',burnAt:400,burnInto:'smoke',burnTime:200,heatConductivity:0.03,tick(x,y,g,h){h.doBurning(x,y);}});
ElementRegistry.register({id:'dna',name:'DNA',category:'special',color:'#44ff88',density:1.1,state:'liquid',desc:'Genetic material. Can mutate elements.',heatConductivity:0.05,tick(x,y,g,h){if(h.chance(0.002)){const t=g.getType(x,y+1);if(t&&t!=='empty'&&t!=='dna'&&h.chance(0.1)){const creatures=['person','zombie','ant','fish','bird','worm'];g.setCell(x,y+1,creatures[0|h.rnd()*creatures.length]);}}h.LIQUID(x,y,0.5);}});
ElementRegistry.register({id:'cell',name:'Cell',category:'special',color:'#ccff88',density:1.0,state:'solid',desc:'Biological cell. Divides slowly.',heatConductivity:0.05,tick(x,y,g,h){const cell2=g.getCell(x,y);if(!cell2)return;cell2.energy=(cell2.energy??200)-0.1;if(cell2.energy<=0){g.setCell(x,y,'nutrient');return;}if(h.chance(0.001)){for(const[nx,ny]of h.neighbors4r(x,y)){if(g.isEmpty(nx,ny)){g.setCell(nx,ny,'cell');break;}}}}});
ElementRegistry.register({id:'parasite',name:'Parasite',category:'creatures',color:'#886644',density:0.5,state:'solid',desc:'Latches onto hosts and drains them.',heatConductivity:0.04,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??100)-0.05;if(cell.energy<=0){g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='person'||t==='citizen'||t==='zombie'||t==='ant')&&h.chance(0.01)){g.clearCell(nx,ny);cell.energy=Math.min(200,(cell.energy??100)+50);return;}}if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);}});
ElementRegistry.register({id:'mutant_virus',name:'Mutant Virus',category:'special',color:'#ff44cc',density:0.001,state:'gas',desc:'More aggressive virus. Mutates instead of killing.',heatConductivity:0,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??80)-0.2;if(cell.energy<=0){g.clearCell(x,y);return;}for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='person'||t==='citizen')&&h.chance(0.03))g.setCell(nx,ny,'mutant');}h.GAS(x,y);}});
ElementRegistry.register({id:'ecosystem',name:'Ecosystem',category:'nature',color:'#22aa44',density:999,state:'special',desc:'Self-sustaining life zone. Spawns plants and creatures.',heatConductivity:0.05,tick(x,y,g,h,frame){if((frame??0)%60===0&&h.chance(0.3)){const spawns=['plant','grass','algae','worm','ant'];const s=spawns[0|h.rnd()*spawns.length];for(const[nx,ny]of h.neighbors4r(x,y)){if(g.isEmpty(nx,ny)){g.setCell(nx,ny,s);break;}}}}});
ElementRegistry.register({id:'geyser',name:'Geyser',category:'weather',color:'#aaddff',density:999,state:'special',desc:'Periodically erupts hot water and steam.',heatConductivity:0.2,tick(x,y,g,h,frame){if((frame??0)%90===0){for(let i=1;i<=8;i++){if(!g.inBounds(x,y-i))break;if(g.isEmpty(x,y-i)){g.setCell(x,y-i,h.rnd()<0.5?'steam':'water');const sc=g.getCell(x,y-i);if(sc){sc.energy=60;sc.heat=200;}}else break;}}}});
ElementRegistry.register({id:'dust_devil',name:'Dust Devil',category:'weather',color:'#ccbbaa',density:0.001,state:'gas',desc:'Small rotating dust funnel.',heatConductivity:0.01,tick(x,y,g,h){const cell=g.getCell(x,y);if(!cell)return;cell.energy=(cell.energy??200)-0.3;if(cell.energy<=0){g.clearCell(x,y);return;}const R=3;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const dist=Math.sqrt(dx*dx+dy*dy);if(dist<1||dist>R)continue;const nx=x+dx,ny=y+dy,t=g.getType(nx,ny);if(t==='sand'||t==='dirt'||t==='ash'||t==='snow'){if(g.isEmpty(nx,ny-1))g.swapCells(nx,ny,nx,ny-1);}}const d=h.rnd()<0.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}});
ElementRegistry.register({id:'hailstorm',name:'Hailstorm',category:'weather',color:'#bbccdd',density:999,state:'special',desc:'Produces hail continuously.',heatConductivity:0.1,tick(x,y,g,h,frame){if((frame??0)%4===0&&h.chance(0.4)){const bx=x+(h.randInt(-5,5));if(g.inBounds(bx,y-1)&&g.isEmpty(bx,y-1))g.setCell(bx,y-1,'hail');}}});
