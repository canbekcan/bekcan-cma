const CACHE_NAME = 'bekcan-cma-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/schedule.html',
  '/styles.css',
  '/state.js',
  '/ui.js',
  '/modals.js',
  '/app.js',
  '/landing.js',
  '/manifest.json',
  '/icon.png'
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

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML pages) - network-first, offline fallback to /schedule.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/schedule.html') || caches.match('/index.html');
      })
    );
    return;
  }

  // Static assets - cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh data in the background if possible (stale-while-revalidate for JS/CSS)
        if (event.request.url.includes('app.js') || event.request.url.includes('state.js') || event.request.url.includes('ui.js') || event.request.url.includes('modals.js') || event.request.url.includes('styles.css') || event.request.url.includes('landing.js')) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => { /* Ignore fetch errors */ });
        }
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
