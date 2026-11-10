// «Гроші»: month income by job, balance and daily budget, upcoming payouts & bills, savings and goals.
// Behind «Більше»: one-off gigs, base expenses, spending history, "what if" simulator, the year report.
import * as C from './calc.js';
import { save } from './store.js';
import { ic, sheet, ask, toast, seg, segInd, chips, countUp, haptic } from './ui.js';
import { jobColor } from './today.js';
import { g } from './care.js';

const refresh = () => window.dispatchEvent(new Event('bud:refresh'));
const S = () => C.getState();
let MY = C.TD.getFullYear(), MM = C.TD.getMonth();

export function renderMoney(el) {
  const s = S(), cur = C.mSum(MY, MM), pd = new Date(MY, MM - 1, 1), prev = C.mSum(pd.getFullYear(), pd.getMonth());
  const isCur = MY === C.TD.getFullYear() && MM === C.TD.getMonth();
  const diff = prev.n ? Math.round((cur.n - prev.n) / prev.n * 100) : null;
  const jobs = Object.entries(cur.byJ).filter(([, q]) => q.n || q.pn).map(([id, q]) => ({ j: s.jobs.find((x) => x.id === id), id, ...q })).sort((a, b) => b.n + b.pn - a.n - a.pn);
  const maxJ = Math.max(1, ...jobs.map((q) => q.n + q.pn));
  const bal = C.balNow(), bud = C.dayBudget(), risk = C.cashRisk();
  const flow = s.bal.d ? C.cashflow() : null;
  const events = C.payEvents(C.TD, 30).slice(0, 7);
  let run = bal ?? 0;
  const [py, pm] = C.prevM(), adv = C.saveAdvice(py, pm), svd = s.sv[C.mk(py, pm)];
  const goals = s.goals.filter((x) => C.goalT(x) > 0);

  el.innerHTML = `
    <header class="page-h"><div><h1 class="h1">Гроші</h1><span class="muted">${C.MN[MM]} ${MY}</span></div>
      <div class="row-g"><button class="ib" data-a="pm" aria-label="Попередній місяць">${ic('left')}</button><button class="ib" data-a="nm" aria-label="Наступний місяць" ${isCur ? 'disabled' : ''}>${ic('right')}</button></div></header>

    <section class="card violet-card">
      <span class="lbl-l">${isCur ? 'Зароблено цього місяця' : 'Зароблено за місяць'}</span>
      <b class="num-xxl" data-count="${Math.round(cur.n)}">${C.kc(cur.n)}</b>
      <p class="small">${cur.pn ? `з планом — ${C.kc(cur.n + cur.pn)} · ` : ''}${diff !== null ? `${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)} % проти ${C.MG[pd.getMonth()]}` : ''}</p>
      <div class="jobs">${jobs.map((q) => `<div class="jb"><span class="jb-l"><i style="background:var(--${jobColor(q.j)})"></i>${C.esc(q.j ? q.j.n || 'Робота' : 'Підробітки')}</span><b>${C.kc(q.n)}</b>
        <span class="jb-t"><i style="width:${q.n / maxJ * 100}%;background:var(--${jobColor(q.j)})"></i><i class="pl" style="width:${(q.n + q.pn) / maxJ * 100}%"></i></span></div>`).join('') || '<p class="small">Ще нічого. Додай зміни в «Графіку».</p>'}</div>
    </section>

    ${isCur ? `<section class="card bal" data-a="bal" role="button" tabindex="0">
      <div class="row-sb"><span class="lbl-l">На рахунку</span>${ic('edit')}</div>
      ${bal !== null ? `<b class="num-xl">${C.kc(bal)}</b>
        ${bud ? `<div class="bud"><span>Можна витрачати сьогодні</span><b>${C.kc(Math.max(0, bud.left))}</b><small>${bud.spent ? `уже витрачено ${C.kc(bud.spent)} · ` : ''}${bud.until ? `до ${C.dLong(bud.until)}` : ''}</small></div>` : ''}`
      : '<b class="num-xl sm">Вкажи, скільки зараз на рахунку</b><p class="small muted">Bud порахує, скільки можна витрачати щодня до наступної виплати, щоб вистачило на рахунки.</p>'}
    </section>
    ${risk ? `<section class="note ${risk.lvl === 'hi' ? 'warn' : ''}">${ic('warn')}<span><b>${risk.t}</b> ${risk.s}</span></section>` : ''}
    <div class="row-g"><button class="btn lime grow" data-a="spend">${ic('bag')}Витрата</button><button class="btn soft grow" data-a="gig">${ic('gift')}Підробіток</button></div>

    <section class="card"><h2 class="h3">Найближчі 30 днів</h2>
      ${events.length ? events.map((e) => { if (s.bal.d) run += e.t === 'in' ? e.a : -e.a; return `<div class="row">
        <span class="ev-ic ${e.t}">${ic(e.t === 'in' ? 'coin' : 'wallet')}</span><span class="grow"><b>${C.esc(e.n)}</b><span>${C.dLong(e.d)}${e.t === 'in' && !e.real ? ' · оцінка' : ''}</span></span>
        <span class="amt ${e.t}">${e.t === 'in' ? '+' : '−'}${C.kc(e.a)}${s.bal.d ? `<small>лишиться ${C.kc(run)}</small>` : ''}</span></div>`; }).join('')
      : '<p class="small muted">Тут будуть виплати й регулярні платежі. Вкажи день виплати в налаштуваннях роботи, а рахунки — у «Базових витратах».</p>'}
    </section>` : ''}

    <section class="card">
      <div class="row-sb"><h2 class="h3">Відкласти</h2>${adv ? `<span class="lvl l${adv.li}">${C.LV[adv.li][1]}</span>` : ''}</div>
      ${adv ? `<p class="small">${adv.free >= 0 ? `Після базових витрат у ${C.ML[pm]} лишилось ${C.kc(adv.free)}.` : 'Минулого місяця дохід не покрив базових витрат.'}</p>
        ${adv.save > 0 ? `<b class="num-xl">${C.kc(adv.save)}</b><p class="small muted">${Math.round(adv.sh * 100)} % вільних грошей — решта ${C.kc(adv.life)} на життя</p>
        <button class="btn ${svd ? 'soft' : 'violet'} wide" data-a="saved">${svd ? `${ic('check')}Відкладено ${C.kc(svd.a)} · скасувати` : g('Я відклав', 'Я відклала', 'Відкласти') + ' ' + C.kc(adv.save)}</button>` : ''}`
      : `<p class="small muted">${C.baseSum() ? 'Підсумок зʼявиться, коли буде дохід за минулий місяць.' : 'Додай базові витрати (житло, їжа, транспорт) — і Bud підкаже, скільки можна відкладати без болю.'}</p>`}
      ${goals.map((x) => { const t = C.goalT(x), v = C.num(x.s); return `<div class="goal"><span class="row-sb"><b>${C.esc(x.n)}</b><span class="small">${C.kc(v)} з ${C.kc(t)}</span></span><span class="gbar"><i style="width:${Math.min(100, v / t * 100)}%"></i></span></div>`; }).join('')}
      <button class="link" data-a="goals">Цілі накопичень ${ic('right')}</button>
    </section>

    <section class="list-card"><h2 class="h3">Більше</h2>
      <button class="row" data-a="gigs">${ic('gift')}<span class="grow"><b>Разові підробітки</b><span>${s.gigs.length ? `${s.gigs.length} записів` : 'зйомка, переклад, допомога з переїздом'}</span></span>${ic('right')}</button>
      <button class="row" data-a="base">${ic('wallet')}<span class="grow"><b>Базові витрати</b><span>${C.baseSum() ? `${C.kc(C.baseSum())} на місяць` : 'житло, їжа, транспорт, звʼязок'}</span></span>${ic('right')}</button>
      <button class="row" data-a="hist">${ic('doc')}<span class="grow"><b>Історія грошей</b><span>витрати, виплати й платежі</span></span>${ic('right')}</button>
      <button class="row" data-a="sim">${ic('magic')}<span class="grow"><b>А що, якщо?</b><span>скільки дадуть ще кілька змін і чого коштуватимуть</span></span>${ic('right')}</button>
      <button class="row" data-a="year">${ic('chart')}<span class="grow"><b>Річний підсумок</b><span>доходи по місяцях і роботодавцях, експорт</span></span>${ic('right')}</button>
      <button class="row" data-a="cur">${ic('globe')}<span class="grow"><b>Валюти</b><span>основна — ${s.cur}</span></span>${ic('right')}</button>
    </section>`;
  el.querySelectorAll('[data-count]').forEach((n) => countUp(n, +n.dataset.count, (v) => C.kc(v)));
  if (!el._b) {
    el._b = true;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'pm' || a === 'nm') { const t = new Date(MY, MM + (a === 'nm' ? 1 : -1), 1); if (t > C.TD) return; MY = t.getFullYear(); MM = t.getMonth(); haptic(); renderMoney(el); }
      if (a === 'bal') openBalance();
      if (a === 'spend') openSpend();
      if (a === 'gig') openGig();
      if (a === 'gigs') openGigs();
      if (a === 'base') openBase();
      if (a === 'hist') openHistory();
      if (a === 'sim') openSim();
      if (a === 'year') openYear();
      if (a === 'goals') openGoals();
      if (a === 'cur') openCurrency();
      if (a === 'saved') {
        const s2 = S(), [y, m] = C.prevM(), k = C.mk(y, m), d = s2.sv[k];
        if (d) { const gl = s2.goals.find((x) => x.id === d.g); if (gl) gl.s = Math.max(0, C.num(gl.s) - d.a); delete s2.sv[k]; }
        else { const ad = C.saveAdvice(y, m), gl = s2.goals.find((x) => C.goalT(x) > C.num(x.s)) || s2.goals[0]; if (gl && ad) { gl.s = C.num(gl.s) + ad.save; s2.sv[k] = { a: ad.save, g: gl.id }; toast(`+${C.kc(ad.save)} до «${gl.n}»`); } }
        save(); refresh();
      }
    });
  }
}

/* ---------- balance & spending ---------- */
export function openBalance() {
  const s = S(), now = C.balNow();
  sheet({
    title: 'Скільки на рахунку',
    html: `<p class="small muted">Впиши залишок, який бачиш у банку зараз. Далі Bud сам додаватиме виплати й віднімати платежі та витрати.</p>
      <div class="money-in"><input class="inp big" id="bA" inputmode="decimal" placeholder="0" value="${now !== null ? Math.round(now) : ''}"><span>${C.sym()}</span></div>
      ${s.bal.d ? `<p class="small muted">Останнє оновлення: ${C.dLong(C.pk(s.bal.d))}</p>` : ''}`,
    foot: `<div class="row-g">${s.bal.d ? '<button class="btn ghost" data-a="off">Не вести баланс</button>' : ''}<button class="btn violet grow" data-a="ok">Зберегти</button></div>`,
    onMount(x) {
      setTimeout(() => x.body.querySelector('#bA').focus(), 350);
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-a]'); if (!b) return;
        if (b.dataset.a === 'off') { s.bal = { a: 0, d: '' }; save(); x.close(); refresh(); return; }
        if (b.dataset.a === 'ok') { const v = x.body.querySelector('#bA').value.trim(); if (v === '') return; s.bal = { a: C.num(v), d: C.TK, ts: Date.now() }; save(); x.close(); refresh(); toast('Баланс оновлено'); }
      });
    }
  });
}

export function openSpend() {
  const s = S(); let cat = '';
  const html = `<div class="money-in"><input class="inp big" id="sA" inputmode="decimal" placeholder="0"><span>${C.sym()}</span></div>
    <input class="inp" id="sN" placeholder="На що: продукти, кава, квиток" maxlength="40">
    <div class="field"><span class="lbl">Категорія</span><div class="chips hscroll">${C.CATS.map((c) => `<button type="button" class="chip" data-c="${c[0]}" aria-pressed="false">${c[1]} ${c[2]}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Коли</span>${chips('when', [['t', 'Сьогодні'], ['y', 'Вчора']], 't')}</div>`;
  sheet({
    title: 'Нова витрата', html,
    foot: '<button class="btn violet wide" data-a="ok">Додати</button>',
    onMount(x) {
      let when = 't';
      setTimeout(() => x.body.querySelector('#sA').focus(), 350);
      x.body.addEventListener('input', (e) => { if (e.target.id === 'sN' && !cat) { const c = C.catOf({ n: e.target.value }); x.body.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.c === c && e.target.value.length > 2)); } });
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.c) { cat = b.dataset.c; x.body.querySelectorAll('[data-c]').forEach((q) => q.setAttribute('aria-pressed', q === b)); return; }
        if (b.closest('[data-chips="when"]')) { when = b.dataset.v; x.body.querySelectorAll('[data-chips="when"] .chip').forEach((q) => q.setAttribute('aria-pressed', q === b)); return; }
        if (b.dataset.a === 'ok') {
          const a = C.num(x.body.querySelector('#sA').value); if (!a) { x.body.querySelector('#sA').focus(); return; }
          const n = x.body.querySelector('#sN').value.trim();
          const k = when === 'y' ? C.ds(C.addD(C.TD, -1)) : C.TK;
          s.sp.push({ id: C.uid(), a, cur: s.cur, k, ts: Date.now(), n, cat: cat || C.catOf({ n }) });
          if (s.sp.length > 2000) s.sp = s.sp.slice(-2000);
          save(); haptic(12); x.close(); refresh();
          const bud = C.dayBudget();
          toast(bud ? `Записано. Сьогодні ще можна ${C.kc(Math.max(0, bud.left))}` : 'Витрату записано');
        }
      });
    }
  });
}

/* ---------- gigs ---------- */
export function openGig(gig) {
  const s = S(), ex = !!gig;
  const q = gig ? { ...gig } : { id: C.uid(), n: '', a: '', d: C.TK, pd: '', cur: s.cur, tx: 'net', p: 85 };
  const body = () => `<input class="inp" id="gN" placeholder="Що це було: зйомка, переклад" value="${C.esc(q.n)}" maxlength="40">
    <div class="money-in"><input class="inp big" id="gA" inputmode="decimal" placeholder="0" value="${q.a}"><span>${C.sym(q.cur)}</span></div>
    ${seg('tx', [['net', 'Це на руки'], ['gross', 'До податків']], q.tx)}
    ${q.tx === 'gross' ? `<label><span class="lbl">На руки, %</span><input class="inp" id="gP" inputmode="decimal" value="${q.p}"></label>` : ''}
    <div class="two"><label><span class="lbl">Коли робота</span><input class="inp" type="date" id="gD" value="${q.d}"></label><label><span class="lbl">Коли оплата</span><input class="inp" type="date" id="gPD" value="${q.pd || q.d}"></label></div>
    ${C.CUR.length > 1 ? `<div class="field"><span class="lbl">Валюта</span>${chips('gc', C.CUR.map((c) => [c[0], c[0]]), q.cur)}</div>` : ''}`;
  sheet({
    title: ex ? 'Підробіток' : 'Разовий підробіток', html: body(),
    foot: `<div class="row-g">${ex ? '<button class="btn ghost" data-a="del">Видалити</button>' : ''}<button class="btn violet grow" data-a="ok">${ex ? 'Зберегти' : 'Додати'}</button></div>`,
    onMount(x) {
      requestAnimationFrame(() => segInd(x.body));
      const read = () => { const v = (id) => x.body.querySelector('#' + id); q.n = v('gN').value.trim(); q.a = v('gA').value; q.d = v('gD').value || C.TK; q.pd = v('gPD').value; if (v('gP')) q.p = C.num(v('gP').value) || 85; };
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.closest('[data-seg="tx"]')) { read(); q.tx = b.dataset.v; x.set(body()); segInd(x.body); return; }
        if (b.closest('[data-chips="gc"]')) { read(); q.cur = b.dataset.v; x.set(body()); segInd(x.body); return; }
        if (b.dataset.a === 'del') { s.gigs = s.gigs.filter((z) => z.id !== q.id); save(); x.close(); refresh(); return; }
        if (b.dataset.a === 'ok') {
          read(); if (!C.num(q.a)) { x.body.querySelector('#gA').focus(); return; }
          q.a = C.num(q.a); if (q.pd === q.d) q.pd = ''; q.ts = Date.now();
          const i = s.gigs.findIndex((z) => z.id === q.id); if (i >= 0) s.gigs[i] = q; else s.gigs.push(q);
          save(); x.close(); refresh(); toast(ex ? 'Збережено' : `+${C.kc(C.gigNet(q), q.cur)} підробіток`);
        }
      });
    }
  });
}
function openGigs() {
  const s = S();
  const list = [...s.gigs].sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  sheet({
    title: 'Разові підробітки', tall: true,
    html: `${list.length ? list.map((q) => `<button class="row" data-id="${q.id}"><span class="grow"><b>${C.esc(q.n || 'Підробіток')}</b><span>${q.d ? C.dLong(C.pk(q.d)) : ''}</span></span><span class="amt in">+${C.kc(C.gigNet(q), q.cur)}</span></button>`).join('') : '<div class="empty soft"><b>Поки порожньо</b><span>Сюди йдуть разові оплати поза графіком.</span></div>'}`,
    foot: '<button class="btn violet wide" data-a="new">Додати підробіток</button>',
    onMount(x) { x.el.addEventListener('click', (e) => { const b = e.target.closest('[data-id],[data-a]'); if (!b) return; x.close(); setTimeout(() => openGig(b.dataset.id ? s.gigs.find((q) => q.id === b.dataset.id) : null), 200); }); }
  });
}

/* ---------- base expenses ---------- */
function openBase() {
  const s = S();
  const body = () => `<p class="small muted">Обовʼязкові щомісячні витрати. День списання потрібен, щоб Bud бачив, коли вони підуть з рахунку.</p>
    ${s.base.map((b) => `<div class="base-r" data-id="${b.id}"><span class="cat">${C.catI(C.catOf(b))[1]}</span><input class="inp" data-f="n" value="${C.esc(b.n || '')}" placeholder="Назва"><input class="inp num" data-f="a" inputmode="decimal" value="${C.num(b.a) || ''}" placeholder="Сума"><input class="inp day" data-f="d" inputmode="numeric" value="${C.num(b.d) || ''}" placeholder="День"><button class="ib sm" data-del="${b.id}" aria-label="Видалити">${ic('trash')}</button></div>`).join('')}
    <button class="btn soft wide" data-a="add">${ic('plus')}Додати витрату</button>
    <p class="small">Разом: <b>${C.kc(C.baseSum())}</b> на місяць</p>`;
  sheet({
    title: 'Базові витрати', html: body(), tall: true,
    onMount(x) {
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'add') { s.base.push({ id: C.uid(), n: '', a: '', d: '' }); save(); x.set(body()); x.body.querySelector('.base-r:last-of-type [data-f="n"]').focus(); }
        if (b.dataset.del) { s.base = s.base.filter((q) => q.id !== b.dataset.del); save(); x.set(body()); refresh(); }
      });
      x.body.addEventListener('change', (e) => {
        const r = e.target.closest('[data-id]'); if (!r) return; const it = s.base.find((q) => q.id === r.dataset.id); const f = e.target.dataset.f;
        it[f] = f === 'n' ? e.target.value.trim() : C.num(e.target.value);
        if (f === 'd') it.d = Math.min(31, Math.max(0, Math.round(it.d)));
        if (f === 'n' && !it.cat) it.cat = C.catOf({ n: it.n });
        save(); x.set(body()); refresh();
      });
    }
  });
}

/* ---------- goals ---------- */
function openGoals() {
  const s = S();
  const body = () => `${s.goals.map((x) => `<div class="card tint" data-id="${x.id}"><input class="inp" data-f="n" value="${C.esc(x.n)}" placeholder="Назва цілі">
      <div class="two"><label><span class="lbl">Потрібно</span><input class="inp" data-f="t" inputmode="decimal" value="${C.num(x.t) || ''}" placeholder="${x.id === 'cush' && C.baseSum() ? Math.round(C.baseSum() * 3) + ' (3 міс. витрат)' : ''}"></label><label><span class="lbl">Уже є</span><input class="inp" data-f="s" inputmode="decimal" value="${C.num(x.s) || ''}"></label></div>
      ${x.id !== 'cush' ? `<button class="link danger" data-del="${x.id}">Видалити ціль</button>` : ''}</div>`).join('')}
    <button class="btn soft wide" data-a="add">${ic('plus')}Нова ціль</button>`;
  sheet({
    title: 'Цілі накопичень', html: body(), tall: true,
    onMount(x) {
      x.el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'add') { s.goals.push({ id: C.uid(), n: 'Нова ціль', t: 0, s: 0 }); save(); x.set(body()); } if (b.dataset.del) { s.goals = s.goals.filter((q) => q.id !== b.dataset.del); save(); x.set(body()); refresh(); } });
      x.body.addEventListener('change', (e) => { const r = e.target.closest('[data-id]'); if (!r) return; const it = s.goals.find((q) => q.id === r.dataset.id), f = e.target.dataset.f; it[f] = f === 'n' ? e.target.value.trim() : C.num(e.target.value); save(); refresh(); });
    }
  });
}

/* ---------- history ---------- */
function openHistory() {
  const s = S(), a = C.addD(C.TD, -60), L = C.ledger(a, C.TD);
  sheet({
    title: 'Історія грошей', tall: true,
    html: L.length ? L.map((e) => `<div class="row" ${e.t === 'sp' ? `data-sp="${e.id}"` : ''}><span class="ev-ic ${e.t === 'in' ? 'in' : 'out'}">${e.t === 'sp' ? C.catI(e.cat)[1] : ic(e.t === 'in' ? 'coin' : 'wallet')}</span>
      <span class="grow"><b>${C.esc(e.n)}</b><span>${C.dLong(e.d)}${e.t === 'out' ? ' · рахунок' : ''}</span></span><span class="amt ${e.t === 'in' ? 'in' : 'out'}">${e.t === 'in' ? '+' : '−'}${C.kc(e.a)}</span>
      ${e.t === 'sp' ? `<button class="ib sm" data-del="${e.id}" aria-label="Видалити">${ic('trash')}</button>` : ''}</div>`).join('') : '<div class="empty soft"><b>Порожньо</b><span>За останні 60 днів ще нічого не записано.</span></div>',
    onMount(x) {
      x.body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-del]'); if (!b) return;
        const it = s.sp.find((q) => q.id === b.dataset.del); s.sp = s.sp.filter((q) => q.id !== b.dataset.del); save(); refresh();
        b.closest('.row').remove(); toast('Видалено', { action: 'Повернути', onAction: () => { S().sp.push(it); save(); refresh(); } });
      });
    }
  });
}

/* ---------- what if ---------- */
function openSim() {
  const s = S(), B = C.simBase();
  const st = { add: 2, h: Math.round(B.hps) || 8, j: C.bestJob() };
  const body = () => {
    const j = C.job(st.j), r = C.R(st.j, C.TD.getFullYear(), C.TD.getMonth());
    const perShift = C.toM(st.h * r.rate * r.mult, j.cur);
    const monthAdd = perShift * st.add * 4.33;
    const nowWeek = B.spw * B.hps, newWeek = nowWeek + st.add * st.h;
    const nr = C.norm(), offNow = Math.max(0, 7 - Math.round(B.wdpw)), offNew = Math.max(0, offNow - st.add);
    const verdict = newWeek > nr * 1.25 || offNew < 1 ? ['warn', 'Забагато: майже без вихідних. Гроші будуть, а сил — ні.'] : newWeek > nr * 1.05 ? ['', 'Відчутно більше роботи. Подбай про сон і хоча б один повний вихідний.'] : ['ok', 'У межах твоєї норми — виглядає здорово.'];
    return `<p class="small muted">Зараз у середньому ${C.nf(B.spw)} ${C.pl(B.spw, C.W_SH)} на тиждень по ${C.nf(B.hps)} год.</p>
      <div class="field"><span class="lbl">Ще змін на тиждень</span>${chips('add', [[1, '+1'], [2, '+2'], [3, '+3'], [4, '+4']], st.add)}</div>
      <div class="field"><span class="lbl">Тривалість зміни</span>${chips('h', [[4, '4 год'], [6, '6 год'], [8, '8 год'], [10, '10 год'], [12, '12 год']], st.h)}</div>
      ${s.jobs.length > 1 ? `<div class="field"><span class="lbl">На якій роботі</span>${chips('sj', s.jobs.map((q) => [q.id, C.esc(q.n || 'Робота')]), st.j)}</div>` : ''}
      <div class="sim">
        <div class="tile lime"><span class="t-lab">Дадуть за місяць</span><b class="t-big">+${C.kc(monthAdd)}</b><span class="t-sub">≈ ${C.kc(perShift)} за зміну</span></div>
        <div class="tile pink"><span class="t-lab">Коштуватимуть</span><b class="t-big">${C.nf(newWeek)} год</b><span class="t-sub">на тиждень · вихідних ${offNew}</span></div>
      </div>
      <p class="note ${verdict[0]}">${ic(verdict[0] === 'ok' ? 'heart' : 'warn')}${verdict[1]}</p>`;
  };
  sheet({
    title: 'А що, якщо?', html: body(), tall: true,
    onMount(x) { x.el.addEventListener('click', (e) => { const b = e.target.closest('[data-chips] button'); if (!b) return; const n = b.closest('[data-chips]').dataset.chips; if (n === 'add') st.add = +b.dataset.v; if (n === 'h') st.h = +b.dataset.v; if (n === 'sj') st.j = b.dataset.v; haptic(); x.set(body()); }); }
  });
}

/* ---------- year ---------- */
function openYear() {
  let y = C.TD.getFullYear();
  const body = () => {
    const D = C.yearData(y), max = Math.max(1, ...D.MT);
    return `<div class="day-h"><button class="ib sm" data-y="-1" aria-label="Попередній рік">${ic('left')}</button><h3 class="h2">${y}</h3><button class="ib sm" data-y="1" aria-label="Наступний рік" ${y >= C.TD.getFullYear() ? 'disabled' : ''}>${ic('right')}</button></div>
      <div class="sum3"><div><span>Чистими</span><b>${C.kc(D.tot)}</b></div><div><span>Години</span><b>${C.nf(D.hrs, 0)}</b></div><div><span>Зміни</span><b>${D.sh}</b></div></div>
      <div class="ybars">${D.MT.map((v, m) => `<span><i style="height:${Math.max(3, v / max * 100)}%"></i><small>${C.MS[m]}</small></span>`).join('')}</div>
      ${D.J.filter((q) => q.t.n).map((q) => `<div class="row"><span class="dot" style="background:var(--${jobColor(q.j)})"></span><span class="grow"><b>${C.esc(q.j.n || 'Робота')}</b><span>${C.nf(q.t.h, 0)} год · брутто ${C.kc(q.t.g, q.j.cur)}</span></span><span class="amt in">${C.kc(q.t.n, q.j.cur)}</span></div>`).join('')}
      ${D.G.length ? `<div class="row"><span class="dot" style="background:var(--yellow)"></span><span class="grow"><b>Разові підробітки</b><span>${D.G.length} записів</span></span><span class="amt in">${C.kc(D.G.reduce((t, q) => t + C.toM(C.gigNet(q), q.cur), 0))}</span></div>` : ''}
      <div class="row-g"><button class="btn soft grow" data-a="html">${ic('doc')}Звіт для друку</button><button class="btn soft grow" data-a="csv">${ic('download')}Таблиця CSV</button></div>
      <p class="hint">${ic('info')}Звіт допоможе з податковим поданням чи перевіркою платіжок.</p>`;
  };
  sheet({
    title: 'Річний підсумок', html: body(), tall: true,
    onMount(x) {
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.y) { y += +b.dataset.y; x.set(body()); return; }
        if (b.dataset.a === 'html') download(`bud-${y}.html`, yearHTML(y), 'text/html');
        if (b.dataset.a === 'csv') download(`bud-${y}.csv`, yearCSV(y), 'text/csv');
      });
    }
  });
}
function yearHTML(y) {
  const s = S(), D = C.yearData(y);
  const rows = C.MN.map((n, m) => `<tr><td>${n}</td>${D.J.map((q) => `<td>${C.kc(q.M[m].n, q.j.cur)}<br><small>${C.nf(q.M[m].h)} год</small></td>`).join('')}<td><b>${C.kc(D.MT[m])}</b></td></tr>`).join('');
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bud — підсумок ${y}</title>
  <style>body{font:15px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#1A1230;max-width:900px;margin:24px auto;padding:0 16px}h1{font-size:26px}table{width:100%;border-collapse:collapse;font-size:14px}td,th{border-bottom:1px solid #ddd;padding:7px 6px;text-align:right}td:first-child,th:first-child{text-align:left}small{color:#666}</style></head><body>
  <h1>Bud — підсумок ${y}</h1><p>${C.esc(s.name || '')}</p><p>Разом чистими: <b>${C.kc(D.tot)}</b> · ${C.nf(D.hrs, 0)} год · ${D.sh} змін</p>
  <table><tr><th>Місяць</th>${D.J.map((q) => `<th>${C.esc(q.j.n || 'Робота')}</th>`).join('')}<th>Разом</th></tr>${rows}</table>
  <p><small>Розрахунок Bud за записаними змінами й ставками. Офіційні суми — у платіжках роботодавця.</small></p></body></html>`;
}
function yearCSV(y) {
  const D = C.yearData(y), q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Місяць', ...D.J.flatMap((x) => [`${x.j.n} брутто`, `${x.j.n} чистими`, `${x.j.n} годин`]), 'Разом чистими'];
  const rows = C.MN.map((n, m) => [n, ...D.J.flatMap((x) => [Math.round(x.M[m].g), Math.round(x.M[m].n), C.nf(x.M[m].h)]), Math.round(D.MT[m])]);
  return '﻿' + [head, ...rows].map((r) => r.map(q).join(';')).join('\n');
}
function download(name, text, type) {
  const blob = new Blob([text], { type: type + ';charset=utf-8' });
  const file = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- currencies ---------- */
function openCurrency() {
  const s = S();
  const body = () => `<div class="field"><span class="lbl">Основна валюта</span>${chips('mc', C.CUR.map((c) => [c[0], `${c[1]} ${c[0]}`]), s.cur)}</div>
    <p class="small muted">Для робіт в інших валютах Bud перераховує суми за курсом нижче. Курс — скільки одиниць валюти за 1 €.</p>
    ${C.CUR.filter((c) => c[0] !== 'EUR').map((c) => `<label class="fx"><span>${c[0]}</span><input class="inp" inputmode="decimal" data-fx="${c[0]}" value="${C.num(s.fx[c[0]]) || C.FX0[c[0]]}"></label>`).join('')}`;
  sheet({
    title: 'Валюти', html: body(),
    onMount(x) {
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-chips="mc"] button'); if (!b || b.dataset.v === s.cur) return;
        const ok = await ask(`Перевести всі суми в ${b.dataset.v}?`, [{ label: 'Так, перевести', value: 1, style: 'violet' }]);
        if (!ok) return; C.convertMain(b.dataset.v); s.curSet = true; save(); x.set(body()); refresh();
      });
      x.body.addEventListener('change', (e) => { const c = e.target.dataset.fx; if (!c) return; s.fx[c] = C.num(e.target.value) || C.FX0[c]; save(); refresh(); });
    }
  });
}
