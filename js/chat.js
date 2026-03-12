/**
 * PARTICLE WORLD v2.0 — js/chat.js
 * Extracted from v1.2.3. Full global chat preserved.
 */

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
</script>

</html>
