/**
 * PARTICLE WORLD v2.0 — elements/creatures.js
 * Living things with AI movement.
 */
ElementRegistry.register({ id:'person',name:'Person',category:'creatures',color:'#f5c5a0',density:1.0,state:'solid',desc:'A human. Walks and panics.',burnAt:200,burnInto:'ash',burnTime:100,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    if(!g.isEmpty(x,y+1)){if(h.chance(.05)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y)&&g.isEmpty(x+d,y-1)){g.swapCells(x,y,x+d,y);}}}
    else{g.swapCells(x,y,x,y+1);}
  }
});
ElementRegistry.register({ id:'zombie',name:'Zombie',category:'creatures',color:'#667744',density:1.0,state:'solid',desc:'Spreads the infection.',burnAt:180,burnInto:'ash',burnTime:80,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    for(const[nx,ny]of h.neighbors4(x,y)){if(g.getType(nx,ny)==='person'&&h.chance(.007)){g.setCell(nx,ny,'zombie');}}
    if(!g.isEmpty(x,y+1)){if(h.chance(.04)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}}
    else g.swapCells(x,y,x,y+1);
  }
});
ElementRegistry.register({ id:'ant',name:'Ant',category:'creatures',color:'#442200',density:1.1,state:'solid',desc:'Tiny insect. Moves quickly.',heatConductivity:0.05,
  tick(x,y,g,h){
    if(!g.isEmpty(x,y+1)){if(h.chance(.12)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}}
    else g.swapCells(x,y,x,y+1);
  }
});
ElementRegistry.register({ id:'fish',name:'Fish',category:'creatures',color:'#5577ff',density:1.0,state:'solid',desc:'Swims in water.',heatConductivity:0.1,
  tick(x,y,g,h){
    const inWater=g.getType(x,y)==='water'||h.neighbors4(x,y).some(([nx,ny])=>g.getType(nx,ny)==='water');
    if(h.chance(.08)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y)||g.getType(x+d,y)==='water')g.swapCells(x,y,x+d,y);}
    if(!g.isEmpty(x,y+1)){}else g.swapCells(x,y,x,y+1);
  }
});
ElementRegistry.register({ id:'bird',name:'Bird',category:'creatures',color:'#997755',density:0.5,state:'solid',desc:'Flies upward and glides.',heatConductivity:0.08,
  tick(x,y,g,h){
    if(h.chance(.06)){const d=h.rnd()<.5?1:-1;const ny2=y+(h.rnd()<.5?-1:0);if(g.isEmpty(x+d,ny2))g.swapCells(x,y,x+d,ny2);}
  }
});
ElementRegistry.register({ id:'citizen',name:'Citizen',category:'creatures',color:'#4488ff',density:1.0,state:'solid',desc:'Ordinary citizen. Flees danger.',burnAt:200,burnInto:'ash',burnTime:100,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    if(!g.isEmpty(x,y+1)){if(h.chance(.06)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}}
    else g.swapCells(x,y,x,y+1);
  }
});
ElementRegistry.register({ id:'worm',name:'Worm',category:'creatures',color:'#cc6644',density:1.1,state:'solid',desc:'Tunnels through soil.',heatConductivity:0.05,
  tick(x,y,g,h){
    if(h.chance(.08)){
      const dirs=[[0,1],[1,0],[-1,0],[0,-1]];
      const d=dirs[0|h.rnd()*dirs.length];
      const nx=x+d[0],ny=y+d[1];
      const t=g.getType(nx,ny);
      if(t==='empty'||t==='dirt'||t==='sand'||t==='mud'){
        if(t!=='empty')g.clearCell(nx,ny);
        g.swapCells(x,y,nx,ny);
      }
    }
  }
});
ElementRegistry.register({ id:'snake',name:'Snake',category:'creatures',color:'#338822',density:1.2,state:'solid',desc:'Slithers along ground.',heatConductivity:0.08,
  tick(x,y,g,h){
    if(!g.isEmpty(x,y+1)){if(h.chance(.1)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}}
    else g.swapCells(x,y,x,y+1);
  }
});
ElementRegistry.register({ id:'spider',name:'Spider',category:'creatures',color:'#222222',density:1.0,state:'solid',desc:'Climbs walls. Leaves webs.',heatConductivity:0.05,
  tick(x,y,g,h){
    if(h.chance(.08)){
      const dirs=[[0,-1],[1,0],[-1,0],[0,1]];
      const d=dirs[0|h.rnd()*dirs.length];
      if(g.isEmpty(x+d[0],y+d[1]))g.swapCells(x,y,x+d[0],y+d[1]);
    }
    // Leave web occasionally
    if(h.chance(.005)&&g.isEmpty(x,y+1)&&!g.isEmpty(x,y-1)){g.setCell(x,y+1,'spiderweb');}
  }
});
ElementRegistry.register({ id:'rat',name:'Rat',category:'creatures',color:'#887766',density:1.1,state:'solid',desc:'Scurries through small spaces.',heatConductivity:0.08,
  tick(x,y,g,h){
    if(!g.isEmpty(x,y+1)){if(h.chance(.1)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}}
    else g.swapCells(x,y,x,y+1);
  }
});
ElementRegistry.register({ id:'frog',name:'Frog',category:'creatures',color:'#55aa22',density:1.0,state:'solid',desc:'Hops. Thrives near water.',heatConductivity:0.1,
  tick(x,y,g,h){
    if(h.chance(.06)){const d=h.rnd()<.5?1:-1;const hop=h.rnd()<.4?2:1;const nx=x+d,ny=y-hop;if(g.isEmpty(nx,ny))g.swapCells(x,y,nx,ny);}
    else if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);
  }
});

// ── VIRUS ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'virus',name:'Virus',category:'creatures',color:'#cc44cc',density:0.001,state:'gas',
  desc:'Airborne pathogen. Spreads fast, infects everything.',heatConductivity:0,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??100)-0.18;
    if(cell.energy<=0){g.clearCell(x,y);return;}
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='citizen'||t==='ant'||t==='plant')&&h.chance(0.038))g.clearCell(nx,ny);
      if(t==='water'&&h.chance(0.003))g.setCell(nx,ny,'virus');
    }
    h.GAS(x,y);
  }
});

// ── ZOMBIE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'zombie',name:'Zombie',category:'creatures',color:'#667744',density:1.0,state:'solid',
  desc:'Shambles toward the living. Spreading the infection.',burnAt:180,burnInto:'ash',burnTime:80,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    // Chase nearest person
    let tx=0,ty=0,bd=999;
    for(let dx=-12;dx<=12;dx++)for(let dy=-6;dy<=6;dy++){
      const t=g.getType(x+dx,y+dy);
      if(t==='person'||t==='citizen'){const dd=Math.abs(dx)+Math.abs(dy);if(dd<bd){bd=dd;tx=dx>0?1:-1;ty=dy>0?1:-1;}}
    }
    // Infect adjacent
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='citizen')&&h.chance(0.012))g.setCell(nx,ny,'zombie');
    }
    const cell=g.getCell(x,y);if(!cell)return;
    cell.dir=cell.dir||(h.rnd()<0.5?1:-1);
    const d=bd<999?tx:(cell.dir);
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.4)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else if(h.chance(0.2)&&g.isEmpty(x+d,y-1)&&g.isEmpty(x,y-1))g.swapCells(x,y,x+d,y-1);
  }
});

// ── PERSON ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'person',name:'Person',category:'creatures',color:'#e8a050',density:1.0,state:'solid',
  desc:'Flees fire, lava, and zombies.',burnAt:200,burnInto:'ash',burnTime:100,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    let fd=0;
    for(let dx=-6;dx<=6;dx++)for(let dy=-4;dy<=4;dy++){
      const t=g.getType(x+dx,y+dy);
      if(t==='fire'||t==='lava'||t==='acid'||t==='zombie'||t==='poison'||t==='mutant'||t==='radiation')
        fd=dx>0?-1:1;
    }
    const cell=g.getCell(x,y);if(!cell)return;
    if(fd)cell.dir=fd;
    const d=cell.dir||(h.rnd()<0.5?1:-1);
    cell.dir=d;
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='zombie'&&h.chance(0.01)){g.setCell(x,y,'zombie');return;}
      if(t==='poison'&&h.chance(0.055)){g.clearCell(x,y);return;}
      if(t==='virus'&&h.chance(0.038)){g.clearCell(x,y);return;}
    }
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.48)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else if(h.chance(0.3)&&g.isEmpty(x+d,y-1)&&g.isEmpty(x,y-1))g.swapCells(x,y,x+d,y-1);
    else cell.dir=-d;
  }
});

// ── CITIZEN ───────────────────────────────────────────────────────
ElementRegistry.register({
  id:'citizen',name:'Citizen',category:'creatures',color:'#4488ff',density:1.0,state:'solid',
  desc:'Flees danger. Can become a zombie.',burnAt:200,burnInto:'ash',burnTime:100,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    let d=g.getCell(x,y)?.dir||(h.rnd()<0.5?1:-1);
    let flee=false;
    for(let dx=-8;dx<=8;dx++)for(let dy=-5;dy<=5;dy++){
      const t=g.getType(x+dx,y+dy);
      if(t==='fire'||t==='lava'||t==='zombie'||t==='mutant'||t==='radiation'||t==='alien_goo'){flee=true;d=dx>0?-1:1;}
    }
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if(t==='zombie'&&h.chance(0.01)){g.setCell(x,y,'zombie');return;}
      if(t==='poison'&&h.chance(0.04)){g.clearCell(x,y);return;}
    }
    const cell=g.getCell(x,y);if(!cell)return;
    cell.dir=d;
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.42)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else if(h.chance(0.3)&&g.isEmpty(x+d,y-1)&&g.isEmpty(x,y-1))g.swapCells(x,y,x+d,y-1);
    else cell.dir=-d;
  }
});

// ── POLICE ────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'police',name:'Police',category:'creatures',color:'#2244aa',density:1.0,state:'solid',
  desc:'Chases and eliminates zombies, mutants, and aliens.',burnAt:200,burnInto:'ash',burnTime:100,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    let d=g.getCell(x,y)?.dir||(h.rnd()<0.5?1:-1);
    let bd=999;
    for(let dx=-18;dx<=18;dx++)for(let dy=-9;dy<=9;dy++){
      const t=g.getType(x+dx,y+dy);
      if(t==='zombie'||t==='mutant'||t==='alien'){const dd=Math.abs(dx)+Math.abs(dy);if(dd<bd){bd=dd;if(dx!==0)d=dx>0?1:-1;}}
    }
    if(bd<2){
      for(const[nx,ny]of h.neighbors4(x,y)){
        const t=g.getType(nx,ny);
        if(t==='zombie'||t==='mutant'||t==='alien'){g.clearCell(nx,ny);break;}
      }
    }
    const cell=g.getCell(x,y);if(!cell)return;
    cell.dir=d;
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.48)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else if(h.chance(0.3)&&g.isEmpty(x+d,y-1)&&g.isEmpty(x,y-1))g.swapCells(x,y,x+d,y-1);
    else cell.dir=-d;
  }
});

// ── WOLF ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'wolf',name:'Wolf',category:'creatures',color:'#998888',density:1.1,state:'solid',
  desc:'Hunts people and smaller creatures.',burnAt:200,burnInto:'ash',burnTime:80,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const cell=g.getCell(x,y);if(!cell)return;
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    // Hunt
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='citizen'||t==='rabbit')&&h.chance(0.07))g.clearCell(nx,ny);
    }
    cell.dir=d;
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.45)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else cell.dir=-d;
  }
});

// ── BEAR ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'bear',name:'Bear',category:'creatures',color:'#886644',density:1.3,state:'solid',
  desc:'Large and slow. Attacks people. Loves honey.',burnAt:200,burnInto:'ash',burnTime:100,heatConductivity:0.1,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??200)-0.003;
    if(cell.energy<=0){g.clearCell(x,y);return;}
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='fish'||t==='honey')&&h.chance(0.1)){g.clearCell(nx,ny);cell.energy=Math.min(255,(cell.energy??100)+100);}
      if((t==='person'||t==='citizen')&&h.chance(0.06))g.clearCell(nx,ny);
    }
    cell.dir=d;
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
    if(h.chance(0.2)&&g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else cell.dir=-d;
  }
});

// ── BAT ───────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'bat',name:'Bat',category:'creatures',color:'#553355',density:0.4,state:'solid',
  desc:'Flies. Active in darkness.',burnAt:150,burnInto:'ash',burnTime:40,heatConductivity:0.05,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const cell=g.getCell(x,y);if(!cell)return;
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    cell.dir=d;
    const dy=h.rnd()<0.3?(h.rnd()<0.5?-1:1):0;
    if(h.chance(0.5)&&g.isEmpty(x+d,y+dy))g.swapCells(x,y,x+d,y+dy);
    else if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else cell.dir=-d;
  }
});

// ── MOTH ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'moth',name:'Moth',category:'creatures',color:'#ccbbaa',density:0.3,state:'solid',
  desc:'Flies toward fire and light.',burnAt:80,burnInto:'ash',burnTime:20,heatConductivity:0.04,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const cell=g.getCell(x,y);if(!cell)return;
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    // Attracted to fire — fly toward it
    for(let dx=-10;dx<=10;dx++)for(let dy=-8;dy<=8;dy++){
      const t=g.getType(x+dx,y+dy);
      if(t==='fire'||t==='torch'){d=dx>0?1:-1;break;}
    }
    cell.dir=d;
    const dy2=h.rnd()<0.3?(h.rnd()<0.5?-1:1):0;
    if(g.isEmpty(x+d,y+dy2))g.swapCells(x,y,x+d,y+dy2);
    else if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);
    else cell.dir=-d;
  }
});

// ── JELLYFISH ─────────────────────────────────────────────────────
ElementRegistry.register({
  id:'jellyfish',name:'Jellyfish',category:'creatures',
  color:(cell,x,y,frame)=>`hsl(${310+Math.sin((frame??0)*0.08+x*0.1)*30},80%,${60+Math.sin((frame??0)*0.05)*15}%)`,
  density:0.95,state:'solid',desc:'Floats in water. Stings on contact.',heatConductivity:0.05,
  tick(x,y,g,h){
    // Floats and drifts in water
    if(g.getType(x,y-1)==='water'&&h.chance(0.3)){g.swapCells(x,y,x,y-1);return;}
    const d=h.rnd()<0.5?1:-1;
    if(g.getType(x+d,y)==='water'&&h.chance(0.2))g.swapCells(x,y,x+d,y);
    else if(g.isEmpty(x,y+1))g.swapCells(x,y,x,y+1);
    // Sting
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='person'||t==='fish')&&h.chance(0.04))g.clearCell(nx,ny);
    }
  }
});

// ── OCTOPUS ───────────────────────────────────────────────────────
ElementRegistry.register({
  id:'octopus',name:'Octopus',category:'creatures',color:'#cc6688',density:1.05,state:'solid',
  desc:'Swims in water. Hunts fish.',heatConductivity:0.06,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    const d=cell.dir||(h.rnd()<0.5?1:-1);
    cell.dir=d;
    for(const[nx,ny]of h.neighbors4(x,y)){
      if(g.getType(nx,ny)==='fish'&&h.chance(0.05))g.clearCell(nx,ny);
    }
    if(h.chance(0.3)){
      if(g.isEmpty(x+d,y)||g.getType(x+d,y)==='water')g.swapCells(x,y,x+d,y);
    }
    if(h.rnd()<0.02&&g.isEmpty(x,y-1))g.swapCells(x,y,x,y-1);
  }
});

// ── SHARK ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'shark',name:'Shark',category:'creatures',color:'#667788',density:1.0,state:'solid',
  desc:'Hunts fish and crabs. Beware in the water.',burnAt:300,burnInto:'ash',heatConductivity:0.08,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??200);
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    const inW=['water','seawater','saltwater','brine'];
    const isWater=t=>inW.includes(t);
    const wet=h.neighbors4(x,y).some(([nx,ny])=>isWater(g.getType(nx,ny)));
    if(!wet){
      if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
      cell.energy-=0.8;
      if(cell.energy<=0){g.clearCell(x,y);return;}
    }
    // Hunt
    let bd=999;
    for(let dx=-12;dx<=12;dx++)for(let dy=-6;dy<=6;dy++){
      const t=g.getType(x+dx,y+dy);
      if(t==='fish'||t==='crab'){const dd=Math.abs(dx)+Math.abs(dy);if(dd<bd){bd=dd;if(dx!==0)d=dx>0?1:-1;}}
    }
    if(bd<2){
      for(const[nx,ny]of h.neighbors4(x,y)){
        const t=g.getType(nx,ny);
        if(t==='fish'||t==='crab'||t==='person'||t==='citizen'){g.clearCell(nx,ny);cell.energy=Math.min(240,(cell.energy??200)+28);break;}
      }
    }
    cell.dir=d;
    if(h.chance(0.45)){
      const ny2=y+(h.rnd()<0.28?-1:h.rnd()<0.55?0:1);
      if(isWater(g.getType(x+d,ny2))||g.isEmpty(x+d,ny2))g.swapCells(x,y,x+d,y);
    }
    if(h.chance(0.018))cell.dir=-d;
  }
});

// ── WHALE ─────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'whale',name:'Whale',category:'creatures',color:'#334455',density:1.0,state:'solid',
  desc:'Gentle giant. Drifts through water, blows bubbles.',heatConductivity:0.1,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    cell.energy=(cell.energy??200);
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    const inW=['water','seawater','saltwater','brine'];
    const isWater=t=>inW.includes(t);
    const wet=h.neighbors4(x,y).some(([nx,ny])=>isWater(g.getType(nx,ny)));
    if(!wet){
      if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);return;}
      cell.energy-=0.25;
      if(cell.energy<=0){g.clearCell(x,y);return;}
    }
    if(h.chance(0.28)){
      const ny2=y+(h.rnd()<0.18?-1:0);
      if((isWater(g.getType(x+d,ny2))||g.isEmpty(x+d,ny2))&&g.inBounds(x+d,ny2)){
        g.swapCells(x,y,x+d,ny2);
      }
    }
    if(h.chance(0.009))cell.dir=-d;
    if(h.chance(0.003)&&g.isEmpty(x,y-1))g.setCell(x,y-1,'bubble');
    cell.dir=d;
  }
});

// ── CRAB ──────────────────────────────────────────────────────────
ElementRegistry.register({
  id:'crab',name:'Crab',category:'creatures',color:'#cc4422',density:1.2,state:'solid',
  desc:'Scuttles sideways. Hardy in water.',burnAt:250,burnInto:'ash',heatConductivity:0.07,
  tick(x,y,g,h){
    const cell=g.getCell(x,y);if(!cell)return;
    let d=cell.dir||(h.rnd()<0.5?1:-1);
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);cell.dir=d;return;}
    if(h.chance(0.28)){
      if(g.isEmpty(x+d,y)){g.swapCells(x,y,x+d,y);cell.dir=d;return;}
      if(g.isEmpty(x+d,y-1)){g.swapCells(x,y,x+d,y-1);cell.dir=d;return;}
      d=-d;
    }
    if(h.chance(0.018))d=-d;
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='fire'||t==='acid')&&h.chance(0.18)){g.clearCell(x,y);return;}
    }
    cell.dir=d;
  }
});
