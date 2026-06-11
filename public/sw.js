// Service Worker para Sandbook PWA
const CACHE_NAME = 'sandbook-v4.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/papel.png',
  '/piedra.png',
  '/madera.png',
  '/vidrio.png',
  '/cobre.png',
  '/plata.png',
  '/oro.png',
  '/diamante.png',
  '/btc.png',
  '/1.png', '/2.png', '/3.png', '/4.png', '/5.png',
  '/6.png', '/7.png', '/8.png', '/9.png', '/10.png',
  '/11.png', '/12.png', '/13.png', '/14.png', '/15.png',
  '/16.png', '/17.png', '/18.png', '/19.png', '/20.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.map(name => name !== CACHE_NAME ? caches.delete(name) : null)
      ))
      .then(() => clients.claim())
  );
});

// Allow the client to trigger skipWaiting manually as a fallback
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('manifest.json') ||
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        });
      })
      .catch(() => {
        if (event.request.mode === 'navigate') return caches.match('/');
      })
  );
});

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification('Sandbook', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
