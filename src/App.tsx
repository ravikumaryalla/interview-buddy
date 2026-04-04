import React, { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { FloatingToolbar } from './components/FloatingToolbar'
import { ScreenCapture } from './components/ScreenCapture'
import { ProblemSolver } from './components/ProblemSolver'
import { VoiceInput } from './components/VoiceInput'
import { SettingsPanel } from './components/SettingsPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { MockInterview } from './components/MockInterview'
import { AuthScreen } from './components/AuthScreen'
import { Sparkles, Settings, History, Mic, Timer, Coins } from 'lucide-react'

type Tab = 'solve' | 'voice' | 'history' | 'mock' | 'settings'

const TABS: { id: Tab; label: string; Icon: React.FC<any> }[] = [
  { id: 'solve',    label: 'Solve',    Icon: Sparkles },
  { id: 'voice',    label: 'Chat',     Icon: Mic },
  { id: 'history',  label: 'History',  Icon: History },
  { id: 'mock',     label: 'Mock',     Icon: Timer },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

const App: React.FC = () => {
  const { initStore, isAuthenticated, credits, logout } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('solve')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initStore().then(() => setReady(true))
  }, [initStore])

  useEffect(() => {
    const onExpired = () => logout()
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [logout])

  if (!ready) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 anim-fade-in">
          <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center glow-accent">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[0, 0.15, 0.3].map((d, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce"
                  style={{ animationDelay: `${d}s`, animationDuration: '0.9s' }}
                />
              ))}
            </div>
            <span className="text-[11px] text-foreground/30 font-medium">Loading Interview Buddy…</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden rounded-xl border border-border"
        style={{ boxShadow: 'var(--shadow-lg)' }}>
        <FloatingToolbar hideControls />
        <div className="flex-1 overflow-hidden">
          <AuthScreen />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden rounded-xl border border-border"
      style={{ boxShadow: 'var(--shadow-lg)' }}>

      {/* Title bar */}
      <FloatingToolbar />

      {/* Tab bar + credits */}
      <div className="flex items-center bg-panel/80 border-b border-border no-drag-region shrink-0 backdrop-blur-sm">
        <div className="flex flex-1">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-all duration-200
                  ${active
                    ? 'text-accent'
                    : 'text-foreground/40 hover:text-foreground/65 hover:bg-foreground/[0.03]'}`}
              >
                {active && (
                  <span className="absolute inset-0 bg-accent/[0.06] pointer-events-none" />
                )}
                <Icon
                  size={14}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'drop-shadow-[0_0_5px_hsl(var(--accent)/0.5)]' : ''}
                />
                <span className="relative z-10">{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--accent)), transparent)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Credits badge */}
        <div className="flex items-center gap-1 pr-2.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/8 border border-accent/15">
            <Coins size={10} className="text-accent" />
            <span className="text-[10px] font-semibold text-accent/80">{credits}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative no-drag-region">

        <div className={`absolute inset-0 flex flex-col transition-opacity duration-200
          ${activeTab === 'solve' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="shrink-0 border-b border-border"><ScreenCapture /></div>
          <div className="flex-1 overflow-hidden"><ProblemSolver /></div>
        </div>

        <div className={`absolute inset-0 transition-opacity duration-200
          ${activeTab === 'voice' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <VoiceInput />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-200
          ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <HistoryPanel />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-200
          ${activeTab === 'mock' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <MockInterview />
        </div>

        <div className={`absolute inset-0 overflow-y-auto bg-background transition-opacity duration-200
          ${activeTab === 'settings' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SettingsPanel />
        </div>

      </div>
    </div>
  )
}

export default App
