import React from 'react';

interface SeekbarProps {
  currentTime: number;
  duration: number;
  onChange: (value: number) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const Seekbar: React.FC<SeekbarProps> = ({ currentTime, duration, onChange }) => {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative w-full h-8 flex items-center group">
        {/* Track Background */}
        <div className="absolute w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
           {/* Progress */}
           <div 
             className="h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
             style={{ width: `${percent}%` }}
           />
        </div>
        
        {/* Interactive Slider */}
        <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={currentTime} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {/* Thumb (Visual Only - follows percent) */}
        <div 
            className="absolute h-5 w-5 bg-white rounded-full shadow-lg pointer-events-none transition-transform duration-100 ease-out"
            style={{ 
                left: `${percent}%`, 
                transform: `translateX(-50%) scale(${percent > 0 ? 1 : 0})` 
            }}
        />
      </div>
      
      <div className="flex justify-between text-xs font-medium text-white/50 px-1 font-mono tracking-wider">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default Seekbar;