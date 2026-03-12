/**
 * PARTICLE WORLD v2.0 — js/multiplayer.js
 * Real-time Firebase multiplayer.
 * Extracted from v1.2.3 and fixed:
 *   - Uses compat Firebase SDK (no modular import issues)
 *   - mpHookDraw uses CELL from core.js
 *   - World serialize/deserialize works with new grid object format
 *   - Proper cleanup on disconnect
 */

// ── BRIDGE: map old helpers → new PW grid API ────────────────────
function _mpInB(x,y){ return window.PW?PW.Grid.inBounds(x,y):(x>=0&&y>=0&&x<(window.COLS||300)&&y<(window.ROWS||200)); }
function _mpSC(x,y,t){ if(window.PW)PW.Grid.setCell(x,y,t); else if(window.sC)sC(x,y,t); }
function _mpCC(x,y){ if(window.PW)PW.Grid.clearCell(x,y); else if(window.cC)cC(x,y); }
function _mpMK(x,y){ if(window.PW)PW.Grid.markUpdated?.(x,y); else if(window.mk)mk(x,y); }
function _mpSerializeWorld(){
  if(window.PW){
    const cells=[],g=PW.Grid;
    for(let y=0;y<g.rows;y++) for(let x=0;x<g.cols;x++){
      const c=g.getCell(x,y);
      if(c&&c.type&&c.type!=='empty') cells.push([y*g.cols+x,c.type,c.color||'']);
    }
    return cells;
  }
  const cells=[];
  for(let i=0;i<(window.ta||[]).length;i++) if(ta[i]) cells.push([i,ta[i],ca[i]]);
  return cells;
}
function _mpDeserializeWorld(cells){
  if(window.PW){
    PW.Grid.clear();
    const g=PW.Grid;
    (cells||[]).forEach(([i,t])=>{const x=i%g.cols,y=Math.floor(i/g.cols);if(g.inBounds(x,y))g.setCell(x,y,t);});
    return;
  }
  if(window.ta){ta.fill(0);ca.fill('#040404');_mpDeserializeWorld(cells||[]);}
}
function _mpCELL(){ return window.PW?PW.Grid._cellSize:(window.CELL||3); }
function _mpSel(){ return window.PW?PW.Input.selected:(window.sel||'sand'); }
function _mpBsz(){ return window.PW?PW.Input.brushSize:(window.bsz||3); }

// ── MULTIPLAYER GLOBALS ──────────────────────────────────────────
let mpConnected=false,mpRoomCode='',mpMyId='',mpIsHost=false,mpMyColor='#4ac8ff';
let mpPlayers={};
let _mpRefs=[];
let mpCursorCanvas=null,mpCursorCtx=null,mpCursorAnimId=null;

const MP_COLORS=['#4ac8ff','#ff6644','#44ff88','#ffcc44','#ff44ff','#88ffcc','#ff88aa','#aaccff'];

function mpUID(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function mpRand4(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from({length:4},()=>c[Math.random()*c.length|0]).join('');}

// ══════════════════════════════════════════
//  PARTICLE WORLD — MULTIPLAYER (Firebase)
// ══════════════════════════════════════════
import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import{getDatabase,ref,set,get,onValue,onChildAdded,push,remove,onDisconnect,off,query,limitToLast,orderByChild}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

// ── Firebase config ──
const FB_CFG={
  apiKey:"AIzaSyBnVtCaMHdousMGFEfDGi57SVf5KrkTF4A",
  authDomain:"particle-world.firebaseapp.com",
  databaseURL:"https://particle-world-default-rtdb.firebaseio.com",
  projectId:"particle-world",
  storageBucket:"particle-world.firebasestorage.app",
  messagingSenderId:"5494928895",
  appId:"1:5494928895:web:adcedb5bedf79fa461a3ca",
};

let fbApp=null,fbDb=null,fbReady=false;

// ── DOMAIN LOCK + VISITOR LOG ──────────────────────────────────────
(function(){
  const _ok=['omelette180.github.io/Particle-World','localhost','127.0.0.1'];
  const _h=location.hostname;
  const _allowed=_ok.some(d=>(location.hostname+location.pathname).includes(d)||location.hostname===d);
  // Log visit to Firebase regardless (so owner can see stolen hosts)
  function _logVisit(db,r,s){
    try{
      const _vref=r(db,'visits/'+Date.now()+'_'+Math.random().toString(36).slice(2,7));
      s(_vref,{host:_h,href:location.href,ua:navigator.userAgent.slice(0,120),ts:Date.now(),stolen:!_allowed});
    }catch(e){}
  }
  window._pwLogVisit=_logVisit;
  window._pwAllowed=_allowed;
  if(!_allowed){
    // Nuke the canvas and show theft warning
    document.addEventListener('DOMContentLoaded',()=>{
      document.body.innerHTML=`<div style="position:fixed;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;color:#ff4444;text-align:center;padding:2rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
        <div style="font-size:1.1rem;font-weight:bold;margin-bottom:.5rem;">Unauthorized Copy Detected</div>
        <div style="font-size:.75rem;color:#666;margin-bottom:1.5rem;">This game is only licensed to run on its official domain.</div>
        <a href="https://particle-world.netlify.app" style="color:#a855f7;font-size:.8rem;">Play the real Particle World →</a>
      </div>`;
    });
  }
})();

function fbInit(){
  if(fbReady)return;
  try{fbApp=initializeApp(FB_CFG);fbDb=getDatabase(fbApp);window._fbDb=fbDb;fbReady=true;
    window._fbReady=true;
    window._fbImports={ref,set,get,onValue,onChildAdded,push,remove,query,limitToLast,orderByChild};
    // Log visitor (stolen or legit)
    if(window._pwLogVisit)window._pwLogVisit(fbDb,ref,set);
  }
  catch(e){console.warn('Firebase init failed:',e);mpSetStatus('✗ Firebase not configured — see console','#ff4444');}
}

const MP_COLORS=['#4ac8ff','#ff6eb4','#5dffa0','#ffe94a','#ff9f3f','#c77dff'];
let mpRoomCode='',mpMyId='',mpMyColor='',mpIsHost=false;
let mpConnected=false,mpPlayers={};
let _mpRefs=[];
let mpCursorCanvas=null,mpCursorCtx=null,mpCursorAnimId=null;

function mpRand4(){return Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[0|Math.random()*32]).join('');}
function mpUID(){return Math.random().toString(36).slice(2,10);}

// ── Cursor overlay — fixed position over entire viewport ──
function mpInitCursors(){
  if(mpCursorCanvas){mpCursorAnimId&&cancelAnimationFrame(mpCursorAnimId);mpCursorCanvas.remove();}
  mpCursorCanvas=document.createElement('canvas');
  mpCursorCanvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9000;';
  mpCursorCanvas.width=window.innerWidth;
  mpCursorCanvas.height=window.innerHeight;
  document.body.appendChild(mpCursorCanvas);
  mpCursorCtx=mpCursorCanvas.getContext('2d');
  function loop(){
    mpCursorAnimId=requestAnimationFrame(loop);
    if(!mpCursorCtx)return;
    mpCursorCtx.clearRect(0,0,mpCursorCanvas.width,mpCursorCanvas.height);
    Object.values(mpPlayers).forEach(p=>{
      if(p.id===mpMyId||p.cx==null)return;
      // Draw cursor dot
      mpCursorCtx.beginPath();mpCursorCtx.arc(p.cx,p.cy,6,0,Math.PI*2);
      mpCursorCtx.fillStyle=p.color+'cc';mpCursorCtx.fill();
      mpCursorCtx.strokeStyle='#000';mpCursorCtx.lineWidth=1.5;mpCursorCtx.stroke();
      // Name tag
      const name=p.name||p.id.slice(0,6);
      mpCursorCtx.font='bold 11px DM Mono,monospace';
      const tw=mpCursorCtx.measureText(name).width;
      mpCursorCtx.fillStyle='rgba(0,0,0,.7)';
      mpCursorCtx.fillRect(p.cx+10,p.cy-16,tw+8,16);
      mpCursorCtx.fillStyle=p.color;
      mpCursorCtx.fillText(name,p.cx+14,p.cy-4);
    });
  }
  loop();
  window.addEventListener('resize',()=>{
    if(!mpCursorCanvas)return;
    mpCursorCanvas.width=window.innerWidth;mpCursorCanvas.height=window.innerHeight;
  });
}

// Track our own cursor in screen coordinates
function mpTrackMouse(e){
  if(!mpPlayers[mpMyId])return;
  mpPlayers[mpMyId].cx=e.clientX;
  mpPlayers[mpMyId].cy=e.clientY;
  // Also track canvas cell position for draw sync
  const gc2=document.getElementById('gc');
  const r=gc2.getBoundingClientRect();
  mpPlayers[mpMyId].x=0|((e.clientX-r.left)*(gc2.width/r.width)/_mpCELL());
  mpPlayers[mpMyId].y=0|((e.clientY-r.top)*(gc2.height/r.height)/_mpCELL());
}

// ── Host ──
async function mpHost(){
  fbInit();if(!fbReady){mpSetStatus('✗ Firebase not configured','#ff4444');return;}
  mpRoomCode=mpRand4();mpMyId=mpUID();mpMyColor=MP_COLORS[0];mpIsHost=true;
  mpSetStatus('Creating room...','#ffe94a');
  const snap=await get(ref(fbDb,'rooms/'+mpRoomCode));
  if(snap.exists())mpRoomCode=mpRand4();
  const meRef=ref(fbDb,`rooms/${mpRoomCode}/players/${mpMyId}`);
  await set(meRef,{id:mpMyId,color:mpMyColor,name:'Host',cx:null,cy:null});
  onDisconnect(meRef).remove();
  const hostRef=ref(fbDb,`rooms/${mpRoomCode}/host`);
  await set(hostRef,mpMyId);
  onDisconnect(hostRef).remove();
  mpPlayers[mpMyId]={id:mpMyId,color:mpMyColor,name:'Host'};
  mpConnected=true;
  mpShowConnected();mpInitCursors();mpWatchRoom();mpHookDraw();mpStartCursorBroadcast();
  mpSetStatus(`● Hosting — Room: ${mpRoomCode}`,'#5dffa0');
  mpUpdatePlayerList();
}

// ── Join ──
async function mpJoin(code){
  fbInit();if(!fbReady){mpSetStatus('✗ Firebase not configured','#ff4444');return;}
  code=code.trim().toUpperCase();
  if(code.length!==4){document.getElementById('mpJoinErr').textContent='Enter a 4-letter code.';return;}
  document.getElementById('mpJoinErr').textContent='';
  mpSetStatus('Connecting to '+code+'...','#ffe94a');
  const snap=await get(ref(fbDb,'rooms/'+code+'/host'));
  if(!snap.exists()){document.getElementById('mpJoinErr').textContent='Room not found or host left.';mpSetStatus('✗ Room not found','#ff4444');return;}
  mpRoomCode=code;mpMyId=mpUID();mpIsHost=false;
  const pSnap=await get(ref(fbDb,'rooms/'+code+'/players'));
  const usedColors=pSnap.exists()?Object.values(pSnap.val()).map(p=>p.color):[];
  mpMyColor=MP_COLORS.find(c=>!usedColors.includes(c))||MP_COLORS[Object.keys(pSnap.val()||{}).length%MP_COLORS.length];
  const idx=Object.keys(pSnap.val()||{}).length+1;
  const meRef=ref(fbDb,`rooms/${mpRoomCode}/players/${mpMyId}`);
  await set(meRef,{id:mpMyId,color:mpMyColor,name:'P'+idx,cx:null,cy:null});
  onDisconnect(meRef).remove();
  const wSnap=await get(ref(fbDb,'rooms/'+mpRoomCode+'/world'));
  if(wSnap.exists())mpDeserializeWorld(wSnap.val());
  mpPlayers[mpMyId]={id:mpMyId,color:mpMyColor,name:'P'+idx};
  mpConnected=true;
  mpShowConnected();mpInitCursors();mpWatchRoom();mpHookDraw();mpStartCursorBroadcast();
  mpSetStatus(`● In room ${mpRoomCode}`,'#5dffa0');
  mpUpdatePlayerList();
}

// ── Watch room ──
function mpWatchRoom(){
  const playersRef=ref(fbDb,'rooms/'+mpRoomCode+'/players');
  onValue(playersRef,snap=>{
    const data=snap.val()||{};
    // Merge new player data — keep local cx/cy for our own cursor
    Object.values(data).forEach(p=>{
      if(!mpPlayers[p.id])mpPlayers[p.id]={};
      // For other players update cx/cy from Firebase; for ourselves keep local
      if(p.id!==mpMyId){Object.assign(mpPlayers[p.id],p);}
      else{mpPlayers[p.id].id=p.id;mpPlayers[p.id].color=p.color;mpPlayers[p.id].name=p.name;}
    });
    Object.keys(mpPlayers).forEach(id=>{if(!data[id])delete mpPlayers[id];});
    mpUpdatePlayerList();
    const count=Object.keys(mpPlayers).length;
    mpSetStatus(mpIsHost?`● Hosting — ${count} player${count!==1?'s':''}`:`● Room ${mpRoomCode} — ${count} player${count!==1?'s':''}`,'#5dffa0');
  });
  _mpRefs.push(()=>off(playersRef));

  // Draw events
  const drawRef=ref(fbDb,'rooms/'+mpRoomCode+'/draws');
  let _skipOld=true;setTimeout(()=>_skipOld=false,1500);
  onChildAdded(drawRef,snap=>{
    if(_skipOld)return;
    const d=snap.val();if(!d||d.by===mpMyId)return;
    d.events.forEach(ev=>{
      if(!_mpInB(ev.x,ev.y))return;
      if(ev.e==='eraser')_mpCC(ev.x,ev.y);else _mpSC(ev.x,ev.y,ev.e);_mpMK(ev.x,ev.y);
    });
    if(mpIsHost)remove(snap.ref);
  });
  _mpRefs.push(()=>off(drawRef));

  // Host disconnect
  const hostRef=ref(fbDb,'rooms/'+mpRoomCode+'/host');
  onValue(hostRef,snap=>{if(!snap.exists()&&!mpIsHost&&mpConnected){mpSetStatus('Host left','#ff4444');mpDisconnect();}});
  _mpRefs.push(()=>off(hostRef));
}

// ── Draw sync ──
let _mpPendingEvents=[],_mpDrawTimer=null;
function mpQueueDraw(events){
  _mpPendingEvents.push(...events);
  if(!_mpDrawTimer)_mpDrawTimer=setTimeout(()=>{
    _mpDrawTimer=null;
    if(!mpConnected||!_mpPendingEvents.length)return;
    const ev=[..._mpPendingEvents];_mpPendingEvents=[];
    push(ref(fbDb,'rooms/'+mpRoomCode+'/draws'),{by:mpMyId,events:ev,t:Date.now()});
    if(mpIsHost&&Math.random()<.04)mpSaveWorld();
  },50);
}
function mpSaveWorld(){
  const cells=_mpSerializeWorld();
  set(ref(fbDb,'rooms/'+mpRoomCode+'/world'),cells);
}

// ── Cursor broadcast ──
let _mpCursorTimer=null;
function mpStartCursorBroadcast(){
  document.addEventListener('mousemove',mpTrackMouse);
  _mpCursorTimer=setInterval(()=>{
    if(!mpConnected)return;
    const me=mpPlayers[mpMyId];if(!me||me.cx==null)return;
    set(ref(fbDb,`rooms/${mpRoomCode}/players/${mpMyId}/cx`),me.cx);
    set(ref(fbDb,`rooms/${mpRoomCode}/players/${mpMyId}/cy`),me.cy);
  },80);
}

// ── Hook draw ──
let mpDrawHooked=false,_mpLastPos={x:-1,y:-1};
function mpHookDraw(){
  if(mpDrawHooked)return;mpDrawHooked=true;
  const gc2=document.getElementById('gc');
  function onDraw(e){
    if(!mpConnected||!e.buttons)return;
    const r=gc2.getBoundingClientRect();
    const cx=0|((e.clientX-r.left)*(gc2.width/r.width)/_mpCELL());
    const cy=0|((e.clientY-r.top)*(gc2.height/r.height)/_mpCELL());
    if(cx===_mpLastPos.x&&cy===_mpLastPos.y&&e.type!=='mousedown')return;
    _mpLastPos={x:cx,y:cy};
    const elem=e.buttons===2?'eraser':_mpSel();
    const h2=0|_mpBsz()/2,events=[];
    for(let dy=-h2;dy<=h2;dy++)for(let dx=-h2;dx<=h2;dx++){
      if(dx*dx+dy*dy>h2*h2+h2+1)continue;
      const bx=cx+dx,by=cy+dy;if(!_mpInB(bx,by))continue;
      events.push({x:bx,y:by,e:elem});
    }
    if(events.length)mpQueueDraw(events);
  }
  gc2.addEventListener('mousemove',onDraw);
  gc2.addEventListener('mousedown',onDraw);
}

// ── World sync ──
function mpDeserializeWorld(cells){
  _mpDeserializeWorld(cells||[]);
}

// ── Disconnect ──
async function mpDisconnect(){
  mpConnected=false;
  _mpRefs.forEach(fn=>fn());_mpRefs=[];
  if(_mpCursorTimer){clearInterval(_mpCursorTimer);_mpCursorTimer=null;}
  if(mpCursorAnimId){cancelAnimationFrame(mpCursorAnimId);mpCursorAnimId=null;}
  document.removeEventListener('mousemove',mpTrackMouse);
  if(mpCursorCanvas){mpCursorCanvas.remove();mpCursorCanvas=null;mpCursorCtx=null;}
  if(mpIsHost){try{await remove(ref(fbDb,'rooms/'+mpRoomCode));}catch(e){}}
  else{try{await remove(ref(fbDb,`rooms/${mpRoomCode}/players/${mpMyId}`));}catch(e){}}
  mpPlayers={};mpDrawHooked=false;_mpLastPos={x:-1,y:-1};
  mpRoomCode='';mpMyId='';mpIsHost=false;
  document.getElementById('mpSetup').style.display='block';
  document.getElementById('mpConnected').style.display='none';
  document.getElementById('bMulti').style.color='#4ac8ff';
  document.getElementById('bMulti').textContent='🌐 MULTI';
  mpSetStatus('● Not connected','#333');
}

// ── UI ──
function mpSetStatus(msg,col='#555'){const el=document.getElementById('mpStatus');if(el){el.textContent=msg;el.style.color=col;}}
function mpShowConnected(){
  document.getElementById('mpSetup').style.display='none';
  document.getElementById('mpConnected').style.display='block';
  document.getElementById('mpRoomDisplay').textContent=mpRoomCode;
  document.getElementById('bMulti').style.color=mpMyColor;
  document.getElementById('bMulti').textContent='🌐 '+mpRoomCode;
}
function mpUpdatePlayerList(){
  const el=document.getElementById('mpPlayerList');if(!el)return;el.innerHTML='';
  Object.values(mpPlayers).forEach(p=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:8px;font-family:"DM Mono",monospace;font-size:.62rem;margin-bottom:5px;';
    row.innerHTML=`<div style="width:9px;height:9px;border-radius:50%;background:${p.color};flex-shrink:0;box-shadow:0 0 5px ${p.color};"></div><span style="color:#888;">${p.name||p.id.slice(0,8)}${p.id===mpMyId?' <span style="color:#444;">(you)</span>':''}</span>`;
    el.appendChild(row);
  });
}
function mpCopyCode(){
  navigator.clipboard?.writeText(mpRoomCode).catch(()=>{});
  const btn=event.target;btn.textContent='copied!';setTimeout(()=>btn.textContent='copy',1500);
}

// ── Wire buttons ──
document.getElementById('bMulti').onclick=()=>document.getElementById('panMulti').classList.add('open');
document.getElementById('mpHostBtn').onclick=()=>mpHost();
document.getElementById('mpJoinBtn').onclick=()=>mpJoin(document.getElementById('mpJoinCode').value);
document.getElementById('mpJoinCode').addEventListener('keydown',e=>{if(e.key==='Enter')mpJoin(e.target.value);});
document.getElementById('mpLeaveBtn').onclick=()=>mpDisconnect();
document.getElementById('mpJoinCode').oninput=function(){this.value=this.value.toUpperCase();};
window.mpCopyCode=mpCopyCode;



// ── INIT ─────────────────────────────────────────────────────────
// Wire up buttons once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bMulti').onclick=()=>document.getElementById('panMulti').classList.add('open');
  document.getElementById('mpHostBtn').onclick=()=>mpHost();
  document.getElementById('mpJoinBtn').onclick=()=>mpJoin(document.getElementById('mpJoinCode').value);
  document.getElementById('mpJoinCode').addEventListener('keydown',e=>{if(e.key==='Enter')mpJoin(e.target.value);});
  document.getElementById('mpLeaveBtn').onclick=()=>mpDisconnect();
  document.getElementById('mpJoinCode').oninput=function(){this.value=this.value.toUpperCase();};
  window.mpCopyCode=mpCopyCode;
});
