/**
 * PARTICLE WORLD v2.0 — js/multiplayer.js
 * Firebase multiplayer rooms with proper grid diff syncing.
 */
'use strict';

const Multiplayer = (() => {
  let _roomCode  = null;
  let _connected = false;
  let _lastSync  = 0;
  const SYNC_INTERVAL = 500; // ms between grid pushes

  function _roomRef(path) {
    const { ref, db } = window._fb;
    return ref(db, `rooms/${_roomCode}/${path}`);
  }

  async function join(code) {
    if (!window._fb?.ready) return alert('Firebase not ready');
    _roomCode  = code.toUpperCase();
    _connected = true;
    const username = window._pwUsername || 'Guest';

    const { set, onDisconnect, onValue, onChildAdded } = window._fb;

    // Register player
    const playerRef = _roomRef(`players/${username}`);
    await set(playerRef, { username, joined: Date.now() });
    onDisconnect(playerRef).remove();

    // Listen for draws from other players
    onChildAdded(_roomRef('draws'), snap => {
      const { x, y, type, placer } = snap.val();
      if (placer === username) return;
      if (PW.Grid.inBounds(x, y)) PW.Grid.setCell(x, y, type);
    });

    // Announce
    Achievements.unlock('first_multiplay');
    console.log(`Joined room: ${_roomCode}`);
  }

  // Call this whenever the local player places a cell
  function broadcastDraw(x, y, type) {
    if (!_connected || !window._fb?.ready) return;
    const { push } = window._fb;
    push(_roomRef('draws'), {
      x, y, type,
      placer: window._pwUsername || 'Guest',
      ts: Date.now(),
    });
  }

  function leave() {
    if (!_connected || !window._fb?.ready) return;
    const { remove } = window._fb;
    const username = window._pwUsername || 'Guest';
    remove(_roomRef(`players/${username}`));
    _roomCode  = null;
    _connected = false;
  }

  function buildPanel() {
    const panels = document.getElementById('panels');
    if (!panels) return;
    const div = document.createElement('div');
    div.className = 'opanel';
    div.id = 'panMulti';
    div.innerHTML = `
    <div class="opbox" style="max-width:400px;">
      <h2>⬡ Multiplayer</h2>
      <p>Create or join a room to draw with others in real-time.</p>
      <div style="margin:12px 0;">
        <div class="srow">
          <span class="slabel">Room Code</span>
          <input id="multiCode" placeholder="e.g. SAND123" maxlength="10"
            style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:4px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;text-transform:uppercase;">
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="menu-btn primary" id="multiJoin" style="width:auto;padding:8px 16px;">Join Room</button>
        <button class="menu-btn" id="multiRandom" style="width:auto;padding:8px 16px;">Random Room</button>
      </div>
      <div id="multiStatus" style="font-size:.6rem;color:#333;margin-top:8px;min-height:1em;"></div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>`;
    panels.appendChild(div);

    document.getElementById('btnMulti')?.addEventListener('click', () => showPanel('panMulti'));

    document.getElementById('multiJoin')?.addEventListener('click', () => {
      const code = document.getElementById('multiCode').value.trim();
      if (!code) return;
      join(code).then(() => {
        document.getElementById('multiStatus').textContent = `✓ Connected to room: ${code.toUpperCase()}`;
        document.getElementById('multiStatus').style.color = '#44ffaa';
        closePanels();
      });
    });

    document.getElementById('multiRandom')?.addEventListener('click', () => {
      const code = Math.random().toString(36).slice(2,8).toUpperCase();
      document.getElementById('multiCode').value = code;
    });
  }

  function init() {
    buildPanel();

    // Hook Input to broadcast draws
    setTimeout(() => {
      if (!window.PW?.Grid) return;
      const origSet = PW.Grid.setCell.bind(PW.Grid);
      PW.Grid.setCell = function(x, y, type, extra) {
        origSet(x, y, type, extra);
        if (_connected) broadcastDraw(x, y, type);
      };
    }, 1200);
  }

  return { init, join, leave, broadcastDraw };
})();

document.addEventListener('DOMContentLoaded', () => setTimeout(() => Multiplayer.init(), 900));
