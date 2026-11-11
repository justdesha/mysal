// «Що нового» — full-screen stories with a before → after picture for every change.
// Each version has its own deck. People see every deck newer than the one they saw last
// (after updating, and after restoring a backup made on an older version).
import * as C from './calc.js';
import { save, VER } from './store.js';
import { ic, haptic } from './ui.js';
import { face, bud, cluster, moodFace } from './cast.js';
import { pushUrl } from './notify.js';

const BA = (before, after) => `<div class="wn-ba"><div class="wn-b"><span class="wn-tag">було</span>${before}</div><span class="wn-arrow">${ic('right')}</span><div class="wn-a"><span class="wn-tag">стало</span>${after}</div></div>`;

const DECKS = {
  '1.0.0': () => {
    const push = !!pushUrl();
    return [
      { bg: 'lime', html: `<p class="wn-k">структура</p><h2 class="wn-h">Чотири розділи замість лабіринту</h2>
        ${BA(`<div class="mock clutter">${'<i></i>'.repeat(9)}</div><small>5 вкладок, меню з 13 пунктів, 9 блоків на огляді</small>`,
          `<div class="mock four"><i class="mint"></i><i class="lime"></i><i class="sky"></i><i class="pink"></i></div><small>Сьогодні · Графік · Гроші · Я, рідкісне — у «Більше»</small>`)}` },
      { bg: 'sky', html: `<p class="wn-k">сповіщення</p><h2 class="wn-h">Нагадування, навіть коли Bud закритий</h2>
        ${BA(`<div class="mock badge"><span>Bud</span><b>3</b></div><small>лише число на іконці</small>`,
          `<div class="mock banner"><b>Зміна о 08:00</b><span>Готель · до 16:30</span></div><small>перед зміною, коли лягати, виплата, платежі</small>`)}
        ${push ? '' : '<p class="wn-t sm">Запрацює, щойно підключимо сервер сповіщень. До того — коли Bud відкритий.</p>'}` },
      { bg: 'yellow', html: `<p class="wn-k">автоплан</p><h2 class="wn-h">План змін під твій ритм</h2>
        ${BA(`<div class="mock days">${'<i></i>'.repeat(7)}</div><small>зміни розкидались лише під ціль</small>`,
          `<div class="mock chipsm"><span>Зранку</span><span>Сб · Нд вільні</span><span>≤ 4 поспіль</span></div><small>коли комфортно, які дні вільні, скільки днів поспіль</small>`)}` },
      { bg: 'pink', html: `<p class="wn-k">виправлено</p><h2 class="wn-h">Точніші розрахунки</h2>
        <ul class="wn-list"><li>Лікарняні з редукцією за чеськими правилами 2026 року — раніше виходили завищеними.</li>
        <li>Поріг страхування DPP — за кожен місяць окремо (12 000 Kc, з 2027 — 12 500 Kc).</li>
        <li>Лікарняні на новій роботі більше не занижені.</li>
        <li>«Ціль закрита» — лише коли гроші справді зароблені.</li>
        <li>Сон усюди рахується за ті самі 14 днів.</li></ul>` }
    ];
  },
  '1.0.1': () => [
    { bg: 'lilac', html: `<p class="wn-k">новий вигляд</p><h2 class="wn-h">Знайомся з компанією</h2>
      ${BA(`<div class="mock oldbud"><i></i></div><small>один мультяшний бадді</small>`,
        `<div class="mock newcast">${face({ shape: 'circle', color: 'grape', mood: 'happy', hair: 'curl' })}${face({ shape: 'bolt', color: 'sun', mood: 'up' })}${face({ shape: 'flower', color: 'pink', mood: 'calm' })}</div><small>градієнтні персонажі, які показують твій стан</small>`)}` },
    { bg: 'orange', html: `<p class="wn-k">щодня</p><h2 class="wn-h">«Як ти сьогодні?»</h2>
      ${BA(`<div class="mock lines"><i></i><i></i><i></i></div><small>Bud знав лише про зміни й сон</small>`,
        `<div class="mock moods">${moodFace('up')}${moodFace('calm')}${moodFace('tired')}</div><small>один дотик — і настрій іде в баланс і календар настрою</small>`)}` },
    { bg: 'sky', html: `<p class="wn-k">меню</p><h2 class="wn-h">Скляне меню і компактний плюс</h2>
      ${BA(`<div class="mock oldnav"><i></i></div><small>темна смуга й великий плюс</small>`,
        `<div class="mock newnav"><i></i></div><small>прозоре скло, виділення перетікає між вкладками</small>`)}` }
  ],
  '1.0.2': () => [
    { bg: 'sky', html: `<p class="wn-k">панелі</p><h2 class="wn-h">Панелі під розмір</h2>
      ${BA(`<div class="mock shold"><i><b></b><b></b></i></div><small>займали весь екран, знизу — порожньо</small>`,
        `<div class="mock shnew"><i><b></b><b></b></i></div><small>висота — за вмістом, видно, що позаду</small>`)}` },
    { bg: 'pink', html: `<p class="wn-k">витрати</p><h2 class="wn-h">Витрату можна змінити</h2>
      ${BA(`<div class="mock swold"><i></i><b>${ic('trash')}</b></div><small>лише кнопка-кошик у кожному рядку</small>`,
        `<div class="mock swnew"><i></i><b>${ic('trash')}Видалити</b></div><small>торкнись — зміни суму чи день; свайп ліворуч — видалити</small>`)}` },
    { bg: 'lime', html: `<p class="wn-k">дрібниці</p><h2 class="wn-h">Ще трохи</h2>
      <ul class="wn-list"><li>Крони тепер пишуться «Kc», без гачка: так шрифт не ламається.</li>
      <li>Панель піднімається над клавіатурою, поля не ховаються.</li>
      <li>Bud оновлюється сам, щойно ти його відкриваєш.</li></ul>` }
  ]
};
const vnum = (v) => String(v || '0').split(/[ .-]/).slice(0, 3).map((x) => +x || 0).reduce((a, x) => a * 100 + x, 0);

function slides(fromVer) {
  const s = C.getState(), days = Object.keys(s.days).length;
  const keys = Object.keys(DECKS).filter((v) => vnum(v) > vnum(fromVer) && vnum(v) <= vnum(VER)).sort((a, b) => vnum(a) - vnum(b));
  const body = keys.flatMap((v) => DECKS[v]());
  const big = keys.includes('1.0.0'), look = keys.includes('1.0.1');
  return [
    { bg: 'white', html: `<div class="cluster-wrap">${cluster()}</div><p class="wn-k">оновлення</p><h2 class="wn-h">Bud ${VER}</h2><p class="wn-t">${big ? 'Новий вигляд, простіша структура і сповіщення, які приходять, навіть коли Bud закритий.' : look ? 'Новий вигляд, персонажі, щоденний настрій і зручніші панелі.' : 'Панелі під розмір і витрати, які можна змінити.'}</p>` },
    ...body,
    { bg: 'lilac', html: `<div class="wn-face">${bud('proud')}</div><h2 class="wn-h">Усе твоє на місці</h2><p class="wn-t">${days ? `${days} ${C.pl(days, C.W_DAY)} у графіку, роботи, ставки й цілі — на місці.` : 'Можна починати.'}${big ? ' Копія старої версії лишилась на телефоні — «Я → Дані й копія».' : ''}</p>
      <button class="btn ink wide big" data-wn="end">Подивитись</button>` }
  ];
}

export function maybeWhatsNew() {
  const s = C.getState();
  if (!s.onb || s.wnv === VER) return;
  const from = s.wasV ? '0.9' : s.wnv;
  if (!from) { s.wnv = VER; save(); return; } // brand new person — nothing to compare with
  showWhatsNew(false, from);
}

export function showWhatsNew(manual = false, from) {
  const s = C.getState();
  const L = slides(manual ? '1.0.0' : (from || s.wnv || '0.9'));
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
  const close = () => { cancelAnimationFrame(raf); el.classList.add('out'); setTimeout(() => { el.remove(); document.documentElement.classList.remove('locked'); }, 300); const st = C.getState(); st.wnv = VER; delete st.wasV; save(); };
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
