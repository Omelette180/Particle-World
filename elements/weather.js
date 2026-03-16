/**
 * PARTICLE WORLD v2.0 — elements/weather.js
 */
ElementRegistry.register({ id:'cloud',name:'Cloud',category:'weather',color:'#ccddee',density:0.001,state:'gas',desc:'Floats and rains.',heatConductivity:0.005,
  tick(x,y,g,h){
    if(h.chance(.003)&&g.isEmpty(x,y+1)){g.setCell(x,y+1,'water');const wc=g.getCell(x,y+1);if(wc)wc.energy=undefined;}
    if(h.chance(.02)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}
    if(g.isEmpty(x,y-1)&&h.chance(.02))g.swapCells(x,y,x,y-1);
  }
});
ElementRegistry.register({ id:'rain',name:'Rain',category:'weather',color:'#4488bb',density:0.9,state:'liquid',desc:'Falling water droplets.',heatConductivity:0.18,
  tick(x,y,g,h){
    if(g.isEmpty(x,y+1)){g.swapCells(x,y,x,y+1);}
    else{const t=g.getType(x,y+1);if(t!=='empty'){g.setCell(x,y,'water');}}
  }
});
ElementRegistry.register({ id:'snow_cloud',name:'Snow Cloud',category:'weather',color:'#ddeeff',density:0.001,state:'gas',desc:'Drops snow.',heatConductivity:0.005,
  tick(x,y,g,h){
    if(h.chance(.003)&&g.isEmpty(x,y+1)){g.setCell(x,y+1,'snow');const sc=g.getCell(x,y+1);if(sc)sc.energy=undefined;}
    if(h.chance(.02)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}
  }
});
ElementRegistry.register({ id:'tornado',name:'Tornado',category:'weather',color:'#888888',density:0.001,state:'gas',desc:'Powerful vortex. Throws everything around.',heatConductivity:0.01,
  tick(x,y,g,h){
    for(let r=1;r<=8;r++){for(const[dx,dy]of[[r,0],[-r,0],[0,-r],[0,r],[r,-r],[-r,-r],[r,r],[-r,r]]){
      const nx=x+dx,ny=y+dy;if(!g.inBounds(nx,ny))continue;const t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='tornado'&&t!=='wall'&&h.chance(.08)){const tx=x+(0|dx*.2),ty=y-2;if(g.inBounds(tx,ty)&&g.isEmpty(tx,ty)){g.swapCells(nx,ny,tx,ty);break;}}
    }}
    if(h.chance(.03)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}
  }
});
ElementRegistry.register({ id:'hurricane',name:'Hurricane',category:'weather',color:'#667788',density:0.001,state:'gas',desc:'Large rotating storm.',heatConductivity:0.01,
  tick(x,y,g,h){
    for(let r=1;r<=15;r++)for(const[dx,dy]of[[r,0],[-r,0],[0,-r],[0,r]]){
      const nx=x+dx,ny=y+dy;if(!g.inBounds(nx,ny))continue;const t=g.getType(nx,ny);
      if(t&&t!=='empty'&&t!=='wall'&&t!=='hurricane'&&h.chance(.04)){const tx=x+(0|dx*.3),ty=y-1;if(g.inBounds(tx,ty)&&g.isEmpty(tx,ty))g.swapCells(nx,ny,tx,ty);}
    }
    if(h.chance(.01)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y))g.swapCells(x,y,x+d,y);}
  }
});
ElementRegistry.register({ id:'blizzard',name:'Blizzard',category:'weather',color:'#eeeeff',density:0.001,state:'gas',desc:'Violent snowstorm.',heatConductivity:0.02,
  tick(x,y,g,h){
    if(h.chance(.05)){const d=h.rnd()<.5?1:-1;const nx=x+d;if(g.inBounds(nx,y)&&g.isEmpty(nx,y))g.swapCells(x,y,nx,y);}
    if(h.chance(.02)&&g.isEmpty(x,y+1)){g.setCell(x,y+1,'snow');}
    const c=g.getCell(x,y);if(!c)return;c.energy=(c.energy??200)-0.1;if(c.energy<=0)g.clearCell(x,y);
  }
});
ElementRegistry.register({ id:'hail',name:'Hail',category:'weather',color:'#bbccdd',density:0.7,state:'solid',desc:'Frozen precipitation. Breaks things.',meltAt:5,meltsInto:'water',heatConductivity:0.15,
  tick(x,y,g,h){
    for(let i=0;i<3;i++){if(!g.swapCells(x,y,x,y+1)){const t=g.getType(x,y+1);if(t&&t!=='empty'){g.clearCell(x,y);if(h.chance(.4))g.setCell(x,y,'water');}break;}if(!g.isEmpty(x,y+1))break;}
  }
});
