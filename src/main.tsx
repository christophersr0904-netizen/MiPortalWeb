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

// Registro de Service Worker PWA forzando actualización inmediata
if ('serviceWorker' in navigator) {
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
}

