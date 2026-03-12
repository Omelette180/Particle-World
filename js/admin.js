/**
 * PARTICLE WORLD v2.0 — js/admin.js
 * Extracted from v1.2.3. Full admin panel preserved.
 */

// ══════════════════════════════════════════
//  ADMIN PANEL
// ══════════════════════════════════════════
const ADMIN_CODE='omariscool';
let adminUnlocked=false,aiEnabled=true,particleLimit=50000;
let gravityMult=1,heatMult=1,flowMult=1,explMult=1,creatureSpeedMult=1;
let freezeAll=false;

function applyPWDevGolden(){
  // Golden name in toolbar + account panel
  const nameEl=document.getElementById('acctName');
  if(nameEl&&nameEl.textContent==='PW_dev'){
    nameEl.style.cssText='background:linear-gradient(90deg,#ffd700,#ffaa00,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:"Syne",sans-serif;font-weight:700;font-size:.85rem;';
  }
  // Golden admin toggle button
  const btn=document.getElementById('adminToggleBtn');
  if(btn){btn.style.cssText+='color:#ffd700;border-color:#ffd70044;text-shadow:0 0 8px #ffd700;';}
  // Gold crown on score display
  const score=document.getElementById('scoreDisp');
  if(score)score.style.color='#ffd700';
  // Toast
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#1a1400,#2a2000);border:1px solid #ffd70066;color:#ffd700;font-family:"Syne",sans-serif;font-size:.72rem;padding:10px 22px;border-radius:4px;z-index:9999;letter-spacing:.1em;box-shadow:0 0 24px #ffd70044;pointer-events:none;';
  t.textContent='👑 Welcome back, PW_dev';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

function openAdminGate(){
  document.getElementById('adminCode').classList.remove('hide');
  document.getElementById('adminInput').value='';
  document.getElementById('adminErr').textContent='';
  setTimeout(()=>document.getElementById('adminInput').focus(),100);
}

// ── Tab switching ──
document.querySelectorAll('.atab').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.atab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.atab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// ── Drag to move ──
(()=>{
  const panel=document.getElementById('adminPanel');
  const handle=document.getElementById('adminDragHandle');
  let dragging=false,ox=0,oy=0;
  handle.addEventListener('mousedown',e=>{
    dragging=true;
    ox=e.clientX-panel.offsetLeft;
    oy=e.clientY-panel.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging)return;
    let nx=e.clientX-ox,ny=e.clientY-oy;
    nx=Math.max(0,Math.min(window.innerWidth-panel.offsetWidth,nx));
    ny=Math.max(0,Math.min(window.innerHeight-panel.offsetHeight,ny));
    panel.style.left=nx+'px';panel.style.top=ny+'px';
    panel.style.right='auto';
  });
  document.addEventListener('mouseup',()=>dragging=false);
})();

document.getElementById('adminInput').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    if(document.getElementById('adminInput').value===ADMIN_CODE){
      adminUnlocked=true;
      document.getElementById('adminCode').classList.add('hide');
      document.getElementById('adminPanel').classList.add('open');
      document.getElementById('adminToggleBtn').classList.add('show');
      populateAdminElemSel();
      adminDebugTick();
      adminWireButtons();
      if(currentUser==='PW_dev')applyPWDevGolden();
    } else {
      document.getElementById('adminErr').textContent='Wrong code. Try again.';
      document.getElementById('adminInput').value='';
      document.getElementById('adminInput').style.borderColor='#ff4444';
      setTimeout(()=>document.getElementById('adminInput').style.borderColor='',600);
    }
  }
  if(e.key==='Escape')document.getElementById('adminCode').classList.add('hide');
});

document.getElementById('adminMinBtn').onclick=()=>{
  const body=document.getElementById('adminBody');
  const tabs=document.getElementById('adminTabs');
  const minimized=body.style.display==='none';
  body.style.display=minimized?'':'none';
  tabs.style.display=minimized?'':'none';
  document.getElementById('adminMinBtn').textContent=minimized?'_':'□';
};
document.getElementById('adminClose').onclick=()=>document.getElementById('adminPanel').classList.remove('open');
document.getElementById('adminToggleBtn').onclick=()=>{
  const p=document.getElementById('adminPanel');
  p.classList.contains('open')?p.classList.remove('open'):p.classList.add('open');
};

// ── Wire all admin buttons ──
function adminWireButtons(){
  // Announcement
  const ann=()=>{
    const msg=document.getElementById('aAnnounceInput').value.trim();
    if(!msg)return;
    window.adminSendAnnouncement&&window.adminSendAnnouncement(msg);
    document.getElementById('aAnnounceInput').value='';
  };
  document.getElementById('aAnnounceSend').onclick=ann;
  document.getElementById('aAnnounceInput').onkeydown=e=>{if(e.key==='Enter')ann();};
  document.getElementById('aAnnounceClear').onclick=()=>window.adminClearAnnouncement&&window.adminClearAnnouncement();

  // Ban
  document.getElementById('aBanSend').onclick=async()=>{
    const user=document.getElementById('aBanUser').value.trim();
    const reason=document.getElementById('aBanReason').value.trim();
    const dur=parseInt(document.getElementById('aBanDuration').value);
    const msg=document.getElementById('aBanMsg');
    if(!user){msg.textContent='Enter a username.';return;}
    const ok=await window.adminBanUser(user,reason,dur);
    if(ok){msg.style.color='#44ff88';msg.textContent=`✓ ${user} banned.`;document.getElementById('aBanUser').value='';document.getElementById('aBanReason').value='';}
    else{msg.style.color='#ff6666';msg.textContent='Failed — Firebase not ready.';}
    setTimeout(()=>msg.textContent='',3000);
  };
  document.getElementById('aBanUnbanAll').onclick=async()=>{
    await window.adminUnbanAll();
    const msg=document.getElementById('aBanMsg');
    msg.style.color='#44ff88';msg.textContent='✓ All bans cleared.';
    setTimeout(()=>msg.textContent='',3000);
  };

  // Screenshot
  document.getElementById('aScreenshot').onclick=()=>{
    const a=document.createElement('a');a.download='particleworld.png';
    a.href=document.getElementById('gc').toDataURL();a.click();
  };
  document.getElementById('aGIFStart').onclick=()=>startGIF&&startGIF();

  // Online players from Firebase
  document.getElementById('aRefreshPlayers').onclick=()=>{
    const el=document.getElementById('aOnlinePlayers');
    el.textContent='Loading...';
    if(window._fbDb){
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js').then(({ref,get})=>{
        get(ref(window._fbDb,'rooms')).then(snap=>{
          if(!snap.exists()){el.textContent='No active rooms.';return;}
          let html='';
          Object.entries(snap.val()).forEach(([code,room])=>{
            const players=Object.values(room.players||{});
            html+=`<div style="margin-bottom:4px;"><span style="color:#a855f7;">${code}</span> — ${players.length} player${players.length!==1?'s':''}</div>`;
            players.forEach(p=>html+=`<div style="padding-left:10px;color:#333;">${p.name||p.id.slice(0,8)}</div>`);
          });
          el.innerHTML=html||'No active rooms.';
        });
      });
    } else el.textContent='Firebase not connected.';
  };

  // New disaster buttons
  document.getElementById('dLavaFlood').onclick=()=>{for(let x=0;x<COLS;x++)for(let y=0;y<20;y++)if(rnd()<.6)sC(x,y,'lava');};
  document.getElementById('dIceAge').onclick=()=>{for(let i=0;i<ta.length;i++)if(ta[i]===E.water||ta[i]===E.lava)sC(i%COLS,Math.floor(i/COLS),'ice');};
  document.getElementById('dPlague').onclick=()=>{for(let i=0;i<100;i++){const x=0|rnd()*COLS,y=0|rnd()*ROWS;sC(x,y,'virus');}};
  document.getElementById('dAsteroidField').onclick=()=>{for(let i=0;i<15;i++){const x=0|rnd()*COLS;sC(x,0,'meteor');ea[id(x,0)]=80+0|rnd()*80;}};

  // Stats tab perf display
  setInterval(()=>{
    const el=document.getElementById('aPerfStats');
    if(el&&document.getElementById('aTab5').classList.contains('active')){
      let cnt=0;for(let i=0;i<ta.length;i++)if(ta[i])cnt++;
      el.innerHTML=`Particles: ${cnt.toLocaleString()}<br>Canvas: ${COLS}×${ROWS}<br>Cell: ${CELL}px<br>Sim speed: ${simSpeed}x`;
    }
  },500);
}

// secret keycombo: type 'omariscool' anywhere in game
let adminTyped='';
document.addEventListener('keypress',e=>{
  if(e.target.tagName==='INPUT')return;
  adminTyped+=e.key;
  if(adminTyped.length>ADMIN_CODE.length)adminTyped=adminTyped.slice(-ADMIN_CODE.length);
  if(adminTyped===ADMIN_CODE){adminTyped='';if(!adminUnlocked)openAdminGate();else{document.getElementById('adminPanel').classList.toggle('open');}}
});

function populateAdminElemSel(){
  const sel=document.getElementById('aElemSel');sel.innerHTML='';
  const allE=[...Object.keys(E)].filter(k=>k!=='empty').sort();
  allE.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);});
}

// Physics multipliers applied in existing functions via globals
// Wrap canFall to respect gravity
const _canFall=canFall;
canFall=function(t){
  if(freezeAll)return false;
  if(gravityMult===0)return false;
  if(gravityMult<1&&Math.random()>gravityMult)return false;
  return _canFall(t);
};

// World controls
document.getElementById('aP').onclick=()=>document.getElementById('bPause').click();
document.getElementById('aSt').onclick=()=>{if(paused)step();};
document.getElementById('aCl').onclick=()=>document.getElementById('bClear').click();
document.getElementById('aRe').onclick=()=>{ta.fill(0);ca.fill('#040404');ea.fill(0);da.fill(0);ha.fill(0);gRad=0;chainCount=0;zombieMode=false;alienMode=false;document.getElementById('zhud').style.display='none';document.getElementById('ahud').style.display='none';};
document.getElementById('aPlim').oninput=e=>{particleLimit=+e.target.value;document.getElementById('aPlimV').textContent=particleLimit>=50000?'∞':particleLimit.toLocaleString();};

// Physics sliders
document.getElementById('aGrav').oninput=e=>{gravityMult=e.target.value/10;document.getElementById('aGravV').textContent=gravityMult.toFixed(1);};
document.getElementById('aHeat').oninput=e=>{heatMult=e.target.value/10;document.getElementById('aHeatV').textContent=heatMult.toFixed(1)+'x';};
document.getElementById('aFlow').oninput=e=>{flowMult=e.target.value/10;document.getElementById('aFlowV').textContent=flowMult.toFixed(1)+'x';};
document.getElementById('aExpl').oninput=e=>{explMult=e.target.value/10;document.getElementById('aExplV').textContent=explMult.toFixed(1)+'x';};
document.getElementById('aSpd2').oninput=e=>{simSpeed=+e.target.value;document.getElementById('spR').value=Math.min(5,simSpeed);document.getElementById('spV').textContent=simSpeed+'x';document.getElementById('spdbadge').textContent=simSpeed+'x';document.getElementById('aSpdV2').textContent=simSpeed+'x';};

// Apply explMult to explosions — MERGED with sound + achievements
const _explodeBase=explode;
explode=function(cx,cy,r,f=1){
  _explodeBase(cx,cy,r,(f||1)*explMult);
  unlockAch('first_explode');
  addScore(Math.round(r*2*(f||1)));
  if(r>10)sndPlay('explode_big');else sndPlay('explode');
};

// Creature speed mult applied in wlk
const _wlk=wlk;
wlk=function(x,y,sp=.4){
  if(!aiEnabled)return true;
  return _wlk(x,y,sp*creatureSpeedMult);
};
document.getElementById('aCSpd').oninput=e=>{creatureSpeedMult=e.target.value/10;document.getElementById('aCSpdV').textContent=creatureSpeedMult.toFixed(1)+'x';};

// Element spawn
document.getElementById('aSpawnElem').onclick=()=>{
  const n=document.getElementById('aElemSel').value;
  const cx=0|+document.getElementById('aSpawnX').value/100*COLS;
  const cy=0|+document.getElementById('aSpawnY').value/100*ROWS;
  const r=+document.getElementById('aSpawnR').value;
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r)continue;sC(cx+dx,cy+dy,n==='void'?'void_':n);}
};
document.getElementById('aSpawn1').onclick=()=>{
  const n=document.getElementById('aElemSel').value;
  const cx=0|COLS/2,cy=0|ROWS/2;
  sC(cx,cy,n==='void'?'void_':n);
};
document.getElementById('aSpawnR').oninput=e=>document.getElementById('aSpawnRV').textContent=e.target.value;
document.getElementById('aTestReact').onclick=()=>{
  const n=document.getElementById('aElemSel').value;
  const cx=0|COLS/2,cy=0|ROWS*0.4;
  for(let i=-3;i<=3;i++)sC(cx+i,cy,n);
  sC(cx,cy+4,'fire');sC(cx,cy+5,'water');sC(cx-4,cy,'acid');
};

// Event controls
document.getElementById('aZWave').onclick=()=>{zombieMode=true;document.getElementById('zhud').style.display='block';spawnZombieWave();};
document.getElementById('aAlienInv').onclick=()=>{alienMode=true;document.getElementById('ahud').style.display='block';spawnAlienWave();};
document.getElementById('aTornado').onclick=()=>{sC(0|COLS/2,0|ROWS/3,'tornado');};
document.getElementById('aBHSpawn').onclick=()=>{sC(0|COLS/2,0|ROWS/2,'blackhole');};
document.getElementById('aMeteors').onclick=()=>doDisaster('meteor_shower');
document.getElementById('aNukeAll').onclick=()=>{for(let i=0;i<3;i++)NUKE(0|rnd()*COLS,0|rnd()*ROWS);};
document.getElementById('aDisTrig').onclick=()=>doDisaster(document.getElementById('aDisSel').value);

// Creature controls
document.getElementById('aSpawnCit').onclick=()=>{for(let i=0;i<15;i++){const x=0|rnd()*COLS,y=0|rnd()*ROWS;if(emp(x,y))sC(x,y,'citizen');}};
document.getElementById('aSpawnZom').onclick=()=>{for(let i=0;i<15;i++){const x=0|rnd()*COLS,y=0|rnd()*ROWS;if(emp(x,y))sC(x,y,'zombie');}};
document.getElementById('aKillAll').onclick=()=>{
  const creatures=[E.person,E.zombie,E.citizen,E.police,E.ant,E.fish,E.bird,E.worm,E.shark,E.whale,E.crab,E.alien,E.ufo,E.mutant,E.rat,E.snake,E.spider,E.bat,E.frog,E.wolf,E.bear];
  for(let i=0;i<ta.length;i++)if(creatures.includes(ta[i]))cC(0|(i%COLS),0|(i/COLS));
};
document.getElementById('aTogAI').onclick=function(){aiEnabled=!aiEnabled;this.textContent=aiEnabled?'🧠 Toggle AI':'🧠 AI: OFF';this.style.borderColor=aiEnabled?'':'#ff4444';};

// ── PART 3 ADMIN WIRING ──

// God Brush
let godBrushOn=false,godBrushSize=15;
const bannedElements=new Set();
document.getElementById('aGodBrushOn').onclick=()=>{godBrushOn=true;document.getElementById('aGodBrushOn').style.borderColor='#44ffaa';};
document.getElementById('aGodBrushOff').onclick=()=>{godBrushOn=false;document.getElementById('aGodBrushOn').style.borderColor='';};
document.getElementById('aGodSz').oninput=function(){godBrushSize=+this.value;document.getElementById('aGodSzV').textContent=this.value;};

// Disaster launcher
function adminDisaster(type){
  switch(type){
    case 'meteorshower':for(let i=0;i<12;i++)setTimeout(()=>{const x=0|rnd()*COLS;sC(x,0,'comet');mk(x,0);},i*120);break;
    case 'acidstorm':for(let x=0;x<COLS;x+=2)if(rnd()<.6){sC(x,0,'acid_rain');mk(x,0);}break;
    case 'zombie':for(let i=0;i<25;i++){const x=0|rnd()*COLS,y=0|rnd()*(ROWS*.4);if(emp(x,y))sC(x,y,'zombie');}break;
    case 'firetornado':for(let i=0;i<8;i++){const x=0|rnd()*COLS,y=0|rnd()*ROWS;if(emp(x,y))sC(x,y,'tornado');for(let j=-3;j<=3;j++)if(inB(x+j,y)&&emp(x+j,y))sC(x+j,y,'fire');}break;
    case 'blizzard':for(let x=0;x<COLS;x+=3)if(rnd()<.5)sC(x,0,'blizzard');break;
    case 'solarflare':for(let i=0;i<6;i++){const x=0|rnd()*COLS;for(let j=0;j<5;j++)if(inB(x+j,0))sC(x+j,0,'solar_flare');}break;
    case 'parasite':for(let i=0;i<20;i++){const x=0|rnd()*COLS,y=0|rnd()*(ROWS*.5);if(emp(x,y))sC(x,y,'parasite');}break;
    case 'emp':for(let i=0;i<4;i++){const x=0|rnd()*COLS,y=0|rnd()*ROWS;if(emp(x,y)){sC(x,y,'emp');mk(x,y);}}break;
  }
}
document.getElementById('dMeteorShower').onclick=()=>adminDisaster('meteorshower');
document.getElementById('dAcidStorm').onclick=()=>adminDisaster('acidstorm');
document.getElementById('dZombieOutbreak').onclick=()=>adminDisaster('zombie');
document.getElementById('dFireTornado').onclick=()=>adminDisaster('firetornado');
document.getElementById('dBlizzard').onclick=()=>adminDisaster('blizzard');
document.getElementById('dSolarFlare').onclick=()=>adminDisaster('solarflare');
document.getElementById('dParasiteRain').onclick=()=>adminDisaster('parasite');
document.getElementById('dEMPBurst').onclick=()=>adminDisaster('emp');

// Time control
document.getElementById('aTimeNorm').onclick=()=>{simSpeed=2;document.getElementById('aTimeSlider').value=4;document.getElementById('aTimeV').textContent='1x';};
document.getElementById('aTimeSlowmo').onclick=()=>{simSpeed=1;document.getElementById('aTimeSlider').value=2;document.getElementById('aTimeV').textContent='0.5x';};
document.getElementById('aTimeFast').onclick=()=>{simSpeed=10;document.getElementById('aTimeSlider').value=20;document.getElementById('aTimeV').textContent='5x';};
document.getElementById('aTimePause').onclick=()=>{simSpeed=0;document.getElementById('aTimeV').textContent='0x';};
document.getElementById('aTimeSlider').oninput=function(){simSpeed=Math.round(+this.value/4*10)/10;document.getElementById('aTimeV').textContent=simSpeed+'x';};

// Bulk spawn
document.getElementById('aBulkSpawn').onclick=()=>{
  const type=document.getElementById('aBulkSel').value;
  const counts={person:50,zombie:50,ant:100,fish:50,bird:50,citizen:50,bacteria:200,parasite:30};
  const n=counts[type]||50;
  for(let i=0;i<n;i++){const x=0|rnd()*COLS,y=0|rnd()*ROWS;if(emp(x,y))sC(x,y,type);}
};

// Element ban list
function renderBanList(){
  const bl=document.getElementById('aBanList');bl.innerHTML='';
  bannedElements.forEach(e=>{
    const d=document.createElement('div');d.style.cssText='display:flex;justify-content:space-between;font-size:.56rem;color:#555;padding:2px 0;';
    d.innerHTML=`<span>${e}</span><button onclick="bannedElements.delete('${e}');renderBanList()" style="background:transparent;border:none;color:#882222;cursor:pointer;font-size:.55rem;">✕</button>`;
    bl.appendChild(d);
  });
  if(!bannedElements.size)bl.innerHTML='<div style="font-size:.56rem;color:#2a2a2a;">No elements banned</div>';
}
document.getElementById('aBanAdd').onclick=()=>{const v=document.getElementById('aBanSel').value;if(v){bannedElements.add(v);renderBanList();}};
document.getElementById('aBanClear').onclick=()=>{bannedElements.clear();renderBanList();};
// Populate ban select with all elements
setTimeout(()=>{
  const bs=document.getElementById('aBanSel');
  Object.keys(E).filter(k=>k!=='empty').forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;bs.appendChild(o);});
  renderBanList();
},500);

// Override sC to check ban list
const _sC=sC;
sC=function(x,y,n,...args){if(bannedElements.has(n)&&!godBrushOn)return;_sC(x,y,n,...args);};

// God brush override in drawing
// God brush - inject into paint function via wrapper
const _origPaint=paint;
paint=function(e){
  if(godBrushOn&&adminUnlocked){
    const r=canvas.getBoundingClientRect(),sx=canvas.width/r.width,sy=canvas.height/r.height;
    const cx=0|((e.clientX-r.left)*sx/CELL),cy=0|((e.clientY-r.top)*sy/CELL);
    const rs=godBrushSize;
    for(let dx=-rs;dx<=rs;dx++)for(let dy=-rs;dy<=rs;dy++){
      if(dx*dx+dy*dy>rs*rs)continue;
      const nx=cx+dx,ny=cy+dy;if(!inB(nx,ny))continue;
      _sC(nx,ny,sel);mk(nx,ny);
    }
    return;
  }
  _origPaint(e);
};

// ── CHEAT CODES ──
const CHEATS={
  godmode:()=>{for(let i=0;i<ta.length;i++)if(ta[i])ea[i]=999;},
  bigbang:()=>{for(let i=0;i<8;i++)setTimeout(()=>explode(0|rnd()*COLS,0|rnd()*ROWS,20,3),i*100);},
  freeze:()=>{for(let i=0;i<ta.length;i++)if(ta[i]){ua[i]=stamp+999999;}},
  rainbow:()=>{const cols=['#ff4444','#ff8800','#ffff00','#44ff44','#4444ff','#ff44ff','#44ffff'];for(let i=0;i<ta.length;i++)if(ta[i])ca[i]=cols[0|Math.random()*cols.length];},
  gravity0:()=>{gravityMult=0;document.getElementById('aGrav').value=0;document.getElementById('aGravV').textContent='0.0';},
  supernova:()=>{const cx=0|COLS/2,cy=0|ROWS/2;sC(cx,cy,'sun');setTimeout(()=>{explode(cx,cy,25,3);for(let i=0;i<20;i++)setTimeout(()=>{const a=rnd()*Math.PI*2,r=5+rnd()*15;const sx=0|(cx+Math.cos(a)*r),sy=0|(cy+Math.sin(a)*r);if(inB(sx,sy))sC(sx,sy,'solar_flare');},i*80);},800);},
  omariscool:()=>{adminUnlocked=true;document.getElementById('adminPanel').classList.add('open');},
};
let cheatBuffer='';
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  cheatBuffer=(cheatBuffer+e.key).slice(-14);
  const found=Object.keys(CHEATS).find(c=>cheatBuffer.endsWith(c));
  if(found){CHEATS[found]();cheatBuffer='';const n=document.createElement('div');n.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0a0a10;border:1px solid #a855f7;color:#a855f7;padding:10px 22px;font-family:"Syne",sans-serif;font-size:.8rem;z-index:9999;pointer-events:none;border-radius:3px;';n.textContent='🔑 '+found;document.body.appendChild(n);setTimeout(()=>n.remove(),1800);}
});

// Secret elements
document.querySelectorAll('[data-secret]').forEach(b=>b.onclick=()=>{
  sel=b.dataset.secret;
  document.querySelectorAll('.eb').forEach(x=>x.classList.remove('sel'));
  document.getElementById('sSel').textContent=sel;
  document.getElementById('adminPanel').classList.remove('open');
});

// Debug tick
function adminDebugTick(){
  if(!adminUnlocked)return;
  let p=0;for(let i=0;i<ta.length;i++)if(ta[i])p++;
  document.getElementById('aDebugStats').innerHTML=
    `<div>Particles: <span style="color:var(--acc)">${p.toLocaleString()}</span></div>`+
    `<div>Grid: <span style="color:var(--acc)">${COLS}×${ROWS}</span></div>`+
    `<div>FPS: <span style="color:var(--acc)">${fps}</span></div>`+
    `<div>Stamp: <span style="color:var(--acc)">${stamp}</span></div>`+
    `<div>Radiation: <span style="color:var(--acc)">${Math.round(gRad)}%</span></div>`+
    `<div>AI: <span style="color:${aiEnabled?'var(--grn)':'var(--red)'}">${aiEnabled?'ON':'OFF'}</span></div>`+
    `<div>Gravity: <span style="color:var(--acc)">${gravityMult.toFixed(1)}x</span></div>`;
  setTimeout(adminDebugTick,500);
}
