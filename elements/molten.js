/**
 * PARTICLE WORLD v2.0 — elements/molten.js
 * All molten/magma elements using Physics.MOLTEN behavior.
 */
ElementRegistry.register({ id:'molten_iron',name:'Molten Iron',category:'liquids',color:'#ff6600',density:6.98,state:'liquid',desc:'Liquid iron. Extremely hot.',freezeAt:1538,freezesInto:'metal',heatConductivity:0.5, tick(x,y,g,h){h.MOLTEN(x,y);} });
ElementRegistry.register({ id:'molten_gold',name:'Molten Gold',category:'liquids',color:'#ffcc00',density:17.3,state:'liquid',desc:'Liquid gold.',freezeAt:1064,freezesInto:'gold',heatConductivity:0.35, tick(x,y,g,h){h.MOLTEN(x,y);} });
ElementRegistry.register({ id:'molten_glass',name:'Molten Glass',category:'liquids',color:'#ff8800',density:2.2,state:'liquid',desc:'Super-heated glass.',freezeAt:1400,freezesInto:'glass',heatConductivity:0.04, tick(x,y,g,h){h.MOLTEN(x,y);} });
ElementRegistry.register({ id:'magma',name:'Magma',category:'liquids',color:'#cc3300',density:2.7,state:'liquid',desc:'Underground molten rock.',freezeAt:800,freezesInto:'stone',heatConductivity:0.1, tick(x,y,g,h){
  const c=g.getCell(x,y);
  if(c){const sh=['#cc3300','#dd4400','#ff4400','#ee3300'];c.color=sh[0|Math.random()*sh.length];}
  h.MOLTEN(x,y);
} });
ElementRegistry.register({ id:'molten_copper',name:'Molten Copper',category:'liquids',color:'#cc5522',density:8.02,state:'liquid',desc:'Liquid copper.',freezeAt:1085,freezesInto:'copper',heatConductivity:0.4, tick(x,y,g,h){h.MOLTEN(x,y);} });
ElementRegistry.register({ id:'molten_steel',name:'Molten Steel',category:'liquids',color:'#ff9900',density:7.0,state:'liquid',desc:'Liquid steel. Incredibly hot.',freezeAt:1400,freezesInto:'steel',heatConductivity:0.45, tick(x,y,g,h){h.MOLTEN(x,y);} });
ElementRegistry.register({ id:'molten_lead',name:'Molten Lead',category:'liquids',color:'#886655',density:10.66,state:'liquid',desc:'Liquid lead. Toxic.',freezeAt:327,freezesInto:'lead',heatConductivity:0.25, tick(x,y,g,h){h.MOLTEN(x,y);} });
