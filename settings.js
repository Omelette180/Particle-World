/**
 * PARTICLE WORLD v1.4.0 Beta — settings.js
 * New tabbed settings panel + gravity/explosion multipliers.
 * Runs on top of the v1 engine — all existing globals (simSpeed, glowOn,
 * shakeOn, canFall, explode, COLS, ROWS, ta, fps) are still used unchanged.
 */

// ── Tab switcher ──────────────────────────────────────────────────
window.switchStab = function(btn, tabId) {
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.stab-panel').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const t = document.getElementById(tabId);
  if (t) t.style.display = 'block';
};

// ── Live perf stats in the Performance tab ────────────────────────
setInterval(function() {
  const fd = document.getElementById('setFpsDisp');
  const pd = document.getElementById('setPartDisp');
  const gd = document.getElementById('setGridDisp');
  if (fd && typeof fps !== 'undefined')  fd.textContent = fps + ' fps';
  if (pd && typeof ta  !== 'undefined') {
    var n = 0;
    for (var i = 0; i < ta.length; i++) if (ta[i]) n++;
    pd.textContent = n.toLocaleString() + ' cells';
  }
  if (gd && typeof COLS !== 'undefined') gd.textContent = COLS + ' \u00d7 ' + ROWS;
}, 700);

// ── Gravity multiplier ────────────────────────────────────────────
// Wraps the v1 canFall() so gravityMult = 0 makes nothing fall.
// v1 engine already wraps canFall once for its own reasons (line ~4506),
// so we wait until after it runs, then wrap the result.
window.gravityMult = 1;

window.addEventListener('load', function() {
  if (typeof canFall === 'function') {
    var _cf = canFall;
    canFall = function(t) {
      if (window.gravityMult === 0) return false;
      return _cf(t);
    };
  }
});

// ── Explosion power multiplier ────────────────────────────────────
// Wraps v1 explode() so explMult scales the radius.
window.explMult = 1;

window.addEventListener('load', function() {
  if (typeof explode === 'function') {
    var _ex = explode;
    explode = function(cx, cy, r, f) {
      return _ex(cx, cy, Math.ceil(r * (window.explMult || 1)), f);
    };
  }
});
