const CACHE_NAME = 'iso-week-number-cache-v2';

const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/app.css',
  '/favicon.svg',
  '/favicon-viikkonro-20260915.svg',
  '/logo-mark.svg',
  '/logo-horizontal.svg',
  '/fonts/bricolage-grotesque-variable-latin.a79fdb52.woff2',
  '/fonts/inter-variable-latin.3100e775.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => {
        if (self.clients && typeof self.clients.claim === 'function') {
          return self.clients.claim();
        }
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request && event.request.method && event.request.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  const origin = self.location ? self.location.origin : url.origin;

  // Bypass non-http protocols, cross-origin requests, API endpoints, private pages, and the worker itself
  if (
    url.origin !== origin ||
    !url.protocol.startsWith('http') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/tiimin-lomat') ||
    url.pathname.startsWith('/widget/') ||
    url.pathname.startsWith('/pdf/') ||
    url.pathname === '/service-worker.js'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            (networkResponse.type &&
              networkResponse.type !== 'basic' &&
              networkResponse.type !== 'cors')
          ) {
            return networkResponse;
          }

          if (typeof networkResponse.clone === 'function') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch((error) => {
          if (
            event.request &&
            (event.request.mode === 'navigate' ||
              (event.request.headers &&
                typeof event.request.headers.get === 'function' &&
                event.request.headers.get('accept')?.includes('text/html')))
          ) {
            return caches.match(event.request).then((match) => {
              if (match) return match;
              return caches.match('/').then((rootMatch) => {
                if (rootMatch) return rootMatch;
                return caches.match('/index.html');
              });
            });
          }
          throw error;
        });
    })
  );
});
