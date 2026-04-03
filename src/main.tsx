import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Mock Electron API for browser development
if (!window.electronAPI) {
  window.electronAPI = {
    captureScreen: async () => {
      console.warn('Mock captureScreen called');
      return '';
    },
    captureArea: async () => {
      console.warn('Mock captureArea called');
      return null;
    },
    getDesktopAudioSource: async () => {
      console.warn('Mock getDesktopAudioSource called');
      return null;
    },
    setOpacity: async (val) => val,
    toggleAlwaysOnTop: async (val) => val,
    closeApp: async () => console.log('Mock close'),
    minimizeApp: async () => console.log('Mock minimize'),
    storeGet: async (key, def) => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try {
          return JSON.parse(val);
        } catch (e) {
          return val;
        }
      }
      return def;
    },
    storeSet: async (key, val) => {
      localStorage.setItem(key, JSON.stringify(val));
    },
    exportMarkdown: async (filename, content) => {
      console.log('Mock export', filename, content);
      return true;
    },
    onShortcutCapture: () => {},
    onOpacityChanged: () => {},
    removeListeners: () => {},
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
