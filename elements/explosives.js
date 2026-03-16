/**
 * PARTICLE WORLD v2.0 — elements/explosives.js
 * Explosives upgraded with Sandboxels-style chain reactions via Physics.explode()
 */
ElementRegistry.register({ id:'gunpowder',name:'Gunpowder',category:'explosives',color:'#555540',density:1.7,state:'solid',desc:'Ignites quickly. Explodes near fire.',heatConductivity:0.05,
  tick(x,y,g,h){
    h.doBurning(x,y);
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='fire'||t==='lava')&&h.chance(.5)){g.clearCell(x,y);h.explode(x,y,8,{strength:1});return;}}
    h.POWDER(x,y);
  }
});
ElementRegistry.register({ id:'tnt',name:'TNT',category:'explosives',color:'#cc2222',density:1.65,state:'solid',desc:'Big explosion. Chain-reacts with other TNT.',heatConductivity:0.05,
  tick(x,y,g,h){
    h.doBurning(x,y);
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='fire'||t==='lava')&&h.chance(.05)){g.clearCell(x,y);setTimeout(()=>h.explode(x,y,14,{strength:1.2}),50+Math.random()*100);return;}}
  }
});
ElementRegistry.register({ id:'c4',name:'C-4',category:'explosives',color:'#ddccaa',density:1.63,state:'solid',desc:'Stable plastic explosive. Large blast.',heatConductivity:0.04,
  tick(x,y,g,h){
    h.doBurning(x,y);
    const c=g.getCell(x,y);
    if(c&&(c.heat??0)>600&&h.chance(.02)){g.clearCell(x,y);setTimeout(()=>h.explode(x,y,22,{strength:1.5}),80+Math.random()*120);return;}
  }
});
ElementRegistry.register({ id:'dynamite',name:'Dynamite',category:'explosives',color:'#dd4444',density:1.3,state:'solid',desc:'Classic explosive stick.',burnAt:300,burnInto:'fire',burnTime:60,heatConductivity:0.06,
  tick(x,y,g,h){
    const c=g.getCell(x,y);
    if(c?.burning){
      h.doBurning(x,y);
      if(h.chance(.08)){g.clearCell(x,y);h.explode(x,y,16,{strength:1.1});return;}
    }
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='fire'||t==='lava')&&h.chance(.04)){const cc=g.getCell(x,y);if(cc)cc.burning=true;}}
    h.POWDER(x,y);
  }
});
ElementRegistry.register({ id:'mine',name:'Mine',category:'explosives',color:'#445544',density:2.0,state:'solid',desc:'Explodes when something falls on it.',heatConductivity:0.05,
  tick(x,y,g,h){
    const t=g.getType(x,y-1);
    if(t&&t!=='empty'&&t!=='mine'){const d=ElementRegistry.get(t);if(d?.movable!==false&&h.chance(.8)){g.clearCell(x,y);h.explode(x,y,10,{strength:1});return;}}
  }
});
ElementRegistry.register({ id:'landmine',name:'Landmine',category:'explosives',color:'#556655',density:2.0,state:'solid',desc:'Buried mine. Triggered by pressure.',heatConductivity:0.05,
  tick(x,y,g,h){
    const t=g.getType(x,y-1);
    if(t&&t!=='empty'&&t!=='landmine'){const d=ElementRegistry.get(t);if(d?.density>0.5&&h.chance(.9)){g.clearCell(x,y);h.explode(x,y,12,{strength:1.1});return;}}
  }
});
ElementRegistry.register({ id:'nuke',name:'Nuke',category:'explosives',color:'#33ff33',density:5.0,state:'solid',desc:'Nuclear device. Massive radiation blast.',heatConductivity:0.1,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='fire'||t==='lava')&&h.chance(.03)){g.clearCell(x,y);setTimeout(()=>h.explode(x,y,60,{strength:3,fire:['radiation','fire','plasma']}),200);return;}}
  }
});
ElementRegistry.register({ id:'acid_bomb',name:'Acid Bomb',category:'explosives',color:'#88ee44',density:1.5,state:'solid',desc:'Explodes into a shower of acid.',heatConductivity:0.05,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='fire'||t==='lava')&&h.chance(.1)){
      const cols=g.cols,rows=g.rows;
      g.clearCell(x,y);
      for(let i=0;i<25;i++){const ax=x+(0|Math.random()*13-6),ay=y+(0|Math.random()*13-6);if(ax>=0&&ax<cols&&ay>=0&&ay<rows)g.setCell(ax,ay,'acid');}
      return;
    }}
  }
});
ElementRegistry.register({ id:'cryo_bomb',name:'Cryo Bomb',category:'explosives',color:'#44aaff',density:1.5,state:'solid',desc:'Freezes a large area.',heatConductivity:0.08,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='fire'||t==='lava')&&h.chance(.1)){
      const cols=g.cols,rows=g.rows;
      g.clearCell(x,y);
      for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){if(dx*dx+dy*dy>64)continue;const bx=x+dx,by=y+dy;if(bx>=0&&bx<cols&&by>=0&&by<rows){const bt=g.getType(bx,by);if(bt==='fire'||bt==='lava'||bt==='water')g.setCell(bx,by,bt==='water'?'ice':'ice');}}
      return;
    }}
  }
});
