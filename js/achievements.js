/**
 * PARTICLE WORLD v2.0 — js/achievements.js
 */
'use strict';

const Achievements = (() => {
  const _unlocked = new Set(JSON.parse(localStorage.getItem('pw_achievements') || '[]'));

  const ALL = [
    { id: 'first_sand',    name: 'Sandy Beginnings',    desc: 'Place your first sand.',        check: () => true },
    { id: 'first_fire',    name: 'Playing with Fire',   desc: 'Create fire for the first time.' },
    { id: 'first_explode', name: 'Boom!',                desc: 'Trigger your first explosion.' },
    { id: 'first_water',   name: 'Hydrated',             desc: 'Place water.' },
    { id: 'first_blackhole', name: 'Event Horizon',     desc: 'Spawn a black hole.' },
    { id: 'first_nuke',    name: 'Nuclear Option',       desc: 'Detonate a nuke.' },
    { id: 'first_virus',   name: 'Patient Zero',         desc: 'Unleash a virus.' },
    { id: 'first_multiplay', name: 'Better Together',   desc: 'Join a multiplayer room.' },
  ];

  function unlock(id) {
    if (_unlocked.has(id)) return;
    _unlocked.add(id);
    localStorage.setItem('pw_achievements', JSON.stringify([..._unlocked]));
    const def = ALL.find(a => a.id === id);
    if (!def) return;
    _showPopup(def);
  }

  function _showPopup(def) {
    const pop = document.createElement('div');
    pop.className = 'ach-popup';
    pop.innerHTML = `<div class="ach-title">✦ ACHIEVEMENT UNLOCKED</div>
      <div class="ach-name">${def.name}</div>
      <div class="ach-desc">${def.desc}</div>`;
    document.body.appendChild(pop);
    setTimeout(() => {
      pop.style.transition = 'opacity .5s';
      pop.style.opacity = '0';
      setTimeout(() => pop.remove(), 600);
    }, 3000);
  }

  // Hook into element placement
  const _origSet = PW?.Grid?.setCell;
  function hookGrid() {
    if (!window.PW?.Grid) return;
    const origSetCell = PW.Grid.setCell.bind(PW.Grid);
    PW.Grid.setCell = function(x, y, type, extra) {
      origSetCell(x, y, type, extra);
      if (type === 'fire')      unlock('first_fire');
      if (type === 'water')     unlock('first_water');
      if (type === 'blackhole') unlock('first_blackhole');
      if (type === 'nuke')      unlock('first_nuke');
      if (type === 'virus')     unlock('first_virus');
      if (type === 'sand')      unlock('first_sand');
    };
    // Hook explode
    const origExplode = PW.Helpers.explode;
    PW.Helpers.explode = function(...args) {
      unlock('first_explode');
      return origExplode(...args);
    };
  }

  function init() {
    setTimeout(hookGrid, 1000);
  }

  return { init, unlock, unlocked: _unlocked, all: ALL };
})();

document.addEventListener('DOMContentLoaded', () => setTimeout(() => Achievements.init(), 800));
