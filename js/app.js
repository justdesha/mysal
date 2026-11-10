// Bud 1.0 — entry: tabs, quick add, lifecycle.
import * as C from './calc.js';
import { load, save, hadLoadError, VER } from './store.js';
import { $, $$, ic, sheet, closeSheets, haptic, toast } from './ui.js';
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
  moveInd(prev !== tab);
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
}
const tabBtn = (t) => `<button class="tab" data-tab="${t.id}" aria-current="false">${ic(t.icon)}<span>${t.label}</span></button>`;

function moveInd(animate) {
  const nav = $('.nav'), b = nav.querySelector(`.tab[data-tab="${cur}"]`), ind = $('.nav-ind');
  if (!b) return;
  const n = nav.getBoundingClientRect(), r = b.getBoundingClientRect();
  ind.style.transition = animate ? '' : 'none';
  ind.style.transform = `translateX(${r.left - n.left}px)`;
  ind.style.width = r.width + 'px';
  if (animate) { ind.classList.remove('pop'); void ind.offsetWidth; ind.classList.add('pop'); }
}

/* ---------- the + button ---------- */
function quickAdd() {
  haptic(12);
  const k = C.TK;
  const s = sheet({
    title: 'Додати', cls: 'quick',
    html: `<div class="qa">
      <button class="qa-t mint" data-q="shift">${ic('work')}<b>Зміну</b><span>на сьогодні чи будь-який день</span></button>
      <button class="qa-t sky" data-q="sleep">${ic('moon')}<b>Сон</b><span>як спалось минулої ночі</span></button>
      <button class="qa-t lime" data-q="spend">${ic('bag')}<b>Витрату</b><span>щоб бачити, скільки лишається</span></button>
      <button class="qa-t pink" data-q="gig">${ic('gift')}<b>Підробіток</b><span>разова оплата поза графіком</span></button>
    </div><button class="btn ghost wide" data-q="plan">${ic('magic')}Скласти план змін</button>`,
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

/* ---------- service worker & updates ---------- */
function sw() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w); });
    });
  }).catch(() => {});
  let done = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!done) { done = true; location.reload(); } });
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.open) openUrl(e.data.open); });
}
function showUpdate(w) {
  const b = document.createElement('div');
  b.className = 'update';
  b.innerHTML = '<span>Є нова версія Bud</span><button class="btn violet sm">Оновити</button>';
  b.querySelector('button').onclick = () => w.postMessage('skipWaiting');
  document.body.append(b);
}

/* ---------- start ---------- */
function start() {
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
    C.syncToday(); refresh(); armLocal(); syncPush();
  });
  // every change: reschedule reminders a moment later
  import('./store.js').then((m) => m.subscribe(() => { queueSync(); armLocal(); }));
  sw();
}
start();
