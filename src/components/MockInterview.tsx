import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Timer } from 'lucide-react';

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

  const reset = () => {
    setRunning(false);
    setTimeLeft(duration * 60);
  };

  const changeDuration = (d: number) => {
    setDuration(d);
    if (!running) setTimeLeft(d * 60);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = timeLeft / (duration * 60);
  const urgent = timeLeft > 0 && timeLeft <= 300;
  const done = timeLeft === 0;

  // Circular progress
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * pct;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 select-none">

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-foreground/60 mb-1">
          <Timer size={16} className={urgent ? 'text-red-400' : 'text-accent'} />
          <span className="text-sm font-medium">Mock Interview Timer</span>
        </div>
        <p className="text-xs text-foreground/35">Simulate real interview pressure</p>
      </div>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="70" cy="70" r={R}
            fill="none"
            stroke={done ? 'rgba(34,197,94,0.6)' : urgent ? 'rgba(239,68,68,0.8)' : 'hsl(var(--accent))'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-mono font-bold tabular-nums tracking-tight
            ${done ? 'text-green-400' : urgent ? 'text-red-400' : 'text-foreground'}`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          {done && <span className="text-[10px] text-green-400 font-medium mt-0.5">Time's up!</span>}
          {running && !done && !urgent && <span className="text-[10px] text-foreground/30 mt-0.5">in progress</span>}
          {urgent && running && <span className="text-[10px] text-red-400/70 mt-0.5 animate-pulse">hurry up!</span>}
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex items-center gap-1.5">
        {DURATIONS.map(d => (
          <button
            key={d}
            onClick={() => changeDuration(d)}
            disabled={running}
            className={`w-10 h-8 rounded-lg text-xs font-medium transition-all
              ${duration === d
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : 'bg-panel border border-border text-foreground/50 hover:text-foreground disabled:opacity-40'}`}
          >
            {d}m
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="p-2.5 rounded-xl bg-panel border border-border text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={toggle}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm
            ${running
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/20'
              : 'bg-accent text-white hover:bg-accent/90 shadow-accent/20'}`}
        >
          {running ? <><Square size={14} /> Pause</> : <><Play size={14} /> {done ? 'Restart' : 'Start'}</>}
        </button>
      </div>

    </div>
  );
};
