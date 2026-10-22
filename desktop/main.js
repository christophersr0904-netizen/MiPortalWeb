const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let widgetWin = null;

// Bloqueo de instancia única para evitar múltiples widgets o caídas en ventana predeterminada
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (widgetWin) {
      if (!widgetWin.isVisible()) widgetWin.show();
      if (widgetWin.isMinimized()) widgetWin.restore();
      widgetWin.focus();
    }
  });
}

function toggleWidgetVisibility() {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  if (widgetWin.isVisible()) {
    widgetWin.hide();
  } else {
    widgetWin.show();
    widgetWin.focus();
  }
}

function resetWidgetPosition() {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  widgetWin.setPosition(width - 390, 40);
  if (!widgetWin.isVisible()) {
    widgetWin.show();
  }
  widgetWin.focus();
}

function createWidget() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  widgetWin = new BrowserWindow({
    width: 360,
    height: 64,
    x: width - 390,
    y: 40,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true, // <-- OCULTA COMPLETAMENTE DE LA BARRA DE TAREAS DE WINDOWS
    hasShadow: false,
    focusable: true,
    type: 'toolbar', // Modo herramienta/widget para Windows 11
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const targetUrl = process.env.WIDGET_URL || 'https://miportalweb-aft.pages.dev/?mode=hud&widget=desktop';
  widgetWin.loadURL(targetUrl);

  // Inicialización de la Bandeja del Sistema (System Tray / Iconos Ocultos)
  if (!tray) {
    try {
      const iconPath = path.join(__dirname, '../public/icon-192.png');
      const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      tray = new Tray(trayIcon);
      tray.setToolTip('Cockpit de Ejecución Diaria PMO');

      const contextMenu = Menu.buildFromTemplate([
        { label: 'Mostrar / Ocultar Cockpit', click: () => toggleWidgetVisibility() },
        { type: 'separator' },
        { label: 'Reiniciar Posición', click: () => resetWidgetPosition() },
        {
          label: 'Salir por completo',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]);

      tray.setContextMenu(contextMenu);
      tray.on('click', () => toggleWidgetVisibility());
    } catch (err) {
      console.warn('[Desktop Widget] Error al instanciar Tray:', err);
    }
  }

  ipcMain.on('widget-expand', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    const currentDisplay = screen.getPrimaryDisplay();
    const curWidth = currentDisplay.workAreaSize.width;
    widgetWin.setResizable(true);
    widgetWin.setSize(420, 700);
    widgetWin.setPosition(curWidth - 440, 40);
  });

  // Ajuste cinemático de redimensionamiento: timeout de 80ms para esperar animación CSS
  ipcMain.on('widget-collapse', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    setTimeout(() => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const currentDisplay = screen.getPrimaryDisplay();
      const curWidth = currentDisplay.workAreaSize.width;
      widgetWin.setSize(360, 64);
      widgetWin.setPosition(curWidth - 390, 40);
      widgetWin.setResizable(false);
    }, 80);
  });

  // Interceptar widget-close: en lugar de quit(), ocultar a la bandeja del sistema
  ipcMain.on('widget-close', () => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      widgetWin.hide();
    }
  });
}

app.whenReady().then(createWidget);

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (app.isQuitting) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWidget();
  } else if (widgetWin) {
    widgetWin.show();
    widgetWin.focus();
  }
});
