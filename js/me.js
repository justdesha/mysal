// «Я»: work–life balance, sleep, personal tips, sick leave & vacation, and all settings.
import * as C from './calc.js';
import { save, VER, backupBlob, restoreFrom, localCopies, wipe, undemo } from './store.js';
import { ic, sheet, ask, toast, seg, segInd, chips, tgl, haptic } from './ui.js';
import { buddy } from './buddy.js';
import { balance, tips, g } from './care.js';
import { jobColor, hmShort } from './today.js';
import { enablePush, disablePush, testPush, canPush, permission, standalone, pushUrl } from './notify.js';
import { openDay, openRates, openTemplates } from './schedule.js';

const refresh = () => window.dispatchEvent(new Event('bud:refresh'));
const S = () => C.getState();

export function applyTheme() {
  const t = S().cfg.theme || 'auto';
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#120D22' : '#F1EEF8');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());

export function renderMe(el) {
  const s = S(), B = balance(), T = tips().slice(0, 4);
  const nights = []; for (let i = 13; i >= 0; i--) { const k = C.ds(C.addD(C.TD, -i)); nights.push({ k, m: C.slDur(s.sleep[k]) }); }
  const goal = C.sgv() * 60, maxN = Math.max(goal + 60, ...nights.map((n) => n.m));
  const z = B.z || C.sleepStats(C.addD(C.TD, -13), C.TD);
  const yr = C.absCount(new Date(C.TD.getFullYear(), 0, 1), C.TD);
  const initial = s.name ? s.name.trim()[0].toUpperCase() : '';

  el.innerHTML = `
    <header class="page-h"><div><h1 class="h1">${s.name ? C.esc(s.name) : 'Я'}</h1><span class="muted">твій ритм за 2 тижні</span></div>
      <button class="avatar" data-a="profile" aria-label="Профіль">${s.prof.av ? `<img src="${s.prof.av}" alt="">` : initial ? C.esc(initial) : ic('me')}</button></header>

    <section class="card bal-card ${B.ok ? '' : 'empty-b'}">
      <div class="bal-top"><div>
        ${B.ok ? `<span class="lbl-l">Баланс роботи й життя</span><b class="score">${B.score}</b><span class="score-l">${B.label}</span>` : '<span class="lbl-l">Баланс роботи й життя</span><b class="score-l big">Ще мало даних</b><span class="small">Запиши кілька змін і ночей сну — і тут зʼявиться твій баланс.</span>'}
      </div><div class="bal-buddy">${buddy({ mood: B.ok ? B.mood : 'curious', pose: 'stand' })}</div></div>
      ${B.parts.map((p) => `<div class="part"><span class="row-sb"><b>${p.label}</b><span class="small">${p.note}</span></span><span class="pbar"><i style="width:${p.v}%" class="${p.v < 45 ? 'low' : p.v < 70 ? 'mid' : 'hi'}"></i></span></div>`).join('')}
    </section>

    <section class="card">
      <div class="row-sb"><h2 class="h3">Сон</h2><button class="btn soft sm" data-a="sleep">${ic('plus')}Записати</button></div>
      <div class="sl-chart" style="--goal:${goal / maxN * 100}%">${nights.map((n) => `<button class="sl-b ${n.k === C.TK ? 'now' : ''}" data-sk="${n.k}" aria-label="${C.dLong(C.pk(n.k))}: ${n.m ? C.hm(n.m) : 'не записано'}"><i class="${!n.m ? 'none' : n.m < goal - 60 ? 'short' : 'ok'}" style="height:${n.m ? Math.max(6, n.m / maxN * 100) : 4}%"></i><small>${C.DS[C.pk(n.k).getDay()][0]}</small></button>`).join('')}</div>
      <p class="small muted">${z.n ? `У середньому ${C.hm(z.avg)} за останні 14 днів (${z.n} ${C.pl(z.n, ['ніч', 'ночі', 'ночей'])} записано). Пунктир — твоя ціль ${C.sgv()} год.` : 'Записуй, коли ліг і встав, — побачиш, як зміни впливають на сон.'}</p>
    </section>

    <section><h2 class="h3 sec">Поради для тебе</h2>
      ${T.map((t) => `<div class="tip c-${t.color}" ${t.act ? `data-tip="${t.act.join('|')}" role="button" tabindex="0"` : ''}><span class="tip-ic">${ic(t.icon)}</span><span class="grow"><b>${t.title}</b><span>${t.text}</span></span></div>`).join('')}
    </section>

    <section class="list-card">
      <button class="row" data-a="abs">${ic('thermo')}<span class="grow"><b>Лікарняні й відпустки</b><span>${yr.sk || yr.vc ? `цього року: лікарняний ${yr.sk} ${C.pl(yr.sk, C.W_DAY)}, відпустка ${yr.vc}` : 'що тобі належить за договором'}</span></span>${ic('right')}</button>
    </section>

    <section class="list-card"><h2 class="h3">Налаштування</h2>
      <button class="row" data-a="jobs">${ic('work')}<span class="grow"><b>Роботи й договори</b><span>${s.jobs.filter((j) => j.n).map((j) => C.esc(j.n)).join(', ') || 'додай свою роботу'}</span></span>${ic('right')}</button>
      <button class="row" data-a="rhythm">${ic('clock')}<span class="grow"><b>Ритм і навантаження</b><span>${C.norm()} год на тиждень · відпочинок ${C.restMin() / 60} год між змінами</span></span>${ic('right')}</button>
      <button class="row" data-a="sleepset">${ic('moon')}<span class="grow"><b>Сон</b><span>ціль ${C.sgv()} год · збори ${C.prepv()} хв</span></span>${ic('right')}</button>
      <button class="row" data-a="notif">${ic('bell')}<span class="grow"><b>Сповіщення</b><span>${s.push.on ? 'приходять, навіть коли Bud закритий' : permission() === 'granted' ? 'лише коли Bud відкритий' : 'вимкнено'}</span></span>${ic('right')}</button>
      <button class="row" data-a="look">${ic('palette')}<span class="grow"><b>Вигляд</b><span>${{ auto: 'як у системі', light: 'світлий', dark: 'темний' }[s.cfg.theme || 'auto']}</span></span>${ic('right')}</button>
      <button class="row" data-a="profile">${ic('me')}<span class="grow"><b>Профіль</b><span>імʼя, звертання, дата народження</span></span>${ic('right')}</button>
      <button class="row" data-a="data">${ic('download')}<span class="grow"><b>Дані й копія</b><span>${s.lastBk ? `остання копія ${C.dLong(new Date(s.lastBk))}` : 'збережи копію на випадок нового телефона'}</span></span>${ic('right')}</button>
      <button class="row" data-a="beta">${ic('chat')}<span class="grow"><b>Повідомити про проблему</b><span>скрін + пара слів автору</span></span>${ic('right')}</button>
      <button class="row" data-a="wn">${ic('spark')}<span class="grow"><b>Що нового</b><span>Bud ${VER}</span></span>${ic('right')}</button>
    </section>`;
  if (!el._b) {
    el._b = true;
    el.addEventListener('click', (e) => {
      const sk = e.target.closest('[data-sk]'); if (sk) return openSleep(sk.dataset.sk);
      const tp = e.target.closest('[data-tip]'); if (tp) { const [t, v] = tp.dataset.tip.split('|'); if (t === 'day') openDay(v); else if (t === 'tab') window.dispatchEvent(new CustomEvent('bud:go', { detail: v })); else if (t === 'sleep') openSleep(C.TK); return; }
      const b = e.target.closest('[data-a]'); if (!b) return;
      ({ sleep: () => openSleep(C.TK), abs: openAbsence, jobs: openJobs, rhythm: openRhythm, sleepset: openSleepSet, notif: openNotif, look: openLook, profile: openProfile, data: openData, beta: openBeta, wn: () => import('./whatsnew.js').then((m) => m.showWhatsNew(true)) })[b.dataset.a]?.();
    });
  }
}

/* ---------- sleep ---------- */
export function openSleep(k) {
  let cur = k;
  const s = S();
  const body = () => {
    const e = s.sleep[cur] || {}, m = C.slDur(e);
    return `<p class="small muted">Ніч перед ${C.dLong(C.pk(cur))}</p>
      <div class="two"><label><span class="lbl">${g('Ліг', 'Лягла', 'Пішов(-ла) спати')}</span><input class="inp big-t" type="time" step="300" id="slB" value="${e.b || ''}"></label><label><span class="lbl">${g('Встав', 'Встала', 'Прокинувся(-лась)')}</span><input class="inp big-t" type="time" step="300" id="slW" value="${e.w || ''}"></label></div>
      <b class="num-xl center">${m ? hmShort(m) : '—'}</b>
      <div class="field"><span class="lbl">Як спалось?</span>${chips('q', [[1, 'Погано'], [2, 'Нормально'], [3, 'Добре']], e.q || '')}</div>`;
  };
  const head = () => `<div class="day-h"><button class="ib sm" data-a="p" aria-label="Попередня ніч">${ic('left')}</button><h2 class="h2">Сон</h2><button class="ib sm" data-a="n" aria-label="Наступна ніч" ${cur >= C.TK ? 'disabled' : ''}>${ic('right')}</button></div>`;
  sheet({
    head: head(), html: body(),
    foot: '<div class="row-g"><button class="btn ghost" data-a="clr">Очистити</button><button class="btn violet grow" data-a="ok">Готово</button></div>',
    onMount(x) {
      const re = () => { x.el.querySelector('.day-h').outerHTML = head(); x.set(body()); };
      const write = () => {
        const b = x.body.querySelector('#slB').value, w = x.body.querySelector('#slW').value;
        if (!b || !w) return;
        s.sleep[cur] = { ...(s.sleep[cur] || {}), b, w }; s.cfg.lb = b; s.cfg.lw = w; save(); re(); refresh();
      };
      x.body.addEventListener('change', write);
      if (!s.sleep[cur] && s.cfg.lb && s.cfg.lw) { setTimeout(() => { const B = x.body.querySelector('#slB'), W = x.body.querySelector('#slW'); if (B && !B.value) B.value = s.cfg.lb; if (W && !W.value) W.value = s.cfg.lw; }, 0); }
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.closest('[data-chips="q"]')) { s.sleep[cur] = { ...(s.sleep[cur] || {}), q: +b.dataset.v }; save(); re(); refresh(); return; }
        const a = b.dataset.a;
        if (a === 'p' || a === 'n') { cur = C.ds(C.addD(C.pk(cur), a === 'n' ? 1 : -1)); re(); }
        if (a === 'clr') { delete s.sleep[cur]; save(); re(); refresh(); }
        if (a === 'ok') { write(); x.close(); }
      });
    }
  });
}

/* ---------- sick leave & vacation ---------- */
export function openAbsence() {
  const s = S(), y = C.TD.getFullYear(), G = C.absGroups();
  const groups = Object.entries(G).filter(([, a]) => a[a.length - 1] >= `${y}-01-01`).map(([g2, a]) => ({ g: g2, a, ab: C.absOf(a[0]) })).sort((a, b) => b.a[0].localeCompare(a.a[0]));
  const html = `${s.jobs.filter((j) => j.n).map((j) => {
    const L = C.lawOf(j), ent = C.vacEnt(j, y), used = C.vacUsed(j, y);
    return `<div class="card tint"><b>${C.esc(j.n)}</b><span class="small muted">${C.esc((C.CT.find((c) => c[0] === j.ct) || [, 'Договір не вказано'])[1])}</span>
      ${ent.v ? `<div class="row-sb"><span>Відпустка ${y}</span><b>${C.nf(Math.max(0, ent.v - used.v))} з ${C.nf(ent.v)} ${ent.u === 'h' ? 'год' : C.pl(ent.v, C.W_DAY)}</b></div><span class="gbar"><i style="width:${Math.min(100, used.v / ent.v * 100)}%"></i></span>` : ent.need ? '<p class="small">Відпустка на DPP зʼявиться після 80 відпрацьованих годин за рік.</p>' : ''}
      <details class="more"><summary>Що каже закон</summary><p class="small"><b>Лікарняний.</b> ${L.sk}</p><p class="small"><b>Відпустка.</b> ${L.vc}</p></details></div>`;
  }).join('')}
    <h3 class="h3 sec">Цього року</h3>
    ${groups.length ? groups.map((q) => `<button class="row" data-k="${q.a[0]}"><span class="ev-ic ${q.ab.t === 'sick' ? 'out' : 'in'}">${ic(q.ab.t === 'sick' ? 'thermo' : 'sun')}</span><span class="grow"><b>${q.ab.t === 'sick' ? 'Лікарняний' : 'Відпустка'}</b><span>${C.rng(C.pk(q.a[0]), C.pk(q.a[q.a.length - 1]))} · ${q.a.length} ${C.pl(q.a.length, C.W_DAY)}</span></span>${ic('right')}</button>`).join('') : '<p class="small muted">Цього року ще не було. Щоб записати, відкрий день у «Графіку» → «Хворію» або «Відпустка».</p>'}
    <div class="row-g"><button class="btn soft grow" data-new="sick">${ic('thermo')}Лікарняний</button><button class="btn soft grow" data-new="vac">${ic('sun')}Відпустка</button></div>
    <p class="hint">${ic('info')}Суми — оцінка за записаними змінами. Точну виплату рахує роботодавець і ČSSZ.</p>`;
  sheet({
    title: 'Лікарняні й відпустки', html, tall: true,
    onMount(x) {
      x.el.addEventListener('click', (e) => {
        const r = e.target.closest('[data-k]'), n = e.target.closest('[data-new]');
        if (r) { x.close(); setTimeout(() => import('./schedule.js').then((m) => m.openAbs(r.dataset.k)), 200); }
        if (n) { x.close(); setTimeout(() => import('./schedule.js').then((m) => m.openAbs(C.TK, n.dataset.new)), 200); }
      });
    }
  });
}

/* ---------- jobs & contracts ---------- */
const CZ_CT = C.CT.filter((c) => c[2] === 'CZ');
const COLORS = ['mint', 'sky', 'lime', 'pink', 'yellow', 'coral', 'lilac'];
function openJobs() {
  const s = S();
  sheet({
    title: 'Роботи й договори', tall: true,
    html: `${s.jobs.map((j) => `<button class="row" data-id="${j.id}"><span class="dot" style="background:var(--${jobColor(j)})"></span><span class="grow"><b>${C.esc(j.n || 'Без назви')}</b><span>${C.esc((C.CT.find((c) => c[0] === j.ct) || [, 'договір не вказано'])[1])} · ${j.pt === 'm' ? 'оклад' : 'погодинно'}</span></span>${ic('right')}</button>`).join('')}
      <button class="btn soft wide" data-a="add">${ic('plus')}Додати роботу</button>
      <button class="btn ghost wide" data-a="rates">${ic('coin')}Ставки цього місяця</button><button class="btn ghost wide" data-a="tpl">${ic('clock')}Шаблони змін</button>`,
    onMount(x) {
      x.el.addEventListener('click', (e) => {
        const r = e.target.closest('[data-id]'), a = e.target.closest('[data-a]');
        if (r) { x.close(); setTimeout(() => openJob(s.jobs.find((j) => j.id === r.dataset.id)), 200); }
        if (a && a.dataset.a === 'add') { const j = C.newJob('', COLORS[s.jobs.length % COLORS.length], s.cur); x.close(); setTimeout(() => openJob(j, true), 200); }
        if (a && a.dataset.a === 'rates') { x.close(); setTimeout(() => openRates(C.TD.getFullYear(), C.TD.getMonth()), 200); }
        if (a && a.dataset.a === 'tpl') { x.close(); setTimeout(openTemplates, 200); }
      });
    }
  });
}

export function openJob(j, isNew = false) {
  const s = S(), y = C.TD.getFullYear(), m = C.TD.getMonth();
  const r0 = { ...C.R(j.id, y, m) };
  const st = { ...j, rate: C.num(r0.rate) || '', mult: Math.round((r0.mult ?? 1) * 100), bonus: C.num(r0.bonus) || '', mon: C.num(r0.mon) || '', country: (C.CT.find((c) => c[0] === j.ct) || [, , 'CZ'])[2] };
  const body = () => {
    const cts = C.CT.filter((c) => c[2] === st.country);
    return `<input class="inp" id="jN" placeholder="Назва: Готель, Пекарня…" value="${C.esc(st.n)}" maxlength="30">
      <div class="field"><span class="lbl">Колір</span><div class="colors">${COLORS.map((c) => `<button type="button" class="sw" data-col="${c}" aria-pressed="${jobColor(st) === c}" style="background:var(--${c})" aria-label="${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Країна договору</span>${chips('country', [['CZ', 'Чехія'], ['PL', 'Польща'], ['UA', 'Україна']], st.country)}</div>
      <div class="field"><span class="lbl">Тип договору</span><div class="chips">${cts.map((c) => `<button type="button" class="chip" data-ct="${c[0]}" aria-pressed="${st.ct === c[0]}">${c[1]}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Як платять</span>${seg('pt', [['h', 'За години'], ['m', 'Оклад']], st.pt || 'h')}</div>
      ${st.pt === 'm' ? `<label><span class="lbl">На руки за місяць, ${C.sym(st.cur)}</span><input class="inp" id="jMon" inputmode="decimal" value="${st.mon}"></label>`
        : `<div class="two"><label><span class="lbl">Ставка за годину, ${C.sym(st.cur)}</span><input class="inp" id="jRate" inputmode="decimal" value="${st.rate}"></label><label><span class="lbl">На руки, %</span><input class="inp" id="jMult" inputmode="decimal" value="${st.mult}"></label></div>
          <p class="hint">${ic('info')}${st.ct === 'DPP' ? 'На DPP до 12 000 Kč на місяць (2026) зазвичай утримують лише податок 15 %, якщо не підписано prohlášení. З підписаним — часто 100 %.' : 'Відсоток від брутто, що доходить на рахунок. Не знаєш — лиши 100 % і зверни з першою платіжкою.'}</p>`}
      <div class="two"><label><span class="lbl">День виплати</span><input class="inp" id="jPd" inputmode="numeric" placeholder="напр. 15" value="${C.num(st.pd) || ''}"></label>
        <div><span class="lbl">За який місяць</span>${chips('lag', [['1', 'Минулий'], ['0', 'Поточний']], String(C.num(st.lag)))}</div></div>
      <div class="field"><span class="lbl">Валюта</span>${chips('cur', C.CUR.map((c) => [c[0], c[0]]), st.cur)}</div>
      <details class="more"><summary>Більше налаштувань</summary>
        <label><span class="lbl">Перерва, хв (віднімається від змін понад 6 год)</span><input class="inp" id="jBrk" inputmode="numeric" value="${C.num(st.brk) || ''}"></label>
        <label><span class="lbl">Ліміт годин на рік</span><input class="inp" id="jYl" inputmode="numeric" placeholder="${st.ct === 'DPP' ? '300' : 'без ліміту'}" value="${C.num(st.yl) || ''}"></label>
        <label><span class="lbl">Надбавка за зміну, ${C.sym(st.cur)}</span><input class="inp" id="jBon" inputmode="decimal" value="${st.bonus}"></label>
        <div class="field"><span class="lbl">У які дні надбавка</span>${chips('zd', [[6, 'Сб'], [0, 'Нд'], [1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт']], st.zd || [], true)}</div>
        <label><span class="lbl">Дата початку роботи</span><input class="inp" type="date" id="jSt" value="${st.st || ''}"></label>
      </details>`;
  };
  sheet({
    title: isNew ? 'Нова робота' : 'Робота', html: body(), tall: true,
    foot: `<div class="row-g">${!isNew && s.jobs.length > 1 ? '<button class="btn ghost" data-a="del">Видалити</button>' : ''}<button class="btn violet grow" data-a="ok">Зберегти</button></div>`,
    onMount(x) {
      requestAnimationFrame(() => segInd(x.body));
      const v = (id) => x.body.querySelector('#' + id);
      const read = () => {
        st.n = v('jN').value.trim();
        if (v('jRate')) { st.rate = C.num(v('jRate').value); st.mult = C.num(v('jMult').value) || 100; }
        if (v('jMon')) st.mon = C.num(v('jMon').value);
        st.pd = v('jPd').value.trim(); st.brk = v('jBrk').value; st.yl = v('jYl').value; st.bonus = C.num(v('jBon').value); st.st = v('jSt').value;
      };
      const re = () => { read(); x.set(body()); segInd(x.body); };
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.col) { read(); st.c = b.dataset.col; x.set(body()); segInd(x.body); return; }
        if (b.dataset.ct) { read(); st.ct = b.dataset.ct; if (st.ct === 'DPP' && !st.yl) st.yl = 300; x.set(body()); segInd(x.body); return; }
        if (b.closest('[data-seg="pt"]')) { read(); st.pt = b.dataset.v; x.set(body()); segInd(x.body); return; }
        const ch = b.closest('[data-chips]');
        if (ch) {
          read(); const n = ch.dataset.chips, val = b.dataset.v;
          if (n === 'country') { st.country = val; st.ct = ''; if (val === 'PL') st.cur = 'PLN'; if (val === 'UA') st.cur = 'UAH'; if (val === 'CZ') st.cur = 'CZK'; }
          if (n === 'lag') st.lag = val;
          if (n === 'cur') st.cur = val;
          if (n === 'zd') { const w = +val; st.zd = (st.zd || []).includes(w) ? st.zd.filter((q) => q !== w) : [...(st.zd || []), w]; }
          x.set(body()); segInd(x.body); return;
        }
        if (b.dataset.a === 'del') {
          const n = Object.values(s.days).filter((d) => (d.sh || []).some((q) => q.j === j.id)).length;
          const ok = await ask(n ? `У графіку ${n} ${C.pl(n, C.W_DAY)} з цією роботою. Видалити роботу разом із цими змінами?` : 'Видалити роботу?', [{ label: 'Видалити', value: 1, style: 'danger' }]);
          if (!ok) return;
          for (const [k, d] of Object.entries(s.days)) { if (d.sh) { d.sh = d.sh.filter((q) => q.j !== j.id); if (!d.sh.length) delete d.sh; } if (!d.sh && !d.o && !d.ab && !d.f) delete s.days[k]; }
          s.jobs = s.jobs.filter((q) => q.id !== j.id); delete s.rates[j.id]; save(); x.close(); refresh(); return;
        }
        if (b.dataset.a === 'ok') {
          read();
          if (!st.n) { v('jN').focus(); v('jN').placeholder = 'Дай роботі назву'; return; }
          const out = { ...j, n: st.n, c: st.c || j.c, ct: st.ct, pt: st.pt || 'h', cur: st.cur, pd: st.pd, lag: st.lag === '' || st.lag === undefined ? '1' : String(st.lag), brk: st.brk, yl: C.num(st.yl), zd: st.zd || [], st: st.st };
          const i = s.jobs.findIndex((q) => q.id === j.id);
          if (i >= 0) s.jobs[i] = out; else { s.jobs.push(out); s.rates[out.id] = {}; }
          const key = C.mk(y, m); s.rates[out.id] = s.rates[out.id] || {};
          s.rates[out.id][key] = { ...C.R(out.id, y, m), ...(s.rates[out.id][key] || {}), rate: C.num(st.rate), mult: Math.min(100, C.num(st.mult) || 100) / 100, bonus: C.num(st.bonus), ...(out.pt === 'm' ? { mon: C.num(st.mon) } : {}) };
          save(); x.close(); refresh(); toast('Збережено');
        }
      });
    }
  });
}

/* ---------- rhythm ---------- */
function openRhythm() {
  const s = S(), c = s.cfg;
  const body = () => `<div class="field"><span class="lbl">Норма годин на тиждень</span>${chips('week', [[20, '20'], [30, '30'], [40, '40'], [50, '50']], C.norm())}</div>
    <div class="field"><span class="lbl">Вихідних на тиждень, щонайменше</span>${chips('off', [[1, '1'], [2, '2'], [3, '3']], C.offv())}</div>
    <div class="field"><span class="lbl">Відпочинок між змінами</span>${chips('rest', [[11, '11 год (закон)'], [12, '12 год'], [14, '14 год']], C.restMin() / 60)}</div>
    <div class="field"><span class="lbl">Ціль доходу на місяць</span><input class="inp" id="rT" inputmode="numeric" placeholder="${C.autoTarget() ? 'авто: ' + C.autoTarget() : 'напр. 25000'}" value="${C.num(c.target) || ''}"></div>
    <div class="field"><span class="lbl">Що допомагає тобі відпочити</span>${chips('fun', C.FUN, c.fun || [], true)}</div>`;
  sheet({
    title: 'Ритм і навантаження', html: body(), tall: true,
    onMount(x) {
      x.el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-chips] button'); if (!b) return;
        const n = b.closest('[data-chips]').dataset.chips, v = b.dataset.v;
        if (n === 'week') { c.week = +v; c.wkU = true; } if (n === 'off') c.off = +v; if (n === 'rest') c.rest = +v;
        if (n === 'fun') { c.fun = (c.fun || []).includes(v) ? c.fun.filter((q) => q !== v) : [...(c.fun || []), v]; }
        save(); haptic(); x.set(body()); refresh();
      });
      x.body.addEventListener('change', (e) => { if (e.target.id === 'rT') { c.target = C.num(e.target.value); save(); refresh(); } });
    }
  });
}
function openSleepSet() {
  const s = S(), c = s.cfg, rec = C.recSleep();
  const body = () => `<div class="field"><span class="lbl">Скільки годин сну тобі треба</span>${chips('sg', [[7, '7'], [7.5, '7,5'], [8, '8'], [8.5, '8,5'], [9, '9']], C.sgv())}</div>
    <p class="small muted">${C.age() ? `Для ${C.age()} років рекомендують ${rec[0]}–${rec[1]} год.` : 'Дорослим зазвичай треба 7–9 год.'}</p>
    <div class="field"><span class="lbl">Скільки часу на збори й дорогу до роботи</span>${chips('prep', [[30, '30 хв'], [45, '45 хв'], [60, '1 год'], [90, '1,5 год']], C.prepv())}</div>`;
  sheet({ title: 'Сон', html: body(), onMount(x) { x.el.addEventListener('click', (e) => { const b = e.target.closest('[data-chips] button'); if (!b) return; const n = b.closest('[data-chips]').dataset.chips; c[n] = +b.dataset.v; save(); x.set(body()); refresh(); }); } });
}

/* ---------- notifications ---------- */
function openNotif() {
  const s = S(), n = s.cfg.nt;
  const body = () => {
    const perm = permission(), server = !!pushUrl();
    const state = s.push.on ? ['on', 'Увімкнено', 'Нагадування приходять, навіть коли Bud закритий.']
      : perm === 'granted' ? ['half', 'Лише поки Bud відкритий', server ? 'Увімкни, щоб нагадування приходили завжди.' : 'Сервер сповіщень ще не підключено — дивись інструкцію в README.']
      : perm === 'denied' ? ['off', 'Заборонено', 'Дозволь у Параметрах iPhone → Bud → Сповіщення.']
      : ['off', 'Вимкнено', standalone() ? 'Bud попросить дозвіл.' : 'Спершу додай Bud на початковий екран і відкрий з іконки.'];
    const row = (k, label, sub) => `<button class="row" data-k="${k}"><span class="grow"><b>${label}</b><span>${sub}</span></span>${tgl(!!n[k])}</button>`;
    return `<div class="card tint st-${state[0]}"><b>${state[1]}</b><span class="small">${state[2]}</span>
        ${s.push.on ? `<div class="row-g"><button class="btn soft grow" data-a="test">Надіслати тест</button><button class="btn ghost grow" data-a="off">Вимкнути</button></div>` : perm !== 'denied' ? `<button class="btn violet wide" data-a="on">${ic('bell')}Увімкнути сповіщення</button>` : ''}</div>
      <div class="list-card">
        ${row('shift', 'Перед зміною', n.shift ? `за ${n.shift >= 60 ? n.shift / 60 + ' год' : n.shift + ' хв'}` : 'вимкнено')}
        ${row('early', 'Коли лягати перед ранньою зміною', 'увечері напередодні')}
        ${row('confirm', 'Підтвердити зміну', 'через пів години після кінця')}
        ${row('pay', 'День виплати', 'о 9:00')}
        ${row('bill', 'Платежі', 'увечері напередодні')}
        ${row('plan', 'Тиждень не сплановано', 'у неділю о 18:00')}
      </div>
      ${n.shift ? `<div class="field"><span class="lbl">Нагадувати перед зміною за</span>${chips('shiftT', [[30, '30 хв'], [60, '1 год'], [90, '1,5 год'], [120, '2 год']], n.shift)}</div>` : ''}
      <details class="more"><summary>Сервер сповіщень</summary><p class="small muted">Адреса Cloudflare Worker, який надсилає нагадування. Зазвичай вже вписана в застосунок.</p>
        <input class="inp" id="pU" placeholder="https://bud-push.….workers.dev" value="${C.esc(s.push.url || '')}"></details>`;
  };
  sheet({
    title: 'Сповіщення', html: body(), tall: true,
    onMount(x) {
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.k) { const k = b.dataset.k; n[k] = n[k] ? (k === 'shift' ? 0 : false) : (k === 'shift' ? 60 : true); save(); x.set(body()); return; }
        if (b.closest('[data-chips="shiftT"]')) { n.shift = +b.dataset.v; save(); x.set(body()); return; }
        if (b.dataset.a === 'on') { b.disabled = true; try { const r = await enablePush(); toast(r === 'push' ? 'Готово! Нагадування приходитимуть завжди' : 'Сповіщення працюватимуть, поки Bud відкритий'); } catch (er) { toast(er.message, { ms: 4500 }); } x.set(body()); refresh(); }
        if (b.dataset.a === 'off') { await disablePush(); x.set(body()); refresh(); }
        if (b.dataset.a === 'test') testPush();
      });
      x.body.addEventListener('change', (e) => { if (e.target.id === 'pU') { s.push.url = e.target.value.trim(); save(); x.set(body()); } });
    }
  });
}

/* ---------- look, profile, data, beta ---------- */
function openLook() {
  const s = S();
  sheet({
    title: 'Вигляд', html: seg('th', [['auto', 'Як у системі'], ['light', 'Світлий'], ['dark', 'Темний']], s.cfg.theme || 'auto'),
    onMount(x) { requestAnimationFrame(() => segInd(x.body)); x.body.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; s.cfg.theme = b.dataset.v; save(); applyTheme(); x.body.querySelectorAll('[data-v]').forEach((q) => q.setAttribute('aria-pressed', q === b)); segInd(x.body); refresh(); }); }
  });
}
function openProfile() {
  const s = S();
  const body = () => `<input class="inp" id="pN" placeholder="Імʼя" value="${C.esc(s.name || '')}" maxlength="24">
    <div class="field"><span class="lbl">Як до тебе звертатися</span>${chips('sx', [['m', 'Він'], ['f', 'Вона'], ['', 'Не важливо']], s.prof.sx || '')}</div>
    <label><span class="lbl">Дата народження — щоб підібрати норму сну</span><input class="inp" type="date" id="pB" value="${s.prof.bd || ''}"></label>
    <button class="btn soft wide" data-a="ph">${ic('me')}${s.prof.av ? 'Змінити фото' : 'Додати фото'}</button>`;
  sheet({
    title: 'Профіль', html: body(),
    onMount(x) {
      x.body.addEventListener('change', (e) => { if (e.target.id === 'pN') s.name = e.target.value.trim(); if (e.target.id === 'pB') s.prof.bd = e.target.value; save(); refresh(); });
      x.body.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.closest('[data-chips="sx"]')) { s.prof.sx = b.dataset.v; save(); x.set(body()); refresh(); }
        if (b.dataset.a === 'ph') { const p = await pickPhoto(); if (p) { s.prof.av = p; save(); refresh(); toast('Фото оновлено'); } }
      });
    }
  });
}
export function pickPhoto() {
  return new Promise((res) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.style.cssText = 'position:fixed;left:-9999px;opacity:0'; document.body.append(inp);
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; if (!f) { inp.remove(); return res(null); }
      const r = new FileReader();
      r.onload = () => { const img = new Image(); img.onload = () => { const z = 240, c = document.createElement('canvas'); c.width = c.height = z; const k = Math.max(z / img.naturalWidth, z / img.naturalHeight); c.getContext('2d').drawImage(img, (z - img.naturalWidth * k) / 2, (z - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k); inp.remove(); res(c.toDataURL('image/jpeg', .82)); }; img.onerror = () => { inp.remove(); res(null); }; img.src = r.result; };
      r.readAsDataURL(f);
    }, { once: true });
    inp.click();
  });
}
function openData() {
  const s = S();
  sheet({
    title: 'Дані й копія',
    html: `<p class="small muted">Усе зберігається лише на цьому телефоні. Копія — це файл, з якого Bud відновить дані на новому телефоні чи після очищення Safari.</p>
      <button class="btn violet wide" data-a="bk">${ic('download')}Зберегти копію</button>
      <label class="btn soft wide">${ic('upload')}Відновити з файлу<input type="file" id="rf" accept="application/json,.json" hidden></label>
      ${localCopies().map((c) => `<button class="btn ghost wide" data-local="${c.key}">${c.label}<small>${c.days} ${C.pl(c.days, C.W_DAY)} у графіку</small></button>`).join('')}
      ${s.demo ? '<button class="btn soft wide" data-a="undemo">Прибрати демо-дані</button>' : ''}
      <button class="link danger" data-a="wipe">Почати з нуля</button>`,
    onMount(x) {
      x.el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-a],[data-local]'); if (!b) return;
        if (b.dataset.a === 'bk') {
          const blob = backupBlob(), name = `bud-${C.TK}.json`, file = new File([blob], name, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: name }).catch(() => {});
          else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }
          s.lastBk = Date.now(); save(); toast('Копію збережено');
        }
        if (b.dataset.local) { const c = localCopies().find((q) => q.key === b.dataset.local); const ok = await ask('Поточні дані заміняться цією копією.', [{ label: 'Повернути', value: 1, style: 'violet' }]); if (ok && c) { restoreFrom(c.data); location.reload(); } }
        if (b.dataset.a === 'undemo') { undemo(); location.reload(); return; }
        if (b.dataset.a === 'wipe') { const ok = await ask('Видалити всі зміни, гроші й налаштування? Копія лишиться на телефоні ще раз.', [{ label: 'Почати з нуля', value: 1, style: 'danger' }]); if (ok) { wipe(); location.reload(); } }
      });
      x.body.querySelector('#rf').addEventListener('change', async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try { const d = JSON.parse(await f.text()); const ok = await ask('Поточні дані заміняться даними з копії.', [{ label: 'Відновити', value: 1, style: 'violet' }]); if (ok) { restoreFrom(d); location.reload(); } }
        catch (er) { toast('Це не схоже на копію Bud'); }
      });
    }
  });
}
function openBeta() {
  const diag = `Bud ${VER} · ${navigator.userAgent} · ${innerWidth}×${innerHeight} · ${standalone() ? 'з іконки' : 'у браузері'} · push ${S().push.on ? 'on' : 'off'}`;
  sheet({
    title: 'Повідомити про проблему',
    html: `<div class="steps"><p><b>1.</b> Зроби скрін місця, де щось не так.</p><p><b>2.</b> Напиши, що ${g('ти робив', 'ти робила', 'відбувалось')} і чого ${g('очікував', 'очікувала', 'очікувалось')}.</p><p><b>3.</b> Надішли автору в Telegram разом із технічними даними.</p></div>
      <button class="btn violet wide" data-a="share">${ic('chat')}Надіслати технічні дані</button><p class="small muted">Там лише версія, екран і модель пристрою. Сум і особистих даних немає.</p>`,
    onMount(x) { x.el.addEventListener('click', async (e) => { if (!e.target.closest('[data-a]')) return; if (navigator.share) navigator.share({ text: diag }).catch(() => {}); else { await navigator.clipboard?.writeText(diag); toast('Скопійовано'); } }); }
  });
}
