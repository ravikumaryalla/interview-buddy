import React, { useRef, useState, useEffect } from 'react';
import { Camera, Crop, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { extractTextFromImage } from '../lib/ocr';

export const ScreenCapture: React.FC = () => {
  const { setCurrentProblem, setCurrentSolution } = useAppStore();
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Crop state
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
    // Listen to shortcut
    window.electronAPI.onShortcutCapture(() => {
      handleCapture();
    });
    return () => {
      window.electronAPI.removeListeners();
    };
  }, []);

  const handleCapture = async () => {
    setIsCapturing(true);
    setScreenshotUrl(null);
    setCropBox(null);
    try {
      const base64 = await window.electronAPI.captureScreen();
      setScreenshotUrl(base64);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setCropBox({ x, y, w: 0, h: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDragging || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    setCropBox({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      w: Math.abs(currentX - startPos.x),
      h: Math.abs(currentY - startPos.y)
    });
  };

  const handleMouseUp = async () => {
    setIsDragging(false);
    if (!cropBox || cropBox.w < 10 || cropBox.h < 10) {
      setCropBox(null); // click without drag
      return;
    }
    
    await processCrop();
  };

  const processCrop = async () => {
    if (!cropBox || !imgRef.current || !screenshotUrl) return;
    
    setIsProcessing(true);
    try {
      // Scale coordinates from rendered image size to natural image size
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      const canvas = document.createElement('canvas');
      canvas.width = cropBox.w * scaleX;
      canvas.height = cropBox.h * scaleY;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          cropBox.x * scaleX, 
          cropBox.y * scaleY, 
          cropBox.w * scaleX, 
          cropBox.h * scaleY,
          0, 0,
          canvas.width, canvas.height
        );
        const croppedBase64 = canvas.toDataURL('image/png');
        const text = await extractTextFromImage(croppedBase64);
        setCurrentSolution(null);
        setCurrentProblem(text.trim());
        setScreenshotUrl(null); // clear after success
      }
    } catch (e) {
      console.error(e);
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-panel/30 hover:bg-panel/50 transition-colors">
        <button
          onClick={handleCapture}
          disabled={isCapturing || isProcessing}
          className="flex flex-col items-center justify-center space-y-2 text-foreground/70 hover:text-accent transition-colors disabled:opacity-50"
        >
          {isCapturing ? <Loader2 className="animate-spin text-accent" size={32} /> : <Camera size={32} />}
          <span className="font-semibold text-lg">{isCapturing ? 'Capturing...' : 'Capture Screen'}</span>
          <span className="text-xs opacity-70 px-2 py-1 bg-foreground/10 rounded-md">Ctrl+Shift+S</span>
        </button>
      </div>

      {screenshotUrl && (
        <div className="flex flex-col space-y-2 relative">
          <p className="text-sm text-foreground/60 flex items-center">
            <Crop size={14} className="mr-1" />
            Drag to crop the problem area
          </p>
          <div className="relative border border-border rounded-lg overflow-hidden bg-black/20">
            <img
              ref={imgRef}
              src={screenshotUrl}
              alt="Screenshot"
              className="w-full object-contain touch-none select-none cursor-crosshair max-h-[400px]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => isDragging && handleMouseUp()}
              draggable={false}
            />
            {cropBox && (
              <div 
                className="absolute border-2 border-accent bg-accent/20 pointer-events-none transition-none"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.w,
                  height: cropBox.h
                }}
              />
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 className="animate-spin text-accent mb-2" size={32} />
                <span className="font-medium">Extracting Text (OCR)...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
