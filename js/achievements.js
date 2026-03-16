/**
 * PARTICLE WORLD v2.0 — js/achievements.js
 * Extracted from v1.2.3. Full achievements system preserved.
 */

// ══════════════════════════════════════════
//  UPDATE LOG POPUP  v1.0
// ══════════════════════════════════════════
function dismissUpdatePopup(){document.getElementById('updatePopup').style.display='none';localStorage.setItem('pw_seenVersion',GAME_VERSION);}
function checkUpdatePopup(){if(localStorage.getItem('pw_seenVersion')!==GAME_VERSION)document.getElementById('updatePopup').style.display='flex';}
checkUpdatePopup();

// ══════════════════════════════════════════
let score=0;
const achUnlocked=new Set();

const ACHIEVEMENTS=[
  {id:'first_fire',icon:'🔥',name:'Fire Starter',desc:'Place your first fire',pts:10},
  {id:'first_explode',icon:'💥',name:'Boom!',desc:'Trigger your first explosion',pts:25},
  {id:'first_nuke',icon:'☢',name:'Oops.',desc:'Detonate a nuke',pts:100},
  {id:'chain10',icon:'⚡',name:'Chain Reaction',desc:'Reach a chain count of 10',pts:50},
  {id:'chain50',icon:'⚡⚡',name:'Mega Chain',desc:'Reach a chain count of 50',pts:150},
  {id:'chain100',icon:'💫',name:'ULTRA CHAIN',desc:'Reach a chain count of 100',pts:500},
  {id:'first_bh',icon:'🕳',name:'Event Horizon',desc:'Place a black hole',pts:75},
  {id:'first_zombie',icon:'🧟',name:'Patient Zero',desc:'Place your first zombie',pts:20},
  {id:'zombie_wave5',icon:'🧟‍♂️',name:'Survivor',desc:'Survive 5 zombie waves',pts:200},
  {id:'first_alien',icon:'👾',name:'First Contact',desc:'Spawn a UFO',pts:30},
  {id:'first_portal',icon:'🌀',name:'Teleporter',desc:'Place Portal A and Portal B',pts:40},
  {id:'ocean_life',icon:'🌊',name:'Ecosystem',desc:'Have shark, whale, coral and kelp at once',pts:100},
  {id:'city_life',icon:'🏙',name:'City Planner',desc:'Have 10+ citizens in your world',pts:75},
  {id:'first_virus',icon:'🦠',name:'Outbreak',desc:'Place a virus',pts:15},
  {id:'virus_spread',icon:'🦠🦠',name:'Pandemic',desc:'Virus spreads to 20+ cells',pts:100},
  {id:'rad_high',icon:'☢',name:'Chernobyl',desc:'Radiation level hits 80%+',pts:150},
  {id:'first_lightning',icon:'⚡',name:'Storm Chaser',desc:'Summon lightning',pts:20},
  {id:'first_tornado',icon:'🌪',name:'Twister',desc:'Place a tornado',pts:20},
  {id:'first_plasma',icon:'✨',name:'Star Stuff',desc:'Create plasma',pts:30},
  {id:'mod_loaded',icon:'📦',name:'Modder',desc:'Load your first mod',pts:50},
  {id:'custom_elem',icon:'✏',name:'Creator',desc:'Create a custom element',pts:75},
  {id:'preset_loaded',icon:'🗺',name:'World Traveller',desc:'Load a preset world',pts:25},
  {id:'admin_unlocked',icon:'⚙',name:'Hacker',desc:'Unlock the admin panel',pts:100},
  {id:'armageddon',icon:'☠',name:'Armageddon',desc:'Trigger the Armageddon god button',pts:250},
  {id:'score100',icon:'🌟',name:'Getting Started',desc:'Reach 100 score',pts:0},
  {id:'score1000',icon:'🌟🌟',name:'Explosive Growth',desc:'Reach 1000 score',pts:0},
  {id:'score10000',icon:'🌟🌟🌟',name:'World Destroyer',desc:'Reach 10000 score',pts:0},
  {id:'first_wormhole',icon:'🌀',name:'Shortcut',desc:'Place a wormhole',pts:30},
];

function addScore(pts){
  if(!pts)return;
  score+=pts;
  document.getElementById('scoreDisp').textContent='⭐ '+score.toLocaleString();
  document.getElementById('achScoreTotal').textContent=score.toLocaleString();
  if(score>=100)unlockAch('score100');
  if(score>=1000)unlockAch('score1000');
  if(score>=10000)unlockAch('score10000');
}

function unlockAch(id){
  if(achUnlocked.has(id))return;
  const ach=ACHIEVEMENTS.find(a=>a.id===id);if(!ach)return;
  achUnlocked.add(id);addScore(ach.pts);
  showAchToast(ach);renderAchList();
}

function showAchToast(ach){
  const popup=document.getElementById('achPopup');
  const toast=document.createElement('div');toast.className='ach-toast';
  toast.innerHTML=`<div class="ach-icon">${ach.icon}</div><div class="ach-text"><div class="ach-title">Achievement Unlocked!</div><div class="ach-name">${ach.name}</div><div class="ach-score">${ach.pts?'+'+ach.pts+' pts':ach.desc}</div></div>`;
  popup.appendChild(toast);
  try{sndPlay('portal');}catch(e){}
  setTimeout(()=>{toast.classList.add('out');setTimeout(()=>toast.remove(),400);},3200);
}

function renderAchList(){
  const el=document.getElementById('achList');if(!el)return;el.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const u=achUnlocked.has(a.id);
    const row=document.createElement('div');
    row.style.cssText=`display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0a0a;opacity:${u?1:.35}`;
    row.innerHTML=`<span style="font-size:1.1rem">${a.icon}</span><div style="flex:1"><div style="font-size:.66rem;color:${u?'#ccc':'#444'};font-family:'Syne',sans-serif">${a.name}</div><div style="font-size:.56rem;color:#333">${a.desc}</div></div><span style="font-size:.58rem;color:var(--acc)">${a.pts?'+'+a.pts:''}</span>${u?'<span style="font-size:.6rem;color:#44ffaa">✓</span>':''}`;
    el.appendChild(row);
  });
}
renderAchList();

// Hook achievements
// NUKE — merged
const __NUKE=NUKE;
NUKE=function(cx,cy){__NUKE(cx,cy);unlockAch('first_nuke');addScore(500);sndPlay('nuke');};

// sC — merged achievement hooks
const __sC2=sC;
sC=function(x,y,n){
  __sC2(x,y,n);
  if(n==='fire'||n==='lava')unlockAch('first_fire');
  if(n==='blackhole')unlockAch('first_bh');
  if(n==='virus')unlockAch('first_virus');
  if(n==='lightning')unlockAch('first_lightning');
  if(n==='tornado')unlockAch('first_tornado');
  if(n==='plasma')unlockAch('first_plasma');
  if(n==='ufo'||n==='alien')unlockAch('first_alien');
  if(n==='wormhole')unlockAch('first_wormhole');
};

document.getElementById('bAch').onclick=()=>{renderAchList();document.getElementById('panAch').classList.add('open');};
document.getElementById('bLog').onclick=()=>document.getElementById('panLog').classList.add('open');
document.getElementById('mLog').onclick=()=>document.getElementById('panLog').classList.add('open');
document.getElementById('mWorlds').onclick=()=>document.getElementById('panWorlds').classList.add('open');
document.getElementById('bWorlds').onclick=()=>document.getElementById('panWorlds').classList.add('open');
document.getElementById('bCreate').onclick=()=>document.getElementById('panCreate').classList.add('open');
