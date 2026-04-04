import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ApiError } from '../lib/api'
import { Sparkles, Loader2, Mail, Lock, User, ShieldCheck, Zap, Brain } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    <div className="h-full w-full flex flex-col items-center justify-center px-5 relative overflow-hidden">

      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-12 -left-8 w-48 h-48 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-8 -right-4 w-40 h-40 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent-2)) 0%, transparent 70%)' }} />
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-5 anim-scale-in">
        <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center glow-accent">
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-sm font-bold gradient-text tracking-tight">Interview Buddy</h1>
          <p className="text-[10px] text-foreground/40 mt-0.5">AI-powered interview preparation</p>
        </div>
      </div>

      <div className="w-full max-w-[280px] anim-slide-up">

        {/* Mode Toggle */}
        <div className="flex justify-center mb-4">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setError('') }}>
            <TabsList className="w-full">
              <TabsTrigger value="login"    className="flex-1 text-xs">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 text-xs">Sign Up</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2.5">

          {mode === 'register' && (
            <div className="relative group">
              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-accent transition-colors z-10" />
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                required
                className="pl-8"
              />
            </div>
          )}

          <div className="relative group">
            <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-accent transition-colors z-10" />
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="pl-8"
            />
          </div>

          <div className="relative group">
            <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-accent transition-colors z-10" />
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Password (min 8 chars)' : 'Password'}
              required
              minLength={mode === 'register' ? 8 : 1}
              className="pl-8"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-[11px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2 anim-fade-in">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-1 h-9">
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </Button>
        </form>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-foreground/25">
          <span className="flex items-center gap-1"><ShieldCheck size={9} /> Secure</span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1"><Zap size={9} /> Fast AI</span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1"><Brain size={9} /> Smart</span>
        </div>

        {mode === 'register' && (
          <p className="text-center text-[10px] text-foreground/30 mt-2 leading-relaxed">
            Start with <span className="text-accent font-medium">20 free credits</span> — no card required.
          </p>
        )}
      </div>
    </div>
  )
}
