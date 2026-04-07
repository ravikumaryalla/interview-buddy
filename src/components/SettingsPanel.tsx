import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { OPENAI_MODELS, isReasoningModel } from '../lib/ai';
import type { ReasoningEffort } from '../lib/ai';
import { Moon, Sun, Zap, Brain, Keyboard, LogOut, Coins, User, Activity, RefreshCw, ShoppingCart } from 'lucide-react';
import { api } from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { BuyCreditsDialog } from './BuyCreditsDialog';

const Row: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
    <div className="text-sm text-foreground/65 shrink-0">{label}</div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/30 pt-5 pb-1.5 px-1">
    <span className="text-accent/60">{icon}</span> {title}
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
    opacity, setOpacity,
  } = useAppStore();

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'transactions'>('logs');
  const [showBuyCredits, setShowBuyCredits] = useState(false);

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
    <>
    {showBuyCredits && <BuyCreditsDialog onClose={() => setShowBuyCredits(false)} />}
    <div className="px-4 pb-8">

      {/* Account */}
      <SectionHeader icon={<User size={10} />} title="Account" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Row label="Name">
          <span className="text-xs text-foreground/70 font-medium">{user?.name}</span>
        </Row>
        <Row label="Email">
          <span className="text-xs text-foreground/45 font-mono">{user?.email}</span>
        </Row>
        <Row label={<span className="flex items-center gap-1.5"><Coins size={12} className="text-accent" /> Credits</span>}>
          <div className="flex items-center gap-2">
            <Badge variant="accent">
              <Coins size={9} /> {credits}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBuyCredits(true)}
              className="h-6 text-[11px] gap-1 px-2 border-accent/40 text-accent hover:bg-accent/10 hover:border-accent"
            >
              <ShoppingCart size={9} /> Buy
            </Button>
          </div>
        </Row>
        <Row label="Session">
          <Button variant="destructive" size="sm" onClick={logout} className="h-7 text-xs gap-1.5">
            <LogOut size={11} /> Sign Out
          </Button>
        </Row>
      </div>

      {/* Model */}
      <SectionHeader icon={<Zap size={10} />} title="Model" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Row label="AI Model">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select model" className="text-foreground" />
            </SelectTrigger>
            <SelectContent>
              {OPENAI_MODELS.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-1.5">
                    {m.name}
                    {m.reasoning && <span className="text-[9px] text-accent font-bold bg-accent/10 px-1 py-0.5 rounded">✦ reasoning</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        {showReasoning && (
          <Row label={<span className="flex items-center gap-1.5"><Brain size={12} className="text-accent" /> Reasoning</span>}>
            <Tabs value={reasoningEffort} onValueChange={(v) => setReasoningEffort(v as ReasoningEffort)}>
              <TabsList className="h-7">
                {(['low', 'medium', 'high'] as ReasoningEffort[]).map(lv => (
                  <TabsTrigger key={lv} value={lv} className="h-6 px-2.5 text-[11px] capitalize">
                    {lv}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </Row>
        )}
      </div>

      {/* Credit costs */}
      <SectionHeader icon={<Coins size={10} />} title="Credit Costs" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[
          ['Solve (standard model)', '5'],
          ['Solve (reasoning model)', '15'],
          ['Chat message', '2'],
          ['Audio transcription', '3'],
          ['Realtime voice session', '10'],
        ].map(([action, cost]) => (
          <Row key={action} label={<span className="text-xs">{action}</span>}>
            <Badge variant="accent"><Coins size={9} /> {cost}</Badge>
          </Row>
        ))}
      </div>

      {/* Appearance */}
      <SectionHeader icon={<Sun size={10} />} title="Appearance" />
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Row label="Theme">
          <Tabs value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark')}>
            <TabsList className="h-7">
              <TabsTrigger value="light" className="h-6 px-3 text-[11px] gap-1"><Sun size={10} /> Light</TabsTrigger>
              <TabsTrigger value="dark"  className="h-6 px-3 text-[11px] gap-1"><Moon size={10} /> Dark</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>
        <Row label="Window Opacity">
          <div className="w-28">
            <Slider
              min={0.2} max={1} step={0.05}
              value={[opacity]}
              onValueChange={([v]) => setOpacity(v)}
            />
          </div>
        </Row>
      </div>

      {/* Usage & Logs */}
      <SectionHeader icon={<Activity size={10} />} title="Usage & Logs" />
      <div className="bg-panel border border-border rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'logs' | 'transactions')}>
            <TabsList className="h-7">
              <TabsTrigger value="logs"         className="h-6 px-2.5 text-[11px]">API Calls</TabsTrigger>
              <TabsTrigger value="transactions" className="h-6 px-2.5 text-[11px]">Transactions</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadUsage}
            disabled={usageLoading}
            className="h-7 text-[11px] gap-1 text-foreground/45 hover:text-accent"
          >
            <RefreshCw size={10} className={usageLoading ? 'animate-spin' : ''} />
            {usageData ? 'Refresh' : 'Load'}
          </Button>
        </div>

        {usageError && (
          <p className="text-xs text-red-400 px-3 py-2">{usageError}</p>
        )}

        {!usageData && !usageLoading && !usageError && (
          <p className="text-xs text-foreground/28 text-center py-5">Click Load to see your usage history</p>
        )}

        {usageLoading && (
          <div className="flex items-center justify-center gap-2 py-5">
            <div className="w-3 h-3 rounded-full border border-accent border-t-transparent animate-spin" />
            <span className="text-xs text-foreground/30">Loading…</span>
          </div>
        )}

        {usageData && (
          <>
            <div className="flex gap-4 px-3 py-2 bg-background/50 border-b border-border">
              <div className="text-xs">
                <span className="text-foreground/35">Balance </span>
                <span className="font-bold text-accent">{usageData.balance}</span>
              </div>
              <div className="text-xs">
                <span className="text-foreground/35">Used (30d) </span>
                <span className="font-semibold text-foreground/65">{usageData.totalConsumed}</span>
              </div>
            </div>

            {activeTab === 'logs' && (
              <div className="max-h-48 overflow-y-auto">
                {usageData.logs.length === 0 ? (
                  <p className="text-xs text-foreground/28 text-center py-4">No API calls in the last 30 days</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-panel">
                      <tr className="text-foreground/30 border-b border-border">
                        <th className="text-left px-3 py-1.5 font-semibold">Feature</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Model</th>
                        <th className="text-right px-2 py-1.5 font-semibold">Credits</th>
                        <th className="text-right px-2 py-1.5 font-semibold">Time</th>
                        <th className="text-right px-3 py-1.5 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageData.logs.map(log => (
                        <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02] transition-colors">
                          <td className="px-3 py-1.5 text-foreground/65">{FEATURE_LABELS[log.feature] ?? log.feature}</td>
                          <td className="px-2 py-1.5 text-foreground/35 font-mono truncate max-w-[80px]">{log.model}</td>
                          <td className="px-2 py-1.5 text-right"><Badge variant="accent" className="ml-auto">{log.creditsConsumed}</Badge></td>
                          <td className="px-2 py-1.5 text-right text-foreground/35">{formatTime(log.responseTimeMs)}</td>
                          <td className="px-3 py-1.5 text-right text-foreground/28">{formatDate(log.createdAt)}</td>
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
                  <p className="text-xs text-foreground/28 text-center py-4">No transactions in the last 30 days</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-panel">
                      <tr className="text-foreground/30 border-b border-border">
                        <th className="text-left px-3 py-1.5 font-semibold">Description</th>
                        <th className="text-right px-2 py-1.5 font-semibold">Amount</th>
                        <th className="text-right px-3 py-1.5 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageData.transactions.map(tx => (
                        <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02] transition-colors">
                          <td className="px-3 py-1.5 text-foreground/65">{tx.description}</td>
                          <td className="px-2 py-1.5 text-right">
                            <Badge variant={tx.amount < 0 ? 'destructive' : 'success'}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </Badge>
                          </td>
                          <td className="px-3 py-1.5 text-right text-foreground/28">{formatDate(tx.createdAt)}</td>
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
      <div className="bg-panel border border-border rounded-xl px-3 overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[
          ['Capture Area',      'Ctrl+Shift+S'],
          ['Toggle Visibility', 'Ctrl+Shift+A'],
          ['Increase Opacity',  'Ctrl+↑'],
          ['Decrease Opacity',  'Ctrl+↓'],
        ].map(([action, key]) => (
          <Row key={action} label={action}>
            <kbd className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono text-foreground/55">
              {key}
            </kbd>
          </Row>
        ))}
      </div>

      <p className="text-center text-[10px] text-foreground/18 mt-8">Interview Buddy v1.0.0</p>
    </div>
    </>
  );
};
