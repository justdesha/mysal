// Work–life balance score and personal tips, built from the person's own shifts, sleep and feelings.
import * as C from './calc.js';

const { addD, ds, pk, TD, dLong, hm, pl, W_DAY, num } = C;
const today = () => C.TD;

/** forms that follow the gender chosen in the profile; neutral wording when it is not set */
export const g = (m, f, n) => { const x = C.getState().prof && C.getState().prof.sx; return x === 'f' ? f : x === 'm' ? m : (n ?? m + '/' + f); };

/* ---------- balance score ---------- */
export function balance() {
  const S = C.getState();
  const T = today(), a = addD(T, -13);
  const z = C.sleepStats(a, T), st = C.stats(a, T);
  const goal = C.sgv() * 60;
  const parts = [];

  // sleep: average against the goal, short nights, regularity
  let sleep = null;
  if (z.n >= 3) {
    let v = Math.min(1, z.avg / goal) * 100;
    v -= Math.min(30, z.short * 6);
    if (z.spread > 75) v -= Math.min(15, (z.spread - 75) / 4);
    sleep = Math.max(0, Math.round(v));
    parts.push({ k: 'sleep', v: sleep, label: 'Сон', note: `${hm(z.avg)} у середньому за ${z.n} ${pl(z.n, ['ніч', 'ночі', 'ночей'])}` });
  }
  // rest: days off in two weeks, longest run, 35h weekly rest
  let rest = null;
  if (st.w >= 3) {
    const offWanted = Math.max(1, C.offv()) * 2;
    const off = st.days - st.wd;
    let v = Math.min(1, off / offWanted) * 100;
    if (st.mx >= 7) v -= 25; else if (st.mx >= 6) v -= 12;
    v -= st.tight * 10;
    rest = Math.max(0, Math.round(v));
    parts.push({ k: 'rest', v: rest, label: 'Відпочинок', note: `${off} ${pl(off, W_DAY)} без роботи за 2 тижні` });
  }
  // load: hours per week vs the person's norm, short rests, long hard shifts
  let load = null;
  if (st.w >= 3) {
    const nr = C.norm();
    let v = st.pw <= nr ? 100 : Math.max(0, 100 - (st.pw - nr) / nr * 160);
    v -= Math.min(30, st.short * 10);
    v -= Math.min(20, st.lgH * 8);
    load = Math.max(0, Math.round(v));
    parts.push({ k: 'load', v: load, label: 'Навантаження', note: `~${Math.round(st.pw)} год на тиждень із ${nr}` });
  }
  if (!parts.length) return { ok: false, parts };
  const w = { sleep: .4, rest: .3, load: .3 };
  const tw = parts.reduce((s, p) => s + w[p.k], 0);
  let score = parts.reduce((s, p) => s + p.v * w[p.k], 0) / tw;
  if (st.er >= 4) score += (st.fe - 2) * 6; // how the shifts felt
  // how the person said they felt (daily check-in)
  const SC = { up: 3, calm: 3, tired: 1.5, tense: 1, sad: 1 };
  const moods = []; for (let i = 0; i < 14; i++) { const m = (S.mood || {})[ds(addD(T, -i))]; if (SC[m]) moods.push(SC[m]); }
  if (moods.length >= 3) { const av = moods.reduce((a, b) => a + b, 0) / moods.length; score += (av - 2) * 7; parts.push({ k: 'mood', v: Math.round((av - 1) / 2 * 100), label: 'Настрій', note: `${moods.length} ${pl(moods.length, ['відмітка', 'відмітки', 'відміток'])} за 2 тижні` }); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80 ? 'Чудовий баланс' : score >= 62 ? 'Рівновага' : score >= 42 ? 'На межі' : 'Перевантаження';
  const mood = score >= 80 ? 'up' : score >= 62 ? 'calm' : score >= 42 ? 'worried' : 'sleepy';
  const tone = score >= 80 ? 'lime' : score >= 62 ? 'mint' : score >= 42 ? 'yellow' : 'coral';
  const text = score >= 80 ? 'Сон, відпочинок і робота в рівновазі. Так тримати.' : score >= 62 ? 'Ритм рівний. Невеликі перекоси є, але сил вистачає.' : score >= 42 ? 'Втома накопичується. Варто додати сну або вихідний.' : 'Забагато роботи й замало відпочинку. Час пригальмувати.';
  return { ok: true, score, label, mood, tone, text, parts, z, st };
}

/* ---------- personal tips ---------- */
// each tip: { id, score, icon, color, title, text, act? }
export function tips() {
  const S = C.getState();
  const T = today(), out = [];
  const goal = C.sgv() * 60;
  const z14 = C.sleepStats(addD(T, -13), T);
  const s30 = C.stats(addD(T, -29), T);
  const ahead = addD(T, 14);

  // 1. sleep before early shifts + the next early start
  const nextEarly = (() => { for (let i = 0; i <= 7; i++) { const k = ds(addD(T, i)); const f = C.shOf(k).filter((x) => x.s).sort((a, b) => C.tm(a.s) - C.tm(b.s))[0]; if (f && C.tm(f.s) < 540) return { k, s: f.s }; } return null; })();
  if (nextEarly) {
    const bed = C.mt(C.tm(nextEarly.s) - C.sgv() * 60 - C.prepv());
    const short = z14.preN >= 2 && z14.pre < goal - 45;
    out.push({ id: 'early', score: short ? 9 : 5, icon: 'moon', color: 'sky',
      title: `Рання зміна ${nextEarly.k === ds(T) ? 'сьогодні' : nextEarly.k === ds(addD(T, 1)) ? 'завтра' : dLong(pk(nextEarly.k))} о ${nextEarly.s}`,
      text: `${short ? `Перед ранніми змінами сон зараз ${hm(z14.pre)} — коротше за ціль. ` : ''}Щоб поспати ${C.sgv()} год і встигнути зібратися, лягай до ${bed} напередодні.` });
  }
  // 2. short rest between shifts ahead
  const sr = C.shortRests(addD(T, 1), ahead);
  if (sr.length) {
    const x = sr[0];
    out.push({ id: 'rest11', score: 10, icon: 'clock', color: 'pink', act: ['day', x.k],
      title: `${dLong(pk(x.k))}: між змінами лише ${hm(x.g)}`,
      text: `Чеський закон і здоровий сон просять щонайменше ${C.restMin() / 60} год між змінами. Спробуй зсунути початок пізніше або обміняйся зміною.` });
  }
  // 3. back rotation (evening → morning)
  const br = C.backRot(T, ahead);
  if (br.length) out.push({ id: 'rot', score: 6, icon: 'repeat', color: 'lilac', act: ['day', br[0].k2],
    title: 'Зміни йдуть «назад»', text: `${dLong(pk(br[0].k))} до ${br[0].a}, а ${dLong(pk(br[0].k2))} вже з ${br[0].b}. Тілу легше, коли зміни зсуваються вперед: ранок → день → вечір.` });
  // 4. long run of work days ahead
  const lim = Math.max(3, Math.min(S.cfg.pref?.maxRun || 6, 7 - C.offv()));
  const run = C.runAhead(lim);
  if (run) out.push({ id: 'run', score: 8, icon: 'leaf', color: 'mint', act: ['day', ds(run.st)],
    title: `${run.n} ${pl(run.n, W_DAY)} роботи поспіль`, text: `Попереду серія з ${dLong(run.st)}. Вихідний посередині поверне більше сил, ніж кілька зароблених годин.` });
  // 5. personal comfort from feelings
  const O = C.optimum();
  if (O.ok && O.len && s30.lgH >= 2) out.push({ id: 'len', score: 7, icon: 'heart', color: 'pink',
    title: `Твоя комфортна зміна — ${O.len[2]}`, text: `Довгі зміни ти ${g('оцінював', 'оцінювала', 'оцінюєш')} як важкі ${s30.lgH} ${pl(s30.lgH, W_T())}. Авто-план враховує це під час планування.` });
  else if (O.ok && O.start) out.push({ id: 'start', score: 3, icon: 'heart', color: 'mint',
    title: `Найлегше даються старти ${O.start[2]}`, text: `Так виходить за ${O.n} ${pl(O.n, ['оцінкою', 'оцінками', 'оцінками'])} самопочуття. Плануй важливі тижні саме так.` });
  // 6. irregular sleep
  if (z14.n >= 5 && z14.spread > 80) out.push({ id: 'rhythm', score: 5, icon: 'moon', color: 'lilac',
    title: 'Сон гуляє в часі', text: `Час, коли ти лягаєш, коливається приблизно на ±${hm(z14.spread)}. Обери «якірний» час підйому — навіть у вихідні плюс-мінус година.` });
  // 7. sleep debt
  const debt = C.sleepDebt();
  if (debt && debt.real >= 180) out.push({ id: 'debt', score: 7, icon: 'zz', color: 'sky',
    title: `Недосип за тиждень — ${hm(debt.real)}`, text: 'Найпростіше віддати борг двома ранніми вечорами поспіль або 20-хвилинним сном удень.' });
  // 8. week hours over the norm
  const wk = C.sumR(C.monday(T), addD(C.monday(T), 6));
  const wh = wk.h + wk.ph, nr = C.norm();
  if (wh > nr * 1.12) out.push({ id: 'hours', score: 6, icon: 'work', color: 'lime',
    title: `${Math.round(wh)} год цього тижня`, text: `Це на ${Math.round(wh - nr)} год більше за твою норму в ${nr} год. Якщо можна — скороти одну зміну або заплануй довгий вихідний.` });
  // 9. DPP: yearly 300h and the monthly insurance threshold
  S.jobs.forEach((j) => {
    if (j.ct !== 'DPP') return;
    const yl = num(j.yl) || 300, u = C.yearUse(j.id, T.getFullYear()), all = u.h + u.p;
    if (all >= yl * .8) out.push({ id: 'yl' + j.id, score: all > yl ? 11 : 6, icon: 'warn', color: 'lime',
      title: `${C.esc(j.n || 'DPP')}: ${Math.round(all)} з ${yl} год за рік`, text: all > yl ? 'План перевищує річний ліміт DPP. Понад 300 год на одного роботодавця працювати за DPP не можна — переглянь графік.' : `Лишилось ~${Math.round(yl - all)} год до кінця року. Розподіли їх рівно, щоб грудень не був порожнім.` });
    const y = T.getFullYear(), m = T.getMonth();
    const fact = C.jobMonth(j.id, y, m);
    const thr = C.thrFor(C.LAW.DPP, y);
    const grossMonth = C.toM(fact.g, j.cur) / C.toM(1, 'CZK');
    if (grossMonth > thr * .85 && grossMonth < thr) out.push({ id: 'thr' + j.id, score: 7, icon: 'info', color: 'sky',
      title: `${C.esc(j.n || 'DPP')}: до порогу ${thr.toLocaleString('uk-UA')} Kc лишилось ${Math.round(thr - grossMonth).toLocaleString('uk-UA')} Kc`,
      text: 'Якщо дохід за місяць досягне порогу, з нього утримають соціальне й медичне страхування, зате з’являться лікарняні. Виріши, що для тебе вигідніше.' });
  });
  // 10. money
  const risk = C.cashRisk();
  if (risk) out.push({ id: 'cash', score: risk.lvl === 'hi' ? 10 : 6, icon: 'wallet', color: 'lime', act: ['tab', 'money'], title: risk.t, text: risk.s.replace(/<[^>]+>/g, '') });
  const [py, pm] = C.prevM();
  const adv = C.saveAdvice(py, pm);
  if (adv && adv.save > 0 && !S.sv[C.mk(py, pm)] && T.getDate() >= 3 && T.getDate() <= 20) out.push({ id: 'save', score: 5, icon: 'target', color: 'mint', act: ['tab', 'money'],
    title: `Можна відкласти ${C.kc(adv.save)}`, text: `Після базових витрат минулого місяця лишилось ${C.kc(adv.free)}. Частину відкласти — решта на життя.` });
  // 11. a free day and the things the person likes
  const fun = (S.cfg.fun || []).map((k) => (C.FUN.find((f) => f[0] === k) || [])[1]).filter(Boolean);
  for (let i = 1; i <= 4 && fun.length; i++) {
    const d = addD(T, i), k = ds(d);
    if (!C.isWd(k) && !C.absOf(k)) {
      out.push({ id: 'fun', score: 2, icon: 'sofa', color: 'pink', title: `${i === 1 ? 'Завтра' : dLong(d)} — вихідний`, text: `Гарний день для того, що ти любиш: ${fun.slice(0, 3).join(', ').toLowerCase()}.` });
      break;
    }
  }
  // fallback when there is little data yet
  if (!out.length) {
    if (!z14.n) out.push({ id: 'logsleep', score: 1, icon: 'moon', color: 'sky', act: ['sleep'], title: 'Запиши сон за кілька ночей', text: 'Після 3–4 записів Bud почне показувати, як зміни впливають на твій відпочинок.' });
    else out.push({ id: 'ok', score: 1, icon: 'heart', color: 'mint', title: 'Ритм рівний', text: 'Найближчим часом нічого не насторожує. Продовжуй відмічати сон і самопочуття — поради стануть точнішими.' });
  }
  return out.sort((a, b) => b.score - a.score);
}
const W_T = () => ['раз', 'рази', 'разів'];

/** today's face for the buddy */
export function todayMood() {
  const S = C.getState(), k = C.TK;
  const ab = C.absOf(k);
  if (ab && ab.t === 'sick') return 'sick';
  if (ab) return 'chill';
  if (C.payEvents(C.TD, 0).some((e) => e.t === 'in')) return 'proud';
  const sl = C.slDur(S.sleep[k]);
  if (sl && sl < C.sgv() * 60 - 90) return 'sleepy';
  const md = (S.mood || {})[k];
  if (md === 'tense' || md === 'sad') return md === 'tense' ? 'tense' : 'sad';
  if (md === 'tired') return 'sleepy';
  if (C.cashRisk()?.lvl === 'hi' || C.curStreak() >= 7) return 'worried';
  if (C.isOff(k) || (!C.isWd(k) && C.hasData())) return 'chill';
  const h = new Date().getHours();
  if (h >= 23 || h < 5) return 'sleepy';
  return md === 'up' ? 'up' : 'happy';
}
