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
  function densify(pts) {
    if (pts.length < 3) return pts;
    // pressure: average over ±4 neighbors
    const pr = pts.map((_, i) => { let t = 0, n = 0;
      for (let j = Math.max(0, i - 4); j <= Math.min(pts.length - 1, i + 4); j++) { t += pts[j][2]; n++; }
      return t / n; });
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const steps = Math.max(1, Math.min(24, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.2)));
      for (let k = 0; k < steps; k++) {
        const t = k / steps, t2 = t * t, t3 = t2 * t;
        const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
        out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), pr[i] + (pr[i + 1] - pr[i]) * t]);
      }
    }
    const last = pts[pts.length - 1];
    out.push([last[0], last[1], pr[pr.length - 1]]);
    return out;
  }

  function paint(ctx, s, pts, done = true) {
    if (!pts.length) return;
    const hl = s.k === 'hl';
    const real = !s.e && pts.some(p => Math.abs(p[2] - pts[0][2]) > 0.05);  // s.e = drawn with "Even line"
    const outline = getStroke(densify(pts).map(p => [p[0], p[1], p[2] / 9]), hl
      ? { size: s.w * 4.5, thinning: 0, smoothing: 0.6, streamline: 0.35, simulatePressure: false, last: done }
      : { size: s.w * 1.1, thinning: real ? 0.22 : 0, smoothing: 0.6, streamline: 0.35, simulatePressure: false, last: done,
          start: { taper: 0, cap: true }, end: { taper: 0, cap: true } });
    if (!outline.length) return;
    ctx.save();
    ctx.fillStyle = cssColor(s.c);
    if (hl) ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(outline[0][0], outline[0][1]);
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // palette: your presets {pen: [6], hl: [6]}; onPalette(palette) when you change one.
  function mount(host, { strokes = [], h = 1300, ruled = true, onChange, palette, onPalette }) {
    let data = strokes.map(s => ({ ...s }));
    let height = h;
    const pal = { pen: [...((palette && palette.pen) || DEFAULT_PALETTE.pen)], hl: [...((palette && palette.hl) || DEFAULT_PALETTE.hl)] };
    let tool = 'pen', size = 'med', fingerDraws = false;
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
      host.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', b.dataset.size === size));
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

    const drawStroke = (s, pts = decode(s.p)) => paint(ctx, s, pts);
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

    function eraseAt(p) {
      const r = 14;
      const keep = data.filter(s => !decode(s.p).some(q => Math.abs(q[0] - p[0]) < r + s.w && Math.abs(q[1] - p[1]) < r + s.w));
      if (keep.length !== data.length) { data = keep; redraw(); return true; }
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
      live = { c: color(), w: SIZES[size], k: tool === 'hl' ? 'hl' : 'pen', ...(even ? { e: 1 } : {}) };
      livePred = [];
      livePts = [ease(p)];
    });
    canvas.addEventListener('pointermove', e => {
      if (!live) return;
      const co = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      const events = co.length ? co : [e];
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
      if (b.dataset.size) { size = b.dataset.size; if (tool === 'erase') tool = 'pen'; }
      const act = b.dataset.act;
      if (act === 'undo' && undo.length) { redo.push(snapshot()); const s = undo.pop(); data = s.data; height = s.height; resize(); changed(); return; }
      if (act === 'redo' && redo.length) { undo.push(snapshot()); const s = redo.pop(); data = s.data; height = s.height; resize(); changed(); return; }
      if (act === 'more') { const b4 = snapshot(); height += 600; resize(); commit(b4); return; }
      if (act === 'clear' && data.length) { const b4 = snapshot(); data = []; redraw(); commit(b4); return; }
      syncBar();
    });
    host.querySelector('[data-act=finger]').addEventListener('change', e => { fingerDraws = e.target.checked; syncBar(); });
    host.querySelector('[data-act=even]').addEventListener('change', e => { even = e.target.checked; try { localStorage.setItem('nrp-inkEven', even ? '1' : '0'); } catch {} });
    const picker = host.querySelector('[data-picker]');
    const picked = () => {
      const k = picker.dataset.set, i = +picker.dataset.i; if (!k) return;
      pal[k][i] = picker.value; syncBar();
      onPalette && onPalette({ pen: [...pal.pen], hl: [...pal.hl] });
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
    const all = (strokes || []).map(s => ({ s, pts: decode(s.p) })).filter(x => x.pts.length);
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
    all.forEach(({ s, pts }) => paint(ctx, s, pts));
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
    (strokes || []).forEach(s => paint(ctx, s, decode(s.p)));
  }

  return { mount, preview, page, DEFAULT_PALETTE };
})();
