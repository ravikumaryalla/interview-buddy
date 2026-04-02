import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  captureArea: () => ipcRenderer.invoke('start-area-select'),
  setOpacity: (value: number) => ipcRenderer.invoke('set-opacity', value),
  toggleAlwaysOnTop: (enable: boolean) => ipcRenderer.invoke('toggle-always-on-top', enable),
  closeApp: () => ipcRenderer.invoke('close-app'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  
  storeGet: (key: string, defaultValue?: any) => ipcRenderer.invoke('store-get', key, defaultValue),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  exportMarkdown: (filename: string, content: string) => ipcRenderer.invoke('export-markdown', filename, content),
  
  onShortcutCapture: (callback: () => void) => {
    ipcRenderer.on('shortcut:capture-screen', () => callback());
  },
  onOpacityChanged: (callback: (opacity: number) => void) => {
    ipcRenderer.on('opacity-changed', (event, opacity) => callback(opacity));
  },
  // Cleanup listeners
  removeListeners: () => {
    ipcRenderer.removeAllListeners('shortcut:capture-screen');
    ipcRenderer.removeAllListeners('opacity-changed');
  }
});
