/**
 * Service Worker Canónico para Suite PMO Personal & Life OS
 * Estrategia: Network-First para navegación HTML, Cache-First para fuentes y Stale-While-Revalidate para assets validados
 */

const CACHE_NAME = 'pmo-cache-1794535986767';
const STATIC_ASSETS = [
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

async function obtenerFallbackNavegacion(req) {
  return (
    (req ? await caches.match(req) : undefined) ||
    (await caches.match('./')) ||
    (await caches.match('./index.html')) ||
    (await caches.match('/index.html'))
  );
}

function respuestaOffline(mensaje, status = 503, statusText = 'Service Unavailable') {
  return new Response(mensaje, {
    status,
    statusText,
    headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
  });
}

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

// 2. Activación: Purgar cachés huérfanas de versiones previas y reclamar clientes de inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Purgando caché obsoleta:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch: Interceptación con Network-First en navegación HTML y Stale-While-Revalidate en assets estáticos
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

  // REQ-MOBILE-47-EXEC: Excluir tajantemente llamadas a APIs externas (Google Calendar, Supabase, cotizaciones)
  // El Service Worker únicamente intercepta y cachea recursos del mismo origen (más Google Fonts manejado arriba)
  const esOrigenLocal = url.origin === self.location.origin;
  if (!esOrigenLocal) {
    return;
  }

  // Ignorar el propio script SW o entorno local de desarrollo (Vite HMR)
  if (
    url.pathname.endsWith('/sw.js') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('node_modules')
  ) {
    return;
  }

  // Navegación HTML siempre Network-First para descargar siempre referencias frescas de bundles
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          const contentType = networkResponse?.headers?.get('content-type') || '';
          if (networkResponse && networkResponse.status === 200 && contentType.includes('text/html')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const fallback = await obtenerFallbackNavegacion(req);
          if (fallback) return fallback;
          return respuestaOffline('PMO Offline - Documento no disponible en caché');
        })
    );
    return;
  }

  // Interceptar assets locales con Stale-While-Revalidate (protegido contra MIME fallback HTML de chunks antiguos)
  const esScriptOCss =
    url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs') || url.pathname.endsWith('.css');

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          const contentType = networkResponse?.headers?.get('content-type') || '';
          if (esScriptOCss && contentType.includes('text/html')) {
            return respuestaOffline('Chunk obsoleto no disponible', 404, 'Chunk Outdated');
          }

          // Almacenar copia si es válida (HTTP 200 y mismo origen o CORS)
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
          if (req.mode === 'navigate') {
            const fallback = await obtenerFallbackNavegacion();
            if (fallback) return fallback;
          }
          if (cachedResponse) return cachedResponse;
          return respuestaOffline('PMO Offline - Recurso no disponible en caché');
        });

      // Devolver inmediatamente desde caché si existe (0 ms), o esperar red
      return cachedResponse || fetchPromise;
    })
  );
});
