// Sheets, action sheets, toast, small helpers.
import { esc } from './calc.js';
import { chipIc } from './stickers.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* iOS */ } };

/* ---------- «č» → «c» everywhere on screen ----------
   Dela draws č badly on some iPhones, so every č/Č that reaches the screen
   (contract names, job names the user typed) is shown as plain c/C.
   Stored data and input fields stay untouched. */
const HK = /[\u010c\u010d]/;
const fixText = (n) => { if (HK.test(n.data)) n.data = n.data.replace(/\u010d/g, 'c').replace(/\u010c/g, 'C'); };
function fixTree(root) {
  if (root.nodeType === 3) { fixText(root); return; }
  if (root.nodeType !== 1 || !HK.test(root.textContent)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) fixText(n);
}
export function plainC() {
  fixTree(document.body);
  new MutationObserver((ms) => ms.forEach((m) => {
    if (m.type === 'characterData') fixText(m.target); else m.addedNodes.forEach(fixTree);
  })).observe(document.body, { childList: true, subtree: true, characterData: true });
}

/* ---------- line icons ---------- */
const P = {
  home: '<path d="M4 11 12 4.5 20 11v8a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="4.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.6-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.5 5.8 4.3 0 1.3-1.2 2.1-2.9 2.1-1.3 0-2.4-.6-3-1.6M12 6v1.8M12 16.2V18"/>',
  me: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c1.2-3.5 4-5.3 7.2-5.3s6 1.8 7.2 5.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>',
  left: '<path d="m14.5 6-6 6 6 6"/>',
  right: '<path d="m9.5 6 6 6-6 6"/>',
  down: '<path d="m6 9.5 6 6 6-6"/>',
  up: '<path d="m6 14.5 6-6 6 6"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  trash: '<path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  more: '<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
  moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>',
  thermo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3.5"/><rect x="4" y="8" width="16" height="11.5" rx="2.5"/><path d="M15.5 13.8h1.5"/>',
  bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  spark: '<path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5-2-6.5L3.5 12 10 10z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  chart: '<path d="M4 20V11M9.5 20V5M15 20v-7M20.5 20V8"/>',
  doc: '<path d="M6 3.5h8l4.5 4.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
  magic: '<path d="M4 20 15 9M14 4v3M18.5 5.5l-2 2M20 10h-3M9 4.5l1 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  work: '<rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  warn: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.2"/>',
  repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19l-3-3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5l3 3"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.4-1.6-1.4-2.8 0-1 .8-1.6 1.8-1.6h2.2a4.1 4.1 0 0 0 4.1-4.1C20.5 6.6 16.7 3.5 12 3.5z"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="11" cy="7.5" r="1" fill="currentColor"/><circle cx="15.5" cy="8" r="1" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-3 3-3 14 0 17M12 3.5c3 3 3 14 0 17"/>',
  chat: '<path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6.5L6 20v-4h0A1.5 1.5 0 0 1 4.5 14.5z"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M4 13h16M12 9v11M12 9c-2-4-6-4-6-1.5S9.5 9 12 9zm0 0c2-4 6-4 6-1.5S14.5 9 12 9z"/>',
  zz: '<path d="M5 5h6l-6 7h6M14 12h5l-5 6h5"/>',
  sofa: '<path d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11"/><path d="M3.5 13a2 2 0 0 1 4 0v1.5h9V13a2 2 0 0 1 4 0v4.5h-17zM6 17.5V20M18 17.5V20"/>'
};
export const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.spark}</svg>`;

/* ---------- sheets ---------- */
const stack = [];
export function sheet({ title = '', head = '', html = '', foot = '', tall = false, cls = '', onMount, onClose } = {}) {
  const root = $('#sheets');
  const back = document.createElement('div');
  back.className = 'sh-back';
  const el = document.createElement('section');
  el.className = 'sh ' + (tall ? 'tall ' : '') + cls;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="sh-grab"><i></i></div>
    <header class="sh-head">${head || `<h2 class="h2">${esc(title)}</h2>`}<button class="ib sm" data-x aria-label="Закрити">${ic('close')}</button></header>
    <div class="sh-body">${html}</div>${foot ? `<footer class="sh-foot">${foot}</footer>` : ''}`;
  root.append(back, el);
  document.documentElement.classList.add('locked');
  let closed = false;
  const api = {
    el, body: el.querySelector('.sh-body'),
    set(h) { const t = api.body.scrollTop; api.body.innerHTML = h; api.body.scrollTop = t; },
    setFoot(h) { const f = el.querySelector('.sh-foot'); if (f) f.innerHTML = h; },
    close(v) {
      if (closed) return; closed = true; unlift();
      el.classList.remove('on'); back.classList.remove('on');
      stack.splice(stack.indexOf(api), 1);
      setTimeout(() => { el.remove(); back.remove(); if (!stack.length) document.documentElement.classList.remove('locked'); }, 380);
      onClose && onClose(v);
    }
  };
  stack.push(api);
  // keep the sheet above the on-screen keyboard
  const vv = window.visualViewport;
  const lift = () => { if (!vv) return; const kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); el.style.setProperty('--kb', kb + 'px'); el.classList.toggle('kb', kb > 60); };
  if (vv) { vv.addEventListener('resize', lift); vv.addEventListener('scroll', lift); }
  const unlift = () => { if (vv) { vv.removeEventListener('resize', lift); vv.removeEventListener('scroll', lift); } };
  el.addEventListener('focusin', (e) => { if (e.target.matches('input, textarea')) setTimeout(() => e.target.scrollIntoView({ block: 'nearest' }), 320); });
  back.onclick = () => api.close();
  el.querySelector('[data-x]').onclick = () => api.close();
  // swipe down from the handle/header, or from the top of the content
  let y0 = null, x0 = 0, dy = 0, fromBody = false, lock = '';
  el.addEventListener('touchstart', (e) => {
    const inHead = e.target.closest('.sh-grab, .sh-head');
    fromBody = !inHead && api.body.scrollTop <= 0 && !e.target.closest('input, textarea, .hscroll');
    if (inHead || fromBody) { y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; lock = ''; }
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    dy = e.touches[0].clientY - y0;
    // a sideways gesture (swiping a row) never drags the sheet
    if (!lock) { const ax = Math.abs(e.touches[0].clientX - x0); if (ax < 8 && Math.abs(dy) < 8) return; lock = ax > Math.abs(dy) ? 'h' : 'v'; }
    if (lock === 'h') { y0 = null; dy = 0; return; }
    if (dy > 0 && (!fromBody || api.body.scrollTop <= 0)) { el.classList.add('drag'); el.style.transform = `translateY(${dy * (fromBody ? .7 : 1)}px)`; }
  }, { passive: true });
  el.addEventListener('touchend', () => {
    if (y0 === null) return;
    el.classList.remove('drag'); el.style.transform = '';
    if (dy > (fromBody ? 150 : 100)) api.close();
    y0 = null;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('on'); el.classList.add('on'); }));
  onMount && onMount(api);
  return api;
}
export const closeSheets = () => [...stack].forEach((s) => s.close());

/** action sheet → Promise<value|null> */
export function ask(msg, actions) {
  return new Promise((res) => {
    let v = null;
    sheet({
      head: '<span></span>', cls: 'ask',
      html: `${msg ? `<p class="ask-msg">${esc(msg)}</p>` : ''}<div class="ask-list">${actions.map((a, i) => `<button class="btn ${a.style || 'soft'}" data-i="${i}">${esc(a.label)}</button>`).join('')}<button class="btn ghost" data-i="-1">Скасувати</button></div>`,
      onMount(s) { s.body.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; v = +b.dataset.i >= 0 ? actions[+b.dataset.i].value : null; s.close(); }; },
      onClose() { res(v); }
    });
  });
}

let tt;
export function toast(msg, { action, onAction, ms = 2600 } = {}) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('on'); onAction && onAction(); };
  t.classList.add('on');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), ms);
}

export function menu(anchor, items, pick) {
  const r = anchor.getBoundingClientRect();
  const back = document.createElement('div'); back.className = 'menu-back';
  const m = document.createElement('div'); m.className = 'menu';
  m.innerHTML = items.map((it, i) => `<button data-i="${i}">${it.stk ? chipIc(it.stk, it.tone || 'lilac') : it.icon ? ic(it.icon) : ''}<span>${esc(it.label)}</span></button>`).join('');
  m.style.top = r.bottom + 8 + 'px';
  m.style.right = Math.max(12, innerWidth - r.right) + 'px';
  document.body.append(back, m);
  const close = () => { back.remove(); m.remove(); };
  back.onclick = close;
  m.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; haptic(); close(); pick(items[+b.dataset.i].value); };
}

/** segmented control: [[value,label]] */
export const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${esc(l)}</button>`).join('')}</div>`;
export function segInd(root = document) {
  $$('.seg', root).forEach((s) => {
    let i = s.querySelector('.seg-i'); if (!i) { i = document.createElement('i'); i.className = 'seg-i'; s.prepend(i); }
    const on = s.querySelector('[aria-pressed="true"]');
    if (!on) { i.style.opacity = 0; return; }
    i.style.opacity = 1; i.style.left = on.offsetLeft + 'px'; i.style.width = on.offsetWidth + 'px';
  });
}
export const tgl = (on) => `<span class="tgl" role="switch" aria-checked="${!!on}"></span>`;
export const chips = (name, opts, cur, multi = false) => `<div class="chips" data-chips="${name}" data-multi="${multi}">${opts.map(([v, l]) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${multi ? (cur || []).map(String).includes(String(v)) : String(v) === String(cur)}">${l}</button>`).join('')}</div>`;

/** count-up for big numbers */
export function countUp(el, to, fmt) {
  if (!el) return;
  const from = typeof el._v === 'number' ? el._v : 0;
  el._v = to;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(to - from) < 1) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), d = 650;
  const step = (t) => { if (el._v !== to) return; const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
