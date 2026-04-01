import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { FloatingToolbar } from './components/FloatingToolbar';
import { ScreenCapture } from './components/ScreenCapture';
import { ProblemSolver } from './components/ProblemSolver';
import { VoiceInput } from './components/VoiceInput';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { MockInterview } from './components/MockInterview';
import { Wand2, Settings, Clock, Mic, Target } from 'lucide-react';

const App: React.FC = () => {
  const { initStore, apiKey } = useAppStore();
  const [activeTab, setActiveTab] = useState<'solve' | 'voice' | 'history' | 'mock' | 'settings'>('solve');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initStore().then(() => {
      setIsInitializing(false);
    });
  }, [initStore]);

  if (isInitializing) {
    return <div className="h-full w-full bg-background flex text-foreground items-center justify-center font-semibold animate-pulse">Initializing...</div>;
  }

  // Force settings tab if no API key is set
  if (!apiKey && activeTab !== 'settings') {
    setActiveTab('settings');
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden rounded-lg border border-border">
      {/* 1. Floating Window Controls */}
      <FloatingToolbar />
      
      {/* 2. Top Navigation Tabs */}
      <div className="flex bg-panel border-b border-border shadow-sm no-drag-region sticky top-0 z-10 px-1 py-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('solve')}
          className={`flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'solve' ? 'bg-accent/10 border border-accent/20 text-accent shadow-inner' : 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <Wand2 size={16} className="mb-1" /> Solve
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'voice' ? 'bg-accent/10 border border-accent/20 text-accent shadow-inner' : 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <Mic size={16} className="mb-1" /> Voice
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-accent/10 border border-accent/20 text-accent shadow-inner' : 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <Clock size={16} className="mb-1" /> History
        </button>
        <button
          onClick={() => setActiveTab('mock')}
          className={`flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'mock' ? 'bg-accent/10 border border-accent/20 text-accent shadow-inner' : 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <Target size={16} className="mb-1" /> Mock
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'settings' ? 'bg-accent/10 border border-accent/20 text-accent shadow-inner' : 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <Settings size={16} className="mb-1" /> Settings
        </button>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 overflow-hidden relative no-drag-region">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'solve' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="h-[250px] border-b border-border bg-panel/30">
            <ScreenCapture />
          </div>
          <div className="h-[calc(100%-250px)]">
            <ProblemSolver />
          </div>
        </div>

        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'voice' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <VoiceInput />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <HistoryPanel />
        </div>
        
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'mock' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <MockInterview />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-300 bg-background ${activeTab === 'settings' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
