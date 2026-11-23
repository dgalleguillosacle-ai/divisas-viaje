// Divisas Viaje: guarda la app en el teléfono para que abra sin internet.
const CACHE = "divisas-viaje-v1";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Las tasas de cambio (otros sitios) van directo a internet; la app maneja el modo sin conexión.
  if (url.origin !== self.location.origin) return;
  // Archivos de la app: responde desde el teléfono y actualiza en segundo plano.
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(cached => {
        const net = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached || (req.mode === "navigate" ? cache.match("./index.html") : undefined));
        return cached || net;
      })
    )
  );
});
