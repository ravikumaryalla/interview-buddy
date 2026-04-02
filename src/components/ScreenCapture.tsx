import React, { useState, useEffect } from 'react';
import { Camera, Loader2, RotateCcw, Code2, MessageSquare, ScanText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { extractTextFromImage } from '../lib/ocr';

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
      <div className="flex bg-background border border-border rounded-lg p-0.5">
        <button
          onClick={() => setPromptMode('coding')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all
            ${promptMode === 'coding' ? 'bg-panel text-accent shadow-sm' : 'text-foreground/50 hover:text-foreground/80'}`}
        >
          <Code2 size={12} /> Coding Problem
        </button>
        <button
          onClick={() => setPromptMode('custom')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all
            ${promptMode === 'custom' ? 'bg-panel text-accent shadow-sm' : 'text-foreground/50 hover:text-foreground/80'}`}
        >
          <MessageSquare size={12} /> Custom Prompt
        </button>
      </div>

      {/* Custom prompt input */}
      {promptMode === 'custom' && (
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Explain this code, summarize this diagram, translate this text…"
          rows={2}
          className="w-full px-3 py-2 bg-panel border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-accent/50 resize-none placeholder:text-foreground/25 transition-colors"
        />
      )}

      {/* Capture row */}
      <div className="flex gap-2">
        <button
          onClick={handleCapture}
          disabled={busy}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
            ${busy
              ? 'bg-accent/10 text-accent cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20 active:scale-[0.98]'}`}
        >
          {isSelecting ? (
            <><Loader2 size={15} className="animate-spin" /> Selecting…</>
          ) : isProcessing ? (
            <><ScanText size={15} className="animate-pulse" /> Reading text…</>
          ) : (
            <><Camera size={15} /> Capture Area</>
          )}
        </button>

        {hasCaptured && !busy && (
          <button
            onClick={handleReset}
            title="Clear capture"
            className="px-3 py-2.5 rounded-lg border border-border text-foreground/40 hover:text-red-400 hover:bg-red-500/8 hover:border-red-500/20 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="anim-fade-in rounded-lg overflow-hidden border border-border">
          <img
            src={previewUrl}
            alt="Captured"
            className="w-full object-contain max-h-[90px]"
          />
        </div>
      )}

      {!hasCaptured && !busy && (
        <p className="text-center text-[10px] text-foreground/25 pb-0.5">
          Ctrl+Shift+S to capture
        </p>
      )}
    </div>
  );
};
