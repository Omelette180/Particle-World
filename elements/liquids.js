/**
 * PARTICLE WORLD v2.0 — elements/liquids.js
 * All liquids upgraded with Sandboxels-style LIQUID behavior + viscosity.
 */
ElementRegistry.register({ id:'mercury',name:'Mercury',category:'liquids',color:'#888899',density:13.6,state:'liquid',desc:'Extremely dense liquid metal.',heatConductivity:0.08, tick(x,y,g,h){h.LIQUID(x,y,0.95);} });
ElementRegistry.register({ id:'honey',name:'Honey',category:'liquids',color:'#d4880a',density:1.4,state:'liquid',desc:'Sweet thick liquid.',burnAt:250,burnInto:'fire',burnTime:150,heatConductivity:0.04, tick(x,y,g,h){h.doBurning(x,y);h.LIQUID(x,y,0.08);} });
ElementRegistry.register({ id:'blood',name:'Blood',category:'liquids',color:'#aa0000',density:1.06,state:'liquid',desc:'Drains from living things.',heatConductivity:0.12, tick(x,y,g,h){ const c=g.getCell(x,y); if(!c)return; c.energy=(c.energy??200)-0.03; if(c.energy<=0){g.setCell(x,y,'ash');return;} h.LIQUID(x,y,0.7); } });
ElementRegistry.register({ id:'slime',name:'Slime',category:'liquids',color:'#44cc22',density:1.1,state:'liquid',desc:'Slow-moving goo.',heatConductivity:0.05, tick(x,y,g,h){h.LIQUID(x,y,0.12);} });
ElementRegistry.register({ id:'mud_water',name:'Muddy Water',category:'liquids',color:'#5a4020',density:1.05,state:'liquid',desc:'Murky water.',heatConductivity:0.12, tick(x,y,g,h){h.LIQUID(x,y,0.8);} });
ElementRegistry.register({ id:'tar',name:'Tar',category:'liquids',color:'#1a1a1a',density:1.15,state:'liquid',desc:'Extremely viscous. Very flammable.',burnAt:180,burnInto:['fire','smoke'],burnTime:300,heatConductivity:0.03, tick(x,y,g,h){h.doBurning(x,y);h.LIQUID(x,y,0.05);} });
ElementRegistry.register({ id:'brine',name:'Brine',category:'liquids',color:'#3366aa',density:1.2,state:'liquid',desc:'Very salty water.',heatConductivity:0.15, tick(x,y,g,h){h.LIQUID(x,y);} });
ElementRegistry.register({ id:'grease',name:'Grease',category:'liquids',color:'#998844',density:0.92,state:'liquid',desc:'Thick oily substance. Flammable.',burnAt:220,burnInto:['fire','smoke'],burnTime:200,heatConductivity:0.04, tick(x,y,g,h){h.doBurning(x,y);h.LIQUID(x,y,0.3);} });
ElementRegistry.register({ id:'ethanol',name:'Ethanol',category:'liquids',color:'#ddddc8',density:0.79,state:'liquid',desc:'Flammable alcohol.',burnAt:80,burnInto:['fire','steam'],burnTime:80,heatConductivity:0.17, tick(x,y,g,h){h.doBurning(x,y);h.LIQUID(x,y);} });
ElementRegistry.register({ id:'liquid_nitrogen',name:'Liquid N₂',category:'liquids',color:'#ccddff',density:0.8,state:'liquid',desc:'Cryogenic liquid. Freezes everything.',heatConductivity:0.12, tick(x,y,g,h){
  for(const[nx,ny]of h.neighbors4(x,y)){const t=g.getType(nx,ny);if(t==='water'&&h.chance(.3))g.setCell(nx,ny,'ice');if(t==='lava'&&h.chance(.5)){g.setCell(nx,ny,'stone');g.clearCell(x,y);return;}if(t==='fire'&&h.chance(.6))g.clearCell(nx,ny);const nc=g.getCell(nx,ny);if(nc)nc.heat=(nc.heat??0)-15;}
  h.LIQUID(x,y);
} });
ElementRegistry.register({ id:'nitroglycerin',name:'Nitroglycerin',category:'liquids',color:'#88cc44',density:1.6,state:'liquid',desc:'Extremely unstable explosive.',heatConductivity:0.05, tick(x,y,g,h){
  const c=g.getCell(x,y);
  if(c&&(c.heat??0)>50&&h.chance(.3)){g.clearCell(x,y);h.explode(x,y,14,{strength:1.4});return;}
  h.LIQUID(x,y,.9);
} });
ElementRegistry.register({ id:'quicksand',name:'Quicksand',category:'liquids',color:'#c8a850',density:1.8,state:'liquid',desc:'Swallows things.',heatConductivity:0.04, tick(x,y,g,h){
  const t=g.getType(x,y-1);
  if(t&&t!=='empty'&&t!=='quicksand'){const d=ElementRegistry.get(t);if(d?.state==='solid'&&d.density<2.5&&h.chance(.02)){g.swapCells(x,y,x,y-1);return;}}
  h.LIQUID(x,y,.15);
} });
ElementRegistry.register({ id:'void_liquid',name:'Void Liquid',category:'liquids',color:'#110022',density:0.5,state:'liquid',desc:'Consumes everything.',heatConductivity:0, tick(x,y,g,h){
  for(const[nx,ny]of h.neighbors4r(x,y)){const t=g.getType(nx,ny);if(t&&t!=='empty'&&t!=='void_liquid'&&t!=='wall'&&h.chance(.03))g.clearCell(nx,ny);}
  h.LIQUID(x,y,.5);
} });
