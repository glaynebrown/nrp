/* NRP study app: screens, run-through timers, med math, airway visuals, notes.
   Content lives in content.js; saving lives in store.js; drawing in ink.js. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const view = $('#view');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = s => esc(s)
    .replace(/==(.+?)==/g, '<mark class="pe">$1</mark>')
    .replace(/\+\+(.+?)\+\+/g, '<mark class="lv">$1</mark>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[\[verify\]\]/g, '<span class="vdot" title="Check this in your book"></span>');
  const local = {
    get(k, d) { try { const v = localStorage.getItem('nrp-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('nrp-' + k, JSON.stringify(v)); } catch {} },
  };
  const round2 = n => Math.round(n * 100) / 100;
  const fmt = n => { const r = round2(n); return r % 1 === 0 ? String(r) : r.toFixed(2).replace(/0$/, ''); };
  const mmss = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  const svg = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const icons = {
    flow: svg('<path d="M3 12h4l2-5 4 10 2-5h6"/>'),
    meds: svg('<path d="M18 2l4 4M20 4l-9.5 9.5M14 6l4 4M7 13l4 4M5.5 18.5L2 22M9.5 9.5l5 5-4.5 4.5a2.1 2.1 0 01-3 0l-2-2a2.1 2.1 0 010-3z"/>'),
    tips: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0012 3z"/>'),
    notes: svg('<path d="M4 20l1-5L16 4l4 4L9 19l-5 1z"/><path d="M14 6l4 4"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    edit: svg('<path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 013 3L12 15l-4 1 1-4z"/>'),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
    pause: svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'),
    play: svg('<path d="M7 4.5v15l12-7.5z"/>'),
    pencil: svg('<path d="M4 20l1-5L16 4l4 4L9 19l-5 1z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  };

  /* ================= Colors ================= */
  // Six colors you can change. Peach = values, lavender = actions; red is kept for danger only.
  const TOKENS = [
    ['bg', 'Page'], ['card', 'Cards'], ['text', 'Text'],
    ['accent', 'Buttons'], ['peach', 'Peach (values)'], ['lav', 'Lavender (actions)'],
    ['st-prep', 'Step color · Blue'], ['st-first', 'Step color · Gold'], ['st-vent', 'Step color · Teal'],
    ['st-cpr', 'Step color · Berry'], ['st-meds', 'Step color · Plum'], ['st-after', 'Step color · Sage'],
  ];
  // Each big step has its own color (set per step in Edit cards; these are the defaults).
  const STEP_COLORS = [['prep', 'Blue'], ['first', 'Gold'], ['vent', 'Teal'], ['cpr', 'Berry'], ['meds', 'Plum'], ['after', 'Sage']];
  const LOOKS = {
    light: { name: 'Light', bg: '#faf6f3', card: '#ffffff', text: '#1f4f66', accent: '#1f4f66', peach: '#f9dcc3', lav: '#e8dbf7',
      'st-prep': '#5b7fa6', 'st-first': '#c39a3a', 'st-vent': '#3f8f8a', 'st-cpr': '#a3486b', 'st-meds': '#7a5a9e', 'st-after': '#6f9a72' },
    night: { name: 'Night', bg: '#1c1a22', card: '#27242f', text: '#d6e6ef', accent: '#93c6dd', peach: '#5b4231', lav: '#423658',
      'st-prep': '#8fb0d4', 'st-first': '#e0bd66', 'st-vent': '#6cc0b9', 'st-cpr': '#d77fa0', 'st-meds': '#b294d6', 'st-after': '#9cc79f' },
  };
  // Fonts: [name, Google Fonts family param (null = no download), CSS fallback]
  const HAND_FONTS = [
    ['Patrick Hand', 'Patrick+Hand', 'cursive'], ['Caveat', 'Caveat:wght@500;700', 'cursive'],
    ['Kalam', 'Kalam:wght@400;700', 'cursive'], ['Gaegu', 'Gaegu:wght@400;700', 'cursive'],
    ['Delius', 'Delius', 'cursive'], ['Indie Flower', 'Indie+Flower', 'cursive'],
    ['Shadows Into Light Two', 'Shadows+Into+Light+Two', 'cursive'],
  ];
  HAND_FONTS.unshift(['Same as text', null, '']);
  const BODY_FONTS = [
    ['Nunito', 'Nunito:wght@400;600;700;800', 'sans-serif'], ['Quicksand', 'Quicksand:wght@400;500;600;700', 'sans-serif'],
    ['Poppins', 'Poppins:wght@400;500;600;700;800', 'sans-serif'], ['DM Sans', 'DM+Sans:wght@400;500;700;800', 'sans-serif'],
    ['Lora', 'Lora:wght@400;600;700', 'serif'], ['Atkinson Hyperlegible', 'Atkinson+Hyperlegible:wght@400;700', 'sans-serif'],
    ['System', null, 'system-ui, sans-serif'],
  ];
  const loadedFonts = new Set(['Nunito:wght@400;600;700;800']);
  function loadFonts(params) {
    const need = params.filter(p => p && !loadedFonts.has(p));
    if (!need.length) return;
    need.forEach(p => loadedFonts.add(p));
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?' + need.map(p => 'family=' + p).join('&') + '&display=swap';
    document.head.append(l);
  }
  const stack = ([name, , fb]) => name === 'System' ? fb : `'${name}', ${fb}`;
  const theme = local.get('theme', { look: 'light', custom: {} });
  // Oct 2026 restyle: headings are plain bold text now (a handwriting font is optional).
  function upgradeTheme(t) {
    if (t.look === 'notes') t.look = 'light';
    if (!LOOKS[t.look]) t.look = 'light';
    t.custom ||= {}; if (t.custom.notes) { t.custom.light = t.custom.notes; delete t.custom.notes; }
    t.fonts ||= { hand: 'Same as text', body: 'Nunito' };
    if (!t.v2) { t.fonts.hand = 'Same as text'; t.v2 = true; }
    return t;
  }
  upgradeTheme(theme);
  function applyFonts() {
    const b = BODY_FONTS.find(f => f[0] === theme.fonts.body) || BODY_FONTS[0];
    const h = HAND_FONTS.find(f => f[0] === theme.fonts.hand) || HAND_FONTS[0];  // [0] = same as text
    loadFonts([b[1], h[1]]);
    const root = document.documentElement.style;
    root.setProperty('--body', stack(b));
    root.setProperty('--hand', h[1] ? stack(h) : stack(b));
  }
  const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const rgbHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
  const colorsNow = () => ({ ...LOOKS[theme.look] || LOOKS.light, ...(theme.custom[theme.look] || {}) });
  function applyColors() {
    const c = colorsNow(), root = document.documentElement.style;
    TOKENS.forEach(([k]) => root.setProperty('--' + k, c[k]));
    const dark = lum(c.bg) < 0.2;
    root.setProperty('--muted', mix(c.text, c.card, 0.38));
    root.setProperty('--line', mix(c.text, c.card, 0.86));
    root.setProperty('--soft', mix(c.bg, c.text, 0.05));
    root.setProperty('--on-accent', lum(c.accent) > 0.4 ? '#1b1b1f' : '#ffffff');
    // Darker (or, at night, lighter) versions of peach + lavender for text, markers and the ✱.
    const lavInk = dark ? mix(c.lav, '#e6d2ff', 0.75) : mix(c.lav, '#5a2a96', 0.62);
    const peachInk = dark ? mix(c.peach, '#ffd2a8', 0.75) : mix(c.peach, '#a8501a', 0.62);
    root.setProperty('--lav-ink', lavInk); root.setProperty('--peach-ink', peachInk);
    root.setProperty('--danger', dark ? '#e0777d' : '#b4434b');
    // Number color on each step circle: white on darker colors, navy on lighter ones.
    STEP_COLORS.forEach(([k]) => root.setProperty(`--st-${k}-on`, lum(c['st-' + k]) > 0.33 ? '#1b2a33' : '#ffffff'));
    // Pencil colors in notes
    root.setProperty('--ink-ink', c.text); root.setProperty('--ink-rose', dark ? '#e3a3a8' : '#cf7f86'); root.setProperty('--ink-maroon', dark ? '#f0b8b8' : '#7a1f22');
    root.setProperty('--ink-lav', lavInk); root.setProperty('--ink-peach', peachInk);
    root.setProperty('--ink-teal', mix(c.accent, '#3aa39a', 0.55));
    document.documentElement.classList.toggle('dark', dark);
    $('meta[name=theme-color]').content = c.bg;
    applyFonts();
  }
  let colorTimer;
  function saveTheme(sync = true) {
    clearTimeout(colorTimer);
    local.set('theme', theme); applyColors();
    if (sync) Store.savePrefs({ theme: JSON.parse(JSON.stringify(theme)) }).catch(() => {});
  }
  applyColors();

  /* ================= State ================= */
  let user = null, notes = [], unwatch = () => {};
  const open = new Set(local.get('open2', ['g-golden']));
  let flowMode = local.get('flowMode', 'ref');
  const revealed = new Set();


  /* ================= Router ================= */
  // Tips on the left, Algorithm (home) in the middle, Med math on the right. Settings = gear, top right.
  const TABS = [['tips', 'Tips'], ['flow', 'Algorithm'], ['meds', 'Med math']];
  window.addEventListener('hashchange', render);
  let editor = null;
  function render() {
    let [, tab = 'flow', arg] = (location.hash || '#/flow').split('/');
    if (tab === 'airway') tab = 'tips';
    closeEditor();
    if (tab === 'page') { flowMode = 'notes'; tab = 'flow'; }
    $$('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
    $('#gear').classList.toggle('on', tab === 'settings');
    stopAnimations();
    window.scrollTo({ top: 0 });
    ({ flow: renderFlow, meds: renderMeds, tips: renderTips, settings: renderSettings }[tab] || renderFlow)();
  }
  $('#tabs').innerHTML = TABS.map(([k, l]) => `<a href="#/${k}" data-tab="${k}" class="${k === 'flow' ? 'home' : ''}">${icons[k]}<span>${l}</span></a>`).join('');
  $('#gear').innerHTML = icons.settings;

  let anims = [];
  const stopAnimations = () => { anims.forEach(f => f()); anims = []; };

  /* ================= Algorithm ================= */
  const CARD = {};

  /* ---------- Your edits to the cards (and doses) ----------
     content.js is the original. Your changes are kept separately in `edits`, saved
     to your account, and laid on top -- so anything can be reset to the original:
       cards/groups/meds: {id: {changed fields}}  (custom: true = a step you added)
       layout: [{id, cards: [cardIds]}]           (only once you add/remove/reorder) */
  const BASE = JSON.parse(JSON.stringify({ cards: NRP.cards, groups: NRP.groups, meds: NRP.meds }));
  const baseOf = (kind, id) => BASE[kind].find(x => x.id === id);
  const copy = o => JSON.parse(JSON.stringify(o));
  let edits = local.get('edits', {});
  function applyEdits() {
    edits = { cards: {}, groups: {}, meds: {}, layout: null, ...edits };
    NRP.meds.forEach(m => Object.assign(m, copy(baseOf('meds', m.id)), edits.meds[m.id] || {}));
    const custom = Object.entries(edits.cards).filter(([, c]) => c.custom).map(([id, c]) => ({ id, phase: 'after', title: '', summary: '', lines: [], asides: [], ...c }));
    NRP.cards = [...BASE.cards.map(b => ({ ...copy(b), ...(edits.cards[b.id] || {}) })), ...custom];
    Object.keys(CARD).forEach(k => delete CARD[k]);
    NRP.cards.forEach(c => { CARD[c.id] = c; });
    const layout = edits.layout || BASE.groups.map(g => ({ id: g.id, cards: g.cards }));
    NRP.groups = layout.map(({ id, cards }) => {
      const b = baseOf('groups', id), e = edits.groups[id] || {};
      return { phase: 'after', title: '', ...(b ? copy(b) : {}), ...e, id, cards: cards.filter(c => CARD[c]) };
    }).filter(g => g.cards.length);
  }
  applyEdits();
  let editsTimer = null;
  function saveEdits() {
    local.set('edits', edits);
    clearTimeout(editsTimer);
    editsTimer = setTimeout(() => Store.savePrefs({ edits: copy(edits) }).catch(() => {}), 800);
  }
  function setEdit(kind, id, field, value) {
    const e = (edits[kind][id] ||= {});
    const base = baseOf(kind, id);
    if (e.custom || !base) e[field] = value;
    else if (JSON.stringify(value) === JSON.stringify(base[field] ?? (Array.isArray(value) ? [] : ''))) delete e[field];
    else e[field] = value;
    if (!Object.keys(e).length) delete edits[kind][id];
    applyEdits(); saveEdits();
  }
  const isEdited = (kind, id) => !!edits[kind][id] && !edits[kind][id].custom;
  // Add / remove / move steps. The first change copies the current order into edits.layout.
  function changeLayout(fn) {
    edits.layout = NRP.groups.map(g => ({ id: g.id, cards: [...g.cards] }));
    fn(edits.layout);
    edits.layout = edits.layout.filter(g => g.cards.length);
    applyEdits(); saveEdits();
  }
  const cardTitle = id => CARD[id]?.title || NRP.groups.find(g => g.cards.includes(id))?.title || 'Untitled';
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  const noteFor = cardId => notes.find(n => n.cardId === cardId);
  const hasContent = n => n && ((n.text || '').trim() || (n.strokes || []).length);

  function renderFlow() {
    view.innerHTML = `
      <div class="flow-top">
        <div class="seg big" role="tablist">
          ${[['ref', 'Reference'], ['notes', 'Notes'], ['study', 'Study'], ['run', 'Run it']].map(([k, l]) => `<button data-mode="${k}" class="${flowMode === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <p class="mode-hint${flowMode === 'ref' ? ' empty-hint' : ''}">${{
          ref: '',
          notes: 'All your notes in one place. Tap one to open it, tap again to close.',
          study: 'Each point is hidden. Say it out loud, then tap to check.',
          run: 'Practice a code with live timers. Tap what the baby is doing.',
        }[flowMode]}</p>
      </div>
      <div id="flowBody"></div>`;
    $$('[data-mode]').forEach(b => b.onclick = () => { editMode = false; flowMode = b.dataset.mode; local.set('flowMode', flowMode); renderFlow(); });
    if (flowMode === 'run') return renderRun($('#flowBody'));
    if (flowMode === 'notes') return renderNotesMode($('#flowBody'));
    renderCards($('#flowBody'));
  }
  // Notes changed on another device (or just saved): redraw without jumping to the top.
  function refreshFlow() {
    const body = $('#flowBody');
    if (!body || editor || flowMode === 'run') return;
    if (editMode) return;  // don't wipe what you're typing
    flowMode === 'notes' ? renderNotesMode(body) : renderCards(body);
  }

  /* Big step titles stay on one line: a title too long for the screen shrinks just enough to fit. */
  function fitTitles(host) {
    $$('.big-title', host).forEach(t => {
      t.style.fontSize = '';
      const room = t.parentElement.clientWidth, need = t.scrollWidth;
      if (need > room) t.style.fontSize = Math.max(16, Math.floor(parseFloat(getComputedStyle(t).fontSize) * room / need)) + 'px';
    });
  }
  let fitTimer;
  addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => fitTitles(document), 100); });
  document.fonts?.ready.then(() => fitTitles(document));

  function renderCards(host) {
    if (editMode && flowMode === 'ref') return renderEditCards(host);
    const study = flowMode === 'study';
    const total = NRP.groups.filter(g => !g.simple).flatMap(g => g.cards.map(id => CARD[id])).reduce((n, c) => n + c.lines.length + (c.table ? 1 : 0) + (c.asides || []).length, 0);
    const allIds = [...NRP.groups.map(g => g.id), ...NRP.groups.filter(g => g.cards.length > 1).flatMap(g => g.cards)];
    const allOpen = allIds.every(id => open.has(id));
    host.innerHTML = `
      <div class="flow-tools${study ? '' : ' ref-tools'}">
        ${study ? `<span class="pill-count">${revealed.size} / ${total} checked</span>
          <button class="btn ghost small" data-act="hide">Hide all again</button>`
        : `<button class="icon-btn" data-act="edit" aria-label="Edit cards" title="Edit cards">${icons.edit}</button>
           <button class="icon-btn caret${allOpen ? ' up' : ''}" data-act="all" aria-label="${allOpen ? 'Close all' : 'Open all'}" title="${allOpen ? 'Close all' : 'Open all'}"><span class="chev"></span></button>`}
      </div>
      <ol class="flow">${NRP.groups.map((g, i) => groupHtml(g, i, study)).join('<li class="arrow" aria-hidden="true"></li>')}</ol>`;
    host.onclick = e => {
      const t = e.target;
      const act = t.closest('[data-act]')?.dataset.act;
      if (act === 'hide') { revealed.clear(); return renderCards(host); }
      if (act === 'edit') { closeEditor(); editMode = true; return renderEditCards(host); }
      if (act === 'all') { allOpen ? allIds.forEach(id => open.delete(id)) : allIds.forEach(id => open.add(id)); local.set('open2', [...open]); return renderCards(host); }
      const line = t.closest('[data-k].hidden');
      if (line) { revealed.add(line.dataset.k); line.classList.remove('hidden'); $('.pill-count', host).textContent = `${revealed.size} / ${total} checked`; return; }
      const vd = t.closest('.verify-btn');
      if (vd) { vd.nextElementSibling.hidden = !vd.nextElementSibling.hidden; return; }
      const nt = t.closest('[data-notes-toggle]');
      if (nt) return toggleNotes(nt.dataset.notesToggle);
      const head = t.closest('.big-head, .sub-head');
      if (head && !study) {
        const box = head.parentElement, id = box.dataset.id;
        open.has(id) ? open.delete(id) : open.add(id); local.set('open2', [...open]);
        box.classList.toggle('open', open.has(id)); head.setAttribute('aria-expanded', open.has(id));
      }
    };
    fitTitles(host);
  }

  function groupHtml(g, i, study) {
    const cards = g.cards.map(id => CARD[id]), single = cards.length === 1;
    if (g.simple) return `
    <li class="big simple" data-id="${g.id}">
      <div class="simple-row"><span class="bignum">${i + 1}</span><p class="simple-text">${md(cards[0].lines[0] || '')}</p></div>
    </li>`;
    const isOpen = study || open.has(g.id);
    return `
    <li class="big ph-${g.phase}${isOpen ? ' open' : ''}" data-id="${g.id}">
      <button class="big-head" aria-expanded="${isOpen}">
        <span class="bignum">${i + 1}</span>
        <span class="titles">
          <span class="big-title">${esc(g.title)}</span>
          <span class="subnames">${single ? esc(cards[0].summary) : cards.map((c, j) => `<span><i>${'abcdefghij'[j]}</i>${esc(c.title)}</span>`).join('')}</span>
        </span>
        ${g.timer ? `<span class="timer-tag">${icons.clock} ${esc(g.timer)}</span>` : ''}
        ${study ? '' : '<span class="chev" aria-hidden="true"></span>'}
      </button>
      <div class="card-body"><div class="inner">
        ${single ? cardContent(cards[0], study)
        : `<ol class="subs">${cards.map((c, j) => subHtml(c, j, study)).join('')}</ol>`}
      </div></div>
    </li>`;
  }

  function subHtml(c, j, study) {
    const isOpen = study || open.has(c.id);
    return `
    <li class="sub${isOpen ? ' open' : ''}" data-id="${c.id}">
      <button class="sub-head" aria-expanded="${isOpen}">
        <span class="subnum">${'abcdefghij'[j]}</span>
        <span class="titles"><span class="title">${esc(c.title)}</span>${study ? '' : `<span class="summary">${esc(c.summary)}</span>`}</span>
        ${study ? '' : '<span class="chev" aria-hidden="true"></span>'}
      </button>
      <div class="card-body"><div class="inner">${cardContent(c, study)}</div></div>
    </li>`;
  }

  function cardContent(c, study) {
    const hid = k => 'reveal' + (study && !revealed.has(k) ? ' hidden' : '');
    return `
      <ul class="lines">${c.lines.map((l, j) => `<li class="line ${hid(c.id + j)}" data-k="${c.id}${j}"><span>${md(l)}</span></li>`).join('')}</ul>
      ${c.table ? `<div class="${hid(c.id + 't')}" data-k="${c.id}t"><table class="mini"><caption>${esc(c.table.caption)}</caption>${c.table.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table></div>` : ''}
      ${(c.asides || []).map((a, j) => `<div class="${hid(c.id + 'a' + j)}" data-k="${c.id}a${j}"><p class="aside">${md(a)}</p></div>`).join('')}
      ${c.verify ? `<button class="verify-btn"><span class="vdot"></span> Why the dot?</button><p class="verify-text" hidden>${esc(c.verify)}</p>` : ''}
      <div class="card-foot">
        ${c.link ? `<a class="btn ghost small" href="#/${c.link.tab}">${esc(c.link.label)} →</a>` : ''}
        ${study ? '' : `<button class="pencil-btn${hasContent(noteFor(c.id)) ? ' has' : ''}" data-notes-toggle="${c.id}" aria-label="My notes" title="My notes">${icons.pencil}</button>`}
      </div>
      ${study ? '' : `<div class="notes-area" data-notes="${c.id}" hidden></div>`}`;
  }

  /* ---------- Edit cards ---------- */
  let editMode = false, lastField = null;
  function renderEditCards(host) {
    const lines = a => esc((a || []).join('\n'));
    const mv = (kind, id, i, n) => `<span class="mv">
        <button class="mini-btn" data-move="${kind}:${id}:-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
        <button class="mini-btn" data-move="${kind}:${id}:1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
        <button class="mini-btn del" data-remove="${kind}:${id}" aria-label="Remove">${icons.trash}</button></span>`;
    const card = (c, j, g) => `
      <div class="edit-card">
        <div class="ec-head">
          ${g.cards.length > 1 ? `<span class="subnum">${'abcdefghij'[j] || j + 1}</span>
          <input class="ec-title" value="${esc(c.title)}" placeholder="Substep title" data-k="cards" data-id="${c.id}" data-f="title" aria-label="Substep title">` : '<span class="ec-spacer"></span>'}
          ${isEdited('cards', c.id) ? `<button class="link" data-reset="cards:${c.id}">Reset to original</button>` : ''}
          ${g.cards.length > 1 ? mv('card', c.id, j, g.cards.length) : ''}
        </div>
        <label>Summary <small>(shown when the card is closed)</small>
          <input value="${esc(c.summary)}" data-k="cards" data-id="${c.id}" data-f="summary"></label>
        <label>Points <small>(one per line)</small>
          <textarea data-k="cards" data-id="${c.id}" data-f="lines" data-list rows="${Math.max(3, c.lines.length + 1)}">${lines(c.lines)}</textarea></label>
        <label>Side notes ✱ <small>(one per line, optional)</small>
          <textarea data-k="cards" data-id="${c.id}" data-f="asides" data-list rows="${Math.max(1, (c.asides || []).length + 1)}">${lines(c.asides)}</textarea></label>
        <label>“Why the dot?” <small>(optional, explains a ● check-your-book dot)</small>
          <textarea data-k="cards" data-id="${c.id}" data-f="verify" rows="1">${esc(c.verify || '')}</textarea></label>
      </div>`;
    host.innerHTML = `
      <div class="edit-bar">
        <div class="edit-note"><b>Editing cards</b> · auto-saves</div>
        <button class="btn primary small" data-act="editdone">Done</button>
      </div>
      <div class="fmt-bar" role="toolbar" aria-label="Format selected text">
        <span>Select text, then:</span>
        <button data-fmt="==" class="f-pe">Peach</button>
        <button data-fmt="++" class="f-lv">Lavender</button>
        <button data-fmt="**"><b>Bold</b></button>
        <button data-fmt="dot"><span class="vdot"></span> Check dot</button>
      </div>
      ${NRP.groups.map((g, i) => `
        <section class="edit-group ph-${g.phase}">
          <div class="eg-head">
            <span class="bignum">${i + 1}</span>
            <input class="eg-title" value="${esc(g.title)}" placeholder="Step title" data-k="groups" data-id="${g.id}" data-f="title" aria-label="Step title">
            ${mv('group', g.id, i, NRP.groups.length)}
          </div>
          <div class="eg-opts">
            ${g.simple ? '' : `<label>Color <select data-k="groups" data-id="${g.id}" data-f="phase">${STEP_COLORS.map(([k, n]) => `<option value="${k}" ${g.phase === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`}
            ${isEdited('groups', g.id) ? `<button class="link" data-reset="groups:${g.id}">Reset title + color</button>` : ''}
          </div>
          ${g.cards.map((id, j) => card(CARD[id], j, g)).join('')}
          <button class="btn ghost small add" data-addsub="${g.id}">+ Add substep</button>
        </section>`).join('')}
      <div class="row-between add-row">
        <button class="btn ghost" data-addstep>+ Add big step</button>
        ${edits.layout ? '<button class="link" data-resetlayout>Put steps back in the original order</button>' : ''}
      </div>
      ${edits.layout || Object.keys(edits.cards).length || Object.keys(edits.groups).length
        ? '<div class="reset-all"><button class="btn ghost danger-text" data-resetall>Reset all steps to original</button><small>Undoes every wording change, added step and removed step. Your notes and doses stay.</small></div>' : ''}
      <section class="edit-group ph-meds">
        <div class="eg-head"><span class="bignum">℞</span><h3 class="eg-title">Doses <small>(used in Med math + Run it)</small></h3></div>
        ${NRP.meds.map(m => `<div class="edit-card med-edit">
          <div class="ec-head"><b>${esc(m.name)}</b>${isEdited('meds', m.id) ? `<button class="link" data-reset="meds:${m.id}">Reset to original</button>` : ''}</div>
          <div class="med-row">
            <label>mL per kg <input type="number" inputmode="decimal" step="0.01" min="0" value="${m.mlPerKg}" data-k="meds" data-id="${m.id}" data-f="mlPerKg" data-num></label>
            ${m.mgPerMl ? `<label>mg per mL <input type="number" inputmode="decimal" step="0.01" min="0" value="${m.mgPerMl}" data-k="meds" data-id="${m.id}" data-f="mgPerMl" data-num></label>` : ''}
            <label class="grow">Note <input value="${esc(m.note)}" data-k="meds" data-id="${m.id}" data-f="note"></label>
          </div>
        </div>`).join('')}
      </section>
      <p class="small">Formatting: ==peach== · ++lavender++ · **bold** · [[verify]] makes a check-your-book dot.</p>`;
    const grow = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; };
    $$('textarea', host).forEach(grow);
    host.oninput = e => {
      const el = e.target; if (!el.dataset.f) return;
      if (el.tagName === 'TEXTAREA') grow(el);
      let v = el.value;
      if ('list' in el.dataset) v = v.split('\n').map(x => x.trim()).filter(Boolean);
      if ('num' in el.dataset) { v = parseFloat(v); if (!(v >= 0)) return; }
      const had = isEdited(el.dataset.k, el.dataset.id);
      setEdit(el.dataset.k, el.dataset.id, el.dataset.f, v);
      if (had !== isEdited(el.dataset.k, el.dataset.id)) toggleReset(el);
    };
    // Show/hide that card's Reset link without redrawing (keeps your cursor).
    function toggleReset(el) {
      const head = el.closest('.edit-card, .edit-group').querySelector('.ec-head, .eg-head');
      const key = `${el.dataset.k}:${el.dataset.id}`;
      const existing = head.querySelector(`[data-reset="${key}"]`);
      if (isEdited(el.dataset.k, el.dataset.id) && !existing) head.insertAdjacentHTML('beforeend', `<button class="link" data-reset="${key}">${el.dataset.k === 'groups' ? 'Reset' : 'Reset to original'}</button>`);
      if (!isEdited(el.dataset.k, el.dataset.id) && existing) existing.remove();
    }
    host.onchange = e => { if (e.target.tagName === 'SELECT') { const y = window.scrollY; renderEditCards(host); window.scrollTo({ top: y }); } };
    host.onfocusin = e => { if (e.target.matches('input:not([type=number]), textarea')) lastField = e.target; };
    $$('[data-fmt]', host).forEach(b => b.onmousedown = e => e.preventDefault());
    host.onclick = async e => {
      const t = e.target;
      if (t.closest('[data-act="editdone"]')) { editMode = false; return renderCards(host); }
      const keepY = () => { const y = window.scrollY; renderEditCards(host); window.scrollTo({ top: y }); };
      const mvb = t.closest('[data-move]');
      if (mvb) {
        const [kind, id, d] = mvb.dataset.move.split(':'), dir = +d;
        changeLayout(L => {
          const swap = (arr, i) => { const j = i + dir; if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j], arr[i]]; };
          if (kind === 'group') swap(L, L.findIndex(g => g.id === id));
          else { const g = L.find(g => g.cards.includes(id)); swap(g.cards, g.cards.indexOf(id)); }
        });
        return keepY();
      }
      const rm = t.closest('[data-remove]');
      if (rm) {
        const [kind, id] = rm.dataset.remove.split(':');
        const name = kind === 'group' ? NRP.groups.find(g => g.id === id).title : cardTitle(id);
        if (!(await ask(`Remove “${name || 'this'}”?`, 'Any notes you wrote on it stay in your Notes. You can put the original steps back later.', 'Remove'))) return;
        changeLayout(L => {
          if (kind === 'group') { const i = L.findIndex(g => g.id === id); L[i].cards.forEach(c => { if (edits.cards[c]?.custom) delete edits.cards[c]; }); L.splice(i, 1); if (edits.groups[id]?.custom) delete edits.groups[id]; }
          else { L.forEach(g => { g.cards = g.cards.filter(c => c !== id); }); if (edits.cards[id]?.custom) delete edits.cards[id]; }
        });
        return keepY();
      }
      const addsub = t.closest('[data-addsub]');
      if (addsub) {
        const g = NRP.groups.find(x => x.id === addsub.dataset.addsub), cid = uid('c');
        edits.cards[cid] = { custom: true, phase: g.phase, title: '', summary: '', lines: [], asides: [] };
        changeLayout(L => L.find(x => x.id === g.id).cards.push(cid));
        keepY(); return $(`input[data-id="${cid}"][data-f="title"]`, host)?.focus();
      }
      if (t.closest('[data-addstep]')) {
        const gid = uid('g'), cid = uid('c');
        edits.groups[gid] = { custom: true, title: '', phase: 'after' };
        edits.cards[cid] = { custom: true, phase: 'after', title: '', summary: '', lines: [], asides: [] };
        changeLayout(L => L.push({ id: gid, cards: [cid] }));
        keepY(); return $(`input[data-id="${gid}"][data-f="title"]`, host)?.focus();
      }
      if (t.closest('[data-resetall]')) {
        if (!(await ask('Reset all steps to the original?', 'Every card goes back to how it came: wording, order, and added or removed steps. Your notes and doses stay.', 'Reset all'))) return;
        edits.cards = {}; edits.groups = {}; edits.layout = null;
        applyEdits(); saveEdits(); return keepY();
      }
      if (t.closest('[data-resetlayout]')) {
        if (!(await ask('Put the original steps back?', 'Steps you removed come back and the order resets. Steps you added are removed (their notes stay in Notes). Your wording changes stay.', 'Reset order'))) return;
        Object.keys(edits.cards).forEach(k => { if (edits.cards[k].custom) delete edits.cards[k]; });
        Object.keys(edits.groups).forEach(k => { if (edits.groups[k].custom) delete edits.groups[k]; });
        edits.layout = null; applyEdits(); saveEdits(); return keepY();
      }
      const r = t.closest('[data-reset]');
      if (r) {
        const [kind, id] = r.dataset.reset.split(':');
        if (!(await ask('Reset to the original?', 'Your wording for this one goes back to how it came.', 'Reset'))) return;
        delete edits[kind][id]; applyEdits(); saveEdits(); return renderEditCards(host);
      }
      const f = t.closest('[data-fmt]');
      if (f && lastField && document.body.contains(lastField)) {
        const el = lastField, a = el.selectionStart, b = el.selectionEnd, v = el.value;
        const ins = f.dataset.fmt === 'dot' ? v.slice(a, b) + ' [[verify]]' : f.dataset.fmt + (v.slice(a, b) || 'text') + f.dataset.fmt;
        el.value = v.slice(0, a) + ins + v.slice(b);
        el.focus(); el.setSelectionRange(a + ins.length, a + ins.length);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
  }

  // Where a step's note sits in the algorithm, e.g. "2b".
  function stepLabel(cardId) {
    const gi = NRP.groups.findIndex(g => g.cards.includes(cardId)), g = NRP.groups[gi];
    return g.cards.length > 1 ? `${gi + 1}${'abcdefghij'[g.cards.indexOf(cardId)]}` : `${gi + 1}`;
  }
  const keyFor = n => (n.cardId && CARD[n.cardId]) ? n.cardId : 'page:' + n.id;
  const noteForKey = key => key.startsWith('page:') ? notes.find(n => n.id === key.slice(5)) : noteFor(key);
  function drawPreviews(root) {
    $$('canvas[data-preview]', root).forEach(cv => { const n = notes.find(x => x.id === cv.dataset.preview); if (n) Ink.preview(cv, n.strokes); });
  }

  // Pencil (or a note in the Notes list): tap to open, tap again to close.
  function toggleNotes(key) {
    if (editor && editor.key === key) return closeEditor();
    closeEditor();
    const area = $(`[data-notes="${CSS.escape(key)}"]`); if (!area) return;
    area.hidden = false;
    $$(`[data-notes-toggle="${CSS.escape(key)}"]`).forEach(b => b.classList.add('on'));
    area.closest('.nitem')?.classList.add('editing');
    if (Store.configured && !user) {
      area.innerHTML = `<p class="small signin-hint">Sign in from <a href="#/settings">Settings</a> to keep notes on all your devices.</p>`;
      editor = { key, host: area, signin: true };
      return;
    }
    const n = noteForKey(key);
    mountEditor(area, n || { title: cardTitle(key), text: '', cardId: key, strokes: [], h: 900 }, { key, title: key.startsWith('page:'), canDelete: flowMode === 'notes' });
  }

  // ---- Notes view: every step note (in algorithm order) + extra notes ----
  function renderNotesMode(host) {
    const stepNotes = NRP.cards.map(c => noteFor(c.id)).filter(hasContent);
    const extra = notes.filter(n => !n.cardId || (!CARD[n.cardId] && hasContent(n))).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const item = n => {
      const key = keyFor(n), date = new Date(n.updated || 0).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const label = n.cardId && CARD[n.cardId] ? `<span class="nlabel ph-${NRP.groups.find(g => g.cards.includes(n.cardId)).phase}">${stepLabel(n.cardId)}</span>` : '';
      return `<div class="nitem">
        <button class="nitem-head" data-notes-toggle="${esc(key)}">
          ${label}<span class="ntitle">${esc(n.cardId && CARD[n.cardId] ? cardTitle(n.cardId) : (n.title || 'Untitled'))}</span><small>${date}</small>
        </button>
        <div class="nitem-prev">
          ${(n.text || '').trim() ? `<p class="np-text">${esc(n.text)}</p>` : ''}
          ${(n.strokes || []).length ? `<canvas data-preview="${n.id}"></canvas>` : ''}
        </div>
        <div class="notes-area" data-notes="${esc(key)}" hidden></div>
      </div>`;
    };
    host.innerHTML = `
      <div class="flow-tools"><button class="btn primary small" data-act="newnote">+ New note</button></div>
      ${!Store.configured ? '<p class="banner">Sample mode: notes are saved on this device only.</p>' : ''}
      ${Store.configured && !user ? `<p class="banner">Sign in from <a href="#/settings">Settings</a> to keep notes.</p>` : ''}
      ${extra.length ? `<h3 class="nsec">My notes</h3><div class="nlist">${extra.map(item).join('')}</div>` : ''}
      <h3 class="nsec">From the algorithm</h3>
      ${stepNotes.length ? `<div class="nlist">${stepNotes.map(item).join('')}</div>`
        : '<p class="empty">Notes you write with the ✎ on any step in Reference show up here.</p>'}`;
    drawPreviews(host);
    host.onclick = async e => {
      if (e.target.closest('[data-act="newnote"]')) {
        if (Store.configured && !user) { location.hash = '#/settings'; return toast('Sign in first to keep notes'); }
        closeEditor();
        const id = await Store.saveNote({ title: '', text: '', cardId: null, strokes: [], h: 1300 });
        if (!notes.find(n => n.id === id)) notes = [...notes, { id, title: '', text: '', cardId: null, strokes: [], h: 1300, updated: Date.now() }];
        renderNotesMode(host);
        toggleNotes('page:' + id);
        return;
      }
      const t = e.target.closest('[data-notes-toggle]');
      if (t) toggleNotes(t.dataset.notesToggle);
    };
  }

  /* ---------- Run it (mock code with timers) ---------- */
  let run = local.get('run', null);
  const saveRun = () => local.set('run', run);
  const now = () => Date.now();
  const since = t => (now() - t) / 1000;
  function newRun() { return { start: null, step: 'ready', stepAt: now(), log: [], weight: 3, prep: [], epiAt: null, epiCount: 0, checks: [] }; }
  function logIt(text) { run.log.push([run.start ? Math.round(since(run.start)) : 0, text]); }
  function go(step, text) { if (text) logIt(text); run.step = step; run.stepAt = now(); run.checks = []; saveRun(); renderRun($('#flowBody')); }
  const dose = id => { const m = NRP.meds.find(x => x.id === id); return round2(run.weight * m.mlPerKg); };
  const spo2Now = () => {
    if (!run.start) return null;
    const min = since(run.start) / 60;
    const row = [...NRP.spo2].reverse().find(r => min >= parseInt(r[0]));
    return row ? `${row[1]}–${row[2]}%` : 'not yet (under 1 min)';
  };

  const runCard = id => CARD[id] || baseOf('cards', id);
  const STEPS = {
    ready: () => ({
      title: 'Get ready', phase: 'prep',
      body: `<p>Estimate the weight, then run the prep questions.</p>
        ${weightPicker()}
        ${checklist(runCard('prep').lines)}`,
      actions: [['Baby is born · start the clock', () => { run.start = now(); go('rapid', `Birth. Est. weight ${run.weight} kg`); }, 'primary']],
    }),
    rapid: () => ({
      title: 'Rapid evaluation', phase: 'first', countdown: { from: run.start, secs: 60, label: 'Golden minute' },
      body: `<ul class="lines">${runCard('rapid').lines.slice(0, 3).map(l => `<li class="line">${md(l)}</li>`).join('')}</ul>`,
      actions: [['All yes', () => go('routine', 'Rapid eval: all yes → delayed cord clamping'), ''], ['Any no', () => go('initial', 'Rapid eval: not all yes → initial steps'), 'primary']],
    }),
    routine: () => ({
      title: 'Routine care', phase: 'after',
      body: `<ul class="lines"><li class="line">Delayed cord clamping, skin-to-skin</li><li class="line">Warm, dry, ongoing evaluation</li></ul>`,
      actions: [['Baby gets worse', () => go('decision', 'Change in condition → reassess'), ''], ['Debrief', () => go('debrief'), 'primary']],
    }),
    initial: () => ({
      title: 'Initial steps', phase: 'first', countdown: { from: run.start, secs: 60, label: 'Golden minute' },
      body: checklist(runCard('initial').lines),
      actions: [['Assess breathing + HR', () => go('decision', 'Initial steps done'), 'primary']],
    }),
    decision: () => ({
      title: 'The decision', phase: 'first', countdown: { from: run.start, secs: 60, label: 'Golden minute' },
      body: `<p class="q">Apnea / gasping, or HR < 100?</p>`,
      actions: [
        ['No · doing well', () => go('routine', 'Breathing, HR > 100'), ''],
        ['No · but labored / cyanotic', () => go('cpap', 'Breathing, HR > 100, labored/cyanotic'), ''],
        ['Yes · start PPV', () => go('ppv', 'Apnea/gasping or HR < 100 → PPV started'), 'primary'],
      ],
    }),
    cpap: () => ({
      title: 'Labored breathing / cyanosis', phase: 'vent',
      body: `<ul class="lines"><li class="line">Position, clear airway PRN</li><li class="line">Pulse ox (right hand). Target now: <b data-spo2>${spo2Now()}</b></li>
        <li class="line">No distress but low SpO₂ → ${md('++blow-by++')}</li><li class="line">Distress → ${md('++CPAP++ (==PEEP 5==)')}</li></ul>`,
      actions: [['Improving', () => go('routine', 'Improved with CPAP/O₂'), ''], ['Apnea or HR < 100', () => go('ppv', 'Deteriorated → PPV started'), 'primary']],
    }),
    ppv: () => ({
      title: 'PPV', phase: 'vent', countdown: { from: run.stepAt, secs: 15, label: 'First 15 sec of PPV', done: 'Check chest rise + HR' },
      body: `<ul class="lines"><li class="line">${md('Neopuff or BVM · ==25/5==')}</li><li class="line">“Breathe… two… three”</li><li class="line">Pulse ox on. Target now: <b data-spo2>${spo2Now()}</b></li></ul>`,
      actions: [['No chest rise', () => go('mrsopa', 'No chest rise → MR. SOPA'), ''], ['Chest rising', () => go('ppv30', 'Chest rising with PPV'), 'primary']],
    }),
    mrsopa: () => ({
      title: 'MR. SOPA', phase: 'vent',
      body: checklist(runCard('mrsopa').lines) + `<p class="aside">Stay here until chest rise!</p>`,
      actions: [['Chest rise now', () => go('ppv30', `Chest rise after MR. SOPA (${run.checks.length} steps)`), 'primary']],
    }),
    ppv30: () => ({
      title: 'PPV with chest rise', phase: 'vent', countdown: { from: run.stepAt, secs: 30, label: '30 sec PPV with chest rise', done: 'Check HR' },
      body: `<p>Keep ventilating. Then check the heart rate.</p><p class="small">Target SpO₂ now: <b data-spo2>${spo2Now()}</b></p>`,
      actions: [
        ['HR ≥ 100', () => go('post', 'HR ≥ 100'), ''],
        ['HR 60–99', () => go('ppvcont', 'HR 60–99 → continue PPV'), ''],
        ['HR < 60', () => go('cpr', 'HR < 60 after 30 sec PPV → compressions'), 'danger'],
      ],
    }),
    ppvcont: () => ({
      title: 'Continue PPV', phase: 'vent', countdown: { from: run.stepAt, secs: 30, label: 'Reassess in', done: 'Check HR' },
      body: `<ul class="lines"><li class="line">MR. SOPA PRN</li><li class="line">Consider alternative airway</li></ul>`,
      actions: [['HR ≥ 100', () => go('post', 'HR ≥ 100'), ''], ['Still 60–99', () => go('ppvcont', 'HR still 60–99'), ''], ['HR < 60', () => go('cpr', 'HR < 60 → compressions'), 'danger']],
    }),
    cpr: () => ({
      title: 'Compressions', phase: 'cpr', countdown: { from: run.stepAt, secs: 60, label: '60 sec of CPR', done: 'Check HR' },
      body: `${beat()}${checklist(['Intubate with **FiO₂ 100%**', 'Consider **cardiac monitoring**', 'Line: UVC or IO'])}`,
      actions: [['HR ≥ 60', () => go('ppv30', 'HR ≥ 60 → stop compressions, continue PPV'), ''], ['HR < 60', () => go('epi', 'HR still < 60 → epi'), 'danger']],
    }),
    epi: () => ({
      title: 'Epinephrine 1:10,000', phase: 'cpr',
      body: `${weightPicker()}
        <div class="doses">
          <div class="dose"><span>IV / IO</span><b>${fmt(dose('epiIV'))} mL</b><small>${fmt(dose('epiIV') * 0.1)} mg · then flush 3 mL NS</small></div>
          <div class="dose"><span>ET (no line yet)</span><b>${fmt(dose('epiET'))} mL</b><small>${fmt(dose('epiET') * 0.1)} mg</small></div>
        </div>
        ${run.epiAt ? `<p class="small">Last epi <b data-since="${run.epiAt}">${mmss(since(run.epiAt))}</b> ago. Repeat q 3–5 min.</p>` : ''}`,
      actions: [
        ['Gave IV/IO epi + flush', () => { run.epiAt = now(); run.epiCount++; go('cpr2', `Epi IV/IO ${fmt(dose('epiIV'))} mL + 3 mL NS flush (dose ${run.epiCount})`); }, 'primary'],
        ['Gave ET epi', () => { run.epiAt = now(); run.epiCount++; go('cpr2', `Epi ET ${fmt(dose('epiET'))} mL (dose ${run.epiCount})`); }, ''],
      ],
    }),
    cpr2: () => ({
      title: 'Compressions + epi', phase: 'cpr', countdown: { from: run.stepAt, secs: 60, label: '60 sec, then HR', done: 'Check HR' },
      body: `${beat()}<p class="small">Epi given ${run.epiCount}×. Last <b data-since="${run.epiAt}" data-epi>${mmss(since(run.epiAt))}</b> ago <span class="epi-hint" data-epihint></span></p>`,
      actions: [
        ['HR ≥ 60', () => go('ppv30', 'HR ≥ 60 → stop compressions, continue PPV'), ''],
        ['Hypovolemia / PTX?', () => go('volume', 'Considering hypovolemia / PTX'), ''],
        ['HR < 60 · epi again', () => go('epi', 'HR still < 60'), 'danger'],
      ],
    }),
    volume: () => ({
      title: 'Hypovolemia or PTX?', phase: 'meds',
      body: `${weightPicker()}
        <div class="doses"><div class="dose"><span>NS or O-neg blood</span><b>${fmt(dose('ns'))} mL</b><small>10 mL/kg</small></div></div>
        <p class="aside">Unequal chest rise = needle decompression</p>`,
      actions: [['Gave volume', () => go('cpr2', `Volume ${fmt(dose('ns'))} mL`), 'primary'], ['Needle decompression', () => go('cpr2', 'Needle decompression'), '']],
    }),
    post: () => ({
      title: 'HR ≥ 100 · post-resuscitation', phase: 'after',
      body: `<ul class="lines"><li class="line">Wean PPV / support as breathing improves</li><li class="line">SpO₂ target now: <b data-spo2>${spo2Now()}</b></li><li class="line">Keep warm, monitor, update family</li></ul>`,
      actions: [['HR dropped again', () => go('ppv30', 'HR dropped → PPV'), ''], ['Debrief', () => go('debrief'), 'primary']],
    }),
    debrief: () => ({
      title: 'Debrief', phase: 'after',
      body: `<p>Total time <b>${run.start ? mmss(run.log.length ? run.log[run.log.length - 1][0] : 0) : '0:00'}</b>. What went well? What would you change?</p>`,
      actions: [['Copy log', () => { navigator.clipboard?.writeText(run.log.map(([t, x]) => `${mmss(t)}  ${x}`).join('\n')); toast('Log copied'); }, ''], ['Run again', () => { run = newRun(); saveRun(); renderRun($('#flowBody')); }, 'primary']],
    }),
  };

  function weightPicker() {
    return `<div class="weight">
      <label>Weight <input type="number" inputmode="decimal" step="0.1" min="0.3" max="6" value="${run.weight}" data-weight> kg</label>
      <div class="chips">${NRP.weights.map(([wk, kg]) => `<button class="chip" data-kg="${kg}">${wk}</button>`).join('')}</div>
    </div>`;
  }
  function checklist(items) {
    return `<ul class="checks">${items.map((l, i) => `<li><button class="check${run.checks.includes(i) ? ' on' : ''}" data-check="${i}"><span class="box"></span><span>${md(l)}</span></button></li>`).join('')}</ul>`;
  }
  const beat = () => `<div class="beat" aria-label="1 and 2 and 3 and breathe"><span>1</span><span>2</span><span>3</span><span class="br">Breathe</span></div>`;

  let tick = null;
  function renderRun(host) {
    if (!run) { run = newRun(); saveRun(); }
    const s = STEPS[run.step]();
    host.innerHTML = `
      <div class="run">
        <div class="run-clock">
          <div><small>Since birth</small><b data-clock>${run.start ? mmss(since(run.start)) : '–:––'}</b></div>
          ${run.epiAt ? `<div class="epi-chip" data-epichip><small>Last epi</small><b data-since="${run.epiAt}">${mmss(since(run.epiAt))}</b></div>` : ''}
          <button class="btn ghost small" data-act="reset">Start over</button>
        </div>
        <section class="run-step ph-${s.phase}">
          <h2><span class="pill">${esc(s.title)}</span></h2>
          ${s.countdown ? `<div class="countdown" data-cd data-from="${s.countdown.from}" data-secs="${s.countdown.secs}">
            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="prog" pathLength="100"/></svg>
            <div class="cd-text"><b data-cdn></b><small>${esc(s.countdown.label)}</small><em data-cddone>${esc(s.countdown.done || 'Time!')}</em></div>
          </div>` : ''}
          <div class="run-body">${s.body}</div>
          <div class="run-actions">${s.actions.map(([l, , cls], i) => `<button class="btn ${cls || 'ghost'}" data-go="${i}">${esc(l)}</button>`).join('')}</div>
        </section>
        ${run.log.length ? `<details class="log" ${run.step === 'debrief' ? 'open' : ''}><summary>Event log (${run.log.length})</summary>
          <ol>${run.log.map(([t, x]) => `<li><time>${mmss(t)}</time>${esc(x)}</li>`).join('')}</ol></details>` : ''}
        ${run.step !== 'debrief' && run.start ? '<button class="btn ghost small end" data-act="end">End + debrief</button>' : ''}
      </div>`;
    host.onclick = e => {
      const t = e.target;
      const g = t.closest('[data-go]'); if (g) return s.actions[+g.dataset.go][1]();
      const c = t.closest('[data-check]');
      if (c) { const i = +c.dataset.check; run.checks.includes(i) ? run.checks.splice(run.checks.indexOf(i), 1) : run.checks.push(i); c.classList.toggle('on'); saveRun(); return; }
      const kg = t.closest('[data-kg]'); if (kg) { run.weight = +kg.dataset.kg; saveRun(); return renderRun(host); }
      const a = t.closest('[data-act]')?.dataset.act;
      if (a === 'reset') { run = newRun(); saveRun(); return renderRun(host); }
      if (a === 'end') return go('debrief', 'Ended');
    };
    const w = $('[data-weight]', host);
    if (w) w.onchange = () => { const v = parseFloat(w.value); if (v > 0 && v < 8) { run.weight = round2(v); saveRun(); renderRun(host); } };
    clearInterval(tick);
    const update = () => {
      if (!document.body.contains(host)) return clearInterval(tick);
      const clk = $('[data-clock]', host); if (clk && run.start) clk.textContent = mmss(since(run.start));
      $$('[data-since]', host).forEach(el => el.textContent = mmss(since(+el.dataset.since)));
      if (run.epiAt) {
        const s2 = since(run.epiAt);
        const chip = $('[data-epichip]', host); if (chip) chip.className = 'epi-chip' + (s2 >= 300 ? ' late' : s2 >= 180 ? ' due' : '');
        const h = $('[data-epihint]', host); if (h) h.textContent = s2 >= 300 ? '· due now' : s2 >= 180 ? '· may repeat' : '';
      }
      $$('[data-spo2]', host).forEach(el => el.textContent = spo2Now());
      const cd = $('[data-cd]', host);
      if (cd) {
        const secs = +cd.dataset.secs, left = secs - since(+cd.dataset.from);
        $('[data-cdn]', cd).textContent = left > 0 ? Math.ceil(left) : '0';
        $('.prog', cd).style.strokeDashoffset = Math.max(0, Math.min(100, 100 - (left / secs) * 100));
        if (left <= 0 && !cd.classList.contains('done')) { cd.classList.add('done'); navigator.vibrate?.(200); }
      }
    };
    update(); tick = setInterval(update, 250);
    anims.push(() => clearInterval(tick));
  }

  /* ================= Med math ================= */
  let explainStep = 0;
  let calcW = local.get('calcW', 3);
  const showMath = new Set();
  const drill = { q: null, right: 0, total: 0, streak: 0, best: local.get('best', 0), hard: local.get('hard', false) };

  function renderMeds() {
    view.innerHTML = `
      <section class="panel">
        <h2><span class="pill">What does 1:10,000 mean?</span></h2>
        <div id="explain"></div>
      </section>
      <section class="panel">
        <h2><span class="pill">Dose calculator</span></h2>
        <p class="tip">${md('Every dose is **mL per kg**, so the math is always **weight × the number**.')}</p>
        <div id="calc"></div>
      </section>
      <section class="panel">
        <h2><span class="pill">Practice</span></h2>
        <div id="drill"></div>
      </section>`;
    renderExplain(); renderCalc(); renderDrill();
  }

  const EXPLAIN = [
    ['It’s a ratio', '**1 : 10,000** means **1 gram** of epi mixed into **10,000 mL** of fluid.', '1 g', '10,000 mL'],
    ['Change grams to mg', '1 g = **1,000 mg**. So it’s **1,000 mg** in **10,000 mL**.', '1,000 mg', '10,000 mL'],
    ['Shrink it to 1 mL', 'Divide both sides by 10,000: ==0.1 mg in every 1 mL==.', '0.1 mg', '1 mL'],
    ['Compare to 1:1,000', '1:1,000 = ==1 mg/mL==. That’s **10× stronger** than 1:10,000. Mixing them up is the classic epi error.', '', ''],
  ];
  function renderExplain() {
    const host = $('#explain'), [h, txt, top, bot] = EXPLAIN[explainStep], last = explainStep === EXPLAIN.length - 1;
    const dots = n => Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join('');
    host.innerHTML = `
      <div class="explain">
        <div class="steps-dots">${EXPLAIN.map((_, i) => `<button class="${i === explainStep ? 'on' : ''}" data-x="${i}" aria-label="Step ${i + 1}"></button>`).join('')}</div>
        <h3>${explainStep + 1}. ${esc(h)}</h3>
        <p>${md(txt)}</p>
        ${last ? `
          <div class="vials">
            <figure><div class="vial"><div class="liquid">${dots(1)}</div></div><figcaption><b>1 mL of 1:10,000</b><br>0.1 mg</figcaption></figure>
            <figure><div class="vial strong"><div class="liquid">${dots(10)}</div></div><figcaption><b>1 mL of 1:1,000</b><br>1 mg (10×!)</figcaption></figure>
          </div><p class="small center">Each dot = 0.1 mg of epi. NRP uses <b>1:10,000 = 0.1 mg/mL</b>.</p>`
        : `<div class="fraction"><span>${esc(top)}</span><hr><span>${esc(bot)}</span></div>`}
        <div class="row-end">
          <button class="btn ghost small" data-x="${explainStep - 1}" ${explainStep ? '' : 'disabled'}>Back</button>
          <button class="btn primary small" data-x="${last ? 0 : explainStep + 1}">${last ? 'Start over' : 'Next'}</button>
        </div>
      </div>`;
    host.onclick = e => { const b = e.target.closest('[data-x]'); if (b && !b.disabled) { explainStep = +b.dataset.x; renderExplain(); } };
  }

  function syringe(ml) {
    const caps = [1, 3, 5, 10, 20, 30, 60], cap = caps.find(c => c >= ml) || 60;
    const fill = Math.min(1, ml / cap), ticks = cap <= 1 ? 10 : cap <= 5 ? cap * 2 : cap <= 10 ? 10 : 6;
    return `<svg class="syringe" viewBox="0 0 260 60" aria-label="${fmt(ml)} mL in a ${cap} mL syringe">
      <rect x="40" y="16" width="180" height="28" rx="5" class="barrel"/>
      <rect x="40" y="16" width="${180 * fill}" height="28" rx="5" class="fluid"/>
      ${Array.from({ length: ticks + 1 }, (_, i) => `<line x1="${40 + i * 180 / ticks}" x2="${40 + i * 180 / ticks}" y1="16" y2="${i % (ticks / 2) === 0 ? 28 : 23}" class="tick"/>`).join('')}
      <rect x="${40 + 180 * fill}" y="12" width="5" height="36" rx="2" class="plunger"/>
      <line x1="${45 + 180 * fill}" x2="${45 + 180 * fill + 20}" y1="30" y2="30" class="rod"/>
      <rect x="220" y="25" width="22" height="10" rx="2" class="barrel"/><line x1="242" x2="258" y1="30" y2="30" class="needle"/>
      <text x="40" y="58" class="cap">0</text><text x="220" y="58" class="cap" text-anchor="end">${cap} mL</text>
    </svg>`;
  }

  function renderCalc() {
    const host = $('#calc');
    host.innerHTML = `
      <div class="weight big">
        <label>Baby’s weight <input type="number" inputmode="decimal" step="0.1" min="0.3" max="6" value="${calcW}" data-cw> kg</label>
        <input type="range" min="0.4" max="5" step="0.1" value="${calcW}" data-cr aria-label="Weight slider">
        <div class="chips">${NRP.weights.map(([wk, kg]) => `<button class="chip" data-kg="${kg}">${wk} ≈ ${kg} kg</button>`).join('')}</div>
      </div>
      <div class="calc-cards">${NRP.meds.map(m => {
        const ml = calcW * m.mlPerKg, open = showMath.has(m.id);
        return `<div class="calc-card">
          <div class="calc-top"><span class="med">${esc(m.name)}</span><span class="rate">${m.mlPerKg} mL/kg</span></div>
          <div class="big-num">${fmt(ml)} <small>mL</small></div>
          ${m.mgPerMl ? `<div class="mg">= ${fmt(ml * m.mgPerMl)} mg</div>` : '<div class="mg">&nbsp;</div>'}
          ${syringe(ml)}
          <p class="small">${esc(m.note)}</p>
          <button class="link" data-math="${m.id}">${open ? 'Hide' : 'Show'} the math</button>
          ${open ? `<div class="math">
            <div>${fmt(calcW)} kg × ${m.mlPerKg} mL/kg = <b>${fmt(ml)} mL</b></div>
            ${m.mgPerMl ? `<div>${fmt(ml)} mL × 0.1 mg/mL = <b>${fmt(ml * m.mgPerMl)} mg</b></div>` : ''}
          </div>` : ''}
        </div>`;
      }).join('')}</div>
      <p class="small">Visual only. Follow your unit’s printed dosing guide at the bedside.</p>`;
    const setW = v => { v = round2(v); if (!(v > 0 && v < 8)) return; calcW = v; local.set('calcW', v); renderCalc(); };
    $('[data-cw]', host).onchange = e => setW(parseFloat(e.target.value));
    $('[data-cr]', host).oninput = e => setW(parseFloat(e.target.value));
    host.onclick = e => {
      const k = e.target.closest('[data-kg]'); if (k) return setW(+k.dataset.kg);
      const m = e.target.closest('[data-math]'); if (m) { const id = m.dataset.math; showMath.has(id) ? showMath.delete(id) : showMath.add(id); renderCalc(); }
    };
  }

  // ---- Drills ----
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function makeQ() {
    const kind = pick(['dose', 'dose', 'dose', 'gest', drill.hard ? 'mg' : 'dose', 'concept']);
    const med = pick(NRP.meds);
    if (kind === 'concept') return pick(CONCEPTS)();
    let w = round2(0.5 + Math.round(Math.random() * 40) / 10);
    let lead = `A **${fmt(w)} kg** baby`;
    if (kind === 'gest') { const r = pick(NRP.weights); w = r[1]; lead = `A **${r[0]}** baby (estimate the weight)`; }
    const ml = round2(w * med.mlPerKg);
    if (kind === 'mg' && med.mgPerMl) {
      const mg = round2(ml * med.mgPerMl);
      return { text: `${lead} gets **${med.name}** (1:10,000). How many **mg** is the dose?`, answer: mg, unit: 'mg',
        work: [`${fmt(w)} kg × ${med.mlPerKg} mL/kg = ${fmt(ml)} mL`, `${fmt(ml)} mL × 0.1 mg/mL = **${fmt(mg)} mg**`] };
    }
    return { text: `${lead} needs **${med.name}**${med.mgPerMl ? ' (1:10,000)' : ''}. How many **mL**?`, answer: ml, unit: 'mL',
      work: [kind === 'gest' ? `Estimate: ${lead.replace(/\*\*/g, '').replace('A ', '').replace(' baby (estimate the weight)', '')} ≈ ${fmt(w)} kg` : null,
        `${med.mlPerKg} mL/kg means multiply by weight`, `${fmt(w)} × ${med.mlPerKg} = **${fmt(ml)} mL**`].filter(Boolean) };
  }
  const CONCEPTS = [
    () => ({ text: '1 mL of **1:10,000** epi contains how many mg?', choices: ['0.01 mg', '0.1 mg', '1 mg', '10 mg'], answer: '0.1 mg',
      work: ['1 g in 10,000 mL = 1,000 mg in 10,000 mL', 'Divide by 10,000 → **0.1 mg per mL**'] }),
    () => ({ text: 'Which is **10× stronger**?', choices: ['1:1,000', '1:10,000'], answer: '1:1,000',
      work: ['1:1,000 = 1 mg/mL', '1:10,000 = 0.1 mg/mL', 'Bigger second number = more fluid = **weaker**'] }),
    () => ({ text: '**1:10,000** written as mg/mL is…', choices: ['1 mg/mL', '0.1 mg/mL', '0.01 mg/mL'], answer: '0.1 mg/mL',
      work: ['1,000 mg ÷ 10,000 mL = **0.1 mg/mL**'] }),
    () => ({ text: 'Which route gets the **bigger** mL/kg dose of epi?', choices: ['IV/IO', 'ET'], answer: 'ET',
      work: ['IV/IO = 0.2 mL/kg', 'ET = **1 mL/kg** (less is absorbed through the lungs)'] }),
    () => ({ text: 'After an IV/IO epi push, flush with…', choices: ['1 mL NS', '3 mL NS', '10 mL/kg NS'], answer: '3 mL NS',
      work: ['Flush **3 mL NS** after each IV/IO epi so the dose reaches the heart', '10 mL/kg is the volume dose for hypovolemia'] }),
    () => ({ text: 'Starting FiO₂ for a **< 32 week** baby?', choices: ['21%', '21–30%', '≥ 30%', '100%'], answer: '≥ 30%',
      work: ['≥ 35 wks: 21%', '32–34 wks: 21–30%', '< 32 wks: **≥ 30%**', 'Then adjust to the SpO₂ targets'] }),
    () => ({ text: '**PEEP** is the…', choices: ['Pop of air each breath', 'Little constant pressure between breaths'], answer: 'Little constant pressure between breaths',
      work: ['PEEP = “a little peep” = 5, keeps the alveoli open', 'PIP = “pop of air” = 25, the breath itself'] }),
    () => ({ text: 'On the Neopuff, **occluding the hole** gives you…', choices: ['PIP (25)', 'PEEP (5)'], answer: 'PIP (25)',
      work: ['Hole covered = the breath = **PIP 25**', 'Hole open = baseline = PEEP 5'] }),
  ];

  function renderDrill() {
    const host = $('#drill');
    if (!drill.q) drill.q = makeQ();
    const q = drill.q;
    host.innerHTML = `
      <div class="drill-top">
        <span class="pill-count">${drill.right} / ${drill.total} right</span>
        <span class="pill-count">Streak ${drill.streak} · Best ${drill.best}</span>
        <label class="toggle"><input type="checkbox" data-hard ${drill.hard ? 'checked' : ''}> Ask for mg too</label>
      </div>
      <div class="question">
        <p class="q">${md(q.text)}</p>
        ${q.choices ? `<div class="choices">${q.choices.map(c => `<button class="btn ghost choice${q.done ? (c === q.answer ? ' right' : c === q.given ? ' wrong' : '') : ''}" data-choice="${esc(c)}" ${q.done ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>`
        : `<form class="answer" data-form><input type="text" inputmode="decimal" autocomplete="off" placeholder="Your answer" value="${esc(q.given ?? '')}" ${q.done ? 'disabled' : ''} data-ans><span>${q.unit}</span>
            <button class="btn primary" ${q.done ? 'disabled' : ''}>Check</button></form>`}
        ${q.done ? `<div class="result ${q.ok ? 'ok' : 'no'}">
            <b>${q.ok ? 'Yes! ✓' : `Not quite. It’s ${esc(q.choices ? q.answer : fmt(q.answer) + ' ' + q.unit)}`}</b>
            <ol>${q.work.map(w => `<li>${md(w)}</li>`).join('')}</ol>
          </div>
          <button class="btn primary" data-next>Next question</button>` : ''}
      </div>`;
    const finish = (given, ok) => {
      Object.assign(q, { done: true, given, ok });
      drill.total++; if (ok) { drill.right++; drill.streak++; if (drill.streak > drill.best) { drill.best = drill.streak; local.set('best', drill.best); } } else drill.streak = 0;
      renderDrill();
    };
    const f = $('[data-form]', host);
    if (f) {
      if (!q.done) setTimeout(() => $('[data-ans]', host)?.focus({ preventScroll: true }), 0);
      f.onsubmit = e => {
        e.preventDefault();
        const raw = $('[data-ans]', host).value.trim(); const v = parseFloat(raw.replace(/[^\d.]/g, ''));
        if (isNaN(v)) return toast('Type a number');
        finish(raw, Math.abs(v - q.answer) <= Math.max(0.011, q.answer * 0.005));
      };
    }
    host.onclick = e => {
      const c = e.target.closest('[data-choice]'); if (c) return finish(c.dataset.choice, c.dataset.choice === q.answer);
      if (e.target.closest('[data-next]')) { drill.q = makeQ(); renderDrill(); }
    };
    $('[data-hard]', host).onchange = e => { drill.hard = e.target.checked; local.set('hard', drill.hard); };
  }

  /* ================= Tips ================= */
  function renderTips() {
    view.innerHTML = `
      <section class="panel">
        <h2><span class="pill">PEEP vs PIP</span></h2>
        <div class="pp-cards">
          <div class="pp peep"><h3>PEEP <span>= 5</span></h3><p><b>P</b>ositive <b>E</b>nd-<b>E</b>xpiratory <b>P</b>ressure</p><p class="hand">“A little peep of pressure”</p><p>Constant pressure that keeps the alveoli open. Mask on face, hole open.</p></div>
          <div class="pp pip"><h3>PIP <span>≈ 25</span></h3><p><b>P</b>eak <b>I</b>nspiratory <b>P</b>ressure</p><p class="hand">“Pop of air” = PPV</p><p>The breath itself. Occlude the hole.</p></div>
        </div>
        <div class="neo">
          <button class="icon-btn play" data-play aria-label="Pause" title="Pause">${icons.pause}</button>
          <div class="neo-modes seg">
            <button data-pm="auto" class="on"><span class="lg">Auto “breathe-2-3”</span><span class="sm">Auto</span></button><button data-pm="hand"><span class="lg">You squeeze</span><span class="sm">Squeeze</span></button><button data-pm="cpap"><span class="lg">CPAP only</span><span class="sm">CPAP</span></button>
          </div>
          <div class="neo-row">
            ${manometer()}
            <div class="readout">
              <span class="pip-note" data-pipnote aria-live="polite"></span>
              <div class="set set-pip" data-set="pip">
                <span class="set-name">PIP</span>
                <button class="mini-btn" data-pipstep="-5" aria-label="Lower PIP by 5">−</button>
                <b data-pipv>25</b>
                <button class="mini-btn" data-pipstep="5" aria-label="Raise PIP by 5">+</button>
              </div>
              <div class="set set-peep" data-set="peep"><span class="set-name">PEEP</span><b>5</b></div>
              <span class="word" data-word></span>
            </div>
          </div>
          <canvas class="wave" data-wave height="160"></canvas>
          <div class="neo-ctrl">
            <button class="btn primary squeeze" data-squeeze hidden>Hold to occlude (PIP)</button>
          </div>
          <p class="small center" data-piphint>MR. SOPA “P”: raise PIP by 5 at a time until the chest rises.<br><b>Max PIP:</b> 40 term · 30 preterm</p>
        </div>
      </section>
      <section class="panel">
        <h2><span class="pill">Compression rhythm</span></h2>
        <p>${md('3 compressions : 1 breath. “**One**-and-**Two**-and-**Three**-and-**Breathe**-and.” That’s ==90 compressions + 30 breaths== a minute (2 sec per cycle).')}</p>
        <div class="beat big paused" data-beat><span>1</span><span>2</span><span>3</span><span class="br">Breathe</span></div>
        <div class="row-end"><label class="toggle"><input type="checkbox" data-sound> Click sound</label><button class="btn primary small" data-beatbtn>Start</button></div>
      </section>
      <section class="panel">
        <h2><span class="pill">FiO₂</span></h2>
        <p>${md('**FiO₂** = **F**raction of **i**nspired **O₂**: the % oxygen in the gas you’re giving. ==Room air is 21%==. The blender sets it.')}</p>
        <div class="fio2">${NRP.fio2.map(([g, v]) => `<div class="f-row"><span>${esc(g)}</span><b>${esc(v)}</b></div>`).join('')}</div>
        <ul class="lines tips-list">
          <li class="line">Starting point when you set up. Then <b>adjust</b> to hit the SpO₂ targets below.</li>
          <li class="line">${md('++Compressions++ → ==FiO₂ 100%==')}</li>
        </ul>
      </section>
      <section class="panel light">
        <h2><span class="pill">Target SpO₂</span> <span class="vdot" title="Check your book"></span></h2>
        <p class="small">Pre-ductal (right hand). Reference only. Follow your printed guide.</p>
        <div class="spo2">${NRP.spo2.map(([t, lo, hi]) => `<div class="s-row"><span>${t}</span><div class="s-bar"><i style="left:${(lo - 50) * 2}%;width:${(hi - lo) * 2}%"></i></div><b>${lo}–${hi}%</b></div>`).join('')}</div>
      </section>
      <section class="panel light">
        <h2><span class="pill">ETT size</span> <span class="vdot" title="Check your book"></span></h2>
        <table class="mini wide"><tr><th>Weight</th><th>Gestation</th><th>ETT (mm ID)</th></tr>${NRP.ett.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td></tr>`).join('')}</table>
        <p class="small">Depth: nasal-tragus length (NTL) + 1 cm, or the gestational-age depth table. Reference only. Follow your printed guide.</p>
      </section>`;
    neopuff(); beatTrainer();
  }

  /* A manometer like the one on the resuscitator: -10 to 80 cm H2O, 0 near the bottom,
     rising clockwise up the left side. Green 0-30, red dashes 30-50, solid red 50-80.
     Angles are degrees clockwise from 12 o'clock. */
  const dialAngle = v => 190 + Math.max(-12, Math.min(82, v)) * 2.8;
  function manometer() {
    const C = 120, pt = (v, r) => { const a = dialAngle(v) * Math.PI / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
    const arc = (v0, v1, r) => { const [x0, y0] = pt(v0, r), [x1, y1] = pt(v1, r); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${(v1 - v0) * 2.8 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
    let ticks = '';
    for (let v = -10; v <= 80; v += 2) {
      const major = v % 10 === 0, [x0, y0] = pt(v, 86), [x1, y1] = pt(v, major ? 74 : 79);
      ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="${major ? 'tk-major' : 'tk'}"/>`;
      if (major) { const [tx, ty] = pt(v, 62); ticks += `<text x="${tx.toFixed(1)}" y="${(ty + 4.5).toFixed(1)}" class="d-num">${v}</text>`; }
    }
    const [mx, my] = pt(0, 100);
    return `<svg class="gauge" viewBox="0 0 240 240" aria-label="Pressure gauge, cm H2O">
      <defs>
        <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".45" stop-color="#9aa0a8"/><stop offset=".55" stop-color="#c9cdd2"/><stop offset="1" stop-color="#6d737b"/></linearGradient>
        <radialGradient id="face" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef0f2"/></radialGradient>
      </defs>
      <circle cx="${C}" cy="${C}" r="116" fill="url(#bezel)"/>
      <circle cx="${C}" cy="${C}" r="106" fill="#d9dce0"/>
      <circle cx="${C}" cy="${C}" r="103" fill="url(#face)"/>
      <path d="${arc(0, 30, 90)}" class="z-green"/>
      <path d="${arc(30, 50, 90)}" class="z-dash"/>
      <path d="${arc(50, 80, 90)}" class="z-red"/>
      ${ticks}
      <text x="176" y="128" class="d-unit">cm H₂O</text>
      <text x="168" y="172" class="d-unit small">(mbar)</text>
      <g data-gpip transform="rotate(${dialAngle(25)} 120 120)"><path d="M120 25 l-5.5 -9 h11 z" class="mk-pip"/></g>
      <g transform="rotate(${dialAngle(5)} 120 120)"><path d="M120 25 l-5.5 -9 h11 z" class="mk-peep"/></g>
      <g data-needle transform="rotate(${dialAngle(5)} 120 120)">
        <path d="M118.6 120 L119.4 42 L120.6 42 L121.4 120 Z" class="ndl"/>
        <path d="M113 150 Q120 140 127 150 L123 124 L117 124 Z" class="ndl"/>
      </g>
      <circle cx="${C}" cy="${C}" r="9" class="hub"/><circle cx="${C}" cy="${C}" r="3" class="hub-dot"/>
    </svg>`;
  }

  function neopuff() {
    const canvas = $('[data-wave]'), ctx = canvas.getContext('2d');
    let mode = 'auto', target = 5, p = 5, nVal = 5, nVel = 0, lastN = 0, rate = 40, pip = 25, maxPip = 40, t0 = performance.now(), hist = [], raf, last = 0;
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    function size() { const dpr = devicePixelRatio || 1; canvas.width = canvas.clientWidth * dpr; canvas.height = 160 * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); const ro = new ResizeObserver(size); ro.observe(canvas);
    const word = $('[data-word]');
    function frame(ts) {
      const el = (ts - t0) / 1000;
      if (mode === 'auto') {
        const cyc = 60 / rate, ph = (el % cyc) / cyc;
        target = ph < 0.33 ? pip : 5;
        word.textContent = ph < 0.33 ? 'Breathe…' : ph < 0.66 ? 'two…' : 'three…';
      } else if (mode === 'cpap') { target = 5; word.textContent = 'CPAP · PEEP only'; }
      else word.textContent = target > 5 ? 'Breathe!' : 'release…';
      // Same speed on 60 Hz and 120 Hz screens: one sample per ~16 ms.
      const W = canvas.clientWidth;
      let steps = Math.min(10, Math.round((ts - (last || ts)) / 16.7)); last = ts;
      if (!hist.length) steps = 1;
      while (steps-- > 0) { p += (target - p) * 0.22; hist.push(p); }
      while (hist.length > W / 2) hist.shift();
      // The needle chases the pressure on a little spring, so it overshoots and settles like a real one.
      for (let i = 0; i < Math.max(1, Math.min(10, Math.round((ts - (lastN || ts)) / 16.7))); i++) { nVel = nVel * 0.62 + (p - nVal) * 0.3; nVal += nVel; }
      lastN = ts;
      const n = $('[data-needle]'); if (!n) return;
      n.setAttribute('transform', `rotate(${dialAngle(nVal)} 120 120)`);
      // waveform
      const H = 160, y = v => H - 14 - (v / 42) * (H - 28);
      ctx.clearRect(0, 0, W, H);
      ctx.font = '700 12px ' + getComputedStyle(document.body).fontFamily;
      [[pip, '--ph-meds', 'PIP ' + pip], [5, '--ph-first', 'PEEP 5']].forEach(([v, c, l]) => {
        ctx.strokeStyle = css(c); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, y(v)); ctx.lineTo(W, y(v)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = css(c); ctx.fillText(l, W - 52, y(v) - 6);
      });
      ctx.strokeStyle = css('--text'); ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); hist.forEach((v, i) => i ? ctx.lineTo(i * 2, y(v)) : ctx.moveTo(0, y(v))); ctx.stroke();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    anims.push(() => { cancelAnimationFrame(raf); ro.disconnect(); });
    // Pause freezes the gauge and wave right where they are; play picks up the rhythm from there.
    let paused = false, pausedAt = 0;
    const playBtn = $('[data-play]');
    function setPaused(on) {
      if (on === paused) return;
      paused = on;
      if (on) { cancelAnimationFrame(raf); pausedAt = performance.now(); word.textContent = 'Paused'; }
      else { t0 += performance.now() - pausedAt; last = 0; raf = requestAnimationFrame(frame); }
      playBtn.innerHTML = on ? icons.play : icons.pause;
      playBtn.setAttribute('aria-label', on ? 'Play' : 'Pause'); playBtn.title = on ? 'Play' : 'Pause';
      playBtn.classList.toggle('paused', on);
    }
    playBtn.onclick = () => setPaused(!paused);
    $$('[data-pm]').forEach(b => b.onclick = () => {
      setPaused(false);
      mode = b.dataset.pm; $$('[data-pm]').forEach(x => x.classList.toggle('on', x === b));
      $('[data-squeeze]').hidden = mode !== 'hand'; playBtn.hidden = mode !== 'auto';
      $('.set-pip').hidden = $('[data-piphint]').hidden = mode === 'cpap';
      $('[data-pipnote]').style.visibility = mode === 'cpap' ? 'hidden' : '';
      target = 5; t0 = performance.now();
    });
    // PIP: what you'd change in MR. SOPA. Goes up to 40 (the term max; preterm max is 30).
    function setPip(v) {
      // Always in steps of 5 (20, 25, 30…), like you'd change it in MR. SOPA.
      pip = Math.max(20, Math.min(maxPip, Math.round(v / 5) * 5));
      $$('[data-pipstep]').forEach(b => b.disabled = (+b.dataset.pipstep < 0 ? pip <= 20 : pip >= maxPip));
      $('[data-pipv]').textContent = pip;
      // Reminders at the limits: 30 = preterm max, 40 = the recommended max.
      const note = { 30: 'Max for preterm', 40: 'Max PIP recommended' }[pip] || '';
      const pn = $('[data-pipnote]'); pn.textContent = note; pn.classList.toggle('top', pip === 40);
      $('[data-gpip]').setAttribute('transform', `rotate(${dialAngle(pip)} 120 120)`);
      if (mode === 'hand' && target > 5) target = pip;
    }
    $$('[data-pipstep]').forEach(b => b.onclick = () => setPip(pip + +b.dataset.pipstep));
    setPip(pip);
    const sq = $('[data-squeeze]');
    sq.onpointerdown = e => { e.preventDefault(); target = pip; sq.classList.add('held'); };
    const rel = () => { target = 5; sq.classList.remove('held'); };
    sq.onpointerup = rel; sq.onpointerleave = rel; sq.onpointercancel = rel;
  }

  /* Sound for beeps and clicks. iPhone/iPad only allow sound that starts from a tap,
     and the side silent switch mutes web sounds unless they're marked as media
     ("playback") -- so unlock() runs on a tap and sets that. */
  const sound = (() => {
    let ac = null;
    function unlock() {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state !== 'running') ac.resume();
      // A silent blip during the tap is what actually opens up sound on iOS.
      const blip = ac.createBufferSource(); blip.buffer = ac.createBuffer(1, 1, 22050); blip.connect(ac.destination); blip.start(0);
    }
    function beep(freq, len = 0.12, vol = 0.4) {
      if (!ac) return;
      if (ac.state !== 'running') ac.resume();  // iOS pauses sound when the app was in the background
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + len + 0.01);
    }
    return { unlock, beep };
  })();

  function beatTrainer() {
    const el = $('[data-beat]'), btn = $('[data-beatbtn]'), box = $('[data-sound]');
    let on = false, timer = null, i = 0;
    const click = hi => { if (box.checked) sound.beep(hi ? 660 : 990); };
    box.onchange = () => { if (box.checked) sound.unlock(); };
    const step = () => {
      $$('span', el).forEach((s, j) => s.classList.toggle('now', j === i));
      click(i === 3); i = (i + 1) % 4;
    };
    btn.onclick = () => {
      if (box.checked) sound.unlock();
      on = !on; btn.textContent = on ? 'Stop' : 'Start'; el.classList.toggle('paused', !on);
      clearInterval(timer); if (on) { i = 0; step(); timer = setInterval(step, 500); } else $$('span', el).forEach(s => s.classList.remove('now'));
    };
    anims.push(() => clearInterval(timer));
  }

  /* ================= Notes ================= */
  function signInForm(msg) {
    return `<div class="signin">
      <h3>${esc(msg)}</h3>
      <form data-auth>
        <input type="email" autocomplete="email" placeholder="Email" required data-email>
        <input type="password" autocomplete="current-password" placeholder="Password (6+ characters)" required minlength="6" data-pw>
        <p class="err" data-err></p>
        <div class="row-end">
          <button type="button" class="link" data-forgot>Forgot password?</button>
          <button type="button" class="btn ghost" data-signup>Create account</button>
          <button class="btn primary">Sign in</button>
        </div>
      </form></div>`;
  }
  function wireSignIn(host) {
    const f = $('[data-auth]', host); if (!f) return;
    const err = m => $('[data-err]', host).textContent = m || '';
    const vals = () => [$('[data-email]', host).value.trim(), $('[data-pw]', host).value];
    f.onsubmit = async e => { e.preventDefault(); err(); try { await Store.signIn(...vals()); toast('Signed in'); } catch (x) { err(x.message); } };
    $('[data-signup]', host).onclick = async () => { if (!f.reportValidity()) return; err(); try { await Store.signUp(...vals()); toast('Account created'); } catch (x) { err(x.message); } };
    $('[data-forgot]', host).onclick = async () => {
      const [email] = vals(); if (!email) return err('Type your email first.');
      try { await Store.reset(email); toast('Reset email sent'); } catch (x) { err(x.message); }
    };
  }

  // Typing + Pencil area, opened inside a card or a Notes item.
  // A step's note is only created once you actually write something.
  function mountEditor(host, n, { key, title, canDelete }) {
    host.innerHTML = `
      <div class="editor">
        <div class="ed-top">
          ${title ? `<input class="title-in" placeholder="Title" value="${esc(n.title)}" data-title>` : ''}
          <span class="saved" data-saved>${n.id ? 'Saved' : ''}</span>
          ${canDelete && n.id ? '<button class="link danger-text" data-del>Delete</button>' : ''}
        </div>
        <textarea class="typed" placeholder="Type here, or write below with your Pencil…" data-text>${esc(n.text)}</textarea>
        <div class="ink" data-ink></div>
      </div>`;
    const ta = $('[data-text]', host), saved = $('[data-saved]', host);
    const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(64, ta.scrollHeight + 2) + 'px'; };
    grow();
    const ed = editor = { key, id: n.id || null, host, n: { title: n.title || '', text: n.text || '', cardId: n.cardId || null, strokes: n.strokes || [], h: n.h || 900 }, dirty: false, timer: null, chain: Promise.resolve() };
    ed.queue = () => { ed.dirty = true; saved.textContent = 'Saving…'; clearTimeout(ed.timer); ed.timer = setTimeout(() => flush(ed), 700); };
    ed.ink = Ink.mount($('[data-ink]', host), { strokes: ed.n.strokes, h: ed.n.h, ruled: false, onChange: ({ strokes, h }) => { ed.n.strokes = strokes; ed.n.h = h; ed.queue(); } });
    ta.oninput = () => { ed.n.text = ta.value; grow(); ed.queue(); };
    const ti = $('[data-title]', host);
    if (ti) { ti.oninput = () => { ed.n.title = ti.value; ed.queue(); }; if (!n.title) setTimeout(() => ti.focus({ preventScroll: true }), 50); }
    const del = $('[data-del]', host);
    if (del) del.onclick = async () => {
      if (!(await ask('Delete this note?', 'The typing and drawing will be gone for good.', 'Delete'))) return;
      editor = null; clearTimeout(ed.timer); ed.ink.destroy();
      await ed.chain; await Store.deleteNote(ed.id);
      notes = notes.filter(x => x.id !== ed.id); refreshFlow();
    };
  }

  // Saves run one after another, so a brand-new note is only ever created once.
  function flush(ed = editor) {
    if (!ed || !ed.dirty) return ed ? ed.chain : Promise.resolve();
    ed.dirty = false;
    const n = { ...ed.n };
    // Firestore holds up to ~1 MB per note; a very full drawing page can hit that.
    if (JSON.stringify(n.strokes).length > 900000) { toast('This page is full. Start a new page for more drawing.'); return ed.chain; }
    ed.chain = ed.chain.then(async () => {
      try {
        ed.id = await Store.saveNote({ id: ed.id || undefined, title: n.title, text: n.text, cardId: n.cardId, strokes: n.strokes, h: n.h });
        const s = $('[data-saved]', ed.host); if (s && !ed.dirty) s.textContent = 'Saved';
      } catch (e) { console.error(e); toast('Couldn’t save. Check your connection.'); ed.dirty = true; }
    });
    return ed.chain;
  }
  function closeEditor() {
    const ed = editor; if (!ed) return;
    editor = null;
    const host = ed.host;
    const tidy = () => {
      host.innerHTML = ''; host.hidden = true;
      host.closest('.nitem')?.classList.remove('editing');
      $$(`[data-notes-toggle="${CSS.escape(ed.key)}"]`).forEach(b => b.classList.remove('on'));
    };
    if (ed.signin) return tidy();
    clearTimeout(ed.timer); ed.ink.destroy(); tidy();
    flush(ed).then(() => {
      if (!ed.id) return;
      // Update this device's copy right away (the synced copy catches up by itself).
      notes = [...notes.filter(x => x.id !== ed.id), { id: ed.id, ...ed.n, updated: Date.now() }];
      $$(`.pencil-btn[data-notes-toggle="${CSS.escape(ed.key)}"]`).forEach(b => b.classList.toggle('has', !!hasContent(ed.n)));
      if (flowMode === 'notes' && !editor) refreshFlow();
    });
  }
  window.addEventListener('pagehide', () => flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  /* ================= Settings ================= */
  // Step colors are named by the step(s) using them right now, e.g. "Step 2 · Golden minute".
  function tokenLabel(k, label) {
    if (!k.startsWith('st-')) return label;
    const nums = NRP.groups.map((g, i) => [i + 1, g]).filter(([, g]) => !g.simple && g.phase === k.slice(3));
    if (!nums.length) return `Not used · ${STEP_COLORS.find(([p]) => p === k.slice(3))[1]}`;
    if (nums.length === 1) return `Step ${nums[0][0]} · ${nums[0][1].title || 'Untitled'}`;
    return `Steps ${nums.map(([n]) => n).join(', ')}`;
  }
  function renderSettings() {
    const c = colorsNow();
    view.innerHTML = `
      <section class="panel">
        <h2><span class="pill">Account</span></h2>
        ${!Store.configured ? '<p class="banner">Sample mode: Firebase isn’t connected yet, so everything stays on this device.</p>'
        : user ? `<p>Signed in as <b>${esc(user.email)}</b>. Notes and colors sync to your other devices.</p><button class="btn ghost" data-out>Sign out</button>`
        : signInForm('Sign in to sync notes + colors')}
      </section>
      <section class="panel">
        <h2><span class="pill">Colors</span></h2>
        <div class="looks">${Object.entries(LOOKS).map(([k, l]) => `<button class="look${theme.look === k ? ' on' : ''}" data-look="${k}" style="--a:${l.bg};--b:${l.peach};--c:${l.lav};--d:${l.text}"><span class="sw4"><i></i><i></i><i></i><i></i></span>${esc(l.name)}</button>`).join('')}</div>
        <div class="tokens">${TOKENS.map(([k, label]) => `<label class="tok"><input type="color" value="${c[k]}" data-tok="${k}"><span>${esc(tokenLabel(k, label))}</span>${theme.custom[theme.look]?.[k] ? `<button class="link" data-reset="${k}">reset</button>` : ''}</label>`).join('')}</div>
        <button class="btn ghost small" data-resetall ${Object.keys(theme.custom[theme.look] || {}).length ? '' : 'disabled'}>Reset “${esc(LOOKS[theme.look].name)}” colors</button>
      </section>
      <section class="panel">
        <h2><span class="pill">Fonts</span></h2>
        <h3 class="sub">Headings</h3>
        <div class="fonts">${HAND_FONTS.map(f => `<button class="font-opt${theme.fonts.hand === f[0] ? ' on' : ''}" data-hand="${esc(f[0])}"><b style="font-family:${esc(f[1] ? stack(f) : 'var(--body)')}">Golden minute</b><small>${esc(f[0])}</small></button>`).join('')}</div>
        <h3 class="sub">Text</h3>
        <div class="fonts">${BODY_FONTS.map(f => `<button class="font-opt${theme.fonts.body === f[0] ? ' on' : ''}" data-body="${esc(f[0])}"><b style="font-family:${esc(stack(f))}">0.2 mL/kg epi</b><small>${esc(f[0])}</small></button>`).join('')}</div>
      </section>
      <section class="panel">
        <h2><span class="pill">Backup</span></h2>
        <p class="small">Download all your notes as a file, or bring a backup back in.</p>
        <div class="row-end left"><button class="btn ghost" data-export>Export notes</button><label class="btn ghost">Import<input type="file" accept="application/json,.json" hidden data-import></label></div>
      </section>
      <section class="panel light">
        <h2><span class="pill">About</span></h2>
        <p class="small">Content typed from your own NRP notes (9th edition). A <span class="vdot"></span> dot means “double-check this in the book.” This is a study tool. At the bedside, follow your unit’s printed guides.</p>
      </section>`;
    wireSignIn(view);
    const out = $('[data-out]'); if (out) out.onclick = () => Store.signOut();
    $$('[data-look]').forEach(b => b.onclick = () => { theme.look = b.dataset.look; saveTheme(); renderSettings(); });
    loadFonts([...HAND_FONTS, ...BODY_FONTS].map(f => f[1]));  // so each choice previews in its own font
    $$('[data-hand]').forEach(b => b.onclick = () => { theme.fonts.hand = b.dataset.hand; saveTheme(); renderSettings(); });
    $$('[data-body]').forEach(b => b.onclick = () => { theme.fonts.body = b.dataset.body; saveTheme(); renderSettings(); });
    // Colors: preview live while the picker is open; save once you stop. No re-render here --
    // rebuilding the page would close the iPhone/iPad color picker mid-drag.
    const resetTok = e => { e.preventDefault(); delete theme.custom[theme.look][e.currentTarget.dataset.reset]; saveTheme(); renderSettings(); };
    $$('[data-tok]').forEach(i => {
      const pick = () => {
        (theme.custom[theme.look] ||= {})[i.dataset.tok] = i.value; local.set('theme', theme); applyColors();
        clearTimeout(colorTimer); colorTimer = setTimeout(() => saveTheme(), 1000);
        const tok = i.closest('.tok');
        if (!$('[data-reset]', tok)) tok.insertAdjacentHTML('beforeend', `<button class="link" data-reset="${i.dataset.tok}">reset</button>`), $('[data-reset]', tok).onclick = resetTok;
      };
      i.oninput = pick; i.onchange = pick;
    });
    $$('[data-reset]').forEach(b => b.onclick = resetTok);
    $('[data-resetall]').onclick = () => { theme.custom[theme.look] = {}; saveTheme(); renderSettings(); };
    $('[data-export]').onclick = () => {
      const blob = new Blob([JSON.stringify({ app: 'NRP', exported: new Date().toISOString(), notes }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nrp-notes-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('[data-import]').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      if (Store.configured && !user) return toast('Sign in first');
      try {
        const data = JSON.parse(await file.text()); const list = data.notes || [];
        for (const n of list) await Store.saveNote({ id: n.id, title: n.title || '', text: n.text || '', cardId: n.cardId || null, strokes: n.strokes || [], h: n.h || 1300 });
        toast(`Imported ${list.length} note${list.length === 1 ? '' : 's'}`);
      } catch { toast('That file isn’t an NRP backup'); }
      e.target.value = '';
    };
  }

  // One time: the weight estimates + risk-factor examples moved off the Prep card
  // and into your own Prep notes, so you can change them however you like.
  const PREP_NOTE = 'Estimated weight\n28 wks ≈ 1 kg\n32 wks ≈ 2 kg\n37 wks ≈ 3 kg\n\nRisk factors, e.g.: prolapsed cord · maternal HTN · fetal anemia · Cat II FHR';
  async function seedPrepNote(prefs) {
    if (Store.configured ? (prefs && prefs.seededPrep) : local.get('seededPrep', false)) return;
    const existing = await new Promise(res => { const un = Store.watchNotes(list => { setTimeout(() => un && un()); res(list.find(n => n.cardId === 'prep')); }); });
    if (existing) await Store.saveNote({ ...existing, text: (existing.text ? existing.text + '\n\n' : '') + PREP_NOTE });
    else await Store.saveNote({ title: 'Prep', text: PREP_NOTE, cardId: 'prep', strokes: [], h: 900 });
    Store.configured ? Store.savePrefs({ seededPrep: true }) : local.set('seededPrep', true);
  }

  /* ================= Little dialog ================= */
  function ask(title, body, okLabel) {
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'dialog-wrap';
      d.innerHTML = `<div class="dialog" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(body)}</p>
        <div class="row-end"><button class="btn ghost" data-no>Cancel</button><button class="btn danger" data-yes>${esc(okLabel)}</button></div></div>`;
      document.body.append(d);
      const done = v => { d.remove(); res(v); };
      d.onclick = e => { if (e.target === d || e.target.closest('[data-no]')) done(false); if (e.target.closest('[data-yes]')) done(true); };
    });
  }

  Store.onUser(async u => {
    user = u; unwatch();
    unwatch = Store.watchNotes(list => { notes = list; refreshFlow(); });
    if (u && !u.sample) {
      const p = await Store.getPrefs();
      if (p && p.theme) { const had = p.theme.v2; Object.assign(theme, p.theme); upgradeTheme(theme); saveTheme(!had); }
      if (p && p.edits) { edits = p.edits; applyEdits(); local.set('edits', edits); }
      else if (Object.keys(edits.cards).length + Object.keys(edits.groups).length + Object.keys(edits.meds).length || edits.layout) saveEdits();
      seedPrepNote(p);
    }
    render();
    if (u && u.sample) seedPrepNote(null);
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
