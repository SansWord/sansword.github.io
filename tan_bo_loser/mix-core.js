/* Shared mix model, timeline and panels for the 等無 × 魯之歌 mix desk.
   Used by both the hosted-audio page and the YouTube page; each page supplies an audio engine. */
(function () {
'use strict';
const BEAT = 60 / 164.4, BAR = BEAT * 4, PREROLL = 2.5;
const NAMES = { A: '等無', B: '魯之歌' };

// "offset" = main-clock time minus the deck's own time. Main clock = 等無's time in the normal mix.
const PRESET = [
  { deck: 'B', name: '1st chorus', offset: 28.752, inPt: 72.754,  outPt: 121.173, fi: 2, fo: 8, duck: 0,  level: 100 },
  { deck: 'B', name: 'Pre-2nd',    offset: 34.679, inPt: 159.642, outPt: 171.321, fi: 8, fo: 0, duck: 0,  level: 100 },
  { deck: 'B', name: '2nd chorus', offset: 34.679, inPt: 171.321, outPt: 252.666, fi: 0, fo: 0, duck: 40, level: 100 },
  // 等無 after the handover: stays underneath while it still matches (to 4:15)
  { deck: 'A', name: 'Tail',       offset: 0,      inPt: 229.358, outPt: 255.2,   fi: 8, fo: 4, duck: 0,  level: 30 },
  // 等無's ending: comes up over 魯之歌's last bars, then rings out alone to 等無's own end
  { deck: 'A', name: 'Outro',      offset: 5.852,  inPt: 269.0,   outPt: 301.232, fi: 16, fo: 0, duck: 0, level: 100 },
];
const DEFAULTS = { clips: PRESET, sel: 0, volA: 1, volB: 1, xf: 0.5, handover: { on: true, at: 229.358, beats: 8 }, flip: false, flipLevel: 45, corrA: 0, corrB: 0 };
const clone = o => JSON.parse(JSON.stringify(o));

const $ = id => document.getElementById(id);
const has = id => !!document.getElementById(id);
const fmt = (s, dec = 1) => { if (!isFinite(s)) return '—'; const neg = s < 0; s = Math.abs(s); const m = Math.floor(s / 60); const r = s - m * 60; return (neg ? '-' : '') + m + ':' + r.toFixed(dec).padStart(dec ? dec + 3 : 2, '0'); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let st = clone(DEFAULTS);
let G = null, PLAN = null, engine = null, opts = {};
let playing = false, pos = 0;

// ---------- clip math ----------
const cs = c => c.offset + c.inPt;
const ce = c => c.offset + c.outPt;
const lvl = c => (c.level ?? 100) / 100;
const durOf = d => d === 'A' ? G.new.duration : G.old.duration;
const C = () => st.clips[st.sel];
const clipsOf = d => st.clips.filter(c => c.deck === d);
function envPoints(c) {
  const s = cs(c), e = ce(c), len = Math.max(0.01, e - s);
  let fi = Math.max(c.fi * BEAT, 0.005), fo = Math.max(c.fo * BEAT, 0.005);
  if (fi + fo > len) { const k = len / (fi + fo); fi *= k; fo *= k; }
  return [[s, 0], [s + fi, 1], [e - fo, 1], [e, 0]];
}
function interp(pts, m) {
  if (m <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (m <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return x1 > x0 ? y0 + (y1 - y0) * (m - x0) / (x1 - x0) : y1; }
  return pts[pts.length - 1][1];
}
const envAt = (c, m) => (m < cs(c) || m > ce(c)) ? 0 : interp(envPoints(c), m);
const handLen = () => Math.max(0.005, st.handover.beats * BEAT);
const handEnd = () => st.handover.at + handLen();
function handAt(m) { const h = st.handover; if (!h.on) return 1; return m <= h.at ? 1 : m >= handEnd() ? 0 : 1 - (m - h.at) / handLen(); }
const duckAt = m => Math.max(0, ...clipsOf('B').map(c => c.duck / 100 * envAt(c, m)));
function nearest(arr, t) { let lo = 0, hi = arr.length - 1; if (!arr.length) return t; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arr[mid] < t) lo = mid; else hi = mid; } return Math.abs(arr[lo] - t) <= Math.abs(arr[hi] - t) ? arr[lo] : arr[hi]; }

// ---------- plan: what each deck plays, where, how loud ----------
function seg(deck, offset, inPt, outPt, gain, times, extra) {
  const start = offset + inPt, end = offset + outPt;
  let ts = [...new Set(times.concat([start, end]).filter(t => t >= start && t <= end).map(t => +t.toFixed(4)))].sort((a, b) => a - b);
  const mids = []; for (let i = 1; i < ts.length; i++) mids.push((ts[i - 1] + ts[i]) / 2);
  ts = ts.concat(mids).sort((a, b) => a - b);
  return Object.assign({ deck, offset, inPt, outPt, start, end, gain, pts: ts.map(t => [t, gain(t)]) }, extra || {});
}
const handTimes = () => st.handover.on ? [st.handover.at, handEnd()] : [];
function buildPlan() {
  const B = clipsOf('B'), A = clipsOf('A');
  if (!st.flip) {
    const baseEnd = Math.min(G.new.duration, st.handover.on ? handEnd() : G.new.duration);
    const base = seg('A', 0, 0, baseEnd, m => (1 - duckAt(m)) * handAt(m),
      [0, ...B.flatMap(c => envPoints(c).map(p => p[0])), ...handTimes()], { base: true });
    const segA = [base, ...A.map(c => seg('A', c.offset, c.inPt, c.outPt, m => envAt(c, m) * lvl(c), envPoints(c).map(p => p[0]), { clip: c }))];
    const segB = B.map(c => seg('B', c.offset, c.inPt, c.outPt, m => envAt(c, m) * lvl(c), envPoints(c).map(p => p[0]), { clip: c }));
    const len = Math.max(baseEnd, ...segA.map(s => s.end), ...segB.map(s => s.end)) + 2;
    return { flip: false, baseDeck: 'A', A: segA, B: segB, len };
  }
  // flipped: 魯之歌 plays start to finish; 等無 comes in wherever the two overlap in the normal mix
  const baseB = seg('B', 0, 0, G.old.duration, () => 1, [0], { base: true });
  const baseEnd = Math.min(G.new.duration, st.handover.on ? handEnd() : G.new.duration);
  const sources = [{ offset: 0, start: 0, end: baseEnd, shape: handAt, times: handTimes(), name: '' },
    ...A.map(a => ({ offset: a.offset, start: cs(a), end: ce(a), shape: m => envAt(a, m), times: envPoints(a).map(p => p[0]), name: a.name }))];
  const k = st.flipLevel / 100, segA = [];
  for (const c of B) for (const s of sources) {
    const ms = Math.max(cs(c), s.start), me = Math.min(ce(c), s.end);
    if (me - ms < 0.3) continue;
    const co = c.offset;
    segA.push(seg('A', s.offset - co, ms - s.offset, me - s.offset, o => k * envAt(c, o + co) * s.shape(o + co),
      [...envPoints(c).map(p => p[0]), ...s.times, ms, me].map(t => t - co), { label: s.name || c.name }));
  }
  return { flip: true, baseDeck: 'B', A: segA, B: [baseB], len: G.old.duration + 2 };
}
// what a deck should be doing at main-clock time m
function deckAt(deck, m, preroll = 0) {
  const segs = PLAN[deck];
  const aud = segs.filter(s => m >= s.start && m < s.end);
  if (aud.length) {
    const dom = aud.reduce((a, b) => b.gain(m) > a.gain(m) ? b : a);
    const gain = aud.filter(s => Math.abs(s.offset - dom.offset) < 1e-3).reduce((g, s) => g + s.gain(m), 0);
    return { seg: dom, gain, t: m - dom.offset, audible: true };
  }
  if (preroll > 0) {
    const up = segs.filter(s => m < s.start && m >= s.start - preroll && m - s.offset >= 0);
    if (up.length) { const s = up.reduce((a, b) => a.start < b.start ? a : b); return { seg: s, gain: 0, t: m - s.offset, audible: false }; }
  }
  return null;
}

// ---------- transport ----------
const now = () => playing ? engine.now() : pos;
function setStatus(t, err) { if (!has('status')) return; $('status').textContent = t; $('status').classList.toggle('err', !!err); }
function play() { if (!engine.ready()) return; if (pos >= PLAN.len - 2.1) pos = 0; playing = true; engine.start(pos); $('play').textContent = 'Pause'; $('play').classList.add('on'); }
function pause() { pos = engine.now(); playing = false; engine.stop(); $('play').textContent = 'Play'; $('play').classList.remove('on'); }
function seek(m) { m = clamp(m, 0, PLAN.len); pos = m; if (playing) engine.start(m); draw(); }
const playFrom = m => { seek(Math.max(0, m)); if (!playing) play(); };

function changed() {
  PLAN = buildPlan(); save(); renderFields(); draw();
  if (playing && engine.planChanged) engine.planChanged();
}
function mixerChanged() { save(); renderFields(); if (engine.mixerChanged) engine.mixerChanged(); }

// map a position between the normal and flipped clocks
function mapPos(m, toFlip) {
  const B = clipsOf('B'); if (!B.length) return m;
  if (toFlip) { const c = B.find(c => m >= cs(c) && m < ce(c)) || B.reduce((a, b) => Math.abs(cs(b) - m) < Math.abs(cs(a) - m) ? b : a); return Math.max(0, m - c.offset); }
  const c = B.find(c => m >= c.inPt && m < c.outPt) || B.reduce((a, b) => Math.abs(b.inPt - m) < Math.abs(a.inPt - m) ? b : a); return Math.max(0, m + c.offset);
}
function setFlip(on) {
  if (on === st.flip) return;
  const m = mapPos(now(), on);
  st.flip = on; PLAN = buildPlan();
  pos = m; if (playing) engine.start(m);
  view = Math.max(0, m - W * 0.3 / pps); syncScroll();
  save(); renderFields(); draw();
}

// ---------- timeline ----------
let cv, c2, W = 0, H = 0, dpr = 1, COL = {};
const RULER = 22, LANE = { A: [RULER + 4, 112], B: [RULER + 124, 112] };
let view = 0, pps = 10;
const zoomToPps = z => 1.5 * Math.pow(300 / 1.5, z);
const X = m => (m - view) * pps, M = x => view + x / pps;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function resize() { dpr = window.devicePixelRatio || 1; const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw(); }
function lanePeaks(peaks, y0, h, color, tMap, alphaFn, x0, x1) {
  const mid = y0 + h / 2;
  for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) {
    const sa = tMap(M(x)), sb = tMap(M(x + 1));
    const lo = Math.floor(Math.min(sa, sb) * 50), hi = Math.max(lo + 1, Math.ceil(Math.max(sa, sb) * 50));
    if (hi <= 0 || lo >= peaks.length) continue;
    let p = 0; for (let i = Math.max(0, lo); i < Math.min(peaks.length, hi); i++) if (peaks[i] > p) p = peaks[i];
    const hh = (p / 99) * (h / 2 - 4);
    c2.globalAlpha = alphaFn(M(x + 0.5)); c2.fillStyle = color; c2.fillRect(x, mid - hh, 1, hh * 2);
  }
  c2.globalAlpha = 1;
}
function beatTicks(beats, y0, h, map, x0, x1) {
  if (pps < 18) return;
  c2.fillStyle = COL.fg; c2.globalAlpha = 0.22;
  for (const b of beats) { const x = X(map(b)); if (x >= x0 && x <= x1) c2.fillRect(Math.round(x), y0, 1, h * 0.25); }
  c2.globalAlpha = 1;
}
function keyStrip(keys, dur, y, map, x0, x1) {
  c2.save(); c2.beginPath(); c2.rect(x0, y, x1 - x0, 12); c2.clip();
  c2.font = `600 10px ${css('--f-mono')}`; c2.textBaseline = 'top';
  for (let i = 0; i < keys.length; i++) {
    const xs = X(map(keys[i][0])), xe = X(map(i + 1 < keys.length ? keys[i + 1][0] : dur));
    if (xe < x0 || xs > x1) continue;
    c2.fillStyle = keys[i][1] === 'D' ? 'rgba(242,165,65,.18)' : 'rgba(111,183,216,.14)'; c2.fillRect(xs, y, xe - xs - 1, 12);
    c2.fillStyle = COL.fg; c2.fillText(keys[i][1] + ' maj', Math.max(xs, x0) + 4, y + 1);
  }
  c2.restore();
}
const editable = s => !PLAN.flip && s.clip;
function handlePos(c, which) { const p = envPoints(c); return { x: X(which === 'fi' ? p[1][0] : p[2][0]), y: LANE[c.deck][0] + 16 }; }
function draw() {
  if (!G || !W || !PLAN) return;
  c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, W, H);
  c2.fillStyle = '#1a1c21'; c2.fillRect(0, 0, W, RULER);
  const step = [1, 2, 5, 10, 15, 30, 60].find(s => s * pps >= 70) || 60;
  c2.font = `11px ${css('--f-mono')}`; c2.textBaseline = 'middle'; c2.fillStyle = COL.muted;
  for (let s = Math.floor(view / step) * step; s < M(W); s += step) { const x = X(s); c2.fillRect(Math.round(x), RULER - 6, 1, 6); c2.fillText(fmt(s, 0), x + 3, RULER / 2); }
  for (const d of ['A', 'B']) {
    const [y0, h] = LANE[d], data = d === 'A' ? G.new : G.old, col = d === 'A' ? COL.a : COL.b;
    const tint = d === 'A' ? 'rgba(242,165,65,' : 'rgba(111,183,216,';
    c2.fillStyle = '#16181c'; c2.fillRect(0, y0, W, h);
    // faint guide: the selected clip's whole song
    const sc = C();
    if (!PLAN.flip && sc && sc.deck === d) { const xs = X(sc.offset), xe = X(sc.offset + durOf(d)); c2.fillStyle = tint + '.04)'; c2.fillRect(xs, y0, xe - xs, h); lanePeaks(data.peaks, y0 + 14, h - 14, col, m => m - sc.offset, () => 0.12, xs, xe); }
    for (const s of PLAN[d]) {
      const xs = X(s.start), xe = X(s.end); if (xe < 0 || xs > W) continue;
      const on = s.clip && s.clip === sc && !PLAN.flip;
      if (!s.base) { c2.fillStyle = tint + (on ? '.16)' : '.08)'); c2.fillRect(xs, y0, xe - xs, h); }
      keyStrip(data.keys, durOf(d), y0 + 2, t => t + s.offset, Math.max(0, xs), Math.min(W, xe));
      lanePeaks(data.peaks, y0 + 14, h - 14, col, m => m - s.offset, m => 0.25 + 0.75 * Math.min(1, s.gain(m)), xs, xe);
      beatTicks(data.beats, y0 + 14, h - 14, t => t + s.offset, xs, xe);
      if (!s.base) { c2.strokeStyle = col; c2.lineWidth = on ? 2 : 1; c2.globalAlpha = on ? 1 : 0.6; c2.strokeRect(xs + 1, y0 + 1, xe - xs - 2, h - 2); c2.globalAlpha = 1; }
      const yT = y0 + 16, yB = y0 + h - 3;
      c2.strokeStyle = COL.fg; c2.lineWidth = 1.5; c2.beginPath();
      s.pts.forEach(([m, g], k) => { const x = X(m), y = yB - Math.min(1, g) * (yB - yT); k ? c2.lineTo(x, y) : c2.moveTo(x, y); }); c2.stroke();
      if (editable(s)) for (const w of ['fi', 'fo']) { const hp = handlePos(s.clip, w); c2.fillStyle = COL.fg; c2.fillRect(hp.x - 5, hp.y - 5, 10, 10); c2.strokeStyle = '#16181c'; c2.lineWidth = 1; c2.strokeRect(hp.x - 5, hp.y - 5, 10, 10); }
      const label = s.clip ? s.clip.name : s.label;
      if (label && !s.base) {
        const g = s.clip ? lvl(s.clip) : st.flipLevel / 100;
        c2.font = `700 11px ${css('--f-display')}`; c2.textBaseline = 'bottom'; c2.fillStyle = col;
        c2.fillText(label.toUpperCase() + (g !== 1 ? ` · ${Math.round(g * 100)}%` : ''), Math.max(xs, 0) + 6, y0 + h - 4);
      }
    }
    c2.font = `700 12px ${css('--f-display')}`; c2.textBaseline = 'bottom'; c2.fillStyle = col;
    const main = PLAN.baseDeck === d;
    if (main || !PLAN[d].some(s => X(s.start) < 110 && X(s.end) > 0)) c2.fillText(`${d} · ${NAMES[d]}${main ? ' · MAIN' : ''}`, 6, y0 + h - 4);
  }
  if (!PLAN.flip && st.handover.on) {
    const hx = X(st.handover.at), hx2 = X(handEnd());
    c2.fillStyle = 'rgba(232,97,90,.12)'; c2.fillRect(hx, 0, Math.max(2, hx2 - hx), H);
    c2.fillStyle = COL.hot; c2.fillRect(Math.round(hx), RULER, 1, H - RULER);
    c2.font = `700 11px ${css('--f-display')}`; c2.textBaseline = 'top'; c2.fillText('等無 → 魯之歌', hx + 5, LANE.A[0] + 16);
  }
  const px = X(now()); if (px >= 0 && px <= W) { c2.fillStyle = COL.hot; c2.fillRect(Math.round(px) - 1, 0, 2, H); }
}

// ---------- timeline interaction ----------
let drag = null;
function hit(x, y) {
  if (y < RULER) return { k: 'seek' };
  const d = y >= LANE.A[0] && y < LANE.A[0] + LANE.A[1] ? 'A' : y >= LANE.B[0] && y < LANE.B[0] + LANE.B[1] ? 'B' : null;
  if (!d) return null;
  if (PLAN.flip) return { k: 'seek' };
  const idx = st.clips.map((c, i) => i).filter(i => st.clips[i].deck === d).sort((a, b) => (b === st.sel) - (a === st.sel));
  for (const i of idx) for (const w of ['fi', 'fo']) { const hp = handlePos(st.clips[i], w); if (Math.abs(x - hp.x) <= 8 && Math.abs(y - hp.y) <= 8) return { k: w, i }; }
  for (const i of idx) { const c = st.clips[i], xs = X(cs(c)), xe = X(ce(c));
    if (Math.abs(x - xs) <= 7) return { k: 'in', i }; if (Math.abs(x - xe) <= 7) return { k: 'out', i }; if (x > xs && x < xe) return { k: 'body', i }; }
  return { k: 'seek' };
}
const snapOn = () => !has('snap') || $('snap').value !== 'off';
// beat grid of whatever is playing as the main clock around m
function gridFor(c) {
  if (c.deck === 'B') return G.new.beats;
  const cb = clipsOf('B').find(b => cs(c) >= cs(b) - 1 && cs(c) < ce(b));
  return cb ? G.old.beats.map(t => t + cb.offset) : G.new.beats;
}
function snapOffset(c, raw) {
  if (!snapOn()) return raw;
  const own = c.deck === 'A' ? G.new.beats : G.old.beats;
  const ref = nearest(own, c.inPt + 0.001);
  return nearest(gridFor(c), raw + ref) - ref;
}
const snapOwn = (c, t) => snapOn() ? nearest(c.deck === 'A' ? G.new.beats : G.old.beats, t) : t;
function bindTimeline() {
  cv.addEventListener('pointermove', e => {
    if (!G) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!drag) { const h = hit(x, y); cv.style.cursor = !h ? 'default' : { seek: 'pointer', fi: 'ew-resize', fo: 'ew-resize', in: 'col-resize', out: 'col-resize', body: 'grab' }[h.k]; return; }
    if (drag.k === 'seek') { seek(M(x)); return; }
    const c = C(), dm = (x - drag.x0) / pps;
    if (drag.k === 'body') c.offset = snapOffset(c, drag.offset + dm);
    else if (drag.k === 'in') c.inPt = clamp(snapOwn(c, M(x) - c.offset), 0, c.outPt - BEAT);
    else if (drag.k === 'out') c.outPt = clamp(snapOwn(c, M(x) - c.offset), c.inPt + BEAT, durOf(c.deck));
    else if (drag.k === 'fi') c.fi = Math.max(0, Math.round((M(x) - cs(c)) / BEAT));
    else if (drag.k === 'fo') c.fo = Math.max(0, Math.round((ce(c) - M(x)) / BEAT));
    changed();
  });
  cv.addEventListener('pointerdown', e => {
    if (!G) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const h = hit(x, y); if (!h) return;
    cv.setPointerCapture(e.pointerId);
    if (h.k === 'seek') { drag = { k: 'seek' }; seek(M(x)); return; }
    if (h.i !== st.sel) { st.sel = h.i; renderTabs(); renderFields(); draw(); }
    drag = { k: h.k, x0: x, offset: C().offset };
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e => {
    if (!G) return; e.preventDefault();
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left;
    if (e.ctrlKey || e.metaKey) { const mAt = M(x); const z = clamp(+$('zoom').value - e.deltaY * 0.0015, 0, 1); $('zoom').value = z; pps = zoomToPps(z); view = Math.max(0, mAt - x / pps); syncScroll(); draw(); return; }
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    view = clamp(view + d / pps, 0, Math.max(0, PLAN.len - W / pps)); syncScroll(); draw();
  }, { passive: false });
  $('scroll').addEventListener('input', () => { view = +$('scroll').value * Math.max(0, PLAN.len - W / pps); draw(); });
  $('zoom').addEventListener('input', () => { const c = view + W / 2 / pps; pps = zoomToPps(+$('zoom').value); view = Math.max(0, c - W / 2 / pps); syncScroll(); draw(); });
}
function syncScroll() { if (!PLAN) return; const maxV = Math.max(0.0001, PLAN.len - W / pps); $('scroll').value = Math.min(1, view / maxV); }

// ---------- panels ----------
function renderTabs() {
  const box = $('clipTabs'); box.textContent = '';
  st.clips.forEach((c, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === st.sel ? 'true' : 'false'); b.className = 'deck-' + c.deck;
    b.textContent = `${NAMES[c.deck]} · ${c.name} · ${fmt(cs(c), 0)}`;
    b.addEventListener('click', () => { st.sel = i; renderTabs(); changed(); });
    box.appendChild(b);
  });
  const add = document.createElement('button'); add.type = 'button'; add.className = 'add'; add.textContent = '+ 魯之歌 clip at playhead';
  add.addEventListener('click', () => {
    const base = clipsOf('B')[0] || { offset: 0 };
    const inPt = clamp(now() - base.offset, 0, G.old.duration - 16 * BAR);
    st.clips.push({ deck: 'B', name: `Clip ${st.clips.length + 1}`, offset: base.offset, inPt, outPt: Math.min(G.old.duration, inPt + 16 * BAR), fi: 8, fo: 8, duck: 0, level: 100 });
    st.sel = st.clips.length - 1; renderTabs(); changed();
  });
  box.appendChild(add);
  if (st.clips.length > 1) {
    const del = document.createElement('button'); del.type = 'button'; del.textContent = `Remove ${NAMES[C().deck]} · ${C().name}`;
    del.addEventListener('click', () => { st.clips.splice(st.sel, 1); st.sel = Math.max(0, st.sel - 1); renderTabs(); changed(); });
    box.appendChild(del);
  }
}
function recipe() {
  const h = st.handover;
  return {
    main_track: st.flip ? '魯之歌 (old)' : '等無 (new)',
    flipped_new_level_percent: st.flip ? st.flipLevel : undefined,
    new_fades_out: h.on ? { start_on_new_s: +h.at.toFixed(3), length_s: +(h.beats * BEAT).toFixed(3) } : null,
    deck_volume: { new: st.volA, old: st.volB }, crossfader: st.xf,
    youtube_corrections_s: { new: st.corrA, old: st.corrB },
    clips: st.clips.map((c, i) => { const len = ce(c) - cs(c); return {
      clip: i + 1, deck: c.deck === 'A' ? 'new' : 'old', name: c.name,
      deck_in_s: +c.inPt.toFixed(3), deck_out_s: +c.outPt.toFixed(3),
      place_on_new_clock_s: +cs(c).toFixed(3), ends_on_new_clock_s: +ce(c).toFixed(3),
      fade_in_s: +Math.min(c.fi * BEAT, len).toFixed(3), fade_out_s: +Math.min(c.fo * BEAT, len).toFixed(3),
      duck_new_percent: c.deck === 'B' ? c.duck : 0, level_percent: Math.round(lvl(c) * 100),
      readable: `${NAMES[c.deck]} ${fmt(c.inPt, 2)}–${fmt(c.outPt, 2)} at 等無 clock ${fmt(cs(c), 2)}–${fmt(ce(c), 2)}, fades ${c.fi}/${c.fo} beats, level ${Math.round(lvl(c) * 100)}%` }; })
  };
}
function loadRecipe(text) {
  const r = JSON.parse(text);
  if (!r || !Array.isArray(r.clips) || !r.clips.length) throw new Error('the recipe has no clips');
  const clips = r.clips.map((c, i) => {
    const deck = c.deck === 'new' ? 'A' : 'B';
    const inPt = +(c.deck_in_s ?? c.old_in_s), outPt = +(c.deck_out_s ?? c.old_out_s), at = +(c.place_on_new_clock_s ?? c.place_on_new_at_s);
    if (![inPt, outPt, at].every(isFinite)) throw new Error(`clip ${i + 1} is missing its in, out or start time`);
    return { deck, name: c.name || `Clip ${i + 1}`, inPt, outPt, offset: at - inPt, fi: Math.round((+c.fade_in_s || 0) / BEAT), fo: Math.round((+c.fade_out_s || 0) / BEAT),
      duck: +c.duck_new_percent || 0, level: c.level_percent ?? c.old_level_percent ?? 100 };
  });
  st.clips = clips; st.sel = 0;
  st.handover = r.new_fades_out ? { on: true, at: +r.new_fades_out.start_on_new_s, beats: Math.round(+r.new_fades_out.length_s / BEAT) } : { ...st.handover, on: false };
  if (r.deck_volume) { st.volA = +r.deck_volume.new || 1; st.volB = +r.deck_volume.old || 1; }
  if (isFinite(+r.crossfader)) st.xf = +r.crossfader;
  if (r.youtube_corrections_s) { st.corrA = +r.youtube_corrections_s.new || 0; st.corrB = +r.youtube_corrections_s.old || 0; }
  st.flip = /old|魯之歌/.test(r.main_track || ''); if (isFinite(+r.flipped_new_level_percent)) st.flipLevel = +r.flipped_new_level_percent;
  if (opts.volMax) { st.volA = Math.min(st.volA, opts.volMax); st.volB = Math.min(st.volB, opts.volMax); }
}
function renderFields() {
  const c = C(), set = (id, v) => { if (has(id) && document.activeElement !== $(id)) $(id).value = v; };
  const nm = NAMES[c.deck];
  $('fInL').textContent = nm + ' in (s)'; $('fOutL').textContent = nm + ' out (s)';
  set('fIn', c.inPt.toFixed(2)); $('fInT').textContent = nm + ' ' + fmt(c.inPt, 2);
  set('fOut', c.outPt.toFixed(2)); $('fOutT').textContent = nm + ' ' + fmt(c.outPt, 2);
  set('fStart', cs(c).toFixed(3)); $('fStartT').textContent = '等無 clock ' + fmt(cs(c), 2) + ' → ' + fmt(ce(c), 2);
  set('fFi', c.fi); $('fFiT').textContent = (c.fi * BEAT).toFixed(2) + ' s · ' + (c.fi / 4) + ' bars';
  set('fFo', c.fo); $('fFoT').textContent = (c.fo * BEAT).toFixed(2) + ' s · ' + (c.fo / 4) + ' bars';
  set('fLvl', Math.round(lvl(c) * 100)); set('fDuck', c.deck === 'B' ? c.duck : 0); $('fDuck').disabled = c.deck !== 'B' || st.flip;
  const h = st.handover;
  $('hOn').checked = h.on; set('hAt', h.at.toFixed(3)); set('hBeats', h.beats);
  $('hAtT').textContent = '等無 ' + fmt(h.at, 2) + ' → ' + fmt(handEnd(), 2); $('hBeatsT').textContent = (h.beats * BEAT).toFixed(2) + ' s · ' + (h.beats / 4) + ' bars';
  set('corrA', st.corrA); set('corrB', st.corrB);
  $('volA').value = st.volA; $('volAo').textContent = Math.round(st.volA * 100) + '%';
  $('volB').value = st.volB; $('volBo').textContent = Math.round(st.volB * 100) + '%';
  $('xf').value = st.xf;
  $('mainA').setAttribute('aria-pressed', st.flip ? 'false' : 'true'); $('mainB').setAttribute('aria-pressed', st.flip ? 'true' : 'false');
  set('flipLvl', st.flipLevel); $('flipLvl').disabled = !st.flip;
  $('editPanel').disabled = st.flip; $('flipNote').hidden = !st.flip;
  const tabs = $('clipTabs').querySelectorAll('[role=tab]');
  st.clips.forEach((cl, i) => { if (tabs[i]) tabs[i].textContent = `${NAMES[cl.deck]} · ${cl.name} · ${fmt(cs(cl), 0)}`; });
  if (document.activeElement !== $('recipe')) $('recipe').value = JSON.stringify(recipe(), null, 2);
}
function bindPanels() {
  const bindNum = (id, fn) => { if (has(id)) $(id).addEventListener('change', () => { const v = parseFloat($(id).value); if (isFinite(v)) { fn(v); changed(); } }); };
  bindNum('fIn', v => { const c = C(); c.inPt = clamp(v, 0, c.outPt - BEAT); });
  bindNum('fOut', v => { const c = C(); c.outPt = clamp(v, c.inPt + BEAT, durOf(c.deck)); });
  bindNum('fStart', v => { const c = C(); c.offset = v - c.inPt; });
  bindNum('fFi', v => { C().fi = Math.max(0, Math.round(v)); });
  bindNum('fFo', v => { C().fo = Math.max(0, Math.round(v)); });
  bindNum('fDuck', v => { C().duck = clamp(v, 0, 100); });
  bindNum('fLvl', v => { C().level = clamp(v, 0, opts.levelMax || 150); });
  bindNum('hAt', v => { st.handover.at = Math.max(0, v); });
  bindNum('hBeats', v => { st.handover.beats = Math.max(0, Math.round(v)); });
  bindNum('corrA', v => { st.corrA = v; });
  bindNum('corrB', v => { st.corrB = v; });
  bindNum('flipLvl', v => { st.flipLevel = clamp(v, 0, 100); });
  $('hOn').addEventListener('change', () => { st.handover.on = $('hOn').checked; changed(); });
  $('hAud').addEventListener('click', () => playFrom(st.handover.at - 4 * BAR));
  document.querySelectorAll('[data-hnudge]').forEach(b => b.addEventListener('click', () => { st.handover.at = Math.max(0, st.handover.at + (+b.dataset.hnudge) * BAR); changed(); }));
  $('volA').addEventListener('input', () => { st.volA = +$('volA').value; mixerChanged(); });
  $('volB').addEventListener('input', () => { st.volB = +$('volB').value; mixerChanged(); });
  $('xf').addEventListener('input', () => { st.xf = +$('xf').value; mixerChanged(); });
  $('mainA').addEventListener('click', () => setFlip(false));
  $('mainB').addEventListener('click', () => setFlip(true));
  document.querySelectorAll('[data-nudge]').forEach(b => b.addEventListener('click', () => nudge(b.dataset.nudge)));
  $('audIn').addEventListener('click', () => playFrom(cs(C()) - 2 * BAR));
  $('audOut').addEventListener('click', () => playFrom(envPoints(C())[2][0] - 2 * BAR));
  $('reset').addEventListener('click', () => { const keep = { corrA: st.corrA, corrB: st.corrB }; st = Object.assign(clone(DEFAULTS), keep); renderTabs(); changed(); if (engine.mixerChanged) engine.mixerChanged(); });
  $('play').addEventListener('click', () => playing ? pause() : play());
  $('back').addEventListener('click', () => seek(now() - 4 * BAR));
  $('fwd').addEventListener('click', () => seek(now() + 4 * BAR));
  $('copy').addEventListener('click', () => {
    const t = JSON.stringify(recipe(), null, 2); $('recipe').value = t;
    const done = msg => { $('copied').textContent = msg; setTimeout(() => $('copied').textContent = '', 2500); };
    try { navigator.clipboard.writeText(t).then(() => done('Copied'), () => { $('recipe').select(); done('Selected, press ⌘C'); }); }
    catch (e) { $('recipe').select(); done('Selected, press ⌘C'); }
  });
  if (has('loadRecipe')) $('loadRecipe').addEventListener('click', () => {
    try { loadRecipe($('recipe').value); $('recipe').blur(); renderTabs(); changed(); if (engine.mixerChanged) engine.mixerChanged(); $('copied').textContent = 'Recipe loaded'; }
    catch (e) { $('copied').textContent = 'Could not read the recipe: ' + e.message; }
  });
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.code === 'Space') { e.preventDefault(); if (!$('play').disabled) (playing ? pause() : play()); }
    else if (!st.flip && e.key === 'ArrowLeft') { e.preventDefault(); nudge(e.shiftKey ? '-0.01' : '-beat'); }
    else if (!st.flip && e.key === 'ArrowRight') { e.preventDefault(); nudge(e.shiftKey ? '0.01' : 'beat'); }
  });
  if (has('snap')) $('snap').addEventListener('change', save);
}
function nudge(n) { if (st.flip) return; const d = n === 'bar' ? BAR : n === '-bar' ? -BAR : n === 'beat' ? BEAT : n === '-beat' ? -BEAT : parseFloat(n); C().offset += d; changed(); }

// ---------- persistence ----------
function save() { try { localStorage.setItem(opts.storageKey, JSON.stringify(st)); } catch (e) {} }
function adopt(s) {
  if (!s || !Array.isArray(s.clips) || !s.clips.length) return false;
  const clips = s.clips.map(c => Object.assign({ deck: 'B', level: 100, duck: 0 }, c));
  if (!clips.some(c => c.deck === 'A')) clips.push(...clone(PRESET.filter(c => c.deck === 'A')));
  st = Object.assign(clone(DEFAULTS), s, { clips, handover: Object.assign({}, DEFAULTS.handover, s.handover || {}) });
  st.sel = Math.min(st.sel | 0, st.clips.length - 1);
  return true;
}
function load() {
  try {
    if (adopt(JSON.parse(localStorage.getItem(opts.storageKey)))) return;
    for (const k of opts.legacyKeys || []) if (adopt(JSON.parse(localStorage.getItem(k)))) { if (opts.migrate) opts.migrate(st, clone(PRESET)); save(); return; }
  } catch (e) {}
}

// ---------- frame loop ----------
let lastDraw = 0;
function frame(ts) {
  if (G && PLAN) {
    const m = now();
    if (playing && m >= PLAN.len) { pause(); pos = PLAN.len; }
    $('clock').textContent = fmt(m);
    for (const d of ['A', 'B']) { const info = deckAt(d, m); if (has('time' + d)) $('time' + d).textContent = info ? fmt(info.t) : '—'; }
    if (engine.uiFrame) engine.uiFrame(m, playing);
    if (playing && $('follow').checked && !drag) { const x = X(m); if (x > W * 0.85 || x < 0) { view = Math.max(0, m - W * 0.15 / pps); syncScroll(); } }
    if (playing || ts - lastDraw > 250) { draw(); lastDraw = ts; }
  }
  requestAnimationFrame(frame);
}

async function init(eng, o) {
  engine = eng; opts = o || {};
  cv = $('tl'); c2 = cv.getContext('2d');
  COL = { a: css('--a'), b: css('--b'), fg: css('--fg'), muted: css('--muted'), hot: css('--hot') };
  G = await (await fetch(opts.gridUrl || 'grid.json')).json();
  load();
  if (opts.volMax) { st.volA = Math.min(st.volA, opts.volMax); st.volB = Math.min(st.volB, opts.volMax); }
  PLAN = buildPlan();
  pps = zoomToPps(+$('zoom').value);
  bindTimeline(); bindPanels();
  resize(); renderTabs(); renderFields(); syncScroll();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}

window.MixCore = {
  BEAT, BAR, PREROLL, NAMES, init, deckAt, setStatus, fmt, clamp,
  get st() { return st; }, get plan() { return PLAN; }, get G() { return G; },
  get playing() { return playing; }, now, pause, setFlip,
};
})();
