/**
 * PARTICLE WORLD v2.0 — js/ui.js
 * Sidebar, panels, toolbar, search, tooltips, menu.
 */

'use strict';

const CATEGORIES = [
  { id: 'powders',    label: '🪨 Powders' },
  { id: 'liquids',   label: '💧 Liquids' },
  { id: 'gases',     label: '💨 Gases' },
  { id: 'solids',    label: '🧱 Solids' },
  { id: 'fire',      label: '🔥 Fire' },
  { id: 'explosives',label: '💥 Explosives' },
  { id: 'nature',    label: '🌿 Nature' },
  { id: 'creatures', label: '🐾 Creatures' },
  { id: 'weather',   label: '🌩 Weather' },
  { id: 'space',     label: '🌌 Space' },
  { id: 'tech',      label: '⚙️ Tech' },
  { id: 'vehicles',  label: '🚗 Vehicles' },
  { id: 'special',   label: '✨ Special' },
  { id: 'molten',    label: '🌋 Molten' },
];

// ── BUILD SIDEBAR ────────────────────────────────────────────────
function buildSidebar() {
  const ss = document.getElementById('ss');
  if (!ss) return;
  ss.innerHTML = '';

  const all = PW.ElementRegistry.allArray().filter(e => !e.hidden);

  for (const cat of CATEGORIES) {
    const elems = all.filter(e => e.category === cat.id);
    if (!elems.length) continue;

    const label = document.createElement('div');
    label.className = 'cat-label';
    label.textContent = cat.label;
    ss.appendChild(label);

    for (const def of elems) {
      const btn = document.createElement('button');
      btn.className = 'eb';
      btn.dataset.id = def.id;
      btn.title = def.desc || def.name;

      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = typeof def.color === 'string' ? def.color : '#888';

      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(def.name));
      btn.addEventListener('click', () => selectElement(def.id));
      ss.appendChild(btn);
    }
  }
}

function selectElement(id) {
  PW.Input.setElement(id);
  document.querySelectorAll('.eb').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
  document.getElementById('btmSel').textContent = id;
}

// ── SEARCH ───────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('elemSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.eb').forEach(btn => {
      const id = btn.dataset.id;
      const def = PW.ElementRegistry.get(id);
      const match = !q ||
        id.includes(q) ||
        def?.name?.toLowerCase().includes(q) ||
        def?.tags?.some(t => t.includes(q));
      btn.style.display = match ? '' : 'none';
    });
    // Show/hide cat labels
    document.querySelectorAll('.cat-label').forEach(label => {
      let next = label.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('cat-label')) {
        if (next.style.display !== 'none') hasVisible = true;
        next = next.nextElementSibling;
      }
      label.style.display = hasVisible ? '' : 'none';
    });
  });
}

// ── TOOLBAR BUTTONS ───────────────────────────────────────────────
function initToolbar() {
  const { Simulation, Grid } = PW;

  document.getElementById('btnPause')?.addEventListener('click', () => {
    const running = Simulation.toggle();
    document.getElementById('btnPause').textContent = running ? '⏸' : '▶';
    document.getElementById('btnPause').classList.toggle('active', !running);
  });

  document.getElementById('btnClear')?.addEventListener('click', () => {
    Grid.clear();
  });

  document.getElementById('btnGrid')?.addEventListener('click', function() {
    this.classList.toggle('active');
    // Grid overlay handled by renderer
    window._showGrid = this.classList.contains('active');
  });

  document.getElementById('btnHeat')?.addEventListener('click', function() {
    this.classList.toggle('active');
    const hmc = document.getElementById('hmc');
    if (hmc) hmc.style.opacity = this.classList.contains('active') ? '0.6' : '0';
  });

  document.getElementById('btnRain')?.addEventListener('click', function() {
    this.classList.toggle('active');
    window._rainMode = this.classList.contains('active');
  });

  document.getElementById('btnMenu')?.addEventListener('click', () => {
    document.getElementById('panMenu')?.classList.add('open');
  });

  // Brush size
  const rBrush = document.getElementById('rBrush');
  const vBrush = document.getElementById('vBrush');
  rBrush?.addEventListener('input', () => {
    const v = +rBrush.value;
    PW.Input.setBrush(v);
    vBrush.textContent = v;
  });

  // Sim speed
  const rSpeed = document.getElementById('rSpeed');
  const vSpeed = document.getElementById('vSpeed');
  rSpeed?.addEventListener('input', () => {
    const v = +rSpeed.value;
    PW.Simulation.setSpeed(v);
    vSpeed.textContent = v;
  });

  // Rain mode tick
  setInterval(() => {
    if (!window._rainMode) return;
    const cols = PW.Grid.cols;
    for (let i = 0; i < 3; i++) {
      const rx = Math.floor(Math.random() * cols);
      if (PW.Grid.isEmpty(rx, 0)) PW.Grid.setCell(rx, 0, 'rain');
    }
  }, 50);
}

// ── PANELS ───────────────────────────────────────────────────────
function buildPanels() {
  const container = document.getElementById('panels');
  if (!container) return;

  container.innerHTML = `
  <!-- MENU PANEL -->
  <div class="opanel" id="panMenu">
    <div class="opbox" style="max-width:400px;text-align:center;">
      <div class="pw-logo" style="font-size:2rem;margin-bottom:.5rem;">P<span style="color:#a855f7">W</span></div>
      <div class="beta-pill" style="margin-bottom:1.5rem;">v2.0.0 — Beta</div>
      <button class="menu-btn primary" onclick="closePanels()">▶ Continue</button>
      <button class="menu-btn" onclick="showPanel('panSettings')">⚙ Settings</button>
      <button class="menu-btn" onclick="showPanel('panLog')">📋 Update Log</button>
      <button class="menu-btn" onclick="showPanel('panCredits')">✦ Credits</button>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <!-- SETTINGS PANEL -->
  <div class="opanel" id="panSettings">
    <div class="opbox">
      <h2>⚙ Settings</h2>
      <div class="srow">
        <span class="slabel">Cell Size (restart needed)</span>
        <select id="setCellSize" onchange="localStorage.setItem('pw_cellSize',this.value)">
          <option value="2">2px — Ultra HD</option>
          <option value="3" selected>3px — Default</option>
          <option value="4">4px — Performance</option>
          <option value="5">5px — Low-end</option>
        </select>
      </div>
      <div class="srow">
        <span class="slabel">Simulation Speed</span>
        <input type="range" min="1" max="8" value="2" oninput="PW.Simulation.setSpeed(+this.value)">
      </div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <!-- UPDATE LOG PANEL -->
  <div class="opanel" id="panLog">
    <div class="opbox">
      <h2>📋 Update Log</h2>
      <div class="log-entry current">
        <div class="log-ver">v2.0.0 — Full Remake 🏗</div>
        <div class="log-date">Latest version</div>
        <div style="font-size:.52rem;color:#a855f7;letter-spacing:.1em;margin:8px 0 5px;border-bottom:1px solid #1a1a2a;padding-bottom:3px;">🏗 FULL REMAKE</div>
        <div class="log-item">Complete rewrite from scratch — zero spaghetti, proper architecture</div>
        <div class="log-item">Each element is a clean self-contained object with its own tick function</div>
        <div class="log-item">Grid uses objects per cell instead of parallel arrays</div>
        <div class="log-item">Code split into multiple files — elements, ui, chat, multiplayer etc. all separate</div>
        <div class="log-item">ElementRegistry system — mods register the same way as built-in elements</div>
        <div class="log-item">Multiplayer sync rewritten for proper grid diffing</div>
        <div class="log-item change">Version: v1.2.3 → v2.0.0</div>
      </div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <!-- CREDITS PANEL -->
  <div class="opanel" id="panCredits">
    <div class="opbox" style="text-align:center;">
      <div class="pw-logo" style="font-size:1.5rem;">P<span style="color:#a855f7">W</span></div>
      <div style="font-size:.55rem;color:#333;letter-spacing:.2em;margin-bottom:1.5rem;">v2.0.0 BETA · A PHYSICS SANDBOX</div>
      <h3>Made by</h3>
      <p style="color:#a855f7;font-family:'Syne',sans-serif;font-size:.9rem;">omelette180</p>
      <p>Built with pure HTML5 Canvas + Firebase</p>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <!-- TOOLTIP -->
  <div id="elemTip">
    <div class="tip-name" id="tipName"></div>
    <div class="tip-desc" id="tipDesc"></div>
    <div class="tip-tags" id="tipTags"></div>
    <div class="tip-flavor" id="tipFlavor"></div>
  </div>
  `;
}

function showPanel(id) {
  closePanels();
  document.getElementById(id)?.classList.add('open');
}

function closePanels() {
  document.querySelectorAll('.opanel').forEach(p => p.classList.remove('open'));
}

window.showPanel  = showPanel;
window.closePanels = closePanels;

// ── TOOLTIP ──────────────────────────────────────────────────────
function initTooltip() {
  const tip  = document.getElementById('elemTip');
  const name = document.getElementById('tipName');
  const desc = document.getElementById('tipDesc');
  const tags = document.getElementById('tipTags');
  const flav = document.getElementById('tipFlavor');
  if (!tip) return;

  let hoverTimer;
  document.querySelectorAll('.eb').forEach(btn => {
    btn.addEventListener('mouseenter', e => {
      hoverTimer = setTimeout(() => {
        const def = PW.ElementRegistry.get(btn.dataset.id);
        if (!def) return;
        name.textContent  = def.name;
        desc.textContent  = def.desc || '';
        tags.textContent  = def.tags?.join(' · ') || '';
        flav.textContent  = def.flavor || '';
        tip.style.display = 'block';
        tip.style.left    = (e.clientX + 14) + 'px';
        tip.style.top     = (e.clientY - 10) + 'px';
      }, 400);
    });
    btn.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      tip.style.display = 'none';
    });
  });
}

// ── POSITION DISPLAY ─────────────────────────────────────────────
function initPositionDisplay() {
  const canvas = document.getElementById('gc');
  const btmPos = document.getElementById('btmPos');
  const btmInfo = document.getElementById('btmInfo');
  if (!canvas || !btmPos) return;

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const cellSize = parseInt(localStorage.getItem('pw_cellSize') || '3');
    const x = Math.floor((e.clientX - rect.left) / rect.width * canvas.width / cellSize);
    const y = Math.floor((e.clientY - rect.top)  / rect.height * canvas.height / cellSize);
    btmPos.textContent = `${x}, ${y}`;
    const cell = PW.Grid.getCell(x, y);
    if (cell && cell.type !== 'empty') {
      const def = PW.ElementRegistry.get(cell.type);
      btmInfo.textContent = `${def?.name || cell.type} | heat: ${Math.round(cell.heat ?? 0)}`;
    } else {
      btmInfo.textContent = '';
    }
  });
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        PW.Simulation.toggle();
        break;
      case 'KeyC':
        if (e.ctrlKey) { e.preventDefault(); PW.Grid.clear(); }
        break;
      case 'Escape':
        closePanels();
        break;
      case 'BracketLeft':
        PW.Input.setBrush(Math.max(1, PW.Input.brushSize - 1));
        document.getElementById('rBrush').value = PW.Input.brushSize;
        document.getElementById('vBrush').textContent = PW.Input.brushSize;
        break;
      case 'BracketRight':
        PW.Input.setBrush(Math.min(40, PW.Input.brushSize + 1));
        document.getElementById('rBrush').value = PW.Input.brushSize;
        document.getElementById('vBrush').textContent = PW.Input.brushSize;
        break;
    }
  });
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // PW is set at module level in core.js so it's available immediately
  buildPanels();
  buildSidebar();
  initSearch();
  initToolbar();
  initTooltip();
  initPositionDisplay();
  initKeyboard();
  initGame();

  // Default selection
  selectElement('sand');

  // Show game, hide loader
  PW_setLoadProgress(100, 'Ready!');
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade');
    document.getElementById('game').classList.add('show');
    setTimeout(() => {
      document.getElementById('loader').style.display = 'none';
    }, 1000);
  }, 300);
});
