/**
 * PARTICLE WORLD v1.4.0 Beta — js/settings.js
 * New tabbed settings panel + pro layout switcher.
 * Works on top of the v1 engine (applySettings, setLayoutMode, etc. still exist).
 */

// ── SETTINGS TAB SWITCHER ─────────────────────────────────────────
window.switchStab = function(btn, tabId) {
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.stab-panel').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const t = document.getElementById(tabId);
  if (t) t.style.display = 'block';
};

// ── LIVE PERF STATS IN SETTINGS PERF TAB ─────────────────────────
setInterval(() => {
  const fd = document.getElementById('setFpsDisp');
  const pd = document.getElementById('setPartDisp');
  const gd = document.getElementById('setGridDisp');
  if (fd && typeof fps !== 'undefined') fd.textContent = fps + ' fps';
  if (pd && typeof ta !== 'undefined') {
    let n = 0;
    for (let i = 0; i < ta.length; i++) if (ta[i]) n++;
    pd.textContent = n.toLocaleString();
  }
  if (gd && typeof COLS !== 'undefined') gd.textContent = COLS + '×' + ROWS;
}, 600);

// ── GRAVITY + EXPLOSION MULTIPLIERS ──────────────────────────────
// Patch canFall to respect gravityMult
window.gravityMult = 1;
window.explMult    = 1;

// Wrap v1 canFall once engine is ready
document.addEventListener('DOMContentLoaded', () => {
  // Gravity: if gravityMult=0, nothing falls
  if (typeof canFall !== 'undefined') {
    const _origCanFall = canFall;
    window.canFall = function(t) {
      if (window.gravityMult === 0) return false;
      return _origCanFall(t);
    };
  }

  // Explosion power: wrap explode()
  if (typeof explode !== 'undefined') {
    const _origExplode = explode;
    window.explode = function(cx, cy, r, f) {
      return _origExplode(cx, cy, r * (window.explMult || 1), f);
    };
  }
});

// ── VERSION DISPLAY ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Update any version displays
  document.querySelectorAll('[data-version]').forEach(el => {
    el.textContent = 'v1.4.0 Beta';
  });
  console.log('[PW] settings.js loaded — v1.4.0 Beta');
});
