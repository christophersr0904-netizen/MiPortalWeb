/**
 * Service Worker Canónico para Suite PMO Personal & Life OS
 * Estrategia: Stale-While-Revalidate para recursos estáticos y Cache-First con fallback offline
 */

const CACHE_NAME = 'pmo-cache-v2.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

// 1. Instalación: Precargar shell de la aplicación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Error en precarga de assets estáticos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activación: Purgar versiones antiguas y reclamar clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Interceptación con Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo peticiones GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ignorar llamadas a Supabase, Google Sheets API o servidores externos de datos
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('googleapis.com') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // Interceptar navegación y assets locales
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          // Almacenar copia si es válida (HTTP 200 y mismo origen o fuentes)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si estamos offline y es navegación, entregar index.html en caché
          if (req.mode === 'navigate') {
            return caches.match('./') || caches.match('./index.html') || caches.match('/index.html');
          }
          return cachedResponse;
        });

      // Devolver inmediatamente desde caché si existe (0 ms), o esperar red
      return cachedResponse || fetchPromise;
    })
  );
});
