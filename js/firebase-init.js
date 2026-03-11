/**
 * PARTICLE WORLD v2.0 — js/firebase-init.js
 * Initializes Firebase and exposes window._fb for other modules.
 * type="module" so we can use import syntax.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getDatabase, ref, set, get, onValue, onChildAdded,
  push, remove, onDisconnect, off, query, limitToLast, orderByChild
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const FB_CONFIG = {
  apiKey:            "AIzaSyBnVtCaMHdousMGFEfDGi57SVf5KrkTF4A",
  authDomain:        "particle-world.firebaseapp.com",
  databaseURL:       "https://particle-world-default-rtdb.firebaseio.com",
  projectId:         "particle-world",
  storageBucket:     "particle-world.firebasestorage.app",
  messagingSenderId: "5494928895",
  appId:             "1:5494928895:web:adcedb5bedf79fa461a3ca",
};

try {
  const app = initializeApp(FB_CONFIG);
  const db  = getDatabase(app);

  // Expose everything modules need via window._fb
  window._fb = {
    db, ref, set, get, onValue, onChildAdded,
    push, remove, onDisconnect, off, query, limitToLast, orderByChild,
    ready: true,
  };

  // Log visit (stolen flag from domain lock)
  try {
    const visitRef = ref(db, 'visits/' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    set(visitRef, {
      host:   location.hostname,
      href:   location.href,
      ua:     navigator.userAgent.slice(0, 120),
      ts:     Date.now(),
      stolen: !window._pwAllowed,
    });
  } catch(e) {}

  console.log('Firebase ready');
} catch(e) {
  console.warn('Firebase init failed:', e);
  window._fb = { ready: false };
}
