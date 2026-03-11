/**
 * PARTICLE WORLD v2.0 — js/account.js
 * User accounts, login, save/load via Firebase.
 */

'use strict';

const Account = (() => {
  let _username = null;
  let _isAdmin  = false;

  const ADMIN_CODE  = 'omariscool';
  const OWNER_NAMES = ['PW_dev'];

  function _isOwner(name) { return OWNER_NAMES.includes(name); }

  function _hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33 ^ str.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  function _setLoggedIn(username, isAdmin) {
    _username = username;
    _isAdmin  = isAdmin || _isOwner(username);
    window._pwUsername = username;
    window._pwIsAdmin  = _isAdmin;

    document.getElementById('acctLoggedOut').style.display = 'none';
    document.getElementById('acctLoggedIn').style.display  = 'block';
    document.getElementById('acctName').textContent        = username;

    if (_isOwner(username)) {
      document.getElementById('acctName').style.background = 'linear-gradient(90deg,#ffcc00,#ff8800,#ff4400)';
      document.getElementById('acctName').style.webkitBackgroundClip = 'text';
      document.getElementById('acctName').style.webkitTextFillColor  = 'transparent';
    }

    if (_isAdmin) {
      document.getElementById('btnAdmin').style.display = '';
    }
  }

  function _msg(el, text, color = '#ff4444') {
    const el2 = document.getElementById(el);
    if (el2) { el2.textContent = text; el2.style.color = color; }
  }

  async function login(username, password) {
    const fb = window._fb;
    if (!fb?.ready) return _msg('acctMsg', 'Firebase not ready');
    const { ref, get, db } = fb;

    try {
      const snap = await get(ref(db, `users/${username}`));
      if (!snap.exists()) return _msg('acctMsg', 'User not found');
      const data = snap.val();
      if (data.passHash !== _hash(password)) return _msg('acctMsg', 'Wrong password');
      const isAdmin = data.admin || username === 'PW_dev';
      _setLoggedIn(username, isAdmin);
      localStorage.setItem('pw_session', JSON.stringify({ username, passHash: _hash(password) }));
      _msg('acctMsg', 'Signed in!', '#44ffaa');
    } catch(e) { _msg('acctMsg', 'Error: ' + e.message); }
  }

  async function register(username, password) {
    const fb = window._fb;
    if (!fb?.ready) return _msg('acctMsg', 'Firebase not ready');
    if (username.length < 2) return _msg('acctMsg', 'Username too short');
    if (password.length < 4) return _msg('acctMsg', 'Password too short');
    if (/[^a-zA-Z0-9_]/.test(username)) return _msg('acctMsg', 'Letters, numbers, _ only');
    const { ref, get, set, db } = fb;

    try {
      const snap = await get(ref(db, `users/${username}`));
      if (snap.exists()) return _msg('acctMsg', 'Username taken');
      await set(ref(db, `users/${username}`), {
        passHash: _hash(password),
        created: Date.now(),
        admin: false,
      });
      _setLoggedIn(username, false);
      localStorage.setItem('pw_session', JSON.stringify({ username, passHash: _hash(password) }));
      _msg('acctMsg', 'Account created!', '#44ffaa');
    } catch(e) { _msg('acctMsg', 'Error: ' + e.message); }
  }

  function signOut() {
    _username = null;
    _isAdmin  = false;
    window._pwUsername = null;
    window._pwIsAdmin  = false;
    localStorage.removeItem('pw_session');
    document.getElementById('acctLoggedOut').style.display = '';
    document.getElementById('acctLoggedIn').style.display  = 'none';
    document.getElementById('btnAdmin').style.display      = 'none';
    document.getElementById('acctMsg').textContent         = '';
  }

  async function saveAll() {
    if (!_username) return;
    const fb = window._fb;
    if (!fb?.ready) return;
    const { ref, set, db } = fb;
    const saveData = {
      ts: Date.now(),
      version: '2.0.0',
    };
    try {
      await set(ref(db, `users/${_username}/savedata`), saveData);
      _msg('acctSaveMsg', 'Saved!', '#44ffaa');
      setTimeout(() => _msg('acctSaveMsg', ''), 2000);
    } catch(e) { _msg('acctSaveMsg', 'Save failed: ' + e.message); }
  }

  function buildPanel() {
    const panels = document.getElementById('panels');
    if (!panels) return;
    const div = document.createElement('div');
    div.className = 'opanel';
    div.id = 'panAccount';
    div.innerHTML = `
    <div class="opbox" style="max-width:440px;">
      <h2>👤 Account</h2>
      <div id="acctLoggedOut">
        <p style="font-size:.63rem;color:#444;margin-bottom:12px;">Create an account to save your settings and sync across devices.</p>
        <div style="margin-bottom:8px;">
          <div class="srow"><span class="slabel">Username</span><input class="srow select" id="acctUser" placeholder="username" maxlength="24" style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:3px 6px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;"></div>
          <div class="srow"><span class="slabel">Password</span><input class="srow select" id="acctPass" type="password" placeholder="password" maxlength="32" style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:3px 6px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;"></div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;">
          <button class="menu-btn primary" id="acctLogin" style="width:auto;padding:8px 16px;">Sign In</button>
          <button class="menu-btn" id="acctRegister" style="width:auto;padding:8px 16px;">Create Account</button>
        </div>
        <div id="acctMsg" style="font-size:.6rem;color:#ff4444;margin-top:6px;min-height:1em;"></div>
      </div>
      <div id="acctLoggedIn" style="display:none;">
        <div style="font-size:.7rem;color:#ccc;margin-bottom:10px;">Signed in as <span id="acctName" style="color:#a855f7;font-family:'Syne',sans-serif;"></span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="menu-btn primary" id="acctSaveAll" style="width:auto;padding:8px 16px;">💾 Save</button>
          <button class="menu-btn" id="acctSignOut" style="width:auto;padding:8px 16px;margin-left:auto;">Sign Out</button>
        </div>
        <div id="acctSaveMsg" style="font-size:.6rem;color:#44ffaa;margin-top:6px;min-height:1em;"></div>
      </div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>`;
    panels.appendChild(div);

    // Add menu button
    document.getElementById('btnAccount')?.addEventListener('click', () => showPanel('panAccount'));

    // Wire up buttons
    document.getElementById('acctLogin')?.addEventListener('click', () => {
      login(document.getElementById('acctUser').value.trim(),
            document.getElementById('acctPass').value);
    });
    document.getElementById('acctRegister')?.addEventListener('click', () => {
      register(document.getElementById('acctUser').value.trim(),
               document.getElementById('acctPass').value);
    });
    document.getElementById('acctSignOut')?.addEventListener('click', signOut);
    document.getElementById('acctSaveAll')?.addEventListener('click', saveAll);
  }

  function init() {
    buildPanel();

    // Restore session
    const stored = localStorage.getItem('pw_session');
    if (stored) {
      try {
        const { username } = JSON.parse(stored);
        if (username) {
          const wait = setInterval(() => {
            if (!window._fb?.ready) return;
            clearInterval(wait);
            const { ref, get, db } = window._fb;
            get(ref(db, `users/${username}`)).then(snap => {
              if (snap.exists()) _setLoggedIn(username, snap.val().admin);
            }).catch(() => {});
          }, 300);
        }
      } catch(e) {}
    }
  }

  return { init, login, register, signOut, saveAll };
})();

document.addEventListener('DOMContentLoaded', () => setTimeout(() => Account.init(), 600));
