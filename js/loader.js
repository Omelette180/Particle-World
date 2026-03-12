/**
 * PARTICLE WORLD v2.0 — js/loader.js
 * Black hole loading screen + title particles.
 * Extracted directly from the working v1.2.3 single file.
 */
const lc=document.getElementById('lcanvas'),lx=lc.getContext('2d');
let lparts=[],lbhx=0,lbhy=0,lMode=0,lAnimId=null;
const LMODES=3;

const SCI_MSGS=[
  'calibrating gravity constant...','bending spacetime...','initializing quantum foam...',
  'computing particle interactions...','warming up the void...','folding dimensions...',
  'charging the event horizon...','simulating thermodynamics...','measuring planck length...',
  'aligning orbital mechanics...','synthesizing dark matter...','ready for chaos.'
];

function initL(){
  lc.width=innerWidth;lc.height=innerHeight;
  lbhx=lc.width/2;lbhy=lc.height/2;
  lparts=[];
  for(let i=0;i<300;i++){
    const a=Math.random()*Math.PI*2,d=100+Math.random()*Math.max(lc.width,lc.height)*.6;
    lparts.push({x:lbhx+Math.cos(a)*d,y:lbhy+Math.sin(a)*d,vx:0,vy:0,
      sz:1+Math.random()*2.5,trail:[],phase:Math.random()*Math.PI*2,
      col:`hsl(${240+Math.random()*90},${55+Math.random()*40}%,${42+Math.random()*35}%)`});
  }
}

// ── MODE 0: Classic spiral (original style, improved) ──
function drawBHCore(t){
  const BHR=60;
  // accretion disk
  for(let a=0;a<Math.PI*2;a+=.035){
    const r=BHR+22+Math.sin(a*3+t*.0014)*9;
    const px=lbhx+Math.cos(a)*r,py=lbhy+Math.sin(a)*r*.3;
    const h=Math.sin(a*2+t*.0022)*.5+.5;
    lx.fillStyle=`hsl(${18+h*45},92%,${46+h*32}%)`;lx.fillRect(px,py,2.5,1.2);
  }
  // lensing glow
  const g=lx.createRadialGradient(lbhx,lbhy,BHR*.6,lbhx,lbhy,BHR*3);
  g.addColorStop(0,'rgba(160,60,255,.32)');g.addColorStop(.5,'rgba(80,20,160,.1)');g.addColorStop(1,'transparent');
  lx.fillStyle=g;lx.beginPath();lx.arc(lbhx,lbhy,BHR*3,0,Math.PI*2);lx.fill();
  // outer pulse rings
  for(let ri=0;ri<3;ri++){
    const ph=(t*.0028+ri*Math.PI*.66)%(Math.PI*2);
    lx.strokeStyle=`rgba(168,85,247,${.18*Math.abs(Math.sin(ph))})`;lx.lineWidth=.8;
    lx.beginPath();lx.arc(lbhx,lbhy,BHR*1.4+ri*18+Math.sin(ph)*10,0,Math.PI*2);lx.stroke();
  }
  // event horizon
  const eg=lx.createRadialGradient(lbhx,lbhy,0,lbhx,lbhy,BHR);
  eg.addColorStop(0,'#000');eg.addColorStop(.7,'rgba(6,0,16,.98)');eg.addColorStop(1,'rgba(45,0,90,.55)');
  lx.fillStyle=eg;lx.beginPath();lx.arc(lbhx,lbhy,BHR,0,Math.PI*2);lx.fill();
  // hawking radiation
  if(Math.random()<.14){const a=Math.random()*Math.PI*2;lx.fillStyle='rgba(210,180,255,.55)';lx.fillRect(lbhx+Math.cos(a)*(BHR+1),lbhy+Math.sin(a)*(BHR+1),1,1);}
  return BHR;
}

function animMode0(){
  if(document.getElementById('loader').classList.contains('fade'))return;
  lAnimId=requestAnimationFrame(animMode0);
  const t=Date.now();
  lx.fillStyle='rgba(0,0,0,.13)';lx.fillRect(0,0,lc.width,lc.height);
  const BHR=drawBHCore(t);
  lparts.forEach(p=>{
    const dx=lbhx-p.x,dy=lbhy-p.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<BHR){const a2=Math.random()*Math.PI*2,nd=120+Math.random()*Math.max(lc.width,lc.height)*.5;p.x=lbhx+Math.cos(a2)*nd;p.y=lbhy+Math.sin(a2)*nd;p.vx=0;p.vy=0;p.trail=[];return;}
    const f=750/(d*d);
    p.vx+=dx/d*f-dy/d*f*.4;p.vy+=dy/d*f+dx/d*f*.4;
    p.x+=p.vx;p.y+=p.vy;
    p.trail.push({x:p.x,y:p.y});if(p.trail.length>8)p.trail.shift();
    if(p.trail.length>1){lx.strokeStyle=p.col;lx.lineWidth=p.sz*Math.min(1,d/(BHR*2.8));lx.beginPath();lx.moveTo(p.trail[0].x,p.trail[0].y);p.trail.forEach(tr=>lx.lineTo(tr.x,tr.y));lx.stroke();}
    lx.fillStyle=p.col;lx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  });
}

// ── MODE 1: Letters form FROM particles ejected out of BH ──
const LOGO_TEXT='PARTICLE WORLD';
let logoParticles=[],logoTargets=[],logoReady=false;
function buildLogoTargets(){
  logoTargets=[];
  const tmpC=document.createElement('canvas');tmpC.width=lc.width;tmpC.height=200;
  const tx=tmpC.getContext('2d');
  const fs=Math.min(lc.width/10,72);
  tx.font=`900 ${fs}px Syne,sans-serif`;tx.fillStyle='#fff';tx.textAlign='center';tx.textBaseline='middle';
  tx.fillText(LOGO_TEXT,lc.width/2,100);
  const img=tx.getImageData(0,0,lc.width,200);
  for(let y=0;y<200;y+=4)for(let x=0;x<lc.width;x+=4)if(img.data[(y*lc.width+x)*4+3]>128)logoTargets.push({tx:x,ty:lbhy-80+y});
  return logoTargets;
}
function animMode1(){
  if(document.getElementById('loader').classList.contains('fade'))return;
  lAnimId=requestAnimationFrame(animMode1);
  const t=Date.now();
  lx.fillStyle='rgba(0,0,0,.16)';lx.fillRect(0,0,lc.width,lc.height);
  const BHR=drawBHCore(t);
  // Spawn particles from BH toward targets
  if(!logoReady&&logoParticles.length<logoTargets.length){
    for(let i=0;i<4;i++){
      const tgt=logoTargets[logoParticles.length];if(!tgt)break;
      const a=Math.random()*Math.PI*2;
      logoParticles.push({x:lbhx+Math.cos(a)*BHR,y:lbhy+Math.sin(a)*BHR,tx:tgt.tx,ty:tgt.ty,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,done:false,col:`hsl(${260+Math.random()*60},80%,${55+Math.random()*25}%)`});
    }
    if(logoParticles.length>=logoTargets.length)logoReady=true;
  }
  logoParticles.forEach(p=>{
    if(!p.done){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<3){p.x=p.tx;p.y=p.ty;p.done=true;}else{p.x+=dx*.09;p.y+=dy*.09;}}
    lx.fillStyle=p.col;lx.fillRect(p.x,p.y,2,2);
  });
}

// ── MODE 2: Particles swirl and spell logo then BH appears ──
let swirl2particles=[],bh2appear=false,bh2radius=0,swirl2t=0;
function initMode2(){
  swirl2particles=[];bh2appear=false;bh2radius=0;swirl2t=0;
  buildLogoTargets();
  for(let i=0;i<logoTargets.length;i++){
    const a=Math.random()*Math.PI*2,d=80+Math.random()*Math.max(lc.width,lc.height)*.45;
    swirl2particles.push({x:lbhx+Math.cos(a)*d,y:lbhy+Math.sin(a)*d,tx:logoTargets[i].tx,ty:logoTargets[i].ty,vx:0,vy:0,done:false,col:`hsl(${240+Math.random()*90},75%,${50+Math.random()*25}%)`});
  }
}
function animMode2(){
  if(document.getElementById('loader').classList.contains('fade'))return;
  lAnimId=requestAnimationFrame(animMode2);
  const t=Date.now();swirl2t++;
  lx.fillStyle='rgba(0,0,0,.15)';lx.fillRect(0,0,lc.width,lc.height);
  // Phase 1: particles swirl into logo position
  if(!bh2appear){
    let doneCount=0;
    swirl2particles.forEach(p=>{
      if(!p.done){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<2){p.x=p.tx;p.y=p.ty;p.done=true;}else{p.x+=dx*.06+Math.sin(swirl2t*.04+p.tx)*.4;p.y+=dy*.06+Math.cos(swirl2t*.04+p.ty)*.4;}}
      if(p.done)doneCount++;
      lx.fillStyle=p.col;lx.fillRect(p.x,p.y,2,2);
    });
    if(doneCount>swirl2particles.length*.9&&swirl2t>80)bh2appear=true;
  } else {
    // Phase 2: BH appears and grows, starts pulling
    bh2radius=Math.min(60,bh2radius+1.2);
    const BHR=bh2radius;
    // accretion disk only when big enough
    if(BHR>20)for(let a=0;a<Math.PI*2;a+=.045){const r=BHR+18+Math.sin(a*3+t*.0014)*8;const px=lbhx+Math.cos(a)*r,py=lbhy+Math.sin(a)*r*.32;const h=Math.sin(a*2+t*.002)*.5+.5;lx.fillStyle=`hsl(${18+h*45},88%,${46+h*30}%)`;lx.fillRect(px,py,2,1);}
    const eg=lx.createRadialGradient(lbhx,lbhy,0,lbhx,lbhy,BHR);
    eg.addColorStop(0,'#000');eg.addColorStop(.7,'rgba(6,0,16,.98)');eg.addColorStop(1,'rgba(45,0,90,.5)');
    lx.fillStyle=eg;lx.beginPath();lx.arc(lbhx,lbhy,BHR,0,Math.PI*2);lx.fill();
    swirl2particles.forEach(p=>{
      const dx=lbhx-p.x,dy=lbhy-p.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d>BHR){const f=600/(d*d);p.vx+=dx/d*f-dy/d*f*.35;p.vy+=dy/d*f+dx/d*f*.35;p.x+=p.vx;p.y+=p.vy;}
      lx.fillStyle=p.col;lx.fillRect(p.x,p.y,2,2);
    });
  }
}

let lModeAnimFns=[animMode0,animMode1,animMode2];
function switchLMode(m){
  lMode=((m===undefined?lMode+1:m)%LMODES+LMODES)%LMODES;
  lx.clearRect(0,0,lc.width,lc.height);
  initL();
  if(lMode===1){buildLogoTargets();logoParticles=[];logoReady=false;}
  if(lMode===2){initMode2();}
  const btn=document.getElementById('lModeBtn');
  if(btn)btn.textContent=['✦ Classic','✦ Birth','✦ Swirl'][lMode];
  lModeAnimFns[lMode]();
}

function fakeLoad(){
  const bar=document.getElementById('lbar'),txt=document.getElementById('ltxt');
  let pct=0,mi=0;
  const iv=setInterval(()=>{
    pct+=1.4+Math.random()*2.8;if(pct>100)pct=100;
    bar.style.width=pct+'%';
    if(pct>mi*(100/SCI_MSGS.length)&&mi<SCI_MSGS.length){txt.textContent=SCI_MSGS[mi++];}
    if(pct>=100){clearInterval(iv);setTimeout(()=>{
      document.getElementById('load-progress').style.display='none';
      document.getElementById('menu-content').style.display='block';
      document.getElementById('linner').classList.add('menu-visible');
    },400);}
  },110);
}

// Add mode switcher button to loader HTML dynamically
const lModeBtn=document.createElement('button');
lModeBtn.id='lModeBtn';lModeBtn.textContent='✦ Classic';
lModeBtn.style.cssText='position:absolute;bottom:22px;left:50%;transform:translateX(-50%);background:transparent;border:1px solid #2a1a3a;border-radius:3px;color:#3a1a5a;font-family:"DM Mono",monospace;font-size:.55rem;letter-spacing:.12em;padding:5px 14px;cursor:pointer;transition:all .15s;z-index:10;';
lModeBtn.onmouseover=()=>{lModeBtn.style.borderColor='#a855f7';lModeBtn.style.color='#a855f7';};
lModeBtn.onmouseout=()=>{lModeBtn.style.borderColor='#2a1a3a';lModeBtn.style.color='#3a1a5a';};
lModeBtn.onclick=()=>switchLMode();
document.getElementById('loader').appendChild(lModeBtn);

initL();animMode0();fakeLoad();


// ── RESTLESS TITLE PARTICLES ──
// Tiny particles that drift around behind the menu — different element colors
(function initTitleParticles(){
  const tc=document.getElementById('titleParticles');
  if(!tc)return;
  tc.width=window.innerWidth;tc.height=window.innerHeight;
  const tx2=tc.getContext('2d');
  const ELEM_COLS=['#d4a843','#1a8fd1','#ff6020','#88ff00','#dd00ff','#44aa22','#ff5500','#888cce8','#cc44ff','#ff22aa','#aaffaa','#ff8844','#88cce8','#ffaa00'];
  const tparts=[];
  for(let i=0;i<120;i++){
    tparts.push({
      x:Math.random()*tc.width,y:Math.random()*tc.height,
      vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.4,
      col:ELEM_COLS[0|Math.random()*ELEM_COLS.length],
      sz:1+Math.random()*2,life:Math.random(),dlife:0.003+Math.random()*.004,
      wobble:Math.random()*Math.PI*2,wobbleSpd:0.02+Math.random()*.03
    });
  }
  function animTP(){
    if(document.getElementById('loader').classList.contains('fade'))return;
    requestAnimationFrame(animTP);
    tx2.clearRect(0,0,tc.width,tc.height);
    tparts.forEach(p=>{
      p.wobble+=p.wobbleSpd;
      p.x+=p.vx+Math.sin(p.wobble)*.25;
      p.y+=p.vy+Math.cos(p.wobble*.7)*.18;
      p.life+=p.dlife;
      if(p.life>1){p.dlife=-Math.abs(p.dlife);}
      if(p.life<0){p.dlife=Math.abs(p.dlife);p.x=Math.random()*tc.width;p.y=Math.random()*tc.height;}
      if(p.x<-10)p.x=tc.width+5;if(p.x>tc.width+10)p.x=-5;
      if(p.y<-10)p.y=tc.height+5;if(p.y>tc.height+10)p.y=-5;
      tx2.globalAlpha=Math.max(0,p.life)*.7;
      tx2.fillStyle=p.col;
      tx2.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
    });
    tx2.globalAlpha=1;
  }
  animTP();
})();

// ─── MENU ───
let glowOn=true,shakeOn=true;
document.getElementById('mPlay').onclick=startGame;
document.getElementById('mSandbox').onclick=startGame;
document.getElementById('mTutorial').onclick=()=>document.getElementById('panTut').classList.add('open');
document.getElementById('mSettings').onclick=()=>document.getElementById('panSet').classList.add('open');
document.getElementById('mCredits').onclick=()=>document.getElementById('panCred').classList.add('open');
document.getElementById('mLog').onclick=()=>document.getElementById('panLog').classList.add('open');
document.getElementById('mMods').onclick=()=>{document.getElementById('panMod').classList.add('open');modRenderLibrary&&modRenderLibrary();};
document.getElementById('closeSet').onclick=()=>{applySettings();document.getElementById('panSet').classList.remove('open');};
document.getElementById('setSpd').oninput=e=>document.getElementById('setSpdV').textContent=e.target.value+'x';
const THEMES_LIST=['t-light','t-neon','t-warm','t-forest','t-mono'];
document.querySelectorAll('#panSet .tt').forEach(b=>b.onclick=()=>{
  THEMES_LIST.forEach(t=>document.body.classList.remove(t));
  if(b.dataset.t)document.body.classList.add(b.dataset.t);
  document.querySelectorAll('#panSet .tt').forEach(x=>x.classList.remove('on'));b.classList.add('on');
});
let perfMode=false;
function applySettings(){
  CELL=+document.getElementById('setQ').value;
  simSpeed=+document.getElementById('setSpd').value;
  document.getElementById('spR').value=simSpeed;
  document.getElementById('spV').textContent=simSpeed+'x';
  document.getElementById('spdbadge').textContent=simSpeed+'x';
  glowOn=!!+document.getElementById('setGlow').value;
  shakeOn=!!+document.getElementById('setShake').value;
  perfMode=!!+document.getElementById('setPerfMode').value;
  if(perfMode){glowOn=false;shakeOn=false;document.getElementById('setGlow').value='0';document.getElementById('setShake').value='0';}
  const lm=document.getElementById('setLayout').value;
  localStorage.setItem('pw_layout',lm);
  setLayoutMode(lm);
  if(ta)resize();
}

// ── PRO LAYOUT ENGINE ──────────────────────────────────────────────
// Build and manage the Pro bottom-dock layout
let _proBuilt=false;

// All elements grouped by category for the pro dock
// Mirrors the sidebar categories but drives the bottom dock
const PRO_CATS=[
  {id:'basics',label:'Basics',elems:['sand','water','dirt','stone','gravel','snow','ice','mud','salt','glass','clay','chalk']},
  {id:'fire',label:'🔥 Fire',elems:['fire','lava','wood','coal','oil','gunpowder','tnt','torch','thermite','napalm','napalm2','wildfire','greek_fire','ember','charcoal','wax','plastic']},
  {id:'nuclear',label:'☢ Nuclear',elems:['uranium','plutonium','radiation','nuke','mutant','waste','lead_pb']},
  {id:'liquids',label:'💧 Liquids',elems:['acid','poison','mercury','honey','saltwater','blood','ethanol','liquid_nitrogen','tar','mud_water','seawater']},
  {id:'gases',label:'💨 Gases',elems:['steam','smoke','gas','methane','co2','bubble','hydrogen']},
  {id:'explosives',label:'💥 Booms',elems:['c4','dynamite','nitroglycerin','thermite','landmine','mine','acid_bomb','cryo_bomb','sulfur','phosphorus']},
  {id:'structures',label:'🏗 Structures',elems:['wall','concrete','brick','metal','steel','steel_beam','ceramic','obsidian','basalt','wood_plank','rope','pipe','scaffolding','glass_pane']},
  {id:'nature',label:'🌿 Nature',elems:['plant','seed','fungus','algae','vine','tree','cactus','flower','fern','bush','mushroom','grass','coral','kelp','nutrient']},
  {id:'creatures',label:'🐾 Creatures',elems:['person','zombie','ant','fish','bird','worm','virus','mutant','citizen','police','crab','shark','whale','rat','snake','frog','wolf','bear','spider','bat','moth']},
  {id:'weather',label:'⛈ Weather',elems:['rain','cloud','lightning','tornado','blizzard_cloud','acid_cloud','snow_cloud']},
  {id:'space',label:'🌌 Space',elems:['blackhole','neutronstar','plasma','dark_matter','exotic_matter','alien_beam','meteor','asteroid']},
  {id:'tech',label:'⚡ Tech',elems:['wire','battery','pump','fan','turret','laser','conveyor','timer','gate_and','gate_or','gate_not','portal_a','portal_b','wormhole']},
  {id:'vehicles',label:'🚗 Vehicles',elems:['car','boat','plane','tank','helicopter']},
  {id:'city',label:'🏙 City',elems:['road','house','shop','office','park','hospital','school','bank','factory','powerplant']},
  {id:'food',label:'🍔 Food',elems:['cheese','bread','meat','sugar_elem']},
  {id:'special',label:'✨ Special',elems:['eraser','clone','void','solidify','melt_elem','gravity_dust','gravity_zone','magnet','crystal','sponge','acid_resist','superglue','anti_matter']},
  {id:'molten',label:'🌋 Molten',elems:['magma_pool','molten_glass','molten_iron','molten_gold']},
];

function buildProDock(){
  if(_proBuilt)return;
  _proBuilt=true;
  const catBar=document.getElementById('proCats');
  const elemRow=document.getElementById('proElems');
  catBar.innerHTML='';

  let activeCat=PRO_CATS[0].id;

  function showCat(catId){
    activeCat=catId;
    // Update tab highlights
    catBar.querySelectorAll('.pcat').forEach(b=>b.classList.toggle('on',b.dataset.c===catId));
    // Build element chips
    elemRow.innerHTML='';
    const cat=PRO_CATS.find(c=>c.id===catId);
    if(!cat)return;
    cat.elems.forEach(name=>{
      const info=ELEM_REGISTRY[name];
      if(!info&&!E[name])return; // skip unknowns
      const color=info?.color||gcol(name)||'#444';
      const label=info?.label||name.replace(/_/g,' ');
      const btn=document.createElement('button');
      btn.className='peb'+(sel===name?' sel':'');
      btn.dataset.e=name;
      btn.innerHTML=`<div class="pdot" style="background:${color}"></div><span>${label}</span>`;
      btn.onclick=()=>{
        sel=name;
        document.getElementById('proSelName').textContent=name;
        // sync classic sidebar selection
        document.querySelectorAll('.eb.sel').forEach(b=>b.classList.remove('sel'));
        const cls=document.querySelector(`.eb[data-e="${name}"]`);
        if(cls)cls.classList.add('sel');
        elemRow.querySelectorAll('.peb').forEach(b=>b.classList.toggle('sel',b.dataset.e===name));
      };
      elemRow.appendChild(btn);
    });
  }

  // Build category tabs
  PRO_CATS.forEach(cat=>{
    const btn=document.createElement('button');
    btn.className='pcat'+(cat.id===activeCat?' on':'');
    btn.dataset.c=cat.id;
    btn.textContent=cat.label;
    btn.onclick=()=>showCat(cat.id);
    catBar.appendChild(btn);
  });

  showCat(activeCat);

  // Pro search
  document.getElementById('proSearch').addEventListener('input',function(){
    const q=this.value.toLowerCase().trim();
    if(!q){showCat(activeCat);return;}
    elemRow.innerHTML='';
    // Search all elements across all cats
    const seen=new Set();
    PRO_CATS.forEach(cat=>{
      cat.elems.forEach(name=>{
        if(seen.has(name))return;
        if(!name.includes(q)&&!(ELEM_REGISTRY[name]?.label||'').toLowerCase().includes(q))return;
        seen.add(name);
        const info=ELEM_REGISTRY[name];
        if(!info&&!E[name])return;
        const color=info?.color||gcol(name)||'#444';
        const label=info?.label||name.replace(/_/g,' ');
        const btn=document.createElement('button');
        btn.className='peb'+(sel===name?' sel':'');
        btn.dataset.e=name;
        btn.innerHTML=`<div class="pdot" style="background:${color}"></div><span>${label}</span>`;
        btn.onclick=()=>{sel=name;document.getElementById('proSelName').textContent=name;elemRow.querySelectorAll('.peb').forEach(b=>b.classList.toggle('sel',b.dataset.e===name));};
        elemRow.appendChild(btn);
      });
    });
  });

  // Pro brush slider
  const proBR=document.getElementById('proBrushR');
  const proBV=document.getElementById('proBrushV');
  proBR.addEventListener('input',()=>{bsz=+proBR.value;proBV.textContent=bsz;document.getElementById('bR').value=bsz;document.getElementById('bV').textContent=bsz;});

  // Pro speed slider
  const proSR=document.getElementById('proSpeedR');
  const proSV=document.getElementById('proSpeedV');
  proSR.addEventListener('input',()=>{simSpeed=+proSR.value;proSV.textContent=simSpeed+'x';document.getElementById('spR').value=simSpeed;document.getElementById('spV').textContent=simSpeed+'x';document.getElementById('spdbadge').textContent=simSpeed+'x';});
}

// ELEM_REGISTRY: lightweight name→{color,label} for the dock
// Populated from the existing .eb buttons in the classic sidebar
function buildElemRegistry(){
  window.ELEM_REGISTRY={};
  document.querySelectorAll('#ss .eb[data-e]').forEach(btn=>{
    const name=btn.dataset.e;
    const dot=btn.querySelector('.dot');
    const color=dot?dot.style.background:'#888';
    const rawLabel=btn.textContent.trim().replace(/[A-Z]$/,'').trim();
    ELEM_REGISTRY[name]={color,label:rawLabel};
  });
}

// Pro floating toolbar wires up to existing functions
function wireProToolbar(){
  const map={
    ptPause:()=>document.getElementById('bPause').click(),
    ptGrid:()=>document.getElementById('bGrid').click(),
    ptHeat:()=>document.getElementById('bHeat').click(),
    ptRain:()=>document.getElementById('bRain').click(),
    ptChaos:()=>document.getElementById('bChaos').click(),
    ptClear:()=>document.getElementById('bClear').click(),
    ptMenu:()=>document.getElementById('bMenu').click(),
  };
  Object.entries(map).forEach(([id,fn])=>{
    const btn=document.getElementById(id);
    if(btn)btn.onclick=fn;
  });
}

// Mirror classic toolbar .on states to pro toolbar
function syncProToolbarState(){
  const pairs=[['bPause','ptPause'],['bGrid','ptGrid'],['bHeat','ptHeat'],['bRain','ptRain']];
  pairs.forEach(([cid,pid])=>{
    const csrc=document.getElementById(cid);
    const pdst=document.getElementById(pid);
    if(csrc&&pdst){
      const obs=new MutationObserver(()=>pdst.classList.toggle('on',csrc.classList.contains('on')));
      obs.observe(csrc,{attributes:true,attributeFilter:['class']});
    }
  });
}

// Sync pro stats every second
setInterval(()=>{
  if(!document.body.classList.contains('layout-pro'))return;
  const fp=document.getElementById('proFps');
  const pc=document.getElementById('proPCount');
  if(fp)fp.textContent=document.getElementById('sF')?.textContent||'?';
  if(pc)pc.textContent=document.getElementById('sP')?.textContent||'0';
},1000);

function setLayoutMode(mode){
  if(mode==='pro'){
    document.body.classList.add('layout-pro');
    buildElemRegistry();
    buildProDock();
    wireProToolbar();
    syncProToolbarState();
    document.getElementById('btm').style.display='none';
  }else{
    document.body.classList.remove('layout-pro');
    document.getElementById('btm').style.display='';
  }
}

// Restore layout from localStorage on load
setTimeout(()=>{
  const saved=localStorage.getItem('pw_layout')||'classic';
  document.getElementById('setLayout').value=saved;
  setLayoutMode(saved);
},800);
function startGame(){
  const loader=document.getElementById('loader');
  loader.classList.add('fade');
  setTimeout(()=>loader.style.display='none',950);
  document.getElementById('game').classList.add('show');
  _buildGlowData();
  resize();
  requestAnimationFrame(loop);
}

// ── CONNECT LOADER TO GAME PROGRESS ──────────────────────────────
// Replace the fake load — ui.js calls this to update real progress
window.PW_setLoadProgress = function(pct, msg) {
  const bar = document.getElementById('lbar');
  const txt = document.getElementById('ltxt');
  if (bar) bar.style.width = Math.min(100, pct) + '%';
  if (txt && msg) txt.textContent = msg;
  if (pct >= 100) {
    setTimeout(() => {
      document.getElementById('load-progress').style.display = 'none';
      document.getElementById('menu-content').style.display  = 'block';
      document.getElementById('linner').classList.add('menu-visible');
    }, 400);
  }
};
