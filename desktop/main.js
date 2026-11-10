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
  const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, shell, globalShortcut, session } = electron;

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
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json'
};

// Micro-servidor HTTP loopback en 127.0.0.1:48123 para handshake, exclusión mutua y sync local
if (gotTheLock) {
  try {
    statusServer = http.createServer((req, res) => {
      console.log('[Servidor Loopback] Solicitud:', req.method, req.url);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url, 'http://127.0.0.1:48123');
      const pathname = parsedUrl.pathname;

      if (pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ desktopWidgetAlive: true, timestamp: Date.now() }));
        return;
      }

      if (pathname === '/api/sync-data' && req.method === 'GET') {
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

      if (pathname === '/api/sync-data' && req.method === 'POST') {
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
      if (req.method === 'GET' || req.method === 'HEAD') {
        try {
          let reqPath = decodeURIComponent(parsedUrl.pathname);
          if (reqPath === '/' || reqPath === '') {
            reqPath = '/index.html';
          }

          const distDir = path.resolve(__dirname, '../dist');
          const safePath = path.normalize(path.join(distDir, reqPath));

          // Verificación de seguridad contra Path Traversal
          if (!safePath.startsWith(distDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Acceso denegado');
            return;
          }

          const ext = path.extname(reqPath).toLowerCase();
          const fileExists = fs.existsSync(safePath) && fs.statSync(safePath).isFile();

          if (fileExists) {
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            if (req.method === 'HEAD') {
              res.end();
            } else {
              fs.createReadStream(safePath).pipe(res);
            }
            return;
          }

          // Si el archivo tiene extensión (.js, .css, etc.) y NO existe, responder 404 estricto.
          // NUNCA hacer fallback a index.html para assets estáticos con extensión.
          if (ext && ext !== '.html') {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Asset not found: ${reqPath}`);
            return;
          }

          // Fallback SPA para dist/index.html ÚNICAMENTE en rutas de navegación (sin extensión o .html)
          const indexPath = path.join(distDir, 'index.html');
          if (fs.existsSync(indexPath) && !pathname.startsWith('/api') && pathname !== '/status') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            if (req.method === 'HEAD') {
              res.end();
            } else {
              fs.createReadStream(indexPath).pipe(res);
            }
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

// Memoria Persistente de Bounds y Factor de Forma Dinámico (REQ-DESKTOP-16 Paso 1)
let isWidgetExpanded = false;
let saveBoundsTimeout = null;

const BOUNDS_FILE = path.join(app.getPath('userData'), 'cockpit-bounds.json');

function loadSavedBounds() {
  try {
    if (fs.existsSync(BOUNDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOUNDS_FILE, 'utf-8'));
      return {
        capsule: {
          x: typeof data.capsule?.x === 'number' ? data.capsule.x : 100,
          y: typeof data.capsule?.y === 'number' ? data.capsule.y : 100
        },
        bento: {
          x: typeof data.bento?.x === 'number' ? data.bento.x : 100,
          y: typeof data.bento?.y === 'number' ? data.bento.y : 100,
          width: typeof data.bento?.width === 'number' ? data.bento.width : 380,
          height: typeof data.bento?.height === 'number' ? data.bento.height : 620
        }
      };
    }
  } catch (err) {
    console.warn('[Cockpit Bounds] Error al leer cockpit-bounds.json:', err.message);
  }
  return {
    capsule: { x: 100, y: 100 },
    bento: { x: 100, y: 100, width: 380, height: 620 }
  };
}

let currentBoundsMemory = loadSavedBounds();

function saveBoundsToDisk() {
  try {
    const dir = app.getPath('userData');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BOUNDS_FILE, JSON.stringify(currentBoundsMemory, null, 2), 'utf-8');
    console.log('[Cockpit Bounds] Bounds persistidos en disco exitosamente.');
  } catch (err) {
    console.warn('[Cockpit Bounds] Error al persistir cockpit-bounds.json:', err.message);
  }
}

function scheduleSaveBounds() {
  if (saveBoundsTimeout) clearTimeout(saveBoundsTimeout);
  saveBoundsTimeout = setTimeout(() => {
    saveBoundsToDisk();
  }, 500);
}

// Validación de Coordenadas contra el Viewport Activo de los Monitores (screen.getDisplayMatching)
function getValidatedCoordinates(targetX, targetY, targetW, targetH) {
  try {
    const matchingDisplay = screen.getDisplayMatching({
      x: targetX,
      y: targetY,
      width: targetW,
      height: targetH
    }) || screen.getPrimaryDisplay();

    const workArea = matchingDisplay.workArea;

    let finalX = targetX;
    let finalY = targetY;

    // Si está fuera de los márgenes horizontales de la pantalla
    if (finalX + targetW < workArea.x + 20 || finalX > workArea.x + workArea.width - 20) {
      finalX = workArea.x + 100;
    }
    // Si está fuera de los márgenes verticales de la pantalla
    if (finalY + targetH < workArea.y + 20 || finalY > workArea.y + workArea.height - 20) {
      finalY = workArea.y + 100;
    }

    // Ajustar si se desborda por los extremos derechos o inferiores
    if (finalX + targetW > workArea.x + workArea.width) {
      finalX = Math.max(workArea.x + 10, workArea.x + workArea.width - targetW - 10);
    }
    if (finalY + targetH > workArea.y + workArea.height) {
      finalY = Math.max(workArea.y + 10, workArea.y + workArea.height - targetH - 10);
    }

    return { x: Math.round(finalX), y: Math.round(finalY), width: targetW, height: targetH };
  } catch (err) {
    return { x: 100, y: 100, width: targetW, height: targetH };
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
    win.setSkipTaskbar(true);
    win.setAlwaysOnTop(true, 'screen-saver');
  }
}

function resetWidgetPosition() {
  const win = mainWindow || widgetWin;
  if (!win || win.isDestroyed()) return;
  const targetX = 100;
  const targetY = 100;

  if (isWidgetExpanded) {
    const w = currentBoundsMemory.bento.width || 380;
    const h = currentBoundsMemory.bento.height || 620;
    win.setBounds({ x: targetX, y: targetY, width: w, height: h });
    currentBoundsMemory.bento.x = targetX;
    currentBoundsMemory.bento.y = targetY;
  } else {
    win.setBounds({ x: targetX, y: targetY, width: 320, height: 44 });
    currentBoundsMemory.capsule.x = targetX;
    currentBoundsMemory.capsule.y = targetY;
  }
  saveBoundsToDisk();

  if (!win.isVisible()) {
    win.show();
  }
  win.focus();
  win.setSkipTaskbar(true);
  win.setAlwaysOnTop(true, 'screen-saver');
}

function createWindow() {
  // Cargar coordenadas persistidas de cápsula y validar visibilidad en monitores (REQ-DESKTOP-16 Paso 1)
  const savedCapsule = currentBoundsMemory.capsule || { x: 100, y: 100 };
  const validated = getValidatedCoordinates(savedCapsule.x, savedCapsule.y, 320, 44);

  // Widget Flotante de Silueta Orgánica y Factor de Forma Dinámico (REQ-DESKTOP-08 / REQ-DESKTOP-12 / REQ-DESKTOP-14 / REQ-DESKTOP-16)
  mainWindow = new BrowserWindow({
    width: 320,
    height: 44,
    x: validated.x,
    y: validated.y,
    minWidth: 320,
    minHeight: 44,
    maxWidth: 420,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true, // Residencia exclusiva en System Tray (REQ-DESKTOP-12)
    show: false, // Inicio oculto para eliminar flash negro antes del renderizado (REQ-DESKTOP-14)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true,
      devTools: true // Habilitado explícitamente para diagnóstico en desarrollo (REQ-DEBUG-14)
    }
  });
  widgetWin = mainWindow;

  // Registrar listeners de movimiento y redimensionamiento para persistencia automática con debounce (REQ-DESKTOP-16 Paso 1)
  mainWindow.on('move', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const bounds = mainWindow.getBounds();
    if (isWidgetExpanded) {
      currentBoundsMemory.bento.x = bounds.x;
      currentBoundsMemory.bento.y = bounds.y;
    } else {
      currentBoundsMemory.capsule.x = bounds.x;
      currentBoundsMemory.capsule.y = bounds.y;
    }
    scheduleSaveBounds();
  });

  mainWindow.on('resize', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (isWidgetExpanded) {
      const bounds = mainWindow.getBounds();
      currentBoundsMemory.bento.width = bounds.width;
      currentBoundsMemory.bento.height = bounds.height;
      scheduleSaveBounds();
    }
  });

  // Forzar nivel flotante máximo sobre el escritorio de Windows
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

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
  const isDevMode = !app.isPackaged || useDevServer || process.argv.includes('--devtools') || process.env.NODE_ENV === 'development';
  const targetUrl = useDevServer ? 'http://localhost:3000/?widget=desktop' : loopbackUrl;

  const toggleDevToolsWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  };

  // Atajos permanentes de desarrollo para DevTools (F12 / Ctrl+Shift+I / Ctrl+Shift+J) (REQ-DEBUG-14)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!isDevMode) return;
    const isF12 = input.type === 'keyDown' && input.key === 'F12';
    const isCtrlShiftIJ =
      input.type === 'keyDown' &&
      (input.control || input.meta) &&
      input.shift &&
      (input.key.toUpperCase() === 'I' || input.key.toUpperCase() === 'J');

    if (isF12 || isCtrlShiftIJ) {
      event.preventDefault();
      toggleDevToolsWindow();
    }
  });

  // Redireccionar errores fatales del renderer Chromium al terminal de Node
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 3) {
      console.error(`[Renderer Error] ${message} (${sourceId}:${line})`);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Electron] Proceso renderer terminado inesperadamente:', details);
    if (isDevMode && mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  console.log('[Electron] Cargando URL:', targetUrl);
  mainWindow.loadURL(targetUrl);

  // Apertura automática en modo dev-server o con bandera --devtools / ELECTRON_OPEN_DEVTOOLS=1
  if (useDevServer || process.argv.includes('--devtools') || process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Carga finalizada con éxito');
    // Fallback de seguridad si ready-to-show no disparase en algún hardware específico
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setSkipTaskbar(true);
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 300);
  });

  // Manejo de did-fail-load con fallback automático a servidor loopback local
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(
      `[Electron] Error de carga: Código: ${errorCode} | "${errorDescription}" | URL: ${validatedURL}`
    );
    if (isDevMode && mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    if (validatedURL.includes('localhost:3000')) {
      console.warn('[Electron] Dev server en puerto 3000 no disponible, redirigiendo a loopback http://127.0.0.1:48123/?widget=desktop...');
      mainWindow.loadURL(loopbackUrl);
    }
  });

  // Mostrar ventana únicamente tras el cálculo y pintado de la superficie gráfica (cero flash negro - REQ-DESKTOP-14)
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] ready-to-show disparado: superficie calculada');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setSkipTaskbar(true);
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  // Inicialización Blindada de la Bandeja del Sistema (System Tray - REQ-DESKTOP-06 Paso 2 / REQ-DESKTOP-16 Paso 2)
  if (!tray) {
    try {
      const iconPath = path.resolve(__dirname, '../public/icon-192.png');
      const iconExists = fs.existsSync(iconPath);
      console.log(`[Tray Init] Ruta del icono: "${iconPath}" | Existe: ${iconExists}`);

      let trayIcon;
      if (iconExists) {
        trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      } else {
        console.warn(`[Tray Init] AVISO: No se encontró icono en "${iconPath}", usando fallback nativeImage.createEmpty()`);
        trayIcon = nativeImage.createEmpty();
      }

      tray = new Tray(trayIcon);
      tray.setToolTip('Cockpit Flotante PMO & Life OS (Alt+Shift+C)');

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Mostrar / Ocultar Widget (Alt+Shift+C)',
          click: () => toggleWidgetVisibility()
        },
        ...(isDevMode
          ? [
              {
                label: 'Abrir / Cerrar DevTools (F12)',
                click: () => toggleDevToolsWindow()
              }
            ]
          : []),
        { type: 'separator' },
        {
          label: 'Abrir Portal Web en Navegador (http://localhost:3000)',
          click: () => {
            shell.openExternal('http://localhost:3000');
          }
        },
        {
          label: 'Abrir Carpeta de Autoarranque (shell:startup)',
          click: () => {
            if (process.env.APPDATA) {
              const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
              shell.openPath(startupDir);
            }
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
      console.log('[Tray Init] System Tray instanciado exitosamente.');
    } catch (err) {
      console.error('[TRAY ERROR] Fallo al instanciar Tray:', err);
    }
  }

  // Soporte de IPC nativo para expandir/contraer dinámicamente el factor de forma con memoria de bounds (REQ-DESKTOP-16 Paso 1)
  ipcMain.on('widget-close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  ipcMain.on('widget-expand', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow || widgetWin;
    if (win && !win.isDestroyed()) {
      isWidgetExpanded = true;
      const currentCapsuleBounds = win.getBounds();
      currentBoundsMemory.capsule.x = currentCapsuleBounds.x;
      currentBoundsMemory.capsule.y = currentCapsuleBounds.y;

      const targetW = currentBoundsMemory.bento.width || 380;
      const targetH = currentBoundsMemory.bento.height || 620;

      const validated = getValidatedCoordinates(currentCapsuleBounds.x, currentCapsuleBounds.y, targetW, targetH);

      win.setResizable(true);
      win.setMinimumSize(320, 450);
      win.setMaximumSize(1200, 1600);
      win.setBounds(validated);
      win.setSkipTaskbar(true);

      currentBoundsMemory.bento.x = validated.x;
      currentBoundsMemory.bento.y = validated.y;
      scheduleSaveBounds();
    }
  });

  ipcMain.on('widget-collapse', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow || widgetWin;
    if (win && !win.isDestroyed()) {
      isWidgetExpanded = false;
      const currentBentoBounds = win.getBounds();
      currentBoundsMemory.bento.x = currentBentoBounds.x;
      currentBoundsMemory.bento.y = currentBentoBounds.y;
      currentBoundsMemory.bento.width = currentBentoBounds.width;
      currentBoundsMemory.bento.height = currentBentoBounds.height;

      const validated = getValidatedCoordinates(currentBentoBounds.x, currentBentoBounds.y, 320, 44);

      win.setResizable(false);
      win.setMinimumSize(320, 44);
      win.setMaximumSize(420, 44);
      win.setBounds(validated);
      win.setSkipTaskbar(true);

      currentBoundsMemory.capsule.x = validated.x;
      currentBoundsMemory.capsule.y = validated.y;
      scheduleSaveBounds();
    }
  });
}

if (gotTheLock) {
  app.whenReady().then(async () => {
    // Limpiar únicamente Service Workers y CacheStorage obsoletos del loopback HTTP para evitar 404 en assets con hash nuevo (REQ-DEBUG-14)
    // Preserva intactos IndexedDB y LocalStorage del usuario.
    try {
      await session.defaultSession.clearStorageData({
        storages: ['serviceworkers', 'cachestorage']
      });
      await session.defaultSession.clearCache();
      console.log('[Electron] Caché HTTP y Service Workers residuales depurados limpiamente.');
    } catch (err) {
      console.warn('[Electron] No se pudo limpiar CacheStorage previo:', err);
    }

    createWindow();

    // Registro de Atajo Global Alt+Shift+C (REQ-DESKTOP-16 Paso 2)
    try {
      const atajoRegistrado = globalShortcut.register('Alt+Shift+C', () => {
        console.log('[Atajo Global] Alt+Shift+C presionado -> Alternando visibilidad del widget');
        toggleWidgetVisibility();
      });
      console.log(`[Atajo Global] Alt+Shift+C registrado: ${atajoRegistrado ? 'EXITOSO' : 'FALLIDO'}`);
    } catch (err) {
      console.error('[Atajo Global] Error al registrar atajo global Alt+Shift+C:', err);
    }
  });
}

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
    console.log('[Atajo Global] Atajos globales liberados limpiamente.');
  } catch {}
});

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
