import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { OPENAI_MODELS, isReasoningModel } from '../lib/ai';
import type { ReasoningEffort } from '../lib/ai';
import { Key, Moon, Sun, Save, Check, Zap, Brain, Keyboard } from 'lucide-react';

const Row: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
    <div className="text-sm text-foreground/70 shrink-0">{label}</div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-foreground/35 pt-5 pb-1.5 px-1">
    {icon} {title}
  </div>
);

export const SettingsPanel: React.FC = () => {
  const { apiKey, setApiKey, selectedModel, setSelectedModel, reasoningEffort, setReasoningEffort, theme, setTheme } = useAppStore();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(keyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const showReasoning = isReasoningModel(selectedModel);

  return (
    <div className="px-4 pb-8">

      {/* API Key */}
      <SectionHeader icon={<Key size={10} />} title="API" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden">
        <Row label={<span className="font-medium">OpenAI Key</span>}>
          <div className="flex items-center gap-1.5">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="sk-…"
              className="w-36 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-accent/50"
            />
            <button
              onClick={save}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all
                ${saved
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-accent text-white hover:bg-accent/90'}`}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
            </button>
          </div>
        </Row>
        <p className="text-[10px] text-foreground/30 pb-3 leading-relaxed">
          Stored locally via electron-store. Never sent anywhere except OpenAI's API.
        </p>
      </div>

      {/* Model */}
      <SectionHeader icon={<Zap size={10} />} title="Model" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden">
        <Row label="Model">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
          >
            {OPENAI_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}{m.reasoning ? ' ✦' : ''}
              </option>
            ))}
          </select>
        </Row>

        {showReasoning && (
          <Row label={<span className="flex items-center gap-1.5"><Brain size={13} className="text-accent" /> Reasoning</span>}>
            <div className="flex bg-background border border-border rounded-lg p-0.5">
              {(['low', 'medium', 'high'] as ReasoningEffort[]).map(lv => (
                <button
                  key={lv}
                  onClick={() => setReasoningEffort(lv)}
                  className={`px-2.5 py-1 rounded-md text-xs capitalize font-medium transition-all
                    ${reasoningEffort === lv ? 'bg-panel text-accent shadow-sm' : 'text-foreground/40 hover:text-foreground/70'}`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </Row>
        )}
      </div>

      {/* Appearance */}
      <SectionHeader icon={<Sun size={10} />} title="Appearance" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden">
        <Row label="Theme">
          <div className="flex bg-background border border-border rounded-lg p-0.5">
            {(['light', 'dark'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs capitalize font-medium transition-all
                  ${theme === t ? 'bg-panel text-accent shadow-sm' : 'text-foreground/40 hover:text-foreground/70'}`}
              >
                {t === 'dark' ? <Moon size={11} /> : <Sun size={11} />} {t}
              </button>
            ))}
          </div>
        </Row>
      </div>

      {/* Shortcuts */}
      <SectionHeader icon={<Keyboard size={10} />} title="Keyboard Shortcuts" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden">
        {[
          ['Capture Area',      'Ctrl+Shift+S'],
          ['Toggle Visibility', 'Ctrl+Shift+A'],
          ['Increase Opacity',  'Ctrl+↑'],
          ['Decrease Opacity',  'Ctrl+↓'],
        ].map(([action, key]) => (
          <Row key={action} label={action}>
            <kbd className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono text-foreground/60">
              {key}
            </kbd>
          </Row>
        ))}
      </div>

      <p className="text-center text-[10px] text-foreground/20 mt-8">Interview Buddy v1.0.0</p>
    </div>
  );
};
