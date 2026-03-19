/**
 * PARTICLE WORLD v1.3 Beta — core.js
 * Grid, renderer, game loop, element registry.
 * No element logic lives here — elements register themselves via ElementRegistry.
 */

'use strict';

// ══════════════════════════════════════════════════════════════════
// DOMAIN LOCK
// ══════════════════════════════════════════════════════════════════
(function() {
  const ALLOWED = ['omelette180.github.io/Particle-World', 'localhost', '127.0.0.1'];
  const loc = location.hostname + location.pathname;
  const allowed = ALLOWED.some(d => loc.includes(d) || location.hostname === d);
  window._pwAllowed = allowed;
  if (!allowed) {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <div style="position:fixed;inset:0;background:#000;display:flex;flex-direction:column;
          align-items:center;justify-content:center;font-family:monospace;color:#ff4444;text-align:center;padding:2rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <div style="font-size:1.1rem;font-weight:bold;margin-bottom:.5rem;">Unauthorized Copy Detected</div>
          <div style="font-size:.75rem;color:#666;margin-bottom:1.5rem;">This game only runs on its official domain.</div>
          <a href="https://omelette180.github.io/Particle-World/" style="color:#a855f7;font-size:.8rem;">
            Play the real Particle World →
          </a>
        </div>`;
    });
  }
})();

// ══════════════════════════════════════════════════════════════════
// ELEMENT REGISTRY
// Each element file calls ElementRegistry.register({ ... })
// ══════════════════════════════════════════════════════════════════
const ElementRegistry = (() => {
  const _elements = new Map();  // id (string) → definition
  let _nextId = 1;

  return {
    /**
     * Register an element.
     * @param {Object} def
     *   id:       string   — unique key e.g. 'sand'
     *   name:     string   — display name e.g. 'Sand'
     *   category: string   — category key e.g. 'powders'
     *   color:    string | (cell, x, y) => string
     *   density:  number   — 0=gas, 0.5=liquid, 1=solid
     *   state:    'solid'|'liquid'|'gas'|'energy'|'special'
     *   tick:     (x, y, grid, helpers) => void
     *   // optional
     *   desc:     string
     *   tags:     string[]
     *   flavor:   string
     *   heat:     number   — starting heat value
     *   meltAt:   number   — temperature → meltsInto
     *   meltsInto:string
     *   burnAt:   number   — temperature → ignites
     *   hidden:   bool     — don't show in sidebar
     */
    register(def) {
      try {
        if (!def || !def.id) {
          console.warn('ElementRegistry: register() called with no id — skipping', def);
          return;
        }
        if (_elements.has(def.id)) {
          console.warn(`ElementRegistry: duplicate id "${def.id}" — skipping`);
          return;
        }
        // Assign a numeric id for fast lookup in the grid
        def._numId = _nextId++;
        _elements.set(def.id, def);
      } catch(e) {
        console.error(`ElementRegistry: failed to register element "${def?.id}"`, e);
      }
    },

    get(id)     { return _elements.get(id) ?? null; },
    getByNum(n) {
      for (const e of _elements.values()) if (e._numId === n) return e;
      return null;
    },
    has(id)     { return _elements.has(id); },
    all()       { return _elements.values(); },
    allArray()  { return [..._elements.values()]; },
    count()     { return _elements.size; },

    // Mod elements get IDs starting from 1000 to avoid clashes
    registerMod(def) {
      def._numId = 1000 + _nextId++;
      def._isMod = true;
      _elements.set(def.id, def);
    },
  };
})();

// ══════════════════════════════════════════════════════════════════
// GRID
// Each cell is an object: { type: string, color: string, energy: number,
//                           heat: number, dir: number, flags: number }
// type = element id string ('sand', 'water', etc.) or 'empty'
// ══════════════════════════════════════════════════════════════════
const Grid = (() => {
  let _cols = 0, _rows = 0;
  let _cells = null;     // flat array of cell objects, length = cols*rows
  let _updated = null;   // Uint8Array — tick stamp per cell (avoids double-updates)
  let _stamp = 0;        // current tick stamp

  // ── Empty cell template (reused to avoid GC pressure)
  const EMPTY_CELL = Object.freeze({ type: 'empty', color: '#000000', energy: 0, heat: 0, dir: 0, flags: 0 });

  function _idx(x, y) { return y * _cols + x; }

  function _makeCell(type, extra = {}) {
    const def = ElementRegistry.get(type);
    return {
      type,
      color:  typeof def?.color === 'string' ? def.color : (def?.color?.() ?? '#888888'),
      energy: extra.energy ?? def?.energy ?? 0,
      heat:   extra.heat   ?? def?.heat   ?? 0,
      dir:    extra.dir    ?? 0,
      flags:  extra.flags  ?? 0,
    };
  }

  return {
    init(cols, rows) {
      _cols = cols; _rows = rows;
      _cells   = new Array(cols * rows).fill(null).map(() => ({ ...EMPTY_CELL }));
      _updated = new Uint8Array(cols * rows);
      _stamp   = 0;
    },

    get cols() { return _cols; },
    get rows() { return _rows; },
    get stamp(){ return _stamp; },

    inBounds(x, y) { return x >= 0 && x < _cols && y >= 0 && y < _rows; },

    getCell(x, y) {
      if (!this.inBounds(x, y)) return null;
      return _cells[_idx(x, y)];
    },

    getType(x, y) {
      if (!this.inBounds(x, y)) return null;
      return _cells[_idx(x, y)].type;
    },

    isEmpty(x, y) {
      if (!this.inBounds(x, y)) return false;
      return _cells[_idx(x, y)].type === 'empty';
    },

    setCell(x, y, type, extra = {}) {
      if (!this.inBounds(x, y)) return;
      const i = _idx(x, y);
      if (type === 'empty') {
        _cells[i] = { ...EMPTY_CELL };
      } else {
        _cells[i] = _makeCell(type, extra);
      }
      _updated[i] = _stamp; // mark as updated this tick
    },

    clearCell(x, y) {
      if (!this.inBounds(x, y)) return;
      const i = _idx(x, y);
      _cells[i] = { ...EMPTY_CELL };
    },

    swapCells(x1, y1, x2, y2) {
      if (!this.inBounds(x1,y1) || !this.inBounds(x2,y2)) return;
      const i1 = _idx(x1,y1), i2 = _idx(x2,y2);
      const tmp = _cells[i1];
      _cells[i1] = _cells[i2];
      _cells[i2] = tmp;
      _updated[i1] = _stamp;
      _updated[i2] = _stamp;
    },

    wasUpdated(x, y) {
      if (!this.inBounds(x, y)) return true;
      return _updated[_idx(x, y)] === _stamp;
    },

    markUpdated(x, y) {
      if (!this.inBounds(x, y)) return;
      _updated[_idx(x, y)] = _stamp;
    },

    tickStamp() { _stamp = (_stamp + 1) & 0xFF; },

    countNonEmpty() {
      let n = 0;
      for (let i = 0; i < _cells.length; i++) {
        if (_cells[i].type !== 'empty') n++;
      }
      return n;
    },

    clear() {
      for (let i = 0; i < _cells.length; i++) _cells[i] = { ...EMPTY_CELL };
    },

    // Serialize for multiplayer sync
    serialize() {
      return _cells.map(c => c.type === 'empty' ? 0 : c.type + '|' + c.energy + '|' + c.heat + '|' + c.dir);
    },

    deserialize(data) {
      for (let i = 0; i < data.length && i < _cells.length; i++) {
        if (data[i] === 0) { _cells[i] = { ...EMPTY_CELL }; continue; }
        const [type, energy, heat, dir] = data[i].split('|');
        _cells[i] = _makeCell(type, { energy: +energy, heat: +heat, dir: +dir });
      }
    },
  };
})();

// ══════════════════════════════════════════════════════════════════
// RENDERER
// Fast ImageData pixel renderer with glow pass
// ══════════════════════════════════════════════════════════════════
const Renderer = (() => {
  let _canvas, _ctx;
  let _imageData, _pixels; // Uint32Array view into imageData
  let _cols, _rows, _cellSize;
  let _isLE; // endianness flag
  let _colorCache = new Map();
  let _glowCanvas, _glowCtx; // quarter-res offscreen for glow
  let _glowTimer = 0;
  const GLOW_INTERVAL = 3; // update glow every N frames

  function _parseColor(hex) {
    // Returns AABBGGRR packed uint32 (little endian) or RRGGBBAA (big endian)
    if (_colorCache.has(hex)) return _colorCache.get(hex);
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    const packed = _isLE
      ? (255 << 24) | (b << 16) | (g << 8) | r
      : (r << 24) | (g << 16) | (b << 8) | 255;
    _colorCache.set(hex, packed >>> 0);
    if (_colorCache.size > 8192) _colorCache.clear();
    return packed >>> 0;
  }

  return {
    init(canvas, cols, rows, cellSize) {
      _canvas = canvas; _ctx = canvas.getContext('2d');
      _cols = cols; _rows = rows; _cellSize = cellSize;
      canvas.width  = cols * cellSize;
      canvas.height = rows * cellSize;

      // Detect endianness
      const buf = new ArrayBuffer(4);
      new DataView(buf).setUint32(0, 0x01020304, true);
      _isLE = new Uint8Array(buf)[0] === 4;

      _imageData = _ctx.createImageData(canvas.width, canvas.height);
      _pixels    = new Uint32Array(_imageData.data.buffer);

      // Glow canvas at quarter resolution
      _glowCanvas = document.createElement('canvas');
      _glowCanvas.width  = Math.ceil(canvas.width  / 4);
      _glowCanvas.height = Math.ceil(canvas.height / 4);
      _glowCtx = _glowCanvas.getContext('2d');
    },

    resize(cols, rows, cellSize) {
      _cols = cols; _rows = rows; _cellSize = cellSize;
      _canvas.width  = cols * cellSize;
      _canvas.height = rows * cellSize;
      _imageData = _ctx.createImageData(_canvas.width, _canvas.height);
      _pixels    = new Uint32Array(_imageData.data.buffer);
      _glowCanvas.width  = Math.ceil(_canvas.width  / 4);
      _glowCanvas.height = Math.ceil(_canvas.height / 4);
    },

    render(frame) {
      const cs = _cellSize;
      const W  = _cols * cs;
      const BG = _isLE ? (255 << 24) | 0x00000009 : 0x09000000 | 255; // ~#090909

      // Fill background
      _pixels.fill(BG);

      // Draw each cell
      for (let y = 0; y < _rows; y++) {
        for (let x = 0; x < _cols; x++) {
          const cell = Grid.getCell(x, y);
          if (!cell || cell.type === 'empty') continue;

          // Resolve color — can be dynamic
          let hex = cell.color;
          const def = ElementRegistry.get(cell.type);
          if (def && typeof def.color === 'function') {
            hex = def.color(cell, x, y, frame);
          }
          if (!hex || hex.length < 7) continue;

          const packed = _parseColor(hex);
          const py = y * cs, px2 = x * cs;
          for (let dy = 0; dy < cs; dy++) {
            const row = (py + dy) * W + px2;
            for (let dx = 0; dx < cs; dx++) {
              _pixels[row + dx] = packed;
            }
          }
        }
      }

      _ctx.putImageData(_imageData, 0, 0);

      // Glow pass (every GLOW_INTERVAL frames)
      _glowTimer++;
      if (_glowTimer >= GLOW_INTERVAL) {
        _glowTimer = 0;
        this._renderGlow();
      }
    },

    _renderGlow() {
      // Draw quarter-res version of canvas, blur, composite back
      _glowCtx.clearRect(0, 0, _glowCanvas.width, _glowCanvas.height);
      _glowCtx.drawImage(_canvas, 0, 0, _glowCanvas.width, _glowCanvas.height);
      _glowCtx.filter = 'blur(4px)';
      _glowCtx.globalCompositeOperation = 'screen';
      _glowCtx.drawImage(_glowCanvas, 0, 0);
      _glowCtx.filter = 'none';
      _glowCtx.globalCompositeOperation = 'source-over';

      _ctx.save();
      _ctx.globalAlpha = 0.18;
      _ctx.globalCompositeOperation = 'screen';
      _ctx.drawImage(_glowCanvas, 0, 0, _canvas.width, _canvas.height);
      _ctx.restore();
    },
  };
})();

// ══════════════════════════════════════════════════════════════════
// PHYSICS HELPERS — passed to every element tick function
// ══════════════════════════════════════════════════════════════════
const Helpers = {
  // Random 0..1
  rnd: () => Math.random(),

  // Random bool with probability p
  chance: (p) => Math.random() < p,

  // Random int in [min, max] inclusive
  randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

  // Shuffle an array in place
  shuffle: (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = 0 | Math.random() * (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // 4 cardinal neighbors [[dx,dy],...]
  neighbors4: (x, y) => [[x,y-1],[x+1,y],[x,y+1],[x-1,y]],

  // 8 neighbors
  neighbors8: (x, y) => [
    [x-1,y-1],[x,y-1],[x+1,y-1],
    [x-1,y  ],        [x+1,y  ],
    [x-1,y+1],[x,y+1],[x+1,y+1],
  ],

  // Shuffled 4 neighbors (avoids directional bias)
  neighbors4r: (x, y) => {
    const n = [[x,y-1],[x+1,y],[x,y+1],[x-1,y]];
    for (let i = 3; i > 0; i--) {
      const j = 0 | Math.random() * (i + 1);
      [n[i], n[j]] = [n[j], n[i]];
    }
    return n;
  },

  // Spread to random lower neighbor (for powders)
  fallBelow: (x, y) => {
    if (Grid.isEmpty(x, y + 1)) { Grid.swapCells(x, y, x, y + 1); return true; }
    const d = Math.random() < 0.5 ? 1 : -1;
    if (Grid.isEmpty(x + d, y + 1)) { Grid.swapCells(x, y, x + d, y + 1); return true; }
    if (Grid.isEmpty(x - d, y + 1)) { Grid.swapCells(x, y, x - d, y + 1); return true; }
    return false;
  },

  // Flow sideways (for liquids)
  flowSideways: (x, y, flowRate = 3) => {
    const d = Math.random() < 0.5 ? 1 : -1;
    for (let i = 1; i <= flowRate; i++) {
      if (!Grid.isEmpty(x + d * i, y)) break;
      if (i === flowRate || !Grid.isEmpty(x + d * i, y - 1)) {
        Grid.swapCells(x, y, x + d * i, y);
        return true;
      }
    }
    for (let i = 1; i <= flowRate; i++) {
      if (!Grid.isEmpty(x - d * i, y)) break;
      if (i === flowRate || !Grid.isEmpty(x - d * i, y - 1)) {
        Grid.swapCells(x, y, x - d * i, y);
        return true;
      }
    }
    return false;
  },

  // Rise upward (for gases)
  riseUp: (x, y) => {
    if (Grid.isEmpty(x, y - 1)) { Grid.swapCells(x, y, x, y - 1); return true; }
    const d = Math.random() < 0.5 ? 1 : -1;
    if (Grid.isEmpty(x + d, y - 1)) { Grid.swapCells(x, y, x + d, y - 1); return true; }
    if (Grid.isEmpty(x - d, y - 1)) { Grid.swapCells(x, y, x - d, y - 1); return true; }
    if (Grid.isEmpty(x + d, y))     { Grid.swapCells(x, y, x + d, y);     return true; }
    if (Grid.isEmpty(x - d, y))     { Grid.swapCells(x, y, x - d, y);     return true; }
    return false;
  },

  // Density-based swap — heavier element sinks below lighter
  densitySwap: (x, y) => {
    const myDef = ElementRegistry.get(Grid.getType(x, y));
    if (!myDef) return false;
    const below = Grid.getType(x, y + 1);
    if (!below || below === 'empty') return false;
    const belowDef = ElementRegistry.get(below);
    if (!belowDef) return false;
    if (myDef.density > belowDef.density && Math.random() < 0.4) {
      Grid.swapCells(x, y, x, y + 1);
      return true;
    }
    return false;
  },

  // Spread fire / ignite neighbors
  spreadFire: (x, y, chance = 0.01) => {
    for (const [nx, ny] of Helpers.neighbors4(x, y)) {
      const def = ElementRegistry.get(Grid.getType(nx, ny));
      if (!def || !def.burnAt) continue;
      const heat = Grid.getCell(nx, ny)?.heat ?? 0;
      if (heat > def.burnAt && Math.random() < chance) {
        Grid.setCell(nx, ny, 'fire');
      }
    }
  },

  // Explode — clear cells in radius, spawn fire
  explode: (x, y, radius, strength = 1) => {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx*dx + dy*dy > r2) continue;
        const nx = x + dx, ny = y + dy;
        if (!Grid.inBounds(nx, ny)) continue;
        const dist = Math.sqrt(dx*dx + dy*dy) / radius;
        if (Math.random() < strength * (1 - dist * 0.6)) {
          const t = Grid.getType(nx, ny);
          if (t !== 'wall' && t !== 'concrete') {
            Grid.setCell(nx, ny, dist < 0.5 ? 'empty' : (Math.random() < 0.4 ? 'fire' : 'empty'));
          }
        }
      }
    }
  },

  // Heat diffusion helpers
  addHeat: (x, y, amount) => {
    const cell = Grid.getCell(x, y);
    if (cell) cell.heat = (cell.heat ?? 0) + amount;
  },

  getHeat: (x, y) => Grid.getCell(x, y)?.heat ?? 0,
};

// ══════════════════════════════════════════════════════════════════
// SIMULATION — the main tick loop
// ══════════════════════════════════════════════════════════════════
const Simulation = (() => {
  let _running  = false;
  let _speed    = 2;      // ticks per frame
  let _frame    = 0;
  let _lastTime = 0;
  let _fps      = 60;
  let _fpsTimer = 0;
  let _fpsCount = 0;
  let _rafId    = null;

  // Heat diffusion — runs every 6 frames
  function _diffuseHeat() {
    for (let y = 0; y < Grid.rows; y++) {
      for (let x = 0; x < Grid.cols; x++) {
        const cell = Grid.getCell(x, y);
        if (!cell || cell.type === 'empty') continue;
        if (!cell.heat) continue;
        const def = ElementRegistry.get(cell.type);
        const conductivity = def?.heatConductivity ?? 0.1;
        for (const [nx, ny] of Helpers.neighbors4(x, y)) {
          const neighbor = Grid.getCell(nx, ny);
          if (!neighbor) continue;
          const diff = (cell.heat - (neighbor.heat ?? 0)) * conductivity * 0.25;
          if (Math.abs(diff) < 0.01) continue;
          cell.heat     -= diff;
          neighbor.heat  = (neighbor.heat ?? 0) + diff;
        }
      }
    }
  }

  // Melt/freeze/ignite checks — runs every 4 frames
  function _phaseChecks() {
    for (let y = 0; y < Grid.rows; y++) {
      for (let x = 0; x < Grid.cols; x++) {
        const cell = Grid.getCell(x, y);
        if (!cell || cell.type === 'empty') continue;
        const def = ElementRegistry.get(cell.type);
        if (!def) continue;
        const heat = cell.heat ?? 0;

        // Melt
        if (def.meltAt !== undefined && heat >= def.meltAt && def.meltsInto) {
          Grid.setCell(x, y, def.meltsInto, { heat });
          continue;
        }
        // Freeze
        if (def.freezeAt !== undefined && heat <= def.freezeAt && def.freezesInto) {
          Grid.setCell(x, y, def.freezesInto, { heat });
          continue;
        }
        // Ignite
        if (def.burnAt !== undefined && heat >= def.burnAt) {
          if (Math.random() < 0.05) Grid.setCell(x, y, 'fire', { heat });
          continue;
        }
      }
    }
  }

  function _tickAll() {
    Grid.tickStamp();
    // Iterate bottom-to-top, alternating left/right to avoid bias
    const leftToRight = _frame % 2 === 0;
    for (let y = Grid.rows - 1; y >= 0; y--) {
      const start = leftToRight ? 0 : Grid.cols - 1;
      const end   = leftToRight ? Grid.cols : -1;
      const step  = leftToRight ? 1 : -1;
      for (let x = start; x !== end; x += step) {
        if (Grid.wasUpdated(x, y)) continue;
        const cell = Grid.getCell(x, y);
        if (!cell || cell.type === 'empty') continue;
        const def = ElementRegistry.get(cell.type);
        if (!def?.tick) continue;
        Grid.markUpdated(x, y);
        def.tick(x, y, Grid, Helpers, _frame);
      }
    }
  }

  function _loop(timestamp) {
    _rafId = requestAnimationFrame(_loop);

    const dt = timestamp - _lastTime;
    _lastTime = timestamp;

    // FPS counter
    _fpsCount++;
    _fpsTimer += dt;
    if (_fpsTimer >= 1000) {
      _fps = _fpsCount;
      _fpsCount = 0;
      _fpsTimer -= 1000;
      const fpsel = document.getElementById('statFps') || document.getElementById('sF');
      if (fpsel) fpsel.textContent = _fps;
    }

    if (_running) {
      for (let s = 0; s < _speed; s++) {
        _tickAll();
        _frame++;
        if (_frame % 6 === 0) _diffuseHeat();
        if (_frame % 4 === 0) _phaseChecks();
      }
    }

    // Render
    Renderer.render(_frame);

    // Particle count (every 30 frames)
    if (_frame % 30 === 0) {
      const pesel = document.getElementById('statParts') || document.getElementById('sP');
      if (pesel) pesel.textContent = Grid.countNonEmpty();
    }
  }

  return {
    start()  { _running = true;  if (!_rafId) { _lastTime = performance.now(); _rafId = requestAnimationFrame(_loop); } },
    pause()  { _running = false; },
    resume() { _running = true;  },
    toggle() { _running = !_running; return _running; },
    get running()  { return _running; },
    get fps()      { return _fps; },
    get frame()    { return _frame; },
    setSpeed(s)    { _speed = Math.max(1, Math.min(16, s)); },
    get speed()    { return _speed; },
  };
})();

// ══════════════════════════════════════════════════════════════════
// INPUT HANDLING
// ══════════════════════════════════════════════════════════════════
const Input = (() => {
  let _canvas, _cellSize;
  let _selectedElement = 'sand';
  let _brushSize = 3;
  let _drawing = false;
  let _erasing = false;
  let _lastX = -1, _lastY = -1;

  function _canvasCoords(e) {
    const rect = _canvas.getBoundingClientRect();
    const scaleX = _canvas.width  / rect.width;
    const scaleY = _canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.floor((clientX - rect.left) * scaleX / _cellSize),
      y: Math.floor((clientY - rect.top)  * scaleY / _cellSize),
    };
  }

  function _draw(x, y, erase = false) {
    const r = _brushSize;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx*dx + dy*dy > r*r) continue;
        const nx = x + dx, ny = y + dy;
        if (!Grid.inBounds(nx, ny)) continue;
        if (erase) {
          Grid.clearCell(nx, ny);
        } else {
          if (Grid.isEmpty(nx, ny) || _brushSize > 1) {
            Grid.setCell(nx, ny, _selectedElement);
          }
        }
      }
    }
  }

  function _onMove(e) {
    e.preventDefault();
    if (!_drawing) return;
    const { x, y } = _canvasCoords(e);
    if (x === _lastX && y === _lastY) return;
    _lastX = x; _lastY = y;
    _draw(x, y, _erasing);
    // Update bottom bar
    document.getElementById('btmPos').textContent = `${x}, ${y}`;
  }

  function _onDown(e) {
    e.preventDefault();
    _drawing = true;
    _erasing = e.button === 2 || e.ctrlKey;
    const { x, y } = _canvasCoords(e);
    _lastX = x; _lastY = y;
    _draw(x, y, _erasing);
  }

  function _onUp(e) { _drawing = false; }

  return {
    init(canvas, cellSize) {
      _canvas = canvas; _cellSize = cellSize;
      canvas.addEventListener('mousedown',  _onDown, { passive: false });
      canvas.addEventListener('mousemove',  _onMove, { passive: false });
      canvas.addEventListener('mouseup',    _onUp);
      canvas.addEventListener('mouseleave', _onUp);
      canvas.addEventListener('contextmenu', e => e.preventDefault());
      canvas.addEventListener('touchstart', _onDown, { passive: false });
      canvas.addEventListener('touchmove',  _onMove, { passive: false });
      canvas.addEventListener('touchend',   _onUp);
    },

    setElement(id) {
      _selectedElement = id;
      document.getElementById('btmSel').textContent = id;
    },

    setBrush(size) { _brushSize = size; },
    get selected()  { return _selectedElement; },
    get brushSize() { return _brushSize; },
  };
})();

// ══════════════════════════════════════════════════════════════════
// EXPOSE PW GLOBALLY — immediately so ui.js can access it
// ══════════════════════════════════════════════════════════════════
window.PW = {
  Grid, Renderer, Simulation, Input, Helpers, ElementRegistry,
  version: '1.3.0',
};

// ══════════════════════════════════════════════════════════════════
// GAME INIT — called by ui.js after DOM is ready
// ══════════════════════════════════════════════════════════════════
function initGame() {
  const CELL_SIZE = parseInt(localStorage.getItem('pw_cellSize') || '3');
  const canvas = document.getElementById('gc');
  const wrap   = document.getElementById('canvasWrap');

  if (!canvas || !wrap) { console.error('Canvas not found'); return; }

  function resize() {
    const w = wrap.clientWidth  || window.innerWidth;
    const h = wrap.clientHeight || window.innerHeight;
    const cols = Math.max(10, Math.floor(w / CELL_SIZE));
    const rows = Math.max(10, Math.floor(h / CELL_SIZE));
    Grid.init(cols, rows);
    Renderer.init(canvas, cols, rows, CELL_SIZE);
    for (const id of ['hmc', 'bhc']) {
      const c = document.getElementById(id);
      if (!c) continue;
      c.width  = canvas.width;
      c.height = canvas.height;
    }
  }

  resize();
  window.addEventListener('resize', resize);
  Input.init(canvas, CELL_SIZE);
  Simulation.start();

  console.log(`Particle World v1.3 Beta — ${ElementRegistry.count()} elements loaded`);
}

// ══════════════════════════════════════════════════════════════════
// LOADING PROGRESS — ui.js calls PW.setLoadProgress(pct, msg)
// ══════════════════════════════════════════════════════════════════
window.PW_setLoadProgress = function(pct, msg) {
  const bar = document.getElementById('lbar');
  const txt = document.getElementById('ltxt');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = msg;
};
