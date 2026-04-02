import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { OPENAI_MODELS, isReasoningModel } from '../lib/ai';
import type { ReasoningEffort } from '../lib/ai';
import { Key, Moon, Sun, Save, Settings, Brain, Zap } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { apiKey, setApiKey, selectedModel, setSelectedModel, reasoningEffort, setReasoningEffort, theme, setTheme } = useAppStore();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(keyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const showReasoning = isReasoningModel(selectedModel);

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold flex items-center mb-4">
          <Settings className="mr-2 text-accent" size={20} /> App Settings
        </h2>
      </div>

      {/* API Key */}
      <div className="space-y-3 bg-panel border border-border rounded-xl p-4">
        <label className="flex items-center text-sm font-medium text-foreground/80 cursor-pointer">
          <Key size={16} className="mr-2" /> OpenAI API Key
        </label>
        <div className="flex space-x-2">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none font-mono"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center"
          >
            {saved ? <Save size={16} className="mr-1" /> : 'Save'}
          </button>
        </div>
        <p className="text-xs text-foreground/50">
          Your key is saved locally using electron-store and is never sent anywhere except directly to OpenAI's API.
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-3 bg-panel border border-border rounded-xl p-4">
        <label className="flex items-center text-sm font-medium text-foreground/80">
          <Zap size={16} className="mr-2" /> Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-accent outline-none cursor-pointer"
        >
          {OPENAI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.reasoning ? ' (reasoning)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Reasoning Effort — only for o-series models */}
      {showReasoning && (
        <div className="space-y-3 bg-panel border border-border rounded-xl p-4">
          <label className="flex items-center text-sm font-medium text-foreground/80">
            <Brain size={16} className="mr-2" /> Reasoning Effort
          </label>
          <div className="flex bg-background border border-border rounded-lg p-1">
            {(['low', 'medium', 'high'] as ReasoningEffort[]).map((level) => (
              <button
                key={level}
                onClick={() => setReasoningEffort(level)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  reasoningEffort === level
                    ? 'bg-panel shadow-sm text-accent'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-foreground/50">
            Higher effort uses more tokens but produces better reasoning for complex problems.
          </p>
        </div>
      )}

      {/* Theme */}
      <div className="space-y-3 bg-panel border border-border rounded-xl p-4 flex justify-between items-center">
        <label className="flex items-center text-sm font-medium text-foreground/80">
          {theme === 'dark' ? <Moon size={16} className="mr-2" /> : <Sun size={16} className="mr-2" />}
          App Theme
        </label>

        <div className="flex bg-background border border-border rounded-lg p-1">
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-panel shadow-sm text-accent' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-panel shadow-sm text-accent' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="space-y-2 bg-panel border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3 border-b border-border pb-2 text-foreground/80">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-foreground/60">Capture Screen</div>
          <div className="font-mono text-xs bg-background/50 px-2 py-1 rounded self-center justify-self-end border border-border">Ctrl+Shift+S</div>

          <div className="text-foreground/60">Toggle Visibility</div>
          <div className="font-mono text-xs bg-background/50 px-2 py-1 rounded self-center justify-self-end border border-border">Ctrl+Shift+A</div>

          <div className="text-foreground/60">Increase Opacity</div>
          <div className="font-mono text-xs bg-background/50 px-2 py-1 rounded self-center justify-self-end border border-border">Ctrl+Up</div>

          <div className="text-foreground/60">Decrease Opacity</div>
          <div className="font-mono text-xs bg-background/50 px-2 py-1 rounded self-center justify-self-end border border-border">Ctrl+Down</div>
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        <p className="text-xs text-foreground/40">Interview Prep Assistant v1.0.0</p>
      </div>
    </div>
  );
};
