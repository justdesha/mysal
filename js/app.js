// Bud 1.0 — entry: tabs, quick add, lifecycle.
import * as C from './calc.js';
import { load, save, hadLoadError, VER } from './store.js';
import { $, $$, ic, sheet, closeSheets, haptic, toast, plainC } from './ui.js';
import { stk } from './stickers.js';
import { face } from './cast.js';
import { renderToday } from './today.js';
import { renderPlan, openDay, openAutoplan } from './schedule.js';
import { renderMoney, openSpend, openGig } from './money.js';
import { renderMe, openSleep, applyTheme } from './me.js';
import { startOnboarding, restoreScreen } from './onboarding.js';
import { maybeWhatsNew } from './whatsnew.js';
import { updateBadge, armLocal, queueSync, syncPush } from './notify.js';

const TABS = [
  { id: 'today', label: 'Сьогодні', icon: 'home', render: renderToday },
  { id: 'plan', label: 'Графік', icon: 'cal', render: renderPlan },
  { id: 'money', label: 'Гроші', icon: 'coin', render: renderMoney },
  { id: 'me', label: 'Я', icon: 'me', render: renderMe }
];
let cur = 'today';

export function go(tab, opts = {}) {
  if (!TABS.find((t) => t.id === tab)) tab = 'today';
  const prev = cur;
  cur = tab;
  $$('.screen').forEach((s) => { s.hidden = s.id !== 's-' + tab; });
  $$('.tab').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
  refresh();
  if (!opts.keepScroll) window.scrollTo(0, 0);
  moveInd(prev !== tab, prev);
}
export function refresh() {
  const t = TABS.find((x) => x.id === cur);
  t.render($('#s-' + cur));
  updateBadge();
}
window.addEventListener('bud:refresh', refresh);
window.addEventListener('bud:go', (e) => go(e.detail));

/** route a deep link like ./#day=2026-11-12, ./#tab=money, ./#plan=w */
export function openUrl(u) {
  const h = String(u || '').split('#')[1] || '';
  const [k, v] = h.split('=');
  closeSheets();
  if (k === 'day' && v) { go('plan'); setTimeout(() => openDay(v), 120); }
  else if (k === 'tab') go(v);
  else if (k === 'plan') { go('plan'); setTimeout(() => openAutoplan(v), 120); }
  else go('today');
}

function shell() {
  $('#app').innerHTML = `${TABS.map((t) => `<main class="screen" id="s-${t.id}" hidden></main>`).join('')}
  <nav class="nav" aria-label="Розділи"><span class="nav-ind" aria-hidden="true"></span>
    ${TABS.slice(0, 2).map(tabBtn).join('')}<button class="nav-add" id="add" aria-label="Додати">${ic('plus')}</button>${TABS.slice(2).map(tabBtn).join('')}
  </nav>`;
  $('.nav').addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) { haptic(); if (b.dataset.tab === cur) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } go(b.dataset.tab); }
  });
  $('#add').onclick = quickAdd;
  addEventListener('resize', () => moveInd(false));
  requestAnimationFrame(() => moveInd(false));
}
const tabBtn = (t) => `<button class="tab" data-tab="${t.id}" aria-current="false">${ic(t.icon)}<span>${t.label}</span></button>`;

/** liquid-glass indicator: the leading edge moves first, the trailing edge catches up — it stretches like a drop */
function moveInd(animate, from) {
  const nav = $('.nav'), b = nav.querySelector(`.tab[data-tab="${cur}"]`), ind = $('.nav-ind');
  if (!b) return;
  const n = nav.getBoundingClientRect(), r = b.getBoundingClientRect();
  const left = r.left - n.left + 2, right = n.right - r.right + 2;
  const order = TABS.map((t) => t.id), toRight = order.indexOf(cur) > order.indexOf(from);
  if (animate) {
    ind.style.transition = toRight
      ? 'right .34s cubic-bezier(.3,1.35,.5,1), left .5s cubic-bezier(.45,1.25,.45,1) .07s'
      : 'left .34s cubic-bezier(.3,1.35,.5,1), right .5s cubic-bezier(.45,1.25,.45,1) .07s';
    ind.classList.remove('squish'); void ind.offsetWidth; ind.classList.add('squish');
  } else ind.style.transition = 'none';
  ind.style.left = left + 'px';
  ind.style.right = right + 'px';
}

/* ---------- the + button ---------- */
function quickAdd() {
  haptic(12);
  const k = C.TK;
  const s = sheet({
    title: 'Додати', cls: 'quick',
    html: `<div class="qa">
      <button class="qa-t mint" data-q="shift">${stk('shift')}<b>Зміну</b><span>на сьогодні чи будь-який день</span><span class="peek">${face({ shape: 'squircle', color: 'orange', mood: 'happy' })}</span></button>
      <button class="qa-t sky" data-q="sleep">${stk('moon')}<b>Сон</b><span>як спалось минулої ночі</span><span class="peek">${face({ shape: 'blob', color: 'sky', mood: 'sleepy' })}</span></button>
      <button class="qa-t lime" data-q="spend">${stk('bag')}<b>Витрату</b><span>щоб бачити, скільки лишається</span><span class="peek">${face({ shape: 'circle', color: 'lime', mood: 'calm' })}</span></button>
      <button class="qa-t pink" data-q="gig">${stk('gift')}<b>Підробіток</b><span>разова оплата поза графіком</span><span class="peek">${face({ shape: 'flower', color: 'pink', mood: 'up' })}</span></button>
    </div><button class="btn white wide" data-q="plan">${ic('magic')}Скласти план змін</button>`,
    onMount(x) {
      x.body.onclick = (e) => {
        const b = e.target.closest('[data-q]'); if (!b) return;
        x.close();
        const q = b.dataset.q;
        setTimeout(() => {
          if (q === 'shift') openDay(k, { addShift: true });
          if (q === 'sleep') openSleep(k);
          if (q === 'spend') openSpend();
          if (q === 'gig') openGig();
          if (q === 'plan') { go('plan'); openAutoplan(); }
        }, 180);
      };
    }
  });
  return s;
}

/* ---------- service worker & updates ----------
   iOS keeps a home-screen app alive in the background and rarely re-checks sw.js,
   so Bud asks for updates itself every time it comes back to the screen.
   A new version installs quietly and reloads when no sheet is open. */
let REG = null;
function sw() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    REG = reg;
    const take = (w) => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) w.postMessage('skipWaiting'); });
    if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage('skipWaiting');
    reg.addEventListener('updatefound', () => take(reg.installing));
  }).catch(() => {});
  let done = false;
  const reload = () => {
    if (done) return;
    if (document.documentElement.classList.contains('locked') && !document.hidden) { setTimeout(reload, 1500); return; }
    done = true; location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', reload);
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.open) openUrl(e.data.open); });
}
export const checkUpdate = () => { try { REG && REG.update(); } catch (e) { /* offline */ } };

/* ---------- start ---------- */
function start() {
  plainC();
  const S = load();
  applyTheme();
  shell();
  if (hadLoadError()) { restoreScreen(true); return; }
  if (!S.onb) { go('today'); startOnboarding(() => { go('today'); syncPush(true); }); }
  else {
    go('today');
    if (location.hash) openUrl(location.hash);
    setTimeout(() => maybeWhatsNew(), 600);
  }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ }
  armLocal(); syncPush();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    C.syncToday(); refresh(); armLocal(); syncPush(); checkUpdate();
  });
  // every change: reschedule reminders a moment later
  import('./store.js').then((m) => m.subscribe(() => { queueSync(); armLocal(); }));
  sw();
}
start();
