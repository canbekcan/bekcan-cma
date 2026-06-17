const CACHE_NAME = 'bekcan-cma-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './schedule.json',
  './manifest.json',
  './icon.png'
];

// Install Event - caching assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - cache-first with network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh data in the background if possible (stale-while-revalidate for JSON/JS/CSS)
        if (event.request.url.includes('schedule.json') || event.request.url.includes('app.js') || event.request.url.includes('styles.css')) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => { /* Ignore fetch errors when offline */ });
        }
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
