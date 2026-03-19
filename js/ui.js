/**
 * PARTICLE WORLD v1.3 Beta — js/ui.js
 * FIXED: All element IDs now match index.html exactly.
 * Bugs fixed:
 *  - btnPause→bPause, btnClear→bClear, btnGrid→bGrid, btnHeat→bHeat,
 *    btnRain→bRain, btnMenu→bMenu
 *  - statFps→sF, statParts→sP
 *  - rBrush→bR, vBrush→bV, rSpeed→spR, vSpeed→spV
 *  - data-e→data-id on element buttons (buildSidebar rebuilds sidebar cleanly)
 *  - btmSel/btmPos/btmInfo removed (don't exist in HTML, use sSel/sP/sF)
 */

'use strict';

const CATEGORIES = [
  { id: 'powders',    label: '🪨 Powders'    },
  { id: 'liquids',   label: '💧 Liquids'    },
  { id: 'gases',     label: '💨 Gases'      },
  { id: 'energy',    label: '🔥 Energy'     },
  { id: 'solids',    label: '🧱 Solids'     },
  { id: 'explosives',label: '💥 Explosives' },
  { id: 'nature',    label: '🌿 Nature'     },
  { id: 'creatures', label: '🐾 Creatures'  },
  { id: 'weather',   label: '🌩 Weather'    },
  { id: 'space',     label: '🌌 Space'      },
  { id: 'tech',      label: '⚙️ Tech'       },
  { id: 'vehicles',  label: '🚗 Vehicles'   },
  { id: 'special',   label: '✨ Special'    },
  { id: 'molten',    label: '🌋 Molten'     },
];

// ── BUILD SIDEBAR ─────────────────────────────────────────────────
function buildSidebar() {
  const ss = document.getElementById('ss');
  if (!ss) { console.error('[UI] #ss not found'); return; }
  ss.innerHTML = '';

  const all = PW.ElementRegistry.allArray().filter(e => !e.hidden);
  console.log(`[UI] Building sidebar with ${all.length} elements`);

  for (const cat of CATEGORIES) {
    const elems = all.filter(e => e.category === cat.id);
    if (!elems.length) continue;

    const label = document.createElement('div');
    label.className = 'cat';
    label.textContent = cat.label;
    ss.appendChild(label);

    for (const def of elems) {
      const btn = document.createElement('button');
      btn.className = 'eb';
      btn.dataset.id = def.id;
      // Keep data-e for backwards compat with any old handlers
      btn.dataset.e  = def.id;
      btn.title = def.desc || def.name;

      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.background = typeof def.color === 'string' ? def.color : '#888';

      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(def.name));
      btn.addEventListener('click', () => selectElement(def.id));
      ss.appendChild(btn);
    }
  }

  // Re-init tooltip after rebuild
  initTooltip();
}

function selectElement(id) {
  if (!PW.ElementRegistry.has(id)) {
    console.warn('[UI] Unknown element:', id);
    return;
  }
  PW.Input.setElement(id);
  document.querySelectorAll('.eb').forEach(b => {
    b.classList.toggle('sel', b.dataset.id === id || b.dataset.e === id);
  });
  // Update both possible selected element displays
  const sSel = document.getElementById('sSel');
  if (sSel) sSel.textContent = id;
  const proSelName = document.getElementById('proSelName');
  if (proSelName) proSelName.textContent = id;
}
window.selectElement = selectElement;

// ── SEARCH ────────────────────────────────────────────────────────
function initSearch() {
  // Classic sidebar search
  const input = document.getElementById('elemSearch');
  if (input) {
    input.addEventListener('input', () => filterSidebar(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('.eb:not([style*="none"])');
        if (first) first.click();
      }
      if (e.key === 'Escape') { input.value = ''; filterSidebar(''); }
    });
  }

  // Pro layout search
  const proInput = document.getElementById('proSearch');
  if (proInput) {
    proInput.addEventListener('input', () => filterSidebar(proInput.value));
  }
}

function filterSidebar(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll('#ss .eb').forEach(btn => {
    const id  = btn.dataset.id || btn.dataset.e || '';
    const def = PW.ElementRegistry.get(id);
    const match = !q ||
      id.includes(q) ||
      def?.name?.toLowerCase().includes(q) ||
      def?.tags?.some(t => t.toLowerCase().includes(q));
    btn.style.display = match ? '' : 'none';
  });
  // Hide/show category labels
  document.querySelectorAll('#ss .cat').forEach(label => {
    let next = label.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('cat')) {
      if (next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    label.style.display = hasVisible ? '' : 'none';
  });
}

// ── TOOLBAR BUTTONS ───────────────────────────────────────────────
function initToolbar() {
  const { Simulation, Grid } = PW;

  // Pause — HTML id is bPause
  const bPause = document.getElementById('bPause');
  if (bPause) {
    bPause.addEventListener('click', () => {
      const running = Simulation.toggle();
      bPause.textContent = running ? '⏸' : '▶';
      bPause.classList.toggle('active', !running);
    });
  }

  // Step
  const bStep = document.getElementById('bStep');
  if (bStep) {
    bStep.addEventListener('click', () => {
      if (!Simulation.running) {
        // Do one tick manually
        Simulation.resume();
        setTimeout(() => Simulation.pause(), 50);
      }
    });
  }

  // Clear — HTML id is bClear
  document.getElementById('bClear')?.addEventListener('click', () => Grid.clear());

  // Grid overlay — HTML id is bGrid
  document.getElementById('bGrid')?.addEventListener('click', function() {
    this.classList.toggle('active');
    window._showGrid = this.classList.contains('active');
  });

  // Heat map — HTML id is bHeat
  document.getElementById('bHeat')?.addEventListener('click', function() {
    this.classList.toggle('active');
    const hmc = document.getElementById('hmc');
    if (hmc) hmc.style.opacity = this.classList.contains('active') ? '0.6' : '0';
  });

  // Rain — HTML id is bRain
  document.getElementById('bRain')?.addEventListener('click', function() {
    this.classList.toggle('active');
    window._rainMode = this.classList.contains('active');
  });

  // Menu — HTML id is bMenu (or btnMenu from menu button in original)
  document.getElementById('bMenu')?.addEventListener('click', () => showPanel('panMenu'));
  document.getElementById('btnMenu')?.addEventListener('click', () => showPanel('panMenu'));

  // Log button
  document.getElementById('bLog')?.addEventListener('click', () => showPanel('panLog'));

  // Save button
  document.getElementById('bSave')?.addEventListener('click', () => {
    const m = document.getElementById('mSave');
    if (m) m.classList.add('open');
  });

  // Chaos
  document.getElementById('bChaos')?.addEventListener('click', () => {
    const cols = Grid.cols, rows = Grid.rows;
    const elems = PW.ElementRegistry.allArray().filter(e => !e.hidden);
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      const e = elems[Math.floor(Math.random() * elems.length)];
      if (Grid.isEmpty(x, y)) Grid.setCell(x, y, e.id);
    }
  });

  // Disaster modal
  document.getElementById('bDisaster')?.addEventListener('click', () => {
    const m = document.getElementById('mDisaster');
    if (m) m.classList.add('open');
  });
  document.getElementById('cDisaster')?.addEventListener('click', () => {
    document.getElementById('mDisaster')?.classList.remove('open');
  });
  document.querySelectorAll('.dbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      doDisaster(btn.dataset.d);
      document.getElementById('mDisaster')?.classList.remove('open');
    });
  });

  // Zombie wave
  document.getElementById('bZombie')?.addEventListener('click', () => {
    const cols = Grid.cols, rows = Grid.rows;
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows * 0.3);
      Grid.setCell(x, y, 'zombie');
    }
  });

  // Alien invasion
  document.getElementById('bAlien')?.addEventListener('click', () => {
    const cols = Grid.cols;
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * cols);
      Grid.setCell(x, 2, 'ufo');
    }
  });

  // Mods
  document.getElementById('bMods')?.addEventListener('click', () => showPanel('panMods'));

  // Achievements
  document.getElementById('bAch')?.addEventListener('click', () => showPanel('panAch'));

  // Brush size — HTML id is bR and bV
  const bR = document.getElementById('bR');
  const bV = document.getElementById('bV');
  if (bR) {
    bR.addEventListener('input', () => {
      const v = +bR.value;
      PW.Input.setBrush(v);
      if (bV) bV.textContent = v;
    });
  }

  // Sim speed — HTML ids are spR and spV
  const spR = document.getElementById('spR');
  const spV = document.getElementById('spV');
  if (spR) {
    spR.addEventListener('input', () => {
      const v = +spR.value;
      PW.Simulation.setSpeed(v);
      if (spV) spV.textContent = v + 'x';
      const spdbadge = document.getElementById('spdbadge');
      if (spdbadge) spdbadge.textContent = v + 'x';
    });
  }

  // Modal closes
  document.getElementById('cSave')?.addEventListener('click', () => document.getElementById('mSave')?.classList.remove('open'));
  document.getElementById('cRecipes')?.addEventListener('click', () => document.getElementById('mRecipes')?.classList.remove('open'));
  document.getElementById('bRecipes')?.addEventListener('click', () => document.getElementById('mRecipes')?.classList.add('open'));

  // Rain mode tick
  setInterval(() => {
    if (!window._rainMode) return;
    const cols = PW.Grid.cols;
    for (let i = 0; i < 3; i++) {
      const rx = Math.floor(Math.random() * cols);
      if (PW.Grid.isEmpty(rx, 0)) PW.Grid.setCell(rx, 0, 'water');
    }
  }, 50);
}

// ── DISASTER HANDLER ──────────────────────────────────────────────
function doDisaster(type) {
  const { Grid } = PW;
  const cols = Grid.cols, rows = Grid.rows;
  const rnd = Math.random.bind(Math);
  const set = (x, y, t) => { if (Grid.inBounds(x, y)) Grid.setCell(x, y, t); };

  switch (type) {
    case 'meteor_shower':
      for (let i = 0; i < 15; i++) setTimeout(() => set(0|rnd()*cols, 0, 'meteor'), i*200 + rnd()*400);
      break;
    case 'earthquake':
      for (let i = 0; i < 30; i++) setTimeout(() => {
        const cx=0|rnd()*cols, cy=0|rnd()*rows;
        PW.Helpers.explode(cx, cy, 5, {strength:0.8, shake:true});
      }, i*100);
      break;
    case 'volcano':
      for (let i = 0; i < 20; i++) {
        const cx=0|cols/2 + (rnd()-.5)*20;
        set(cx, rows-1, 'lava');
        set(cx, rows-2, 'lava');
      }
      break;
    case 'radiation_storm':
      for (let i = 0; i < 40; i++) set(0|rnd()*cols, 0|rnd()*rows*0.3, 'radiation');
      break;
    case 'blackhole_event':
      set(0|cols/2, 0|rows/2, 'blackhole');
      break;
    case 'blizzard':
      for (let x = 0; x < cols; x+=2) if (rnd()<.6) set(x, 0, 'snow');
      break;
    case 'acid_rain':
      for (let x = 0; x < cols; x+=3) if (rnd()<.5) set(x, 0, 'acid');
      break;
    case 'lightning_storm':
      for (let i = 0; i < 8; i++) setTimeout(() => set(0|rnd()*cols, 0, 'lightning'), i*300);
      break;
    case 'tsunami':
      for (let y = 0; y < rows; y++) for (let i = 0; i < 5; i++) set(i, y, 'water');
      break;
    case 'alien_attack':
      for (let i = 0; i < 8; i++) set(0|rnd()*cols, 2, 'ufo');
      break;
  }
}
window.doDisaster = doDisaster;

// ── PANELS ────────────────────────────────────────────────────────
function buildPanels() {
  const container = document.getElementById('panels');
  if (!container) return;

  container.innerHTML = `
  <div class="opanel" id="panMenu">
    <div class="opbox" style="max-width:400px;text-align:center;">
      <div class="pw-logo" style="font-size:2rem;margin-bottom:.5rem;">P<span style="color:#a855f7">W</span></div>
      <div class="beta-pill" style="margin-bottom:1.5rem;">v1.3.0 Beta</div>
      <button class="menu-btn primary" onclick="closePanels()">▶ Continue</button>
      <button class="menu-btn" onclick="showPanel('panSettings')">⚙ Settings</button>
      <button class="menu-btn" onclick="showPanel('panLog')">📋 Update Log</button>
      <button class="menu-btn" onclick="showPanel('panRoadmap')">🗺 Roadmap</button>
      <button class="menu-btn" onclick="showPanel('panCredits')">✦ Credits</button>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <div class="opanel" id="panSettings">
    <div class="opbox" style="max-width:520px;padding:0;overflow:hidden;border-radius:8px;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0d0d1a,#130d1f);padding:1.4rem 1.8rem 1rem;border-bottom:1px solid #1a1a2a;">
        <div style="font-family:'Syne',sans-serif;font-size:1rem;color:#a855f7;letter-spacing:.08em;font-weight:700;">⚙ SETTINGS</div>
        <div style="font-size:.5rem;color:#333;letter-spacing:.15em;margin-top:2px;">PARTICLE WORLD v1.3 Beta</div>
      </div>

      <!-- Tabs -->
      <div id="setTabBar" style="display:flex;background:#080810;border-bottom:1px solid #111122;">
        <button class="set-tab active" data-tab="setTabSim"   onclick="switchSetTab(this)">🧪 Simulation</button>
        <button class="set-tab"        data-tab="setTabVis"   onclick="switchSetTab(this)">🎨 Display</button>
        <button class="set-tab"        data-tab="setTabCtrl"  onclick="switchSetTab(this)">🎮 Controls</button>
        <button class="set-tab"        data-tab="setTabPerf"  onclick="switchSetTab(this)">⚡ Performance</button>
      </div>

      <div style="padding:1.2rem 1.6rem 1.4rem;min-height:260px;">

        <!-- ── SIMULATION TAB ── -->
        <div id="setTabSim" class="set-panel active">

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">⏱</span>
              <div>
                <div class="set-name">Simulation Speed</div>
                <div class="set-hint">Ticks per frame. Higher = faster physics.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <input type="range" id="setSpd" min="1" max="10" value="2"
                oninput="document.getElementById('setSpdV').textContent=this.value+'x';
                         if(window.PW)PW.Simulation.setSpeed(+this.value);
                         const spR=document.getElementById('spR');if(spR)spR.value=this.value;
                         const spV=document.getElementById('spV');if(spV)spV.textContent=this.value+'x';">
              <span id="setSpdV" class="set-val">2x</span>
            </div>
          </div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">🌡</span>
              <div>
                <div class="set-name">Heat Spread</div>
                <div class="set-hint">How fast heat conducts between cells.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <input type="range" id="setHeat" min="1" max="30" value="10"
                oninput="document.getElementById('setHeatV').textContent=(this.value/10).toFixed(1)+'x';
                         window.heatMult=+this.value/10;">
              <span id="setHeatV" class="set-val">1.0x</span>
            </div>
          </div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">💥</span>
              <div>
                <div class="set-name">Explosion Power</div>
                <div class="set-hint">Multiplier on all explosion radii and damage.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <input type="range" id="setExpl" min="1" max="50" value="10"
                oninput="document.getElementById('setExplV').textContent=(this.value/10).toFixed(1)+'x';
                         window.explMult=+this.value/10;">
              <span id="setExplV" class="set-val">1.0x</span>
            </div>
          </div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">🌊</span>
              <div>
                <div class="set-name">Gravity</div>
                <div class="set-hint">0 = zero-g sandbox. 1 = normal. 2 = heavy.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <input type="range" id="setGrav" min="0" max="20" value="10"
                oninput="document.getElementById('setGravV').textContent=(this.value/10).toFixed(1)+'x';
                         window.gravityMult=+this.value/10;">
              <span id="setGravV" class="set-val">1.0x</span>
            </div>
          </div>

        </div>

        <!-- ── DISPLAY TAB ── -->
        <div id="setTabVis" class="set-panel" style="display:none;">

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">🔲</span>
              <div>
                <div class="set-name">Cell Size</div>
                <div class="set-hint">Pixel size per cell. Restart needed to apply.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <select id="setQ" style="background:#0a0a14;border:1px solid #1a1a2a;color:#888;font-family:'DM Mono',monospace;font-size:.58rem;padding:4px 8px;border-radius:3px;"
                onchange="localStorage.setItem('pw_cellSize',this.value);document.getElementById('setCellSizeHint').style.display='block';">
                <option value="2">2px — Ultra HD</option>
                <option value="3" selected>3px — Default</option>
                <option value="4">4px — Performance</option>
                <option value="5">5px — Low-end</option>
              </select>
            </div>
          </div>
          <div id="setCellSizeHint" style="display:none;font-size:.5rem;color:#ff8800;margin:-8px 0 8px 40px;letter-spacing:.05em;">⚠ Reload page to apply new cell size</div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">✨</span>
              <div>
                <div class="set-name">Glow Effect</div>
                <div class="set-hint">Bloom pass on the canvas. Costs some FPS.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <label class="set-toggle">
                <input type="checkbox" id="setGlow" checked
                  onchange="window.glowOn=this.checked;">
                <span class="set-slider"></span>
              </label>
            </div>
          </div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">📳</span>
              <div>
                <div class="set-name">Screen Shake</div>
                <div class="set-hint">Camera shake on explosions.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <label class="set-toggle">
                <input type="checkbox" id="setShake" checked
                  onchange="window.shakeOn=this.checked;window._shakeEnabled=this.checked;">
                <span class="set-slider"></span>
              </label>
            </div>
          </div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">🎨</span>
              <div>
                <div class="set-name">Theme</div>
                <div class="set-hint">UI color scheme.</div>
              </div>
            </div>
            <div class="set-ctrl" style="gap:5px;">
              <button class="set-theme active" onclick="setTheme('')" data-theme="">Dark</button>
              <button class="set-theme" onclick="setTheme('t-neon')" data-theme="t-neon">Neon</button>
              <button class="set-theme" onclick="setTheme('t-warm')" data-theme="t-warm">Warm</button>
              <button class="set-theme" onclick="setTheme('t-mono')" data-theme="t-mono">Mono</button>
            </div>
          </div>

        </div>

        <!-- ── CONTROLS TAB ── -->
        <div id="setTabCtrl" class="set-panel" style="display:none;">
          <div style="font-size:.56rem;color:#444;line-height:2.2;letter-spacing:.04em;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;">
              <div><span style="color:#a855f7;">LMB</span> — Draw</div>
              <div><span style="color:#a855f7;">RMB</span> — Erase</div>
              <div><span style="color:#a855f7;">SCROLL</span> — Brush size</div>
              <div><span style="color:#a855f7;">[ ]</span> — Brush size</div>
              <div><span style="color:#a855f7;">SPACE</span> — Pause</div>
              <div><span style="color:#a855f7;">H</span> — Heat map</div>
              <div><span style="color:#a855f7;">Ctrl+C</span> — Clear</div>
              <div><span style="color:#a855f7;">ESC</span> — Close panels</div>
            </div>
          </div>
          <div style="margin-top:1rem;font-size:.52rem;color:#333;letter-spacing:.06em;line-height:1.9;">
            <div style="color:#555;margin-bottom:4px;font-size:.5rem;letter-spacing:.1em;">CHEAT CODES — type anywhere in-game</div>
            <div><span style="color:#4a1a6a;">omariscool</span> — unlock admin panel</div>
            <div><span style="color:#4a1a6a;">bigbang</span> — 8 explosions at once</div>
            <div><span style="color:#4a1a6a;">freeze</span> — freeze/unfreeze all particles</div>
            <div><span style="color:#4a1a6a;">supernova</span> — giant star explosion</div>
          </div>
        </div>

        <!-- ── PERFORMANCE TAB ── -->
        <div id="setTabPerf" class="set-panel" style="display:none;">

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">🚀</span>
              <div>
                <div class="set-name">Performance Mode</div>
                <div class="set-hint">Disables glow + shake. Maximises FPS.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <label class="set-toggle">
                <input type="checkbox" id="setPerfMode"
                  onchange="
                    if(this.checked){
                      window.glowOn=false;window.shakeOn=false;window._shakeEnabled=false;
                      document.getElementById('setGlow').checked=false;
                      document.getElementById('setShake').checked=false;
                    }">
                <span class="set-slider"></span>
              </label>
            </div>
          </div>

          <div class="set-row">
            <div class="set-lbl">
              <span class="set-icon">🤖</span>
              <div>
                <div class="set-name">Creature AI</div>
                <div class="set-hint">Disable to improve FPS with many creatures.</div>
              </div>
            </div>
            <div class="set-ctrl">
              <label class="set-toggle">
                <input type="checkbox" id="setAI" checked
                  onchange="window.aiEnabled=this.checked;">
                <span class="set-slider"></span>
              </label>
            </div>
          </div>

          <div style="margin-top:1rem;padding:10px 12px;background:#070710;border:1px solid #111122;border-radius:4px;font-size:.52rem;color:#444;line-height:1.9;font-family:'DM Mono',monospace;">
            <div>FPS: <span style="color:#a855f7;" id="setFpsDisplay">—</span></div>
            <div>Particles: <span style="color:#a855f7;" id="setParticleDisplay">—</span></div>
            <div>Grid: <span style="color:#a855f7;" id="setGridDisplay">—</span></div>
            <div>Elements: <span style="color:#a855f7;" id="setElemDisplay">—</span></div>
          </div>

        </div>

      </div>

      <!-- Footer -->
      <div style="padding:.8rem 1.6rem;background:#050508;border-top:1px solid #0e0e1a;display:flex;justify-content:space-between;align-items:center;">
        <button onclick="
          if(window.PW){PW.Simulation.setSpeed(2);}
          document.getElementById('setSpd').value=2;
          document.getElementById('setSpdV').textContent='2x';
          window.gravityMult=1;window.heatMult=1;window.explMult=1;
          document.getElementById('setGrav').value=10;document.getElementById('setGravV').textContent='1.0x';
          document.getElementById('setHeat').value=10;document.getElementById('setHeatV').textContent='1.0x';
          document.getElementById('setExpl').value=10;document.getElementById('setExplV').textContent='1.0x';"
          style="background:transparent;border:1px solid #1a1a2a;color:#333;font-family:'DM Mono',monospace;font-size:.5rem;padding:5px 12px;cursor:pointer;border-radius:3px;letter-spacing:.08em;">
          Reset Defaults
        </button>
        <button onclick="closePanels()"
          style="background:linear-gradient(135deg,#1a0a2a,#2a0a3a);border:1px solid #a855f7;color:#a855f7;font-family:'DM Mono',monospace;font-size:.55rem;padding:6px 18px;cursor:pointer;border-radius:3px;letter-spacing:.1em;">
          CLOSE
        </button>
      </div>

    </div>
  </div>

  <div class="opanel" id="panLog">
    <div class="opbox">
      <h2>📋 Update Log</h2>

      <div class="log-entry current">
        <div class="log-ver">v1.3.0 — Beta 🔧</div>
        <div class="log-date">March 2026</div>

        <div style="font-size:.52rem;color:#a855f7;letter-spacing:.1em;margin:8px 0 5px;border-bottom:1px solid #1a1a2a;padding-bottom:3px;">🔧 BUG FIXES</div>
        <div class="log-item change">BUG FIX — Elements now appear in sidebar correctly (data-e / data-id mismatch fixed)</div>
        <div class="log-item change">BUG FIX — Admin panel opens with code "omariscool" (all DOM queries deferred to DOMContentLoaded)</div>
        <div class="log-item change">BUG FIX — Toolbar buttons now work (ID mismatches: bPause, bClear, bGrid etc all fixed)</div>
        <div class="log-item change">BUG FIX — FPS and particle counters now update correctly</div>
        <div class="log-item change">BUG FIX — Brush size and sim speed sliders now function</div>
        <div class="log-item change">BUG FIX — applySettings() no longer crashes (v1 globals CELL, simSpeed, bsz, ta replaced with v2 PW API)</div>
        <div class="log-item change">BUG FIX — loader.js startGame() no longer calls undefined loop() and resize()</div>
        <div class="log-item change">BUG FIX — Menu panel buttons now open correct panels (panSet→panSettings, panCred→panCredits etc)</div>
        <div class="log-item change">BUG FIX — Pro dock element buttons now use PW.Input.setElement() instead of broken v1 sel= variable</div>

        <div style="font-size:.52rem;color:#ff8800;letter-spacing:.1em;margin:8px 0 5px;border-bottom:1px solid #1a1a2a;padding-bottom:3px;">⚡ PHYSICS ENGINE</div>
        <div class="log-item">Sandboxels-inspired physics — proper no-noclip powder movement, random side-first diagonal</div>
        <div class="log-item">LIQUID() supports viscosity — honey (0.08) vs water (1.0) vs superfluid (1.0 + wall climbing)</div>
        <div class="log-item">GAS() uses 8-direction shuffled spread every tick — no more directional bias</div>
        <div class="log-item">FIRE() counts down energy and turns to smoke naturally</div>
        <div class="log-item">MOLTEN() emits fire upward at 2.5% per tick — same rate as Sandboxels</div>
        <div class="log-item">Reaction system — Reactions.add('sand', { water: { elem1:'wet_sand', chance:0.02 } })</div>
        <div class="log-item">Chain-reaction explode() — TNT triggers TNT, gas explodes, uranium goes critical</div>
        <div class="log-item">Heat conductivity per element — copper at 0.95, rubber at 0.01, vacuum at 0</div>
        <div class="log-item">Burning system — burnTime/burnInto per element, fire spreads to neighbors via burnAt</div>
        <div class="log-item">Screen shake on explosions via window._shakeEnabled</div>

        <div style="font-size:.52rem;color:#44ff88;letter-spacing:.1em;margin:8px 0 5px;border-bottom:1px solid #1a1a2a;padding-bottom:3px;">🧪 293 ELEMENTS — FULL v1 ROSTER RESTORED + MORE</div>
        <div class="log-item">293 total elements across 14 category files (up from 172)</div>

        <div class="log-item"><b>Creatures (14):</b> Virus, Zombie, Person, Citizen, Police, Wolf, Bear, Bat, Moth, Jellyfish, Octopus, Shark, Whale, Crab — with proper AI (flee, hunt, infect, swim)</div>
        <div class="log-item"><b>Fire &amp; Explosives:</b> Wildfire, Greek Fire, Napalm+, Thermite, Sulfur, Phosphorus, Shrapnel, Acid Rain</div>
        <div class="log-item"><b>Liquids &amp; Chemicals:</b> Poison, Nitric Acid, Soap, Bleach, Resin, Yeast, Seawater, Superfluid, Mercury+</div>
        <div class="log-item"><b>Solids &amp; Minerals:</b> Basalt, Sandstone, Quartz, Pumice, Stalactite, Ash+, Gravel+, Clay, Bone, Wax, Glass+, Steel Beam, Wood Plank, Carpet, Plastic, Polymer, Lead, Gold element</div>
        <div class="log-item"><b>Biology &amp; Lab:</b> Bacteria, Mold, Fungus, Spore, Egg, Larva, Firefly, DNA, Cell, Parasite, Mutant Virus, Ecosystem, Chem A/B/C, Catalyst, Beaker</div>
        <div class="log-item"><b>City:</b> Road, House, Shop, Office, Police Station, Fire Station, Alien, Alien Goo, Alien Beam</div>
        <div class="log-item"><b>Food:</b> Cheese, Bread, Meat, Sugar</div>
        <div class="log-item"><b>Gases:</b> Helium, Argon, Ozone, Spark, Electricity, Solar Wind, Wind</div>
        <div class="log-item"><b>Weather:</b> Fog, Haze, Waterspout, Ball Lightning, Geyser, Dust Devil, Hailstorm</div>
        <div class="log-item"><b>Space &amp; Exotic:</b> Sun, Nebula, Black Dwarf, Pulsar, Magnetar, Quasar, Cosmic Ray, Gamma Burst, Space Dust, Strange Matter, Exotic Matter, Tachyon, Phase Matter, Aether, Nether, God Particle, Philosopher's Stone, Timefreeze, Gravity Dust, Crystal Seed</div>
        <div class="log-item"><b>Tech &amp; Weapons:</b> Turret, Mirror, Shield, Flamethrower, Railgun, Plasma Cannon, Magnet+, Eraser+</div>

        <div style="font-size:.52rem;color:#4ac8ff;letter-spacing:.1em;margin:8px 0 5px;border-bottom:1px solid #1a1a2a;padding-bottom:3px;">🌐 MULTIPLAYER — HOST-AUTHORITY REWRITE</div>
        <div class="log-item">Complete multiplayer architecture overhaul — one world, one simulation, one host</div>
        <div class="log-item">HOST runs PW.Simulation exclusively — it is the only physics brain</div>
        <div class="log-item">HOST receives draw actions from all clients via Firebase, applies them to the ONE grid</div>
        <div class="log-item">HOST broadcasts compressed world diffs every 100ms — only changed cells sent</div>
        <div class="log-item">CLIENTS pause their simulation — they are just "fancy remote controls with screens"</div>
        <div class="log-item">CLIENTS send draw actions → host applies → everyone sees the same result</div>
        <div class="log-item">No more parallel universes — same explosion on every screen</div>
        <div class="log-item">World diff system — MAX 2000 cells per packet to prevent Firebase quota burn</div>
        <div class="log-item">Client draw actions batched every 40ms to reduce Firebase writes</div>
        <div class="log-item">Role badge shows 👑 HOST or 🎮 CLIENT in multiplayer panel</div>
        <div class="log-item">Auto cleanup — host leaving removes entire room, client leaving removes just their player</div>

        <div style="font-size:.52rem;color:#ff88aa;letter-spacing:.1em;margin:8px 0 5px;border-bottom:1px solid #1a1a2a;padding-bottom:3px;">⚙ SETTINGS — REBUILT UI</div>
        <div class="log-item">Settings panel completely redesigned — tabbed layout, clean visuals</div>
        <div class="log-item">Simulation tab: speed, heat spread, explosion power, gravity — all with sliders</div>
        <div class="log-item">Display tab: cell size, glow toggle, screen shake toggle, theme picker</div>
        <div class="log-item">Controls tab: full hotkey reference + cheat code list</div>
        <div class="log-item">Performance tab: AI toggle, performance mode, live FPS/particle/grid/element stats</div>
        <div class="log-item">Theme switcher: Dark, Neon, Warm, Mono — saved to localStorage</div>


        <div class="log-item">Beta warning popup on first visit — "don't show again" checkbox saves to localStorage</div>
        <div class="log-item">Roadmap panel in menu — shows all planned features</div>
        <div class="log-item">Disaster buttons wired up — meteor shower, blizzard, acid rain, earthquake, tsunami and more</div>
        <div class="log-item">Chaos button spawns 500 random elements across the grid</div>
        <div class="log-item">Game renamed from Particle World 2.0 → v1.3 Beta</div>
        <div class="log-item">293 elements restored — full v1 roster ported to the v2 physics architecture</div>
        <div class="log-item">Host-authority multiplayer — one simulation, one world, everyone sees the same thing</div>
        <div class="log-item">Settings panel rebuilt with 4 tabs: Simulation, Display, Controls, Performance</div>

        <div class="log-item change">Version: v1.2.3 → v1.3.0 Beta</div>
      </div>

      <div class="log-entry">
        <div class="log-ver">v2.0.0 — Full Remake 🏗</div>
        <div class="log-date">2025</div>
        <div class="log-item">Complete rewrite — modular JS, ElementRegistry, Grid objects</div>
        <div class="log-item">Code split into multiple files — elements, ui, chat, multiplayer all separate</div>
        <div class="log-item">Multiplayer sync rewritten for proper grid diffing</div>
        <div class="log-item change">Version: v1.2.3 → v2.0.0</div>
      </div>

      <div class="log-entry">
        <div class="log-ver">v1.2.3 — Beta Update 🔒</div>
        <div class="log-date">2025</div>
        <div class="log-item">Domain lock — only runs on official domain</div>
        <div class="log-item">Firebase visitor logging — stolen copies flagged</div>
        <div class="log-item change">Version: v1.2.1 → v1.2.3</div>
      </div>

      <div class="log-entry">
        <div class="log-ver">v1.2.1 — Beta Update ✨</div>
        <div class="log-date">2025</div>
        <div class="log-item">Global chat powered by Firebase</div>
        <div class="log-item">100+ new elements added</div>
        <div class="log-item change">Version: v1.2 → v1.2.1</div>
      </div>

      <div class="log-entry">
        <div class="log-ver">v1.2 — Beta Bug Fix 🔧</div>
        <div class="log-date">2025</div>
        <div class="log-item">Real-time multiplayer with Firebase room system</div>
        <div class="log-item">Admin panel with full world control</div>
        <div class="log-item">Ban system, announcements, player list</div>
        <div class="log-item change">Version: v1.1 → v1.2</div>
      </div>

      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <div class="opanel" id="panRoadmap">
    <div class="opbox">
      <h2>🗺 Roadmap — What's Coming</h2>
      <div style="font-size:.54rem;color:#555;letter-spacing:.1em;margin-bottom:12px;">These are planned features. No promises on order or timing.</div>

      <div class="log-entry">
        <div class="log-ver" style="color:#44ff88;">🔜 Next Up</div>
        <div class="log-item">⚡ <b>Pressure system</b> — explosions create pressure waves, gases compress</div>
        <div class="log-item">🌊 <b>Fluid velocity</b> — liquids have vx/vy for realistic wave behavior</div>
        <div class="log-item">🌡 <b>Better heat map</b> — visible per-cell temperatures with color gradient</div>
        <div class="log-item">💾 <b>World saves</b> — save/load worlds as share codes</div>
        <div class="log-item">🔍 <b>Cell inspector</b> — click any cell to see type, heat, energy, burning state</div>
      </div>

      <div class="log-entry">
        <div class="log-ver" style="color:#a855f7;">🧪 Physics Upgrades</div>
        <div class="log-item">Fluid simulation with proper wave propagation</div>
        <div class="log-item">Wind system — persistent directional forces on gases and powders</div>
        <div class="log-item">Structural integrity — overloaded solids collapse</div>
        <div class="log-item">Thermal expansion — hot metals expand into empty cells</div>
      </div>

      <div class="log-entry">
        <div class="log-ver" style="color:#4ac8ff;">🤖 Creature AI</div>
        <div class="log-item">Pathfinding for citizens — they walk to houses, shops, flee fire</div>
        <div class="log-item">Ecosystem simulation — predators, prey, food chains</div>
        <div class="log-item">Zombie horde behavior — swarm AI, spread tracking</div>
        <div class="log-item">Ant colony AI — tunneling, food hauling, queen protection</div>
      </div>

      <div class="log-entry">
        <div class="log-ver" style="color:#ffaa00;">🗺 World Systems</div>
        <div class="log-item">Biomes — Desert (sand storms), Arctic (instant freeze), Volcano (ambient heat), Space (zero-g)</div>
        <div class="log-item">Weather events — lightning storms, blizzards, acid rain events</div>
        <div class="log-item">Day/night cycle — temperature changes, creatures behave differently</div>
        <div class="log-item">Procedural terrain generation</div>
      </div>

      <div class="log-entry">
        <div class="log-ver" style="color:#ff6644;">⚡ Electricity Expansion</div>
        <div class="log-item">Full circuit system — AND/OR/NOT gates, flip-flops, memory</div>
        <div class="log-item">Motors that actually spin things</div>
        <div class="log-item">Sensors — heat sensors, particle detectors, pressure plates</div>
        <div class="log-item">Displays — pixel arrays controlled by logic</div>
      </div>

      <div class="log-entry">
        <div class="log-ver" style="color:#cc44ff;">🎮 Gameplay</div>
        <div class="log-item">Challenge mode — missions like "stop the flood", "save civilians from lava"</div>
        <div class="log-item">More achievements tied to emergent events</div>
        <div class="log-item">Leaderboard for most particles destroyed, chains triggered, etc.</div>
      </div>

      <div class="log-entry">
        <div class="log-ver" style="color:#888;">🔧 Tech Debt</div>
        <div class="log-item">Spatial grid optimization — check only nearby cells, not whole grid</div>
        <div class="log-item">Sleeping particles — skip physics on stable cells</div>
        <div class="log-item">Chunk-based multiplayer sync — only send changed regions</div>
        <div class="log-item">WebWorker simulation — physics on separate thread, no UI stutter</div>
      </div>

      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <div class="opanel" id="panCredits">
    <div class="opbox" style="text-align:center;">
      <div class="pw-logo" style="font-size:1.5rem;">P<span style="color:#a855f7">W</span></div>
      <div style="font-size:.55rem;color:#333;letter-spacing:.2em;margin-bottom:1.5rem;">v1.3.0 BETA · A PHYSICS SANDBOX</div>
      <h3>Made by</h3>
      <p style="color:#a855f7;font-family:'Syne',sans-serif;font-size:.9rem;">omelette180</p>
      <p>Built with pure HTML5 Canvas + Firebase</p>
      <p style="font-size:.55rem;color:#222;margin-top:1rem;">Physics inspired by Sandboxels</p>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <div class="opanel" id="panMods">
    <div class="opbox">
      <h2>📦 Mods</h2>
      <div id="modList" style="min-height:60px;font-size:.55rem;color:#444;">No mods loaded.</div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <div class="opanel" id="panAch">
    <div class="opbox">
      <h2>🏆 Achievements</h2>
      <div id="achList" style="min-height:60px;font-size:.55rem;color:#444;">No achievements yet.</div>
      <button class="op-close" onclick="closePanels()">Close</button>
    </div>
  </div>

  <div id="elemTip">
    <div class="tip-name" id="tipName"></div>
    <div class="tip-desc" id="tipDesc"></div>
    <div class="tip-tags" id="tipTags"></div>
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
window.showPanel   = showPanel;
window.closePanels = closePanels;

// ── SETTINGS TAB SWITCHER ─────────────────────────────────────────
window.switchSetTab = function(btn) {
  document.querySelectorAll('.set-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.set-panel').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const t = document.getElementById(btn.dataset.tab);
  if (t) t.style.display = 'block';
};

// ── THEME SWITCHER ────────────────────────────────────────────────
window.setTheme = function(cls) {
  ['t-light','t-neon','t-warm','t-forest','t-mono'].forEach(t => document.body.classList.remove(t));
  if (cls) document.body.classList.add(cls);
  localStorage.setItem('pw_theme', cls);
  document.querySelectorAll('.set-theme').forEach(b => b.classList.toggle('active', b.dataset.theme === cls));
};
const _savedTheme = localStorage.getItem('pw_theme');
if (_savedTheme) document.addEventListener('DOMContentLoaded', () => window.setTheme(_savedTheme));

// ── SETTINGS PERF STATS ───────────────────────────────────────────
setInterval(() => {
  const fps = document.getElementById('setFpsDisplay');
  const par = document.getElementById('setParticleDisplay');
  const grd = document.getElementById('setGridDisplay');
  const elm = document.getElementById('setElemDisplay');
  if (fps) fps.textContent = (document.getElementById('sF')?.textContent ?? '?') + ' fps';
  if (par) par.textContent = (window.PW?.Grid?.countNonEmpty?.() ?? 0).toLocaleString();
  if (grd) grd.textContent = window.PW ? PW.Grid.cols + '×' + PW.Grid.rows : '?';
  if (elm) elm.textContent = (window.PW?.ElementRegistry?.count?.() ?? 0) + ' registered';
}, 800);

// ── TOOLTIP ───────────────────────────────────────────────────────
function initTooltip() {
  const tip  = document.getElementById('elemTip');
  if (!tip) return;
  const name = document.getElementById('tipName');
  const desc = document.getElementById('tipDesc');
  const tags = document.getElementById('tipTags');

  let hoverTimer;
  document.querySelectorAll('.eb').forEach(btn => {
    btn.addEventListener('mouseenter', e => {
      hoverTimer = setTimeout(() => {
        const id  = btn.dataset.id || btn.dataset.e;
        const def = PW.ElementRegistry.get(id);
        if (!def) return;
        if (name) name.textContent = def.name;
        if (desc) desc.textContent = def.desc || '';
        if (tags) tags.textContent = def.tags?.join(' · ') || '';
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

// ── CANVAS POSITION DISPLAY ───────────────────────────────────────
function initPositionDisplay() {
  const canvas = document.getElementById('gc');
  const sF     = document.getElementById('sF');   // FPS display
  const sP     = document.getElementById('sP');   // particle count

  if (!canvas) return;

  canvas.addEventListener('mousemove', e => {
    const rect     = canvas.getBoundingClientRect();
    const cellSize = parseInt(localStorage.getItem('pw_cellSize') || '3');
    const x = Math.floor((e.clientX - rect.left) / rect.width  * canvas.width  / cellSize);
    const y = Math.floor((e.clientY - rect.top)  / rect.height * canvas.height / cellSize);

    const cell = PW.Grid.getCell(x, y);
    if (cell && cell.type !== 'empty') {
      const def = PW.ElementRegistry.get(cell.type);
      // Show in whatever status display exists
      const inspect = document.getElementById('inspect');
      if (inspect) {
        inspect.textContent = `${def?.name || cell.type} | ${Math.round(cell.heat ?? 0)}°`;
        inspect.style.opacity = '1';
      }
    } else {
      const inspect = document.getElementById('inspect');
      if (inspect) inspect.style.opacity = '0';
    }
  });

  // Patch core.js stat IDs — override them to use correct HTML IDs
  // core.js uses statFps and statParts, HTML has sF and sP
  // We patch by periodically syncing from Simulation
  setInterval(() => {
    if (sF) sF.textContent = PW.Simulation?.fps ?? '?';
    if (sP) sP.textContent = PW.Grid?.countNonEmpty() ?? 0;
  }, 500);
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;

    switch(e.code) {
      case 'Space':
        e.preventDefault();
        PW.Simulation.toggle();
        const bP = document.getElementById('bPause');
        if (bP) bP.textContent = PW.Simulation.running ? '⏸' : '▶';
        break;
      case 'KeyC':
        if (e.ctrlKey) { e.preventDefault(); PW.Grid.clear(); }
        break;
      case 'Escape':
        closePanels();
        break;
      case 'BracketLeft': {
        const sz = Math.max(1, PW.Input.brushSize - 1);
        PW.Input.setBrush(sz);
        const bR = document.getElementById('bR');
        const bV = document.getElementById('bV');
        if (bR) bR.value = sz;
        if (bV) bV.textContent = sz;
        break;
      }
      case 'BracketRight': {
        const sz = Math.min(40, PW.Input.brushSize + 1);
        PW.Input.setBrush(sz);
        const bR = document.getElementById('bR');
        const bV = document.getElementById('bV');
        if (bR) bR.value = sz;
        if (bV) bV.textContent = sz;
        break;
      }
      // Hotkeys
      case 'KeyH': {
        const hmc = document.getElementById('hmc');
        if (hmc) hmc.style.opacity = hmc.style.opacity === '0' ? '0.6' : '0';
        break;
      }
    }
  });

  // Scroll wheel = brush size
  document.getElementById('gc')?.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const sz    = Math.max(1, Math.min(40, PW.Input.brushSize + delta));
    PW.Input.setBrush(sz);
    const bR = document.getElementById('bR');
    const bV = document.getElementById('bV');
    if (bR) bR.value = sz;
    if (bV) bV.textContent = sz;
  }, { passive: false });
}

// ── PATCH CORE STAT ELEMENT IDS ───────────────────────────────────
// core.js hardcodes getElementById('statFps') and getElementById('statParts')
// These don't exist in index.html (HTML has sF and sP instead)
// We inject dummy elements so core.js doesn't throw
function patchCoreStatIds() {
  function ensureEl(id, parentId) {
    if (!document.getElementById(id)) {
      const el = document.createElement('span');
      el.id = id;
      el.style.display = 'none';
      document.body.appendChild(el);
    }
  }
  ensureEl('statFps');
  ensureEl('statParts');
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  patchCoreStatIds();
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

  // Hide loader, show game
  if (typeof PW_setLoadProgress === 'function') PW_setLoadProgress(100, 'Ready!');
  setTimeout(() => {
    const loader = document.getElementById('loader');
    const game   = document.getElementById('game');
    if (loader) loader.classList.add('fade');
    if (game)   game.classList.add('show');
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 1000);
  }, 400);

  console.log('[PW UI] v1.3.0 — UI initialized ✓');
  console.log(`[PW UI] ${PW.ElementRegistry.count()} elements registered`);
});
