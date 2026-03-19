/**
 * PARTICLE WORLD v1.3 Beta — js/firebase-init.js
 * Domain lock + visitor logging.
 * Firebase is now initialized in multiplayer.js (type=module, v9 modular SDK).
 * This file just handles domain protection and exposes a helper for chat.js.
 */

'use strict';

// ── Domain lock ───────────────────────────────────────────────────
(function() {
  const ALLOWED = ['omelette180.github.io/Particle-World', 'localhost', '127.0.0.1'];
  const allowed = ALLOWED.some(d =>
    (location.hostname + location.pathname).includes(d) || location.hostname === d
  );
  window._pwAllowed = allowed;

  if (!allowed) {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <div style="position:fixed;inset:0;background:#000;display:flex;flex-direction:column;
          align-items:center;justify-content:center;font-family:monospace;color:#ff4444;
          text-align:center;padding:2rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <div style="font-size:1.1rem;font-weight:bold;margin-bottom:.5rem;">Unauthorized Copy Detected</div>
          <div style="font-size:.75rem;color:#666;margin-bottom:1.5rem;">
            This game only runs on its official domain.
          </div>
          <a href="https://omelette180.github.io/Particle-World/"
            style="color:#a855f7;font-size:.8rem;">Play the real Particle World →</a>
        </div>`;
    });
  }
})();

// ── Wait for Firebase (set by multiplayer.js module) ─────────────
// multiplayer.js sets window._fbDb and window._fbReady after anonymous auth.
// chat.js uses window._fbDb directly, so we just need to ensure it's set.
// Nothing to do here — multiplayer.js handles it.

// Log visitor once Firebase is available
(function waitForDb() {
  if (window._fbDb) {
    window._fbDb.ref('visits/' + Date.now()).set({
      host:   location.hostname,
      href:   location.href,
      ua:     navigator.userAgent.slice(0, 100),
      ts:     Date.now(),
      stolen: !window._pwAllowed,
    }).catch(() => {});
  } else {
    setTimeout(waitForDb, 500);
  }
})();
