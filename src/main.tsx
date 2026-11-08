// Telemetría de Alta Precisión (REQ-PERF-02)
if (typeof performance !== 'undefined' && performance.mark) {
  performance.mark('t0_bootstrap');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Prevención de ChunkLoadError por desincronización de caché en lazy loading
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

// Registro de Service Worker PWA ÚNICAMENTE en producción para evitar secuestro de caché en desarrollo
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado exitosamente:', reg.scope);
        reg.update().catch((err) => {
          console.warn('[PWA] Error en reg.update():', err);
        });
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch(() => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            reg.update().catch(() => {});
          })
          .catch((err) => {
            console.warn('[PWA] Error al registrar Service Worker:', err);
          });
      });
  } else {
    // Modo Desarrollo: Desactivar y limpiar Service Workers para garantizar HMR limpio y sin interferencias
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister().then((exito) => {
          if (exito) {
            console.log('[PWA DEV] Service Worker residual eliminado exitosamente:', reg.scope);
          }
        });
      }
    });

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const k of keys) {
          caches.delete(k).then(() => {
            console.log('[PWA DEV] Caché residual eliminada:', k);
          });
        }
      });
    }
  }
}

