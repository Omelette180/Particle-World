/**
 * PARTICLE WORLD v1.3 Beta — js/multiplayer.js
 *
 * HOST-AUTHORITY MULTIPLAYER
 * ─────────────────────────────────────────────────────────────
 * One world. One simulation. One brain running everything.
 *
 *  HOST  → runs PW.Simulation (the only simulation)
 *           receives player draw actions from Firebase
 *           applies them to THE ONE grid
 *           broadcasts compressed world diffs every 100ms
 *
 *  CLIENT → simulation PAUSED (host drives the world)
 *            sends draw actions to Firebase → host applies them
 *            receives world diffs → applies to local display
 *            everyone sees the same explosion, the same zombie
 *
 * No more parallel universes. No more "it blew up on my screen but not yours."
 */

'use strict';

// Uses firebase compat SDK already loaded in index.html
// (firebase.initializeApp, firebase.database)

const _FB_CFG = {
  apiKey:            'AIzaSyBnVtCaMHdousMGFEfDGi57SVf5KrkTF4A',
  authDomain:        'particle-world.firebaseapp.com',
  databaseURL:       'https://particle-world-default-rtdb.firebaseio.com',
  projectId:         'particle-world',
  storageBucket:     'particle-world.firebasestorage.app',
  messagingSenderId: '5494928895',
  appId:             '1:5494928895:web:adcedb5bedf79fa461a3ca',
};

let _db       = null;
let _dbReady  = false;

function _dbInit() {
  if (_dbReady) return true;
  try {
    if (!window.firebase) { console.warn('[MP] Firebase compat SDK not loaded'); return false; }
    if (!firebase.apps.length) firebase.initializeApp(_FB_CFG);
    _db = firebase.database();
    window._fbDb = _db;
    _dbReady = true;
    // Log visit
    _db.ref('visits/' + Date.now()).set({
      host: location.hostname, href: location.href,
      ua: navigator.userAgent.slice(0, 100), ts: Date.now(),
      stolen: !window._pwAllowed,
    }).catch(() => {});
    return true;
  } catch(e) {
    console.error('[MP] Firebase init:', e);
    return false;
  }
}

// ── Config ────────────────────────────────────────────────────────
const MP_COLORS       = ['#4ac8ff','#ff6644','#44ff88','#ffcc44','#ff44ff','#88ffcc','#ff88aa','#c77dff'];
const DIFF_INTERVAL   = 100;   // ms between world diffs
const CURSOR_INTERVAL = 80;    // ms between cursor broadcasts
const ACTION_BATCH    = 40;    // ms client batches draw actions
const MAX_DIFF        = 2000;  // max cells in one diff packet

// ── State ─────────────────────────────────────────────────────────
let _room      = '';
let _myId      = '';
let _myColor   = '';
let _myName    = '';
let _isHost    = false;
let _connected = false;
let _players   = {};
let _unsubs    = [];  // cleanup functions

// Host only
let _prevSnap    = null;
let _diffTimer   = null;

// Client only
let _pendingActs = [];
let _actTimer    = null;

// Cursors
let _curCanvas = null;
let _curCtx    = null;
let _curRaf    = null;
let _curTimer  = null;
let _mx = 0, _my = 0;

// Draw hook
let _drawHooked  = false;
let _lastDraw    = { x: -1, y: -1 };

// ── Firebase helpers ──────────────────────────────────────────────
const _r   = path => _db.ref(path);
const _set = (path, val) => _r(path).set(val);
const _get = path => _r(path).once('value');
const _rm  = path => _r(path).remove();
const _push = (path, val) => _r(path).push(val);

function _on(path, evt, cb) {
  const ref = _r(path);
  ref.on(evt, cb);
  _unsubs.push(() => ref.off(evt, cb));
}
function _offAll() { _unsubs.forEach(fn => fn()); _unsubs = []; }

// ── Grid bridge ───────────────────────────────────────────────────
function _cols()    { return window.PW?.Grid?.cols ?? 200; }
function _rows()    { return window.PW?.Grid?.rows ?? 120; }
function _inB(x,y)  { return window.PW?.Grid?.inBounds(x,y) ?? false; }
function _gtype(x,y){ return window.PW?.Grid?.getType(x,y) ?? 'empty'; }
function _gset(x,y,t){ window.PW?.Grid?.setCell(x,y,t); }
function _gclear(x,y){ window.PW?.Grid?.clearCell(x,y); }
function _cellSz()  {
  const gc = document.getElementById('gc');
  if (gc && window.PW?.Grid) return gc.width / PW.Grid.cols;
  return parseInt(localStorage.getItem('pw_cellSize') || '3');
}
function _sel()  { return window.PW?.Input?.selected ?? 'sand'; }
function _bsz()  { return window.PW?.Input?.brushSize ?? 3; }

// ── Serialization ─────────────────────────────────────────────────
function _serialize() {
  const out = [], C = _cols(), R = _rows();
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const t = _gtype(x, y);
    if (t && t !== 'empty') out.push(y * C + x, t);
  }
  return out;
}

function _deserialize(data) {
  if (!window.PW?.Grid) return;
  PW.Grid.clear();
  const d = data || [], C = _cols();
  for (let i = 0; i < d.length - 1; i += 2) {
    const x = d[i] % C, y = Math.floor(d[i] / C);
    if (_inB(x, y)) _gset(x, y, d[i+1]);
  }
}

// ── Diffing ───────────────────────────────────────────────────────
function _snapshot() {
  const C = _cols(), R = _rows(), snap = new Array(C * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) snap[y*C+x] = _gtype(x,y);
  return snap;
}

function _diff(old_, new_) {
  const d = [];
  for (let i = 0; i < old_.length && d.length < MAX_DIFF * 2; i++) {
    if (old_[i] !== new_[i]) d.push(i, new_[i] === 'empty' ? '' : new_[i]);
  }
  return d;
}

function _applyDiff(d) {
  if (!window.PW?.Grid) return;
  const C = _cols();
  for (let i = 0; i < d.length - 1; i += 2) {
    const x = d[i] % C, y = Math.floor(d[i] / C);
    if (!_inB(x, y)) continue;
    if (!d[i+1]) _gclear(x, y); else _gset(x, y, d[i+1]);
  }
}

// ── HOST: broadcast world diffs ───────────────────────────────────
function _startDiffs() {
  _prevSnap = _snapshot();
  _diffTimer = setInterval(() => {
    if (!_connected || !_isHost) return;
    const newSnap = _snapshot();
    const d = _diff(_prevSnap, newSnap);
    _prevSnap = newSnap;
    if (!d.length) return;
    _push(`rooms/${_room}/diffs`, { d, t: Date.now() }).catch(() => {});
    // Clean up old diffs occasionally
    if (Math.random() < 0.05) _rm(`rooms/${_room}/diffs`);
  }, DIFF_INTERVAL);
}
function _stopDiffs() {
  if (_diffTimer) { clearInterval(_diffTimer); _diffTimer = null; }
}

// ── HOST: apply client actions ────────────────────────────────────
function _watchActions() {
  let skip = true;
  setTimeout(() => skip = false, 1000);
  _on(`rooms/${_room}/actions`, 'child_added', snap => {
    if (skip) return;
    const data = snap.val();
    if (!data || data.by === _myId) { snap.ref.remove(); return; }
    (data.acts || []).forEach(a => {
      if (!_inB(a.x, a.y)) return;
      if (a.e === 'eraser' || !a.e) _gclear(a.x, a.y);
      else _gset(a.x, a.y, a.e);
    });
    snap.ref.remove();
  });
}

// ── CLIENT: receive diffs ─────────────────────────────────────────
function _watchDiffs() {
  const since = Date.now() - 200;
  const ref = _r(`rooms/${_room}/diffs`).orderByChild('t').startAt(since);
  ref.on('child_added', snap => {
    if (!_connected) return;
    const data = snap.val();
    if (data?.d) _applyDiff(data.d);
  });
  _unsubs.push(() => ref.off('child_added'));
}

// ── CLIENT: send draw actions ─────────────────────────────────────
function _queueAct(x, y, e) {
  _pendingActs.push({ x, y, e });
  if (!_actTimer) {
    _actTimer = setTimeout(() => {
      _actTimer = null;
      if (!_connected || !_pendingActs.length) return;
      const acts = [..._pendingActs]; _pendingActs = [];
      _push(`rooms/${_room}/actions`, { by: _myId, acts, t: Date.now() }).catch(() => {});
    }, ACTION_BATCH);
  }
}

// ── CURSOR OVERLAY ────────────────────────────────────────────────
function _initCursors() {
  if (_curCanvas) { cancelAnimationFrame(_curRaf); _curCanvas.remove(); }
  _curCanvas = document.createElement('canvas');
  _curCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9000;';
  _curCanvas.width  = innerWidth;
  _curCanvas.height = innerHeight;
  document.body.appendChild(_curCanvas);
  _curCtx = _curCanvas.getContext('2d');

  (function loop() {
    _curRaf = requestAnimationFrame(loop);
    _curCtx.clearRect(0, 0, _curCanvas.width, _curCanvas.height);
    Object.values(_players).forEach(p => {
      if (p.id === _myId || p.cx == null) return;
      _curCtx.beginPath();
      _curCtx.arc(p.cx, p.cy, 7, 0, Math.PI * 2);
      _curCtx.fillStyle   = p.color + 'cc';
      _curCtx.fill();
      _curCtx.strokeStyle = '#000';
      _curCtx.lineWidth   = 1.5;
      _curCtx.stroke();
      const nm = p.name || p.id.slice(0, 6);
      _curCtx.font = 'bold 11px "DM Mono",monospace';
      const tw = _curCtx.measureText(nm).width;
      _curCtx.fillStyle = 'rgba(0,0,0,.75)';
      _curCtx.fillRect(p.cx+10, p.cy-17, tw+10, 17);
      _curCtx.fillStyle = p.color;
      _curCtx.fillText(nm, p.cx+15, p.cy-4);
    });
  })();

  addEventListener('resize', () => {
    if (_curCanvas) { _curCanvas.width = innerWidth; _curCanvas.height = innerHeight; }
  });
}

function _destroyCursors() {
  if (_curRaf)    { cancelAnimationFrame(_curRaf); _curRaf = null; }
  if (_curCanvas) { _curCanvas.remove(); _curCanvas = null; _curCtx = null; }
}

function _startCursors() {
  addEventListener('mousemove', e => { _mx = e.clientX; _my = e.clientY; });
  _curTimer = setInterval(() => {
    if (!_connected) return;
    _set(`rooms/${_room}/players/${_myId}/cx`, _mx);
    _set(`rooms/${_room}/players/${_myId}/cy`, _my);
  }, CURSOR_INTERVAL);
}
function _stopCursors() {
  if (_curTimer) { clearInterval(_curTimer); _curTimer = null; }
}

// ── DRAW HOOK ─────────────────────────────────────────────────────
function _hookDraw() {
  if (_drawHooked) return;
  _drawHooked = true;
  const gc = document.getElementById('gc');
  if (!gc) return;

  function onDraw(e) {
    if (!_connected || !e.buttons) return;
    const r   = gc.getBoundingClientRect();
    const cs  = _cellSz();
    const cx  = Math.floor((e.clientX - r.left) * (gc.width  / r.width)  / cs);
    const cy  = Math.floor((e.clientY - r.top)  * (gc.height / r.height) / cs);
    if (cx === _lastDraw.x && cy === _lastDraw.y && e.type !== 'mousedown') return;
    _lastDraw = { x: cx, y: cy };

    const elem = (e.button === 2 || e.ctrlKey) ? 'eraser' : _sel();
    const bsz  = _bsz();
    const cells = [];

    for (let dy = -bsz; dy <= bsz; dy++) for (let dx = -bsz; dx <= bsz; dx++) {
      if (dx*dx + dy*dy > bsz*bsz) continue;
      if (_inB(cx+dx, cy+dy)) cells.push({ x: cx+dx, y: cy+dy, e: elem });
    }

    if (_isHost) {
      // Host applies directly to the simulation
      cells.forEach(a => { if (a.e === 'eraser') _gclear(a.x,a.y); else _gset(a.x,a.y,a.e); });
    } else {
      // Client sends to host via Firebase
      cells.forEach(a => _queueAct(a.x, a.y, a.e));
    }
  }

  gc.addEventListener('mousemove', onDraw);
  gc.addEventListener('mousedown', onDraw);
}

// ── WATCH ROOM ────────────────────────────────────────────────────
function _watchRoom() {
  _on(`rooms/${_room}/players`, 'value', snap => {
    const data = snap.val() || {};
    Object.values(data).forEach(p => {
      if (!_players[p.id]) _players[p.id] = {};
      if (p.id !== _myId) Object.assign(_players[p.id], p);
      else Object.assign(_players[p.id], { id: p.id, color: p.color, name: p.name });
    });
    Object.keys(_players).forEach(id => { if (!data[id]) delete _players[id]; });
    _updateList();
    const n = Object.keys(_players).length;
    _status(_isHost
      ? `● Hosting — ${n} player${n!==1?'s':''}`
      : `● Room ${_room} — ${n} player${n!==1?'s':''}`,
      '#44ff88');
  });

  _on(`rooms/${_room}/host`, 'value', snap => {
    if (!snap.exists() && !_isHost && _connected) {
      _status('Host left the room', '#ff4444');
      setTimeout(mpDisconnect, 1500);
    }
  });
}

// ── HOST ──────────────────────────────────────────────────────────
async function mpHost() {
  if (!_dbInit()) { _status('✗ Firebase unavailable', '#ff4444'); return; }
  if (_connected)  { mpDisconnect(); return; }

  _room    = _rand4();
  _myId    = _uid();
  _myColor = MP_COLORS[0];
  _myName  = 'Host';
  _isHost  = true;

  _status('Creating room...', '#ffcc44');

  try {
    const ex = await _get(`rooms/${_room}/host`);
    if (ex.exists()) _room = _rand4();

    await _set(`rooms/${_room}/host`, _myId);
    await _set(`rooms/${_room}/players/${_myId}`, { id: _myId, color: _myColor, name: _myName, cx: null, cy: null });
    _r(`rooms/${_room}/host`).onDisconnect().remove();
    _r(`rooms/${_room}/players/${_myId}`).onDisconnect().remove();
    await _set(`rooms/${_room}/world`, _serialize());

    _players[_myId] = { id: _myId, color: _myColor, name: _myName };
    _connected = true;

    // HOST keeps simulation running — it's the authority
    if (window.PW?.Simulation && !PW.Simulation.running) PW.Simulation.start();

    _watchRoom();
    _watchActions();
    _startDiffs();
    _hookDraw();
    _initCursors();
    _startCursors();
    _showConnected();
    _status(`● Hosting — Room: ${_room}`, '#44ff88');

  } catch(e) {
    console.error('[MP] Host error:', e);
    _status('✗ Failed to create room', '#ff4444');
  }
}

// ── JOIN ──────────────────────────────────────────────────────────
async function mpJoin(code) {
  if (!_dbInit()) { _status('✗ Firebase unavailable', '#ff4444'); return; }
  if (_connected)  { mpDisconnect(); return; }

  code = (code || '').trim().toUpperCase();
  const errEl = document.getElementById('mpJoinErr');
  if (code.length !== 4) { if (errEl) errEl.textContent = 'Enter a 4-letter code.'; return; }
  if (errEl) errEl.textContent = '';

  _status(`Connecting to ${code}...`, '#ffcc44');

  try {
    const hostSnap = await _get(`rooms/${code}/host`);
    if (!hostSnap.exists()) {
      if (errEl) errEl.textContent = 'Room not found or host left.';
      _status('✗ Room not found', '#ff4444');
      return;
    }

    _room   = code;
    _myId   = _uid();
    _isHost = false;

    const pSnap      = await _get(`rooms/${code}/players`);
    const usedColors = pSnap.exists() ? Object.values(pSnap.val()).map(p => p.color) : [];
    const idx        = Object.keys(pSnap.val() || {}).length + 1;
    _myColor = MP_COLORS.find(c => !usedColors.includes(c)) || MP_COLORS[idx % MP_COLORS.length];
    _myName  = 'P' + idx;

    await _set(`rooms/${code}/players/${_myId}`, { id: _myId, color: _myColor, name: _myName, cx: null, cy: null });
    _r(`rooms/${code}/players/${_myId}`).onDisconnect().remove();

    const wSnap = await _get(`rooms/${code}/world`);
    if (wSnap.exists()) _deserialize(wSnap.val());

    _players[_myId] = { id: _myId, color: _myColor, name: _myName };
    _connected = true;

    // CLIENT pauses simulation — host is god
    if (window.PW?.Simulation) PW.Simulation.pause();

    _watchRoom();
    _watchDiffs();
    _hookDraw();
    _initCursors();
    _startCursors();
    _showConnected();
    _status(`● In room ${_room}`, '#44ff88');

  } catch(e) {
    console.error('[MP] Join error:', e);
    _status('✗ Failed to join', '#ff4444');
  }
}

// ── DISCONNECT ────────────────────────────────────────────────────
async function mpDisconnect() {
  _connected = false;
  _stopDiffs();
  _stopCursors();
  _offAll();
  _destroyCursors();

  if (_db) {
    try {
      if (_isHost) await _rm(`rooms/${_room}`);
      else         await _rm(`rooms/${_room}/players/${_myId}`);
    } catch(e) {}
  }

  if (!_isHost && window.PW?.Simulation) PW.Simulation.resume();

  _players    = {};
  _drawHooked = false;
  _lastDraw   = { x: -1, y: -1 };
  _pendingActs = [];
  _prevSnap    = null;
  _room = _myId = _myColor = _myName = '';
  _isHost = false;

  _showDisconnected();
  _status('● Not connected', '#333');
}

// ── UI ────────────────────────────────────────────────────────────
function _status(msg, col = '#555') {
  const el = document.getElementById('mpStatus');
  if (el) { el.textContent = msg; el.style.color = col; }
}

function _showConnected() {
  document.getElementById('mpSetup')?.style.setProperty('display', 'none');
  document.getElementById('mpConnected')?.style.setProperty('display', 'block');
  const rd = document.getElementById('mpRoomDisplay');
  if (rd) rd.textContent = _room;
  const mb = document.getElementById('bMulti');
  if (mb) { mb.style.color = _myColor; mb.textContent = '🌐 ' + _room; }
  const badge = document.getElementById('mpRoleBadge');
  if (badge) { badge.textContent = _isHost ? '👑 HOST' : '🎮 CLIENT'; badge.style.color = _isHost ? '#ffcc44' : '#4ac8ff'; }
}

function _showDisconnected() {
  document.getElementById('mpSetup')?.style.setProperty('display', 'block');
  document.getElementById('mpConnected')?.style.setProperty('display', 'none');
  const mb = document.getElementById('bMulti');
  if (mb) { mb.style.color = '#4ac8ff'; mb.textContent = '🌐 MULTI'; }
}

function _updateList() {
  const el = document.getElementById('mpPlayerList');
  if (!el) return;
  el.innerHTML = '';
  Object.values(_players).forEach(p => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;font-family:"DM Mono",monospace;font-size:.62rem;margin-bottom:5px;';
    const me  = p.id === _myId;
    const host = _isHost && me;
    row.innerHTML = `
      <div style="width:9px;height:9px;border-radius:50%;background:${p.color};flex-shrink:0;box-shadow:0 0 6px ${p.color};"></div>
      <span style="color:#888;">${p.name||p.id.slice(0,8)}</span>
      ${me   ? '<span style="color:#444;font-size:.5rem;">(you)</span>'   : ''}
      ${host ? '<span style="color:#ffcc44;font-size:.5rem;">👑 host</span>' : ''}
    `;
    el.appendChild(row);
  });
}

function mpCopyCode() {
  navigator.clipboard?.writeText(_room).catch(() => {});
  const btn = document.querySelector('[onclick="mpCopyCode()"]');
  if (btn) { btn.textContent = 'copied!'; setTimeout(() => btn.textContent = 'copy', 1500); }
}

// ── UTILS ─────────────────────────────────────────────────────────
function _uid()   { return Math.random().toString(36).slice(2, 10); }
function _rand4() { return Array.from({length:4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[0|Math.random()*32]).join(''); }

// ── WIRE ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bMulti')?.addEventListener('click', () =>
    document.getElementById('panMulti')?.classList.add('open'));
  document.getElementById('mpHostBtn')?.addEventListener('click', mpHost);
  document.getElementById('mpJoinBtn')?.addEventListener('click', () =>
    mpJoin(document.getElementById('mpJoinCode')?.value));
  document.getElementById('mpJoinCode')?.addEventListener('keydown', e => {
    e.target.value = e.target.value.toUpperCase();
    if (e.key === 'Enter') mpJoin(e.target.value);
  });
  document.getElementById('mpJoinCode')?.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });
  document.getElementById('mpLeaveBtn')?.addEventListener('click', mpDisconnect);
});

window.mpHost       = mpHost;
window.mpJoin       = mpJoin;
window.mpDisconnect = mpDisconnect;
window.mpCopyCode   = mpCopyCode;
