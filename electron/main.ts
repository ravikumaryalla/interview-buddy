import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
const screenshot = require('screenshot-desktop');
import * as fs from 'fs';

// Initialize the store for data persistence
const store = new Store();

// Store window reference
let mainWindow: BrowserWindow | null = null;
let currentOpacity = 1.0;
let isAlwaysOnTop = false;
let isVisible = true;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    frame: false, // Frameless window
    transparent: true,
    alwaysOnTop: isAlwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Prevent window from being captured by screen sharing software (Zoom, Teams, etc)
  mainWindow.setContentProtection(true);

  // Depending on dev env or not
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173/');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Register Global Shortcuts when window is focused, or at top level
  // Requirements: Ctrl+Shift+S (Capture), Ctrl+Shift+A (Toggle Visibility), Ctrl+Up/Down (Opacity)
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcut:capture-screen');
      if (!isVisible) {
        mainWindow.show();
        isVisible = true;
      }
    }
  });

  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) {
      if (isVisible) {
        mainWindow.hide();
        isVisible = false;
      } else {
        mainWindow.show();
        isVisible = true;
      }
    }
  });

  globalShortcut.register('CommandOrControl+Up', () => {
    if (mainWindow && isVisible) {
      currentOpacity = Math.min(1.0, currentOpacity + 0.1);
      mainWindow.setOpacity(currentOpacity);
      mainWindow.webContents.send('opacity-changed', currentOpacity);
    }
  });

  globalShortcut.register('CommandOrControl+Down', () => {
    if (mainWindow && isVisible) {
      currentOpacity = Math.max(0.2, currentOpacity - 0.1);
      mainWindow.setOpacity(currentOpacity);
      mainWindow.webContents.send('opacity-changed', currentOpacity);
    }
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    globalShortcut.unregisterAll();
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC Handlers
ipcMain.handle('capture-screen', async () => {
  try {
    // Hidden temporarily so it doesn't capture itself (if covering screen)
    // mainWindow?.setOpacity(0);
    // await new Promise((resolve) => setTimeout(resolve, 100)); // wait for hide

    const imgBuffer = await screenshot({ format: 'png' });
    const base64Img = imgBuffer.toString('base64');
    
    // mainWindow?.setOpacity(currentOpacity);

    return `data:image/png;base64,${base64Img}`;
  } catch (error) {
    console.error('Failed to capture screen', error);
    // mainWindow?.setOpacity(currentOpacity);
    throw error;
  }
});

ipcMain.handle('set-opacity', (event, value: number) => {
  if (mainWindow) {
    currentOpacity = Math.max(0.2, Math.min(1.0, value));
    mainWindow.setOpacity(currentOpacity);
    return currentOpacity;
  }
  return 1.0;
});

ipcMain.handle('toggle-always-on-top', (event, enable: boolean) => {
  if (mainWindow) {
    isAlwaysOnTop = enable;
    mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'normal');
    return isAlwaysOnTop;
  }
  return false;
});

ipcMain.handle('close-app', () => {
  app.quit();
});

ipcMain.handle('minimize-app', () => {
  mainWindow?.minimize();
});

// Store IPC handlers for data persistence
ipcMain.handle('store-get', (event, key: string, defaultValue?: any) => {
  // @ts-ignore
  return store.get(key, defaultValue);
});

ipcMain.handle('store-set', (event, key: string, value: any) => {
  // @ts-ignore
  store.set(key, value);
});

ipcMain.handle('export-markdown', async (event, filename: string, content: string) => {
  const { dialog } = require('electron');
  
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export Solution as Markdown',
    defaultPath: filename,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return true;
  }
  return false;
});
