// «Сьогодні»: greeting, the buddy holding today's four tiles, confirmations, month progress, one tip.
import * as C from './calc.js';
import { save } from './store.js';
import { ic, countUp, haptic, toast } from './ui.js';
import { buddy } from './buddy.js';
import { tips, todayMood, g } from './care.js';
import { openDay } from './schedule.js';
import { openBalance } from './money.js';
import { openSleep } from './me.js';
import { openInbox, unread } from './notify.js';

const go = (t) => window.dispatchEvent(new CustomEvent('bud:go', { detail: t }));
const refresh = () => window.dispatchEvent(new Event('bud:refresh'));

export const jobColor = (j) => {
  const old = { '#a6d83f': 'lime', '#f2c230': 'yellow', '#4fb3e8': 'sky', '#f07ba0': 'pink', '#9b7cf0': 'lilac', '#ff9f4a': 'coral' };
  return old[(j && j.c || '').toLowerCase()] || (j && j.c && !j.c.startsWith('#') ? j.c : 'mint');
};
export const hmShort = (m) => { m = Math.round(m); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };

function greet() {
  const h = new Date().getHours();
  return h >= 5 && h < 11 ? 'Доброго ранку' : h >= 18 && h < 23 ? 'Добрий вечір' : h >= 23 || h < 5 ? 'Доброї ночі' : 'Привіт';
}

function status(k) {
  const ab = C.absOf(k), sh = C.shOf(k);
  if (ab) return ab.t === 'sick' ? 'Лікарняний — головне зараз одужати' : 'Відпустка — відпочинок без планів';
  if (sh.length) { const f = sh.filter((x) => x.s).sort((a, b) => C.tm(a.s) - C.tm(b.s))[0]; return f ? `Сьогодні зміна з ${f.s}` : 'Сьогодні робочий день'; }
  if (C.isOff(k)) return 'Вихідний — час для себе';
  return 'Вільний день у графіку';
}

function shiftTile(k) {
  const ab = C.absOf(k), sh = C.shOf(k);
  if (ab) return `<span class="t-lab">Сьогодні</span><b class="t-big">${ab.t === 'sick' ? 'Хворію' : 'Відпустка'}</b><span class="t-sub">${C.esc(C.job(ab.j).n || '')}</span>`;
  if (sh.length) {
    const s = [...sh].sort((a, b) => C.tm(a.s || '00:00') - C.tm(b.s || '00:00'));
    const f = s[0], h = s.reduce((t, x) => t + C.shH(x), 0);
    const end = f.e || (f.s ? C.mt(C.tm(f.s) + C.shH(f) * 60) : '');
    return `<span class="t-lab">Сьогодні</span><b class="t-big">${f.s || C.nf(h) + ' год'}</b><span class="t-sub">${f.s ? `до ${end} · ` : ''}${C.esc(C.job(f.j).n || 'Зміна')}${s.length > 1 ? ` +${s.length - 1}` : ''}</span>`;
  }
  return `<span class="t-lab">Сьогодні</span><b class="t-big">${C.isOff(k) ? 'Вихідний' : 'Вільно'}</b><span class="t-sub">${C.isOff(k) ? 'відпочинок у плані' : 'додати зміну'}</span>`;
}

function moneyTile() {
  const b = C.dayBudget();
  if (!b) return `<span class="t-lab">Баланс</span><b class="t-big sm">Вкажи залишок</b><span class="t-sub">і Bud порахує денний бюджет</span>`;
  const left = Math.max(0, b.left);
  return `<span class="t-lab">Можна сьогодні</span><b class="t-big" data-count="${Math.round(left)}">${C.kc(left)}</b><span class="t-sub">${b.until ? `до виплати ${C.dLong(b.until)}` : 'на день'}</span>`;
}

function payTile() {
  const e = C.payEvents(C.TD, 45).find((x) => x.t === 'in');
  if (!e) { const hasPd = C.getState().jobs.some((j) => C.num(j.pd)); return `<span class="t-lab">Виплата</span><b class="t-big sm">${hasPd ? 'Поки нічого' : 'Не заплановано'}</b><span class="t-sub">${hasPd ? 'додай зміни — Bud порахує виплату' : 'вкажи день виплати в роботі'}</span>`; }
  const n = C.dd(C.TD, e.d);
  return `<span class="t-lab">${n === 0 ? 'Виплата сьогодні' : 'Наступна виплата'}</span><b class="t-big">${n === 0 ? C.kc(e.a) : n === 1 ? 'Завтра' : `${e.d.getDate()} ${C.MS[e.d.getMonth()]}`}</b><span class="t-sub">${n === 0 ? C.esc(e.n) : `~${C.kc(e.a)} · ${C.esc(e.n)}`}</span>`;
}

function sleepTile(k) {
  const m = C.slDur(C.getState().sleep[k]);
  if (!m) return `<span class="t-lab">Сон</span><b class="t-big sm">Записати</b><span class="t-sub">як спалось уночі</span>`;
  const goal = C.sgv() * 60, d = m - goal;
  return `<span class="t-lab">Сон уночі</span><b class="t-big">${hmShort(m)}</b><span class="t-sub">${Math.abs(d) < 20 ? 'як і хотілось' : d < 0 ? `на ${C.hm(-d)} менше цілі` : 'з запасом'}</span>`;
}

/** past planned shifts that still need a yes/no */
function pending() {
  const out = [];
  for (let i = 14; i >= 0; i--) {
    const d = C.addD(C.TD, -i), k = C.ds(d);
    C.shOf(k).forEach((x) => {
      if (!x.pl) return;
      const end = x.s ? C.tm(x.s) + C.shH(x) * 60 : 24 * 60;
      const now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
      if (k < C.TK || (k === C.TK && end <= nowM)) out.push({ k, x });
    });
  }
  return out;
}

let root;
export function renderToday(el) {
  root = el;
  const S = C.getState(), k = C.TK, T = C.TD;
  const mood = todayMood();
  const y = T.getFullYear(), m = T.getMonth();
  const ms = C.mSum(y, m), tgt = C.target();
  const wk = C.sumR(C.monday(T), C.addD(C.monday(T), 6)), nr = C.norm();
  const P = pending();
  const tip = tips()[0];
  const n = unread();

  el.innerHTML = `
  <section class="hero">
    <div class="hero-top"><span class="wordmark">bud</span>
      <button class="ib glass" data-a="bell" aria-label="Сповіщення">${ic('bell')}${n ? `<span class="dot-n">${n > 9 ? '9+' : n}</span>` : ''}</button></div>
    <p class="hero-date">${C.DL[T.getDay()]}, ${C.dLong(T)}</p>
    <h1 class="hero-hi">${greet()}${S.name ? ',<br>' + C.esc(S.name) : ''}</h1>
    <p class="hero-sub">${status(k)}</p>
    <div class="hero-buddy">${buddy({ mood, pose: 'hold', legs: false })}</div>
  </section>

  ${S.demo ? `<div class="demo-b"><span>Зараз показано демо-дані</span><button class="btn sm soft" data-a="undemo">Прибрати</button></div>` : ''}
  <section class="tiles">
    <button class="tile mint" data-a="day">${shiftTile(k)}</button>
    <button class="tile lime" data-a="bal">${moneyTile()}</button>
    <button class="tile sky" data-a="money">${payTile()}</button>
    <button class="tile pink" data-a="sleep">${sleepTile(k)}</button>
  </section>

  ${P.length ? `<section class="card pend"><h2 class="h3">Як пройшли зміни?</h2><p class="muted small">Поки зміну не підтверджено, вона рахується як план.</p>
    ${P.slice(0, 4).map(({ k: pk, x }) => `<div class="pend-row" data-k="${pk}" data-id="${x.id}">
      <span class="grow"><b>${C.DS[C.pk(pk).getDay()]}, ${C.dLong(C.pk(pk))}</b><span>${x.s ? `${x.s}–${x.e || ''} · ` : ''}${C.esc(C.job(x.j).n || 'Зміна')}</span></span>
      <button class="ib ok" data-a="yes" aria-label="Так, працював">${ic('check')}</button><button class="ib" data-a="no" aria-label="Ні, зміни не було">${ic('close')}</button></div>`).join('')}
    ${P.length > 4 ? `<p class="small muted">і ще ${P.length - 4}</p>` : ''}</section>` : ''}

  <section class="card month" data-a="money" role="button" tabindex="0">
    <div class="row-sb"><h2 class="h3">${C.MN[m]}</h2><span class="small muted">${tgt ? `ціль ${C.kc(tgt)}` : 'чистими'}</span></div>
    <b class="num-xl" data-count="${Math.round(ms.n)}">${C.kc(ms.n)}</b>
    <p class="small muted">${ms.pn ? `разом із запланованим — ${C.kc(ms.n + ms.pn)}` : 'заплановано більше нічого'}</p>
    ${tgt ? `<div class="bar2"><i style="width:${Math.min(100, ms.n / tgt * 100)}%"></i><i class="plan" style="width:${Math.min(100, (ms.n + ms.pn) / tgt * 100)}%"></i></div>
      <p class="small">${ms.n >= tgt ? 'Ціль місяця досягнута 🎉' : ms.n + ms.pn >= tgt ? `Якщо відпрацювати план, ціль буде досягнута — бракує ${C.kc(tgt - ms.n)} фактом` : `До цілі ще ${C.kc(tgt - ms.n - ms.pn)} понад план`}</p>` : ''}
    <div class="mini-row"><span>${ic('clock')}Тиждень: <b>${C.nf(wk.h + wk.ph)} год</b> із ${nr}</span><span>${ic('work')}<b>${ms.w + ms.pw}</b> ${C.pl(ms.w + ms.pw, C.W_SH)}</span></div>
  </section>

  ${tip ? `<section class="tip c-${tip.color}" ${tip.act ? `data-a="tip" data-act="${tip.act.join('|')}" role="button" tabindex="0"` : ''}>
    <span class="tip-ic">${ic(tip.icon)}</span><span class="grow"><b>${tip.title}</b><span>${tip.text}</span></span></section>
    <button class="link" data-a="tips">Усі поради ${ic('right')}</button>` : ''}`;

  el.querySelectorAll('[data-count]').forEach((n) => countUp(n, +n.dataset.count, (v) => C.kc(v)));
  if (!el._bound) { el._bound = true; el.addEventListener('click', onClick); }
}

function onClick(e) {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'day') openDay(C.TK);
  else if (a === 'bal') openBalance();
  else if (a === 'money') go('money');
  else if (a === 'sleep') openSleep(C.TK);
  else if (a === 'bell') openInbox((u) => import('./app.js').then((m) => m.openUrl(u)));
  else if (a === 'tips') go('me');
  else if (a === 'undemo') import('./store.js').then((m) => { m.undemo(); location.reload(); });
  else if (a === 'tip') { const [t, v] = b.dataset.act.split('|'); if (t === 'day') openDay(v); else if (t === 'tab') go(v); else if (t === 'sleep') openSleep(C.TK); }
  else if (a === 'yes' || a === 'no') {
    const r = b.closest('[data-k]'), k = r.dataset.k, id = r.dataset.id, S = C.getState(), day = S.days[k];
    if (!day) return;
    if (a === 'yes') { const x = day.sh.find((s) => s.id === id); if (x) delete x.pl; haptic(12); toast('Зміну зараховано у факт'); }
    else { day.sh = day.sh.filter((s) => s.id !== id); if (!day.sh.length) delete S.days[k]; haptic(8); toast('Прибрано з графіка'); }
    save(); refresh();
    if (a === 'yes') setTimeout(() => openDay(k, { feel: true }), 250);
  }
}
