// MySal: працює офлайн. Щоб оновити застосунок у друзів — заміни index.html і збільш номер версії нижче.
const C = "mysal-0.5";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    // спершу свіжа версія (з тайм-аутом), без інтернету — збережена
    const net = fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put("./index.html", cp)); return res; });
    const late = new Promise(res => setTimeout(res, 3000)).then(() => caches.match("./index.html"));
    e.respondWith(Promise.race([net, late]).then(x => x || net).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; })));
});
