/**
 * PARTICLE WORLD v1.3 Beta — js/admin.js
 * BUG FIX: All DOM queries now inside DOMContentLoaded.
 * Admin code: omariscool
 */

// ══════════════════════════════════════
//  ADMIN STATE — safe to declare here (no DOM needed)
// ══════════════════════════════════════
const ADMIN_CODE = 'omariscool';
let adminUnlocked = false, aiEnabled = true, particleLimit = 50000;
let gravityMult = 1, heatMult = 1, flowMult = 1, explMult = 1, creatureSpeedMult = 1;
let freezeAll = false;

function openAdminGate() {
  const gate = document.getElementById('adminCode');
  const inp  = document.getElementById('adminInput');
  if (!gate || !inp) return;
  gate.classList.remove('hide');
  inp.value = '';
  document.getElementById('adminErr').textContent = '';
  setTimeout(() => inp.focus(), 100);
}

function applyPWDevGolden() {
  const nameEl = document.getElementById('acctName');
  if (nameEl && nameEl.textContent === 'PW_dev') {
    nameEl.style.cssText = 'background:linear-gradient(90deg,#ffd700,#ffaa00,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:"Syne",sans-serif;font-weight:700;font-size:.85rem;';
  }
  const btn = document.getElementById('adminToggleBtn');
  if (btn) btn.style.cssText += 'color:#ffd700;border-color:#ffd70044;text-shadow:0 0 8px #ffd700;';
  const score = document.getElementById('scoreDisp');
  if (score) score.style.color = '#ffd700';
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#1a1400,#2a2000);border:1px solid #ffd70066;color:#ffd700;font-family:"Syne",sans-serif;font-size:.72rem;padding:10px 22px;border-radius:4px;z-index:9999;letter-spacing:.1em;box-shadow:0 0 24px #ffd70044;pointer-events:none;';
  t.textContent = '👑 Welcome back, PW_dev';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function populateAdminElemSel() {
  // Works with both v1 E object and v2 ElementRegistry
  const sel = document.getElementById('aElemSel');
  if (!sel) return;
  sel.innerHTML = '';
  let names = [];
  if (window.PW?.ElementRegistry) {
    names = PW.ElementRegistry.allArray().map(e => e.id).sort();
  } else if (window.E) {
    names = Object.keys(E).filter(k => k !== 'empty').sort();
  }
  names.forEach(n => {
    const o = document.createElement('option');
    o.value = o.textContent = n;
    sel.appendChild(o);
  });
}

function adminDebugTick() {
  if (!adminUnlocked) return;
  const el = document.getElementById('aDebugStats');
  if (!el) return;
  let p = 0;
  if (window.PW?.Grid) {
    p = PW.Grid.countNonEmpty();
  } else if (window.ta) {
    for (let i = 0; i < ta.length; i++) if (ta[i]) p++;
  }
  const cols = window.PW?.Grid?.cols ?? window.COLS ?? '?';
  const rows = window.PW?.Grid?.rows ?? window.ROWS ?? '?';
  const fpsVal = window.PW?.Simulation?.fps ?? window.fps ?? '?';
  el.innerHTML =
    `<div>Particles: <span style="color:var(--acc)">${p.toLocaleString()}</span></div>` +
    `<div>Grid: <span style="color:var(--acc)">${cols}×${rows}</span></div>` +
    `<div>FPS: <span style="color:var(--acc)">${fpsVal}</span></div>` +
    `<div>Gravity: <span style="color:var(--acc)">${gravityMult.toFixed(1)}x</span></div>` +
    `<div>AI: <span style="color:${aiEnabled ? 'var(--grn)' : 'var(--red)'}">${aiEnabled ? 'ON' : 'OFF'}</span></div>`;
  setTimeout(adminDebugTick, 500);
}

function adminWireButtons() {
  const $ = id => document.getElementById(id);

  // Announcement
  const ann = () => {
    const msg = $('aAnnounceInput')?.value.trim();
    if (!msg) return;
    window.adminSendAnnouncement?.(msg);
    $('aAnnounceInput').value = '';
  };
  if ($('aAnnounceSend')) $('aAnnounceSend').onclick = ann;
  if ($('aAnnounceInput')) $('aAnnounceInput').onkeydown = e => { if (e.key === 'Enter') ann(); };
  if ($('aAnnounceClear')) $('aAnnounceClear').onclick = () => window.adminClearAnnouncement?.();

  // Ban
  if ($('aBanSend')) $('aBanSend').onclick = async () => {
    const user   = $('aBanUser')?.value.trim();
    const reason = $('aBanReason')?.value.trim();
    const dur    = parseInt($('aBanDuration')?.value);
    const msg    = $('aBanMsg');
    if (!user) { if (msg) msg.textContent = 'Enter a username.'; return; }
    const ok = await window.adminBanUser?.(user, reason, dur);
    if (msg) {
      msg.style.color = ok ? '#44ff88' : '#ff6666';
      msg.textContent = ok ? `✓ ${user} banned.` : 'Failed — Firebase not ready.';
      setTimeout(() => msg.textContent = '', 3000);
    }
  };
  if ($('aBanUnbanAll')) $('aBanUnbanAll').onclick = async () => {
    await window.adminUnbanAll?.();
    const msg = $('aBanMsg');
    if (msg) { msg.style.color = '#44ff88'; msg.textContent = '✓ All bans cleared.'; setTimeout(() => msg.textContent = '', 3000); }
  };

  // Screenshot
  if ($('aScreenshot')) $('aScreenshot').onclick = () => {
    const a = document.createElement('a'); a.download = 'particleworld.png';
    a.href = $('gc').toDataURL(); a.click();
  };
  if ($('aGIFStart')) $('aGIFStart').onclick = () => window.startGIF?.();

  // Online players
  if ($('aRefreshPlayers')) $('aRefreshPlayers').onclick = () => {
    const el = $('aOnlinePlayers');
    if (!el) return;
    el.textContent = 'Loading...';
    if (window._fbDb) {
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js').then(({ ref, get }) => {
        get(ref(window._fbDb, 'rooms')).then(snap => {
          if (!snap.exists()) { el.textContent = 'No active rooms.'; return; }
          let html = '';
          Object.entries(snap.val()).forEach(([code, room]) => {
            const players = Object.values(room.players || {});
            html += `<div style="margin-bottom:4px;"><span style="color:#a855f7;">${code}</span> — ${players.length} player${players.length !== 1 ? 's' : ''}</div>`;
            players.forEach(p => html += `<div style="padding-left:10px;color:#444;">${p.name || p.id?.slice(0, 8)}</div>`);
          });
          el.innerHTML = html || 'No active rooms.';
        });
      });
    } else el.textContent = 'Firebase not connected.';
  };

  // Disaster buttons — work with v2 Grid + v1 fallbacks
  function spawnElem(x, y, type) {
    if (window.PW?.Grid) PW.Grid.setCell(x, y, type);
    else if (window.sC) sC(x, y, type);
  }
  function clearAll2() {
    if (window.PW?.Grid) PW.Grid.clear();
    else if (window.ta) { ta.fill(0); ca.fill('#040404'); ea.fill(0); da.fill(0); ha.fill(0); }
  }
  const cols = () => window.PW?.Grid?.cols ?? window.COLS ?? 100;
  const rows = () => window.PW?.Grid?.rows ?? window.ROWS ?? 60;

  if ($('dLavaFlood'))     $('dLavaFlood').onclick     = () => { for (let x = 0; x < cols(); x++) for (let y = 0; y < 20; y++) if (Math.random() < .6) spawnElem(x, y, 'lava'); };
  if ($('dIceAge'))        $('dIceAge').onclick         = () => { for (let y = 0; y < rows(); y++) for (let x = 0; x < cols(); x++) { const t = PW?.Grid?.getType(x,y); if (t==='water'||t==='lava') spawnElem(x,y,'ice'); } };
  if ($('dPlague'))        $('dPlague').onclick         = () => { for (let i = 0; i < 100; i++) { const x = 0|Math.random()*cols(), y = 0|Math.random()*rows(); spawnElem(x,y,'virus'); } };
  if ($('dAsteroidField')) $('dAsteroidField').onclick  = () => { for (let i = 0; i < 15; i++) { const x = 0|Math.random()*cols(); spawnElem(x, 0, 'meteor'); } };
  if ($('dMeteorShower'))  $('dMeteorShower').onclick   = () => { for (let i = 0; i < 12; i++) setTimeout(() => { const x=0|Math.random()*cols(); spawnElem(x,0,'meteor'); }, i*120); };
  if ($('dAcidStorm'))     $('dAcidStorm').onclick      = () => { for (let x = 0; x < cols(); x+=2) if (Math.random()<.6) spawnElem(x,0,'acid'); };
  if ($('dZombieOutbreak'))$('dZombieOutbreak').onclick = () => { for (let i=0;i<25;i++){const x=0|Math.random()*cols(),y=0|Math.random()*(rows()*.4);spawnElem(x,y,'zombie');} };
  if ($('dFireTornado'))   $('dFireTornado').onclick    = () => { const x=0|cols()/2,y=0|rows()/2; spawnElem(x,y,'tornado'); for(let i=-4;i<=4;i++) if(Math.abs(i)>1) spawnElem(x+i,y,'fire'); };

  // Stats
  setInterval(() => {
    const el = $('aPerfStats');
    if (el && $('aTab5')?.classList.contains('active')) {
      const p = window.PW?.Grid?.countNonEmpty() ?? 0;
      el.innerHTML = `Particles: ${p.toLocaleString()}<br>Canvas: ${cols()}×${rows()}<br>Sim speed: ${window.PW?.Simulation?.speed ?? window.simSpeed ?? '?'}x`;
    }
  }, 500);

  // World controls
  if ($('aP'))  $('aP').onclick  = () => { window.PW ? PW.Simulation.toggle() : $('bPause')?.click(); };
  if ($('aSt')) $('aSt').onclick = () => { if (window.PW && !PW.Simulation.running) { PW.Simulation.resume(); setTimeout(() => PW.Simulation.pause(), 50); } else window.step?.(); };
  if ($('aCl')) $('aCl').onclick = () => { window.PW ? PW.Grid.clear() : $('bClear')?.click(); };
  if ($('aRe')) $('aRe').onclick = clearAll2;

  // Physics sliders
  if ($('aGrav')) $('aGrav').oninput = e => { gravityMult = e.target.value/10; $('aGravV').textContent = gravityMult.toFixed(1); };
  if ($('aHeat')) $('aHeat').oninput = e => { heatMult    = e.target.value/10; $('aHeatV').textContent = heatMult.toFixed(1)+'x'; };
  if ($('aFlow')) $('aFlow').oninput = e => { flowMult    = e.target.value/10; $('aFlowV').textContent = flowMult.toFixed(1)+'x'; };
  if ($('aExpl')) $('aExpl').oninput = e => { explMult    = e.target.value/10; $('aExplV').textContent = explMult.toFixed(1)+'x'; };
  if ($('aSpd2')) $('aSpd2').oninput = e => {
    const spd = +e.target.value;
    if (window.PW) PW.Simulation.setSpeed(spd);
    else window.simSpeed = spd;
    $('aSpd2') && ($('aSpd2').value = spd);
    $('aSpdV2') && ($('aSpdV2').textContent = spd+'x');
    $('spV') && ($('spV').textContent = spd+'x');
  };
  if ($('aPlim')) $('aPlim').oninput = e => {
    particleLimit = +e.target.value;
    const v = $('aPlimV');
    if (v) v.textContent = particleLimit >= 50000 ? '∞' : particleLimit.toLocaleString();
  };
  if ($('aCSpd')) $('aCSpd').oninput = e => { creatureSpeedMult = e.target.value/10; $('aCSpdV').textContent = creatureSpeedMult.toFixed(1)+'x'; };

  // Element spawn
  if ($('aSpawnElem')) $('aSpawnElem').onclick = () => {
    const n  = $('aElemSel')?.value;
    const cx = 0|+$('aSpawnX')?.value/100*cols();
    const cy = 0|+$('aSpawnY')?.value/100*rows();
    const r  = +$('aSpawnR')?.value;
    if (!n) return;
    for (let dy=-r;dy<=r;dy++) for (let dx=-r;dx<=r;dx++) {
      if (dx*dx+dy*dy>r*r) continue;
      spawnElem(cx+dx, cy+dy, n);
    }
  };
  if ($('aSpawn1')) $('aSpawn1').onclick = () => {
    const n = $('aElemSel')?.value; if (!n) return;
    spawnElem(0|cols()/2, 0|rows()/2, n);
  };
  if ($('aSpawnR')) $('aSpawnR').oninput = e => { $('aSpawnRV').textContent = e.target.value; };

  // Time controls
  if ($('aTimeNorm'))   $('aTimeNorm').onclick   = () => { _setSpeed(2);  };
  if ($('aTimeSlowmo')) $('aTimeSlowmo').onclick = () => { _setSpeed(1);  };
  if ($('aTimeFast'))   $('aTimeFast').onclick   = () => { _setSpeed(8);  };
  if ($('aTimePause'))  $('aTimePause').onclick  = () => { _setSpeed(0);  };
  if ($('aTimeSlider')) $('aTimeSlider').oninput = function() { _setSpeed(Math.round(+this.value/4*10)/10); };

  function _setSpeed(s) {
    if (window.PW) PW.Simulation.setSpeed(s || 1);
    else window.simSpeed = s;
    if ($('aTimeV')) $('aTimeV').textContent = s+'x';
    if ($('aTimeSlider')) $('aTimeSlider').value = s*4;
  }

  // Bulk spawn
  if ($('aBulkSpawn')) $('aBulkSpawn').onclick = () => {
    const type = $('aBulkSel')?.value;
    const n = { person:50, zombie:50, ant:100, fish:50, bird:50, citizen:50, bacteria:200, parasite:30 }[type] || 50;
    for (let i=0;i<n;i++) {
      const x=0|Math.random()*cols(), y=0|Math.random()*rows();
      if (window.PW ? PW.Grid.isEmpty(x,y) : window.emp?.(x,y)) spawnElem(x,y,type);
    }
  };

  // Creature controls
  if ($('aTogAI')) $('aTogAI').onclick = function() {
    aiEnabled = !aiEnabled;
    this.textContent = aiEnabled ? '🧠 Toggle AI' : '🧠 AI: OFF';
    this.style.borderColor = aiEnabled ? '' : '#ff4444';
  };
}

// ══════════════════════════════════════
// ELEMENT BAN LIST
// ══════════════════════════════════════
const bannedElements = new Set();
function renderBanList() {
  const bl = document.getElementById('aBanList');
  if (!bl) return;
  bl.innerHTML = '';
  bannedElements.forEach(e => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;justify-content:space-between;font-size:.56rem;color:#555;padding:2px 0;';
    d.innerHTML = `<span>${e}</span><button onclick="bannedElements.delete('${e}');renderBanList()" style="background:transparent;border:none;color:#882222;cursor:pointer;font-size:.55rem;">✕</button>`;
    bl.appendChild(d);
  });
  if (!bannedElements.size) bl.innerHTML = '<div style="font-size:.56rem;color:#2a2a2a;">No elements banned</div>';
}

// ══════════════════════════════════════
// CHEAT CODES (work without DOM)
// ══════════════════════════════════════
const CHEATS = {
  godmode:    () => { if (window.PW) { for (let y=0;y<PW.Grid.rows;y++) for (let x=0;x<PW.Grid.cols;x++) { const c=PW.Grid.getCell(x,y); if(c&&c.type!=='empty') c.energy=999; } } },
  bigbang:    () => { const c=()=>0|Math.random()*(window.PW?.Grid?.cols??100); const r=()=>0|Math.random()*(window.PW?.Grid?.rows??60); for(let i=0;i<8;i++) setTimeout(()=>{ if(window.PW) PW.Helpers.explode(c(),r(),20,{strength:3}); else window.explode?.(c(),r(),20,3); },i*100); },
  freeze:     () => { freezeAll = !freezeAll; },
  supernova:  () => { const cx=0|(window.PW?.Grid?.cols??100)/2, cy=0|(window.PW?.Grid?.rows??60)/2; if(window.PW){PW.Grid.setCell(cx,cy,'sun'); setTimeout(()=>PW.Helpers.explode(cx,cy,25,{strength:3}),800);} },
  omariscool: () => { adminUnlocked=true; document.getElementById('adminPanel')?.classList.add('open'); },
};

let cheatBuffer = '';

// ══════════════════════════════════════
// DOMContentLoaded — ALL DOM QUERIES GO HERE
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // ── Tab switching ──
  document.querySelectorAll('.atab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.atab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.atab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(btn.dataset.tab)?.classList.add('active');
    };
  });

  // ── Drag panel to move ──
  const panel  = $('adminPanel');
  const handle = $('adminDragHandle');
  if (panel && handle) {
    let dragging = false, ox = 0, oy = 0;
    handle.addEventListener('mousedown', e => {
      dragging = true;
      ox = e.clientX - panel.offsetLeft;
      oy = e.clientY - panel.offsetTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let nx = e.clientX - ox, ny = e.clientY - oy;
      nx = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  nx));
      ny = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, ny));
      panel.style.left = nx + 'px'; panel.style.top = ny + 'px'; panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => dragging = false);
  }

  // ── Admin input (code entry) ──
  const adminInput = $('adminInput');
  if (adminInput) {
    adminInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (adminInput.value === ADMIN_CODE) {
          adminUnlocked = true;
          $('adminCode')?.classList.add('hide');
          $('adminPanel')?.classList.add('open');
          $('adminToggleBtn')?.classList.add('show');
          populateAdminElemSel();
          adminDebugTick();
          adminWireButtons();
          if (window.currentUser === 'PW_dev') applyPWDevGolden();
        } else {
          const err = $('adminErr');
          if (err) err.textContent = 'Wrong code. Try again.';
          adminInput.value = '';
          adminInput.style.borderColor = '#ff4444';
          setTimeout(() => adminInput.style.borderColor = '', 600);
        }
      }
      if (e.key === 'Escape') $('adminCode')?.classList.add('hide');
    });
  }

  // ── Admin panel buttons ──
  const minBtn = $('adminMinBtn');
  if (minBtn) {
    minBtn.onclick = () => {
      const body = $('adminBody');
      const tabs = $('adminTabs');
      if (!body || !tabs) return;
      const minimized = body.style.display === 'none';
      body.style.display = minimized ? '' : 'none';
      tabs.style.display = minimized ? '' : 'none';
      minBtn.textContent = minimized ? '_' : '□';
    };
  }
  if ($('adminClose')) $('adminClose').onclick = () => $('adminPanel')?.classList.remove('open');

  // ── adminToggleBtn — THE MAIN BUG FIX ──
  const toggleBtn = $('adminToggleBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const p = $('adminPanel');
      if (!p) return;
      p.classList.contains('open') ? p.classList.remove('open') : p.classList.add('open');
    };
  }

  // ── Secret keycombo ──
  document.addEventListener('keypress', e => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    cheatBuffer = (cheatBuffer + e.key).slice(-ADMIN_CODE.length);
    if (cheatBuffer === ADMIN_CODE) {
      cheatBuffer = '';
      if (!adminUnlocked) openAdminGate();
      else $('adminPanel')?.classList.toggle('open');
    }
  });

  // ── Cheat codes (keydown) ──
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const buf = (window._cheatKBuf = ((window._cheatKBuf||'') + e.key).slice(-14));
    const found = Object.keys(CHEATS).find(c => buf.endsWith(c));
    if (found) {
      CHEATS[found]();
      window._cheatKBuf = '';
      const n = document.createElement('div');
      n.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0a0a10;border:1px solid #a855f7;color:#a855f7;padding:10px 22px;font-family:"Syne",sans-serif;font-size:.8rem;z-index:9999;pointer-events:none;border-radius:3px;';
      n.textContent = '🔑 ' + found;
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 1800);
    }
  });

  // ── Secret elements ──
  document.querySelectorAll('[data-secret]').forEach(b => b.onclick = () => {
    const secret = b.dataset.secret;
    if (window.PW?.Input) PW.Input.setElement(secret);
    else if (window.sel !== undefined) {
      window.sel = secret;
      document.querySelectorAll('.eb').forEach(x => x.classList.remove('sel'));
      $('sSel') && ($('sSel').textContent = secret);
    }
    $('adminPanel')?.classList.remove('open');
  });

  // ── Ban list ──
  setTimeout(() => {
    const bs = $('aBanSel');
    if (bs) {
      let names = [];
      if (window.PW?.ElementRegistry) names = PW.ElementRegistry.allArray().map(e => e.id).sort();
      else if (window.E) names = Object.keys(E).filter(k => k !== 'empty').sort();
      names.forEach(k => { const o = document.createElement('option'); o.value = o.textContent = k; bs.appendChild(o); });
    }
    renderBanList();
    if ($('aBanAdd'))   $('aBanAdd').onclick   = () => { const v=$('aBanSel')?.value; if(v){bannedElements.add(v);renderBanList();} };
    if ($('aBanClear')) $('aBanClear').onclick  = () => { bannedElements.clear(); renderBanList(); };
  }, 600);

  console.log('[PW Admin] Admin system initialized ✓ (type "omariscool" to unlock)');
});
