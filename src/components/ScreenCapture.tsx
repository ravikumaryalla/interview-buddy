import React, { useState, useEffect } from 'react';
import { Camera, Loader2, CheckCircle, RotateCcw, Code2, MessageSquare } from 'lucide-react';
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
    window.electronAPI.onShortcutCapture(() => {
      handleCapture();
    });
    return () => {
      window.electronAPI.removeListeners();
    };
  }, []);

  const handleCapture = async () => {
    setIsSelecting(true);
    setPreviewUrl(null);
    try {
      const result = await window.electronAPI.captureArea();
      if (!result) return; // user cancelled

      setIsProcessing(true);

      // Crop the full screenshot down to the selected region
      const img = new Image();
      img.src = result.image;
      await new Promise<void>((res) => { img.onload = () => res(); });

      const { x, y, w, h } = result.region;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const croppedBase64 = canvas.toDataURL('image/png');

      setPreviewUrl(croppedBase64);
      const text = await extractTextFromImage(croppedBase64);
      setCurrentSolution(null);
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
    <div className="flex flex-col space-y-3 p-4">
      {/* Mode selector */}
      <div className="flex bg-background border border-border rounded-lg p-1 gap-1">
        <button
          onClick={() => setPromptMode('coding')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${promptMode === 'coding' ? 'bg-panel shadow-sm text-accent' : 'text-foreground/60 hover:text-foreground'}`}
        >
          <Code2 size={13} /> Coding Problem
        </button>
        <button
          onClick={() => setPromptMode('custom')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${promptMode === 'custom' ? 'bg-panel shadow-sm text-accent' : 'text-foreground/60 hover:text-foreground'}`}
        >
          <MessageSquare size={13} /> Custom Prompt
        </button>
      </div>

      {/* Custom prompt input */}
      {promptMode === 'custom' && (
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Explain what this code does, or summarize this diagram, or translate this text..."
          rows={3}
          className="w-full p-3 bg-panel/50 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent resize-none placeholder:text-foreground/30 transition-colors"
        />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleCapture}
          disabled={busy}
          className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-panel/30 hover:bg-panel/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed space-y-2 text-foreground/70 hover:text-accent"
        >
        {isSelecting ? (
          <>
            <Loader2 className="animate-spin text-accent" size={32} />
            <span className="font-semibold text-lg">Select Area...</span>
            <span className="text-xs opacity-70">Drag on screen · ESC to cancel</span>
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="animate-spin text-accent" size={32} />
            <span className="font-semibold text-lg">Extracting Text...</span>
          </>
        ) : (
          <>
            <Camera size={32} />
            <span className="font-semibold text-lg">Capture Area</span>
            <span className="text-xs opacity-70 px-2 py-1 bg-foreground/10 rounded-md">Ctrl+Shift+S</span>
          </>
        )}
        </button>
        {hasCaptured && !busy && (
          <button
            onClick={handleReset}
            title="Reset — clear capture and start fresh"
            className="p-3 rounded-xl border border-border bg-panel/30 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500 text-foreground/50 transition-colors self-stretch flex items-center"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="flex flex-col space-y-1">
          <p className="text-xs text-foreground/50 flex items-center">
            <CheckCircle size={12} className="mr-1 text-green-500" /> Area captured
          </p>
          <img
            src={previewUrl}
            alt="Captured area"
            className="w-full rounded-lg border border-border object-contain max-h-[120px]"
          />
        </div>
      )}
    </div>
  );
};
