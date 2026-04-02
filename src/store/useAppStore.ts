import { create } from 'zustand';
import type { ReasoningEffort } from '../lib/ai';

export interface HistoryItem {
  id: string;
  problem: string;
  solution: any;
  timestamp: string;
}

export interface AppState {
  apiKey: string;
  selectedModel: string;
  reasoningEffort: ReasoningEffort;
  theme: 'dark' | 'light';
  opacity: number;
  isAlwaysOnTop: boolean;
  history: HistoryItem[];

  // App runtime state
  currentProblem: string;
  currentSolution: any | null;
  promptMode: 'coding' | 'custom';
  customPrompt: string;
  customResponse: string | null;
  selectedLanguage: 'javascript' | 'python' | 'java';
  isSolving: boolean;

  // Actions
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setOpacity: (opacity: number) => void;
  setAlwaysOnTop: (enabled: boolean) => void;
  setCurrentProblem: (problem: string) => void;
  setCurrentSolution: (solution: any) => void;
  setPromptMode: (mode: 'coding' | 'custom') => void;
  setCustomPrompt: (prompt: string) => void;
  setCustomResponse: (response: string | null) => void;
  setSelectedLanguage: (lang: 'javascript' | 'python' | 'java') => void;
  setIsSolving: (isSolving: boolean) => void;
  saveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  deleteFromHistory: (id: string) => void;
  initStore: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  apiKey: '',
  selectedModel: 'gpt-4o',
  reasoningEffort: 'medium',
  theme: 'dark',
  opacity: 1.0,
  isAlwaysOnTop: false,
  history: [],
  currentProblem: '',
  currentSolution: null,
  promptMode: 'coding',
  customPrompt: '',
  customResponse: null,
  selectedLanguage: 'javascript',
  isSolving: false,

  setApiKey: (key) => {
    set({ apiKey: key });
    window.electronAPI.storeSet('apiKey', key);
  },

  setSelectedModel: (model) => {
    set({ selectedModel: model });
    window.electronAPI.storeSet('selectedModel', model);
  },

  setReasoningEffort: (effort) => {
    set({ reasoningEffort: effort });
    window.electronAPI.storeSet('reasoningEffort', effort);
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

  setCurrentProblem: (problem) => set({ currentProblem: problem, currentSolution: null, customResponse: null }),

  setCurrentSolution: (solution) => set({ currentSolution: solution }),

  setPromptMode: (mode) => set({ promptMode: mode }),

  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),

  setCustomResponse: (response) => set({ customResponse: response }),

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
    const selectedModel = await window.electronAPI.storeGet('selectedModel', 'gpt-4o');
    const reasoningEffort = await window.electronAPI.storeGet('reasoningEffort', 'medium');
    const th = await window.electronAPI.storeGet('theme', 'dark');
    const opacity = await window.electronAPI.storeGet('opacity', 1.0);
    const isAlwaysOnTop = await window.electronAPI.storeGet('isAlwaysOnTop', false);
    const hist = await window.electronAPI.storeGet('history', []);

    set({ apiKey: key, selectedModel, reasoningEffort, theme: th, opacity, isAlwaysOnTop, history: hist });
    document.documentElement.className = th;
    await window.electronAPI.setOpacity(opacity);
    await window.electronAPI.toggleAlwaysOnTop(isAlwaysOnTop);
  }
}));
