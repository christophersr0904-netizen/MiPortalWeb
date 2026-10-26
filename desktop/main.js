const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Configuración de switches y flags antes de whenReady
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let tray = null;
let widgetWin = null;
let statusServer = null;

// Bloqueo de instancia única estricto
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Micro-servidor HTTP loopback en 127.0.0.1:48123 para handshake, exclusión mutua y sync local
try {
  statusServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ desktopWidgetAlive: true, timestamp: Date.now() }));
      return;
    }

    if (req.url === '/api/sync-data' && req.method === 'GET') {
      try {
        const storeDir = app.getPath('userData');
        const storePath = path.join(storeDir, 'local_pmo_store.json');
        if (fs.existsSync(storePath)) {
          const content = fs.readFileSync(storePath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(content);
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ version: 1, timestamp: Date.now(), data: null }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url === '/api/sync-data' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const storeDir = app.getPath('userData');
          if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir, { recursive: true });
          }
          const storePath = path.join(storeDir, 'local_pmo_store.json');
          fs.writeFileSync(storePath, JSON.stringify(parsed, null, 2), 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON inválido o error al persistir: ' + err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  statusServer.listen(48123, '127.0.0.1');
  statusServer.on('error', (err) => {
    console.warn('[Desktop Widget] Servidor loopback ocupado o reintento:', err.message);
  });
} catch (err) {
  console.warn('[Desktop Widget] Error al iniciar servidor de status local:', err);
}

app.on('second-instance', () => {
  if (widgetWin) {
    if (!widgetWin.isVisible()) widgetWin.show();
    if (widgetWin.isMinimized()) widgetWin.restore();
    widgetWin.focus();
  }
});

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

  // Ajuste cinemático de redimensionamiento: timeout calibrado a 200ms para empatar con CSS Tailwind
  ipcMain.on('widget-collapse', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    setTimeout(() => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      const currentDisplay = screen.getPrimaryDisplay();
      const curWidth = currentDisplay.workAreaSize.width;
      widgetWin.setSize(360, 64);
      widgetWin.setPosition(curWidth - 390, 40);
      widgetWin.setResizable(false);
    }, 200);
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
  if (statusServer) {
    try {
      statusServer.close();
    } catch {}
  }
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
