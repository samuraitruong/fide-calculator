import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

interface LiveRatingBoxProps {
  currentRatingChange: number;
  currentRating: number;
}

export default function LiveRatingBox({ currentRatingChange, currentRating }: LiveRatingBoxProps) {
  const liveRating = Math.round(currentRating + currentRatingChange);
  
  const isPositive = currentRatingChange > 0;
  const isNegative = currentRatingChange < 0;
  
  const badgeConfig = isPositive 
    ? { color: 'bg-green-100 text-green-700', textColor: 'text-green-600', icon: <FaArrowUp className="w-3 h-3" />, label: `+${currentRatingChange}` }
    : isNegative
    ? { color: 'bg-red-100 text-red-700', textColor: 'text-red-600', icon: <FaArrowDown className="w-3 h-3" />, label: `${currentRatingChange}` }
    : { color: 'bg-gray-100 text-gray-900', textColor: 'text-gray-900', icon: <FaMinus className="w-3 h-3" />, label: '0' };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden h-auto md:h-full flex flex-col items-center justify-center p-8 w-full transition-all hover:shadow-2xl hover:border-emerald-100 group">
      {/* Decorative background element */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">
          Live Rating
        </p>
        
        <div className="relative mb-4">
          <p className={`text-6xl md:text-7xl font-black ${badgeConfig.textColor} tracking-tighter transition-transform group-hover:scale-105 duration-300`}>
            {liveRating}
          </p>
          {/* Subtle glow effect */}
          <div className="absolute -inset-4 bg-emerald-400/5 blur-2xl rounded-full -z-10" />
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm ${badgeConfig.color} shadow-sm border border-white/50`}>
          {badgeConfig.icon}
          <span>{badgeConfig.label}</span>
        </div>
      </div>
      
      {/* Sidebar indicator moved to bottom as subtle bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-blue-500'}`} />
    </div>
  );
}
