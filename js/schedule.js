// «Графік»: month of shifts, the day sheet, sick/vacation periods, auto-plan, rates and shift templates.
import * as C from './calc.js';
import { save } from './store.js';
import { $, ic, sheet, ask, toast, menu, seg, segInd, chips, tgl, haptic } from './ui.js';
import { jobColor } from './today.js';
import { face } from './cast.js';
import { g } from './care.js';

const refresh = () => window.dispatchEvent(new Event('bud:refresh'));
let Y = C.TD.getFullYear(), M = C.TD.getMonth();
const S = () => C.getState();

/* ---------------- month ---------------- */
// faces are built once and reused in every cell
let FACE = null;
const faces = () => FACE || (FACE = {
  off: face({ shape: 'circle', color: 'lime', mood: 'chill' }), sick: face({ shape: 'triangle', color: 'coral', mood: 'sick' }), vac: face({ shape: 'blob', color: 'sky', mood: 'calm' }),
  f1: face({ shape: 'triangle', color: 'coral', mood: 'tense' }), f2: face({ shape: 'circle', color: 'lime', mood: 'calm' }), f3: face({ shape: 'bolt', color: 'sun', mood: 'up' })
});
export function renderPlan(el) {
  faces();
  const s = S(), first = new Date(Y, M, 1), off = (first.getDay() + 6) % 7, n = C.dim(Y, M);
  const sum = C.mSum(Y, M);
  const isCur = Y === C.TD.getFullYear() && M === C.TD.getMonth();
  let cells = '';
  for (let i = 0; i < off; i++) cells += '<span class="dc empty"></span>';
  for (let d = 1; d <= n; d++) {
    const k = C.ds(new Date(Y, M, d)), day = s.days[k], sh = C.shOf(k), ab = C.absOf(k);
    const cls = ['dc', k === C.TK ? 'today' : '', k > C.TK ? 'fut' : ''];
    let inner = '', style = '';
    if (ab) { cls.push(ab.t === 'sick' ? 'sick' : 'vac'); inner = ab.t === 'sick' ? FACE.sick : FACE.vac; }
    else if (sh.length) {
      const h = sh.reduce((t, x) => t + C.paidH(x), 0);
      const cols = [...new Set(sh.map((x) => jobColor(C.job(x.j))))];
      cls.push('work'); if (sh.some((x) => x.pl)) cls.push('pl');
      style = cols.length > 1 ? `style="background:linear-gradient(135deg,var(--${cols[0]}) 50%,var(--${cols[1]}) 50%)"` : `style="background:var(--${cols[0]})"`;
      inner = `<b>${C.nf(h)}</b>`;
      if (C.overlaps(k).length) cls.push('warn');
    } else if (C.isOff(k)) { cls.push('off'); inner = FACE.off; }
    if (day && day.f && sh.length) inner += `<span class="feelf">${FACE['f' + day.f]}</span>`;
    cells += `<button class="${cls.join(' ')}" ${style} data-k="${k}" aria-label="${d} ${C.MG[M]}"><span class="dn">${d}</span>${inner}</button>`;
  }
  const jobs = s.jobs.filter((j) => j.n);
  el.innerHTML = `
    <header class="page-h"><div><h1 class="h1">${C.MN[M]}</h1><span class="muted">${Y}${isCur ? '' : ' · <button class="link sm" data-a="now">до сьогодні</button>'}</span></div>
      <div class="row-g tight"><button class="ib" data-a="prev" aria-label="Попередній місяць">${ic('left')}</button><button class="ib" data-a="next" aria-label="Наступний місяць">${ic('right')}</button>
      <button class="ib ink" data-a="more" aria-label="Інструменти">${ic('more')}</button></div></header>
    <section class="card cal">
      <div class="dow">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="grid">${cells}</div>
      ${jobs.length > 1 ? `<div class="legend">${jobs.map((j) => `<span><i style="background:var(--${jobColor(j)})"></i>${C.esc(j.n)}</span>`).join('')}</div>` : ''}
    </section>
    <section class="card sum3">
      <div><span>Чистими</span><b>${C.kc(sum.n)}</b></div><div><span>Години</span><b>${C.nf(sum.h)}</b></div><div><span>Зміни</span><b>${sum.w}</b></div>
      ${sum.pn ? `<p class="small muted wide">з планом — ${C.kc(sum.n + sum.pn)} і ${C.nf(sum.h + sum.ph)} год</p>` : ''}
    </section>
    <button class="btn ink wide" data-a="auto">${ic('magic')}Скласти план змін</button>
    <p class="hint">${ic('info')}Натисни на день, щоб додати зміну, вихідний, лікарняний чи відпустку.</p>`;
  if (!el._b) {
    el._b = true;
    el.addEventListener('click', (e) => {
      const d = e.target.closest('[data-k]'); if (d) return openDay(d.dataset.k);
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'prev' || a === 'next') { const t = new Date(Y, M + (a === 'next' ? 1 : -1), 1); Y = t.getFullYear(); M = t.getMonth(); haptic(); renderPlan(el); }
      if (a === 'now') { Y = C.TD.getFullYear(); M = C.TD.getMonth(); renderPlan(el); }
      if (a === 'auto') openAutoplan();
      if (a === 'more') menu(b, [{ label: 'Скласти план змін', stk: 'magic', tone: 'lilac', value: 'auto' }, { label: `Ставки на ${C.MN[M].toLowerCase()}`, stk: 'coin', tone: 'lime', value: 'rates' }, { label: 'Шаблони змін', stk: 'clock', tone: 'sky', value: 'tpl' }, { label: 'Лікарняні й відпустки', stk: 'thermo', tone: 'coral', value: 'abs' }], (v) => {
        if (v === 'auto') openAutoplan(); if (v === 'rates') openRates(Y, M); if (v === 'tpl') openTemplates(); if (v === 'abs') import('./me.js').then((m) => m.openAbsence());
      });
    });
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.target.closest('.cal') ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (!x0) return; const dx = e.changedTouches[0].clientX - x0[0], dy = e.changedTouches[0].clientY - x0[1]; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { const t = new Date(Y, M + (dx < 0 ? 1 : -1), 1); Y = t.getFullYear(); M = t.getMonth(); haptic(); renderPlan(el); }
    });
  }
}

/* ---------------- day sheet ---------------- */
const dayMode = (k) => { const d = S().days[k]; if (!d) return ''; if (d.ab) return d.ab.t; if (d.o) return 'off'; if (d.sh && d.sh.length) return 'work'; return ''; };
const tplFor = (jid) => S().tpl.filter((t) => !t.j || t.j === jid);

function newShift(k, jid) {
  const s = S(), j = jid || C.bestJob();
  const t = tplFor(j)[0];
  const st = t ? t.s : (s.cfg.ls || startForPart(s.cfg.pref.part) || '08:00');
  const len = t ? C.shH(t) : Math.round(C.avgShift() * 2) / 2;
  const x = { id: C.uid(), j, s: st, e: t ? t.e : C.mt(C.tm(st) + len * 60) };
  C.autoZ(x, k);
  if (k > C.TK) x.pl = true;
  return x;
}
const startForPart = (p) => ({ morning: '06:00', day: '09:00', evening: '14:00' }[p]);

export function openDay(k, opts = {}) {
  let cur = k;
  const draw = () => {
    const s = S(), d = C.pk(cur), day = s.days[cur] || {}, mode = dayMode(cur), sh = C.shOf(cur), fut = cur > C.TK;
    const ov = C.overlaps(cur);
    let body = seg('mode', [['work', 'Зміна'], ['off', 'Вихідний'], ['sick', 'Хворію'], ['vac', 'Відпустка']], mode);
    if (mode === 'work') {
      body += sh.map((x) => shiftCard(cur, x)).join('');
      body += `<button class="btn soft wide" data-a="addsh">${ic('plus')}Ще одна зміна</button>`;
      if (ov.length) body += `<p class="note warn">${ic('warn')}Зміни перетинаються на ${C.hm(ov[0].min)}.</p>`;
      if (fut) body += `<p class="note">${ic('info')}Це план. У факт піде, коли день настане.</p>`;
      if (sh.some((x) => x.pl) && !fut) body += `<button class="btn ink wide" data-a="confirm">${ic('check')}${g('Я відпрацював', 'Я відпрацювала', 'Зміна відбулась')}</button>`;
      if (!fut) body += `<div class="field"><span class="lbl">Як ти після роботи?</span><div class="feelpick" data-chips="feel">${[[1, 'Важко'], [2, 'Нормально'], [3, 'Легко']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${day.f === v}">${faces()['f' + v]}${l}</button>`).join('')}</div></div>`;
    } else if (mode === 'off') {
      body += `<div class="empty soft">${face({ shape: 'circle', color: 'lime', mood: 'calm', hair: 'brow' })}<b>Вихідний</b><span>Відпочинок теж частина графіка. Bud не ставитиме сюди змін в автоплані.</span></div>`;
    } else if (mode === 'sick' || mode === 'vac') {
      body += absSummary(cur);
    } else {
      body += `<div class="empty soft">${face({ shape: 'circle', color: 'grape', mood: 'curious', hair: 'curl' })}<b>Порожній день</b><span>Обери вище, що в цей день: зміна, вихідний, лікарняний чи відпустка.</span></div>`;
    }
    return body;
  };
  const head = () => { const d = C.pk(cur); return `<div class="day-h"><button class="ib sm" data-a="pd" aria-label="Попередній день">${ic('left')}</button><h2 class="h2">${C.DS[d.getDay()]}, ${C.dLong(d)}</h2><button class="ib sm" data-a="nd" aria-label="Наступний день">${ic('right')}</button></div>`; };

  if (opts.addShift && !C.shOf(k).length && !C.absOf(k)) { const s = S(); s.days[k] = { sh: [newShift(k)] }; save(); }
  sheet({
    head: head(), html: draw(), tall: true,
    foot: `<div class="row-g"><button class="btn ghost" data-a="clear">Очистити</button><button class="btn ink grow" data-x2>Готово</button></div>`,
    onMount(x) {
      const rerender = () => { x.el.querySelector('.sh-head .day-h').outerHTML = head(); x.set(draw()); segInd(x.body); };
      requestAnimationFrame(() => segInd(x.body));
      x.el.querySelector('[data-x2]').onclick = () => x.close();
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const s = S(); let day = s.days[cur];
        if (b.closest('[data-seg="mode"]')) {
          const v = b.dataset.v, prev = dayMode(cur);
          if (v === prev) return;
          if ((v === 'sick' || v === 'vac')) { x.close(); setTimeout(() => openAbs(cur, v), 200); return; }
          if (prev === 'sick' || prev === 'vac') { const ok = await ask('Прибрати цей день з лікарняного чи відпустки?', [{ label: 'Прибрати', value: 1, style: 'violet' }]); if (!ok) return; delete s.days[cur]; }
          if (v === 'work') s.days[cur] = { ...(s.days[cur] || {}), sh: [newShift(cur)], o: undefined };
          if (v === 'off') s.days[cur] = { o: 1 };
          cleanDay(cur); save(); haptic(); rerender(); refresh(); return;
        }
        const a = b.dataset.a;
        if (a === 'pd' || a === 'nd') { cur = C.ds(C.addD(C.pk(cur), a === 'nd' ? 1 : -1)); haptic(); rerender(); return; }
        if (a === 'addsh') { day = s.days[cur] = s.days[cur] || {}; day.sh = day.sh || []; const last = day.sh[day.sh.length - 1]; const ns = newShift(cur, last && last.j); if (last && last.e) { ns.s = last.e; ns.e = C.mt(C.tm(last.e) + 4 * 60); } day.sh.push(ns); save(); rerender(); refresh(); return; }
        if (a === 'delsh') { day.sh = day.sh.filter((q) => q.id !== b.dataset.id); cleanDay(cur); save(); rerender(); refresh(); return; }
        if (a === 'confirm') { day.sh.forEach((q) => delete q.pl); save(); toast('Зміну зараховано у факт'); rerender(); refresh(); return; }
        if (a === 'clear') { if (!s.days[cur]) return; const snap = JSON.stringify(s.days[cur]), kk = cur; delete s.days[cur]; save(); rerender(); refresh(); toast('День очищено', { action: 'Повернути', onAction: () => { S().days[kk] = JSON.parse(snap); save(); refresh(); rerender(); } }); return; }
        if (a === 'abs') { x.close(); setTimeout(() => openAbs(cur), 200); return; }
        if (a === 'job') { const q = day.sh.find((z) => z.id === b.dataset.id); q.j = b.dataset.v; C.autoZ(q, cur); save(); rerender(); refresh(); return; }
        if (a === 'tpl') { const q = day.sh.find((z) => z.id === b.dataset.id), t = s.tpl.find((z) => z.id === b.dataset.v); if (t) { q.s = t.s; q.e = t.e; if (t.j) q.j = t.j; s.cfg.ls = t.s; } save(); rerender(); refresh(); return; }
        if (a === 'bonus') { const q = day.sh.find((z) => z.id === b.dataset.id); q.z = !q.z; save(); rerender(); refresh(); return; }
        const chip = b.closest('[data-chips="feel"]');
        if (chip) { day.f = day.f === +b.dataset.v ? undefined : +b.dataset.v; save(); haptic(); rerender(); refresh(); }
      });
      x.el.addEventListener('change', (e) => {
        const t = e.target, id = t.dataset.id; if (!id) return;
        const day = S().days[cur], q = day && day.sh.find((z) => z.id === id); if (!q) return;
        if (t.dataset.f === 's') { const len = C.shH(q); q.s = t.value; if (!q.e) q.e = C.mt(C.tm(t.value) + len * 60); S().cfg.ls = t.value; }
        if (t.dataset.f === 'e') q.e = t.value;
        save(); rerender(); refresh();
      });
      if (opts.feel) setTimeout(() => x.body.querySelector('[data-chips="feel"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  });
}
function cleanDay(k) { const d = S().days[k]; if (!d) return; if (d.sh && !d.sh.length) delete d.sh; if (!d.o) delete d.o; if (!d.sh && !d.o && !d.ab && !d.f) delete S().days[k]; }

function shiftCard(k, x) {
  const s = S(), j = C.job(x.j), d = C.pk(k), r = C.R(x.j, d.getFullYear(), d.getMonth());
  const net = C.toM(C.shN(x, d.getFullYear(), d.getMonth()), j.cur);
  const tpls = tplFor(x.j);
  return `<div class="shc c-${jobColor(j)}">
    ${s.jobs.length > 1 ? `<div class="chips hscroll">${s.jobs.map((q) => `<button type="button" class="chip" data-a="job" data-id="${x.id}" data-v="${q.id}" aria-pressed="${q.id === x.j}">${C.esc(q.n || 'Робота')}</button>`).join('')}</div>` : `<b class="shc-j">${C.esc(j.n || 'Зміна')}</b>`}
    <div class="two"><label><span class="lbl">Початок</span><input class="inp" type="time" step="300" value="${x.s || ''}" data-id="${x.id}" data-f="s"></label>
      <label><span class="lbl">Кінець</span><input class="inp" type="time" step="300" value="${x.e || ''}" data-id="${x.id}" data-f="e"></label></div>
    ${tpls.length ? `<div class="chips hscroll">${tpls.map((t) => `<button type="button" class="chip sm" data-a="tpl" data-id="${x.id}" data-v="${t.id}">${C.esc(t.n || t.s + '–' + t.e)}</button>`).join('')}</div>` : ''}
    <div class="shc-f"><span>${C.nf(C.paidH(x))} год${j.pt === 'h' ? ` · ≈${C.kc(net)}` : ''}${x.pl ? ' · план' : ''}</span>
      ${C.num(r.bonus) ? `<button class="mini-t" data-a="bonus" data-id="${x.id}">${tgl(x.z)}<span>Надбавка</span></button>` : ''}
      <button class="ib sm" data-a="delsh" data-id="${x.id}" aria-label="Прибрати зміну">${ic('trash')}</button></div>
  </div>`;
}

/* ---------------- sick leave & vacation ---------------- */
function absSummary(k) {
  const ab = C.absOf(k), G = C.absGroups()[ab.g] || [k], from = C.pk(G[0]), to = C.pk(G[G.length - 1]);
  const total = G.reduce((t, q) => t + C.toM(C.absVal(q, C.absOf(q)), C.job(ab.j).cur), 0);
  return `<div class="abs-c ${ab.t}"><span style="position:absolute;right:-14px;top:-12px;width:84px;transform:rotate(12deg)">${ab.t === 'sick' ? faces().sick : faces().vac}</span><b>${ab.t === 'sick' ? 'Лікарняний' : 'Відпустка'}</b>
    <span>${C.rng(from, to)} · ${G.length} ${C.pl(G.length, C.W_DAY)} · ${C.esc(C.job(ab.j).n || '')}</span>
    <span>Очікувана виплата ≈ <b>${C.kc(total)}</b></span>
    <button class="btn soft wide" data-a="abs">${ic('edit')}Змінити період</button></div>`;
}

export function openAbs(k, type) {
  const s = S(), ex = C.absOf(k);
  const st = ex ? { t: ex.t, j: ex.j, g: ex.g, from: (C.absGroups()[ex.g] || [k])[0], to: (C.absGroups()[ex.g] || [k]).slice(-1)[0], p: (s.abs[ex.g] || {}).p ?? '' }
    : { t: type || 'sick', j: (C.shOf(k)[0] || {}).j || C.bestJob(), g: C.uid(), from: k, to: k, p: '' };
  const est = () => {
    let tot = 0, n = 0;
    for (let d = C.pk(st.from); C.ds(d) <= st.to; d = C.addD(d, 1)) { n++; }
    // estimate with the same rules as for real days
    const keep = {}; const days = [];
    for (let d = C.pk(st.from); C.ds(d) <= st.to; d = C.addD(d, 1)) { const q = C.ds(d); keep[q] = s.days[q]; days.push(q); }
    const metaKeep = s.abs[st.g];
    days.forEach((q) => { s.days[q] = { ab: { t: st.t, j: st.j, g: '_est' } }; });
    s.abs._est = { p: st.p };
    C.ABC.u = -1; // drop the cached grouping
    days.forEach((q) => { tot += C.toM(C.absVal(q, s.days[q].ab), C.job(st.j).cur); });
    days.forEach((q) => { if (keep[q] === undefined) delete s.days[q]; else s.days[q] = keep[q]; });
    delete s.abs._est; if (metaKeep) s.abs[st.g] = metaKeep;
    C.ABC.u = -1;
    return { tot, n };
  };
  const law = () => C.lawOf(C.job(st.j));
  const body = () => {
    const e = est(), L = law();
    return `${seg('t', [['sick', 'Лікарняний'], ['vac', 'Відпустка']], st.t)}
      <div class="two"><label><span class="lbl">З</span><input class="inp" type="date" id="aFrom" value="${st.from}"></label><label><span class="lbl">По</span><input class="inp" type="date" id="aTo" value="${st.to}"></label></div>
      ${s.jobs.length > 1 ? `<div class="field"><span class="lbl">Робота</span>${chips('aj', s.jobs.map((j) => [j.id, C.esc(j.n || 'Робота')]), st.j)}</div>` : ''}
      <div class="card tint"><span class="lbl">Очікувана виплата за ${e.n} ${C.pl(e.n, C.W_DAY)}</span><b class="num-xl">≈ ${C.kc(e.tot)}</b>
        <p class="small muted">${st.t === 'sick' ? L.sk : L.vc}</p></div>
      <details class="more"><summary>Якщо роботодавець платить інакше</summary>
        <label><span class="lbl">Відсоток оплати</span><input class="inp" id="aP" inputmode="decimal" placeholder="за законом" value="${st.p}"></label></details>`;
  };
  sheet({
    title: ex ? 'Період відсутності' : (st.t === 'sick' ? 'Лікарняний' : 'Відпустка'), html: body(),
    foot: `<div class="row-g">${ex ? '<button class="btn ghost" data-a="del">Видалити</button>' : ''}<button class="btn ink grow" data-a="save">Зберегти</button></div>`,
    onMount(x) {
      requestAnimationFrame(() => segInd(x.body));
      const read = () => { st.from = x.body.querySelector('#aFrom').value || st.from; st.to = x.body.querySelector('#aTo').value || st.to; if (st.to < st.from) st.to = st.from; const p = x.body.querySelector('#aP'); if (p) st.p = p.value.trim(); };
      x.body.addEventListener('change', () => { read(); x.set(body()); segInd(x.body); });
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.closest('[data-seg="t"]')) { read(); st.t = b.dataset.v; x.set(body()); segInd(x.body); return; }
        if (b.closest('[data-chips="aj"]')) { read(); st.j = b.dataset.v; x.set(body()); return; }
        if (b.dataset.a === 'del') {
          const ok = await ask('Видалити весь період?', [{ label: 'Видалити', value: 1, style: 'danger' }]); if (!ok) return;
          (C.absGroups()[st.g] || []).forEach((q) => delete s.days[q]); delete s.abs[st.g]; C.ABC.u = -1; save(); x.close(); refresh(); return;
        }
        if (b.dataset.a === 'save') {
          read();
          const days = []; for (let d = C.pk(st.from); C.ds(d) <= st.to; d = C.addD(d, 1)) days.push(C.ds(d));
          const busy = days.filter((q) => C.shOf(q).length && !(C.absOf(q) && C.absOf(q).g === st.g));
          if (busy.length) { const ok = await ask(`У ${busy.length} ${C.pl(busy.length, C.W_DAY)} цього періоду є зміни. Замінити їх?`, [{ label: 'Замінити', value: 1, style: 'violet' }]); if (!ok) return; }
          (C.absGroups()[st.g] || []).forEach((q) => { if (!days.includes(q)) delete s.days[q]; });
          days.forEach((q) => { s.days[q] = { ab: { t: st.t, j: st.j, g: st.g } }; });
          s.abs[st.g] = { ...(s.abs[st.g] || {}), p: st.p };
          C.ABC.u = -1; save(); x.close(); refresh();
          toast(st.t === 'sick' ? 'Лікарняний записано. Одужуй' : 'Відпустку записано');
        }
      });
    }
  });
}

/* ---------------- auto-plan ---------------- */
const PARTS = [['morning', 'Зранку'], ['day', 'Удень'], ['evening', 'Увечері'], ['any', 'Будь-коли']];
function periodRange(p) {
  const T = C.TD, y = T.getFullYear(), m = T.getMonth();
  if (p === 'w') { const a = C.addD(C.monday(T), 7); return [a, C.addD(a, 6), 'наступний тиждень']; }
  if (p === 'n') return [new Date(y, m + 1, 1), new Date(y, m + 2, 0), C.MN[(m + 1) % 12].toLowerCase()];
  return [C.addD(T, 1), new Date(y, m, C.dim(y, m)), 'решту місяця'];
}

/** places shifts on free days, spread evenly, keeping preferred days off, max run and rest between shifts */
function buildPlan(o) {
  const s = S(), [a, b] = periodRange(o.p), pref = s.cfg.pref;
  const jid = o.j || C.bestJob();
  const O = C.optimum();
  const len = o.len || (O.ok && O.len ? (O.len[0] + O.len[1]) / 2 : Math.round(C.avgShift() * 2) / 2);
  const part = pref.part === 'any' ? null : pref.part;
  const tpl = tplFor(jid).find((t) => !part || partOf(t.s) === part);
  const start = tpl ? tpl.s : (part ? startForPart(part) : (s.cfg.ls || '08:00'));
  const end = tpl ? tpl.e : C.mt(C.tm(start) + len * 60);
  const proto = { j: jid, s: start, e: end };
  const perShift = C.toM(C.shN(proto, a.getFullYear(), a.getMonth()), C.job(jid).cur) || 1;
  // how many shifts are needed
  let need;
  if (o.p === 'w') need = Math.max(0, Math.round((C.norm() - weekPlanned(a)) / C.paidH(proto)));
  else {
    const ms = C.mSum(a.getFullYear(), a.getMonth());
    const tgt = o.t || C.target();
    need = tgt ? Math.max(0, Math.ceil((tgt - ms.n - ms.pn) / perShift)) : Math.round((C.norm() / 7) * (C.dd(a, b) + 1) / C.paidH(proto));
  }
  const maxRun = Math.max(1, pref.maxRun || 5);
  const offW = pref.offW || [];
  const free = [];
  for (let d = a; d <= b; d = C.addD(d, 1)) { const k = C.ds(d); if (!S().days[k] && !offW.includes(d.getDay())) free.push(d); }
  const picked = [];
  if (need > 0 && free.length) {
    const step = free.length / Math.min(need, free.length);
    const want = new Set(); for (let i = 0; i < Math.min(need, free.length); i++) want.add(Math.floor(i * step + step / 2));
    const isWork = (d) => C.isWd(C.ds(d)) || picked.some((p) => C.ds(p) === C.ds(d));
    const runAt = (d) => { let n = 1; for (let q = C.addD(d, -1); isWork(q); q = C.addD(q, -1)) n++; for (let q = C.addD(d, 1); isWork(q); q = C.addD(q, 1)) n++; return n; };
    const restOk = (d) => { const prev = C.shOf(C.ds(C.addD(d, -1))).filter((x) => x.e); if (!prev.length) return true; const endPrev = Math.max(...prev.map((x) => C.tm(x.s) + C.shH(x) * 60)) - 1440; return C.tm(start) - endPrev >= C.restMin(); };
    const tryPick = (i) => { const d = free[i]; if (picked.includes(d) || runAt(d) > maxRun || !restOk(d)) return false; picked.push(d); return true; };
    [...want].forEach((i) => { if (!tryPick(i)) { for (let r = 1; r < free.length; r++) { if (i + r < free.length && tryPick(i + r)) break; if (i - r >= 0 && tryPick(i - r)) break; } } });
  }
  picked.sort((x, y) => x - y);
  const L = picked.map((d) => { const k = C.ds(d); const x = { id: C.uid(), j: jid, s: start, e: end, pl: true }; C.autoZ(x, k); return [k, x]; });
  const net = L.reduce((t, [k, x]) => t + C.toM(C.shN(x, C.pk(k).getFullYear(), C.pk(k).getMonth()), C.job(jid).cur), 0);
  const hrs = L.reduce((t, [, x]) => t + C.paidH(x), 0);
  return { L, net, hrs, need, start, end, len: C.paidH(proto), freeN: free.length };
}
const partOf = (t) => { const m = C.tm(t); return m < 540 ? 'morning' : m < 780 ? 'day' : 'evening'; };
function weekPlanned(a) { let h = 0; for (let i = 0; i < 7; i++) C.shOf(C.ds(C.addD(a, i))).forEach((x) => { h += C.paidH(x); }); return h; }

export function openAutoplan(period) {
  const s = S();
  const o = { p: period === 'w' ? 'w' : 'm', j: '', t: 0 };
  if (o.p === 'm' && C.TD.getDate() > C.dim(C.TD.getFullYear(), C.TD.getMonth()) - 3) o.p = 'n';
  const body = () => {
    const pref = s.cfg.pref, R0 = buildPlan(o), [, , lab] = periodRange(o.p);
    return `${seg('p', [['w', 'Тиждень'], ['m', 'Цей місяць'], ['n', 'Наступний']], o.p)}
      <div class="field"><span class="lbl">Коли тобі комфортно працювати</span>${chips('part', PARTS, pref.part)}</div>
      <div class="field"><span class="lbl">Вихідні дні, які лишити вільними</span>${chips('offW', [[1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт'], [6, 'Сб'], [0, 'Нд']], pref.offW, true)}</div>
      <div class="field"><span class="lbl">Не більше днів роботи поспіль</span>${chips('run', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], pref.maxRun)}</div>
      ${s.jobs.length > 1 ? `<div class="field"><span class="lbl">Робота</span>${chips('pj', [['', 'Найвигідніша'], ...s.jobs.map((j) => [j.id, C.esc(j.n || 'Робота')])], o.j)}</div>` : ''}
      ${o.p !== 'w' ? `<div class="field"><span class="lbl">Скільки хочеш заробити за місяць</span><input class="inp" id="apT" inputmode="numeric" placeholder="${C.target() ? Math.round(C.target()) : 'напр. 25000'}" value="${o.t || ''}"></div>` : ''}
      <div class="card tint plan-prev">
        ${R0.L.length ? `<b class="num-xl">${R0.L.length} ${C.pl(R0.L.length, C.W_SH)}</b><p class="small">${R0.start}–${R0.end} · ${C.nf(R0.hrs)} год · ≈ ${C.kc(R0.net)} чистими</p>
          <div class="plan-days">${R0.L.map(([k]) => `<span>${C.DS[C.pk(k).getDay()]} ${C.pk(k).getDate()}</span>`).join('')}</div>`
        : `<b>${R0.need ? 'Немає вільних днів під ці умови' : 'План уже закриває мету'}</b><p class="small muted">${R0.need ? 'Спробуй зменшити кількість вихідних або дозволити більше днів поспіль.' : `На ${lab} змін достатньо.`}</p>`}
      </div>
      <p class="hint">${ic('info')}Bud не чіпає дні, які вже заповнені, і тримає ${C.restMin() / 60} год відпочинку між змінами.</p>`;
  };
  sheet({
    title: 'План змін', html: body(), tall: true,
    foot: '<button class="btn ink wide" data-a="apply">Додати в графік</button>',
    onMount(x) {
      requestAnimationFrame(() => segInd(x.body));
      const re = () => { x.set(body()); segInd(x.body); };
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const pref = s.cfg.pref;
        if (b.closest('[data-seg="p"]')) { o.p = b.dataset.v; haptic(); re(); return; }
        const ch = b.closest('[data-chips]');
        if (ch) {
          const n = ch.dataset.chips, v = b.dataset.v;
          if (n === 'part') pref.part = v;
          if (n === 'run') pref.maxRun = +v;
          if (n === 'offW') { const w = +v; pref.offW = pref.offW.includes(w) ? pref.offW.filter((q) => q !== w) : [...pref.offW, w]; }
          if (n === 'pj') o.j = v;
          save(); haptic(); re(); return;
        }
        if (b.dataset.a === 'apply') {
          const R0 = buildPlan(o);
          if (!R0.L.length) { toast('Нема що додати'); return; }
          R0.L.forEach(([k, q]) => { if (!S().days[k]) S().days[k] = { sh: [q] }; });
          save(); x.close(); refresh();
          const d = C.pk(R0.L[0][0]); Y = d.getFullYear(); M = d.getMonth(); refresh();
          toast(`Додано ${R0.L.length} ${C.pl(R0.L.length, C.W_SH)} як план`);
        }
      });
      x.body.addEventListener('change', (e) => { if (e.target.id === 'apT') { o.t = C.num(e.target.value); re(); } });
    }
  });
}

/* ---------------- rates ---------------- */
export function openRates(y, m) {
  const s = S();
  const body = () => s.jobs.map((j) => {
    const r = C.R(j.id, y, m);
    return `<div class="card tint"><b>${C.esc(j.n || 'Робота')}</b><span class="small muted">${C.esc((C.CT.find((c) => c[0] === j.ct) || [, 'Договір не вказано'])[1])}</span>
      ${j.pt === 'm' ? `<div class="two"><label><span class="lbl">На руки за місяць</span><input class="inp" inputmode="decimal" data-j="${j.id}" data-f="mon" value="${C.num(r.mon) || ''}"></label><label><span class="lbl">Брутто</span><input class="inp" inputmode="decimal" data-j="${j.id}" data-f="mg" value="${C.num(r.mg) || ''}"></label></div>`
        : `<div class="two"><label><span class="lbl">Ставка за годину, ${C.sym(j.cur)}</span><input class="inp" inputmode="decimal" data-j="${j.id}" data-f="rate" value="${C.num(r.rate) || ''}"></label>
          <label><span class="lbl">На руки, %</span><input class="inp" inputmode="decimal" data-j="${j.id}" data-f="mult" value="${Math.round((r.mult ?? 1) * 100)}"></label></div>
          <label><span class="lbl">Надбавка за зміну у вихідні дні, ${C.sym(j.cur)}</span><input class="inp" inputmode="decimal" data-j="${j.id}" data-f="bonus" value="${C.num(r.bonus) || ''}"></label>`}
    </div>`;
  }).join('') + `<p class="hint">${ic('info')}Зміни діють з ${C.MG[m]} ${y} і далі, доки не зміниш знову. Попередні місяці лишаться як були.</p>`;
  sheet({
    title: `Ставки з ${C.MG[m]}`, html: body(), tall: true,
    onMount(x) {
      x.body.addEventListener('change', (e) => {
        const t = e.target, j = t.dataset.j; if (!j) return;
        const key = C.mk(y, m), all = s.rates[j] = s.rates[j] || {};
        all[key] = { ...C.R(j, y, m), ...(all[key] || {}) };
        let v = C.num(t.value);
        if (t.dataset.f === 'mult') v = Math.min(100, v || 100) / 100;
        all[key][t.dataset.f] = v;
        save(); refresh(); toast('Збережено');
      });
    }
  });
}

/* ---------------- shift templates ---------------- */
export function openTemplates() {
  const s = S();
  const body = () => `${s.tpl.length ? s.tpl.map((t) => `<div class="row"><span class="grow"><b>${C.esc(t.n || 'Зміна')}</b><span>${t.s}–${t.e}${t.j && s.jobs.length > 1 ? ' · ' + C.esc(C.job(t.j).n) : ''}</span></span><button class="ib sm" data-del="${t.id}" aria-label="Видалити">${ic('trash')}</button></div>`).join('') : '<p class="muted small">Шаблонів ще немає. Додай типові зміни — тоді в дні вистачить одного дотику.</p>'}
    <div class="card tint"><span class="lbl">Новий шаблон</span>
      <input class="inp" id="tN" placeholder="Назва, напр. Ранкова" maxlength="20">
      <div class="two"><input class="inp" type="time" id="tS" value="08:00"><input class="inp" type="time" id="tE" value="16:30"></div>
      ${s.jobs.length > 1 ? chips('tj', s.jobs.map((j) => [j.id, C.esc(j.n || 'Робота')]), s.jobs[0].id) : ''}
      <button class="btn ink wide" data-a="add">${ic('plus')}Додати шаблон</button></div>`;
  sheet({
    title: 'Шаблони змін', html: body(), tall: true,
    onMount(x) {
      let tj = s.jobs[0].id;
      x.body.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.closest('[data-chips="tj"]')) { tj = b.dataset.v; x.body.querySelectorAll('[data-chips="tj"] .chip').forEach((c) => c.setAttribute('aria-pressed', c === b)); return; }
        if (b.dataset.del) { s.tpl = s.tpl.filter((t) => t.id !== b.dataset.del); save(); x.set(body()); return; }
        if (b.dataset.a === 'add') { const n = x.body.querySelector('#tN').value.trim(), st = x.body.querySelector('#tS').value, en = x.body.querySelector('#tE').value; if (!st || !en) return; s.tpl.push({ id: C.uid(), n, j: tj, s: st, e: en }); save(); x.set(body()); toast('Шаблон додано'); }
      });
    }
  });
}
