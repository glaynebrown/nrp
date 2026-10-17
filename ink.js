/* Apple Pencil / mouse drawing area.

   Strokes are kept in "page units": the page is always 1000 wide, so a note
   drawn on the iPad lines up the same on the laptop. Each stroke is saved as
     { c: color, w: width, k: 'pen'|'hl', p: "x,y,pressure;x,y,pressure;..." }
   A color is either a NAME (ink, rose, ...; follows your theme, lighter at night) or
   the exact color (#rrggbb) for colors you picked yourself. Each stroke keeps the color
   it was drawn in, so changing a preset later never recolors old writing.
   Lines are drawn as one smooth filled shape (perfect-freehand, freehand.js).

   On iPad: the Pencil draws and your finger scrolls (palm-friendly). Turn on
   "Finger draws" to draw with a finger instead. */
const Ink = (() => {
  const W = 1000;
  // Starting presets (each one can be changed: tap the chosen color again).
  const DEFAULT_PALETTE = {
    pen: ['ink', 'rose', 'maroon', 'lav', 'peach', 'teal'],
    hl: ['#ffe14d', '#ff8fc7', '#7ee08a', '#7cc4ff', '#ffb35c', '#c39bff'],
  };
  const SIZES = { fine: 2.2, med: 4, bold: 7 };

  const decode = s => (s || '').split(';').filter(Boolean).map(t => t.split(',').map(Number));
  const encode = pts => pts.map(p => p.join(',')).join(';');
  const cssColor = c => c && c[0] === '#' ? c
    : getComputedStyle(document.documentElement).getPropertyValue('--ink-' + c).trim() || '#333';
  // Any CSS color → #rrggbb (the color chooser needs that form).
  const toHex = c => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = cssColor(c); return x.fillStyle; };

  // One stroke = one smooth outline shape. Pressure (0–9 saved) thickens it gently;
  // strokes with no real pressure (finger, mouse) stay an even width.
  /* The iPad browser gives fewer Pencil points than a native app, so fast curves arrive as
     short straight pieces. Fill in between the points along a smooth curve (Catmull-Rom),
     and even out the pressure so the width doesn't flicker. */
  /* Safari reports Pencil positions rounded to whole screen pixels, so a gentle slope
     arrives as a tiny staircase. First drop the points that only exist because of that
     rounding (any wobble smaller than about a pixel), keeping the real bends of your
     letters; then draw a smooth curve through what's left. q = one screen pixel in page
     units when the line was drawn (saved on each stroke). */
  function simplify(pts, eps) {
    if (pts.length < 3) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); if (b - a < 2) continue;
      const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-6;
      let far = -1, fd = eps;
      for (let i = a + 1; i < b; i++) {
        const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
        if (d > fd) { fd = d; far = i; }
      }
      if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }
  function prepare(pts, q) {
    if (pts.length < 3) return pts;
    // pressure: average over ±4 neighbors (before thinning out the points)
    const sm = pts.map((p, i) => { let t = 0, n = 0;
      for (let j = Math.max(0, i - 4); j <= Math.min(pts.length - 1, i + 4); j++) { t += pts[j][2]; n++; }
      return [p[0], p[1], t / n]; });
    return densify(simplify(sm, Math.max(0.5, 0.8 * (q || 1))));
  }
  function densify(pts) {
    if (pts.length < 3) return pts;
    const pr = pts.map(p => p[2]);
    // Centripetal Catmull-Rom (alpha 0.5): unlike the plain kind, it never overshoots
    // when the Pencil points arrive unevenly spaced (that made little wiggles).
    const out = [];
    const d = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i + 1];
      const p0 = pts[i - 1] || [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
      const p3 = pts[i + 2] || [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
      const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
      const steps = Math.max(1, Math.min(24, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.2)));
      for (let k = 0; k < steps; k++) {
        const t = t1 + (t2 - t1) * k / steps;
        const lerp = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
        const A1 = lerp(p0, p1, t0, t1), A2 = lerp(p1, p2, t1, t2), A3 = lerp(p2, p3, t2, t3);
        const B1 = lerp(A1, A2, t0, t2), B2 = lerp(A2, A3, t1, t3);
        const C = lerp(B1, B2, t1, t2);
        out.push([C[0], C[1], pr[i] + (pr[i + 1] - pr[i]) * k / steps]);
      }
    }
    const last = pts[pts.length - 1];
    out.push([last[0], last[1], pr[pr.length - 1]]);
    return evenOut(out, 3);
  }
  // Finished-line cleanup: a gentle moving average along the line (about ±5 page units)
  // irons out small bumps but keeps the shape of letters. The ends stay where you put them.
  function evenOut(pts, k = 4) {
    if (pts.length < 5) return pts;
    return pts.map((p, i) => {
      const r = Math.min(k, i, pts.length - 1 - i);
      if (!r) return p;
      let x = 0, y = 0, wsum = 0;
      for (let j = -r; j <= r; j++) { const w = r + 1 - Math.abs(j); x += pts[i + j][0] * w; y += pts[i + j][1] * w; wsum += w; }
      return [x / wsum, y / wsum, p[2]];
    });
  }

  // The smooth shape of a line (in page units).
  function shape(s, pts, done) {
    const hl = s.k === 'hl';
    const real = !s.e && pts.some(p => Math.abs(p[2] - pts[0][2]) > 0.05);  // s.e = drawn with "Even line"
    const outline = getStroke(prepare(pts, s.q).map(p => [p[0], p[1], p[2] / 9]), hl
      ? { size: s.w * 4.5, thinning: 0, smoothing: 0.6, streamline: 0.2, simulatePressure: false, last: done }
      : { size: s.w * 1.1, thinning: real ? 0.22 : 0, smoothing: 0.6, streamline: 0.2, simulatePressure: false, last: done,
          start: { taper: 0, cap: true }, end: { taper: 0, cap: true } });
    const path = new Path2D();
    if (!outline.length) return path;
    path.moveTo(outline[0][0], outline[0][1]);
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      path.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    path.closePath();
    return path;
  }
  /* Finished lines never change, so each one's points, outer box and smooth shape are
     worked out once and kept. Redrawing a page (erasing, undo, scrolling) just paints them. */
  const kept = new WeakMap();
  function info(s) {
    let k = kept.get(s);
    if (!k) {
      const pts = decode(s.p), pad = s.w * (s.k === 'hl' ? 2.5 : 1);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
      k = { pts, box: [x0 - pad, y0 - pad, x1 + pad, y1 + pad], path: null };
      kept.set(s, k);
    }
    return k;
  }
  // Color names → actual colors, looked up once per redraw instead of once per line.
  let colorMemo = new Map(), colorAt = 0;
  const colorOf = c => {
    if (performance.now() - colorAt > 500) { colorMemo = new Map(); colorAt = performance.now(); }
    if (!colorMemo.has(c)) colorMemo.set(c, cssColor(c));
    return colorMemo.get(c);
  };
  // pts given = a line still being drawn (not kept); otherwise the finished line's kept shape.
  function paint(ctx, s, pts, done = true) {
    let path;
    if (pts) { if (!pts.length) return; path = shape(s, pts, done); }
    else { const k = info(s); if (!k.pts.length) return; path = k.path ||= shape(s, k.pts, true); }
    ctx.save();
    ctx.fillStyle = colorOf(s.c);
    if (s.k === 'hl') ctx.globalAlpha = 0.4;
    ctx.fill(path);
    ctx.restore();
  }

  // palette: your presets {pen: [6], hl: [6]}; onPalette(palette) when you change one.
  function mount(host, { strokes = [], h = 1300, ruled = true, onChange, palette, onPalette }) {
    let data = strokes.map(s => ({ ...s }));
    let height = h;
    const pal = { pen: [...((palette && palette.pen) || DEFAULT_PALETTE.pen)], hl: [...((palette && palette.hl) || DEFAULT_PALETTE.hl)] };
    let tool = 'pen', fingerDraws = false;
    // Pen and highlighter each remember their own size.
    const sizes = { pen: 'med', hl: 'med', ...((palette && palette.size) || {}) };
    let even = false; try { even = localStorage.getItem('nrp-inkEven') === '1'; } catch {}
    const pick = { pen: 0, hl: 0 };  // which preset is chosen, per tool
    const set = () => tool === 'hl' ? 'hl' : 'pen';
    const color = () => pal[set()][pick[set()]];
    const undo = [], redo = [];

    host.innerHTML = `
      <div class="ink-bar" role="toolbar" aria-label="Drawing tools">
        <div class="seg">
          <button data-tool="pen" title="Pen">${icon('pen')}</button>
          <button data-tool="hl" title="Highlighter">${icon('hl')}</button>
          <button data-tool="erase" title="Eraser (removes whole strokes)">${icon('erase')}</button>
        </div>
        <div class="swatches">${[0, 1, 2, 3, 4, 5].map(i => `<button class="sw" data-color="${i}" title="Color (tap again to change)"></button>`).join('')}
          <input type="color" class="sw-picker" data-picker tabindex="-1" aria-hidden="true"></div>
        <div class="seg sizes">${Object.keys(SIZES).map(s => `<button data-size="${s}" title="${s}"><i style="--d:${SIZES[s] * 2 + 2}px"></i></button>`).join('')}</div>
        <div class="seg">
          <button data-act="undo" title="Undo">${icon('undo')}</button>
          <button data-act="redo" title="Redo">${icon('redo')}</button>
        </div>
        <div class="ink-opts">
          <small class="ink-rate" data-rate title="Pencil points per second (test)"></small>
          <label class="finger"><input type="checkbox" data-act="even" ${even ? 'checked' : ''}> Even line</label>
          <label class="finger"><input type="checkbox" data-act="finger"> Finger draws</label>
        </div>
      </div>
      <div class="ink-page"><canvas></canvas></div>
      <div class="ink-foot">
        <button class="btn ghost small" data-act="more">+ More room</button>
        <button class="btn ghost small" data-act="clear">Clear drawing</button>
      </div>`;
    const canvas = host.querySelector('canvas');
    const page = host.querySelector('.ink-page');
    const ctx = canvas.getContext('2d');
    let scale = 1, dpr = 1;
    // Finished strokes are kept as a picture, so while you draw only the
    // stroke under your Pencil gets repainted (long pages stay smooth).
    const base = document.createElement('canvas');
    const showBase = () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(base, 0, 0); ctx.restore(); };

    function syncBar() {
      host.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
      host.querySelectorAll('[data-color]').forEach(b => {
        b.style.setProperty('--c', cssColor(pal[set()][b.dataset.color]));
        b.classList.toggle('on', tool !== 'erase' && +b.dataset.color === pick[set()]);
        b.classList.toggle('hl', set() === 'hl');
      });
      host.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', tool !== 'erase' && b.dataset.size === sizes[set()]));
      host.querySelector('[data-act=undo]').disabled = !undo.length;
      host.querySelector('[data-act=redo]').disabled = !redo.length;
      canvas.style.touchAction = fingerDraws ? 'none' : 'pan-y';
      canvas.style.cursor = tool === 'erase' ? 'cell' : 'crosshair';
    }

    function resize() {
      const cssW = page.clientWidth || 600;
      scale = cssW / W;
      dpr = window.devicePixelRatio || 1;
      canvas.style.height = height * scale + 'px';
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(height * scale * dpr);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      redraw();
    }

    const drawStroke = s => paint(ctx, s);
    function redraw() {
      ctx.clearRect(0, 0, W, height);
      if (ruled) {
        ctx.save();
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--rule').trim();
        ctx.lineWidth = 1.2;
        for (let y = 60; y < height; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.restore();
      }
      data.forEach(s => drawStroke(s));
      base.width = canvas.width; base.height = canvas.height;
      base.getContext('2d').drawImage(canvas, 0, 0);
    }

    const changed = () => { syncBar(); onChange && onChange({ strokes: data, h: height }); };
    const commit = (before) => { undo.push(before); if (undo.length > 60) undo.shift(); redo.length = 0; changed(); };
    const snapshot = () => ({ data: data.slice(), height });

    // ---- Pointer input ----
    let live = null, livePts = null, livePred = [], penSeen = false, before = null, frame = 0;
    // Exact position (1 decimal) + pressure 0–9 (1 decimal). Fingers and the mouse
    // have no real pressure, so they draw an even line.
    const r1 = n => Math.round(n * 10) / 10;
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      const pr = e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5;
      return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale, Math.max(0, Math.min(9, pr * 9))];
    };
    // Smoothing happens when the line is drawn (perfect-freehand), so points are kept exactly.
    const ease = p => p.map(r1);
    // While drawing, also show where the Pencil is heading (predicted points) so the line keeps up with the tip.
    const paintLive = () => { frame = 0; if (live && !live.erase) { showBase(); paint(ctx, live, livePts.concat(livePred), false); } };
    const allowed = e => e.pointerType === 'pen' || e.pointerType === 'mouse' || (e.pointerType === 'touch' && fingerDraws && !penSeen);

    // While erasing, redraw at most once per screen refresh.
    let redrawFrame = 0;
    const redrawSoon = () => { if (!redrawFrame) redrawFrame = requestAnimationFrame(() => { redrawFrame = 0; redraw(); }); };
    function eraseAt(p) {
      const r = 14;
      const keep = data.filter(s => {
        const k = info(s), [x0, y0, x1, y1] = k.box;
        if (p[0] < x0 - r || p[0] > x1 + r || p[1] < y0 - r || p[1] > y1 + r) return true;  // nowhere near
        return !k.pts.some(q => Math.abs(q[0] - p[0]) < r + s.w && Math.abs(q[1] - p[1]) < r + s.w);
      });
      if (keep.length !== data.length) { data = keep; redrawSoon(); return true; }
      return false;
    }

    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen') penSeen = true;
      if (!allowed(e) || (e.button && e.button !== 0)) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      before = snapshot();
      const p = pos(e);
      if (tool === 'erase') { live = { erase: true, hit: eraseAt(p) }; return; }
      rate = e.pointerType === 'pen' ? { n: 0, moves: 0, co: false, t0: e.timeStamp, last: e.timeStamp } : null;
      live = { q: Math.round(100 / scale) / 100, c: color(), w: SIZES[sizes[set()]], k: tool === 'hl' ? 'hl' : 'pen', ...(even ? { e: 1 } : {}) };
      livePred = [];
      livePts = [ease(p)];
    });
    // TEMPORARY test readout: how many Pencil points per second Safari hands over.
    let rate = null;
    canvas.addEventListener('pointermove', e => {
      if (!live) return;
      const co = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      const events = co.length ? co : [e];
      if (rate && e.pointerType === 'pen') { rate.n += events.length; rate.moves++; rate.co ||= co.length > 1; rate.last = e.timeStamp;
        rate.frac ||= events.some(ev => ev.clientX % 1 || ev.clientY % 1); }
      for (const ev of events) {
        const p = pos(ev);
        if (live.erase) { live.hit = eraseAt(p) || live.hit; continue; }
        const q = ease(p), last = livePts[livePts.length - 1];
        if (Math.hypot(q[0] - last[0], q[1] - last[1]) < 0.4) continue;
        livePts.push(q);
      }
      if (!live.erase) {
        const last = livePts[livePts.length - 1];
        livePred = (e.getPredictedEvents ? e.getPredictedEvents() : []).slice(0, 3).map(ev => { const q = ease(pos(ev)); q[2] = last[2]; return q; });
        if (!frame) frame = requestAnimationFrame(paintLive);
      }
    });
    const end = e => {
      if (!live) return;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      if (rate && rate.last - rate.t0 > 150) {
        const secs = (rate.last - rate.t0) / 1000;
        host.querySelector('[data-rate]').textContent = `${Math.round(rate.n / secs)} pts/s · ${Math.round(rate.moves / secs)} moves/s · ${rate.co ? 'extra ✓' : 'extra ✗'} · ${rate.frac ? 'exact' : 'whole px'}`;
      }
      rate = null;
      if (live.erase) { if (live.hit) commit(before); }
      else {
        // Finish exactly where the Pencil lifted (smoothing trails a hair behind).
        if (e && e.clientX != null) { const p = pos(e), last = livePts[livePts.length - 1];
          if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= 0.4) livePts.push([r1(p[0]), r1(p[1]), last[2]]); }
        data.push({ ...live, p: encode(livePts) }); redraw(); commit(before);
      }
      live = null; livePts = null; livePred = [];
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    // iOS: stop the Pencil from scrolling the page while your finger still can.
    canvas.addEventListener('touchstart', e => {
      if ([...e.touches].some(t => t.touchType === 'stylus')) e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      if ([...e.touches].some(t => t.touchType === 'stylus')) e.preventDefault();
    }, { passive: false });

    // ---- Toolbar ----
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) tool = b.dataset.tool;
      if (b.dataset.color) {
        const i = +b.dataset.color;
        if (tool === 'erase') tool = 'pen';
        else if (i === pick[set()]) {
          // Tap the chosen color again → rainbow color chooser to change this preset.
          const inp = host.querySelector('[data-picker]');
          inp.value = toHex(pal[set()][i]); inp.dataset.set = set(); inp.dataset.i = i;
          inp.click(); return;
        }
        pick[set()] = i;
      }
      if (b.dataset.size) {
        if (tool === 'erase') tool = 'pen';
        sizes[set()] = b.dataset.size; savePal();
      }
      const act = b.dataset.act;
      if (act === 'undo' && undo.length) { redo.push(snapshot()); const s = undo.pop(); data = s.data; height = s.height; resize(); changed(); return; }
      if (act === 'redo' && redo.length) { undo.push(snapshot()); const s = redo.pop(); data = s.data; height = s.height; resize(); changed(); return; }
      if (act === 'more') { const b4 = snapshot(); height += 600; resize(); commit(b4); return; }
      if (act === 'clear' && data.length) { const b4 = snapshot(); data = []; redraw(); commit(b4); return; }
      syncBar();
    });
    host.querySelector('[data-act=finger]').addEventListener('change', e => { fingerDraws = e.target.checked; syncBar(); });
    host.querySelector('[data-act=even]').addEventListener('change', e => { even = e.target.checked; try { localStorage.setItem('nrp-inkEven', even ? '1' : '0'); } catch {} });
    function savePal() { onPalette && onPalette({ pen: [...pal.pen], hl: [...pal.hl], size: { ...sizes } }); }
    const picker = host.querySelector('[data-picker]');
    const picked = () => {
      const k = picker.dataset.set, i = +picker.dataset.i; if (!k) return;
      pal[k][i] = picker.value; syncBar();
      savePal();
    };
    picker.addEventListener('input', picked); picker.addEventListener('change', picked);

    const ro = new ResizeObserver(() => resize());
    ro.observe(page);
    syncBar(); resize();

    return {
      get: () => ({ strokes: data, h: height }),
      redraw,
      destroy: () => ro.disconnect(),
    };
  }

  // Small read-only picture of a drawing, cropped to what was drawn.
  function preview(canvas, strokes) {
    const all = (strokes || []).map(s => ({ s, pts: info(s).pts })).filter(x => x.pts.length);
    if (!all.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    all.forEach(({ s, pts }) => pts.forEach(([x, y]) => { const r = s.k === 'hl' ? s.w * 2.5 : s.w;
      x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); }));
    const pad = 10; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const cssW = canvas.parentElement.clientWidth || 300;
    const scale = Math.min(cssW / W, 200 / (y1 - y0));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = (x1 - x0) * scale + 'px'; canvas.style.height = (y1 - y0) * scale + 'px';
    canvas.width = Math.ceil((x1 - x0) * scale * dpr); canvas.height = Math.ceil((y1 - y0) * scale * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -x0 * dpr * scale, -y0 * dpr * scale);
    all.forEach(({ s }) => paint(ctx, s));
  }

  function icon(n) {
    const p = {
      pen: '<path d="M4 20l1-5L16 4l4 4L9 19l-5 1z"/><path d="M14 6l4 4"/>',
      hl: '<path d="M9 15l-4 5h6l2-2"/><path d="M8 13l7-9 5 5-9 7z"/>',
      erase: '<path d="M8 20h12"/><path d="M4 15l9-10 7 7-8 8H9z"/>',
      undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
      redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
    }[n];
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  }

  // The whole page (1000 × h page units) drawn read-only at cssW pixels wide.
  function page(canvas, strokes, h, cssW) {
    const scale = cssW / W, dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px'; canvas.style.height = h * scale + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(h * scale * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    (strokes || []).forEach(s => paint(ctx, s));
  }

  return { mount, preview, page, DEFAULT_PALETTE };
})();
