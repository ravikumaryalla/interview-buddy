"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_store_1 = __importDefault(require("electron-store"));
const screenshot = require('screenshot-desktop');
const fs = __importStar(require("fs"));
// Initialize the store for data persistence
const store = new electron_store_1.default();
// Store window reference
let mainWindow = null;
let currentOpacity = 1.0;
let isAlwaysOnTop = false;
let isVisible = true;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
    if (process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173/');
        // mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Register Global Shortcuts when window is focused, or at top level
    // Requirements: Ctrl+Shift+S (Capture), Ctrl+Shift+A (Toggle Visibility), Ctrl+Up/Down (Opacity)
    electron_1.globalShortcut.register('CommandOrControl+Shift+S', () => {
        if (mainWindow) {
            mainWindow.webContents.send('shortcut:capture-screen');
            if (!isVisible) {
                mainWindow.show();
                isVisible = true;
            }
        }
    });
    electron_1.globalShortcut.register('CommandOrControl+Shift+A', () => {
        if (mainWindow) {
            if (isVisible) {
                mainWindow.hide();
                isVisible = false;
            }
            else {
                mainWindow.show();
                isVisible = true;
            }
        }
    });
    electron_1.globalShortcut.register('CommandOrControl+Up', () => {
        if (mainWindow && isVisible) {
            currentOpacity = Math.min(1.0, currentOpacity + 0.1);
            mainWindow.setOpacity(currentOpacity);
            mainWindow.webContents.send('opacity-changed', currentOpacity);
        }
    });
    electron_1.globalShortcut.register('CommandOrControl+Down', () => {
        if (mainWindow && isVisible) {
            currentOpacity = Math.max(0.2, currentOpacity - 0.1);
            mainWindow.setOpacity(currentOpacity);
            mainWindow.webContents.send('opacity-changed', currentOpacity);
        }
    });
};
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.globalShortcut.unregisterAll();
        electron_1.app.quit();
    }
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
// IPC Handlers
electron_1.ipcMain.handle('capture-screen', async () => {
    try {
        // Hidden temporarily so it doesn't capture itself (if covering screen)
        // mainWindow?.setOpacity(0);
        // await new Promise((resolve) => setTimeout(resolve, 100)); // wait for hide
        const imgBuffer = await screenshot({ format: 'png' });
        const base64Img = imgBuffer.toString('base64');
        // mainWindow?.setOpacity(currentOpacity);
        return `data:image/png;base64,${base64Img}`;
    }
    catch (error) {
        console.error('Failed to capture screen', error);
        // mainWindow?.setOpacity(currentOpacity);
        throw error;
    }
});
electron_1.ipcMain.handle('set-opacity', (event, value) => {
    if (mainWindow) {
        currentOpacity = Math.max(0.2, Math.min(1.0, value));
        mainWindow.setOpacity(currentOpacity);
        return currentOpacity;
    }
    return 1.0;
});
electron_1.ipcMain.handle('toggle-always-on-top', (event, enable) => {
    if (mainWindow) {
        isAlwaysOnTop = enable;
        mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'normal');
        return isAlwaysOnTop;
    }
    return false;
});
electron_1.ipcMain.handle('close-app', () => {
    electron_1.app.quit();
});
electron_1.ipcMain.handle('minimize-app', () => {
    mainWindow?.minimize();
});
// Store IPC handlers for data persistence
electron_1.ipcMain.handle('store-get', (event, key, defaultValue) => {
    // @ts-ignore
    return store.get(key, defaultValue);
});
electron_1.ipcMain.handle('store-set', (event, key, value) => {
    // @ts-ignore
    store.set(key, value);
});
electron_1.ipcMain.handle('export-markdown', async (event, filename, content) => {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow, {
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
