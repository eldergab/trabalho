const CACHE_NAME = 'contatos-store-v2';
const ASSETS = [
  'index.html',
  'style.css',
  'guiatelefonico.html',
  'blocodenotas.html',
  'anotadas.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  // Force service worker to activate immediately after install
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  // Take control of uncontrolled clients
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Navigation requests (HTML pages) -> network-first
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache with fresh HTML
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Other requests -> cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Optionally cache same-origin responses
        if (request.url.startsWith(self.location.origin)) {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        }
        return response;
      });
    })
  );
});
