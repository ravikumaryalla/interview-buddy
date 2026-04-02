import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { FloatingToolbar } from './components/FloatingToolbar';
import { ScreenCapture } from './components/ScreenCapture';
import { ProblemSolver } from './components/ProblemSolver';
import { VoiceInput } from './components/VoiceInput';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { MockInterview } from './components/MockInterview';
import { Sparkles, Settings, History, Mic, Timer } from 'lucide-react';

type Tab = 'solve' | 'voice' | 'history' | 'mock' | 'settings';

const TABS: { id: Tab; label: string; Icon: React.FC<any> }[] = [
  { id: 'solve',    label: 'Solve',    Icon: Sparkles },
  { id: 'voice',    label: 'Chat',     Icon: Mic },
  { id: 'history',  label: 'History',  Icon: History },
  { id: 'mock',     label: 'Mock',     Icon: Timer },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

const App: React.FC = () => {
  const { initStore, apiKey } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('solve');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStore().then(() => setReady(true));
  }, [initStore]);

  useEffect(() => {
    if (ready && !apiKey) setActiveTab('settings');
  }, [ready, apiKey]);

  if (!ready) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-foreground/40">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden rounded-xl border border-border shadow-2xl">

      {/* Title bar */}
      <FloatingToolbar />

      {/* Tab bar */}
      <div className="flex bg-panel/60 border-b border-border no-drag-region shrink-0">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors
                ${active ? 'text-accent' : 'text-foreground/40 hover:text-foreground/70'}`}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {label}
              {active && (
                <span className="absolute bottom-0 inset-x-3 h-0.5 bg-accent rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative no-drag-region">

        {/* Solve tab — ScreenCapture (auto) + ProblemSolver (flex-1) */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-200
          ${activeTab === 'solve' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="shrink-0 border-b border-border">
            <ScreenCapture />
          </div>
          <div className="flex-1 overflow-hidden">
            <ProblemSolver />
          </div>
        </div>

        {/* Chat/Voice tab */}
        <div className={`absolute inset-0 transition-opacity duration-200
          ${activeTab === 'voice' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <VoiceInput />
        </div>

        {/* History tab */}
        <div className={`absolute inset-0 transition-opacity duration-200
          ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <HistoryPanel />
        </div>

        {/* Mock tab */}
        <div className={`absolute inset-0 transition-opacity duration-200
          ${activeTab === 'mock' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <MockInterview />
        </div>

        {/* Settings tab */}
        <div className={`absolute inset-0 overflow-y-auto bg-background transition-opacity duration-200
          ${activeTab === 'settings' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SettingsPanel />
        </div>

      </div>
    </div>
  );
};

export default App;
