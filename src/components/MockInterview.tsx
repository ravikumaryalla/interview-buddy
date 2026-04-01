import React, { useState, useEffect } from 'react';
import { Play, Square, Timer, RefreshCw } from 'lucide-react';

export const MockInterview: React.FC = () => {
  const [durationParams, setDurationParams] = useState<number>(30); // minutes
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
      // Play sound or alert?
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (!isActive && timeLeft === 0) {
        setTimeLeft(durationParams * 60);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durationParams * 60);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newD = parseInt(e.target.value);
      setDurationParams(newD);
      if (!isActive) {
          setTimeLeft(newD * 60);
      }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const isUrgent = timeLeft > 0 && timeLeft <= 300; // < 5 mins

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full space-y-8">
      
      <div className="flex flex-col justify-center items-center">
         <Timer size={48} className={isUrgent ? 'text-red-500 animate-pulse' : 'text-accent'} />
         <h2 className="text-xl font-semibold mt-4">Mock Interview Timer</h2>
         <p className="text-sm text-foreground/60 text-center mt-2 px-4 shadow-sm">
             Simulate real pressure. Setup your time, capture your problem and try to solve it before time runs out.
         </p>
      </div>

      <div className={`text-6xl font-mono tracking-widest px-8 py-6 rounded-2xl glass-panel relative ${isUrgent ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-border shadow-lg shadow-black/5'} transition-all`}>
        <span className={isUrgent ? 'text-red-500' : 'text-foreground'}>
            {minutes.toString().padStart(2, '0')}
        </span>
        <span className={isUrgent ? 'text-red-400' : 'text-foreground/40'}>:</span>
        <span className={isUrgent ? 'text-red-500' : 'text-foreground'}>
            {seconds.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-center space-x-4 w-full justify-center">
        <select 
            value={durationParams} 
            onChange={handleDurationChange}
            disabled={isActive}
            className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground disabled:opacity-50 min-w-[100px] text-center font-medium shadow-sm transition-colors cursor-pointer hover:border-accent"
        >
            <option value={15}>15 mins</option>
            <option value={20}>20 mins</option>
            <option value={30}>30 mins</option>
            <option value={45}>45 mins</option>
            <option value={60}>60 mins</option>
        </select>

        <button 
           onClick={toggleTimer} 
           className={`px-5 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center space-x-2 flex-1 max-w-[140px] justify-center text-white
             ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-accent hover:bg-accent/90'}`}
        >
             {isActive ? <Square size={16} /> : <Play size={16} />}
             <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>

        <button 
           onClick={resetTimer} 
           className="p-3 bg-panel border border-border text-foreground hover:bg-foreground/5 hover:border-foreground/30 rounded-lg shadow-sm transition-colors"
           title="Reset Timer"
        >
             <RefreshCw size={18} className={isActive ? 'opacity-50' : ''} />
        </button>
      </div>

    </div>
  );
};
