// ── PARTICLE WORLD — HOST-AUTHORITY MULTIPLAYER ───────────────────
// Based directly on your upgraded Firebase v9 code.
// Wired to PW.Grid instead of a separate grid array.
// Anonymous auth, modular SDK, diff broadcast, cursor overlay.

import { initializeApp }                    from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getAuth, signInAnonymously }        from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { getDatabase, ref, set, push,
         remove, onValue, onChildAdded,
         get, off, query, orderByChild,
         startAt, onDisconnect }             from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

// ── CONFIG ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBnVtCaMHdousMGFEfDGi57SVf5KrkTF4A",
  authDomain:        "particle-world.firebaseapp.com",
  databaseURL:       "https://particle-world-default-rtdb.firebaseio.com",
  projectId:         "particle-world",
  storageBucket:     "particle-world.firebasestorage.app",
  messagingSenderId: "5494928895",
  appId:             "1:5494928895:web:adcedb5bedf79fa461a3ca"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// Expose db globally so chat.js and firebase-init.js can share it
window._fbDb    = db;
window._fbReady = true;

// ── STATE ─────────────────────────────────────────────────────────
let firebaseReady = false;
let isHost        = false;
let roomCode      = '';
let myId          = '';
let myColor       = '#4ac8ff';
let players       = {};   // id → { id, name, color, cx, cy }
let _unsubs       = [];   // listener cleanup

const MP_COLORS = ['#4ac8ff','#ff6644','#44ff88','#ffcc44','#ff44ff','#88ffcc','#ff88aa','#c77dff'];

// ── HELPERS ───────────────────────────────────────────────────────
function _uid()     { return Math.random().toString(36).slice(2, 10); }
function _randRoom(){ return Array.from({length:4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join(''); }

// ── ANONYMOUS AUTH ────────────────────────────────────────────────
// Players sign in automatically — no account needed for multiplayer
signInAnonymously(auth)
  .then(() => {
    myId          = auth.currentUser.uid;
    firebaseReady = true;
    console.log("[MP] Signed in anonymously:", myId.slice(0,8));
  })
  .catch(err => {
    console.warn("[MP] Anonymous sign-in failed:", err.message, "— using random ID");
    myId          = _uid();
    firebaseReady = true;
  });

function _waitReady() {
  return new Promise(resolve => {
    if (firebaseReady) { resolve(); return; }
    const t = setInterval(() => { if (firebaseReady) { clearInterval(t); resolve(); } }, 100);
    setTimeout(() => { clearInterval(t); firebaseReady = true; resolve(); }, 4000);
  });
}

// ── PW.GRID BRIDGE ────────────────────────────────────────────────
// Your code had grid[y][x] — we use PW.Grid instead.
// Everything else (diff math, action system, cursor) is your code unchanged.
const G = {
  cols()      { return window.PW?.Grid?.cols ?? 200; },
  rows()      { return window.PW?.Grid?.rows ?? 120; },
  inB(x, y)   { return window.PW?.Grid?.inBounds(x, y) ?? (x>=0 && y>=0 && x<200 && y<120); },
  get(x, y)   { return window.PW?.Grid?.getType(x, y) ?? null; },
  set(x, y, t){ window.PW?.Grid?.setCell(x, y, t); },
  clear(x, y) { window.PW?.Grid?.clearCell(x, y); },
  clearAll()  { window.PW?.Grid?.clear(); },
  cellSize()  {
    const gc = document.getElementById('gc');
    if (gc && window.PW?.Grid) return gc.width / PW.Grid.cols;
    return parseInt(localStorage.getItem('pw_cellSize') || '3');
  },
};

// ── DIFF SYSTEM (your code, wired to PW.Grid) ─────────────────────
let prevSnapshot       = null;
const DIFF_INTERVAL    = 100;
const MAX_DIFF_CELLS   = 2000;
let diffTimer          = null;

function makeSnapshot() {
  const W = G.cols(), H = G.rows();
  const snap = new Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      snap[y * W + x] = G.get(x, y);  // null or type string
  return snap;
}

function makeDiff(oldSnap, newSnap) {
  const diff = [];
  for (let i = 0; i < Math.min(oldSnap.length, newSnap.length) && diff.length < MAX_DIFF_CELLS * 2; i++) {
    if (oldSnap[i] !== newSnap[i]) {
      diff.push(i, newSnap[i] === null || newSnap[i] === 'empty' ? '' : newSnap[i]);
    }
  }
  return diff;
}

function applyDiff(diff) {
  if (!diff?.length) return;
  const W = G.cols();
  for (let i = 0; i < diff.length - 1; i += 2) {
    const idx  = diff[i];
    const type = diff[i + 1];
    const x    = idx % W;
    const y    = Math.floor(idx / W);
    if (!G.inB(x, y)) continue;
    if (!type || type === '') G.clear(x, y);
    else G.set(x, y, type);
  }
}

function startDiffBroadcast() {
  prevSnapshot = makeSnapshot();
  diffTimer = setInterval(() => {
    if (!isHost) return;
    const snap = makeSnapshot();
    const diff = makeDiff(prevSnapshot, snap);
    prevSnapshot = snap;
    if (diff.length === 0) return;
    push(ref(db, `rooms/${roomCode}/diffs`), { d: diff, t: Date.now() })
      .catch(e => console.warn("[MP] Diff push failed:", e));
    // Prune old diffs occasionally so Firebase doesn't grow forever
    if (Math.random() < 0.05) remove(ref(db, `rooms/${roomCode}/diffs`));
  }, DIFF_INTERVAL);
}

// ── CLIENT ACTION QUEUE (your code, wired to PW.Grid) ────────────
let pendingActions     = [];
const ACTION_BATCH_MS  = 40;
let actionTimer        = null;

function queueAction(x, y, type) {
  pendingActions.push({ x, y, e: type });
  if (!actionTimer) {
    actionTimer = setTimeout(() => {
      actionTimer = null;
      if (!pendingActions.length) return;
      push(ref(db, `rooms/${roomCode}/actions`), {
        by:      myId,
        actions: [...pendingActions],
        t:       Date.now(),
      }).catch(() => {});
      pendingActions = [];
    }, ACTION_BATCH_MS);
  }
}

function watchClientActions() {
  let skip = true;
  setTimeout(() => skip = false, 800);
  const actRef = ref(db, `rooms/${roomCode}/actions`);
  onChildAdded(actRef, snap => {
    if (skip) return;
    const data = snap.val();
    if (!data || data.by === myId) { remove(snap.ref); return; }
    // HOST applies client actions directly to the ONE simulation grid
    (data.actions || []).forEach(a => {
      if (!G.inB(a.x, a.y)) return;
      if (a.e === 'eraser' || !a.e) G.clear(a.x, a.y);
      else G.set(a.x, a.y, a.e);
    });
    remove(snap.ref);
  });
  _unsubs.push(() => off(actRef));
}

// ── CLIENT DIFF WATCH (your watchHostDiffs, adapted) ─────────────
function watchHostDiffs() {
  const since   = Date.now() - 200;
  const diffRef = query(ref(db, `rooms/${roomCode}/diffs`), orderByChild('t'), startAt(since));
  onChildAdded(diffRef, snap => {
    const data = snap.val();
    if (!data) return;
    applyDiff(data.d);
  });
  _unsubs.push(() => off(diffRef));
}

// ── CURSOR SYSTEM (your code, unchanged) ─────────────────────────
let myCursorX  = 0, myCursorY = 0;
let cursorTimer = null;

function startCursorBroadcast() {
  document.addEventListener('mousemove', e => {
    myCursorX = e.clientX;
    myCursorY = e.clientY;
  });
  cursorTimer = setInterval(() => {
    set(ref(db, `rooms/${roomCode}/players/${myId}/cx`), myCursorX);
    set(ref(db, `rooms/${roomCode}/players/${myId}/cy`), myCursorY);
  }, 80);
}

function stopCursorBroadcast() {
  if (cursorTimer) { clearInterval(cursorTimer); cursorTimer = null; }
}

// ── CURSOR OVERLAY ────────────────────────────────────────────────
let curCanvas = null, curCtx = null, curRaf = null;

function initCursorOverlay() {
  if (curCanvas) { cancelAnimationFrame(curRaf); curCanvas.remove(); }
  curCanvas = document.createElement('canvas');
  curCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9000;';
  curCanvas.width  = innerWidth;
  curCanvas.height = innerHeight;
  document.body.appendChild(curCanvas);
  curCtx = curCanvas.getContext('2d');

  (function loop() {
    curRaf = requestAnimationFrame(loop);
    curCtx.clearRect(0, 0, curCanvas.width, curCanvas.height);
    Object.values(players).forEach(p => {
      if (p.id === myId || p.cx == null) return;
      curCtx.beginPath();
      curCtx.arc(p.cx, p.cy, 7, 0, Math.PI * 2);
      curCtx.fillStyle   = p.color + 'bb';
      curCtx.fill();
      curCtx.strokeStyle = '#000';
      curCtx.lineWidth   = 1.5;
      curCtx.stroke();
      const name = p.name || p.id.slice(0, 6);
      curCtx.font = 'bold 11px "DM Mono",monospace';
      const tw = curCtx.measureText(name).width;
      curCtx.fillStyle = 'rgba(0,0,0,.8)';
      curCtx.fillRect(p.cx + 10, p.cy - 17, tw + 10, 17);
      curCtx.fillStyle = p.color;
      curCtx.fillText(name, p.cx + 15, p.cy - 4);
    });
  })();

  addEventListener('resize', () => {
    if (curCanvas) { curCanvas.width = innerWidth; curCanvas.height = innerHeight; }
  });
}

function destroyCursorOverlay() {
  if (curRaf)    { cancelAnimationFrame(curRaf); curRaf = null; }
  if (curCanvas) { curCanvas.remove(); curCanvas = null; curCtx = null; }
}

// ── DRAW HOOK (your hookDraw, wired to PW.Grid + PW.Input) ───────
let drawHooked = false;
let lastPos    = { x: -1, y: -1 };

function hookDraw() {
  if (drawHooked) return;
  drawHooked = true;
  const gc = document.getElementById('gc');
  if (!gc) return;

  function onDraw(e) {
    if (!e.buttons) return;
    const rect = gc.getBoundingClientRect();
    const cs   = G.cellSize();
    const cx   = Math.floor((e.clientX - rect.left) * (gc.width  / rect.width)  / cs);
    const cy   = Math.floor((e.clientY - rect.top)  * (gc.height / rect.height) / cs);
    if (cx === lastPos.x && cy === lastPos.y && e.type !== 'mousedown') return;
    lastPos = { x: cx, y: cy };

    const elem = (e.button === 2 || e.ctrlKey) ? 'eraser' : (window.PW?.Input?.selected ?? 'sand');
    const r    = window.PW?.Input?.brushSize ?? 3;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx*dx + dy*dy > r*r) continue;
        const bx = cx+dx, by = cy+dy;
        if (!G.inB(bx, by)) continue;
        if (isHost) {
          // Host applies directly — this IS the simulation grid
          if (elem === 'eraser') G.clear(bx, by);
          else G.set(bx, by, elem);
        } else {
          // Client queues → host applies → diff broadcasts back to everyone
          queueAction(bx, by, elem);
        }
      }
    }
  }

  gc.addEventListener('mousedown', onDraw);
  gc.addEventListener('mousemove', onDraw);
}

// ── WATCH ROOM ────────────────────────────────────────────────────
function watchRoom() {
  const playersRef = ref(db, `rooms/${roomCode}/players`);
  onValue(playersRef, snap => {
    const data = snap.val() || {};
    Object.values(data).forEach(p => {
      if (!players[p.id]) players[p.id] = {};
      if (p.id !== myId) Object.assign(players[p.id], p);
      else Object.assign(players[p.id], { id: p.id, color: p.color, name: p.name });
    });
    Object.keys(players).forEach(id => { if (!data[id]) delete players[id]; });
    updatePlayerList();
    const n = Object.keys(players).length;
    setStatus(
      isHost ? `● Hosting — ${n} player${n!==1?'s':''}` : `● Room ${roomCode} — ${n} player${n!==1?'s':''}`,
      '#44ff88'
    );
  });
  _unsubs.push(() => off(playersRef));

  // Host disconnect detection
  const hostRef = ref(db, `rooms/${roomCode}/host`);
  onValue(hostRef, snap => {
    if (!snap.exists() && !isHost) {
      setStatus('Host left the room', '#ff4444');
      setTimeout(mpDisconnect, 1500);
    }
  });
  _unsubs.push(() => off(hostRef));
}

// ── WORLD SERIALIZE / DESERIALIZE ────────────────────────────────
function serializeWorld() {
  const W = G.cols(), H = G.rows(), out = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = G.get(x, y);
      if (t && t !== 'empty') out.push(y * W + x, t);
    }
  return out;
}

function deserializeWorld(data) {
  G.clearAll();
  const W = G.cols();
  (Array.isArray(data) ? data : []).forEach((v, i, arr) => {
    if (i % 2 !== 0) return;
    const x = v % W, y = Math.floor(v / W);
    if (G.inB(x, y) && arr[i+1]) G.set(x, y, arr[i+1]);
  });
}

// ── HOST ──────────────────────────────────────────────────────────
async function mpHost() {
  if (!firebaseReady) { await _waitReady(); }
  if (window._mpConnected) { mpDisconnect(); return; }

  isHost    = true;
  roomCode  = _randRoom();
  myColor   = MP_COLORS[0];
  players[myId] = { id: myId, name: 'Host', color: myColor, cx: null, cy: null };

  setStatus('Creating room...', '#ffcc44');

  try {
    const existing = await get(ref(db, `rooms/${roomCode}/host`));
    if (existing.exists()) roomCode = _randRoom();

    await set(ref(db, `rooms/${roomCode}/host`), myId);
    await set(ref(db, `rooms/${roomCode}/players/${myId}`), players[myId]);
    onDisconnect(ref(db, `rooms/${roomCode}/host`)).remove();
    onDisconnect(ref(db, `rooms/${roomCode}/players/${myId}`)).remove();

    // Push current world so joining players see current state
    await set(ref(db, `rooms/${roomCode}/world`), serializeWorld());

    window._mpConnected = true;

    // HOST keeps simulation running — it is the only physics brain
    if (window.PW?.Simulation && !PW.Simulation.running) PW.Simulation.start();

    watchRoom();
    watchClientActions();
    startDiffBroadcast();
    hookDraw();
    initCursorOverlay();
    startCursorBroadcast();
    showConnected();
    setStatus(`● Hosting — Room: ${roomCode}`, '#44ff88');
    if (window.unlockAch) unlockAch('first_multiplayer');
    console.log("[MP] Hosting room:", roomCode);

  } catch(e) {
    console.error("[MP] Host error:", e);
    setStatus('✗ Failed to create room', '#ff4444');
    isHost = false;
  }
}

// ── JOIN ──────────────────────────────────────────────────────────
async function mpJoin(code) {
  if (!firebaseReady) { await _waitReady(); }
  if (window._mpConnected) { mpDisconnect(); return; }

  code = (code || '').trim().toUpperCase();
  const errEl = document.getElementById('mpJoinErr');
  if (code.length !== 4) { if (errEl) errEl.textContent = 'Enter a 4-letter code.'; return; }
  if (errEl) errEl.textContent = '';

  setStatus(`Connecting to ${code}...`, '#ffcc44');

  try {
    const hostSnap = await get(ref(db, `rooms/${code}/host`));
    if (!hostSnap.exists()) {
      if (errEl) errEl.textContent = 'Room not found or host left.';
      setStatus('✗ Room not found', '#ff4444');
      return;
    }

    roomCode = code;
    isHost   = false;

    const pSnap      = await get(ref(db, `rooms/${code}/players`));
    const usedColors = pSnap.exists() ? Object.values(pSnap.val()).map(p => p.color) : [];
    const idx        = Object.keys(pSnap.val() || {}).length + 1;
    myColor = MP_COLORS.find(c => !usedColors.includes(c)) || MP_COLORS[idx % MP_COLORS.length];

    await set(ref(db, `rooms/${code}/players/${myId}`), {
      id: myId, name: 'P' + idx, color: myColor, cx: null, cy: null,
    });
    onDisconnect(ref(db, `rooms/${code}/players/${myId}`)).remove();

    players[myId] = { id: myId, name: 'P' + idx, color: myColor };

    // Load host's current world
    const wSnap = await get(ref(db, `rooms/${code}/world`));
    if (wSnap.exists()) deserializeWorld(wSnap.val());

    window._mpConnected = true;

    // CLIENT pauses its simulation — host is the only physics brain
    if (window.PW?.Simulation) PW.Simulation.pause();

    watchRoom();
    watchHostDiffs();        // CLIENT receives diffs from host
    hookDraw();
    initCursorOverlay();
    startCursorBroadcast();
    showConnected();
    setStatus(`● In room ${roomCode}`, '#44ff88');
    if (window.unlockAch) unlockAch('first_multiplayer');
    console.log("[MP] Joined room:", roomCode);

  } catch(e) {
    console.error("[MP] Join error:", e);
    setStatus('✗ Failed to join', '#ff4444');
  }
}

// ── DISCONNECT ────────────────────────────────────────────────────
async function mpDisconnect() {
  window._mpConnected = false;
  stopCursorBroadcast();
  destroyCursorOverlay();
  if (diffTimer) { clearInterval(diffTimer); diffTimer = null; }
  _unsubs.forEach(fn => fn());
  _unsubs = [];

  try {
    if (isHost) await remove(ref(db, `rooms/${roomCode}`));
    else        await remove(ref(db, `rooms/${roomCode}/players/${myId}`));
  } catch(e) {}

  // Resume local simulation if client
  if (!isHost && window.PW?.Simulation) PW.Simulation.resume();

  players        = {};
  pendingActions = [];
  prevSnapshot   = null;
  drawHooked     = false;
  lastPos        = { x: -1, y: -1 };
  roomCode       = '';
  isHost         = false;

  showDisconnected();
  setStatus('● Not connected', '#333');
}

// ── UI ────────────────────────────────────────────────────────────
function setStatus(msg, col = '#555') {
  const el = document.getElementById('mpStatus');
  if (el) { el.textContent = msg; el.style.color = col; }
}

function showConnected() {
  document.getElementById('mpSetup')?.style.setProperty('display', 'none');
  document.getElementById('mpConnected')?.style.setProperty('display', 'block');
  const rd = document.getElementById('mpRoomDisplay');
  if (rd) rd.textContent = roomCode;
  const mb = document.getElementById('bMulti');
  if (mb) { mb.style.color = myColor; mb.textContent = '🌐 ' + roomCode; }
  const badge = document.getElementById('mpRoleBadge');
  if (badge) {
    badge.textContent = isHost ? '👑 HOST' : '🎮 CLIENT';
    badge.style.color = isHost ? '#ffcc44' : '#4ac8ff';
  }
  const authEl = document.getElementById('mpAuthStatus');
  if (authEl) authEl.textContent = '🔐 Signed in anonymously';
}

function showDisconnected() {
  document.getElementById('mpSetup')?.style.setProperty('display', 'block');
  document.getElementById('mpConnected')?.style.setProperty('display', 'none');
  const mb = document.getElementById('bMulti');
  if (mb) { mb.style.color = '#4ac8ff'; mb.textContent = '🌐 MULTI'; }
}

function updatePlayerList() {
  const el = document.getElementById('mpPlayerList');
  if (!el) return;
  el.innerHTML = '';
  Object.values(players).forEach(p => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;font-family:"DM Mono",monospace;font-size:.62rem;margin-bottom:5px;';
    const me   = p.id === myId;
    const host = isHost && me;
    row.innerHTML = `
      <div style="width:9px;height:9px;border-radius:50%;background:${p.color};flex-shrink:0;box-shadow:0 0 6px ${p.color};"></div>
      <span style="color:#888;">${p.name || p.id.slice(0,8)}</span>
      ${me   ? '<span style="color:#444;font-size:.5rem;">(you)</span>'      : ''}
      ${host ? '<span style="color:#ffcc44;font-size:.5rem;">👑 host</span>' : ''}
    `;
    el.appendChild(row);
  });
}

function mpCopyCode() {
  navigator.clipboard?.writeText(roomCode).catch(() => {});
  const btn = document.querySelector('[onclick="mpCopyCode()"]');
  if (btn) { btn.textContent = 'copied!'; setTimeout(() => btn.textContent = 'copy', 1500); }
}

// ── WIRE BUTTONS ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bMulti')?.addEventListener('click', () =>
    document.getElementById('panMulti')?.classList.add('open'));
  document.getElementById('mpHostBtn')?.addEventListener('click', mpHost);
  document.getElementById('mpJoinBtn')?.addEventListener('click', () =>
    mpJoin(document.getElementById('mpJoinCode')?.value || ''));
  document.getElementById('mpJoinCode')?.addEventListener('keydown', e => {
    e.target.value = e.target.value.toUpperCase();
    if (e.key === 'Enter') mpJoin(e.target.value);
  });
  document.getElementById('mpJoinCode')?.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });
  document.getElementById('mpLeaveBtn')?.addEventListener('click', mpDisconnect);
});

// ── EXPOSE TO WINDOW ──────────────────────────────────────────────
window.mpHost       = mpHost;
window.mpJoin       = mpJoin;
window.mpDisconnect = mpDisconnect;
window.mpCopyCode   = mpCopyCode;
