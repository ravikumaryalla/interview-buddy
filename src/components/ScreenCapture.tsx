import React, { useState, useEffect } from 'react';
import { Camera, Loader2, RotateCcw, Code2, MessageSquare, ScanText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { extractTextFromImage } from '../lib/ocr';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ScreenCapture: React.FC = () => {
  const {
    setCurrentProblem, setCurrentSolution, setCustomResponse, currentProblem,
    promptMode, setPromptMode, customPrompt, setCustomPrompt,
  } = useAppStore();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    window.electronAPI.onShortcutCapture(() => handleCapture());
    return () => window.electronAPI.removeListeners();
  }, []);

  const handleCapture = async () => {
    setIsSelecting(true);
    setPreviewUrl(null);
    try {
      const result = await window.electronAPI.captureArea();
      if (!result) return;
      setIsProcessing(true);
      const img = new Image();
      img.src = result.image;
      await new Promise<void>((res) => { img.onload = () => res(); });
      const { x, y, w, h } = result.region;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, x, y, w, h, 0, 0, w, h);
      const cropped = canvas.toDataURL('image/png');
      setPreviewUrl(cropped);
      const text = await extractTextFromImage(cropped);
      setCurrentSolution(null);
      setCustomResponse(null);
      setCurrentProblem(text.trim());
    } catch (e) {
      console.error(e);
      alert('Failed to capture area');
    } finally {
      setIsSelecting(false);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setCurrentProblem('');
    setCurrentSolution(null);
    setCustomResponse(null);
  };

  const busy = isSelecting || isProcessing;
  const hasCaptured = !!previewUrl || !!currentProblem;

  return (
    <div className="p-3 space-y-2.5">

      {/* Mode tabs */}
      <Tabs value={promptMode} onValueChange={(v) => setPromptMode(v as 'coding' | 'custom')}>
        <TabsList className="w-full">
          <TabsTrigger value="coding" className="flex-1 text-xs gap-1.5">
            <Code2 size={12} /> Coding Problem
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 text-xs gap-1.5">
            <MessageSquare size={12} /> Custom Prompt
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Custom prompt input */}
      {promptMode === 'custom' && (
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Explain this code, summarize this diagram…"
          rows={2}
          className="w-full px-3 py-2 bg-panel border border-[hsl(var(--input-border))] rounded-[var(--radius)] text-xs outline-none focus:border-accent/40 resize-none placeholder:text-foreground/25 transition-all anim-slide-up"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        />
      )}

      {/* Capture row */}
      <div className="flex gap-2">
        <Button
          onClick={handleCapture}
          disabled={busy}
          className={`flex-1 h-9 text-sm ${busy ? 'opacity-70' : ''}`}
          variant={busy ? 'outline' : 'default'}
        >
          {isSelecting ? (
            <><Loader2 size={14} className="animate-spin" /> Selecting…</>
          ) : isProcessing ? (
            <><ScanText size={14} className="animate-pulse" /> Reading text…</>
          ) : (
            <><Camera size={14} /> Capture Area</>
          )}
        </Button>

        {hasCaptured && !busy && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="icon"
            title="Clear capture"
            className="text-foreground/40 hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20"
          >
            <RotateCcw size={13} />
          </Button>
        )}
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="anim-fade-in rounded-[var(--radius)] overflow-hidden border border-border" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <img src={previewUrl} alt="Captured" className="w-full object-contain max-h-[90px]" />
        </div>
      )}

      {!hasCaptured && !busy && (
        <p className="text-center text-[10px] text-foreground/25 pb-0.5">
          Press <kbd className="px-1 py-0.5 bg-foreground/5 border border-border rounded text-[9px] font-mono mx-0.5">Ctrl+Shift+S</kbd> to capture
        </p>
      )}
    </div>
  );
};
