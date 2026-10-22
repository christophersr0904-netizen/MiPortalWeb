const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let widgetWin = null;

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
    skipTaskbar: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const targetUrl = process.env.WIDGET_URL || 'https://miportalweb-aft.pages.dev/?mode=hud&widget=desktop';
  widgetWin.loadURL(targetUrl);

  ipcMain.on('widget-expand', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    const currentDisplay = screen.getPrimaryDisplay();
    const curWidth = currentDisplay.workAreaSize.width;
    widgetWin.setResizable(true);
    widgetWin.setSize(420, 700);
    widgetWin.setPosition(curWidth - 440, 40);
  });

  ipcMain.on('widget-collapse', () => {
    if (!widgetWin || widgetWin.isDestroyed()) return;
    const currentDisplay = screen.getPrimaryDisplay();
    const curWidth = currentDisplay.workAreaSize.width;
    widgetWin.setSize(360, 64);
    widgetWin.setPosition(curWidth - 390, 40);
    widgetWin.setResizable(false);
  });

  ipcMain.on('widget-close', () => {
    app.quit();
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
