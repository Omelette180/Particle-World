/**
 * PARTICLE WORLD v2.0 — js/account.js
 * Extracted from v1.2.3. Full account system preserved.
 */

// ══════════════════════════════════════════
//  USER ACCOUNT SYSTEM  v1.0
// ══════════════════════════════════════════
const GAME_VERSION='1.2.3';
let currentUser=null;
function acctKey(user,key){return`pw_${user}_${key}`;}
function acctSave(key,val){if(currentUser)localStorage.setItem(acctKey(currentUser,key),JSON.stringify(val));}
function acctLoad(key,def=null){if(!currentUser)return def;try{const v=localStorage.getItem(acctKey(currentUser,key));return v!==null?JSON.parse(v):def;}catch(e){return def;}}
function allUsers(){try{return JSON.parse(localStorage.getItem('pw_users')||'{}');}catch(e){return{};}}
function saveUsers(u){localStorage.setItem('pw_users',JSON.stringify(u));}

function acctRegister(){
  const user=document.getElementById('acctUser').value.trim();const pass=document.getElementById('acctPass').value;
  const msg=document.getElementById('acctMsg');
  if(!user||user.length<2){msg.textContent='Username must be 2+ characters.';return;}
  if(!pass||pass.length<4){msg.textContent='Password must be 4+ characters.';return;}
  const users=allUsers();if(users[user]){msg.textContent='Username taken.';return;}
  const hash=btoa(pass+user+'pw_salt_v1').slice(0,24);
  users[user]={hash,created:Date.now()};saveUsers(users);
  msg.style.color='#44ffaa';msg.textContent='Account created!';setTimeout(()=>loginUser(user),500);
}
function acctLoginAction(){
  const user=document.getElementById('acctUser').value.trim();const pass=document.getElementById('acctPass').value;
  const msg=document.getElementById('acctMsg');const users=allUsers();
  if(!users[user]){msg.textContent='Account not found.';return;}
  const hash=btoa(pass+user+'pw_salt_v1').slice(0,24);
  if(users[user].hash!==hash){msg.textContent='Wrong password.';return;}
  loginUser(user);
}
function loginUser(user){
  currentUser=user;localStorage.setItem('pw_lastUser',user);
  document.getElementById('acctLoggedOut').style.display='none';
  document.getElementById('acctLoggedIn').style.display='block';
  const nameEl=document.getElementById('acctName');
  nameEl.textContent=user;
  if(user==='PW_dev'){
    nameEl.style.cssText='background:linear-gradient(90deg,#ffd700,#ffaa00,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:"Syne",sans-serif;font-weight:700;font-size:.85rem;';
    nameEl.textContent='👑 PW_dev';
    // Auto-unlock admin for PW_dev
    adminUnlocked=true;
    document.getElementById('adminToggleBtn').classList.add('show');
    document.getElementById('adminToggleBtn').style.cssText+='color:#ffd700;border-color:#ffd70044;text-shadow:0 0 8px #ffd700;';
    // Unlock all achievements
    setTimeout(()=>{
      ACHIEVEMENTS.forEach(a=>achUnlocked.add(a.id));
      renderAchList&&renderAchList();
      refreshAcctUI&&refreshAcctUI();
    },500);
  }
  const saved=acctLoad('gamedata',null);
  if(saved){
    if(saved.score){score=saved.score;document.getElementById('scoreDisp').textContent='⭐ '+score.toLocaleString();document.getElementById('achScoreTotal').textContent=score.toLocaleString();}
    if(saved.achievements){saved.achievements.forEach(id=>achUnlocked.add(id));renderAchList();}
  }
  const settings=acctLoad('settings',null);
  if(settings){simSpeed=settings.simSpeed||simSpeed;glowOn=settings.glowOn!==undefined?settings.glowOn:glowOn;shakeOn=settings.shakeOn!==undefined?settings.shakeOn:shakeOn;}
  refreshAcctUI();document.getElementById('acctMsg').style.color='#44ffaa';document.getElementById('acctMsg').textContent='✦ Signed in!';
  setTimeout(()=>window._banCheckUser&&window._banCheckUser(user),800);
}
function refreshAcctUI(){
  if(!currentUser)return;
  document.getElementById('acctScore').textContent=score.toLocaleString();
  document.getElementById('acctAchCount').textContent=achUnlocked.size;
  const saves=acctLoad('worldsaves',[]);
  document.getElementById('acctSaveCount').textContent=saves.length;
  const sl=document.getElementById('acctSaveList');sl.innerHTML='';
  saves.forEach((s,i)=>{
    const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #0a0a0a;';
    row.innerHTML=`<div style="flex:1;font-size:.6rem;color:#555;">${s.name||'World '+i}</div><div style="font-size:.52rem;color:#2a2a2a;">${new Date(s.ts).toLocaleDateString()}</div><button style="font-size:.52rem;padding:2px 7px;border:1px solid #1a1a1a;background:transparent;color:#444;cursor:pointer;border-radius:2px;" onclick="loadAccountSave(${i})">Load</button><button style="font-size:.52rem;padding:2px 7px;border:1px solid #1a1a1a;background:transparent;color:#333;cursor:pointer;border-radius:2px;" onclick="deleteAccountSave(${i})">✕</button>`;
    sl.appendChild(row);
  });
}
function saveEverything(){
  if(!currentUser){document.getElementById('acctSaveMsg').textContent='Sign in first!';document.getElementById('acctSaveMsg').style.color='#ff4444';return;}
  acctSave('gamedata',{score,achievements:[...achUnlocked],version:GAME_VERSION});
  acctSave('settings',{simSpeed,glowOn,shakeOn});
  const worldData=[];for(let i=0;i<ta.length;i++)if(ta[i])worldData.push([i,ta[i],ca[i],Math.round(ea[i]),Math.round(ha[i])]);
  const saves=acctLoad('worldsaves',[]);
  const name=prompt('Name this save:','World '+(saves.length+1))||'World '+(saves.length+1);
  saves.push({name,ts:Date.now(),world:worldData,cols:COLS,rows:ROWS});
  if(saves.length>10)saves.shift();
  acctSave('worldsaves',saves);
  refreshAcctUI();
  const m=document.getElementById('acctSaveMsg');m.style.color='#44ffaa';m.textContent='✦ Everything saved!';setTimeout(()=>m.textContent='',2500);
}
function loadAccountSave(idx){
  const saves=acctLoad('worldsaves',[]);const s=saves[idx];if(!s)return;
  ta.fill(0);ca.fill('#040404');ea.fill(0);da.fill(0);ha.fill(0);
  s.world.forEach(([i,t,c,e,h])=>{if(s.cols===COLS&&s.rows===ROWS){ta[i]=t;ca[i]=c;ea[i]=e;ha[i]=h;}else{const x=i%s.cols,y=0|i/s.cols;if(x<COLS&&y<ROWS){const ni=id(x,y);ta[ni]=t;ca[ni]=c;ea[ni]=e;ha[ni]=h;}}});
  document.getElementById('panAccount').classList.remove('open');
}
function deleteAccountSave(idx){const saves=acctLoad('worldsaves',[]);saves.splice(idx,1);acctSave('worldsaves',saves);refreshAcctUI();}
function acctSignOut(){currentUser=null;localStorage.removeItem('pw_lastUser');document.getElementById('acctLoggedOut').style.display='block';document.getElementById('acctLoggedIn').style.display='none';}

setTimeout(()=>{const last=localStorage.getItem('pw_lastUser');if(last&&allUsers()[last])loginUser(last);},900);
document.getElementById('acctRegister').onclick=acctRegister;
document.getElementById('acctLogin').onclick=acctLoginAction;
document.getElementById('acctSignOut').onclick=acctSignOut;
document.getElementById('acctSaveAll').onclick=saveEverything;
document.getElementById('acctLoadAll').onclick=refreshAcctUI;
document.getElementById('bAcct').onclick=()=>{refreshAcctUI();document.getElementById('panAccount').classList.add('open');};
document.getElementById('mAccount').onclick=()=>document.getElementById('panAccount').classList.add('open');
