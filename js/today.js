// «Сьогодні»: hello + how-are-you check-in, today's shift, four pastel tiles, shift confirmations, month, one tip.
import * as C from './calc.js';
import { save } from './store.js';
import { ic, countUp, haptic, toast } from './ui.js';
import { face, MOOD_SET, moodFace, bud } from './cast.js';
import { stk, chipIc } from './stickers.js';
import { tips, todayMood, g } from './care.js';
import { openDay } from './schedule.js';
import { openBalance } from './money.js';
import { openSleep } from './me.js';
import { openInbox, unread } from './notify.js';

const go = (t) => window.dispatchEvent(new CustomEvent('bud:go', { detail: t }));
const refresh = () => window.dispatchEvent(new Event('bud:refresh'));

/** job color → pastel token (handles 0.9.x hex colors too) */
export const jobColor = (j) => {
  const old = { '#a6d83f': 'lime', '#f2c230': 'yellow', '#4fb3e8': 'sky', '#f07ba0': 'pink', '#9b7cf0': 'lilac', '#ff9f4a': 'orange' };
  return old[(j && j.c || '').toLowerCase()] || (j && j.c && !j.c.startsWith('#') ? j.c : 'lilac');
};
/** which character peeks out of a job-colored card */
const PEEK = { lilac: ['circle', 'grape'], lime: ['circle', 'lime'], sky: ['blob', 'sky'], pink: ['flower', 'pink'], yellow: ['bolt', 'sun'], orange: ['squircle', 'orange'], coral: ['triangle', 'coral'], mint: ['pill', 'mint'] };
export const peekFace = (tone, mood = 'happy') => { const [shape, color] = PEEK[tone] || PEEK.lilac; return face({ shape, color, mood }); };
export const hmShort = (m) => { m = Math.round(m); return `${Math.floor(m / 60)}<small>год</small>${m % 60 ? ` ${m % 60}<small>хв</small>` : ''}`; };
export const TIP_ICON = { zz: 'bed', work: 'shift', info: 'spark', clock: 'clock', moon: 'moon', repeat: 'repeat', leaf: 'leaf', heart: 'heart', warn: 'warn', wallet: 'wallet', target: 'target', sofa: 'sofa' };
export const tipHtml = (t, attr = '') => `<div class="tip c-${t.color}" ${attr}>${chipIc(TIP_ICON[t.icon] || 'spark', t.color)}<span class="grow"><b>${t.title}</b><span>${t.text}</span></span></div>`;

const greet = () => { const h = new Date().getHours(); return h >= 5 && h < 11 ? 'Доброго ранку' : h >= 18 && h < 23 ? 'Добрий вечір' : h >= 23 || h < 5 ? 'Доброї ночі' : 'Привіт'; };

function shiftCard(k) {
  const ab = C.absOf(k), sh = C.shOf(k);
  if (ab) {
    const sick = ab.t === 'sick';
    return `<button class="shift c-${sick ? 'coral' : 'sky'}" data-a="day"><span class="lab">${stk(sick ? 'thermo' : 'sun')}${sick ? 'Лікарняний' : 'Відпустка'}</span>
      <b class="big">${sick ? 'Одужуй' : 'Відпочивай'}</b><span class="sub">${sick ? 'Сьогодні головне — сон, вода й спокій' : 'Жодних змін, лише ти'}</span>
      <span class="peek">${face({ shape: sick ? 'triangle' : 'blob', color: sick ? 'coral' : 'sky', mood: sick ? 'sick' : 'chill' })}</span></button>`;
  }
  if (sh.length) {
    const s = [...sh].sort((a, b) => C.tm(a.s || '00:00') - C.tm(b.s || '00:00')), f = s[0], j = C.job(f.j), tone = jobColor(j);
    const h = s.reduce((t, x) => t + C.paidH(x), 0), net = s.reduce((t, x) => t + C.toM(C.shN(x, C.TD.getFullYear(), C.TD.getMonth()), C.job(x.j).cur), 0);
    const end = f.e || (f.s ? C.mt(C.tm(f.s) + C.shH(f) * 60) : '');
    return `<button class="shift c-${tone}" data-a="day"><span class="lab">${stk('shift')}Зміна сьогодні${s.length > 1 ? ` · ${s.length}` : ''}</span>
      <b class="big">${f.s ? `${f.s}–${end}` : C.nf(h) + ' год'}</b>
      <span class="sub">${C.esc(j.n || 'Робота')} · ${C.nf(h)} год${net ? ` · ≈ ${C.kc(net)}` : ''}</span>
      <span class="peek">${peekFace(tone, 'happy')}</span></button>`;
  }
  // nothing today: show the next shift if there is one
  let next = null;
  for (let i = 1; i <= 21 && !next; i++) { const d = C.addD(C.TD, i), q = C.shOf(C.ds(d)).filter((x) => x.s).sort((a, b) => C.tm(a.s) - C.tm(b.s))[0]; if (q) next = { d, x: q }; }
  const off = C.isOff(k);
  return `<div class="shift c-${off ? 'lime' : 'lilac'}"><span class="lab">${stk(off ? 'leaf' : 'cal')}${off ? 'Вихідний' : 'Сьогодні вільно'}</span>
    <b class="big">${off ? 'Час для себе' : 'Без змін'}</b>
    <span class="sub">${next ? `Наступна зміна: ${C.DS[next.d.getDay()].toLowerCase()}, ${C.dLong(next.d)} о ${next.x.s}` : 'Попереду змін ще немає'}</span>
    ${off ? '' : `<button class="btn sm ink" data-a="addday">${ic('plus')}Додати зміну</button>`}
    <span class="peek">${face({ shape: 'circle', color: off ? 'lime' : 'grape', mood: off ? 'calm' : 'curious', hair: off ? 'brow' : 'curl' })}</span></div>`;
}

function sleepTile(k) {
  const S = C.getState(), m = C.slDur(S.sleep[k]), goal = C.sgv() * 60;
  const nights = []; for (let i = 6; i >= 0; i--) nights.push(C.slDur(S.sleep[C.ds(C.addD(C.TD, -i))]));
  const max = Math.max(goal + 60, ...nights);
  return `<button class="tile orange" data-a="sleep"><span class="t-lab">${stk('bed')}Сон</span>
    <span class="minibars">${nights.map((n, i) => `<i class="${!n ? 'lo' : ''} ${i === 6 ? 'now' : ''}" style="height:${n ? Math.max(10, n / max * 100) : 8}%"></i>`).join('')}</span>
    ${m ? `<b class="t-big">${hmShort(m)}</b><span class="t-sub">${Math.abs(m - goal) < 20 ? 'як і хотілось' : m < goal ? `на ${C.hm(goal - m)} менше цілі` : 'з запасом'}</span>`
      : `<b class="t-big sm">Записати ніч</b><span class="t-sub">${g('коли ліг і встав', 'коли лягла і встала', 'коли заснути й прокинутись')}</span>`}</button>`;
}

function loadTile() {
  const mon = C.monday(C.TD), nr = C.norm();
  const days = []; let tot = 0;
  for (let i = 0; i < 7; i++) { const h = C.shOf(C.ds(C.addD(mon, i))).reduce((t, x) => t + C.paidH(x), 0); days.push(h); tot += h; }
  const max = Math.max(10, ...days), ratio = tot / nr;
  const word = !tot ? 'Вільно' : ratio > 1.12 ? 'Високе' : ratio < .6 ? 'Легке' : 'Норма';
  const today = (C.TD.getDay() + 6) % 7;
  return `<button class="tile lilac" data-a="plan"><span class="t-lab">${stk('chart')}Навантаження</span>
    <span class="minibars">${days.map((h, i) => `<i class="${!h ? 'lo' : ''} ${i === today ? 'now' : ''}" style="height:${h ? Math.max(12, h / max * 100) : 8}%"></i>`).join('')}</span>
    <b class="t-big">${word}</b><span class="t-sub">${C.nf(tot)} з ${nr} год цього тижня</span></button>`;
}

function moneyTile() {
  const b = C.dayBudget();
  if (!b) return `<button class="tile lime" data-a="bal"><span class="t-lab">${stk('wallet')}Бюджет</span><b class="t-big sm">Вкажи залишок</b><span class="t-sub">і Bud порахує, скільки можна щодня</span></button>`;
  const left = Math.max(0, b.left);
  return `<button class="tile lime" data-a="bal"><span class="t-lab">${stk('wallet')}Можна сьогодні</span><b class="t-big" data-count="${Math.round(left)}">${C.kc(left)}</b><span class="t-sub">${b.until ? `до виплати ${C.dLong(b.until)}` : 'на день'}</span></button>`;
}

function payTile() {
  const e = C.payEvents(C.TD, 45).find((x) => x.t === 'in');
  if (!e) { const hasPd = C.getState().jobs.some((j) => C.num(j.pd)); return `<button class="tile sky" data-a="money"><span class="t-lab">${stk('coin')}Виплата</span><b class="t-big sm">${hasPd ? 'Поки нічого' : 'Не заплановано'}</b><span class="t-sub">${hasPd ? 'додай зміни — Bud порахує' : 'вкажи день виплати в роботі'}</span></button>`; }
  const n = C.dd(C.TD, e.d);
  return `<button class="tile sky" data-a="money"><span class="t-lab">${stk('coin')}${n === 0 ? 'Виплата сьогодні' : 'Виплата'}</span>
    <b class="t-big">${n === 0 ? C.kc(e.a) : n === 1 ? 'Завтра' : `${e.d.getDate()} ${C.MS[e.d.getMonth()]}`}</b><span class="t-sub">${n === 0 ? C.esc(e.n) : `≈ ${C.kc(e.a)} · ${C.esc(e.n)}`}</span></button>`;
}

/** past planned shifts that still need a yes/no */
function pending() {
  const out = [], now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
  for (let i = 14; i >= 0; i--) {
    const k = C.ds(C.addD(C.TD, -i));
    C.shOf(k).forEach((x) => { if (!x.pl) return; const end = x.s ? C.tm(x.s) + C.shH(x) * 60 : 1440; if (k < C.TK || end <= nowM) out.push({ k, x }); });
  }
  return out;
}
let feelFor = null; // a shift just confirmed — ask how it went

function quizCard(P) {
  if (feelFor) {
    return `<section class="quiz"><div class="q-top"><span>${stk('heart')}Самопочуття</span><span>${C.dLong(C.pk(feelFor))}</span></div>
      <b class="q">Як ти після цієї зміни?</b>
      <div class="q-acts"><button data-feel="1">Важко</button><button data-feel="2">Нормально</button><button data-feel="3">Легко</button></div></section>`;
  }
  if (!P.length) return '';
  const { k, x } = P[0], d = C.pk(k);
  return `<section class="quiz" data-k="${k}" data-id="${x.id}"><div class="q-top"><span>${stk('shift')}Підтвердження</span><span>${P.length > 1 ? `1 з ${P.length}` : ''}</span></div>
    <b class="q">${g('Ти відпрацював', 'Ти відпрацювала', 'Зміна відбулась:')} ${C.DS[d.getDay()].toLowerCase()}, ${C.dLong(d)}${x.s ? `, ${x.s}–${x.e || ''}` : ''}${C.getState().jobs.length > 1 ? ` (${C.esc(C.job(x.j).n)})` : ''}?</b>
    <div class="q-acts"><button data-a="yes">Так</button><button class="alt" data-a="no">Ні, не було</button></div></section>`;
}

export function renderToday(el) {
  const S = C.getState(), k = C.TK, T = C.TD;
  const y = T.getFullYear(), m = T.getMonth();
  const ms = C.mSum(y, m), tgt = C.target();
  const P = pending(), tip = tips()[0], n = unread();
  const mood = (S.mood || {})[k];

  el.innerHTML = `
  <header class="hd">
    <button class="avatar" data-a="me" aria-label="Профіль">${S.prof.av ? `<img src="${S.prof.av}" alt="">` : bud(todayMood())}</button>
    <div class="hd-t"><span>${S.name ? 'З поверненням' : 'Привіт'}</span><b>${S.name ? C.esc(S.name) : 'Bud'}</b></div>
    <button class="ib line" data-a="bell" aria-label="Сповіщення">${ic('bell')}${n ? `<span class="dot-n">${n > 9 ? '9+' : n}</span>` : ''}</button>
  </header>
  <p class="date">${C.dLong(T)}, ${C.DL[T.getDay()]}</p>
  <h1 class="hi">${greet()}${S.name ? `, ${C.esc(S.name)}` : ''}! Як ти сьогодні?</h1>
  <div class="moods hscroll" role="group" aria-label="Настрій сьогодні">${MOOD_SET.map((q) => `<button class="mood" data-mood="${q.id}" aria-pressed="${mood === q.id}">${moodFace(q.id)}${q.label}</button>`).join('')}</div>
  ${S.demo ? `<div class="demo-b"><span>Зараз показано демо-дані</span><button class="btn sm" data-a="undemo">Прибрати</button></div>` : ''}
  ${shiftCard(k)}
  <section class="tiles">${sleepTile(k)}${loadTile()}${moneyTile()}${payTile()}</section>
  ${quizCard(P)}
  <section class="card month" data-a="money" role="button" tabindex="0">
    <div class="row-sb"><h2 class="h3">${C.MN[m]}</h2><span class="small muted">${tgt ? `ціль ${C.kc(tgt)}` : 'чистими'}</span></div>
    <b class="num-xl" data-count="${Math.round(ms.n)}">${C.kc(ms.n)}</b>
    <p class="small muted">${ms.pn ? `разом із запланованим — ${C.kc(ms.n + ms.pn)}` : 'запланованих змін більше немає'}</p>
    ${tgt ? `<div class="bar2"><i style="width:${Math.min(100, ms.n / tgt * 100)}%"></i><i class="plan" style="width:${Math.min(100, (ms.n + ms.pn) / tgt * 100)}%"></i></div>
      <p class="small">${ms.n >= tgt ? 'Ціль місяця досягнута 🎉' : ms.n + ms.pn >= tgt ? `З планом ціль буде досягнута. Фактом бракує ${C.kc(tgt - ms.n)}` : `До цілі ще ${C.kc(tgt - ms.n - ms.pn)} понад план`}</p>` : ''}
  </section>
  ${tip ? tipHtml(tip, tip.act ? `data-a="tip" data-act="${tip.act.join('|')}" role="button" tabindex="0"` : '') + `<button class="link" data-a="tips">Усі поради ${ic('right')}</button>` : ''}`;

  el.querySelectorAll('[data-count]').forEach((q) => countUp(q, +q.dataset.count, (v) => C.kc(v)));
  if (!el._bound) { el._bound = true; el.addEventListener('click', onClick); }
}

function onClick(e) {
  const md = e.target.closest('[data-mood]');
  if (md) {
    const S = C.getState(); S.mood = S.mood || {};
    const id = md.dataset.mood;
    if (S.mood[C.TK] === id) delete S.mood[C.TK]; else S.mood[C.TK] = id;
    save(); haptic(12);
    const screen = md.closest('.screen'); refresh();
    const nb = screen && screen.querySelector(`[data-mood="${id}"]`); if (nb && S.mood[C.TK]) nb.classList.add('pop');
    if (S.mood[C.TK]) toast(['tense', 'sad'].includes(id) ? 'Записано. Подбай сьогодні про себе' : id === 'tired' ? 'Записано. Сьогодні варто лягти раніше' : 'Записано');
    return;
  }
  const f = e.target.closest('[data-feel]');
  if (f && feelFor) { const S = C.getState(); S.days[feelFor] = S.days[feelFor] || {}; S.days[feelFor].f = +f.dataset.feel; save(); haptic(12); feelFor = null; toast('Дякую! Поради стануть точнішими'); refresh(); return; }
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'day') openDay(C.TK);
  else if (a === 'addday') { e.stopPropagation(); openDay(C.TK, { addShift: true }); }
  else if (a === 'bal') openBalance();
  else if (a === 'money') go('money');
  else if (a === 'plan') go('plan');
  else if (a === 'sleep') openSleep(C.TK);
  else if (a === 'me' || a === 'tips') go('me');
  else if (a === 'bell') openInbox((u) => import('./app.js').then((m) => m.openUrl(u)));
  else if (a === 'undemo') import('./store.js').then((m) => { m.undemo(); location.reload(); });
  else if (a === 'tip') { const [t, v] = b.dataset.act.split('|'); if (t === 'day') openDay(v); else if (t === 'tab') go(v); else if (t === 'sleep') openSleep(C.TK); }
  else if (a === 'yes' || a === 'no') {
    const r = b.closest('[data-k]'), k = r.dataset.k, id = r.dataset.id, S = C.getState(), day = S.days[k];
    if (!day) return;
    if (a === 'yes') { const x = day.sh.find((s) => s.id === id); if (x) delete x.pl; haptic(12); if (!day.f) feelFor = k; else toast('Зміну зараховано у факт'); }
    else { day.sh = day.sh.filter((s) => s.id !== id); if (!day.sh.length) delete day.sh; if (!day.sh && !day.o && !day.ab && !day.f) delete S.days[k]; haptic(8); toast('Прибрано з графіка'); }
    save(); refresh();
  }
}
