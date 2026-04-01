import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Minus, Pin, PinOff, X, Palette, SlidersHorizontal } from 'lucide-react';

export const FloatingToolbar: React.FC = () => {
  const { opacity, isAlwaysOnTop, setOpacity, setAlwaysOnTop, theme, setTheme } = useAppStore();

  const togglePin = () => setAlwaysOnTop(!isAlwaysOnTop);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const closeWindow = () => window.electronAPI.closeApp();
  const minimizeWindow = () => window.electronAPI.minimizeApp();

  return (
    <div className="drag-region flex items-center justify-between p-2 glass-panel border-b border-border shadow-sm">
      <div className="flex items-center space-x-2 text-sm font-semibold tracking-tight text-foreground/80 pl-2">
        <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></div>
        <span>Interview Buddy</span>
      </div>

      <div className="no-drag-region flex items-center space-x-1">
        { /* Opacity Slider wrapper to hide it slightly unless hovered, or just show it cleanly */ }
        <div className="group flex items-center bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md px-2 py-1 transition-colors">
          <SlidersHorizontal size={14} className="mr-2 text-foreground/60 group-hover:text-foreground" />
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
            title="Opacity (Ctrl + Up/Down)"
          />
        </div>

        <button onClick={togglePin} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title={`Always on top (${isAlwaysOnTop ? 'On' : 'Off'})`}>
          {isAlwaysOnTop ? <Pin size={16} className="text-accent transform rotate-45" /> : <PinOff size={16} className="text-foreground/60" />}
        </button>

        <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="Toggle Theme">
          <Palette size={16} className="text-foreground/60" />
        </button>

        <div className="w-px h-4 bg-border mx-1"></div>

        <button onClick={minimizeWindow} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <Minus size={16} className="text-foreground/60" />
        </button>
        <button onClick={closeWindow} className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-500 transition-colors">
          <X size={16} className="text-foreground/60" />
        </button>
      </div>
    </div>
  );
};
