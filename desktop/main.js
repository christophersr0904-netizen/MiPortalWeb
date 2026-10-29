// Si fue invocado en un entorno con ELECTRON_RUN_AS_NODE o invocado como script Node directo
if (process.env.ELECTRON_RUN_AS_NODE || typeof require('electron') === 'string') {
  const electronPath = typeof require('electron') === 'string' ? require('electron') : 'electron';
  const { spawn } = require('child_process');
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(electronPath, [__filename, ...process.argv.slice(2)], {
    env,
    stdio: 'inherit',
    windowsHide: false
  });
  child.on('close', (code) => process.exit(code || 0));
} else {
  const electron = require('electron');
  const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, shell } = electron;

// Para soporte de ventana transparente en Windows es necesario hardware acceleration o software rasterizer compatible
// No deshabilitamos forzosamente toda aceleración cuando se requiere transparencia DWM en Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('enable-logging');

const path = require('path');
const http = require('http');
const fs = require('fs');

let tray = null;
let widgetWin = null;
let mainWindow = null;
let statusServer = null;

// Bloqueo de instancia única para impedir colisión de procesos y puerto 48123
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.warn('[Electron] AVISO: Ya existe otra instancia de Electron ejecutándose en segundo plano. Saliendo de esta instancia duplicada...');
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = mainWindow || widgetWin;
    if (win && !win.isDestroyed()) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8'
};

// Micro-servidor HTTP loopback en 127.0.0.1:48123 para handshake, exclusión mutua y sync local
if (gotTheLock) {
  try {
    statusServer = http.createServer((req, res) => {
      console.log('[Servidor Loopback] Solicitud:', req.method, req.url);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

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

      // Servir archivos estáticos de dist/ para el HUD si no es un endpoint de API
      if (req.method === 'GET') {
        try {
          const parsedUrl = new URL(req.url, 'http://127.0.0.1:48123');
          let reqPath = parsedUrl.pathname;
          if (reqPath === '/' || reqPath === '') {
            reqPath = '/index.html';
          }

          const distDir = path.resolve(__dirname, '../dist');
          const safePath = path.normalize(path.join(distDir, reqPath));

          if (safePath.startsWith(distDir) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
            const ext = path.extname(safePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(safePath).pipe(res);
            return;
          }

          // Fallback SPA para dist/index.html
          const indexPath = path.join(distDir, 'index.html');
          if (fs.existsSync(indexPath) && !req.url.startsWith('/api') && req.url !== '/status') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(indexPath).pipe(res);
            return;
          }
        } catch (err) {
          console.warn('[Loopback Server] Error al servir archivo estático:', err);
        }
      }

      res.writeHead(404);
      res.end();
    });

    statusServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn('[Loopback] Puerto 48123 ya en uso, reutilizando instancia previa.');
      } else {
        console.error('[Loopback Error]:', err);
      }
    });
    statusServer.listen(48123, '127.0.0.1', () => {
      console.log('[Servidor Loopback] Escuchando en puerto 48123 (http://127.0.0.1:48123)');
    });
  } catch (err) {
    console.warn('[Desktop Widget] Error al iniciar servidor de status local:', err);
  }
}

function toggleWidgetVisibility() {
  const win = mainWindow || widgetWin;
  if (!win || win.isDestroyed()) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

function resetWidgetPosition() {
  const win = mainWindow || widgetWin;
  if (!win || win.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const targetX = Math.max(10, width - 440);
  const targetY = Math.max(20, Math.round((height - 720) / 2));
  win.setPosition(targetX, targetY);
  if (!win.isVisible()) {
    win.show();
  }
  win.focus();
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const targetX = Math.max(10, width - 440);
  const targetY = Math.max(20, Math.round((height - 720) / 2));

  // Widget Flotante de Escritorio Translúcido y Arrastrable (REQ-COCKPIT-DESKTOP-FLOATING-WIDGET-97)
  mainWindow = new BrowserWindow({
    width: 420,
    height: 720,
    x: targetX,
    y: targetY,
    minWidth: 380,
    minHeight: 500,
    maxWidth: 520,
    maxHeight: height - 40,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true, // Reside exclusivamente en System Tray sin ocupar barra de tareas
    show: true, // Visibilidad directa del widget al arrancar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });
  widgetWin = mainWindow;

  // Forzar nivel flotante sobre el escritorio de Windows
  mainWindow.setAlwaysOnTop(true, 'floating');

  // Interceptar evento 'close': mantener residente en System Tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Servido nativo mediante HTTP loopback en 127.0.0.1:48123 (elimina restricciones de file:// y ES Modules de Vite)
  const loopbackUrl = 'http://127.0.0.1:48123/?widget=desktop';
  const useDevServer = process.argv.includes('--dev-server') || Boolean(process.env.WIDGET_DEV);
  const targetUrl = useDevServer ? 'http://localhost:3000/?widget=desktop' : loopbackUrl;

  console.log('[Electron] Cargando URL:', targetUrl);
  mainWindow.loadURL(targetUrl);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Carga finalizada con éxito');
  });

  // Manejo de did-fail-load con fallback automático a servidor loopback local
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(
      `[Electron] Error de carga: Código: ${errorCode} | "${errorDescription}" | URL: ${validatedURL}`
    );
    if (validatedURL.includes('localhost:3000')) {
      console.warn('[Electron] Dev server en puerto 3000 no disponible, redirigiendo a loopback http://127.0.0.1:48123/?widget=desktop...');
      mainWindow.loadURL(loopbackUrl);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Inicialización de la Bandeja del Sistema (System Tray)
  if (!tray) {
    try {
      const iconPath = path.join(__dirname, '../public/icon-192.png');
      const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      tray = new Tray(trayIcon);
      tray.setToolTip('Cockpit Flotante PMO & Life OS');

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Mostrar Widget Flotante',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        {
          label: 'Ocultar a la Bandeja',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.hide();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Abrir Portal Web en Navegador (http://localhost:3000)',
          click: () => {
            shell.openExternal('http://localhost:3000');
          }
        },
        { type: 'separator' },
        {
          label: 'Reiniciar Posición en Pantalla',
          click: () => resetWidgetPosition()
        },
        {
          label: 'Salir del Cockpit',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]);

      tray.setContextMenu(contextMenu);
      tray.on('click', () => toggleWidgetVisibility());
      tray.on('double-click', () => toggleWidgetVisibility());
    } catch (err) {
      console.warn('[Desktop Widget] Error al instanciar Tray:', err);
    }
  }

  // Soporte de IPC nativo para expandir/cerrar
  ipcMain.on('widget-close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  ipcMain.on('widget-expand', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setSize(420, 720);
  });

  ipcMain.on('widget-collapse', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setSize(420, 720);
  });
}

if (gotTheLock) {
  app.whenReady().then(createWindow);
}

app.on('before-quit', () => {
  app.isQuitting = true;
  if (statusServer) {
    try {
      statusServer.close();
    } catch {}
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
}
