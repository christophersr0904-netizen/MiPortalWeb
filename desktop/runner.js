/**
 * ============================================================================
 * ARCHIVO: desktop/runner.js
 * SISTEMA: PMO Personal Modular (Módulo 5 - Desktop HUD Windows)
 * RUNTIME: Electron / Node.js
 * ROL: Lanzador nativo de ventana flotante ultra-ligera (Always on Top) para Windows
 * ============================================================================
 */

const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow = null;

function createHudWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
    minWidth: 340,
    minHeight: 520,
    maxWidth: 420,
    maxHeight: 700,
    alwaysOnTop: true, // Modo HUD flotante sobre todas las ventanas
    frame: false, // Frameless para diseño limpio Cobalt Aerodynamic
    transparent: true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false // No congelar cuando esté en segundo plano
    }
  });

  // Carga del bundle Vite en modo HUD (?mode=hud)
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/?mode=hud');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { mode: 'hud' }
    });
  }

  // Atajo global para alternar visibilidad (Ctrl+Shift+H o Cmd+Shift+H)
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createHudWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createHudWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
