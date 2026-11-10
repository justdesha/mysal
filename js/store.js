// Loading & saving. Same storage key and data format as Bud 0.9.x, so updating keeps everyone's data.
// Before the first launch of a new version the raw data is copied aside, so it can be brought back.
import * as C from './calc.js';

export const VER = '1.0.0';
const KEY = C.KEY;               // "mysal7"
const SNAP = KEY + '_snap';      // daily / per-version snapshot (same as 0.9.x)
const PRE1 = KEY + '_pre1';      // untouched copy of the data as it was before 1.0
const BAD = KEY + '_bad';

let loadError = false;
const subs = new Set();

/** defaults for things that are new in 1.0 */
function upgrade(S) {
  S.cfg = S.cfg || {};
  S.cfg.pref = { part: 'any', maxRun: 5, offW: [], ...(S.cfg.pref || {}) };
  S.cfg.nt = { shift: 60, early: true, confirm: true, pay: true, bill: true, plan: true, ...(S.cfg.nt || {}) };
  S.push = { on: false, id: '', url: '', ...(S.push || {}) };
  if (!S.push.id) S.push.id = C.uid() + C.uid();
  if (!S.wnv) S.wnv = '';
  return S;
}

export function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (raw) {
    try {
      const p = JSON.parse(raw);
      const S = upgrade(C.migrate(p));
      try {
        if (p.onb && !String(p.appv || '').startsWith('1.') && !localStorage.getItem(PRE1)) localStorage.setItem(PRE1, raw);
        if (p.onb && (p.appv !== VER || p.snapD !== C.TK)) { localStorage.setItem(SNAP, raw); S.snapD = C.TK; }
      } catch (e) { /* storage full — keep going */ }
      if (p.onb && !String(p.appv || '').startsWith('1.')) S.wasV = p.appv || '0.9';
      S.appv = VER;
      C.setState(S);
      return S;
    } catch (e) {
      try { localStorage.setItem(BAD, raw); } catch (e2) { /* ignore */ }
      loadError = true;
    }
  } else {
    try { const o = localStorage.getItem('zp1'); if (o) { const S = upgrade(C.migrate(JSON.parse(o))); C.setState(S); save(true); return S; } } catch (e) { /* ignore */ }
  }
  const S = upgrade(C.blank());
  S.appv = VER;
  C.setState(S);
  return S;
}

export const hadLoadError = () => loadError;

let timer = 0;
function write() {
  if (loadError) return; // never overwrite data we could not read
  try { localStorage.setItem(KEY, JSON.stringify(C.getState())); } catch (e) { console.warn('save failed', e); }
}
export function save(now = false) {
  const S = C.getState();
  S.u = Date.now();
  clearTimeout(timer);
  if (now) write(); else timer = setTimeout(write, 150);
  subs.forEach((fn) => fn(S));
}
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export function update(fn) { fn(C.getState()); save(); }

window.addEventListener('pagehide', write);
document.addEventListener('visibilitychange', () => { if (document.hidden) write(); });

/* ---------- backups ---------- */
export function backupBlob() {
  const S = C.getState();
  return new Blob([JSON.stringify({ ...S, exportedAt: new Date().toISOString() })], { type: 'application/json' });
}
export function restoreFrom(obj) {
  if (!obj || typeof obj !== 'object' || typeof obj.days !== 'object') throw new Error('Це не схоже на копію Bud');
  const S = upgrade(C.migrate(obj));
  if (!String(obj.appv || '').startsWith('1.')) S.wasV = obj.appv || '0.9';
  S.onb = true; S.appv = VER;
  loadError = false;
  C.setState(S);
  save(true);
  return S;
}
/** copies kept on this phone that can be brought back */
export function localCopies() {
  const out = [];
  for (const [k, label] of [[PRE1, 'Як було до Bud 1.0'], [SNAP, 'Знімок із цього телефона'], [BAD, 'Дані, які не вдалося прочитати']]) {
    try {
      const r = localStorage.getItem(k); if (!r) continue;
      const p = JSON.parse(r);
      if (p && p.days && typeof p.days === 'object') out.push({ key: k, label, days: Object.keys(p.days).length, u: p.u || 0, data: p });
    } catch (e) { /* skip */ }
  }
  return out;
}
/** 0.9.x could show demo data; this brings back what was there before */
export function undemo() {
  try {
    const b = localStorage.getItem(KEY + '_bak');
    const S = b ? upgrade(C.migrate(JSON.parse(b))) : upgrade(C.blank());
    S.demo = false; S.onb = true; S.appv = VER; S.wnv = VER;
    if (!b) S.name = C.getState().name;
    localStorage.removeItem(KEY + '_bak');
    C.setState(S); save(true);
  } catch (e) { /* ignore */ }
}
export function wipe() {
  try { localStorage.setItem(KEY + '_bak', localStorage.getItem(KEY) || ''); localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  const S = upgrade(C.blank()); S.appv = VER; C.setState(S); save(true);
}
