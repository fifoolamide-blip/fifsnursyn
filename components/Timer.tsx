
import React, { useEffect, useState } from 'react';
import { Icons } from '../constants';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  onTick?: (secondsRemaining: number) => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp, onTick }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = prev - 1;
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp, onTick]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl ring-1 ring-white/10">
      <div className={`${seconds < 300 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
        <Icons.Clock />
      </div>
      <span className="font-mono font-black text-xl tracking-tight">{formatTime(seconds)}</span>
    </div>
  );
};

export default Timer;
