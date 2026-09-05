const CACHE_NAME = 'weekly-schedule-v10';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './restore.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(
      ASSETS.map((url) => new Request(url, { cache: 'reload' }))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always prefer a fresh copy when online, so updates show up
// on the very next reload instead of waiting on stale cache. Cache is only
// used as an offline fallback. { cache: 'no-store' } is required here —
// without it, a plain fetch() still honors GitHub Pages' Cache-Control
// header (max-age=600) and can silently reuse a stale response from the
// browser's own HTTP cache for up to 10 minutes, even though this handler
// looks like it's hitting the network every time.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
