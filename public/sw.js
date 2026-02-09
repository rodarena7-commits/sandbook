// Service Worker para Sandbook PWA
const CACHE_NAME = 'sandbook-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  // Iconos de niveles
  '/papel.png',
  '/piedra.png',
  '/madera.png',
  '/vidrio.png',
  '/cobre.png',
  '/plata.png',
  '/oro.png',
  '/diamante.png',
  '/btc.png',
  // Insignias (1-20)
  '/1.png',
  '/2.png',
  '/3.png',
  '/4.png',
  '/5.png',
  '/6.png',
  '/7.png',
  '/8.png',
  '/9.png',
  '/10.png',
  '/11.png',
  '/12.png',
  '/13.png',
  '/14.png',
  '/15.png',
  '/16.png',
  '/17.png',
  '/18.png',
  '/19.png',
  '/20.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Cache First, Network Fallback
self.addEventListener('fetch', event => {
  // Excluir Firebase y APIs externas del cache
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve del cache si existe
        if (response) {
          return response;
        }
        
        // Si no está en cache, hace fetch y cachea para próxima vez
        return fetch(event.request).then(response => {
          // Verifica que sea una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona la respuesta para cachear
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback para offline
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Manejar mensajes push (notificaciones)
self.addEventListener('push', event => {
  const title = 'Sandbook';
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
