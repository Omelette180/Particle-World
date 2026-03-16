/**
 * PARTICLE WORLD v2.0 — js/physics.js
 * Enhanced physics engine — best of Sandboxels merged into PW architecture.
 *
 * Sandboxels features added:
 *  - POWDER:   proper no-noclip diagonals, random side-first
 *  - LIQUID:   viscosity support, density-aware displacement
 *  - GAS:      all-direction shuffled spread, energy-based decay
 *  - MOLTEN:   emits fire upward, self-heats, viscous liquid
 *  - FIRE:     energy countdown, heats+ignites neighbors, turns to smoke
 *  - Reactions: elem1/elem2/chance/tempMin table (like Sandboxels reactions:{})
 *  - Burning:   burnTime/burnInto countdown with neighbor ignition
 *  - explode(): chain reactions, budget cap, screen shake
 *  - Heat:      conductivity-based per-tick neighbor diffusion
 *
 * PW features kept:
 *  - ElementRegistry (no raw arrays)
 *  - Grid API (getCell/setCell/swapCells)
 *  - All PW branding, Firebase, loader, multiplayer untouched
 */

'use strict';

// ══════════════════════════════════════════════════════════════════
// REACTION SYSTEM  (like Sandboxels reactions:{} but centralized)
// ══════════════════════════════════════════════════════════════════
const Reactions = (() => {
  const _t = new Map(); // Map<elemId, Map<otherId, def>>

  function _pick(val) {
    if (!val && val !== null) return val;
    return Array.isArray(val) ? val[0 | Math.random() * val.length] : val;
  }

  return {
    add(elemId, reactions) {
      if (!_t.has(elemId)) _t.set(elemId, new Map());
      const m = _t.get(elemId);
      for (const [other, def] of Object.entries(reactions)) {
        m.set(other, def);
      }
    },

    check(x1, y1, x2, y2) {
      const t1 = Grid.getType(x1, y1);
      const t2 = Grid.getType(x2, y2);
      if (!t1 || !t2 || t1 === 'empty' || t2 === 'empty') return false;

      let def = _t.get(t1)?.get(t2);
      let ax = x1, ay = y1, bx = x2, by = y2;
      if (!def) {
        def = _t.get(t2)?.get(t1);
        if (!def) return false;
        if (def.oneway) return false;
        ax = x2; ay = y2; bx = x1; by = y1;
      }

      if (def.chance !== undefined && Math.random() > def.chance) return false;
      if (def.tempMin !== undefined) {
        if ((Grid.getCell(ax, ay)?.heat ?? 0) < def.tempMin) return false;
      }

      if (def.elem1 !== undefined) {
        const target = _pick(def.elem1);
        if (target === null) Grid.clearCell(ax, ay);
        else if (target) Grid.setCell(ax, ay, target);
      }
      if (def.elem2 !== undefined) {
        const target = _pick(def.elem2);
        if (target === null) Grid.clearCell(bx, by);
        else if (target) Grid.setCell(bx, by, target);
      }
      if (def.func) def.func(ax, ay, bx, by);
      return true;
    },

    runNeighbors(x, y) {
      if (Reactions.check(x,y, x,y-1)) return true;
      if (Reactions.check(x,y, x+1,y)) return true;
      if (Reactions.check(x,y, x,y+1)) return true;
      if (Reactions.check(x,y, x-1,y)) return true;
      return false;
    },
  };
})();

// ══════════════════════════════════════════════════════════════════
// PHYSICS BEHAVIORS
// ══════════════════════════════════════════════════════════════════
const Physics = (() => {
  const rnd = Math.random.bind(Math);
  const rb  = () => rnd() < 0.5;

  function canDisplace(ax, ay, bx, by) {
    if (!Grid.inBounds(bx, by)) return false;
    if (Grid.isEmpty(bx, by)) return true;
    const myDef  = ElementRegistry.get(Grid.getType(ax, ay));
    const itsDef = ElementRegistry.get(Grid.getType(bx, by));
    if (!myDef || !itsDef) return false;
    if (itsDef.state === 'gas') return true;
    if (itsDef.state === 'liquid' && (myDef.density ?? 0) > (itsDef.density ?? 0)) return true;
    return false;
  }

  function tryMove(ax, ay, bx, by) {
    if (Grid.isEmpty(bx, by)) { Grid.swapCells(ax, ay, bx, by); return true; }
    if (canDisplace(ax, ay, bx, by)) { Grid.swapCells(ax, ay, bx, by); return true; }
    return false;
  }

  function POWDER(x, y) {
    Reactions.runNeighbors(x, y);
    if (!Grid.inBounds(x, y)) return;
    if (tryMove(x, y, x, y+1)) return;
    const d = rb() ? 1 : -1;
    if (tryMove(x, y, x+d, y+1)) return;
    tryMove(x, y, x-d, y+1);
  }

  function LIQUID(x, y, viscosity) {
    Reactions.runNeighbors(x, y);
    if (!Grid.inBounds(x, y)) return;
    const visc = viscosity ?? 1.0;
    if (visc < 1 && rnd() > visc) return;
    const d = rb() ? 1 : -1;
    if (tryMove(x, y, x, y+1)) return;
    if (rnd() < 0.55 && tryMove(x, y, x+d, y+1)) return;
    if (rnd() < 0.55 && tryMove(x, y, x-d, y+1)) return;
    if (tryMove(x, y, x+d, y)) return;
    tryMove(x, y, x-d, y);
  }

  function GAS(x, y) {
    Reactions.runNeighbors(x, y);
    if (!Grid.inBounds(x, y)) return;
    const cell = Grid.getCell(x, y);
    if (cell?.energy !== undefined && cell.energy > 0) {
      cell.energy -= rnd() * 0.35;
      if (cell.energy <= 0) { Grid.clearCell(x, y); return; }
    }
    const dirs = [[0,-1],[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    for (let i = dirs.length-1; i > 0; i--) {
      const j = 0|(rnd()*(i+1)); [dirs[i],dirs[j]]=[dirs[j],dirs[i]];
    }
    for (const [dx,dy] of dirs) {
      if (dy<0 && Grid.isEmpty(x+dx,y+dy)) { Grid.swapCells(x,y,x+dx,y+dy); return; }
    }
    for (const [dx,dy] of dirs) {
      if (Grid.isEmpty(x+dx,y+dy)) { Grid.swapCells(x,y,x+dx,y+dy); return; }
    }
  }

  function FIRE(x, y) {
    Reactions.runNeighbors(x, y);
    if (!Grid.inBounds(x, y)) return;
    const cell = Grid.getCell(x, y);
    if (!cell) return;
    cell.energy = (cell.energy ?? 60) - rnd()*2.5;
    if (cell.energy <= 0) {
      Grid.setCell(x, y, 'smoke');
      const sc = Grid.getCell(x, y);
      if (sc) sc.energy = 28 + rnd()*22;
      return;
    }
    for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx=x+dx, ny=y+dy;
      if (!Grid.inBounds(nx,ny)) continue;
      const nc = Grid.getCell(nx,ny);
      if (!nc||nc.type==='empty') continue;
      nc.heat = (nc.heat??0) + 5;
      const nd = ElementRegistry.get(nc.type);
      if (nd?.burnAt && nc.heat>nd.burnAt && rnd()<0.04) {
        Grid.setCell(nx,ny,'fire');
        const fc=Grid.getCell(nx,ny);
        if (fc) { fc.energy=50+rnd()*30; fc.heat=nc.heat; }
      }
    }
    const d=rb()?1:-1;
    if (Grid.isEmpty(x,y-1))    { Grid.swapCells(x,y,x,y-1);   return; }
    if (Grid.isEmpty(x+d,y-1))  { Grid.swapCells(x,y,x+d,y-1); return; }
    if (Grid.isEmpty(x+d,y))    { Grid.swapCells(x,y,x+d,y);   return; }
    if (Grid.isEmpty(x-d,y))    { Grid.swapCells(x,y,x-d,y);   return; }
  }

  function MOLTEN(x, y) {
    Reactions.runNeighbors(x, y);
    if (!Grid.inBounds(x, y)) return;
    const cell = Grid.getCell(x, y);
    if (cell) cell.heat = (cell.heat??800) + 0.3;
    if (rnd()<0.025 && Grid.isEmpty(x,y-1)) {
      Grid.setCell(x,y-1,'fire');
      const fc=Grid.getCell(x,y-1);
      if (fc) { fc.energy=25; fc.heat=800; }
    }
    LIQUID(x, y, 0.25);
  }

  function doBurning(x, y) {
    const cell = Grid.getCell(x, y);
    if (!cell?.burning) return;
    const def = ElementRegistry.get(cell.type);
    if (!def) return;
    cell.heat = (cell.heat??0) + 2;
    cell.burnTicks = (cell.burnTicks ?? (def.burnTime ?? 100)) - 1;
    if (rnd()<0.1 && Grid.isEmpty(x,y-1)) {
      Grid.setCell(x,y-1,'fire');
      const fc=Grid.getCell(x,y-1);
      if (fc) fc.energy=35+rnd()*20;
    }
    for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx=x+dx, ny=y+dy;
      if (!Grid.inBounds(nx,ny)) continue;
      const nc=Grid.getCell(nx,ny);
      const nd=ElementRegistry.get(nc?.type);
      if (nd?.burnAt && !nc?.burning && (nc?.heat??0)>nd.burnAt && rnd()<0.05) {
        if (nc) nc.burning=true;
      }
    }
    if (cell.burnTicks <= 0) {
      const into = def.burnInto;
      if (into) {
        const t = Array.isArray(into) ? into[0|rnd()*into.length] : into;
        if (t) Grid.setCell(x,y,t); else Grid.clearCell(x,y);
      } else Grid.clearCell(x,y);
    }
  }

  function doHeat(x, y) {
    const cell = Grid.getCell(x, y);
    if (!cell?.heat) return;
    const cond = (ElementRegistry.get(cell.type)?.heatConductivity ?? 0.05);
    for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx=x+dx, ny=y+dy;
      if (!Grid.inBounds(nx,ny)) continue;
      const nc=Grid.getCell(nx,ny);
      if (!nc) continue;
      const diff = (cell.heat-(nc.heat??0))*cond*0.25;
      if (Math.abs(diff)<0.01) continue;
      cell.heat -= diff;
      nc.heat = (nc.heat??0)+diff;
    }
  }

  function explode(cx, cy, radius, opts) {
    if (typeof opts === 'number') opts = { strength: opts };
    opts = opts || {};
    const fireType = opts.fire ?? 'fire';
    const strength = opts.strength ?? 1;
    if (opts.shake !== false) _screenShake(Math.min(10, radius*0.7));

    const ov = document.getElementById('ro');
    if (ov) {
      const px=(cx/(Grid.cols||100)*100).toFixed(0);
      const py=(cy/(Grid.rows||60)*100).toFixed(0);
      ov.style.cssText=`position:absolute;inset:0;pointer-events:none;z-index:50;opacity:1;transition:opacity .18s;background:radial-gradient(ellipse at ${px}% ${py}%,rgba(255,200,80,.5)0%,rgba(255,80,0,.25)40%,transparent 75%);`;
      setTimeout(()=>{ if(ov) ov.style.opacity='0'; },180);
    }

    const total=(2*radius+1)**2;
    const skip = total>900 ? 1-900/total : 0;

    for (let dy=-radius; dy<=radius; dy++) {
      for (let dx=-radius; dx<=radius; dx++) {
        if (dx*dx+dy*dy > radius*radius) continue;
        if (skip>0 && rnd()<skip) continue;
        const nx=cx+dx, ny=cy+dy;
        if (!Grid.inBounds(nx,ny)) continue;
        const t=Grid.getType(nx,ny);
        const dist=Math.sqrt(dx*dx+dy*dy)/radius;
        const power=(1-dist)*strength;
        const nc=Grid.getCell(nx,ny);
        if (nc && t!=='empty') nc.heat=(nc.heat??0)+power*180;
        if (t==='wall'||t==='neutronstar') continue;
        if (dist<0.35) {
          Grid.clearCell(nx,ny);
          if (rnd()<0.4*power) _spawnFire(nx,ny,fireType);
        } else if (rnd()<0.5*power) {
          if (t!=='empty') Grid.clearCell(nx,ny);
          if (rnd()<0.18) _spawnFire(nx,ny,fireType);
        }
        if (!t||t==='empty') continue;
        if (t==='tnt'        &&(dx||dy)&&rnd()<0.35) setTimeout(()=>explode(nx,ny,14,{strength:1.1}),      30+rnd()*80);
        if (t==='c4'                   &&rnd()<0.20) setTimeout(()=>explode(nx,ny,22,{strength:1.3}),      20+rnd()*50);
        if (t==='gunpowder'            &&rnd()<0.50) setTimeout(()=>explode(nx,ny, 8),                     15+rnd()*30);
        if (t==='dynamite'             &&rnd()<0.40) setTimeout(()=>explode(nx,ny,16,{strength:1.1}),      25+rnd()*60);
        if (t==='gas'||t==='methane')  { Grid.clearCell(nx,ny); if(rnd()<.5)_spawnFire(nx,ny,'fire'); }
        if (t==='hydrogen')            setTimeout(()=>explode(nx,ny,10,{fire:['fire','plasma']}),           10+rnd()*20);
        if (t==='napalm'||t==='tar')   { Grid.setCell(nx,ny,'fire'); const fc=Grid.getCell(nx,ny); if(fc)fc.energy=120; }
        if ((t==='uranium'||t==='plutonium')&&rnd()<0.02)
          setTimeout(()=>explode(nx,ny,radius*2,{fire:['radiation','fire','plasma'],strength:2}),100);
      }
    }
  }

  function _spawnFire(x, y, fireType) {
    const ft=Array.isArray(fireType)?fireType[0|rnd()*fireType.length]:fireType;
    Grid.setCell(x,y,ft);
    const fc=Grid.getCell(x,y);
    if (fc) fc.energy=40+rnd()*30;
  }

  function _screenShake(amount) {
    if (!window._shakeEnabled) return;
    const canvas=document.getElementById('gc');
    if (!canvas) return;
    let elapsed=0;
    const iv=setInterval(()=>{
      elapsed+=16; const rem=1-elapsed/280;
      if (rem<=0) { canvas.style.transform=''; clearInterval(iv); return; }
      canvas.style.transform=`translate(${(rnd()-.5)*amount*rem}px,${(rnd()-.5)*amount*rem}px)`;
    },16);
  }
  window.PW_screenShake = _screenShake;

  // Heatmap renderer
  function renderHeatMap() {
    const canvas=document.getElementById('hmc');
    if (!canvas||canvas.style.opacity==='0') return;
    const ctx=canvas.getContext('2d');
    const cs=Math.floor(canvas.width/Grid.cols);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let y=0;y<Grid.rows;y++) for (let x=0;x<Grid.cols;x++) {
      const h=Grid.getCell(x,y)?.heat??0;
      if (h<5) continue;
      const t=Math.min(1,h/1200);
      ctx.fillStyle=`rgba(${0|t*255},${0|t*55},${0|(1-t)*100},0.4)`;
      ctx.fillRect(x*cs,y*cs,cs,cs);
    }
  }
  setInterval(()=>{ if(window.PW) renderHeatMap(); },120);

  return { POWDER,LIQUID,GAS,FIRE,MOLTEN,doBurning,doHeat,explode,canDisplace };
})();

// ══════════════════════════════════════════════════════════════════
// MERGE INTO PW + REGISTER BUILT-IN REACTIONS
// ══════════════════════════════════════════════════════════════════
(function waitForPW() {
  if (!window.PW?.Helpers) { setTimeout(waitForPW, 30); return; }

  PW.Physics   = Physics;
  PW.Reactions = Reactions;

  Object.assign(PW.Helpers, {
    POWDER:       Physics.POWDER,
    LIQUID:       Physics.LIQUID,
    GAS:          Physics.GAS,
    FIRE:         Physics.FIRE,
    MOLTEN:       Physics.MOLTEN,
    doBurning:    Physics.doBurning,
    doHeat:       Physics.doHeat,
    doReactions:  Reactions.runNeighbors.bind(Reactions),
    addReactions: Reactions.add.bind(Reactions),
    explode:      Physics.explode,

    fallBelow(x, y) {
      if (Physics.canDisplace(x,y,x,y+1)) { Grid.swapCells(x,y,x,y+1); return true; }
      const d=Math.random()<.5?1:-1;
      if (Physics.canDisplace(x,y,x+d,y+1)) { Grid.swapCells(x,y,x+d,y+1); return true; }
      if (Physics.canDisplace(x,y,x-d,y+1)) { Grid.swapCells(x,y,x-d,y+1); return true; }
      return false;
    },
    flowSideways(x, y, flowRate) {
      const fr=flowRate??4;
      const d=Math.random()<.5?1:-1;
      for (let i=1;i<=fr;i++) {
        if (!Grid.inBounds(x+d*i,y)) break;
        if (Grid.isEmpty(x+d*i,y)) { Grid.swapCells(x,y,x+d*i,y); return true; }
        break;
      }
      for (let i=1;i<=fr;i++) {
        if (!Grid.inBounds(x-d*i,y)) break;
        if (Grid.isEmpty(x-d*i,y)) { Grid.swapCells(x,y,x-d*i,y); return true; }
        break;
      }
      return false;
    },
  });

  const R = Reactions.add.bind(Reactions);

  // Sand / dirt
  R('sand',  { water:{elem1:'wet_sand',elem2:null,chance:0.02}, lava:{elem1:'stone',elem2:null,chance:0.003} });
  R('dirt',  { water:{elem1:'mud',elem2:null,chance:0.03}, lava:{elem1:'stone',elem2:null,chance:0.01} });
  R('gravel',{ water:{elem1:'wet_sand',elem2:null,chance:0.01} });

  // Water reactions
  R('water', {
    lava:  {elem1:'steam',elem2:'stone',chance:0.08},
    fire:  {elem1:'steam',elem2:null,chance:0.15},
    salt:  {elem1:'saltwater',elem2:null,chance:0.05},
    ice:   {elem1:null,elem2:'water',chance:0.05,tempMin:5},
  });

  // Lava
  R('lava', {
    water: {elem1:'stone',elem2:'steam',chance:0.08},
    ice:   {elem1:'stone',elem2:'water',chance:0.1},
    snow:  {elem1:'stone',elem2:'steam',chance:0.08},
    wood:  {elem2:'fire',chance:0.02},
    sand:  {elem2:'stone',chance:0.003},
    plant: {elem2:'fire',chance:0.04},
  });

  // Fire extinguishers
  R('fire', {
    water: {elem1:'smoke',elem2:null,chance:0.5},
    ice:   {elem1:'smoke',elem2:'water',chance:0.2},
    snow:  {elem1:'smoke',elem2:'water',chance:0.15},
    oil:   {elem2:'fire',chance:0.1},
    gas:   {elem1:null,elem2:null,chance:0.5,func(ax,ay,bx,by){Grid.clearCell(bx,by);setTimeout(()=>PW.Helpers.explode(bx,by,6,{strength:0.8}),10);}},
  });

  // Ice / snow
  R('ice',  { fire:{elem1:'water',elem2:'smoke',chance:0.15}, lava:{elem1:'water',elem2:'stone',chance:0.1} });
  R('snow', { fire:{elem1:'water',chance:0.1}, lava:{elem1:'steam',chance:0.08} });

  // Wood
  R('wood', { lava:{elem1:'fire',chance:0.02}, acid:{elem1:null,chance:0.008} });

  // Oil
  R('oil', { fire:{elem1:'fire',chance:0.05}, lava:{elem1:'fire',chance:0.08} });

  // Acid
  R('acid', {
    stone: {elem2:null,chance:0.008}, sand:{elem2:null,chance:0.005},
    wood:  {elem2:null,chance:0.01},  ice: {elem2:'water',chance:0.05},
    dirt:  {elem2:null,chance:0.004}, plant:{elem2:null,chance:0.015},
  });

  // Explosives
  R('gunpowder', {
    fire: {elem1:null,elem2:null,chance:0.5,func(ax,ay){Grid.clearCell(ax,ay);PW.Helpers.explode(ax,ay,8,{strength:1});}},
    lava: {elem1:null,elem2:null,chance:0.5,func(ax,ay){Grid.clearCell(ax,ay);PW.Helpers.explode(ax,ay,8,{strength:1});}},
  });
  R('tnt', {
    fire: {elem1:null,chance:0.05,func(ax,ay){Grid.clearCell(ax,ay);setTimeout(()=>PW.Helpers.explode(ax,ay,14,{strength:1.2}),50+Math.random()*100);}},
    lava: {elem1:null,chance:0.03,func(ax,ay){Grid.clearCell(ax,ay);setTimeout(()=>PW.Helpers.explode(ax,ay,14,{strength:1.2}),50+Math.random()*100);}},
  });
  R('c4', {
    fire: {elem1:null,chance:0.02,func(ax,ay){Grid.clearCell(ax,ay);setTimeout(()=>PW.Helpers.explode(ax,ay,22,{strength:1.5}),80+Math.random()*120);}},
  });

  // Steam
  R('steam', { water:{elem1:null,chance:0.008,tempMin:1} });

  // Plant / nature
  R('plant', { fire:{elem1:'fire',chance:0.04}, lava:{elem1:'fire',chance:0.05} });
  R('smoke', { water:{elem1:null,chance:0.04} });

  console.log('[PW Physics] Enhanced physics + reactions loaded ✓');
})();
