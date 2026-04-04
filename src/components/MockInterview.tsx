import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DURATIONS = [15, 20, 30, 45, 60];

export const MockInterview: React.FC = () => {
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) { setRunning(false); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  const toggle = () => {
    if (!running && timeLeft === 0) setTimeLeft(duration * 60);
    setRunning(r => !r);
  };

  const reset = () => { setRunning(false); setTimeLeft(duration * 60); };

  const changeDuration = (d: number) => {
    setDuration(d);
    if (!running) setTimeLeft(d * 60);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = timeLeft / (duration * 60);
  const urgent = timeLeft > 0 && timeLeft <= 300;
  const done = timeLeft === 0;

  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * pct;

  const ringColor = done ? 'rgba(34,197,94,0.7)' : urgent ? 'rgba(239,68,68,0.85)' : 'url(#timerGradient)';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-6 select-none">

      {/* Header */}
      <div className="text-center anim-fade-in">
        <div className="flex items-center justify-center gap-2 text-foreground/65 mb-1">
          <Timer size={15} className={urgent ? 'text-red-400' : 'text-accent'} />
          <span className="text-sm font-semibold">Mock Interview Timer</span>
        </div>
        <p className="text-xs text-foreground/30">Simulate real interview pressure</p>
      </div>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center anim-scale-in">
        <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${running && !done ? 'opacity-100' : 'opacity-0'}`}
          style={{ boxShadow: urgent ? '0 0 24px rgba(239,68,68,0.2)' : '0 0 24px var(--accent-glow)' }} />
        <svg width="148" height="148" className="-rotate-90">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--accent-2))" />
            </linearGradient>
          </defs>
          <circle cx="74" cy="74" r={R} fill="none" stroke="var(--border)" strokeWidth="7" />
          <circle
            cx="74" cy="74" r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            className="transition-all duration-1000"
            style={{ filter: running ? 'drop-shadow(0 0 4px hsl(var(--accent)/0.4))' : 'none' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-mono font-bold tabular-nums tracking-tight
            ${done ? 'text-green-400' : urgent ? 'text-red-400' : 'text-foreground'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          {done    && <span className="text-[10px] text-green-400 font-semibold mt-0.5">Time's up!</span>}
          {running && !done && !urgent && <span className="text-[10px] text-foreground/30 mt-0.5">in progress</span>}
          {urgent  && running && <span className="text-[10px] text-red-400/70 mt-0.5 animate-pulse font-medium">hurry up!</span>}
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex items-center gap-1.5">
        {DURATIONS.map(d => (
          <Button
            key={d}
            onClick={() => changeDuration(d)}
            disabled={running}
            variant={duration === d ? 'default' : 'outline'}
            size="sm"
            className={`w-10 h-8 px-0 text-xs ${duration === d ? '' : 'text-foreground/50'}`}
          >
            {d}m
          </Button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5">
        <Button variant="outline" size="icon" onClick={reset} title="Reset" className="h-9 w-9">
          <RotateCcw size={14} />
        </Button>
        <Button
          onClick={toggle}
          variant={running ? 'secondary' : 'default'}
          className={`px-7 h-9 ${running ? 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15' : ''}`}
        >
          {running ? <><Square size={13} /> Pause</> : <><Play size={13} /> {done ? 'Restart' : 'Start'}</>}
        </Button>
      </div>

      {done && (
        <Badge variant="success" className="anim-scale-in text-xs px-3 py-1">
          Interview complete!
        </Badge>
      )}
    </div>
  );
};
