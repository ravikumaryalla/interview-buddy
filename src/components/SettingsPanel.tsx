import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { OPENAI_MODELS, isReasoningModel } from '../lib/ai';
import type { ReasoningEffort } from '../lib/ai';
import { Moon, Sun, Zap, Brain, Keyboard, LogOut, Coins, User, Activity, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

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

type UsageData = Awaited<ReturnType<typeof api.user.usage>>;

const FEATURE_LABELS: Record<string, string> = {
  SOLVE: 'Solve',
  CHAT: 'Chat',
  TRANSCRIBE: 'Transcribe',
  REALTIME: 'Realtime',
};

function formatTime(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const SettingsPanel: React.FC = () => {
  const {
    user, credits, logout,
    selectedModel, setSelectedModel,
    reasoningEffort, setReasoningEffort,
    theme, setTheme,
  } = useAppStore();

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'transactions'>('logs');

  const loadUsage = async () => {
    setUsageLoading(true);
    setUsageError(null);
    try {
      const data = await api.user.usage(30);
      setUsageData(data);
    } catch (e: any) {
      setUsageError(e?.message ?? 'Failed to load usage');
    } finally {
      setUsageLoading(false);
    }
  };

  const showReasoning = isReasoningModel(selectedModel);

  return (
    <div className="px-4 pb-8">

      {/* Account */}
      <SectionHeader icon={<User size={10} />} title="Account" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden">
        <Row label="Name"><span className="text-xs text-foreground/70">{user?.name}</span></Row>
        <Row label="Email"><span className="text-xs text-foreground/50 font-mono">{user?.email}</span></Row>
        <Row label={<span className="flex items-center gap-1.5"><Coins size={12} className="text-accent" /> Credits</span>}>
          <span className="text-xs font-semibold text-accent">{credits}</span>
        </Row>
        <Row label="Logout">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </Row>
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

      {/* Credit costs reference */}
      <SectionHeader icon={<Coins size={10} />} title="Credit Costs" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden">
        {[
          ['Solve (standard model)', '5'],
          ['Solve (reasoning model)', '15'],
          ['Chat message', '2'],
          ['Audio transcription', '3'],
          ['Realtime voice session', '10'],
        ].map(([action, cost]) => (
          <Row key={action} label={<span className="text-xs">{action}</span>}>
            <span className="text-xs font-medium text-accent">{cost} credits</span>
          </Row>
        ))}
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

      {/* Usage & Logs */}
      <SectionHeader icon={<Activity size={10} />} title="Usage & Logs" />
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div className="flex gap-1">
            {(['logs', 'transactions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-md text-xs capitalize font-medium transition-all
                  ${activeTab === tab ? 'bg-background text-accent shadow-sm border border-border' : 'text-foreground/40 hover:text-foreground/70'}`}
              >
                {tab === 'logs' ? 'API Calls' : 'Transactions'}
              </button>
            ))}
          </div>
          <button
            onClick={loadUsage}
            disabled={usageLoading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-foreground/50 hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw size={10} className={usageLoading ? 'animate-spin' : ''} />
            {usageData ? 'Refresh' : 'Load'}
          </button>
        </div>

        {usageError && (
          <p className="text-xs text-red-400 px-3 py-2">{usageError}</p>
        )}

        {!usageData && !usageLoading && !usageError && (
          <p className="text-xs text-foreground/30 text-center py-4">Click Load to see your usage history</p>
        )}

        {usageLoading && (
          <p className="text-xs text-foreground/30 text-center py-4">Loading...</p>
        )}

        {usageData && (
          <>
            <div className="flex gap-4 px-3 py-2 bg-background/40 border-b border-border">
              <div className="text-xs">
                <span className="text-foreground/40">Balance </span>
                <span className="font-semibold text-accent">{usageData.balance}</span>
              </div>
              <div className="text-xs">
                <span className="text-foreground/40">Used (30d) </span>
                <span className="font-semibold text-foreground/70">{usageData.totalConsumed}</span>
              </div>
            </div>

            {activeTab === 'logs' && (
              <div className="max-h-48 overflow-y-auto">
                {usageData.logs.length === 0 ? (
                  <p className="text-xs text-foreground/30 text-center py-4">No API calls in the last 30 days</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-panel">
                      <tr className="text-foreground/35 border-b border-border">
                        <th className="text-left px-3 py-1.5 font-medium">Feature</th>
                        <th className="text-left px-2 py-1.5 font-medium">Model</th>
                        <th className="text-right px-2 py-1.5 font-medium">Credits</th>
                        <th className="text-right px-2 py-1.5 font-medium">Time</th>
                        <th className="text-right px-3 py-1.5 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageData.logs.map(log => (
                        <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-background/30">
                          <td className="px-3 py-1.5 text-foreground/70">{FEATURE_LABELS[log.feature] ?? log.feature}</td>
                          <td className="px-2 py-1.5 text-foreground/40 font-mono truncate max-w-[80px]">{log.model}</td>
                          <td className="px-2 py-1.5 text-right text-accent font-medium">{log.creditsConsumed}</td>
                          <td className="px-2 py-1.5 text-right text-foreground/40">{formatTime(log.responseTimeMs)}</td>
                          <td className="px-3 py-1.5 text-right text-foreground/30">{formatDate(log.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="max-h-48 overflow-y-auto">
                {usageData.transactions.length === 0 ? (
                  <p className="text-xs text-foreground/30 text-center py-4">No transactions in the last 30 days</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-panel">
                      <tr className="text-foreground/35 border-b border-border">
                        <th className="text-left px-3 py-1.5 font-medium">Description</th>
                        <th className="text-right px-2 py-1.5 font-medium">Amount</th>
                        <th className="text-right px-3 py-1.5 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageData.transactions.map(tx => (
                        <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-background/30">
                          <td className="px-3 py-1.5 text-foreground/70">{tx.description}</td>
                          <td className={`px-2 py-1.5 text-right font-medium ${tx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </td>
                          <td className="px-3 py-1.5 text-right text-foreground/30">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
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
