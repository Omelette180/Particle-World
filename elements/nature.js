/**
 * PARTICLE WORLD v2.0 — elements/nature.js
 * Plants, organic materials.
 */
ElementRegistry.register({ id:'plant',name:'Plant',category:'nature',color:'#22aa22',density:0.9,state:'solid',desc:'Living green matter. Grows slowly.',burnAt:80,burnInto:['fire','ash'],burnTime:60,heatConductivity:0.04,
  tick(x,y,g,h){
    h.doBurning(x,y); h.doHeat(x,y);
    // Grow toward water
    if(h.chance(.001)){for(const[nx,ny]of h.neighbors4(x,y)){if(g.isEmpty(nx,ny)&&h.chance(.3)){const below=g.getType(nx,ny+1);if(below==='dirt'||below==='mud'||below==='plant'){g.setCell(nx,ny,'plant');return;}}}}
  }
});
ElementRegistry.register({ id:'grass',name:'Grass',category:'nature',color:'#33bb11',density:0.4,state:'solid',desc:'Grows on soil.',burnAt:70,burnInto:['fire','ash'],burnTime:40,heatConductivity:0.03, tick(x,y,g,h){h.doBurning(x,y);} });
ElementRegistry.register({ id:'vine',name:'Vine',category:'nature',color:'#226622',density:0.6,state:'solid',desc:'Climbing plant.',burnAt:90,burnInto:'fire',burnTime:70,heatConductivity:0.03, tick(x,y,g,h){h.doBurning(x,y);} });
ElementRegistry.register({ id:'flower',name:'Flower',category:'nature',color:'#ff88cc',density:0.3,state:'solid',desc:'Decorative plant.',burnAt:60,burnInto:'ash',burnTime:30,heatConductivity:0.02, tick(x,y,g,h){h.doBurning(x,y);} });
ElementRegistry.register({ id:'mushroom',name:'Mushroom',category:'nature',color:'#cc9966',density:0.5,state:'solid',desc:'Fungus. Spreads in damp soil.',heatConductivity:0.02,
  tick(x,y,g,h){
    h.doBurning(x,y);
    if(h.chance(.0005)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y)&&g.getType(x+d,y+1)==='dirt')g.setCell(x+d,y,'mushroom');}
  }
});
ElementRegistry.register({ id:'cactus',name:'Cactus',category:'nature',color:'#77aa33',density:0.7,state:'solid',desc:'Desert plant. Holds water.',burnAt:200,burnInto:'ash',burnTime:150,heatConductivity:0.02, tick(x,y,g,h){h.doBurning(x,y);} });
ElementRegistry.register({ id:'moss',name:'Moss',category:'nature',color:'#446633',density:0.4,state:'solid',desc:'Spreads slowly in damp conditions.',heatConductivity:0.02,
  tick(x,y,g,h){
    if(h.chance(.0003)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y)&&!g.isEmpty(x+d,y+1)){const bt=g.getType(x+d,y+1);if(bt==='stone'||bt==='brick'||bt==='wall')g.setCell(x+d,y,'moss');}}
  }
});
ElementRegistry.register({ id:'seed',name:'Seed',category:'nature',color:'#886633',density:1.2,state:'solid',desc:'Grows into a plant when it lands on soil.',heatConductivity:0.02,
  tick(x,y,g,h){
    h.POWDER(x,y);
    const below=g.getType(x,y+1);
    if(!g.isEmpty(x,y+1)&&(below==='dirt'||below==='mud')&&h.chance(.005)){g.setCell(x,y,'plant');}
  }
});
ElementRegistry.register({ id:'algae',name:'Algae',category:'nature',color:'#44aa33',density:1.0,state:'liquid',desc:'Aquatic plant. Grows in water.',burnAt:90,burnInto:'ash',burnTime:40,heatConductivity:0.05,
  tick(x,y,g,h){
    // Grow in water
    if(h.chance(.001)){for(const[nx,ny]of h.neighbors4(x,y)){if(g.getType(nx,ny)==='water'&&h.chance(.3)){g.setCell(nx,ny,'algae');return;}}}
    h.LIQUID(x,y,.5);
  }
});
ElementRegistry.register({ id:'coral',name:'Coral',category:'nature',color:'#ff7777',density:1.5,state:'solid',desc:'Marine organism. Grows in saltwater.',heatConductivity:0.05,
  tick(x,y,g,h){
    if(h.chance(.0005)){const d=h.rnd()<.5?1:-1;if(g.isEmpty(x+d,y)&&g.getType(x+d,y+1)==='stone'){g.setCell(x+d,y,'coral');}}
  }
});
ElementRegistry.register({ id:'tree',name:'Tree',category:'nature',color:'#885522',density:0.6,state:'solid',desc:'Tall woody plant.',burnAt:300,burnInto:['fire','charcoal'],burnTime:300,heatConductivity:0.04,
  tick(x,y,g,h){
    h.doBurning(x,y);
    // Try to grow leaves upward
    if(h.chance(.0002)&&g.isEmpty(x,y-1))g.setCell(x,y-1,'plant');
  }
});
ElementRegistry.register({ id:'kelp',name:'Kelp',category:'nature',color:'#88aa44',density:1.0,state:'solid',desc:'Ocean seaweed. Grows upward.',heatConductivity:0.03,
  tick(x,y,g,h){
    if(h.chance(.002)&&(g.getType(x,y-1)==='water'||g.isEmpty(x,y-1))){g.setCell(x,y-1,'kelp');}
  }
});
