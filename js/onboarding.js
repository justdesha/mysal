// First run: a short questionnaire. Also the screen shown when saved data could not be read.
import * as C from './calc.js';
import { save, restoreFrom, localCopies, VER } from './store.js';
import { ic, chips, seg, segInd, haptic, toast } from './ui.js';
import { face, bud, cluster } from './cast.js';
import { stk } from './stickers.js';
import { enablePush, canPush, standalone } from './notify.js';
import { applyTheme } from './me.js';

export function startOnboarding(done) {
  const S = C.getState();
  const j = S.jobs[0];
  const d = { name: S.name || '', sx: S.prof.sx || '', jn: j.n || '', ct: j.ct || 'DPP', pt: j.pt || 'h', rate: '', mult: 100, pd: j.pd || '', lag: '1', week: C.norm(), off: C.offv(), part: S.cfg.pref.part, sg: C.sgv(), base: '', bal: '' };
  const STEPS = ['hi', 'name', 'job', 'pay', 'rhythm', 'money', 'notify', 'done'];
  let i = 0, dir = 1;
  const el = document.createElement('div'); el.className = 'ob'; document.body.append(el);

  const views = {
    hi: () => '', // drawn separately in render()
    name: () => `<h1 class="ob-h sm">Як тебе звати?</h1><input class="inp big" id="oN" placeholder="Імʼя" value="${C.esc(d.name)}" maxlength="24" autocomplete="given-name">
      <div class="field"><span class="lbl">Як до тебе звертатися в текстах</span>${chips('sx', [['m', 'Він'], ['f', 'Вона'], ['', 'Не важливо']], d.sx)}</div>`,
    job: () => `<h1 class="ob-h sm">Де ти працюєш?</h1><input class="inp big" id="oJ" placeholder="Напр. Готель" value="${C.esc(d.jn)}" maxlength="30">
      <div class="field"><span class="lbl">Договір</span><div class="chips">${C.CT.filter((c) => c[2] === 'CZ').map((c) => `<button type="button" class="chip" data-ct="${c[0]}" aria-pressed="${d.ct === c[0]}">${c[1]}</button>`).join('')}<button type="button" class="chip" data-ct="emp" aria-pressed="${d.ct === 'emp'}">Інший</button></div></div>
      <p class="hint">${ic('info')}Від договору залежать ліміти, лікарняні й відпустка. Інші роботи можна додати потім у «Я».</p>`,
    pay: () => `<h1 class="ob-h sm">Скільки платять?</h1>${seg('pt', [['h', 'За години'], ['m', 'Оклад']], d.pt)}
      ${d.pt === 'h' ? `<div class="money-in"><input class="inp big" id="oR" inputmode="decimal" placeholder="Ставка за годину" value="${d.rate}"><span>Kc</span></div>
        <div class="field"><span class="lbl">Скільки з цього доходить на рахунок</span>${chips('mult', [[100, '100 %'], [85, '85 %'], [75, '75 %']], d.mult)}</div>
        <p class="hint">${ic('info')}${d.ct === 'DPP' ? 'На DPP з підписаним prohlášení зазвичай 100 %, без нього — 85 %.' : 'Не знаєш — лиши 100 % і звір із першою платіжкою.'}</p>`
      : `<div class="money-in"><input class="inp big" id="oR" inputmode="decimal" placeholder="На руки за місяць" value="${d.rate}"><span>Kc</span></div>`}
      <div class="two"><label><span class="lbl">День виплати</span><input class="inp" id="oP" inputmode="numeric" placeholder="напр. 15" value="${d.pd}"></label><div><span class="lbl">За який місяць</span>${chips('lag', [['1', 'Минулий'], ['0', 'Поточний']], d.lag)}</div></div>`,
    rhythm: () => `<h1 class="ob-h sm">Твій ритм</h1>
      <div class="field"><span class="lbl">Скільки годин на тиждень хочеш працювати</span>${chips('week', [[20, '20'], [30, '30'], [40, '40'], [50, '50']], d.week)}</div>
      <div class="field"><span class="lbl">Вихідних на тиждень, щонайменше</span>${chips('off', [[1, '1'], [2, '2'], [3, '3']], d.off)}</div>
      <div class="field"><span class="lbl">Коли тобі комфортно працювати</span>${chips('part', [['morning', 'Зранку'], ['day', 'Удень'], ['evening', 'Увечері'], ['any', 'Будь-коли']], d.part)}</div>
      <div class="field"><span class="lbl">Скільки сну тобі треба</span>${chips('sg', [[7, '7 год'], [8, '8 год'], [9, '9 год']], d.sg)}</div>`,
    money: () => `<h1 class="ob-h sm">Гроші на місяць</h1>
      <label><span class="lbl">Обовʼязкові витрати за місяць: житло, їжа, транспорт</span><div class="money-in"><input class="inp big" id="oB" inputmode="decimal" placeholder="напр. 16000" value="${d.base}"><span>Kc</span></div></label>
      <label><span class="lbl">Скільки зараз на рахунку</span><div class="money-in"><input class="inp big" id="oBal" inputmode="decimal" placeholder="можна пропустити" value="${d.bal}"><span>Kc</span></div></label>
      <p class="hint">${ic('info')}З цього Bud порахує, скільки можна витрачати щодня і скільки відкладати.</p>`,
    notify: () => `<div class="ob-face sm">${face({ shape: 'squircle', color: 'sun', mood: 'curious', hair: 'tuft' })}</div><h1 class="ob-h sm">Нагадування</h1>
      <p class="ob-lead">Bud нагадає про зміну, підкаже, коли лягати перед ранньою, і скаже, коли прийде виплата.</p>
      ${canPush() ? '<button class="btn ink wide" id="oPush">Дозволити сповіщення</button>' : `<p class="note">${ic('info')}${standalone() ? 'Цей iPhone не підтримує сповіщення — потрібен iOS 16.4 або новіший.' : 'Сповіщення стануть доступні, коли відкриєш Bud з іконки на початковому екрані.'}</p>`}`,
    done: () => `<div class="ob-face">${bud('proud')}</div><h1 class="ob-h">Готово${d.name ? ', ' + C.esc(d.name) : ''}!</h1>
      <p class="ob-lead">Почни з «Графіка»: натисни на день і додай зміну. Або склади план за хвилину кнопкою «Скласти план».</p>`
  };

  const read = () => {
    const v = (id) => el.querySelector('#' + id);
    if (v('oN')) d.name = v('oN').value.trim();
    if (v('oJ')) d.jn = v('oJ').value.trim();
    if (v('oR')) d.rate = v('oR').value.trim();
    if (v('oP')) d.pd = v('oP').value.trim();
    if (v('oB')) d.base = v('oB').value.trim();
    if (v('oBal')) d.bal = v('oBal').value.trim();
  };
  const render = () => {
    const k = STEPS[i];
    if (k === 'hi') {
      el.innerHTML = `<div class="ob-hi"><h1 class="ob-h">Робота, гроші й&nbsp;сон у&nbsp;балансі?</h1>
        <button class="btn ob-go" data-a="next">Bud допоможе<span class="arrow">${ic('right')}</span></button>
        <button class="link" data-a="restore">Відновити з копії</button>
        ${cluster()}</div>`;
      return;
    }
    el.innerHTML = `<div class="ob-bar">${STEPS.slice(1, -1).map((_, n) => `<i class="${n < i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="ob-top">${i > 0 && k !== 'done' ? `<button class="ib" data-a="back" aria-label="Назад">${ic('left')}</button>` : '<span></span>'}${['money', 'notify'].includes(k) ? '<button class="link" data-a="skip">Пропустити</button>' : ''}</div>
      <div class="ob-stage"><div class="ob-step ${dir < 0 ? 'back' : ''}">${views[k]()}</div></div>
      <div class="ob-foot"><button class="btn ink wide big" data-a="next">${k === 'hi' ? 'Почнімо' : k === 'done' ? 'Відкрити Bud' : 'Далі'}</button>
        ${k === 'hi' ? '<button class="link" data-a="restore">Відновити з копії</button>' : ''}</div>`;
    requestAnimationFrame(() => segInd(el));
    const f = el.querySelector('.ob-step input'); if (f && !['pay', 'money'].includes(k)) setTimeout(() => f.focus(), 350);
  };
  const next = (n = 1) => { read(); if (n > 0 && STEPS[i] === 'name' && !d.name) { const f = el.querySelector('#oN'); f.focus(); f.placeholder = 'Напиши імʼя'; haptic(30); return; } if (n > 0 && STEPS[i] === 'done') return finish(); dir = n; i = Math.max(0, Math.min(STEPS.length - 1, i + n)); haptic(); render(); };
  const finish = () => {
    const s = C.getState(), job = s.jobs[0];
    s.name = d.name; s.prof.sx = d.sx;
    job.n = d.jn || 'Робота'; job.ct = d.ct; job.pt = d.pt; job.pd = d.pd; job.lag = d.lag; job.cur = 'CZK'; job.c = job.c && !job.c.startsWith('#') ? job.c : 'mint';
    if (d.ct === 'DPP') job.yl = 300;
    const key = C.mk(C.TD.getFullYear(), C.TD.getMonth());
    s.rates[job.id] = s.rates[job.id] || {};
    s.rates[job.id][key] = d.pt === 'h' ? { rate: C.num(d.rate), mult: d.mult / 100, bonus: 0 } : { rate: 0, mult: 1, bonus: 0, mon: C.num(d.rate) };
    s.cfg.week = d.week; s.cfg.wkU = true; s.cfg.off = d.off; s.cfg.pref.part = d.part; s.cfg.sg = d.sg;
    if (C.num(d.base)) s.base = [{ id: C.uid(), n: 'Базові витрати', a: C.num(d.base), d: '' }];
    if (d.bal !== '') s.bal = { a: C.num(d.bal), d: C.TK, ts: Date.now() };
    s.cur = 'CZK'; s.curSet = true; s.onb = true; s.since = C.TK; s.wnv = VER;
    save(true);
    el.classList.add('out'); setTimeout(() => { el.remove(); done && done(); }, 350);
  };
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'next') return next(1);
    if (a === 'back') return next(-1);
    if (a === 'skip') { read(); dir = 1; i++; render(); return; }
    if (a === 'restore') { el.remove(); restoreScreen(false, () => startOnboarding(done)); return; }
    if (b.id === 'oPush') { try { await enablePush(); toast('Сповіщення увімкнено'); next(1); } catch (er) { toast(er.message, { ms: 4500 }); } return; }
    if (b.dataset.ct) { read(); d.ct = b.dataset.ct; render(); return; }
    if (b.closest('[data-seg="pt"]')) { read(); d.pt = b.dataset.v; render(); return; }
    const ch = b.closest('[data-chips]');
    if (ch) { read(); const n = ch.dataset.chips; d[n] = ['mult', 'week', 'off', 'sg'].includes(n) ? +b.dataset.v : b.dataset.v; render(); }
  });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) next(1); });
  render();
}

/** shown when saved data could not be read, or when someone wants to restore during first run */
export function restoreScreen(broken, back) {
  const el = document.createElement('div'); el.className = 'ob';
  const copies = localCopies();
  el.innerHTML = `<div class="ob-stage"><div class="ob-step">
    <div class="ob-face sm">${bud(broken ? 'worried' : 'curious')}</div>
    <h1 class="ob-h sm">${broken ? 'Дані не вдалося прочитати' : 'Відновити дані'}</h1>
    <p class="ob-lead">${broken ? 'Нічого не видалено. Можна повернути копію з цього телефона або завантажити файл копії.' : 'Завантаж файл копії Bud — щось на кшталт bud-2026-11-06.json. Зазвичай він лежить у «Файлах» → «Завантаження».'}</p>
    ${copies.map((c) => `<button class="btn soft wide" data-local="${c.key}">${c.label}<small>${c.days} ${C.pl(c.days, C.W_DAY)} у графіку</small></button>`).join('')}
    <label class="btn ink wide">${ic('upload')}Завантажити файл копії<input type="file" id="rf" accept="application/json,.json" hidden></label>
    ${back ? '<button class="link" data-a="back">Назад</button>' : ''}
  </div></div>`;
  document.body.append(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-local],[data-a]'); if (!b) return;
    if (b.dataset.a === 'back') { el.remove(); back(); return; }
    const c = copies.find((q) => q.key === b.dataset.local); if (c) { restoreFrom(c.data); location.reload(); }
  });
  el.querySelector('#rf').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { restoreFrom(JSON.parse(await f.text())); applyTheme(); location.reload(); } catch (er) { toast('Це не схоже на копію Bud'); }
  });
}
