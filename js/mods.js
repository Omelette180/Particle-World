/**
 * PARTICLE WORLD v2.0 — js/mods.js
 * Element creator and mod studio.
 * Mods use the same ElementRegistry.registerMod() as built-ins.
 */
'use strict';

const Mods = (() => {
  const STORAGE_KEY = 'pw_mods_v2';

  function _loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch(e) { return []; }
  }

  function _save(mods) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
  }

  function installMod(def) {
    // Build tick from behavior string
    def.tick = _buildTick(def.behavior, def);
    def.color = def.colorHex || '#888888';
    PW.ElementRegistry.registerMod(def);
    // Add to sidebar
    _addToSidebar(def);
  }

  function _buildTick(behavior, def) {
    switch (behavior) {
      case 'powder':
        return (x, y, grid, h) => h.fallBelow(x, y);
      case 'liquid':
        return (x, y, grid, h) => { if (!h.fallBelow(x, y)) h.flowSideways(x, y, 3); };
      case 'gas':
        return (x, y, grid, h) => {
          const cell = grid.getCell(x, y);
          cell.energy = (cell.energy ?? 60) - 0.3;
          if (cell.energy <= 0) { grid.clearCell(x, y); return; }
          h.riseUp(x, y);
        };
      case 'solid':
        return (x, y, grid, h) => {};
      case 'fire':
        return (x, y, grid, h) => {
          const cell = grid.getCell(x, y);
          cell.energy = (cell.energy ?? 60) - 1;
          if (cell.energy <= 0) { grid.clearCell(x, y); return; }
          h.riseUp(x, y);
          for (const [nx, ny] of h.neighbors4(x, y)) h.addHeat(nx, ny, 10);
        };
      default:
        return (x, y, grid, h) => h.fallBelow(x, y);
    }
  }

  function _addToSidebar(def) {
    const ss = document.getElementById('ss');
    if (!ss) return;

    // Find or create Mods category
    let modLabel = ss.querySelector('[data-mod-label]');
    if (!modLabel) {
      modLabel = document.createElement('div');
      modLabel.className = 'cat-label';
      modLabel.dataset.modLabel = '1';
      modLabel.textContent = '🧩 Mods';
      ss.appendChild(modLabel);
    }

    const btn = document.createElement('button');
    btn.className = 'eb';
    btn.dataset.id = def.id;
    btn.title = def.desc || def.name;

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = def.colorHex || '#888';
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode(def.name));
    btn.addEventListener('click', () => window.selectElement?.(def.id));
    ss.appendChild(btn);
  }

  function buildPanel() {
    const panels = document.getElementById('panels');
    if (!panels) return;
    const div = document.createElement('div');
    div.className = 'opanel';
    div.id = 'panMods';
    div.innerHTML = `
    <div class="opbox" style="max-width:500px;">
      <h2>🧩 Element Creator</h2>
      <p style="margin-bottom:12px;">Create custom elements that behave like built-in ones.</p>

      <div class="srow"><span class="slabel">Element ID</span>
        <input id="modId" placeholder="my_element" maxlength="30"
          style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:3px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;">
      </div>
      <div class="srow"><span class="slabel">Name</span>
        <input id="modName" placeholder="My Element" maxlength="30"
          style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:3px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;">
      </div>
      <div class="srow"><span class="slabel">Color</span>
        <input type="color" id="modColor" value="#aa44ff">
      </div>
      <div class="srow"><span class="slabel">Behavior</span>
        <select id="modBehavior" style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:3px 6px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;">
          <option value="powder">Powder (falls, piles)</option>
          <option value="liquid">Liquid (flows)</option>
          <option value="gas">Gas (rises, fades)</option>
          <option value="solid">Solid (static)</option>
          <option value="fire">Fire (burns, fades)</option>
        </select>
      </div>
      <div class="srow"><span class="slabel">Description</span>
        <input id="modDesc" placeholder="What does it do?" maxlength="100"
          style="background:#0a0a0a;border:1px solid #1a1a1a;color:#bbb;padding:3px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:.63rem;outline:none;flex:1;">
      </div>

      <div style="display:flex;gap:6px;margin-top:12px;">
        <button class="menu-btn primary" id="modCreate" style="width:auto;padding:8px 16px;">✦ Create Element</button>
      </div>
      <div id="modMsg" style="font-size:.6rem;color:#ff4444;margin-top:6px;min-height:1em;"></div>

      <h3 style="margin-top:16px;">Installed Mods</h3>
      <div id="modList" style="font-size:.6rem;color:#333;margin-top:4px;"></div>

      <button class="op-close" onclick="closePanels()">Close</button>
    </div>`;
    panels.appendChild(div);

    document.getElementById('modCreate')?.addEventListener('click', () => {
      const id       = document.getElementById('modId').value.trim().replace(/\s/g,'_').toLowerCase();
      const name     = document.getElementById('modName').value.trim();
      const colorHex = document.getElementById('modColor').value;
      const behavior = document.getElementById('modBehavior').value;
      const desc     = document.getElementById('modDesc').value.trim();
      const msg      = document.getElementById('modMsg');

      if (!id || !name) { msg.textContent = 'ID and Name required'; return; }
      if (PW.ElementRegistry.has(id)) { msg.textContent = `ID "${id}" already exists`; return; }

      const def = { id, name, colorHex, behavior, desc, category: 'mods' };
      installMod(def);

      // Save
      const saved = _loadSaved();
      saved.push(def);
      _save(saved);

      msg.textContent = `✓ "${name}" created!`;
      msg.style.color = '#44ffaa';
      _refreshModList();
    });
  }

  function _refreshModList() {
    const list = document.getElementById('modList');
    if (!list) return;
    const saved = _loadSaved();
    if (!saved.length) { list.textContent = 'No mods installed.'; return; }
    list.innerHTML = saved.map(m =>
      `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
        <span style="width:10px;height:10px;border-radius:2px;background:${m.colorHex};display:inline-block;"></span>
        <span style="color:#555;">${m.name}</span>
        <span style="color:#252525;">(${m.id})</span>
      </div>`
    ).join('');
  }

  function init() {
    buildPanel();

    // Restore saved mods
    setTimeout(() => {
      for (const def of _loadSaved()) {
        if (!PW.ElementRegistry.has(def.id)) installMod(def);
      }
      _refreshModList();
    }, 1100);
  }

  return { init, installMod };
})();

document.addEventListener('DOMContentLoaded', () => setTimeout(() => Mods.init(), 1000));
