import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ApiError } from '../lib/api'
import { Sparkles, Loader2, Mail, Lock, User } from 'lucide-react'

type Mode = 'login' | 'register'

export const AuthScreen: React.FC = () => {
  const { login, register } = useAppStore()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return }
        await register(name, email, password)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full w-full bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
          <Sparkles size={16} className="text-accent" />
        </div>
        <span className="text-sm font-semibold text-foreground">Interview Buddy</span>
      </div>

      <div className="w-full max-w-xs">
        {/* Toggle */}
        <div className="flex bg-panel border border-border rounded-xl p-0.5 mb-5">
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-all
                ${mode === m ? 'bg-accent text-white shadow-sm' : 'text-foreground/50 hover:text-foreground/80'}`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {/* Name — only on register */}
          {mode === 'register' && (
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full bg-panel border border-border rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-accent/50 text-foreground placeholder:text-foreground/30"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-panel border border-border rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-accent/50 text-foreground placeholder:text-foreground/30"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Password (min 8 chars)' : 'Password'}
              required
              minLength={mode === 'register' ? 8 : 1}
              className="w-full bg-panel border border-border rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-accent/50 text-foreground placeholder:text-foreground/30"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-semibold transition-all mt-1"
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-center text-[10px] text-foreground/30 mt-4 leading-relaxed">
            You'll get 20 free credits to start.
          </p>
        )}
      </div>
    </div>
  )
}
