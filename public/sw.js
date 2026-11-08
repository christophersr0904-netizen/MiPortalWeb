/**
 * Service Worker Canónico para Suite PMO Personal & Life OS
 * Estrategia: Stale-While-Revalidate para recursos estáticos y Cache-First con fallback offline
 */

const CACHE_NAME = 'pmo-cache-v2.5-cockpit-restore';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Escuchar mensaje para forzar activación inmediata
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.type === 'FORCE_REFRESH')) {
    self.skipWaiting();
  }
});

// 1. Instalación: Precargar shell de la aplicación y omitir espera de inmediato (auto-invalidación)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Error en precarga de assets estáticos:', err);
      });
    })
  );
});

// 2. Activación: Purgar versiones antiguas y reclamar clientes de inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Interceptación con Stale-While-Revalidate y Cache-First para fuentes
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo peticiones GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Regla específica: Cache-First para Google Fonts (stylesheets y fuentes woff2)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(req).then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Ignorar llamadas a Supabase, extensiones del navegador o entorno de desarrollo local (Vite HMR)
  if (
    url.hostname.includes('supabase.co') ||
    url.protocol.startsWith('chrome-extension') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('node_modules')
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
        .catch(async () => {
          // Si estamos offline y es navegación, entregar index.html en caché
          if (req.mode === 'navigate') {
            const fallback =
              (await caches.match('./')) ||
              (await caches.match('./index.html')) ||
              (await caches.match('/index.html'));
            if (fallback) return fallback;
          }
          // Si no hay respuesta en caché ni red, retornar respuesta de error válida (nunca undefined)
          if (cachedResponse) return cachedResponse;
          return new Response('PMO Offline - Recurso no disponible en caché', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });

      // Devolver inmediatamente desde caché si existe (0 ms), o esperar red
      return cachedResponse || fetchPromise;
    })
  );
});
