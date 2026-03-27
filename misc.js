// ── OTMANE EASTER EGG ──
function openOtmanePicker(){document.getElementById('otmanePicker').classList.add('open');}
function closeOtmanePicker(){document.getElementById('otmanePicker').classList.remove('open');}

// Admin login via Otmane star
function showOtmaneAdminLogin(){
  closeOtmanePicker();
  // Create inline login modal
  let modal=document.getElementById('otmaneAdminModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='otmaneAdminModal';
    modal.style.cssText='position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML=`
      <div style="background:#0a0a12;border:3px solid #ff4444;box-shadow:0 0 0 6px #0a0a12,0 0 0 9px #ff4444,0 0 32px #ff444455;padding:24px 28px;max-width:300px;width:90%;font-family:'DM Mono',monospace;text-align:center;">
        <div style="font-size:.9rem;color:#ff6666;letter-spacing:.15em;margin-bottom:6px;">⚙ ADMIN ACCESS</div>
        <div style="font-size:.55rem;color:#333;margin-bottom:16px;letter-spacing:.08em;">// enter access code</div>
        <input id="otmAdminInput" type="password" style="width:100%;background:#050508;border:1px solid #ff444433;color:#ff8888;font-family:'DM Mono',monospace;font-size:.8rem;padding:8px 12px;text-align:center;letter-spacing:.2em;outline:none;margin-bottom:8px;" placeholder="••••••••••" maxlength="20"/>
        <div id="otmAdminErr" style="font-size:.55rem;color:#ff4444;min-height:1em;margin-bottom:8px;"></div>
        <div style="display:flex;gap:8px;">
          <button onclick="document.getElementById('otmaneAdminModal').style.display='none'" style="flex:1;padding:8px;background:transparent;border:1px solid #1a1a2a;color:#444;font-family:'DM Mono',monospace;font-size:.6rem;cursor:pointer;">cancel</button>
          <button onclick="otmAdminSubmit()" style="flex:1;padding:8px;background:#1a0505;border:1px solid #ff4444;color:#ff6666;font-family:'DM Mono',monospace;font-size:.6rem;cursor:pointer;letter-spacing:.08em;">[ ACCESS ]</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('otmAdminInput').addEventListener('keydown',e=>{if(e.key==='Enter')otmAdminSubmit();});
  }
  modal.style.display='flex';
  setTimeout(()=>document.getElementById('otmAdminInput').focus(),100);
}

function otmAdminSubmit(){
  const val=document.getElementById('otmAdminInput').value;
  const err=document.getElementById('otmAdminErr');
  if(val===ADMIN_CODE){
    adminUnlocked=true;
    document.getElementById('otmaneAdminModal').style.display='none';
    document.getElementById('adminPanel').classList.add('open');
    unlockAch('admin_unlocked');
    try{sndPlay('portal');}catch(e){}
  } else {
    err.textContent='// access denied';
    document.getElementById('otmAdminInput').value='';
    document.getElementById('otmAdminInput').style.borderColor='#ff0000';
    setTimeout(()=>{if(document.getElementById('otmAdminInput'))document.getElementById('otmAdminInput').style.borderColor='#ff444433';},800);
  }
}

function showOtmaneRock(){
  closeOtmanePicker();
  document.getElementById('otmaneRock').classList.add('open');
  drawPixelRock();
}
function closeOtmaneRock(){document.getElementById('otmaneRock').classList.remove('open');}
function showOtmaneJob(){
  closeOtmanePicker();
  document.getElementById('otmaneJob').classList.add('open');
  document.getElementById('jobPxForm').style.display='block';
  document.getElementById('jobPxSuccess').style.display='none';
}
function closeOtmaneJob(){document.getElementById('otmaneJob').classList.remove('open');}
function submitOtmaneJob(){
  document.getElementById('jobPxForm').style.display='none';
  document.getElementById('jobPxSuccess').style.display='block';
}

// PIXEL ROCK ART
function drawPixelRock(){
  const c=document.getElementById('rockCanvas');
  const ctx=c.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const S=4; // pixel size
  ctx.clearRect(0,0,c.width,c.height);

  // Rock shape — pixel art
  const rock=[
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
  ];
  const ox=8,oy=8;
  const cols=['#aaaaaa','#999999','#bbbbbb','#888888'];
  rock.forEach((row,ry)=>row.forEach((v,rx)=>{
    if(!v)return;
    ctx.fillStyle=cols[(rx+ry)%cols.length];
    ctx.fillRect(ox+rx*S,oy+ry*S,S,S);
  }));

  // Shading
  ctx.fillStyle='rgba(0,0,0,0.18)';
  for(let ry=0;ry<rock.length;ry++)for(let rx=0;rx<rock[0].length;rx++){
    if(rock[ry][rx]&&(rx>7||ry>6))ctx.fillRect(ox+rx*S,oy+ry*S,S,S);
  }

  // Roblox face — eyes (white squares with black pupils)
  const faceOx=ox+3*S,faceOy=oy+2*S;
  // Left eye white
  ctx.fillStyle='#ffffff';ctx.fillRect(faceOx+1*S,faceOy+1*S,2*S,2*S);
  // Right eye white
  ctx.fillStyle='#ffffff';ctx.fillRect(faceOx+5*S,faceOy+1*S,2*S,2*S);
  // Left pupil
  ctx.fillStyle='#1a1a1a';ctx.fillRect(faceOx+1*S+2,faceOy+1*S+2,S,S+2);
  // Right pupil
  ctx.fillStyle='#1a1a1a';ctx.fillRect(faceOx+5*S+2,faceOy+1*S+2,S,S+2);
  // Mouth — straight line (classic roblox)
  ctx.fillStyle='#1a1a1a';
  for(let i=1;i<=6;i++)ctx.fillRect(faceOx+i*S,faceOy+4*S,S,2);

  // Animate floating
  let t=0;
  function animRock(){
    if(!document.getElementById('otmaneRock').classList.contains('open'))return;
    requestAnimationFrame(animRock);
    ctx.clearRect(0,0,c.width,c.height);
    t+=0.04;
    const yOff=Math.sin(t)*5|0;
    ctx.save();ctx.translate(0,yOff);

    rock.forEach((row,ry)=>row.forEach((v,rx)=>{
      if(!v)return;
      ctx.fillStyle=cols[(rx+ry)%cols.length];ctx.fillRect(ox+rx*S,oy+ry*S,S,S);
    }));
    ctx.fillStyle='rgba(0,0,0,0.18)';
    for(let ry=0;ry<rock.length;ry++)for(let rx=0;rx<rock[0].length;rx++){
      if(rock[ry][rx]&&(rx>7||ry>6))ctx.fillRect(ox+rx*S,oy+ry*S,S,S);
    }
    ctx.fillStyle='#ffffff';ctx.fillRect(faceOx+1*S,faceOy+1*S,2*S,2*S);
    ctx.fillStyle='#ffffff';ctx.fillRect(faceOx+5*S,faceOy+1*S,2*S,2*S);
    ctx.fillStyle='#1a1a1a';ctx.fillRect(faceOx+1*S+2,faceOy+1*S+2,S,S+2);
    ctx.fillStyle='#1a1a1a';ctx.fillRect(faceOx+5*S+2,faceOy+1*S+2,S,S+2);
    ctx.fillStyle='#1a1a1a';
    for(let i=1;i<=6;i++)ctx.fillRect(faceOx+i*S,faceOy+4*S,S,2);
    ctx.restore();
  }
  animRock();
}

// Close on ESC
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){
    closeOtmaneRock();closeOtmaneJob();closeOtmanePicker();
  }
});

// "otmane" cheat code
let _otBuf='';
document.addEventListener('keydown',ev=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  _otBuf=(_otBuf+ev.key.toLowerCase()).slice(-6);
  if(_otBuf==='otmane'){_otBuf='';openOtmanePicker();}
});

// ══════════════════════════════════════════
//  GLOBAL CHAT (Firebase)
// ══════════════════════════════════════════
(function initGlobalChat(){
  // Build the chat UI
  const chatWrapper=document.createElement('div');
  chatWrapper.id='chatWrapper';
  chatWrapper.innerHTML=`
<div id="chatShell" style="position:fixed;bottom:28px;left:10px;z-index:8500;font-family:'DM Mono',monospace;display:flex;flex-direction:column;align-items:flex-start;">
  <!-- collapsed pill toggle -->
  <button id="chatPill" style="background:#0a0a0a;border:1px solid #1a1a2a;border-radius:20px;color:#2a1a4a;font-family:'DM Mono',monospace;font-size:.5rem;padding:4px 10px;cursor:pointer;letter-spacing:.1em;transition:all .15s;display:flex;align-items:center;gap:5px;">
    <span id="chatPillDot" style="width:5px;height:5px;border-radius:50%;background:#2a1a4a;flex-shrink:0;transition:background .2s;"></span>
    <span id="chatPillLabel">💬 CHAT</span>
    <span id="chatUnreadBadge" style="display:none;background:#a855f7;color:#fff;font-size:.38rem;padding:1px 4px;border-radius:8px;margin-left:2px;"></span>
  </button>
  <!-- expandable panel, hidden by default -->
  <div id="chatBox" style="display:none;flex-direction:column;width:240px;background:#070707;border:1px solid #141420;border-radius:6px;margin-bottom:5px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.8);">
    <div id="chatMsgs" style="flex:1;overflow-y:auto;padding:6px 8px;max-height:140px;min-height:40px;display:flex;flex-direction:column;gap:2px;scrollbar-width:none;"></div>
    <div style="display:flex;border-top:1px solid #0e0e1a;padding:4px 6px;gap:4px;align-items:center;">
      <input id="chatInput" placeholder="say something..." maxlength="120" autocomplete="off"
        style="flex:1;background:transparent;border:none;color:#666;font-family:'DM Mono',monospace;font-size:.53rem;outline:none;"/>
      <button id="chatSend" style="background:transparent;border:none;color:#2a1a4a;font-size:.65rem;padding:0 4px;cursor:pointer;line-height:1;">↵</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(chatWrapper);

  let chatOpen=false;
  let chatInited=false;
  let unread=0;
  const chatShell=document.getElementById('chatShell');
  const chatBox=document.getElementById('chatBox');
  const chatMsgs=document.getElementById('chatMsgs');
  const chatInput=document.getElementById('chatInput');
  const chatPill=document.getElementById('chatPill');
  const chatPillDot=document.getElementById('chatPillDot');
  const chatUnreadBadge=document.getElementById('chatUnreadBadge');

  function toggleChat(){
    chatOpen=!chatOpen;
    chatBox.style.display=chatOpen?'flex':'none';
    chatPill.style.borderColor=chatOpen?'#a855f733':'#1a1a2a';
    chatPill.style.color=chatOpen?'#555':'#2a1a4a';
    chatPillDot.style.background=chatOpen?'#a855f7':'#2a1a4a';
    if(chatOpen){
      unread=0;chatUnreadBadge.style.display='none';
      setTimeout(()=>{chatInput.focus();chatMsgs.scrollTop=chatMsgs.scrollHeight;},50);
    }
  }
  chatPill.addEventListener('click',toggleChat);

  // Close chat when clicking canvas (so it doesn't block play)
  document.getElementById('gc').addEventListener('mousedown',()=>{
    if(chatOpen){toggleChat();}
  });

  function appendMsg(name,text,color,ts){
    const d=document.createElement('div');
    d.style.cssText='font-size:.51rem;line-height:1.5;word-break:break-word;';
    const time=ts?new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
    d.innerHTML=`<span style="color:${color||'#a855f7'};">${escH(name)}</span> <span style="color:#222;font-size:.44rem;">${time}</span><br><span style="color:#555;">${escH(text)}</span>`;
    chatMsgs.appendChild(d);
    chatMsgs.scrollTop=chatMsgs.scrollHeight;
    // keep max 80 messages
    while(chatMsgs.children.length>80)chatMsgs.removeChild(chatMsgs.firstChild);
    // Unread badge when closed
    if(!chatOpen&&name!=='🌍 System'){
      unread++;
      chatUnreadBadge.textContent=unread>9?'9+':unread;
      chatUnreadBadge.style.display='inline-block';
      chatPillDot.style.background='#a855f7';
    }
  }
  function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // Name color based on username hash
  function nameColor(name){
    let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))&0xffffff;
    const cols=['#a855f7','#38bdf8','#34d399','#f472b6','#fb923c','#facc15','#c084fc','#22d3ee'];
    return cols[Math.abs(h)%cols.length];
  }

  function initChatListeners(){
    if(chatInited||!window._fbReady||!window._fbImports)return;
    chatInited=true;
    const {ref:fbRef,onChildAdded:fbOnChild,query:fbQuery,limitToLast:fbLTL}=window._fbImports;
    const chatRef=fbRef(window._fbDb,'globalChat');
    const recent=fbQuery(chatRef,fbLTL(50));
    fbOnChild(recent,snap=>{
      const m=snap.val();
      if(m&&m.name&&m.text)appendMsg(m.name,m.text,nameColor(m.name),m.ts);
    });
  }

  async function sendMsg(){
    const text=chatInput.value.trim();chatInput.value='';
    if(!text)return;
    const name=currentUser||'Guest';
    const now=Date.now();
    if(window._lastChatTs&&now-window._lastChatTs<800)return;
    window._lastChatTs=now;

    if(window._fbReady&&window._fbImports){
      try{
        const {ref:fbRef,push:fbPush}=window._fbImports;
        await fbPush(fbRef(window._fbDb,'globalChat'),{name,text,ts:now});
      }catch(e){appendMsg(name,text,nameColor(name),now);}
    }else{
      appendMsg(name,text,nameColor(name),now);
    }
  }

  chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendMsg();}});
  document.getElementById('chatSend').addEventListener('click',sendMsg);

  // Keep trying to init chat until Firebase is ready (Firebase module loads async)
  function tryInitChat(){
    if(window._fbReady&&window._fbImports){
      initChatListeners();
      appendMsg('🌍 System','Welcome to Particle World! Chat is global 🔥','#444',null);
    }else{
      setTimeout(tryInitChat,500);
    }
  }
  setTimeout(tryInitChat,1500);
})();
