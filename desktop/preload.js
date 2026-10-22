const { contextBridge, ipcRenderer } = require('electron');

// Exposición segura del puente IPC en window.desktopWidget
contextBridge.exposeInMainWorld('desktopWidget', {
  expand: () => ipcRenderer.send('widget-expand'),
  collapse: () => ipcRenderer.send('widget-collapse'),
  close: () => ipcRenderer.send('widget-close'),
  isNative: true
});

// Heartbeat de coexistencia exclusiva para notificar al bus que el widget nativo está activo
try {
  const channel = new BroadcastChannel('pmo_hud_bus');
  setInterval(() => {
    channel.postMessage({ type: 'DESKTOP_WIDGET_ALIVE', timestamp: Date.now() });
  }, 1000);
} catch (e) {
  // Ignorar si BroadcastChannel no está instanciado en este contexto
}
