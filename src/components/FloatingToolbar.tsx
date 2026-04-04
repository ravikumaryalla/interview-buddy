import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Minus, Pin, PinOff, X, Sun, Moon, SlidersHorizontal } from 'lucide-react';

export const FloatingToolbar: React.FC<{ hideControls?: boolean }> = ({ hideControls }) => {
  const { opacity, isAlwaysOnTop, setOpacity, setAlwaysOnTop, theme, setTheme } = useAppStore();

  return (
    <div className="drag-region flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0"
      style={{ background: 'var(--panel)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

      {/* Left: branding */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full gradient-bg opacity-90" />
        <span className="text-[11px] font-semibold text-foreground/55 tracking-wide select-none">
          Interview Buddy
        </span>
      </div>

      {/* Right: controls */}
      <div className="no-drag-region flex items-center gap-0.5">
        {!hideControls && (
          <>
            {/* Opacity slider */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-foreground/5 transition-colors group">
              <SlidersHorizontal size={11} className="text-foreground/25 group-hover:text-foreground/55 shrink-0 transition-colors" />
              <input
                type="range" min="0.2" max="1" step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                title="Window opacity (Ctrl+↑↓)"
                className="w-14 h-0.5 accent-[hsl(var(--accent))] cursor-pointer"
              />
            </div>

            <div className="w-px h-3 bg-border mx-1" />

            <button
              onClick={() => setAlwaysOnTop(!isAlwaysOnTop)}
              title={isAlwaysOnTop ? 'Always on top: ON' : 'Always on top: OFF'}
              className={`p-1.5 rounded-md transition-all
                ${isAlwaysOnTop
                  ? 'text-accent bg-accent/10 shadow-[0_0_8px_hsl(var(--accent)/0.2)]'
                  : 'text-foreground/35 hover:text-foreground/65 hover:bg-foreground/5'}`}
            >
              {isAlwaysOnTop ? <Pin size={12} className="rotate-45" /> : <PinOff size={12} />}
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
              className="p-1.5 rounded-md text-foreground/35 hover:text-foreground/65 hover:bg-foreground/5 transition-colors"
            >
              {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            </button>

            <div className="w-px h-3 bg-border mx-1" />
          </>
        )}

        <button
          onClick={() => window.electronAPI.minimizeApp()}
          className="p-1.5 rounded-md text-foreground/35 hover:text-foreground/65 hover:bg-foreground/5 transition-colors"
          title="Minimize"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => window.electronAPI.closeApp()}
          className="p-1.5 rounded-md text-foreground/35 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Close"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
