"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: () => electron_1.ipcRenderer.invoke('capture-screen'),
    setOpacity: (value) => electron_1.ipcRenderer.invoke('set-opacity', value),
    toggleAlwaysOnTop: (enable) => electron_1.ipcRenderer.invoke('toggle-always-on-top', enable),
    closeApp: () => electron_1.ipcRenderer.invoke('close-app'),
    minimizeApp: () => electron_1.ipcRenderer.invoke('minimize-app'),
    storeGet: (key, defaultValue) => electron_1.ipcRenderer.invoke('store-get', key, defaultValue),
    storeSet: (key, value) => electron_1.ipcRenderer.invoke('store-set', key, value),
    exportMarkdown: (filename, content) => electron_1.ipcRenderer.invoke('export-markdown', filename, content),
    onShortcutCapture: (callback) => {
        electron_1.ipcRenderer.on('shortcut:capture-screen', () => callback());
    },
    onOpacityChanged: (callback) => {
        electron_1.ipcRenderer.on('opacity-changed', (event, opacity) => callback(opacity));
    },
    // Cleanup listeners
    removeListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('shortcut:capture-screen');
        electron_1.ipcRenderer.removeAllListeners('opacity-changed');
    }
});
