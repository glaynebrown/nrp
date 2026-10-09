/* Apple Pencil / mouse drawing area.

   Strokes are kept in "page units": the page is always 1000 wide, so a note
   drawn on the iPad lines up the same on the laptop. Each stroke is saved as
     { c: colorName, w: width, k: 'pen'|'hl', p: "x,y,pressure;x,y,pressure;..." }
   Colors are saved by NAME (ink, rose, ...) so they follow your theme.

   On iPad: the Pencil draws and your finger scrolls (palm-friendly). Turn on
   "Finger draws" to draw with a finger instead. */
const Ink = (() => {
  const W = 1000;
  const COLORS = ['ink', 'rose', 'maroon', 'lav', 'peach', 'teal'];
  const SIZES = { fine: 2.2, med: 4, bold: 7 };

  const decode = s => (s || '').split(';').filter(Boolean).map(t => t.split(',').map(Number));
  const encode = pts => pts.map(p => p.join(',')).join(';');
  const cssColor = name => getComputedStyle(document.documentElement).getPropertyValue('--ink-' + name).trim() || '#333';

  function paint(ctx, s, pts) {
    if (!pts.length) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = cssColor(s.c);
    if (s.k === 'hl') {
      ctx.globalAlpha = 0.35; ctx.lineWidth = s.w * 4.5;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      pts.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.stroke();
    } else if (pts.length === 1) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], s.w * 0.6, 0, 7); ctx.fill();
    } else {
      // Smooth curve through midpoints; width follows Pencil pressure.
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], prev = pts[i - 2] || a;
        ctx.lineWidth = s.w * (0.55 + 0.09 * b[2]);
        ctx.beginPath();
        ctx.moveTo((prev[0] + a[0]) / 2, (prev[1] + a[1]) / 2);
        ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        if (i === pts.length - 1) ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function mount(host, { strokes = [], h = 1300, ruled = true, onChange }) {
    let data = strokes.map(s => ({ ...s }));
    let height = h;
    let tool = 'pen', color = 'ink', size = 'med', fingerDraws = false;
    const undo = [], redo = [];

    host.innerHTML = `
      <div class="ink-bar" role="toolbar" aria-label="Drawing tools">
        <div class="seg">
          <button data-tool="pen" title="Pen">${icon('pen')}</button>
          <button data-tool="hl" title="Highlighter">${icon('hl')}</button>
          <button data-tool="erase" title="Eraser (removes whole strokes)">${icon('erase')}</button>
        </div>
        <div class="swatches">${COLORS.map(c => `<button class="sw" data-color="${c}" style="--c:var(--ink-${c})" title="${c}"></button>`).join('')}</div>
        <div class="seg sizes">${Object.keys(SIZES).map(s => `<button data-size="${s}" title="${s}"><i style="--d:${SIZES[s] * 2 + 2}px"></i></button>`).join('')}</div>
        <div class="seg">
          <button data-act="undo" title="Undo">${icon('undo')}</button>
          <button data-act="redo" title="Redo">${icon('redo')}</button>
        </div>
        <label class="finger"><input type="checkbox" data-act="finger"> Finger draws</label>
      </div>
      <div class="ink-page"><canvas></canvas></div>
      <div class="ink-foot">
        <button class="btn ghost small" data-act="more">+ More room</button>
        <button class="btn ghost small" data-act="clear">Clear drawing</button>
      </div>`;
    const canvas = host.querySelector('canvas');
    const page = host.querySelector('.ink-page');
    const ctx = canvas.getContext('2d');
    let scale = 1;

    function syncBar() {
      host.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
      host.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b.dataset.color === color));
      host.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', b.dataset.size === size));
      host.querySelector('[data-act=undo]').disabled = !undo.length;
      host.querySelector('[data-act=redo]').disabled = !redo.length;
      canvas.style.touchAction = fingerDraws ? 'none' : 'pan-y';
      canvas.style.cursor = tool === 'erase' ? 'cell' : 'crosshair';
    }

    function resize() {
      const cssW = page.clientWidth || 600;
      scale = cssW / W;
      const dpr = window.devicePixelRatio || 1;
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
    }

    const changed = () => { syncBar(); onChange && onChange({ strokes: data, h: height }); };
    const commit = (before) => { undo.push(before); if (undo.length > 60) undo.shift(); redo.length = 0; changed(); };
    const snapshot = () => ({ data: data.slice(), height });

    // ---- Pointer input ----
    let live = null, livePts = null, penSeen = false, before = null;
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      const pr = e.pointerType === 'mouse' || !e.pressure ? 0.5 : e.pressure;
      return [Math.round((e.clientX - r.left) / scale), Math.round((e.clientY - r.top) / scale), Math.max(0, Math.min(9, Math.round(pr * 9)))];
    };
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
      live = { c: color, w: SIZES[size], k: tool === 'hl' ? 'hl' : 'pen' };
      livePts = [p];
    });
    canvas.addEventListener('pointermove', e => {
      if (!live) return;
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of events) {
        const p = pos(ev);
        if (live.erase) { live.hit = eraseAt(p) || live.hit; continue; }
        const last = livePts[livePts.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) continue;
        livePts.push(p);
      }
      if (!live.erase) { redraw(); drawStroke(live, livePts); }
    });
    const end = () => {
      if (!live) return;
      if (live.erase) { if (live.hit) commit(before); }
      else { data.push({ ...live, p: encode(livePts) }); redraw(); commit(before); }
      live = null; livePts = null;
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
      if (b.dataset.color) { color = b.dataset.color; if (tool === 'erase') tool = 'pen'; }
      if (b.dataset.size) { size = b.dataset.size; if (tool === 'erase') tool = 'pen'; }
      const act = b.dataset.act;
      if (act === 'undo' && undo.length) { redo.push(snapshot()); const s = undo.pop(); data = s.data; height = s.height; resize(); changed(); return; }
      if (act === 'redo' && redo.length) { undo.push(snapshot()); const s = redo.pop(); data = s.data; height = s.height; resize(); changed(); return; }
      if (act === 'more') { const b4 = snapshot(); height += 600; resize(); commit(b4); return; }
      if (act === 'clear' && data.length) { const b4 = snapshot(); data = []; redraw(); commit(b4); return; }
      syncBar();
    });
    host.querySelector('[data-act=finger]').addEventListener('change', e => { fingerDraws = e.target.checked; syncBar(); });

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

  return { mount, preview };
})();
