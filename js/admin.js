/**
 * PARTICLE WORLD v2.0 — js/admin.js
 */
'use strict';

const Admin = (() => {
  function buildPanel() {
    const panels = document.getElementById('panels');
    if (!panels) return;
    const div = document.createElement('div');
    div.className = 'opanel';
    div.id = 'panAdmin';
    div.innerHTML = `
    <div class="opbox" style="max-width:500px;">
      <h2>⚙ Admin Panel</h2>
      <div class="srow"><span class="slabel">Announcement</span></div>
      <div style="display:flex;gap:6px;margin:6px 0;">
        <input id="adminAnnounce" placeholder="Announcement text..." style="flex:1;background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:4px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;">
        <button class="menu-btn" id="adminSendAnnounce" style="width:auto;padding:6px 12px;">Send</button>
      </div>
      <div class="srow"><span class="slabel">Ban User</span></div>
      <div style="display:flex;gap:6px;margin:6px 0;">
        <input id="adminBanUser" placeholder="Username to ban..." style="flex:1;background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:4px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;">
        <button class="menu-btn" id="adminBanBtn" style="width:auto;padding:6px 12px;border-color:#ff4444;color:#ff4444;">Ban</button>
      </div>
      <div id="adminLog" style="font-size:.55rem;color:#333;margin-top:8px;max-height:80px;overflow-y:auto;"></div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>`;
    panels.appendChild(div);

    document.getElementById('btnAdmin')?.addEventListener('click', () => {
      if (!window._pwIsAdmin) return;
      showPanel('panAdmin');
    });

    document.getElementById('adminSendAnnounce')?.addEventListener('click', () => {
      const text = document.getElementById('adminAnnounce').value.trim();
      if (!text || !window._fb?.ready) return;
      const { ref, set, db } = window._fb;
      set(ref(db, 'announcement'), { text, ts: Date.now(), by: window._pwUsername });
      document.getElementById('adminLog').textContent = 'Announcement sent!';
    });

    document.getElementById('adminBanBtn')?.addEventListener('click', () => {
      const user = document.getElementById('adminBanUser').value.trim();
      if (!user || !window._fb?.ready) return;
      const { ref, set, db } = window._fb;
      set(ref(db, `bans/${user}`), { by: window._pwUsername, ts: Date.now() });
      document.getElementById('adminLog').textContent = `Banned ${user}`;
    });
  }

  return { init() { buildPanel(); } };
})();

document.addEventListener('DOMContentLoaded', () => setTimeout(() => Admin.init(), 700));
