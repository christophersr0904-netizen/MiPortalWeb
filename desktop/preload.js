const { contextBridge, ipcRenderer } = require('electron');

// Exposición segura del puente IPC en window.desktopWidget
contextBridge.exposeInMainWorld('desktopWidget', {
  expand: () => ipcRenderer.send('widget-expand'),
  collapse: () => ipcRenderer.send('widget-collapse'),
  close: () => ipcRenderer.send('widget-close'),
  isNative: true
});
