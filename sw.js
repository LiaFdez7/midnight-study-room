/*
  Midnight Study Room: offline helper (service worker)
  ----------------------------------------------------
  Keeps a copy of the room's own files so the app opens without internet.
  It never touches requests to Google (your sheet connector): those always go
  straight to the network, and the room queues changes until you're back online.
  You don't need to edit this file. The build stamps a new VERSION on every update.
*/
const VERSION = "d31116b86913";
const CACHE = 'msr-' + VERSION;
const SHELL = [
  "./",
  "index.html",
  "stage.css",
  "stage.js",
  "dc-runtime.js",
  "pwa.js",
  "manifest.webmanifest",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "fonts/fonts.css",
  "room-worlds-core.js",
  "enchanted-room.js",
  "enchanted-room.css",
  "fonts/cormorant-garamond-latin-500-italic.woff2",
  "fonts/cormorant-garamond-latin-500-normal.woff2",
  "fonts/cormorant-garamond-latin-600-italic.woff2",
  "fonts/cormorant-garamond-latin-600-normal.woff2",
  "fonts/dm-sans-latin-400-normal.woff2",
  "fonts/dm-sans-latin-500-normal.woff2",
  "fonts/dm-sans-latin-600-normal.woff2",
  "fonts/jetbrains-mono-latin-500-normal.woff2",
  "icons/icon.svg",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('msr-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // sync requests (POST) are never cached
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;         // Google, Canvas, fonts elsewhere: untouched

  if (req.mode === 'navigate') {
    // The page itself: try the network first (so updates arrive), fall back to the saved copy offline.
    event.respondWith(
      withTimeout(fetch(req), 4000)
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); }
          return res;
        })
        .catch(() => caches.match('./', { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // Everything else (styles, scripts, fonts, icons): the saved copy first, the network if missing.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});

// Clicking a "focus block finished" notification brings the room to the front.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow('./');
    })
  );
});
