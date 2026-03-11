/**
 * PARTICLE WORLD v2.0 — js/chat.js
 * Global chat via Firebase. Kept exactly as it worked in v1.2.
 */

'use strict';

const Chat = (() => {
  let _initialized = false;
  let _lastSent    = 0;
  const RATE_LIMIT = 800; // ms

  function _usernameColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFFFF;
    const hue = (h >> 8) % 360;
    return `hsl(${hue},70%,65%)`;
  }

  function _addMessage(username, text, ts) {
    const box = document.getElementById('chatMessages');
    if (!box) return;
    const row = document.createElement('div');
    row.style.cssText = 'margin:2px 0;line-height:1.5;';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = username + ': ';
    nameSpan.style.color = _usernameColor(username);
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    textSpan.style.color = '#555';
    row.appendChild(nameSpan);
    row.appendChild(textSpan);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;

    // Trim to 80 messages
    while (box.children.length > 80) box.removeChild(box.firstChild);

    // Badge if hidden
    if (document.getElementById('chatPanel')?.style.display === 'none') {
      const badge = document.getElementById('chatUnreadBadge');
      if (badge) {
        badge.style.display = 'inline';
        badge.textContent   = +badge.textContent + 1;
      }
    }
  }

  function _send() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const now  = Date.now();
    if (now - _lastSent < RATE_LIMIT) return;
    _lastSent = now;
    input.value = '';

    const fb = window._fb;
    if (!fb?.ready) return;

    const username = window._pwUsername || 'Guest';
    const { ref, push, db } = fb;
    push(ref(db, 'globalChat'), {
      username,
      text: text.slice(0, 200),
      ts:   now,
    });
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    // Wait for Firebase
    const wait = setInterval(() => {
      const fb = window._fb;
      if (!fb?.ready) return;
      clearInterval(wait);

      const { ref, db, query, limitToLast, onChildAdded } = fb;
      const chatRef = query(ref(db, 'globalChat'), limitToLast(50));
      onChildAdded(chatRef, snap => {
        const { username, text, ts } = snap.val();
        _addMessage(username, text, ts);
      });
    }, 200);

    // Toggle chat
    document.getElementById('chatPill')?.addEventListener('click', () => {
      const panel = document.getElementById('chatPanel');
      const badge = document.getElementById('chatUnreadBadge');
      if (!panel) return;
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'block';
      if (!open && badge) { badge.style.display = 'none'; badge.textContent = '0'; }
    });

    document.getElementById('chatSend')?.addEventListener('click', _send);
    document.getElementById('chatInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') _send();
    });

    document.getElementById('btnChat')?.addEventListener('click', () => {
      const panel = document.getElementById('chatPanel');
      if (panel) panel.style.display = panel.style.display !== 'none' ? 'none' : 'block';
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => Chat.init(), 500);
});
