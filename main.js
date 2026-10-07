const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

// Set dedicated user data directory to avoid cache access conflicts
app.setPath('userData', path.join(app.getPath('appData'), 'sies-qms-erp-app'));

let mainWindow;

function checkServerReady(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(false);
        }
      });
    }, 500);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SIES ERP & QMS - Sipariş ve Kalite Yönetim Sistemi',
    icon: path.join(__dirname, 'public/sies_logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null);

  const targetUrl = 'http://localhost:3000';
  
  const isReady = await checkServerReady(targetUrl);
  if (isReady && mainWindow) {
    mainWindow.loadURL(targetUrl);
  }
  
  // Auto reload if page failed to load initially
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(targetUrl);
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
