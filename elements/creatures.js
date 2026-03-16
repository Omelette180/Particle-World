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
