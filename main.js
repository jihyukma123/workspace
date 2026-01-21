import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:8080';

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // In development, load from Vite dev server for HMR
  // In production, load from built files
  if (isDev) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    win.loadFile('dist/index.html');
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
