// Telemetría de Alta Precisión (REQ-PERF-02)
if (typeof performance !== 'undefined' && performance.mark) {
  performance.mark('t0_bootstrap');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { db } from './db/db';
import './index.css';

const esHostnameLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    (window as any).IS_DESKTOP_WIDGET === true);

function purgarServiceWorkersYCachesLocales() {
  if (typeof window === 'undefined') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((exito) => {
          if (exito) {
            console.log('[PWA LOCAL] Service Worker eliminado:', registration.scope);
          }
        });
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).then((exito) => {
          if (exito) {
            console.log('[PWA LOCAL] CacheStorage eliminado:', name);
          }
        });
      }
    });
  }
}

// Desregistro inmediato e incondicional de cualquier Service Worker (Cloudflare / PWA) en localhost/127.0.0.1 (REQ-FIX-16)
if (esHostnameLocal) {
  purgarServiceWorkersYCachesLocales();
}

function renderizarPantallaEmergencia(origen: string, err: unknown) {
  console.error(`[Bootstrap Fatal Error - ${origen}]`, err);
  const target = document.getElementById('root') || document.body;
  if (!target) return;

  const mensaje = err instanceof Error ? err.message : String(err || 'Error desconocido');
  const stack = err instanceof Error && err.stack ? err.stack : '';

  target.replaceChildren();

  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'min-height:100vh;background:#040711;color:#f8fafc;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,sans-serif;';

  const card = document.createElement('div');
  card.style.cssText =
    'max-width:680px;width:100%;background:#0D1526;border:1px solid rgba(244,63,94,0.45);border-radius:16px;padding:24px;box-shadow:0 20px 40px rgba(2,6,23,0.85);';

  const badge = document.createElement('div');
  badge.style.cssText =
    'font-family:monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#fb7185;margin-bottom:8px;';
  badge.textContent = `Fallo Crítico de Inicialización (${origen})`;

  const title = document.createElement('h1');
  title.style.cssText = 'font-size:18px;font-weight:800;margin:0 0 8px 0;color:#f8fafc;';
  title.textContent = 'No se pudo montar el DOM raíz de PMO Personal & Life OS';

  const desc = document.createElement('p');
  desc.style.cssText = 'font-size:13px;color:#94a3b8;margin:0 0 16px 0;line-height:1.5;';
  desc.textContent =
    'Se interceptó una excepción fatal antes o durante el montaje de React para evitar pantalla en blanco. Tus datos en IndexedDB permanecen intactos.';

  const pre = document.createElement('pre');
  pre.style.cssText =
    'background:#020617;border:1px solid rgba(51,65,85,0.6);border-radius:10px;padding:12px;font-family:monospace;font-size:11px;line-height:1.45;color:#fda4af;overflow:auto;max-height:240px;white-space:pre-wrap;word-break:break-word;margin:0 0 16px 0;';
  pre.textContent = stack ? `${mensaje}\n\n${stack}` : mensaje;

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';

  const btnReload = document.createElement('button');
  btnReload.type = 'button';
  btnReload.textContent = 'Recargar Aplicación';
  btnReload.style.cssText =
    'padding:8px 14px;border-radius:10px;border:1px solid rgba(56,189,248,0.45);background:rgba(14,165,233,0.2);color:#7dd3fc;font-size:12px;font-weight:700;cursor:pointer;';
  btnReload.onclick = () => window.location.reload();

  const btnPurge = document.createElement('button');
  btnPurge.type = 'button';
  btnPurge.textContent = 'Purgar SW / Caché y Recargar';
  btnPurge.style.cssText =
    'padding:8px 14px;border-radius:10px;border:1px solid rgba(244,63,94,0.4);background:rgba(244,63,94,0.15);color:#fda4af;font-size:12px;font-weight:700;cursor:pointer;';
  btnPurge.onclick = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } finally {
      window.location.reload();
    }
  };

  actions.append(btnReload, btnPurge);
  card.append(badge, title, desc, pre, actions);
  wrapper.append(card);
  target.append(wrapper);
}

// Vigilancia global durante arranque: si #root queda vacío tras error fatal, mostrar rescate
window.addEventListener('error', (event) => {
  const rootEl = document.getElementById('root');
  if (!rootEl || rootEl.childElementCount === 0) {
    renderizarPantallaEmergencia('window.error', event.error || event.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const rootEl = document.getElementById('root');
  if (!rootEl || rootEl.childElementCount === 0) {
    renderizarPantallaEmergencia('unhandledrejection', event.reason);
  }
});

// Verificación explícita de apertura Dexie sin bloquear render inicial
db.open().catch((err) => {
  console.error('[Dexie] Error al abrir IndexedDB:', err);
  const rootEl = document.getElementById('root');
  if (!rootEl || rootEl.childElementCount === 0) {
    renderizarPantallaEmergencia('Dexie db.open()', err);
  }
});

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('Elemento contenedor #root no encontrado en index.html');
  }
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  renderizarPantallaEmergencia('ReactDOM.createRoot', err);
}

// Prevención de ChunkLoadError por desincronización de caché en lazy loading
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

// Registro de Service Worker PWA ÚNICAMENTE en producción remota (nunca en localhost / 127.0.0.1 / Electron loopback)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD && !esHostnameLocal) {
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
    purgarServiceWorkersYCachesLocales();
  }
}

