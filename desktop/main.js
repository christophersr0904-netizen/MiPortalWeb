const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let widgetWin = null;

function createWidget() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  widgetWin = new BrowserWindow({
    width: 380,
    height: 100,
    x: width - 400,
    y: 40,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Carga la ruta dedicada en modo hud con parámetro de widget desktop
  const targetUrl = process.env.WIDGET_URL || 'https://miportalweb-aft.pages.dev/?mode=hud&widget=desktop';
  widgetWin.loadURL(targetUrl);

  // Soporte para redimensionar cuando la cápsula se expande
  ipcMain.on('widget-expand', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    const currentDisplay = screen.getPrimaryDisplay();
    const curWidth = currentDisplay.workAreaSize.width;
    widgetWin.setResizable(true);
    widgetWin.setSize(420, 720);
    widgetWin.setPosition(curWidth - 440, 40);
  });

  // Soporte para redimensionar cuando la cápsula se contrae a píldora en reposo
  ipcMain.on('widget-collapse', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    const currentDisplay = screen.getPrimaryDisplay();
    const curWidth = currentDisplay.workAreaSize.width;
    widgetWin.setSize(380, 100);
    widgetWin.setPosition(curWidth - 400, 40);
    widgetWin.setResizable(false);
  });

  // Soporte para cerrar la ventana del widget
  ipcMain.on('widget-close', () => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      widgetWin.close();
    }
  });

  widgetWin.on('closed', () => {
    widgetWin = null;
  });
}

app.whenReady().then(createWidget);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWidget();
  }
});
