/**
 * PARTICLE WORLD v1.3 Beta — js/mods.js
 * Mod system — fixed for v2 architecture.
 * Fixed: v1 globals (E, EN, ta, ca, ea, ha, fp, fl, rg, wlk, gcol, n4, id)
 *        replaced with PW API. Syntax error in modSetTab fixed.
 *        Panel IDs updated.
 */

'use strict';

let loadedMods = [];

// ── V2 bridge helpers ─────────────────────────────────────────────
function _mg(x,y)   { return window.PW?.Grid?.getCell(x,y) ?? null; }
function _mtype(x,y){ return window.PW?.Grid?.getType(x,y) ?? 'empty'; }
function _mset(x,y,t){ if(window.PW)PW.Grid.setCell(x,y,t); }
function _mclear(x,y){ if(window.PW)PW.Grid.clearCell(x,y); }
function _minB(x,y)  { return window.PW?.Grid?.inBounds(x,y) ?? false; }
function _mn4(x,y)   { return [[x,y-1],[x+1,y],[x,y+1],[x-1,y]]; }
function _mrnd()     { return Math.random(); }

// ── Load a .pwmod JSON string ─────────────────────────────────────
function loadMod(jsonStr, filename) {
  try {
    const mod = JSON.parse(jsonStr);
    if (!mod.name || !mod.elements) throw new Error('Invalid mod format — needs name + elements');
    mod._file    = filename;
    mod._enabled = true;
    mod._id      = Date.now();

    mod.elements.forEach(el => {
      if (!el.id) return;
      // Register with v2 ElementRegistry
      if (window.PW?.ElementRegistry) {
        const color = Array.isArray(el.color) ? el.color[0] : (el.color || '#888888');
        PW.ElementRegistry.registerMod({
          id:       el.id,
          name:     el.label || el.id,
          category: 'mods',
          color:    color,
          density:  el.weight ?? 1,
          state:    _modBehaviorToState(el.behavior),
          desc:     el.desc || 'Mod element',
          tick:     _buildModTick(el),
        });
      }
      injectModElement(el);
    });

    loadedMods.push(mod);
    renderModList();
    if (window.buildSidebar) buildSidebar(); // rebuild sidebar with new elements
    return true;
  } catch(e) {
    alert('Mod error: ' + e.message);
    return false;
  }
}

function _modBehaviorToState(behavior) {
  switch(behavior) {
    case 'liquid':   return 'liquid';
    case 'gas':      return 'gas';
    case 'creature': return 'solid';
    case 'solid':    return 'solid';
    case 'static':   return 'solid';
    default:         return 'solid';
  }
}

function _buildModTick(el) {
  return function(x, y, grid, h) {
    const cell = grid.getCell(x, y);
    if (!cell) return;

    // Decay
    if (el.decay) {
      cell.energy = (cell.energy ?? 100) - (el.decay * 10);
      if (cell.energy <= 0) { grid.clearCell(x, y); return; }
    }

    // Heat output
    if (el.heatOutput) cell.heat = (cell.heat ?? 0) + el.heatOutput;

    // Reactions
    if (el.reactions) {
      for (const rx of el.reactions) {
        const neighbor = rx.neighbor || rx.with;
        for (const [nx, ny] of h.neighbors4(x, y)) {
          const t = grid.getType(nx, ny);
          if (t === neighbor && h.chance(rx.chance || 0.05)) {
            const res = rx.result;
            if (res === 'explode') { h.explode(x, y, rx.radius || 8, {strength:1}); return; }
            if (res === 'remove' || !res) { grid.clearCell(x, y); return; }
            grid.clearCell(x, y);
            grid.setCell(x, y, res);
            return;
          }
        }
      }
    }

    // Movement behavior
    switch(el.behavior) {
      case 'liquid':   h.LIQUID(x, y); break;
      case 'powder':   h.POWDER(x, y); break;
      case 'gas':      h.GAS(x, y);    break;
      case 'creature':
        if (grid.isEmpty(x, y+1)) { grid.swapCells(x,y,x,y+1); return; }
        if (h.chance(0.4)) {
          const d = h.rnd() < 0.5 ? 1 : -1;
          if (grid.isEmpty(x+d, y)) grid.swapCells(x, y, x+d, y);
        }
        break;
      case 'static': break;
      default: h.POWDER(x, y); break;
    }
  };
}

function injectModElement(el) {
  // Sidebar injection handled by buildSidebar() via ElementRegistry
  // This is a no-op now — elements show up automatically after registerMod
}

// ── Tab switcher ──────────────────────────────────────────────────
window.modSetTab = function(t) {
  ['Loaded','Build','Library','Share'].forEach(tab => {
    const panel = document.getElementById('modPan' + tab);
    const tabBtn = document.getElementById('modTab' + tab);
    if (panel) panel.style.display = tab.toLowerCase() === t ? 'block' : 'none';
    if (tabBtn) tabBtn.classList.toggle('active', tab.toLowerCase() === t);
  });
  if (t === 'library') modRenderLibrary();
  if (t === 'loaded')  renderModList();
};

// ── Loaded mods tab ───────────────────────────────────────────────
function renderModList() {
  const el = document.getElementById('modList');
  if (!el) return;
  el.innerHTML = '';
  if (!loadedMods.length) {
    el.innerHTML = '<div style="color:#1a1a2a;font-size:.6rem;padding:8px 0;">No mods loaded. Drop a file, install from Library, or build one.</div>';
    return;
  }
  loadedMods.forEach((mod, idx) => {
    const card = document.createElement('div');
    card.className = 'mod-card';
    const elemCount = (mod.elements || []).length;
    card.innerHTML = `
      <div class="mod-card-hdr">
        <span class="mod-name">${mod.name||'Unnamed Mod'}</span>
        <span class="mod-ver">v${mod.version||'1.0'} · ${elemCount} elem${elemCount!==1?'s':''} · by ${mod.author||'unknown'}</span>
      </div>
      <div class="mod-desc">${mod.description||'No description.'}</div>
      ${mod.tags?`<div style="font-size:.5rem;color:#333;margin-top:3px;">${mod.tags.split(',').map(t=>`<span style="background:#0a0a18;border:1px solid #111;padding:1px 5px;border-radius:10px;margin-right:3px;">${t.trim()}</span>`).join('')}</div>`:''}
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <button class="mod-toggle ${mod._enabled?'on':''}" data-idx="${idx}">${mod._enabled?'✓ Enabled':'○ Disabled'}</button>
        <button class="mod-export-btn" data-idx="${idx}">💾 Export</button>
        <button class="mod-share-btn" data-idx="${idx}">🔗 Share</button>
        <button class="mod-del" data-idx="${idx}" style="margin-left:auto;">✕ Remove</button>
      </div>`;
    el.appendChild(card);
  });
  el.querySelectorAll('.mod-toggle').forEach(b => b.onclick = () => {
    const m = loadedMods[+b.dataset.idx];
    m._enabled = !m._enabled;
    b.textContent = m._enabled ? '✓ Enabled' : '○ Disabled';
    b.classList.toggle('on', m._enabled);
  });
  el.querySelectorAll('.mod-export-btn').forEach(b => b.onclick = () => modExportSingle(+b.dataset.idx));
  el.querySelectorAll('.mod-share-btn').forEach(b => b.onclick = () => {
    const mod = loadedMods[+b.dataset.idx];
    const shareEl = document.getElementById('modShareExport');
    if (shareEl) shareEl.value = btoa(unescape(encodeURIComponent(JSON.stringify(mod))));
    modSetTab('share');
  });
  el.querySelectorAll('.mod-del').forEach(b => b.onclick = () => {
    loadedMods.splice(+b.dataset.idx, 1);
    renderModList();
  });
}

function modExportSingle(idx) {
  const mod = loadedMods[idx]; if (!mod) return;
  const a = document.createElement('a');
  a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(mod, null, 2));
  a.download = (mod.name || 'mod').replace(/\s+/g,'_') + '.pwmod';
  a.click();
}

// ── Mod builder ───────────────────────────────────────────────────
let mbElements = [], mbCurrentReactions = [];

function mbUpdatePreview() {
  const mod = {
    name:        document.getElementById('mbName')?.value || 'My Mod',
    version:     document.getElementById('mbVer')?.value  || '1.0',
    description: document.getElementById('mbDesc')?.value || '',
    author:      document.getElementById('mbAuthor')?.value || '',
    tags:        document.getElementById('mbTags')?.value || '',
    elements:    mbElements,
  };
  const prev = document.getElementById('mbJsonPreview');
  if (prev) prev.value = JSON.stringify(mod, null, 2);
  const cnt = document.getElementById('mbElemCount');
  if (cnt) cnt.textContent = mbElements.length;
}

function mbRenderElemList() {
  const el = document.getElementById('mbElemList');
  if (!el) return;
  el.innerHTML = '';
  if (!mbElements.length) {
    el.innerHTML = '<div style="font-size:.55rem;color:#1a1a2a;padding:6px;">No elements yet.</div>';
    mbUpdatePreview(); return;
  }
  mbElements.forEach((e2, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 6px;margin-bottom:4px;background:#080810;border:1px solid #0f0f18;border-radius:2px;';
    row.innerHTML = `<div style="width:16px;height:16px;border-radius:2px;background:${Array.isArray(e2.color)?e2.color[0]:e2.color};flex-shrink:0;"></div>
      <div style="flex:1;min-width:0;"><span style="font-size:.6rem;color:#aaa;font-family:'Syne',sans-serif;">${e2.label||e2.id}</span> <span style="font-size:.5rem;color:#333;">${e2.id} · ${e2.behavior}</span></div>
      <button onclick="mbElements.splice(${i},1);mbRenderElemList();" style="padding:2px 6px;background:#1a0a0a;border:1px solid #3a1a1a;color:#ff5555;font-family:'DM Mono',monospace;font-size:.52rem;cursor:pointer;">✕</button>`;
    el.appendChild(row);
  });
  mbUpdatePreview();
}

// Populate reaction dropdowns
function _populateRxDropdowns() {
  const withSel   = document.getElementById('mbRxWith');
  const resultSel = document.getElementById('mbRxResult');
  if (!withSel || !resultSel) return;
  const common = ['fire','water','acid','lava','ice','sand','stone','wood','metal','gas','smoke','steam','explode','remove'];
  // Also add from ElementRegistry if available
  const allIds = window.PW?.ElementRegistry
    ? PW.ElementRegistry.allArray().map(e => e.id)
    : common;
  const opts = [...new Set([...common, ...allIds])].sort();
  opts.forEach(v => {
    const o1 = document.createElement('option'); o1.value = o1.textContent = v; withSel.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = o2.textContent = v; resultSel.appendChild(o2);
  });
}

window.mbAddReaction = function() {
  const w = document.getElementById('mbRxWith')?.value;
  const r = document.getElementById('mbRxResult')?.value;
  const c = +(document.getElementById('mbRxChance')?.value || 0.05);
  if (!w || !r) return;
  mbCurrentReactions.push({ neighbor: w, chance: c, result: r });
  const el = document.getElementById('mbReactionList');
  if (!el) return;
  const row = document.createElement('div');
  const i = mbCurrentReactions.length - 1;
  row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:.52rem;color:#444;';
  row.innerHTML = `<span style="color:#88aaff;">${w}</span> <span style="color:#333;">(${c})</span> <span>→</span> <span style="color:#44ff88;">${r}</span> <button onclick="mbCurrentReactions.splice(${i},1);this.parentElement.remove();" style="background:none;border:none;color:#444;cursor:pointer;font-size:.6rem;">✕</button>`;
  el.appendChild(row);
};

window.mbAddElement = function() {
  const eid = document.getElementById('mbElId')?.value.trim().replace(/\s+/g,'_').toLowerCase();
  const msg = document.getElementById('mbElMsg');
  if (!eid) { if(msg){msg.style.color='#ff4444';msg.textContent='Enter an ID!';} return; }
  if (mbElements.find(e2 => e2.id === eid)) { if(msg){msg.style.color='#ff4444';msg.textContent='ID already used!';} return; }
  const elem = {
    id:         eid,
    label:      document.getElementById('mbElLabel')?.value || eid,
    color:      [document.getElementById('mbElCol1')?.value || '#888888', document.getElementById('mbElCol2')?.value || '#666666'],
    behavior:   document.getElementById('mbElBehavior')?.value || 'powder',
    weight:     +(document.getElementById('mbElWeight')?.value || 1),
    heatOutput: +(document.getElementById('mbElHeat')?.value || 0),
    decay:      +(document.getElementById('mbElDecay')?.value || 0),
    flammable:  document.getElementById('mbElFlammable')?.value === 'true',
    desc:       document.getElementById('mbElDesc')?.value || '',
    reactions:  [...mbCurrentReactions],
  };
  mbElements.push(elem);
  mbCurrentReactions = [];
  const rxList = document.getElementById('mbReactionList');
  if (rxList) rxList.innerHTML = '';
  ['mbElId','mbElLabel','mbElDesc'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  ['mbElWeight','mbElHeat','mbElDecay'].forEach((id,i) => { const el=document.getElementById(id); if(el) el.value=['1','0','0'][i]; });
  if (msg) { msg.style.color='#44ffaa'; msg.textContent=`✓ "${elem.label}" added!`; }
  mbRenderElemList();
};

window.mbClear = function() {
  mbElements = []; mbCurrentReactions = [];
  const rxList = document.getElementById('mbReactionList');
  if (rxList) rxList.innerHTML = '';
  ['mbName','mbVer','mbDesc','mbAuthor','mbTags','mbElId','mbElLabel','mbElDesc'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  mbRenderElemList();
  const msg = document.getElementById('mbMsg');
  if (msg) msg.textContent = '';
};

window.mbTestLoad = function() {
  const prev = document.getElementById('mbJsonPreview');
  if (!prev) return;
  const mod = JSON.parse(prev.value || '{}');
  if (!mod.elements?.length) {
    const msg = document.getElementById('mbMsg');
    if (msg) { msg.style.color='#ff4444'; msg.textContent='Add elements first!'; }
    return;
  }
  const ok = loadMod(JSON.stringify(mod), 'builder_test');
  if (ok) {
    const msg = document.getElementById('mbMsg');
    if (msg) { msg.style.color='#44ffaa'; msg.textContent='✓ Loaded into game!'; }
    modSetTab('loaded');
  }
};

window.mbExportFile = function() {
  const prev = document.getElementById('mbJsonPreview');
  if (!prev) return;
  const mod = JSON.parse(prev.value || '{}');
  if (!mod.name) {
    const msg = document.getElementById('mbMsg');
    if (msg) { msg.style.color='#ff4444'; msg.textContent='Fill in mod name first!'; }
    return;
  }
  const a = document.createElement('a');
  a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(mod, null, 2));
  a.download = (mod.name||'mod').replace(/\s+/g,'_') + '.pwmod';
  a.click();
};

window.mbPrepareShare = function() {
  const raw  = document.getElementById('mbJsonPreview')?.value;
  const dest = document.getElementById('modShareExport');
  if (raw && raw !== '{}' && dest) dest.value = btoa(unescape(encodeURIComponent(raw)));
};

// ── Library ───────────────────────────────────────────────────────
const MOD_LIBRARY = [
  {
    name:'Chaos Pack',author:'PW Dev',version:'1.0',tags:'chaos, explosions',
    description:'Supernova powder, Vortex liquid, Plague gas. Pure destruction.',
    elements:[
      {id:'supernova_dust',label:'Supernova✨',color:['#ffffff','#ffaa00'],behavior:'powder',weight:1,heatOutput:8,decay:0,reactions:[{neighbor:'fire',chance:.2,result:'explode'}]},
      {id:'vortex_liquid', label:'Vortex💧',  color:['#4400ff','#aa44ff'],behavior:'liquid',weight:.5,heatOutput:2,decay:0,reactions:[{neighbor:'stone',chance:.03,result:'smoke'}]},
      {id:'plague_gas',   label:'Plague☠',   color:['#44ff44','#66ff66'],behavior:'gas',  weight:0,heatOutput:0,decay:.05,reactions:[{neighbor:'person',chance:.04,result:'zombie'},{neighbor:'citizen',chance:.04,result:'zombie'}]},
    ],
  },
  {
    name:'Ocean Life Pack',author:'PW Dev',version:'1.0',tags:'ocean, creatures',
    description:'Anglerfish, Sea Serpent, and glowing Bioluminescence.',
    elements:[
      {id:'anglerfish',      label:'Anglerfish🐟',color:['#1a1a2a','#0a0a18'],behavior:'creature',weight:1,heatOutput:0,decay:0,reactions:[{neighbor:'fish',chance:.1,result:'blood'}]},
      {id:'sea_serpent',     label:'SeaSerpent🐍',color:['#1a4422','#2a5530'],behavior:'creature',weight:1,heatOutput:0,decay:0,reactions:[{neighbor:'shark',chance:.05,result:'blood'}]},
      {id:'bioluminescence', label:'Biolumi✨',   color:['#00ffcc','#44ffdd'],behavior:'liquid', weight:.6,heatOutput:0,decay:0,reactions:[]},
    ],
  },
  {
    name:'Alchemy Lab',author:'PW Dev',version:'1.0',tags:'alchemy, magic',
    description:"Philosopher's Brew, Transmutation powder, Arcane crystal.",
    elements:[
      {id:'philos_brew',    label:'PhilosBrew🧪',color:['#ff8800','#ffcc44'],behavior:'liquid',weight:.7,heatOutput:1,decay:0,reactions:[{neighbor:'lead_pb',chance:.05,result:'gold_elem'},{neighbor:'sand',chance:.02,result:'quartz'}]},
      {id:'transmute_dust', label:'Transmute⚗',  color:['#cc44ff','#ee66ff'],behavior:'powder',weight:1,heatOutput:0,decay:.005,reactions:[{neighbor:'stone',chance:.01,result:'diamond'},{neighbor:'coal',chance:.02,result:'diamond'}]},
      {id:'arcane_crystal', label:'ArcaneCrystal💎',color:['#ff44ff','#ff88ff'],behavior:'solid',weight:2,heatOutput:0,decay:0,reactions:[{neighbor:'fire',chance:.005,result:'plasma'},{neighbor:'water',chance:.005,result:'steam'}]},
    ],
  },
  {
    name:'Space Storm Pack',author:'PW Dev',version:'1.0',tags:'space, cosmic',
    description:'Cosmic debris, Ion Storm gas, Neutronium.',
    elements:[
      {id:'cosmic_debris', label:'CosmicDebris🌑',color:['#4a3a2a','#3a2a1a'],behavior:'powder',weight:3,heatOutput:0,decay:0,reactions:[]},
      {id:'ion_storm',     label:'IonStorm⚡',    color:['#aaccff','#4488ff'],behavior:'gas',  weight:0,heatOutput:2,decay:.03,reactions:[{neighbor:'wire',chance:.2,result:'electricity'}]},
      {id:'neutronium',    label:'Neutronium★',   color:['#ffffff','#eeeeee'],behavior:'solid',weight:5,heatOutput:0,decay:0,reactions:[{neighbor:'water',chance:.5,result:'steam'},{neighbor:'lava',chance:.3,result:'obsidian'}]},
    ],
  },
  {
    name:'Fantasy Biome',author:'PW Dev',version:'1.0',tags:'fantasy, magic, nature',
    description:'Fairy Dust, Moonwater, Shadowvine.',
    elements:[
      {id:'fairy_dust',  label:'FairyDust✨',  color:['#ffaaff','#ffccff'],behavior:'gas',   weight:0,  heatOutput:0,decay:.02,reactions:[]},
      {id:'moonwater',   label:'Moonwater🌙', color:['#aaccff','#ccddff'],behavior:'liquid', weight:.6, heatOutput:0,decay:0,  reactions:[{neighbor:'fire',chance:.3,result:'steam'}]},
      {id:'shadowvine',  label:'Shadowvine🌿',color:['#1a0a2a','#2a1a3a'],behavior:'solid',  weight:1,  heatOutput:0,decay:0,  reactions:[{neighbor:'fire',chance:.05,result:'smoke'}]},
    ],
  },
  {
    name:'Industrial Pack',author:'PW Dev',version:'1.0',tags:'machines, industry',
    description:'Molten Steel, Carbon Fiber, Coolant.',
    elements:[
      {id:'ind_molten_steel',label:'MoltenSteel🔩',color:['#ffaa44','#ff8800'],behavior:'liquid',weight:2,  heatOutput:6, decay:0,reactions:[{neighbor:'water',chance:.3,result:'steam'}]},
      {id:'carbon_fiber',    label:'CarbonFiber',  color:['#111111','#1a1a1a'],behavior:'solid', weight:1.5,heatOutput:0, decay:0,reactions:[{neighbor:'fire',chance:.001,result:'smoke'}]},
      {id:'coolant',         label:'Coolant❄',     color:['#00ccff','#44ddff'],behavior:'liquid',weight:.8, heatOutput:-5,decay:0,reactions:[{neighbor:'lava',chance:.2,result:'obsidian'},{neighbor:'fire',chance:.3,result:'steam'}]},
    ],
  },
];

function modRenderLibrary() {
  const el = document.getElementById('modLibraryList');
  if (!el) return;
  el.innerHTML = '';
  MOD_LIBRARY.forEach((mod, i) => {
    const installed = loadedMods.some(m => m.name === mod.name);
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #0f0f18;border-radius:3px;padding:10px;margin-bottom:8px;background:#080810;';
    const swatches = mod.elements.map(e2 => `<div style="width:12px;height:12px;border-radius:1px;background:${Array.isArray(e2.color)?e2.color[0]:e2.color};display:inline-block;margin-right:2px;" title="${e2.label}"></div>`).join('');
    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <div style="flex:1;">
          <div style="font-size:.65rem;color:#ccc;font-family:'Syne',sans-serif;margin-bottom:2px;">${mod.name} <span style="font-size:.5rem;color:#333;">v${mod.version} by ${mod.author}</span></div>
          <div style="font-size:.55rem;color:#333;margin-bottom:5px;">${mod.description}</div>
          <div style="margin-bottom:5px;">${swatches}</div>
          <div style="font-size:.5rem;color:#222;">${mod.elements.map(e2=>e2.label).join(' · ')}</div>
        </div>
        <button onclick="modLibInstall(${i})" style="flex-shrink:0;padding:5px 12px;background:${installed?'#0a1a0a':'#0a0a1a'};border:1px solid ${installed?'#22aa44':'#222266'};color:${installed?'#44ff88':'#88aaff'};font-family:'DM Mono',monospace;font-size:.58rem;cursor:pointer;white-space:nowrap;">
          ${installed?'✓ Installed':'+ Install'}
        </button>
      </div>`;
    el.appendChild(card);
  });
}

window.modLibInstall = function(i) {
  const mod = MOD_LIBRARY[i];
  const ok = loadMod(JSON.stringify(mod), mod.name + '.pwmod');
  if (ok) modRenderLibrary();
};

// ── Share tab ─────────────────────────────────────────────────────
window.modCopyShareCode = function() {
  const txt = document.getElementById('modShareExport')?.value;
  const msg = document.getElementById('modShareMsg');
  if (!txt) { if(msg) { msg.textContent='Nothing to copy — build a mod first.'; } return; }
  navigator.clipboard?.writeText(txt)
    .then(()=>{ if(msg){msg.style.color='#44ffaa';msg.textContent='✓ Copied!';} })
    .catch(()=>{
      const el = document.getElementById('modShareExport');
      if(el){el.select();document.execCommand('copy');}
      if(msg){msg.style.color='#44ffaa';msg.textContent='✓ Copied!';}
    });
};

window.modImportShareCode = function() {
  const code = document.getElementById('modShareImport')?.value.trim();
  const msg  = document.getElementById('modShareMsg');
  if (!code) { if(msg){msg.style.color='#ff4444';msg.textContent='Paste a code first!';} return; }
  try {
    const json = decodeURIComponent(escape(atob(code)));
    const ok = loadMod(json, 'shared_mod');
    if (ok) {
      if(msg){msg.style.color='#44ffaa';msg.textContent='✓ Mod installed!';}
      const inp = document.getElementById('modShareImport');
      if(inp) inp.value = '';
      modSetTab('loaded');
    }
  } catch(e) {
    if(msg){msg.style.color='#ff4444';msg.textContent='Invalid code: '+e.message;}
  }
};

// ── Wire up ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Panel buttons — panMod exists in index.html, panMods built by ui.js; handle both
  const openModPanel = () => {
    renderModList();
    const p = document.getElementById('panMod') || document.getElementById('panMods');
    if(p) p.classList.add('open');
  };
  document.getElementById('mMods')?.addEventListener('click', openModPanel);
  document.getElementById('bMods')?.addEventListener('click', openModPanel);

  // Builder live preview
  ['mbName','mbVer','mbDesc','mbAuthor','mbTags'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', mbUpdatePreview);
  });

  mbRenderElemList();

  // Populate reaction dropdowns once PW is ready
  const waitForPW = setInterval(() => {
    if (window.PW?.ElementRegistry) {
      clearInterval(waitForPW);
      _populateRxDropdowns();
    }
  }, 200);
  setTimeout(() => { clearInterval(waitForPW); _populateRxDropdowns(); }, 3000);

  // File drop/browse
  const modDrop = document.getElementById('modDrop');
  const modFile = document.getElementById('modFile');
  if (modDrop) {
    modDrop.addEventListener('click', () => modFile?.click());
    modDrop.addEventListener('dragover', e => { e.preventDefault(); modDrop.style.borderColor='var(--acc)'; });
    modDrop.addEventListener('dragleave', () => modDrop.style.borderColor='');
    modDrop.addEventListener('drop', e => {
      e.preventDefault(); modDrop.style.borderColor='';
      [...e.dataTransfer.files].forEach(f => { const r=new FileReader(); r.onload=ev=>loadMod(ev.target.result,f.name); r.readAsText(f); });
    });
  }
  if (modFile) {
    modFile.addEventListener('change', e => {
      [...e.target.files].forEach(f => { const r=new FileReader(); r.onload=ev=>loadMod(ev.target.result,f.name); r.readAsText(f); });
    });
  }

  renderModList();
});

// Expose for external use
window.loadMod        = loadMod;
window.renderModList  = renderModList;
window.modRenderLibrary = modRenderLibrary;
