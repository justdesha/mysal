// Bud service worker: works offline and shows push notifications.
// Bump VERSION with every release so phones pick up the new files.
const VERSION = 'bud-1.0.1';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/calc.js', './js/store.js', './js/ui.js', './js/buddy.js', './js/care.js', './js/notify.js', './js/config.js',
  './js/today.js', './js/schedule.js', './js/money.js', './js/me.js', './js/onboarding.js', './js/whatsnew.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon.png',
  './fonts/dela-gothic-one-cyrillic-400-normal.woff2', './fonts/dela-gothic-one-latin-400-normal.woff2',
  './fonts/rubik-cyrillic-400-normal.woff2', './fonts/rubik-latin-400-normal.woff2',
  './fonts/rubik-cyrillic-500-normal.woff2', './fonts/rubik-latin-500-normal.woff2',
  './fonts/rubik-cyrillic-700-normal.woff2', './fonts/rubik-latin-700-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => caches.keys()).then((k) => {
    // coming from Bud 0.9.x: take over right away, there is nothing to ask about
    if (k.some((x) => x.startsWith('bud-0.'))) return self.skipWaiting();
  }));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== VERSION).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});

self.addEventListener('push', (e) => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch (er) { m = { title: 'Bud', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Bud', {
    body: m.body || '', tag: m.tag || undefined, icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url: m.url || './' }
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.postMessage({ open: url }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
