import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  problem: string;
  solution: any;
  timestamp: string;
}

export interface AppState {
  apiKey: string;
  theme: 'dark' | 'light';
  opacity: number;
  isAlwaysOnTop: boolean;
  history: HistoryItem[];
  
  // App runtime state
  currentProblem: string;
  currentSolution: any | null;
  selectedLanguage: 'javascript' | 'python' | 'java';
  isSolving: boolean;
  
  // Actions
  setApiKey: (key: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setOpacity: (opacity: number) => void;
  setAlwaysOnTop: (enabled: boolean) => void;
  setCurrentProblem: (problem: string) => void;
  setCurrentSolution: (solution: any) => void;
  setSelectedLanguage: (lang: 'javascript' | 'python' | 'java') => void;
  setIsSolving: (isSolving: boolean) => void;
  saveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  deleteFromHistory: (id: string) => void;
  initStore: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  apiKey: '',
  theme: 'dark',
  opacity: 1.0,
  isAlwaysOnTop: false,
  history: [],
  currentProblem: '',
  currentSolution: null,
  selectedLanguage: 'javascript',
  isSolving: false,

  setApiKey: (key) => {
    set({ apiKey: key });
    window.electronAPI.storeSet('apiKey', key);
  },
  
  setTheme: (theme) => {
    set({ theme });
    window.electronAPI.storeSet('theme', theme);
    document.documentElement.className = theme;
  },
  
  setOpacity: async (opacity) => {
    set({ opacity });
    window.electronAPI.storeSet('opacity', opacity);
    await window.electronAPI.setOpacity(opacity);
  },

  setAlwaysOnTop: async (enabled) => {
    set({ isAlwaysOnTop: enabled });
    window.electronAPI.storeSet('isAlwaysOnTop', enabled);
    await window.electronAPI.toggleAlwaysOnTop(enabled);
  },
  
  setCurrentProblem: (problem) => set({ currentProblem: problem, currentSolution: null }),
  
  setCurrentSolution: (solution) => set({ currentSolution: solution }),
  
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  
  setIsSolving: (isSolving) => set({ isSolving }),
  
  saveToHistory: (item) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const newHistory = [newItem, ...get().history];
    set({ history: newHistory });
    window.electronAPI.storeSet('history', newHistory);
  },

  deleteFromHistory: (id) => {
    const newHistory = get().history.filter(i => i.id !== id);
    set({ history: newHistory });
    window.electronAPI.storeSet('history', newHistory);
  },

  initStore: async () => {
    const key = await window.electronAPI.storeGet('apiKey', '');
    const th = await window.electronAPI.storeGet('theme', 'dark');
    const opacity = await window.electronAPI.storeGet('opacity', 1.0);
    const isAlwaysOnTop = await window.electronAPI.storeGet('isAlwaysOnTop', false);
    const hist = await window.electronAPI.storeGet('history', []);
    
    set({ apiKey: key, theme: th, opacity, isAlwaysOnTop, history: hist });
    document.documentElement.className = th;
    await window.electronAPI.setOpacity(opacity);
    await window.electronAPI.toggleAlwaysOnTop(isAlwaysOnTop);
  }
}));
