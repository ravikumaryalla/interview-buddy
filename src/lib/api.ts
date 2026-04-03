import type { AISolution, ReasoningEffort } from './ai'

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001'

// ── Token management ─────────────────────────────────────────────────────────
let _token: string | null = null
let _refreshToken: string | null = null
let _onTokenRefreshed: ((accessToken: string, refreshToken: string) => void) | null = null

export function setToken(token: string | null) { _token = token }
export function setRefreshToken(token: string | null) { _refreshToken = token }
export function getToken(): string | null { return _token }
export function setOnTokenRefreshed(cb: (accessToken: string, refreshToken: string) => void) {
  _onTokenRefreshed = cb
}

// ── Error type ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ── Core request ─────────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Auto-refresh on 401 then retry once
  if (res.status === 401 && _refreshToken && path !== '/api/auth/refresh') {
    try {
      const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: _refreshToken }),
      })
      if (refreshRes.ok) {
        const { accessToken, refreshToken: newRefresh } = await refreshRes.json()
        _token = accessToken
        _refreshToken = newRefresh
        _onTokenRefreshed?.(accessToken, newRefresh)
        // Retry original request with new token
        res = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${accessToken}` },
        })
      }
    } catch { /* refresh request failed — fall through to auth:expired */ }
  }

  if (res.status === 401) {
    setToken(null)
    setRefreshToken(null)
    window.dispatchEvent(new CustomEvent('auth:expired'))
  }

  let data: any = {}
  try { data = await res.json() } catch { /* empty body */ }

  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Request failed')
  return data as T
}

// ── API surface ───────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),

    login: (email: string, password: string) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      request<void>('/api/auth/logout', { method: 'POST' }),

    refresh: (refreshToken: string) =>
      request<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
  },

  user: {
    me: () => request<AuthUser & { credits: number }>('/api/user/me'),

    usage: (days = 30) =>
      request<{
        balance: number
        totalConsumed: number
        logs: Array<{
          id: string
          feature: 'SOLVE' | 'CHAT' | 'TRANSCRIBE' | 'REALTIME'
          creditsConsumed: number
          model: string
          tokenCount: number
          responseTimeMs: number
          createdAt: string
        }>
        transactions: Array<{
          id: string
          amount: number
          type: 'USAGE' | 'REFUND' | 'BONUS'
          description: string
          createdAt: string
        }>
      }>(`/api/user/usage?days=${days}`),
  },

  ai: {
    solve: (problem: string, model: string, reasoningEffort?: ReasoningEffort) =>
      request<AISolution>('/api/ai/solve', {
        method: 'POST',
        body: JSON.stringify({ problem, model, reasoningEffort }),
      }),

    chat: (messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, model: string) =>
      request<{ message: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, model }),
      }),

    chatStream: async (
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      model: string,
      onDelta: (delta: string) => void,
    ): Promise<void> => {
      const res = await fetch(`${BASE_URL}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
        },
        body: JSON.stringify({ messages, model }),
      })

      if (!res.ok) {
        let data: any = {}
        try { data = await res.json() } catch { /* empty */ }
        if (res.status === 401) { setToken(null); window.dispatchEvent(new CustomEvent('auth:expired')) }
        throw new ApiError(res.status, data?.error ?? 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') return
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new ApiError(500, parsed.error)
            if (parsed.delta) onDelta(parsed.delta)
          } catch (e) {
            if (e instanceof ApiError) throw e
          }
        }
      }
    },

    transcribe: (audioBlob: Blob) => {
      const form = new FormData()
      form.append('audio', audioBlob, 'audio.webm')
      return request<{ text: string }>('/api/ai/transcribe', { method: 'POST', body: form })
    },

    realtimeToken: () =>
      request<{ clientSecret: string }>('/api/ai/realtime-token', { method: 'POST' }),
  },
}
