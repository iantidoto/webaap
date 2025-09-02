/* Cache básico con actualización en segundo plano */
const VERSION = "gz-v1";
const APP_SHELL = [
  "/webaap/",
  "/webaap/index.html",
  "/webaap/styles.css",
  "/webaap/script.js",
  "/webaap/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        try {
          const url = new URL(req.url);
          if (res.ok && req.method === "GET" && url.origin === location.origin) {
            const clone = res.clone();
            caches.open(VERSION).then((c) => c.put(req, clone));
          }
        } catch {}
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
