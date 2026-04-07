import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  captureArea: () => ipcRenderer.invoke('start-area-select'),
  getDesktopAudioSource: () => ipcRenderer.invoke('get-desktop-audio-source'),
  setOpacity: (value: number) => ipcRenderer.invoke('set-opacity', value),
  toggleAlwaysOnTop: (enable: boolean) => ipcRenderer.invoke('toggle-always-on-top', enable),
  closeApp: () => ipcRenderer.invoke('close-app'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  
  storeGet: (key: string, defaultValue?: any) => ipcRenderer.invoke('store-get', key, defaultValue),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  exportMarkdown: (filename: string, content: string) => ipcRenderer.invoke('export-markdown', filename, content),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  onShortcutCapture: (callback: () => void) => {
    ipcRenderer.on('shortcut:capture-screen', () => callback());
  },
  onOpacityChanged: (callback: (opacity: number) => void) => {
    ipcRenderer.on('opacity-changed', (event, opacity) => callback(opacity));
  },
  onPaymentSuccess: (callback: (data: { orderId: string }) => void) => {
    ipcRenderer.on('payment:success', (_event, data) => callback(data));
  },
  onPaymentFailed: (callback: (data: { orderId: string }) => void) => {
    ipcRenderer.on('payment:failed', (_event, data) => callback(data));
  },
  // Cleanup listeners
  removeListeners: () => {
    ipcRenderer.removeAllListeners('shortcut:capture-screen');
    ipcRenderer.removeAllListeners('opacity-changed');
    ipcRenderer.removeAllListeners('payment:success');
    ipcRenderer.removeAllListeners('payment:failed');
  }
});
