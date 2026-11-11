// Reminders: what to send and when, the in-app inbox, and push through the Cloudflare worker.
import * as C from './calc.js';
import { save } from './store.js';
import { PUSH_URL } from './config.js';
import { sheet, ic, toast } from './ui.js';
import { chipIc } from './stickers.js';
import { bud } from './cast.js';

const S = () => C.getState();
export const pushUrl = () => (S().push.url || PUSH_URL || '').replace(/\/+$/, '');
export const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
export const canPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const permission = () => ('Notification' in window ? Notification.permission : 'unsupported');

const at = (k, t) => { const d = C.pk(k); const m = C.tm(t); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; };

/** everything worth a reminder in the next 14 days, as [{id, at(ms), title, body, url}] */
export function schedule(days = 14) {
  const s = S(), cfg = s.cfg.nt, now = Date.now(), out = [];
  const push = (id, d, title, body, url = './') => { const t = +d; if (t > now - 60000 && t < now + days * 864e5) out.push({ id, at: t, title, body, url }); };
  for (let i = -1; i <= days; i++) {
    const day = C.addD(C.TD, i), k = C.ds(day);
    const sh = C.shOf(k).filter((x) => x.s).sort((a, b) => C.tm(a.s) - C.tm(b.s));
    sh.forEach((x, n) => {
      const j = C.job(x.j), name = j.n || 'Робота';
      const start = at(k, x.s);
      const end = new Date(+start + C.shH(x) * 3600000);
      if (cfg.shift) push(`sh-${k}-${n}`, new Date(+start - cfg.shift * 60000), `Зміна о ${x.s}`, `${name} · до ${x.e || C.mt(C.tm(x.s) + C.shH(x) * 60)}`, `./#day=${k}`);
      if (cfg.confirm && n === sh.length - 1) push(`cf-${k}`, new Date(+end + 30 * 60000), 'Як пройшла зміна?', 'Відміть самопочуття — так поради стануть точнішими.', `./#day=${k}`);
    });
    // evening before an early start: when to go to bed
    if (cfg.early && sh[0] && C.tm(sh[0].s) < 540) {
      const bedMin = C.tm(sh[0].s) - C.sgv() * 60 - C.prepv();
      const bed = at(C.ds(C.addD(day, -1)), C.mt(bedMin));
      push(`bed-${k}`, new Date(+bed - 60 * 60000), `Завтра зміна о ${sh[0].s}`, `Щоб поспати ${C.sgv()} год, лягай до ${C.mt(bedMin)}.`, `./#day=${k}`);
    }
  }
  // payouts and bills
  C.payEvents(C.addD(C.TD, 0), days).forEach((e, n) => {
    const k = C.ds(e.d);
    if (e.t === 'in' && cfg.pay) push(`pay-${k}-${n}`, at(k, '09:00'), e.gig ? 'Сьогодні оплата' : 'Сьогодні виплата', `${e.n}: ~${C.kc(e.a)}`, './#tab=money');
    if (e.t === 'out' && cfg.bill) push(`bill-${k}-${n}`, at(C.ds(C.addD(e.d, -1)), '18:00'), `Завтра платіж: ${e.n}`, C.kc(e.a), './#tab=money');
  });
  // Sunday evening: the next week is still empty
  if (cfg.plan) {
    const sun = C.addD(C.monday(C.TD), 6), nextMon = C.addD(sun, 1);
    let any = false; for (let i = 0; i < 7; i++) if (C.isWd(C.ds(C.addD(nextMon, i))) || C.isOff(C.ds(C.addD(nextMon, i)))) any = true;
    if (!any) push(`plan-${C.ds(sun)}`, at(C.ds(sun), '18:00'), 'Тиждень ще не сплановано', 'Склади план за хвилину — Bud підбере зміни під твій ритм.', './#plan=w');
  }
  return out.sort((a, b) => a.at - b.at).slice(0, 60);
}

/* ---------- in-app inbox ---------- */
// keeps reminders whose time came in the last 3 days, plus warnings
export function inbox() {
  const s = S(), now = Date.now();
  const items = schedule(1).concat(pastWindow()).filter((x) => x.at <= now && x.at > now - 3 * 864e5);
  const seen = new Set(); const list = [];
  for (const x of items.sort((a, b) => b.at - a.at)) { if (seen.has(x.id) || s.nt.del[x.id]) continue; seen.add(x.id); list.push({ ...x, read: !!s.nt.read[x.id] }); }
  return list;
}
function pastWindow() {
  // rebuild the last 3 days' reminders (schedule() only looks forward)
  const keep = C.TD, out = [];
  const back = C.addD(C.TD, -3);
  for (let i = 0; i < 3; i++) {
    const k = C.ds(C.addD(back, i)), sh = C.shOf(k).filter((x) => x.s);
    if (sh.length && S().cfg.nt.confirm && sh.some((x) => x.pl)) {
      const last = sh.sort((a, b) => C.tm(b.s) - C.tm(a.s))[0];
      out.push({ id: `cf-${k}`, at: +at(k, last.s) + C.shH(last) * 3600000 + 1800000, title: 'Як пройшла зміна?', body: `${C.dLong(C.pk(k))}: підтверди зміну, щоб вона пішла у факт.`, url: `./#day=${k}` });
    }
  }
  C.payEvents(back, 3).forEach((e, n) => { if (e.t === 'in') out.push({ id: `pay-${C.ds(e.d)}-${n}`, at: +at(C.ds(e.d), '09:00'), title: 'Виплата', body: `${e.n}: ~${C.kc(e.a)}`, url: './#tab=money' }); });
  return out;
}
export const unread = () => inbox().filter((x) => !x.read).length;

export function updateBadge() {
  const n = unread();
  if ('setAppBadge' in navigator && permission() === 'granted') (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {});
  return n;
}

export function openInbox(go) {
  const render = () => {
    const L = inbox();
    if (!L.length) return `<div class="empty">${bud('chill')}<b>Тут тихо</b><span>Нагадування про зміни, сон і виплати зʼявлятимуться тут.</span></div>`;
    return L.map((x) => `<button class="nt ${x.read ? '' : 'unread'}" data-id="${x.id}" data-url="${x.url}">${x.id.startsWith('pay') ? chipIc('coin', 'lime') : x.id.startsWith('bill') ? chipIc('wallet', 'yellow') : x.id.startsWith('bed') ? chipIc('moon', 'sky') : x.id.startsWith('cf') ? chipIc('heart', 'pink') : x.id.startsWith('plan') ? chipIc('cal', 'lilac') : chipIc('shift', 'orange')}
      <span class="grow"><b>${C.esc(x.title)}</b><span>${C.esc(x.body)}</span></span></button>`).join('');
  };
  sheet({
    title: 'Сповіщення', html: render(),
    foot: unread() ? '<button class="btn white wide" id="ntAll">Позначити все прочитаним</button>' : '',
    onMount(s) {
      s.body.onclick = (e) => {
        const b = e.target.closest('[data-id]'); if (!b) return;
        S().nt.read[b.dataset.id] = Date.now(); save(); updateBadge();
        s.close(); setTimeout(() => go(b.dataset.url), 200);
      };
      const all = s.el.querySelector('#ntAll');
      all && (all.onclick = () => { inbox().forEach((x) => { S().nt.read[x.id] = Date.now(); }); save(); updateBadge(); s.set(render()); all.remove(); });
    }
  });
}

/* ---------- local notifications while the app is open ---------- */
let localTimer = 0;
export function armLocal() {
  clearTimeout(localTimer);
  if (permission() !== 'granted' || S().push.on) return; // push server handles it
  const next = schedule(1).find((x) => x.at > Date.now());
  if (!next) return;
  const wait = Math.min(next.at - Date.now(), 2 ** 31 - 1);
  localTimer = setTimeout(async () => {
    const reg = await navigator.serviceWorker?.getRegistration();
    try { reg ? reg.showNotification(next.title, { body: next.body, icon: './icons/icon-192.png', tag: next.id, data: { url: next.url } }) : new Notification(next.title, { body: next.body }); } catch (e) { /* ignore */ }
    armLocal();
  }, wait);
}

/* ---------- push ---------- */
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };

/** asks permission, subscribes this phone and sends the schedule. Must run from a tap. */
export async function enablePush() {
  if (!canPush()) throw new Error(standalone() ? 'Цей iPhone не підтримує сповіщення. Потрібен iOS 16.4 або новіший.' : 'Спершу додай Bud на початковий екран і відкрий його з іконки.');
  const url = pushUrl();
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Сповіщення вимкнені. Їх можна дозволити в Параметрах iPhone → Bud.');
  if (!url) { S().push.on = false; save(); armLocal(); return 'local'; }
  const reg = await navigator.serviceWorker.ready;
  const r = await fetch(url + '/vapid');
  if (!r.ok) throw new Error('Сервер сповіщень не відповідає. Перевір адресу в налаштуваннях.');
  const { key } = await r.json();
  let sub = await reg.pushManager.getSubscription();
  if (sub) { try { const k = b64u(sub.options.applicationServerKey); if (k !== key) { await sub.unsubscribe(); sub = null; } } catch (e) { /* keep */ } }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64u(key) });
  S().push.on = true; save();
  await syncPush(true, sub);
  return 'push';
}

export async function disablePush() {
  const url = pushUrl();
  S().push.on = false; save();
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    if (url) await fetch(url + '/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S().push.id, remove: true }) });
  } catch (e) { /* offline — the server drops it on the next failed send */ }
}

let lastHash = '', syncT = 0;
export function queueSync() { clearTimeout(syncT); syncT = setTimeout(() => syncPush(false), 2500); }
export async function syncPush(force = false, subIn) {
  const s = S(), url = pushUrl();
  if (!s.push.on || !url || permission() !== 'granted') return;
  const items = schedule(14);
  const hash = JSON.stringify(items.map((x) => [x.id, x.at, x.title, x.body]));
  if (!force && hash === lastHash && Date.now() - (s.push.ts || 0) < 6 * 3600000) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = subIn || await reg.pushManager.getSubscription();
    if (!sub) { s.push.on = false; save(); return; }
    const r = await fetch(url + '/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: s.push.id, sub: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, items }) });
    if (r.ok) { lastHash = hash; s.push.ts = Date.now(); save(); }
  } catch (e) { /* offline: try again next time the app opens */ }
}

export async function testPush() {
  const url = pushUrl();
  if (!url || !S().push.on) { toast('Спершу увімкни сповіщення'); return; }
  const r = await fetch(url + '/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S().push.id }) }).catch(() => null);
  toast(r && r.ok ? 'Надіслано. Закрий Bud — сповіщення прийде за кілька секунд' : 'Сервер не відповів');
}
