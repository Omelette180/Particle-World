/**
 * PARTICLE WORLD v1.3 Beta — js/achievements.js
 * Fixed for v2 architecture:
 *   - Removed NUKE/sC wrapping (v1 globals that don't exist)
 *   - GAME_VERSION updated to 1.3.0
 *   - Panel IDs fixed
 *   - updatePopup reference removed (doesn't exist in v2 HTML)
 *   - Achievement hooks use PW event system instead of v1 function wrapping
 *   - sndPlay() calls wrapped safely
 */

'use strict';

const GAME_VERSION = '1.3.0';
let score = 0;
const achUnlocked = new Set();

const ACHIEVEMENTS = [
  {id:'first_fire',     icon:'🔥',  name:'Fire Starter',    desc:'Place your first fire',            pts:10},
  {id:'first_explode',  icon:'💥',  name:'Boom!',           desc:'Trigger your first explosion',     pts:25},
  {id:'first_nuke',     icon:'☢',   name:'Oops.',           desc:'Detonate a nuke',                  pts:100},
  {id:'chain10',        icon:'⚡',  name:'Chain Reaction',  desc:'Chain count of 10+',               pts:50},
  {id:'chain50',        icon:'⚡⚡', name:'Mega Chain',      desc:'Chain count of 50+',               pts:150},
  {id:'first_bh',       icon:'🕳',  name:'Event Horizon',   desc:'Place a black hole',               pts:75},
  {id:'first_zombie',   icon:'🧟',  name:'Patient Zero',    desc:'Place your first zombie',          pts:20},
  {id:'first_alien',    icon:'👾',  name:'First Contact',   desc:'Spawn a UFO or alien',             pts:30},
  {id:'first_portal',   icon:'🌀',  name:'Teleporter',      desc:'Place Portal A and Portal B',      pts:40},
  {id:'first_virus',    icon:'🦠',  name:'Outbreak',        desc:'Place a virus',                    pts:15},
  {id:'rad_high',       icon:'☢',   name:'Chernobyl',       desc:'Radiation level hits 80%+',        pts:150},
  {id:'first_lightning',icon:'⚡',  name:'Storm Chaser',    desc:'Summon lightning',                 pts:20},
  {id:'first_tornado',  icon:'🌪',  name:'Twister',         desc:'Place a tornado',                  pts:20},
  {id:'first_plasma',   icon:'✨',  name:'Star Stuff',      desc:'Create plasma',                    pts:30},
  {id:'first_wormhole', icon:'🌀',  name:'Shortcut',        desc:'Place a wormhole',                 pts:30},
  {id:'first_singularity',icon:'🌑',name:'Singularity',     desc:'Place a singularity',              pts:200},
  {id:'mod_loaded',     icon:'📦',  name:'Modder',          desc:'Load your first mod',              pts:50},
  {id:'admin_unlocked', icon:'⚙',   name:'Hacker',          desc:'Unlock the admin panel',           pts:100},
  {id:'score100',       icon:'🌟',  name:'Getting Started', desc:'Reach 100 score',                  pts:0},
  {id:'score1000',      icon:'🌟🌟',name:'Explosive Growth',desc:'Reach 1000 score',                 pts:0},
  {id:'score10000',     icon:'🌟🌟🌟',name:'World Destroyer',desc:'Reach 10000 score',              pts:0},
  {id:'first_sun',      icon:'☀️',  name:'Star Maker',      desc:'Place a sun',                      pts:50},
  {id:'first_multiplayer',icon:'🌐',name:'Connected',       desc:'Join a multiplayer room',          pts:30},
];

function addScore(pts) {
  if (!pts) return;
  score += pts;
  const sd = document.getElementById('scoreDisp');
  if (sd) sd.textContent = '⭐ ' + score.toLocaleString();
  const ast = document.getElementById('achScoreTotal');
  if (ast) ast.textContent = score.toLocaleString();
  if (score >= 100)   unlockAch('score100');
  if (score >= 1000)  unlockAch('score1000');
  if (score >= 10000) unlockAch('score10000');
}

function unlockAch(id) {
  if (achUnlocked.has(id)) return;
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  achUnlocked.add(id);
  addScore(ach.pts);
  _showAchToast(ach);
  renderAchList();
  // Save to localStorage for persistence
  try { localStorage.setItem('pw_ach', JSON.stringify([...achUnlocked])); } catch(e) {}
}

function _showAchToast(ach) {
  const popup = document.getElementById('achPopup');
  if (!popup) return;
  const toast = document.createElement('div');
  toast.className = 'ach-toast';
  toast.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-text"><div class="ach-title">Achievement Unlocked!</div><div class="ach-name">${ach.name}</div><div class="ach-score">${ach.pts ? '+' + ach.pts + ' pts' : ach.desc}</div></div>`;
  popup.appendChild(toast);
  try { if(window.sndPlay) sndPlay('portal'); } catch(e) {}
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 400); }, 3200);
}

function renderAchList() {
  const el = document.getElementById('achList');
  if (!el) return;
  el.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const u = achUnlocked.has(a.id);
    const row = document.createElement('div');
    row.style.cssText = `display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0a0a;opacity:${u ? 1 : 0.35}`;
    row.innerHTML = `<span style="font-size:1.1rem">${a.icon}</span>
      <div style="flex:1">
        <div style="font-size:.66rem;color:${u?'#ccc':'#444'};font-family:'Syne',sans-serif">${a.name}</div>
        <div style="font-size:.56rem;color:#333">${a.desc}</div>
      </div>
      <span style="font-size:.58rem;color:var(--acc)">${a.pts ? '+' + a.pts : ''}</span>
      ${u ? '<span style="font-size:.6rem;color:#44ffaa">✓</span>' : ''}`;
    el.appendChild(row);
  });
}

// ── Achievement hooks via PW.Grid.setCell override ────────────────
// Instead of wrapping v1 sC(), we hook into grid.setCell via a proxy
// called once PW is ready
function _hookAchievements() {
  if (!window.PW?.Grid) return;
  const origSetCell = PW.Grid.setCell.bind(PW.Grid);
  PW.Grid.setCell = function(x, y, type, extra) {
    origSetCell(x, y, type, extra);
    // Fire achievement checks
    if (!type) return;
    if (type === 'fire' || type === 'lava')      unlockAch('first_fire');
    if (type === 'blackhole')                    unlockAch('first_bh');
    if (type === 'virus')                        unlockAch('first_virus');
    if (type === 'lightning')                    unlockAch('first_lightning');
    if (type === 'tornado')                      unlockAch('first_tornado');
    if (type === 'plasma')                       unlockAch('first_plasma');
    if (type === 'ufo' || type === 'alien')      unlockAch('first_alien');
    if (type === 'wormhole')                     unlockAch('first_wormhole');
    if (type === 'zombie')                       unlockAch('first_zombie');
    if (type === 'portal_a' || type === 'portal_b') unlockAch('first_portal');
    if (type === 'sun')                          unlockAch('first_sun');
    if (type === 'singularity')                  unlockAch('first_singularity');
    if (type === 'nuke')                         unlockAch('first_nuke');
  };

  // Also hook explode
  if (window.PW?.Helpers?.explode) {
    const origExplode = PW.Helpers.explode;
    PW.Helpers.explode = function(...args) {
      unlockAch('first_explode');
      addScore(5);
      return origExplode(...args);
    };
  }
}

// Load saved achievements from localStorage
try {
  const saved = JSON.parse(localStorage.getItem('pw_ach') || '[]');
  saved.forEach(id => achUnlocked.add(id));
} catch(e) {}

// ── Wire buttons ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAchList();

  document.getElementById('bAch')?.addEventListener('click', () => {
    renderAchList();
    // Try panAch first (in index.html), fallback to ui.js built panel
    const p = document.getElementById('panAch');
    if (p) p.classList.add('open');
    else if (window.showPanel) showPanel('panAch');
  });

  document.getElementById('bLog')?.addEventListener('click', () => {
    if (window.showPanel) showPanel('panLog');
    else document.getElementById('panLog')?.classList.add('open');
  });

  document.getElementById('mLog')?.addEventListener('click', () => {
    if (window.showPanel) showPanel('panLog');
    else document.getElementById('panLog')?.classList.add('open');
  });

  document.getElementById('bWorlds')?.addEventListener('click', () => {
    document.getElementById('panWorlds')?.classList.add('open');
  });

  document.getElementById('mWorlds')?.addEventListener('click', () => {
    document.getElementById('panWorlds')?.classList.add('open');
  });

  document.getElementById('bCreate')?.addEventListener('click', () => {
    document.getElementById('panCreate')?.classList.add('open');
  });

  // Hook achievements once PW is ready
  const waitForPW = setInterval(() => {
    if (window.PW?.Grid) { clearInterval(waitForPW); _hookAchievements(); }
  }, 300);
  setTimeout(() => clearInterval(waitForPW), 8000);
});

// Expose
window.unlockAch  = unlockAch;
window.addScore   = addScore;
window.renderAchList = renderAchList;
