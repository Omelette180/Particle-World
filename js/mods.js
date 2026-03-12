/**
 * PARTICLE WORLD v2.0 — js/mods.js
 * Extracted from v1.2.3. Full mod studio preserved.
 */

// ══════════════════════════════════════════
//  MOD SYSTEM
// ══════════════════════════════════════════
let loadedMods=[];
const MOD_NEXT_ID=200; // mod element IDs start here
let modNextId=MOD_NEXT_ID;

function loadMod(jsonStr,filename){
  try{
    const mod=JSON.parse(jsonStr);
    if(!mod.name||!mod.elements)throw new Error('Invalid mod format');
    mod._file=filename;mod._enabled=true;mod._id=Date.now();
    // Register elements
    mod.elements.forEach(el=>{
      if(!el.id)return;
      const eid=modNextId++;
      E[el.id]=eid;EN[eid]=el.id;
      // Colors
      PC[el.id]=Array.isArray(el.color)?el.color:[el.color||'#888888'];
      // Weight
      if(el.weight!=null)WT[eid]=el.weight;
      // Inject into sidebar
      injectModElement(el,eid);
    });
    loadedMods.push(mod);
    renderModList();
    return true;
  }catch(e){alert('Mod error: '+e.message);return false;}
}

function injectModElement(el,eid){
  const ss=document.getElementById('ss');
  // Find or create mod category
  let cat=document.getElementById('mod-cat-inject');
  if(!cat){
    cat=document.createElement('div');cat.className='cat';cat.id='mod-cat-inject';cat.textContent='📦 mods';ss.appendChild(cat);
  }
  const btn=document.createElement('button');btn.className='eb';btn.dataset.e=el.id;
  const col=Array.isArray(el.color)?el.color[0]:el.color||'#888';
  btn.innerHTML=`<div class="dot" style="background:${col}"></div>${el.label||el.id}`;
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.eb').forEach(x=>x.classList.remove('sel'));
    btn.classList.add('sel');sel=el.id;document.getElementById('sSel').textContent=sel;
  });
  ss.appendChild(btn);
  // Register update function based on behavior
  registerModBehavior(el,eid);
}

function registerModBehavior(el,eid){
  // Mod element step logic — runs in the main step switch
  // We patch into a mod dispatch table
  modBehaviors[eid]=function(x,y){
    const i=id(x,y);
    ea[i]-=(el.decay||0.05);
    if(ea[i]<=0&&el.decay){cC(x,y);return;}
    ca[i]=gcol(el.id);
    if(el.heatOutput)ha[i]+=el.heatOutput;
    // Reactions
    if(el.reactions){
      for(const rx of el.reactions){
        for(const[nx,ny]of n4(x,y)){
          const t=gT(nx,ny),tn=EN[t];
          if(tn===rx.neighbor&&rnd()<(rx.chance||0.05)){
            const res=rx.result;
            if(res==='explode')explode(x,y,rx.radius||8);
            else if(res==='remove'){cC(x,y);return;}
            else{cC(x,y);if(res)sC(x,y,res);return;}
          }
        }
      }
    }
    // Behavior
    switch(el.behavior){
      case'liquid':fl(x,y,4);break;
      case'powder':fp(x,y);break;
      case'gas':rg(x,y,el.id,.1);break;
      case'creature':wlk(x,y,.4);break;
      case'static':break;
      default:fp(x,y);
    }
  };
}
const modBehaviors={};

// Patch step to handle mod elements
const _stepOrig=step;
// MERGED step wrapper: mod elements + achievements + ambient sound (single wrapper)
let achTick=0,ambTick2=0;
step=function(){
  _stepOrig();
  // Mod elements
  for(let y=ROWS-1;y>=0;y--){
    for(let x=0;x<COLS;x++){
      const i=id(x,y),t=ta[i];
      if(t>=MOD_NEXT_ID&&modBehaviors[t]&&ua[i]!==stamp){ua[i]=stamp;modBehaviors[t](x,y);}
    }
  }
  // Achievements (every 3 seconds)
  achTick++;if(achTick>=180){achTick=0;
    if(chainCount>=10)unlockAch('chain10');if(chainCount>=50)unlockAch('chain50');if(chainCount>=100)unlockAch('chain100');
    if(gRad>=80)unlockAch('rad_high');
    let zombies=0,citizens=0,sharks=0,whales=0,corals=0,kelps=0,viruses=0,portA=false,portB=false,bhs=0;
    for(let i=0;i<ta.length;i++){const t=ta[i];
      if(t===E.zombie)zombies++;if(t===E.citizen||t===E.person)citizens++;
      if(t===E.shark)sharks++;if(t===E.whale)whales++;if(t===E.coral)corals++;if(t===E.kelp)kelps++;
      if(t===E.virus)viruses++;if(t===E.portal_a)portA=true;if(t===E.portal_b)portB=true;if(t===E.blackhole)bhs++;
    }
    if(zombies>0)unlockAch('first_zombie');if(zombieWave>5)unlockAch('zombie_wave5');
    if(citizens>=10)unlockAch('city_life');if(sharks>0&&whales>0&&corals>0&&kelps>0)unlockAch('ocean_life');
    if(viruses>=20)unlockAch('virus_spread');if(portA&&portB)unlockAch('first_portal');
    if(bhs>0){unlockAch('first_bh');addScore(1);}
    let alive=0;for(let i=0;i<ta.length;i++)if(ta[i])alive++;if(alive>500)addScore(1);
  }
  // Ambient sounds (every 2 seconds)
  ambTick2++;if(ambTick2>120){ambTick2=0;ambUpdate();}
  if(stamp%8===0){
    let hasZombie=false,hasAlien=false,hasTurret=false,hasPortal=false,hasWormhole=false;
    for(let i=0;i<ta.length;i++){if(ta[i]===E.zombie)hasZombie=true;if(ta[i]===E.alien||ta[i]===E.ufo)hasAlien=true;if(ta[i]===E.turret)hasTurret=true;if(ta[i]===E.portal_a||ta[i]===E.portal_b)hasPortal=true;if(ta[i]===E.wormhole)hasWormhole=true;}
    if(hasZombie&&Math.random()<.04)sndThrot('zombie',()=>sndPlay('zombie'),1800);
    if(hasAlien&&Math.random()<.05)sndThrot('alien',()=>sndPlay('alien'),1400);
    if(hasTurret&&Math.random()<.08)sndThrot('turret',()=>sndPlay('turret'),600);
    if(hasPortal&&Math.random()<.03)sndThrot('portal',()=>sndPlay('portal'),2000);
    if(hasWormhole&&Math.random()<.04)sndThrot('wormhole',()=>sndPlay('wormhole'),1500);
  }
  if(stamp%4===0){for(let i=0;i<ta.length;i++)if(ta[i]===E.lightning){sndThrot('zap',()=>sndPlay('zap'),400);break;}}
};

// ═══════════════════════════════════════════════
//  MOD STUDIO — FULL REWRITE
// ═══════════════════════════════════════════════

// Tab switcher
function modSetTab(t){
  ['loaded','build','library','share'].forEach(tab=>{
    document.getElementById(`modPan${tab.charAt(0).toUpperCase()+tab.slice(1)}`).style.display=tab===t?'block':'none';
    document.getElementById(`modTab${tab.charAt(0).toUpperCase()+tab.slice(1)}`).classList.toggle('active',tab===t);
  });
  if(t==='library')modRenderLibrary();
  if(t==='loaded')renderModList();
}

// ── LOADED MODS TAB ──
function renderModList(){
  const el=document.getElementById('modList');el.innerHTML='';
  if(!loadedMods.length){el.innerHTML='<div style="color:#1a1a2a;font-size:.6rem;padding:8px 0;">No mods loaded. Drop a file, install from Library, or build one.</div>';return;}
  loadedMods.forEach((mod,idx)=>{
    const card=document.createElement('div');card.className='mod-card';
    const elemCount=(mod.elements||[]).length;
    card.innerHTML=`
      <div class="mod-card-hdr">
        <span class="mod-name">${mod.name||'Unnamed Mod'}</span>
        <span class="mod-ver">v${mod.version||'1.0'} · ${elemCount} elem${elemCount!==1?'s':''} · by ${mod.author||'unknown'}</span>
      </div>
      <div class="mod-desc">${mod.description||'No description.'}</div>
      ${mod.tags?`<div style="font-size:.5rem;color:#333;margin-top:3px;">${mod.tags.split(',').map(t=>`<span style="background:#0a0a18;border:1px solid #111;padding:1px 5px;border-radius:10px;margin-right:3px;">${t.trim()}</span>`).join('')}</div>`:''}
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <button class="mod-toggle ${mod._enabled?'on':''}" data-idx="${idx}">${mod._enabled?'✓ Enabled':'○ Disabled'}</button>
        <button class="mod-export-btn" data-idx="${idx}">💾 Export</button>
        <button class="mod-share-btn" data-idx="${idx}">🔗 Share</button>
        <button class="mod-del" data-idx="${idx}" style="margin-left:auto;">✕ Remove</button>
      </div>`;
    el.appendChild(card);
  });
  el.querySelectorAll('.mod-toggle').forEach(b=>b.onclick=()=>{
    const m=loadedMods[+b.dataset.idx];m._enabled=!m._enabled;b.textContent=m._enabled?'✓ Enabled':'○ Disabled';b.classList.toggle('on',m._enabled);
  });
  el.querySelectorAll('.mod-export-btn').forEach(b=>b.onclick=()=>modExportSingle(+b.dataset.idx));
  el.querySelectorAll('.mod-share-btn').forEach(b=>b.onclick=()=>{
    const mod=loadedMods[+b.dataset.idx];
    document.getElementById('modShareExport').value=btoa(unescape(encodeURIComponent(JSON.stringify(mod))));
    modSetTab('share');
  });
  el.querySelectorAll('.mod-del').forEach(b=>b.onclick=()=>{loadedMods.splice(+b.dataset.idx,1);renderModList();});
}
renderModList();

function modExportSingle(idx){
  const mod=loadedMods[idx];if(!mod)return;
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(JSON.stringify(mod,null,2));
  a.download=(mod.name||'mod').replace(/\s+/g,'_')+'.pwmod';
  a.click();
}

// ── MOD BUILDER TAB ──
let mbElements=[];let mbReactions=[];

function mbUpdatePreview(){
  const mod={
    name:document.getElementById('mbName').value||'My Mod',
    version:document.getElementById('mbVer').value||'1.0',
    description:document.getElementById('mbDesc').value||'',
    author:document.getElementById('mbAuthor').value||'',
    tags:document.getElementById('mbTags').value||'',
    elements:mbElements
  };
  document.getElementById('mbJsonPreview').value=JSON.stringify(mod,null,2);
  document.getElementById('mbElemCount').textContent=mbElements.length;
}

function mbRenderElemList(){
  const el=document.getElementById('mbElemList');el.innerHTML='';
  if(!mbElements.length){el.innerHTML='<div style="font-size:.55rem;color:#1a1a2a;padding:6px;">No elements yet. Fill in the form below and click ➕ Add to Mod.</div>';mbUpdatePreview();return;}
  mbElements.forEach((e2,i)=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:8px;padding:5px 6px;margin-bottom:4px;background:#080810;border:1px solid #0f0f18;border-radius:2px;';
    row.innerHTML=`<div style="width:16px;height:16px;border-radius:2px;background:${Array.isArray(e2.color)?e2.color[0]:e2.color};flex-shrink:0;"></div>
      <div style="flex:1;min-width:0;"><span style="font-size:.6rem;color:#aaa;font-family:'Syne',sans-serif;">${e2.label||e2.id}</span> <span style="font-size:.5rem;color:#333;">${e2.id} · ${e2.behavior}</span></div>
      <button onclick="mbElements.splice(${i},1);mbRenderElemList();" style="padding:2px 6px;background:#1a0a0a;border:1px solid #3a1a1a;color:#ff5555;font-family:'DM Mono',monospace;font-size:.52rem;cursor:pointer;">✕</button>`;
    el.appendChild(row);
  });
  mbUpdatePreview();
}

// Populate reaction dropdowns
(function(){
  const withSel=document.getElementById('mbRxWith'),resultSel=document.getElementById('mbRxResult');
  const common=['fire','water','acid','lava','ice','sand','stone','wood','metal','gas','smoke','steam','explosion','explode','remove'];
  common.forEach(v=>{
    const o1=document.createElement('option');o1.value=v;o1.textContent=v;withSel.appendChild(o1);
    const o2=document.createElement('option');o2.value=v;o2.textContent=v;resultSel.appendChild(o2);
  });
})();

let mbCurrentReactions=[];
window.mbAddReaction=function(){
  const w=document.getElementById('mbRxWith').value,r=document.getElementById('mbRxResult').value,c=+document.getElementById('mbRxChance').value;
  if(!w||!r)return;
  mbCurrentReactions.push({neighbor:w,chance:c,result:r});
  const el=document.getElementById('mbReactionList');
  const row=document.createElement('div');
  const i=mbCurrentReactions.length-1;
  row.style.cssText='display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:.52rem;color:#444;';
  row.innerHTML=`<span style="color:#88aaff;">${w}</span> <span style="color:#333;">(${c})</span> <span>→</span> <span style="color:#44ff88;">${r}</span> <button onclick="mbCurrentReactions.splice(${i},1);this.parentElement.remove();" style="background:none;border:none;color:#444;cursor:pointer;font-size:.6rem;">✕</button>`;
  el.appendChild(row);
};

window.mbAddElement=function(){
  const eid=document.getElementById('mbElId').value.trim().replace(/\s+/g,'_').toLowerCase();
  const msg=document.getElementById('mbElMsg');
  if(!eid){msg.style.color='#ff4444';msg.textContent='Enter an ID!';return;}
  if(mbElements.find(e2=>e2.id===eid)){msg.style.color='#ff4444';msg.textContent='ID already in this mod!';return;}
  const elem={
    id:eid,
    label:document.getElementById('mbElLabel').value||eid,
    color:[document.getElementById('mbElCol1').value,document.getElementById('mbElCol2').value],
    behavior:document.getElementById('mbElBehavior').value,
    weight:+document.getElementById('mbElWeight').value||1,
    heatOutput:+document.getElementById('mbElHeat').value||0,
    decay:+document.getElementById('mbElDecay').value||0,
    flammable:document.getElementById('mbElFlammable').value==='true',
    desc:document.getElementById('mbElDesc').value||'',
    reactions:[...mbCurrentReactions]
  };
  mbElements.push(elem);
  mbCurrentReactions=[];
  document.getElementById('mbReactionList').innerHTML='';
  // Clear form
  ['mbElId','mbElLabel','mbElDesc'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('mbElWeight').value='1';document.getElementById('mbElHeat').value='0';document.getElementById('mbElDecay').value='0';
  msg.style.color='#44ffaa';msg.textContent=`✓ "${elem.label}" added to mod!`;
  mbRenderElemList();
};

window.mbClear=function(){
  mbElements=[];mbCurrentReactions=[];
  document.getElementById('mbReactionList').innerHTML='';
  ['mbName','mbVer','mbDesc','mbAuthor','mbTags','mbElId','mbElLabel','mbElDesc'].forEach(id=>{document.getElementById(id).value='';});
  mbRenderElemList();
  document.getElementById('mbMsg').textContent='';
};

window.mbTestLoad=function(){
  const mod=JSON.parse(document.getElementById('mbJsonPreview').value||'{}');
  if(!mod.elements?.length){document.getElementById('mbMsg').style.color='#ff4444';document.getElementById('mbMsg').textContent='Add elements first!';return;}
  const ok=loadMod(JSON.stringify(mod),'builder_test');
  if(ok){document.getElementById('mbMsg').style.color='#44ffaa';document.getElementById('mbMsg').textContent='✓ Loaded into game!';modSetTab('loaded');}
};

window.mbExportFile=function(){
  const mod=JSON.parse(document.getElementById('mbJsonPreview').value||'{}');
  if(!mod.name){document.getElementById('mbMsg').style.color='#ff4444';document.getElementById('mbMsg').textContent='Fill in mod name first!';return;}
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(JSON.stringify(mod,null,2));
  a.download=(mod.name||'mod').replace(/\s+/g,'_')+'.pwmod';
  a.click();
};

window.mbPrepareShare=function(){
  const raw=document.getElementById('mbJsonPreview').value;
  if(raw&&raw!=='{}')document.getElementById('modShareExport').value=btoa(unescape(encodeURIComponent(raw)));
};

['mbName','mbVer','mbDesc','mbAuthor','mbTags'].forEach(id=>{
  document.getElementById(id).oninput=mbUpdatePreview;
});
mbRenderElemList();

// ── LIBRARY TAB ──
const MOD_LIBRARY=[
  {
    name:'Chaos Pack',author:'PW Dev',version:'1.0',tags:'chaos, explosions',
    description:'Adds Supernova powder, Vortex liquid, and Plague gas. Pure destruction.',
    elements:[
      {id:'supernova_dust',label:'Supernova✨',color:['#ffffff','#ffffa0','#ffaa00'],behavior:'powder',weight:1,heatOutput:8,decay:0,reactions:[{neighbor:'fire',chance:.2,result:'explode'}]},
      {id:'vortex_liquid',label:'Vortex💧',color:['#4400ff','#8800ff','#aa44ff'],behavior:'liquid',weight:.5,heatOutput:2,decay:0,reactions:[{neighbor:'stone',chance:.03,result:'smoke'}]},
      {id:'plague_gas',label:'Plague☠',color:['#44ff44','#22dd22','#66ff66'],behavior:'gas',weight:0,heatOutput:0,decay:.05,reactions:[{neighbor:'person',chance:.04,result:'zombie'},{neighbor:'citizen',chance:.04,result:'zombie'}]},
    ]
  },
  {
    name:'Ocean Life Pack',author:'PW Dev',version:'1.0',tags:'ocean, creatures, biology',
    description:'Deep sea creatures: Anglerfish, Sea Serpent, and glowing Bioluminescence fluid.',
    elements:[
      {id:'anglerfish',label:'Anglerfish🐟',color:['#1a1a2a','#0a0a18','#2a2a3a'],behavior:'creature',weight:1,heatOutput:0,decay:0,reactions:[{neighbor:'fish',chance:.1,result:'blood'},{neighbor:'crab',chance:.15,result:'blood'}]},
      {id:'sea_serpent',label:'SeaSerpent🐍',color:['#1a4422','#0f3318','#2a5530'],behavior:'creature',weight:1,heatOutput:0,decay:0,reactions:[{neighbor:'whale',chance:.02,result:'blood'},{neighbor:'shark',chance:.05,result:'blood'}]},
      {id:'bioluminescence',label:'Biolumi✨',color:['#00ffcc','#00eebb','#44ffdd','#aaffee'],behavior:'liquid',weight:.6,heatOutput:0,decay:0,reactions:[]},
    ]
  },
  {
    name:'Alchemy Lab',author:'PW Dev',version:'1.0',tags:'alchemy, chemistry, magic',
    description:'Magic elements: Philosopher\'s Brew liquid, Transmutation powder, and Arcane crystal.',
    elements:[
      {id:'philos_brew',label:'PhilosBrew🧪',color:['#ff8800','#ffaa22','#ffcc44'],behavior:'liquid',weight:.7,heatOutput:1,decay:0,reactions:[{neighbor:'lead_pb',chance:.05,result:'gold_elem'},{neighbor:'sand',chance:.02,result:'quartz'}]},
      {id:'transmute_dust',label:'Transmute⚗',color:['#cc44ff','#aa22dd','#ee66ff'],behavior:'powder',weight:1,heatOutput:0,decay:.005,reactions:[{neighbor:'stone',chance:.01,result:'diamond'},{neighbor:'coal',chance:.02,result:'diamond'}]},
      {id:'arcane_crystal',label:'ArcaneCrystal💎',color:['#ff44ff','#cc00ff','#ff88ff','#ffffff'],behavior:'solid',weight:2,heatOutput:0,decay:0,reactions:[{neighbor:'fire',chance:.005,result:'plasma'},{neighbor:'water',chance:.005,result:'steam'}]},
    ]
  },
  {
    name:'Space Storm Pack',author:'PW Dev',version:'1.0',tags:'space, cosmic, exotic',
    description:'Cosmic debris, Ion Storm gas, and Neutronium — the densest matter.',
    elements:[
      {id:'cosmic_debris',label:'CosmicDebris🌑',color:['#4a3a2a','#3a2a1a','#5a4a3a'],behavior:'powder',weight:3,heatOutput:0,decay:0,reactions:[{neighbor:'fire',chance:.005,result:'smoke'}]},
      {id:'ion_storm',label:'IonStorm⚡',color:['#aaccff','#88aaff','#ffffff','#4488ff'],behavior:'gas',weight:0,heatOutput:2,decay:.03,reactions:[{neighbor:'metal',chance:.1,result:'electricity'},{neighbor:'wire',chance:.2,result:'electricity'}]},
      {id:'neutronium',label:'Neutronium★',color:['#ffffff','#aaaaaa','#eeeeee'],behavior:'solid',weight:5,heatOutput:0,decay:0,reactions:[{neighbor:'water',chance:.5,result:'steam'},{neighbor:'lava',chance:.3,result:'obsidian'}]},
    ]
  },
  {
    name:'Fantasy Biome',author:'PW Dev',version:'1.0',tags:'fantasy, magic, nature',
    description:'Enchanted Forest: Fairy Dust, Moonwater, and Shadowvine.',
    elements:[
      {id:'fairy_dust',label:'FairyDust✨',color:['#ffaaff','#ff88ff','#ffffff','#ffccff'],behavior:'gas',weight:0,heatOutput:0,decay:.02,reactions:[]},
      {id:'moonwater',label:'Moonwater🌙',color:['#aaccff','#88aaee','#ccddff'],behavior:'liquid',weight:.6,heatOutput:0,decay:0,reactions:[{neighbor:'fire',chance:.3,result:'steam'}]},
      {id:'shadowvine',label:'Shadowvine🌿',color:['#1a0a2a','#0f0518','#2a1a3a'],behavior:'solid',weight:1,heatOutput:0,decay:0,reactions:[{neighbor:'fire',chance:.05,result:'smoke'}]},
    ]
  },
  {
    name:'Industrial Pack',author:'PW Dev',version:'1.0',tags:'machines, industry, tech',
    description:'Molten Steel liquid, Carbon Fiber solid, and Coolant fluid for your factories.',
    elements:[
      {id:'molten_steel',label:'MoltenSteel🔩',color:['#ffaa44','#ff8800','#ffcc66'],behavior:'liquid',weight:2,heatOutput:6,decay:0,reactions:[{neighbor:'water',chance:.3,result:'steam'}]},
      {id:'carbon_fiber',label:'CarbonFiber',color:['#111111','#0a0a0a','#1a1a1a','#222222'],behavior:'solid',weight:1.5,heatOutput:0,decay:0,reactions:[{neighbor:'fire',chance:.001,result:'smoke'}]},
      {id:'coolant',label:'Coolant❄',color:['#00ccff','#00aaee','#44ddff'],behavior:'liquid',weight:.8,heatOutput:-5,decay:0,reactions:[{neighbor:'lava',chance:.2,result:'obsidian'},{neighbor:'fire',chance:.3,result:'steam'}]},
    ]
  },
];

function modRenderLibrary(){
  const el=document.getElementById('modLibraryList');el.innerHTML='';
  MOD_LIBRARY.forEach((mod,i)=>{
    const installed=loadedMods.some(m=>m.name===mod.name);
    const card=document.createElement('div');
    card.style.cssText='border:1px solid #0f0f18;border-radius:3px;padding:10px;margin-bottom:8px;background:#080810;';
    const swatches=mod.elements.map(e2=>`<div style="width:12px;height:12px;border-radius:1px;background:${Array.isArray(e2.color)?e2.color[0]:e2.color};display:inline-block;margin-right:2px;" title="${e2.label}"></div>`).join('');
    card.innerHTML=`
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <div style="flex:1;">
          <div style="font-size:.65rem;color:#ccc;font-family:'Syne',sans-serif;margin-bottom:2px;">${mod.name} <span style="font-size:.5rem;color:#333;">v${mod.version} by ${mod.author}</span></div>
          <div style="font-size:.55rem;color:#333;margin-bottom:5px;">${mod.description}</div>
          <div style="margin-bottom:5px;">${swatches}</div>
          <div style="font-size:.5rem;color:#222;">${mod.elements.map(e2=>e2.label).join(' · ')}</div>
        </div>
        <button onclick="modLibInstall(${i})" style="flex-shrink:0;padding:5px 12px;background:${installed?'#0a1a0a':'#0a0a1a'};border:1px solid ${installed?'#22aa44':'#222266'};color:${installed?'#44ff88':'#88aaff'};font-family:'DM Mono',monospace;font-size:.58rem;cursor:pointer;white-space:nowrap;">
          ${installed?'✓ Installed':'+ Install'}
        </button>
      </div>`;
    el.appendChild(card);
  });
}

window.modLibInstall=function(i){
  const mod=MOD_LIBRARY[i];
  // Convert to loadMod format (uses neighbor/chance/result format)
  const modJson=JSON.stringify({...mod,elements:mod.elements.map(e2=>({...e2,reactions:(e2.reactions||[]).map(r=>({neighbor:r.neighbor||r.with,chance:r.chance,result:r.result}))}))});
  const ok=loadMod(modJson,mod.name+'.pwmod');
  if(ok)modRenderLibrary();
};

// ── SHARE TAB ──
window.modCopyShareCode=function(){
  const txt=document.getElementById('modShareExport').value;
  if(!txt){document.getElementById('modShareMsg').textContent='Nothing to copy — build a mod first.';return;}
  navigator.clipboard.writeText(txt).then(()=>{document.getElementById('modShareMsg').style.color='#44ffaa';document.getElementById('modShareMsg').textContent='✓ Copied to clipboard!';}).catch(()=>{document.getElementById('modShareExport').select();document.execCommand('copy');document.getElementById('modShareMsg').style.color='#44ffaa';document.getElementById('modShareMsg').textContent='✓ Copied!';});
};

window.modImportShareCode=function(){
  const code=document.getElementById('modShareImport').value.trim();
  const msg=document.getElementById('modShareMsg');
  if(!code){msg.style.color='#ff4444';msg.textContent='Paste a code first!';return;}
  try{
    const json=decodeURIComponent(escape(atob(code)));
    const ok=loadMod(json,'shared_mod');
    if(ok){msg.style.color='#44ffaa';msg.textContent='✓ Mod installed!';document.getElementById('modShareImport').value='';modSetTab('loaded');}
  }catch(e){msg.style.color='#ff4444';msg.textContent='Invalid code: '+e.message;}
};

// Wire up existing mod file drop/browse
document.getElementById('mMods').onclick=()=>{renderModList();document.getElementById('panMod').classList.add('open');};
document.getElementById('bMods').onclick=()=>{renderModList();document.getElementById('panMod').classList.add('open');};

// Mod file drop/browse wiring
const modDrop=document.getElementById('modDrop');
if(modDrop){
  modDrop.onclick=()=>document.getElementById('modFile').click();
  modDrop.ondragover=e=>{e.preventDefault();modDrop.style.borderColor='var(--acc)';};
  modDrop.ondragleave=()=>modDrop.style.borderColor='';
  modDrop.ondrop=e=>{e.preventDefault();modDrop.style.borderColor='';[...e.dataTransfer.files].forEach(f=>{const r=new FileReader();r.onload=ev=>loadMod(ev.target.result,f.name);r.readAsText(f);});};
}
const modFile=document.getElementById('modFile');
if(modFile)modFile.onchange=e=>{[...e.target.files].forEach(f=>{const r=new FileReader();r.onload=ev=>loadMod(ev.target.result,f.name);r.readAsText(f);});};
