// Offline shell for the song quiz. Song clips/data always come live from Deezer/Apple (never cached here).
const CACHE = "song-quiz-v19";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./mqtt.min.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
// network first (so updates arrive), but if the network is slow or down, answer from the saved copy after 4 s
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;      // only our own files
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(e.request).then(r => { if (r && r.ok) cache.put(e.request, r.clone()).catch(() => {}); return r; });
    const saved = await cache.match(e.request, { ignoreSearch: true });
    if (!saved) return net.catch(() => cache.match("./index.html"));
    try { const r = await Promise.race([net, new Promise(res => setTimeout(() => res(null), 4000))]); return r || saved; }
    catch (err) { return saved; }
  })());
});
