// «Що нового» — full-screen stories with a before → after picture for every change.
// Shown once after updating (and after restoring a backup made on an older version).
import * as C from './calc.js';
import { save, VER } from './store.js';
import { ic, haptic } from './ui.js';
import { buddy } from './buddy.js';
import { pushUrl } from './notify.js';

const BEFORE_AFTER = (before, after) => `<div class="wn-ba"><div class="wn-b"><span class="wn-tag">Було</span>${before}</div><span class="wn-arrow">${ic('right')}</span><div class="wn-a"><span class="wn-tag">Стало</span>${after}</div></div>`;

function slides() {
  const s = C.getState(), days = Object.keys(s.days).length, push = !!pushUrl();
  return [
    { bg: 'violet', html: `<div class="wn-buddy">${buddy({ mood: 'proud', pose: 'cheer' })}</div><p class="wn-k">оновлення</p><h2 class="wn-h">Bud ${VER}</h2><p class="wn-t">Новий вигляд, простіша структура і сповіщення, які приходять, навіть коли Bud закритий.</p>` },
    { bg: 'cream', html: `<p class="wn-k">структура</p><h2 class="wn-h">Чотири розділи замість лабіринту</h2>
      ${BEFORE_AFTER(`<div class="mock clutter">${'<i></i>'.repeat(9)}</div><small>5 вкладок, меню з 13 пунктів, 9 блоків на огляді</small>`,
        `<div class="mock four"><i class="mint"></i><i class="lime"></i><i class="sky"></i><i class="pink"></i></div><small>Сьогодні · Графік · Гроші · Я, а все рідкісне — у «Більше»</small>`)}` },
    { bg: 'mint', html: `<p class="wn-k">сповіщення</p><h2 class="wn-h">Нагадування — навіть коли Bud закритий</h2>
      ${BEFORE_AFTER(`<div class="mock badge"><span>Bud</span><b>3</b></div><small>лише число на іконці</small>`,
        `<div class="mock banner"><b>Зміна о 08:00</b><span>Готель · до 16:30</span></div><small>перед зміною, коли лягати, виплата, платежі</small>`)}
      ${push ? '' : '<p class="wn-t sm">Запрацює, щойно підключимо сервер сповіщень. До того — коли Bud відкритий.</p>'}` },
    { bg: 'lime', html: `<p class="wn-k">автоплан</p><h2 class="wn-h">План змін під твій ритм</h2>
      ${BEFORE_AFTER(`<div class="mock days">${'<i></i>'.repeat(7)}</div><small>зміни розкидались лише під ціль</small>`,
        `<div class="mock chipsm"><span>Зранку</span><span>Сб · Нд вільні</span><span>≤ 4 поспіль</span></div><small>коли комфортно, які дні лишити вільними, скільки днів поспіль</small>`)}` },
    { bg: 'sky', html: `<p class="wn-k">турбота</p><h2 class="wn-h">Поради з твоїх даних</h2>
      ${BEFORE_AFTER(`<div class="mock lines"><i></i><i></i><i></i><i></i></div><small>довгі статті</small>`,
        `<div class="mock tipm"><b>Завтра рання зміна о 6:00</b><span>Лягай до 21:00</span></div><small>коротко, з твоїм графіком і сном, плюс баланс роботи й життя</small>`)}` },
    { bg: 'pink', html: `<p class="wn-k">виправлено</p><h2 class="wn-h">Точніші розрахунки</h2>
      <ul class="wn-list"><li>Лікарняні рахуються з редукцією за чеськими правилами 2026 року — раніше виходили завищеними.</li>
      <li>Для DPP поріг страхування перевіряється за кожен місяць окремо (12 000 Kč, з 2027 — 12 500 Kč).</li>
      <li>Лікарняні на новій роботі більше не занижені.</li>
      <li>Надбавка за вихідні береться зі ставок місяця зміни.</li>
      <li>«Ціль закрита» — тільки коли гроші справді зароблені.</li>
      <li>Сон в усіх місцях рахується за ті самі 14 днів.</li></ul>` },
    { bg: 'violet', html: `<div class="wn-buddy">${buddy({ mood: 'happy', pose: 'hug' })}</div><h2 class="wn-h">Усе твоє на місці</h2><p class="wn-t">${days ? `${days} ${C.pl(days, C.W_DAY)} у графіку, роботи, ставки й цілі перенесено.` : 'Можна починати.'} Копія старої версії лишилась на телефоні — «Я → Дані й копія».</p>
      <button class="btn lime wide big" data-wn="end">Подивитись новий Bud</button>` }
  ];
}

export function maybeWhatsNew() {
  const s = C.getState();
  if (!s.onb || s.wnv === VER) return;
  if (!s.wasV && s.wnv) { s.wnv = VER; save(); return; }
  showWhatsNew();
}

export function showWhatsNew(manual = false) {
  const L = slides();
  let i = 0, t0 = 0, el0 = 0, paused = false, raf = 0;
  const DUR = 7000;
  const el = document.createElement('div');
  el.className = 'wn';
  el.innerHTML = `<div class="wn-bars">${L.map(() => '<i><b></b></i>').join('')}</div><button class="wn-x" aria-label="Закрити">${ic('close')}</button><div class="wn-stage"></div>
    <button class="wn-nav p" aria-label="Назад"></button><button class="wn-nav n" aria-label="Далі"></button>`;
  document.body.append(el);
  document.documentElement.classList.add('locked');
  const bars = [...el.querySelectorAll('.wn-bars b')], stage = el.querySelector('.wn-stage');
  const show = (n) => { i = n; el0 = 0; el.dataset.bg = L[i].bg; stage.innerHTML = `<section class="wn-s">${L[i].html}</section>`; bars.forEach((b, k) => { b.style.width = k < i ? '100%' : '0'; }); t0 = performance.now(); };
  const close = () => { cancelAnimationFrame(raf); el.classList.add('out'); setTimeout(() => { el.remove(); document.documentElement.classList.remove('locked'); }, 300); const s = C.getState(); s.wnv = VER; delete s.wasV; save(); };
  const loop = (now) => { if (!paused && i < L.length - 1) el0 += now - t0; t0 = now; bars[i].style.width = i === L.length - 1 ? '100%' : Math.min(100, el0 / DUR * 100) + '%'; if (el0 >= DUR) show(i + 1); raf = requestAnimationFrame(loop); };
  let down = 0, y0 = 0;
  el.addEventListener('pointerdown', (e) => { if (e.target.closest('button:not(.wn-nav)')) return; down = Date.now(); y0 = e.clientY; paused = true; });
  el.addEventListener('pointerup', (e) => {
    paused = false; if (!down) return; const long = Date.now() - down > 350; down = 0;
    if (e.clientY - y0 > 90) return close(); if (long) return;
    if (e.target.closest('.wn-nav.p')) { haptic(); show(Math.max(0, i - 1)); }
    else if (e.target.closest('.wn-nav.n')) { haptic(); if (i < L.length - 1) show(i + 1); else close(); }
  });
  el.querySelector('.wn-x').onclick = close;
  el.addEventListener('click', (e) => { if (e.target.closest('[data-wn="end"]')) close(); });
  show(0); raf = requestAnimationFrame(loop);
}
