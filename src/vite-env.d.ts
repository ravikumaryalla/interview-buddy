/// <reference types="vite/client" />

export interface IElectronAPI {
  captureScreen: () => Promise<string>;
  captureArea: () => Promise<{ image: string; region: { x: number; y: number; w: number; h: number } } | null>;
  getDesktopAudioSource: () => Promise<string | null>;
  setOpacity: (value: number) => Promise<number>;
  toggleAlwaysOnTop: (enable: boolean) => Promise<boolean>;
  closeApp: () => Promise<void>;
  minimizeApp: () => Promise<void>;
  storeGet: (key: string, defaultValue?: any) => Promise<any>;
  storeSet: (key: string, value: any) => Promise<void>;
  exportMarkdown: (filename: string, content: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  onPaymentSuccess: (callback: (data: { orderId: string }) => void) => void;
  onPaymentFailed: (callback: (data: { orderId: string }) => void) => void;
  onShortcutCapture: (callback: () => void) => void;
  onOpacityChanged: (callback: (opacity: number) => void) => void;
  removeListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
