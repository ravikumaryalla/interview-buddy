import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  screen as electronScreen,
  desktopCapturer,
} from 'electron';
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
    skipTaskbar: true,
    icon: path.join(__dirname, '../public/interview_buddy_icon.png'),
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

// Inline HTML for the area-selection overlay window
const SELECTOR_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; overflow:hidden; background:transparent; user-select:none; }
  canvas { display:block; cursor:crosshair; }
  #hint {
    position:fixed; top:16px; left:50%; transform:translateX(-50%);
    background:rgba(0,0,0,0.75); color:#fff; padding:6px 16px;
    border-radius:20px; font-family:system-ui,sans-serif; font-size:13px;
    pointer-events:none; white-space:nowrap; z-index:10; transition:opacity 0.2s;
  }
  #size {
    position:fixed; display:none;
    background:rgba(0,0,0,0.7); color:#fff; padding:3px 8px;
    border-radius:6px; font-family:monospace; font-size:12px;
    pointer-events:none; z-index:10;
  }
</style>
</head>
<body>
<div id="hint">Drag to select area &nbsp;&bull;&nbsp; ESC to cancel</div>
<div id="size"></div>
<canvas id="c"></canvas>
<script>
  const { ipcRenderer } = require('electron');
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const sizeEl = document.getElementById('size');
  const hintEl = document.getElementById('hint');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let sx=0, sy=0, ex=0, ey=0, active=false;

  function getRect() {
    return { x:Math.min(sx,ex), y:Math.min(sy,ey), w:Math.abs(ex-sx), h:Math.abs(ey-sy) };
  }

  function redraw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    var r=getRect();
    if (r.w<2 || r.h<2) return;
    ctx.clearRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle='#6366f1';
    ctx.lineWidth=2;
    ctx.strokeRect(r.x,r.y,r.w,r.h);
    var hs=6;
    ctx.fillStyle='#6366f1';
    [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]].forEach(function(p){
      ctx.fillRect(p[0]-hs/2,p[1]-hs/2,hs,hs);
    });
    sizeEl.style.display='block';
    sizeEl.textContent=r.w+' x '+r.h;
    var lx=Math.max(ex,sx)+8, ly=Math.max(ey,sy)+8;
    sizeEl.style.left=Math.min(lx,canvas.width-100)+'px';
    sizeEl.style.top=Math.min(ly,canvas.height-30)+'px';
  }

  canvas.addEventListener('mousedown', function(e) {
    sx=e.clientX; sy=e.clientY; ex=e.clientX; ey=e.clientY;
    active=true;
    hintEl.style.opacity='0';
  });

  canvas.addEventListener('mousemove', function(e) {
    if (!active) return;
    ex=e.clientX; ey=e.clientY;
    redraw();
  });

  canvas.addEventListener('mouseup', function(e) {
    if (!active) return;
    active=false;
    ex=e.clientX; ey=e.clientY;
    var r=getRect();
    if (r.w>10 && r.h>10) {
      ipcRenderer.send('selection-made', r);
    } else {
      ipcRenderer.send('selection-cancelled');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key==='Escape') ipcRenderer.send('selection-cancelled');
  });

  redraw();
<\/script>
</body>
</html>`;

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

// Returns the first screen source ID for system audio loopback capture
ipcMain.handle('get-desktop-audio-source', async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    return sources.length > 0 ? sources[0].id : null;
  } catch {
    return null;
  }
});

ipcMain.handle('start-area-select', () => {
  return new Promise<{
    image: string;
    region: { x: number; y: number; w: number; h: number };
  } | null>((resolve) => {
    const display = electronScreen.getPrimaryDisplay();
    const scaleFactor = display.scaleFactor;

    mainWindow?.hide();

    // Give the window time to disappear before showing the overlay
    setTimeout(() => {
      const selectorWin = new BrowserWindow({
        fullscreen: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      selectorWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(SELECTOR_HTML)}`,
      );

      let settled = false;

      const settle = async (region?: {
        x: number;
        y: number;
        w: number;
        h: number;
      }) => {
        if (settled) return;
        settled = true;
        ipcMain.removeListener('selection-made', onMade);
        ipcMain.removeListener('selection-cancelled', onCancelled);
        if (!selectorWin.isDestroyed()) selectorWin.close();
        mainWindow?.show();

        if (region) {
          try {
            const imgBuffer = await screenshot({ format: 'png' });
            const base64 = imgBuffer.toString('base64');
            resolve({
              image: `data:image/png;base64,${base64}`,
              region: {
                x: Math.round(region.x * scaleFactor),
                y: Math.round(region.y * scaleFactor),
                w: Math.round(region.w * scaleFactor),
                h: Math.round(region.h * scaleFactor),
              },
            });
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      const onMade = (
        _: any,
        region: { x: number; y: number; w: number; h: number },
      ) => settle(region);
      const onCancelled = () => settle();

      ipcMain.on('selection-made', onMade);
      ipcMain.on('selection-cancelled', onCancelled);
      selectorWin.on('closed', () => settle());
    }, 180);
  });
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

ipcMain.handle(
  'export-markdown',
  async (event, filename: string, content: string) => {
    const { dialog } = require('electron');

    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Solution as Markdown',
      defaultPath: filename,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return true;
    }
    return false;
  },
);
