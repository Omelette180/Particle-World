/**
 * PARTICLE WORLD v1.3 Beta — js/account.js
 * Fixed for v2 architecture:
 *   - v1 grid arrays (ta, ca, ea, da, ha) replaced with PW.Grid API
 *   - simSpeed replaced with PW.Simulation.setSpeed()
 *   - COLS/ROWS replaced with PW.Grid.cols/rows
 *   - id(x,y) removed
 *   - Panel IDs corrected
 */

'use strict';

let currentUser = null;

function _acctKey(user, key)    { return `pw_${user}_${key}`; }
function _acctSave(key, val)    { if (currentUser) localStorage.setItem(_acctKey(currentUser, key), JSON.stringify(val)); }
function _acctLoad(key, def)    {
  if (!currentUser) return def ?? null;
  try { const v = localStorage.getItem(_acctKey(currentUser, key)); return v !== null ? JSON.parse(v) : (def ?? null); }
  catch(e) { return def ?? null; }
}
function _allUsers()            { try { return JSON.parse(localStorage.getItem('pw_users') || '{}'); } catch(e) { return {}; } }
function _saveUsers(u)          { localStorage.setItem('pw_users', JSON.stringify(u)); }

// ── Register ──────────────────────────────────────────────────────
function acctRegister() {
  const user = document.getElementById('acctUser')?.value.trim();
  const pass = document.getElementById('acctPass')?.value;
  const msg  = document.getElementById('acctMsg');
  if (!user || user.length < 2) { if(msg) msg.textContent = 'Username must be 2+ characters.'; return; }
  if (!pass || pass.length < 4) { if(msg) msg.textContent = 'Password must be 4+ characters.'; return; }
  const users = _allUsers();
  if (users[user]) { if(msg) msg.textContent = 'Username taken.'; return; }
  const hash = btoa(pass + user + 'pw_salt_v1').slice(0, 24);
  users[user] = { hash, created: Date.now() };
  _saveUsers(users);
  if (msg) { msg.style.color = '#44ffaa'; msg.textContent = 'Account created!'; }
  setTimeout(() => _loginUser(user), 500);
}

// ── Login ─────────────────────────────────────────────────────────
function acctLoginAction() {
  const user  = document.getElementById('acctUser')?.value.trim();
  const pass  = document.getElementById('acctPass')?.value;
  const msg   = document.getElementById('acctMsg');
  const users = _allUsers();
  if (!users[user]) { if(msg) msg.textContent = 'Account not found.'; return; }
  const hash = btoa(pass + user + 'pw_salt_v1').slice(0, 24);
  if (users[user].hash !== hash) { if(msg) msg.textContent = 'Wrong password.'; return; }
  _loginUser(user);
}

function _loginUser(user) {
  currentUser = user;
  localStorage.setItem('pw_lastUser', user);

  const loggedOut = document.getElementById('acctLoggedOut');
  const loggedIn  = document.getElementById('acctLoggedIn');
  if (loggedOut) loggedOut.style.display = 'none';
  if (loggedIn)  loggedIn.style.display  = 'block';

  const nameEl = document.getElementById('acctName');
  if (nameEl) nameEl.textContent = user;

  if (user === 'PW_dev') {
    if (nameEl) nameEl.style.cssText = 'background:linear-gradient(90deg,#ffd700,#ffaa00,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:"Syne",sans-serif;font-weight:700;font-size:.85rem;';
    // Auto-unlock admin
    if (typeof adminUnlocked !== 'undefined') adminUnlocked = true;
    document.getElementById('adminToggleBtn')?.classList.add('show');
    // Unlock all achievements
    setTimeout(() => {
      if (window.ACHIEVEMENTS && window.achUnlocked) {
        ACHIEVEMENTS.forEach(a => achUnlocked.add(a.id));
        if (window.renderAchList) renderAchList();
      }
    }, 500);
  }

  // Load saved data
  const saved = _acctLoad('gamedata', null);
  if (saved) {
    if (saved.score && window.addScore) {
      window.score = 0;
      window.addScore(saved.score);
    }
    if (saved.achievements && window.achUnlocked) {
      saved.achievements.forEach(id => achUnlocked.add(id));
      if (window.renderAchList) renderAchList();
    }
  }

  // Load settings
  const settings = _acctLoad('settings', null);
  if (settings) {
    if (settings.simSpeed && window.PW?.Simulation) PW.Simulation.setSpeed(settings.simSpeed);
    if (settings.glowOn  !== undefined) window.glowOn  = settings.glowOn;
    if (settings.shakeOn !== undefined) { window.shakeOn = settings.shakeOn; window._shakeEnabled = settings.shakeOn; }
  }

  _refreshAcctUI();
  const msg = document.getElementById('acctMsg');
  if (msg) { msg.style.color = '#44ffaa'; msg.textContent = '✦ Signed in!'; }

  // Check ban
  setTimeout(() => window._banCheckUser?.(user), 800);
}

// ── Refresh UI ────────────────────────────────────────────────────
function _refreshAcctUI() {
  if (!currentUser) return;
  const acctScore = document.getElementById('acctScore');
  if (acctScore) acctScore.textContent = (window.score ?? 0).toLocaleString();
  const acctAchCount = document.getElementById('acctAchCount');
  if (acctAchCount) acctAchCount.textContent = window.achUnlocked?.size ?? 0;
  const saves = _acctLoad('worldsaves', []);
  const acctSaveCount = document.getElementById('acctSaveCount');
  if (acctSaveCount) acctSaveCount.textContent = saves.length;
  const sl = document.getElementById('acctSaveList');
  if (!sl) return;
  sl.innerHTML = '';
  saves.forEach((s, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #0a0a0a;';
    row.innerHTML = `
      <div style="flex:1;font-size:.6rem;color:#555;">${s.name || 'World ' + i}</div>
      <div style="font-size:.52rem;color:#2a2a2a;">${new Date(s.ts).toLocaleDateString()}</div>
      <button style="font-size:.52rem;padding:2px 7px;border:1px solid #1a1a1a;background:transparent;color:#444;cursor:pointer;border-radius:2px;" onclick="acctLoadSave(${i})">Load</button>
      <button style="font-size:.52rem;padding:2px 7px;border:1px solid #1a1a1a;background:transparent;color:#333;cursor:pointer;border-radius:2px;" onclick="acctDeleteSave(${i})">✕</button>`;
    sl.appendChild(row);
  });
}

// ── Save world ────────────────────────────────────────────────────
function acctSaveAll() {
  if (!currentUser) {
    const msg = document.getElementById('acctSaveMsg');
    if (msg) { msg.style.color='#ff4444'; msg.textContent='Sign in first!'; }
    return;
  }

  // Save score + achievements
  _acctSave('gamedata', {
    score: window.score ?? 0,
    achievements: [...(window.achUnlocked ?? [])],
    version: GAME_VERSION,
  });

  // Save settings
  _acctSave('settings', {
    simSpeed: window.PW?.Simulation?.speed ?? 2,
    glowOn:   window.glowOn  ?? true,
    shakeOn:  window.shakeOn ?? true,
  });

  // Save world using v2 Grid API
  const worldData = [];
  if (window.PW?.Grid) {
    const g = PW.Grid;
    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        const cell = g.getCell(x, y);
        if (cell && cell.type !== 'empty') {
          worldData.push([y * g.cols + x, cell.type, Math.round(cell.heat ?? 0), Math.round(cell.energy ?? 0)]);
        }
      }
    }
  }

  const saves = _acctLoad('worldsaves', []);
  const name  = prompt('Name this save:', 'World ' + (saves.length + 1)) || ('World ' + (saves.length + 1));
  saves.push({
    name, ts: Date.now(), world: worldData,
    cols: window.PW?.Grid?.cols ?? 200,
    rows: window.PW?.Grid?.rows ?? 120,
  });
  if (saves.length > 10) saves.shift();
  _acctSave('worldsaves', saves);
  _refreshAcctUI();

  const msg = document.getElementById('acctSaveMsg');
  if (msg) { msg.style.color='#44ffaa'; msg.textContent='✦ Everything saved!'; setTimeout(() => msg.textContent='', 2500); }
}

// ── Load world ────────────────────────────────────────────────────
function acctLoadSave(idx) {
  const saves = _acctLoad('worldsaves', []);
  const s = saves[idx];
  if (!s) return;

  if (window.PW?.Grid) {
    PW.Grid.clear();
    const cols = PW.Grid.cols;
    (s.world || []).forEach(([flat, type, heat, energy]) => {
      // Re-map if grid size changed
      let x, y;
      if (s.cols === cols) {
        x = flat % cols; y = Math.floor(flat / cols);
      } else {
        x = flat % s.cols; y = Math.floor(flat / s.cols);
      }
      if (PW.Grid.inBounds(x, y)) {
        PW.Grid.setCell(x, y, type);
        const cell = PW.Grid.getCell(x, y);
        if (cell) { cell.heat = heat ?? 0; cell.energy = energy ?? 0; }
      }
    });
  }

  document.getElementById('panAccount')?.classList.remove('open');
}

function acctDeleteSave(idx) {
  const saves = _acctLoad('worldsaves', []);
  saves.splice(idx, 1);
  _acctSave('worldsaves', saves);
  _refreshAcctUI();
}

// ── Sign out ──────────────────────────────────────────────────────
function acctSignOut() {
  currentUser = null;
  localStorage.removeItem('pw_lastUser');
  document.getElementById('acctLoggedOut')?.style.setProperty('display', 'block');
  document.getElementById('acctLoggedIn')?.style.setProperty('display', 'none');
}

// ── Wire up ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('acctRegister')?.addEventListener('click', acctRegister);
  document.getElementById('acctLogin')?.addEventListener('click', acctLoginAction);
  document.getElementById('acctSignOut')?.addEventListener('click', acctSignOut);
  document.getElementById('acctSaveAll')?.addEventListener('click', acctSaveAll);
  document.getElementById('acctLoadAll')?.addEventListener('click', _refreshAcctUI);

  document.getElementById('bAcct')?.addEventListener('click', () => {
    _refreshAcctUI();
    document.getElementById('panAccount')?.classList.add('open');
  });
  document.getElementById('mAccount')?.addEventListener('click', () => {
    document.getElementById('panAccount')?.classList.add('open');
  });

  // Also wire Enter key on login fields
  ['acctUser','acctPass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') acctLoginAction();
    });
  });

  // Auto-login returning user
  setTimeout(() => {
    const last = localStorage.getItem('pw_lastUser');
    if (last && _allUsers()[last]) _loginUser(last);
  }, 900);
});

// Expose
window.currentUser    = currentUser;
window.acctLoadSave   = acctLoadSave;
window.acctDeleteSave = acctDeleteSave;
