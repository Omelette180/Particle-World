/**
 * PARTICLE WORLD v2.0 — elements/solids.js
 * Metal/structural solids with heat conductivity and burning.
 */
ElementRegistry.register({ id:'metal',name:'Metal',category:'solids',color:'#aaaaaa',density:7.8,state:'solid',desc:'Generic metal. Good heat conductor.',heatConductivity:0.5, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'steel',name:'Steel',category:'solids',color:'#8899aa',density:7.85,state:'solid',desc:'Strong alloy. Hard to melt.',meltAt:1510,meltsInto:'molten_steel',heatConductivity:0.45, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'iron',name:'Iron',category:'solids',color:'#8a8a8a',density:7.86,state:'solid',desc:'Common metal. Rusts in water.',meltAt:1538,meltsInto:'molten_iron',heatConductivity:0.47,
  tick(x,y,g,h){
    h.doHeat(x,y);
    for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if((t==='water'||t==='saltwater')&&h.chance(.003))g.setCell(x,y,'rust');}
  }
});
ElementRegistry.register({ id:'copper',name:'Copper',category:'solids',color:'#b87333',density:8.96,state:'solid',desc:'Excellent conductor.',meltAt:1085,meltsInto:'molten_copper',heatConductivity:0.95, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'gold',name:'Gold',category:'solids',color:'#ffd700',density:19.3,state:'solid',desc:'Precious metal. Immune to corrosion.',meltAt:1064,meltsInto:'molten_gold',heatConductivity:0.81, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'lead',name:'Lead',category:'solids',color:'#707070',density:11.3,state:'solid',desc:'Dense heavy metal.',meltAt:327,meltsInto:'molten_lead',heatConductivity:0.3, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'rust',name:'Rust',category:'solids',color:'#aa4422',density:5.2,state:'solid',desc:'Oxidized iron.',heatConductivity:0.1, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'diamond',name:'Diamond',category:'solids',color:'#aaddff',density:3.5,state:'solid',desc:'Hardest natural material. Very high melt point.',meltAt:3500,meltsInto:'lava',heatConductivity:0.02, tick(x,y,g,h){} });
ElementRegistry.register({ id:'rubber',name:'Rubber',category:'solids',color:'#222222',density:1.1,state:'solid',desc:'Elastic insulator. Resists electricity.',burnAt:300,burnInto:'smoke',burnTime:200,heatConductivity:0.01, tick(x,y,g,h){h.doBurning(x,y);} });
ElementRegistry.register({ id:'plastic',name:'Plastic',category:'solids',color:'#dddddd',density:1.05,state:'solid',desc:'Versatile solid. Burns slowly.',burnAt:250,burnInto:['smoke','fire'],burnTime:250,heatConductivity:0.02, tick(x,y,g,h){h.doBurning(x,y);} });
ElementRegistry.register({ id:'brick',name:'Brick',category:'solids',color:'#cc4422',density:2.4,state:'solid',desc:'Fired clay block.',meltAt:1400,meltsInto:'lava',heatConductivity:0.05, tick(x,y,g,h){h.doHeat(x,y);} });
ElementRegistry.register({ id:'ceramic',name:'Ceramic',category:'solids',color:'#ddccbb',density:2.3,state:'solid',desc:'Heat-resistant fired material.',heatConductivity:0.02, tick(x,y,g,h){} });
ElementRegistry.register({ id:'chalk',name:'Chalk',category:'solids',color:'#f0f0f0',density:2.0,state:'solid',desc:'Soft calcium carbonate. Dissolves in acid.',heatConductivity:0.05,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){if(g.getType(nx,ny)==='acid'&&h.chance(.02))g.clearCell(x,y);}
  }
});
ElementRegistry.register({ id:'flint',name:'Flint',category:'solids',color:'#555550',density:2.6,state:'solid',desc:'Hard stone. Sparks when struck.',heatConductivity:0.06,
  tick(x,y,g,h){
    for(const[nx,ny]of h.neighbors4(x,y)){if((g.getType(nx,ny)==='stone'||g.getType(nx,ny)==='flint')&&h.chance(.005)&&g.isEmpty(x,y-1)){g.setCell(x,y-1,'fire');const fc=g.getCell(x,y-1);if(fc)fc.energy=20;}}
  }
});
ElementRegistry.register({ id:'sponge',name:'Sponge',category:'solids',color:'#ddbb44',density:0.5,state:'solid',desc:'Absorbs liquids.',heatConductivity:0.03,
  tick(x,y,g,h){
    const c=g.getCell(x,y); if(!c) return;
    c.energy=c.energy??0;
    for(const[nx,ny]of h.neighbors4(x,y)){
      const t=g.getType(nx,ny);
      if((t==='water'||t==='saltwater'||t==='oil')&&c.energy<50){c.energy+=5;g.clearCell(nx,ny);c.color='#aa9933';}
      if(c.energy>0&&(t==='empty')&&c.energy>10){g.setCell(nx,ny,'water');c.energy-=10;}
    }
  }
});
