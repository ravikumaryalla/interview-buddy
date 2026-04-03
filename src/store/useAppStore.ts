import { create } from 'zustand'
import type { ReasoningEffort } from '../lib/ai'
import { api, setToken, setRefreshToken, setOnTokenRefreshed, type AuthUser } from '../lib/api'

export interface HistoryItem {
  id: string
  problem: string
  solution: any
  timestamp: string
}

export interface AppState {
  // Auth
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  credits: number
  isAuthenticated: boolean

  // Settings (persisted)
  selectedModel: string
  reasoningEffort: ReasoningEffort
  theme: 'dark' | 'light'
  opacity: number
  isAlwaysOnTop: boolean
  history: HistoryItem[]

  // Runtime state
  currentProblem: string
  currentSolution: any | null
  promptMode: 'coding' | 'custom'
  customPrompt: string
  customResponse: string | null
  selectedLanguage: 'javascript' | 'python' | 'java'
  isSolving: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setCredits: (n: number) => void

  setSelectedModel: (model: string) => void
  setReasoningEffort: (effort: ReasoningEffort) => void
  setTheme: (theme: 'dark' | 'light') => void
  setOpacity: (opacity: number) => void
  setAlwaysOnTop: (enabled: boolean) => void
  setCurrentProblem: (problem: string) => void
  setCurrentSolution: (solution: any) => void
  setPromptMode: (mode: 'coding' | 'custom') => void
  setCustomPrompt: (prompt: string) => void
  setCustomResponse: (response: string | null) => void
  setSelectedLanguage: (lang: 'javascript' | 'python' | 'java') => void
  setIsSolving: (isSolving: boolean) => void
  saveToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void
  deleteFromHistory: (id: string) => void
  initStore: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth defaults
  user: null,
  token: null,
  refreshToken: null,
  credits: 0,
  isAuthenticated: false,

  // Settings defaults
  selectedModel: 'gpt-4o',
  reasoningEffort: 'medium',
  theme: 'dark',
  opacity: 1.0,
  isAlwaysOnTop: false,
  history: [],

  // Runtime defaults
  currentProblem: '',
  currentSolution: null,
  promptMode: 'coding',
  customPrompt: '',
  customResponse: null,
  selectedLanguage: 'javascript',
  isSolving: false,

  // ── Auth actions ──────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { accessToken, refreshToken, user } = await api.auth.login(email, password)
    setToken(accessToken)
    setRefreshToken(refreshToken)
    await window.electronAPI.storeSet('token', accessToken)
    await window.electronAPI.storeSet('refreshToken', refreshToken)

    const me = await api.user.me()
    set({ user, token: accessToken, refreshToken, credits: me.credits, isAuthenticated: true })
  },

  register: async (name, email, password) => {
    const { accessToken, refreshToken, user } = await api.auth.register(name, email, password)
    setToken(accessToken)
    setRefreshToken(refreshToken)
    await window.electronAPI.storeSet('token', accessToken)
    await window.electronAPI.storeSet('refreshToken', refreshToken)

    const me = await api.user.me()
    set({ user, token: accessToken, refreshToken, credits: me.credits, isAuthenticated: true })
  },

  logout: async () => {
    try { await api.auth.logout() } catch { /* ignore */ }
    setToken(null)
    setRefreshToken(null)
    await window.electronAPI.storeSet('token', null)
    await window.electronAPI.storeSet('refreshToken', null)
    set({ user: null, token: null, refreshToken: null, credits: 0, isAuthenticated: false })
  },

  setCredits: (n) => set({ credits: n }),

  // ── Settings actions ──────────────────────────────────────────────────────
  setSelectedModel: (model) => {
    set({ selectedModel: model })
    window.electronAPI.storeSet('selectedModel', model)
  },

  setReasoningEffort: (effort) => {
    set({ reasoningEffort: effort })
    window.electronAPI.storeSet('reasoningEffort', effort)
  },

  setTheme: (theme) => {
    set({ theme })
    window.electronAPI.storeSet('theme', theme)
    document.documentElement.className = theme
  },

  setOpacity: async (opacity) => {
    set({ opacity })
    window.electronAPI.storeSet('opacity', opacity)
    await window.electronAPI.setOpacity(opacity)
  },

  setAlwaysOnTop: async (enabled) => {
    set({ isAlwaysOnTop: enabled })
    window.electronAPI.storeSet('isAlwaysOnTop', enabled)
    await window.electronAPI.toggleAlwaysOnTop(enabled)
  },

  // ── Runtime actions ───────────────────────────────────────────────────────
  setCurrentProblem: (problem) => set({ currentProblem: problem, currentSolution: null, customResponse: null }),
  setCurrentSolution: (solution) => set({ currentSolution: solution }),
  setPromptMode: (mode) => set({ promptMode: mode }),
  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
  setCustomResponse: (response) => set({ customResponse: response }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  setIsSolving: (isSolving) => set({ isSolving }),

  saveToHistory: (item) => {
    const newItem: HistoryItem = { ...item, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
    const newHistory = [newItem, ...get().history]
    set({ history: newHistory })
    window.electronAPI.storeSet('history', newHistory)
  },

  deleteFromHistory: (id) => {
    const newHistory = get().history.filter(i => i.id !== id)
    set({ history: newHistory })
    window.electronAPI.storeSet('history', newHistory)
  },

  // ── Init ─────────────────────────────────────────────────────────────────
  initStore: async () => {
    const [selectedModel, reasoningEffort, th, opacity, isAlwaysOnTop, hist, savedToken, savedRefreshToken] =
      await Promise.all([
        window.electronAPI.storeGet('selectedModel', 'gpt-4o'),
        window.electronAPI.storeGet('reasoningEffort', 'medium'),
        window.electronAPI.storeGet('theme', 'dark'),
        window.electronAPI.storeGet('opacity', 1.0),
        window.electronAPI.storeGet('isAlwaysOnTop', false),
        window.electronAPI.storeGet('history', []),
        window.electronAPI.storeGet('token', null),
        window.electronAPI.storeGet('refreshToken', null),
      ])

    set({ selectedModel, reasoningEffort, theme: th, opacity, isAlwaysOnTop, history: hist })
    document.documentElement.className = th
    await window.electronAPI.setOpacity(opacity)
    await window.electronAPI.toggleAlwaysOnTop(isAlwaysOnTop)

    // Register callback so api.ts can persist new tokens after silent refresh
    setOnTokenRefreshed(async (accessToken, refreshToken) => {
      set({ token: accessToken, refreshToken })
      await window.electronAPI.storeSet('token', accessToken)
      await window.electronAPI.storeSet('refreshToken', refreshToken)
    })

    // Restore session — set both tokens so auto-refresh works if access token is expired
    if (savedToken || savedRefreshToken) {
      setToken(savedToken)
      setRefreshToken(savedRefreshToken)
      try {
        // api.ts will auto-refresh if savedToken is expired and savedRefreshToken is valid
        const me = await api.user.me()
        const currentToken = get().token ?? savedToken
        const currentRefresh = get().refreshToken ?? savedRefreshToken
        set({ user: me, token: currentToken, refreshToken: currentRefresh, credits: me.credits, isAuthenticated: true })
      } catch {
        setToken(null)
        setRefreshToken(null)
        await window.electronAPI.storeSet('token', null)
        await window.electronAPI.storeSet('refreshToken', null)
      }
    }
  },
}))
